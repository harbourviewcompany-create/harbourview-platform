import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { forbidden, unauthorized } from 'next/navigation';
import { hasAdminRole, isAppRole, type AppRole } from './adminRoles';
import { ADMIN_SESSION_COOKIE_NAME } from './adminLogin';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

type SupabaseUser = {
  id: string;
  email?: string;
};

type RoleRow = {
  role: string;
};

type AdminAuthResult = {
  user: SupabaseUser;
  roles: AppRole[];
};

type AdminAuthFailureReason =
  | 'missing_access_token'
  | 'invalid_access_token'
  | 'missing_admin_role';

type AdminAuthCheck =
  | { ok: true; auth: AdminAuthResult }
  | { ok: false; reason: AdminAuthFailureReason };

type CookieEntry = { name: string; value: string };

// Admin routes allow admin/operator roles; analyst/viewer roles are denied.
function requireEnv(name: string) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable ${name}`);
  return value.trim();
}

function resolveSupabaseApiKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJwtPayload(accessToken: string): Record<string, unknown> | null {
  const [, payload] = accessToken.split('.');
  if (!payload) return null;

  try {
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

function extractBearerToken(authorization: string | null) {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function parseCookieJson(value: string): unknown {
  const decoded = decodeURIComponent(value);

  try {
    return JSON.parse(decoded);
  } catch {
    // Supabase SSR cookies are often base64url encoded with a base64- prefix.
  }

  const withoutPrefix = decoded.startsWith('base64-') ? decoded.slice('base64-'.length) : decoded;

  try {
    return JSON.parse(decodeBase64Url(withoutPrefix));
  } catch {
    return null;
  }
}

function readAccessTokenFromCookieValue(value: string): string | null {
  const parsed = parseCookieJson(value);
  if (!parsed || typeof parsed !== 'object') return null;

  if ('access_token' in parsed && typeof parsed.access_token === 'string') {
    return parsed.access_token;
  }

  if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
    return parsed[0];
  }

  return null;
}

// Resolves the incoming authorization header + cookies either from an explicit
// NextRequest (route handlers invoked directly, e.g. in unit tests, or edge
// runtimes without AsyncLocalStorage-based request scoping) or, when no request
// is provided, from Next's ambient `headers()`/`cookies()` (Server Components,
// Server Actions, or route handlers relying on the request-scoped context).
async function getRequestContext(
  request?: NextRequest,
): Promise<{ authorization: string | null; cookieEntries: CookieEntry[] }> {
  if (request) {
    return {
      authorization: request.headers.get('authorization'),
      cookieEntries: request.cookies.getAll(),
    };
  }

  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
  return {
    authorization: headerList.get('authorization'),
    cookieEntries: cookieStore.getAll(),
  };
}

async function resolveAccessToken(request?: NextRequest): Promise<string | null> {
  const { authorization, cookieEntries } = await getRequestContext(request);

  const headerToken = extractBearerToken(authorization);
  if (headerToken) return headerToken;

  const namedSessionCookie = cookieEntries.find((cookie) => cookie.name === ADMIN_SESSION_COOKIE_NAME);
  if (namedSessionCookie) {
    const token = readAccessTokenFromCookieValue(namedSessionCookie.value);
    if (token) return token;
  }

  for (const cookie of cookieEntries) {
    const token = readAccessTokenFromCookieValue(cookie.value);
    if (token) return token;
  }

  const chunksByPrefix = new Map<string, { index: number; value: string }[]>();
  for (const cookie of cookieEntries) {
    const match = cookie.name.match(/^(.*)[.]([0-9]+)$/);
    if (!match) continue;
    const [, prefix, index] = match;
    if (!chunksByPrefix.has(prefix)) chunksByPrefix.set(prefix, []);
    chunksByPrefix.get(prefix)?.push({ index: Number(index), value: cookie.value });
  }

  for (const chunks of chunksByPrefix.values()) {
    const joined = chunks
      .sort((a, b) => a.index - b.index)
      .map((chunk) => chunk.value)
      .join('');
    const token = readAccessTokenFromCookieValue(joined);
    if (token) return token;
  }

  return null;
}

async function fetchSupabaseJson<T>({
  path,
  accessToken,
  bearerToken,
}: {
  path: string;
  accessToken: string;
  bearerToken?: string;
}) {
  const supabaseUrl = resolveLockedSupabaseUrl();
  const apiKey = resolveSupabaseApiKey();
  const bearer = bearerToken || accessToken;

  const response = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase auth request failed ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) as T : null as T;
}

async function getAuthenticatedUser(accessToken: string): Promise<SupabaseUser | null> {
  const user = await fetchSupabaseJson<SupabaseUser>({
    path: '/auth/v1/user',
    accessToken,
    bearerToken: accessToken,
  });
  return user?.id ? user : null;
}

function readRolesFromJwt(accessToken: string): AppRole[] {
  const payload = parseJwtPayload(accessToken);
  const roleClaims = [payload?.app_role, payload?.role, payload?.roles].flat();
  return roleClaims.filter((role): role is AppRole => typeof role === 'string' && isAppRole(role));
}

async function readRolesFromUserRoles(userId: string, accessToken: string): Promise<AppRole[]> {
  const encodedUserId = encodeURIComponent(userId);
  const rows = await fetchSupabaseJson<RoleRow[]>({
    path: `/rest/v1/user_roles?user_id=eq.${encodedUserId}&select=role`,
    accessToken,
  });

  return Array.isArray(rows)
    ? rows.map((row) => row.role).filter((role): role is AppRole => isAppRole(role))
    : [];
}

export async function getAdminAuth(request?: NextRequest): Promise<AdminAuthResult | null> {
  const result = await getAdminAuthCheck(request);
  return result.ok ? result.auth : null;
}

export async function getAdminAuthCheck(request?: NextRequest): Promise<AdminAuthCheck> {
  const accessToken = await resolveAccessToken(request);
  if (!accessToken) return { ok: false, reason: 'missing_access_token' };

  let user: SupabaseUser | null;
  try {
    user = await getAuthenticatedUser(accessToken);
  } catch {
    return { ok: false, reason: 'invalid_access_token' };
  }
  if (!user) return { ok: false, reason: 'invalid_access_token' };

  const roles = Array.from(new Set([...readRolesFromJwt(accessToken), ...(await readRolesFromUserRoles(user.id, accessToken))]));
  if (!hasAdminRole(roles)) return { ok: false, reason: 'missing_admin_role' };

  return { ok: true, auth: { user, roles } };
}

export async function requireAdminAuth(request?: NextRequest) {
  const result = await getAdminAuthCheck(request);
  if (result.ok) return result.auth;

  if (result.reason === 'missing_access_token' || result.reason === 'invalid_access_token') {
    unauthorized();
  }

  forbidden();
}
