import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow admin login page without session
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  // Admin guard
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_session')?.value;
    const session = token ? await verifySession(token) : null;
    if (!session?.admin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Participant guard
  if (pathname === '/me' || pathname.startsWith('/api/me')) {
    const token = request.cookies.get('participant_session')?.value;
    const session = token ? await verifySession(token) : null;
    if (!session?.participantId) {
      return NextResponse.redirect(new URL('/verify', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/me', '/api/me/:path*'],
};
