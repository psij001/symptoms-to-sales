import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies, headers } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

export async function GET(request: NextRequest) {
  // Dynamically determine the redirect URI based on the current host
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:5000'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const GOOGLE_REDIRECT_URI = `${protocol}://${host}/api/auth/google/callback`
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    )
  }

  const state = crypto.randomBytes(16).toString('hex')
  
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  
  return NextResponse.redirect(authUrl)
}
