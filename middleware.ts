import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token');

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token is valid (basic check)
    const payload = verifyToken(token.value);
    if (!payload) {
      // Token is invalid, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token'); // Clear invalid token
      return response;
    }

    // Check if user is admin (basic check - full check in API routes)
    if (payload.role !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // Redirect from login if already authenticated with valid token
  if (pathname === '/login') {
    const token = request.cookies.get('admin_token');
    if (token) {
      const payload = verifyToken(token.value);
      if (payload && payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        // Invalid token, clear it
        const response = NextResponse.next();
        response.cookies.delete('admin_token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
