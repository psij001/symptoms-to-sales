import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'
import { setSession } from '@/lib/auth/session'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Dynamically determine URLs based on the current host
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:5000'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const baseUrl = `${protocol}://${host}`
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_auth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_callback`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`)
  }

  cookieStore.delete('oauth_state')

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_not_configured`)
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`)
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', await userInfoResponse.text())
      return NextResponse.redirect(`${baseUrl}/login?error=user_info_failed`)
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json()

    let [existingUser] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.googleId, googleUser.sub),
          eq(users.email, googleUser.email)
        )
      )
      .limit(1)

    if (existingUser) {
      if (!existingUser.googleId) {
        await db
          .update(users)
          .set({
            googleId: googleUser.sub,
            authProvider: existingUser.authProvider === 'email' ? 'email' : 'google',
            profileImageUrl: googleUser.picture || existingUser.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          googleId: googleUser.sub,
          authProvider: 'google',
          firstName: googleUser.given_name || null,
          lastName: googleUser.family_name || null,
          profileImageUrl: googleUser.picture || null,
        })
        .returning()
      
      existingUser = newUser
    }

    await setSession(existingUser.id, existingUser.email)

    return NextResponse.redirect(`${baseUrl}/dashboard`)
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`)
  }
}
