import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = ['/studio', '/profile'];
const guestRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (guestRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/studio/:path*', '/profile/:path*'],
};
