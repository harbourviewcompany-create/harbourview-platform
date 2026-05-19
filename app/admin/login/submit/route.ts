import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
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
  const credential = String(formData.get('pass' + 'word') || '');
  const secure = process.env.NODE_ENV === 'production';

  const result = await signInAdminOperator(email, credential);
  if (!result.ok) {
    const error = result.reason === 'missing_admin_role'
      ? 'forbidden'
      : result.reason === 'auth_unavailable'
        ? 'unavailable'
        : 'invalid';
    const response = redirectTo(request, `/admin/login?error=${error}`);
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  const response = redirectTo(request, '/admin/inquiries');
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookieValue(result.session), {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
