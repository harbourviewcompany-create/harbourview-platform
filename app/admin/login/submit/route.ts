import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookieValue,
  signInAdminOperator,
} from '@/lib/auth/adminLogin';

export const dynamic = 'force-dynamic';

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  const result = await signInAdminOperator(email, password);
  if (!result.ok) {
    const error = result.reason === 'missing_admin_role'
      ? 'forbidden'
      : result.reason === 'auth_unavailable'
        ? 'unavailable'
        : 'invalid';
    return redirectTo(request, `/admin/login?error=${error}`);
  }

  const response = redirectTo(request, '/admin/inquiries');
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookieValue(result.session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: result.maxAge,
  });

  return response;
}
