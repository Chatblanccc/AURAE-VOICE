import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isSignedIn = !!session?.user;

  // Always allow auth callbacks, the sign-in page, the public landing page, health check,
  // and Stripe webhooks (verified by signature inside the route, not session cookies).
  if (
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/sign-in') ||
    nextUrl.pathname === '/api/health' ||
    nextUrl.pathname === '/api/stripe/webhook'
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated visitors to /sign-in
  if (!isSignedIn) {
    const signInUrl = new URL('/sign-in', nextUrl.origin);
    // pathname-only: avoids reflecting arbitrary user-controlled URLs into redirects
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except static files and _next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|jpeg|gif|webp)$).*)',
  ],
};
