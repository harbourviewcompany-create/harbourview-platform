import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CACHE_BYPASS_VALUE = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0';

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('Cache-Control', CACHE_BYPASS_VALUE);
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  response.headers.set('Surrogate-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('X-Harbourview-Runtime-Cache-Bypass', 'pr62-runtime-probe-2026-05-05');

  return response;
}

export const config = {
  matcher: ['/', '/marketplace', '/signals', '/intelligence', '/intake', '/contact'],
};
