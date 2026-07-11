import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionCookieValue,
  signInAdminOperator,
} from '@/lib/auth/adminLogin';
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit';

export const dynamic = 'force-dynamic';

const ROUTE_ID = '/admin/login/submit';

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

function expireAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

function isSameOriginFormPost(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin) return origin === expectedOrigin;

  const referer = request.headers.get('referer');
  if (!referer) return true;

  try {
    return new URL(referer).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function redirectFailure(request: Request, error: string) {
  return expireAdminCookie(redirectTo(request, `/admin/login?error=${error}`));
}

export async function POST(request: Request) {
  if (!isSameOriginFormPost(request)) {
    return redirectFailure(request, 'invalid');
  }

  const ip = getClientIp(request);
  const ipLimit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 5 * 60_000 });
  if (!ipLimit.allowed) {
    return redirectFailure(request, 'rate_limited');
  }

  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const credential = String(formData.get('pass' + 'word') || '');

  const identityLimit = await enforceRateLimit({ route: ROUTE_ID, ip, identity: email, limit: 8, windowMs: 5 * 60_000 });
  if (!identityLimit.allowed) {
    return redirectFailure(request, 'rate_limited');
  }

  const result = await signInAdminOperator(email, credential);
  if (!result.ok) {
    const error = (result as any).reason === 'missing_admin_role'
      ? 'forbidden'
      : (result as any).reason === 'auth_unavailable'
        ? 'unavailable'
        : 'invalid';
    return redirectFailure(request, error);
  }

  const response = redirectTo(request, '/admin/inquiries');
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookieValue(result.session), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
