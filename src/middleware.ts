import { NextResponse, type NextRequest } from 'next/server'
import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

interface SessionData {
  user?: {
    claims: {
      sub: string;
      email?: string;
      exp?: number;
    };
    expires_at?: number;
  };
}

const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "auth_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  },
};

export async function middleware(request: NextRequest) {
  let isAuthenticated = false;

  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
    
    if (session.user?.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      isAuthenticated = now <= session.user.expires_at;
    }
  } catch {
    isAuthenticated = false;
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isPublicPage = request.nextUrl.pathname === '/'

  if (isApiRoute) {
    return NextResponse.next()
  }

  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
