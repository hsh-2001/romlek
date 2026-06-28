import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = ['/feed', '/explore', '/media', '/studio', '/notifications', '/messages', '/profile'];
const guestRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (guestRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/feed/:path*', '/explore/:path*', '/media/:path*', '/studio/:path*', '/notifications/:path*', '/messages/:path*', '/profile/:path*'],
};
