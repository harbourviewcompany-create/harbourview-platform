import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/auth/adminLogin';

export const dynamic = 'force-dynamic';

function signedOutResponse(request: Request) {
  const response = NextResponse.redirect(new URL('/admin/login?signedOut=1', request.url), { status: 303 });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function POST(request: Request) {
  return signedOutResponse(request);
}

// Intentionally POST-only: sign-out must be triggered by explicit form submission.
