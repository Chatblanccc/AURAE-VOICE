import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isSignedIn = !!session?.user;

  // Always allow auth callbacks and the sign-in page
  if (
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/sign-in')
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated visitors to /sign-in
  if (!isSignedIn) {
    const signInUrl = new URL('/sign-in', nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except static files and _next internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
