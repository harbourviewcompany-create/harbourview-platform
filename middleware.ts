import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CACHE_BYPASS_VALUE = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0';

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', CACHE_BYPASS_VALUE);
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  response.headers.set('Surrogate-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('X-Harbourview-Runtime-Cache-BYPASS', 'pr75-pr76-production-route-cleanup-2026-05-06');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyRedirects: Record<string, string> = {
    '/marketplace/submit-listing': '/marketplace/sell',
    '/marketplace/wanted-requests': '/marketplace/wanted',
    '/commercial-intelligence': '/intelligence',
  };

  const redirectTo = legacyRedirects[pathname];
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = '';
    return applyNoStoreHeaders(NextResponse.redirect(url, 308));
  }

  return applyNoStoreHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/',
    '/marketplace',
    '/marketplace/:path*',
    '/signals',
    '/intelligence',
    '/intake',
    '/contact',
    '/admin',
    '/commercial-intelligence',
  ],
};
