import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/verify', // legacy flow; keep open for now
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Lightweight check: presence of a NextAuth session cookie. Full auth enforced in handlers.
  const sessionCookie =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  // Admin and participant checks are enforced inside route handlers/server components.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
