import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("auth_session");
  const isAuthenticated = !!authCookie?.value;

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
