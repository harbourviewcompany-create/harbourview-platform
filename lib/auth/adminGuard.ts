import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { hasAdminRole, isAppRole, type AppRole } from './adminRoles';

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

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable ${name}`);
  return value.trim();
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
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

async function resolveAccessToken() {
  const headerToken = extractBearerToken((await headers()).get('authorization'));
  if (headerToken) return headerToken;

  const cookieStore = await cookies();
  const cookieEntries = cookieStore.getAll();

  for (const cookie of cookieEntries) {
    const token = readAccessTokenFromCookieValue(cookie.value);
    if (token) return token;
  }

  const chunksByPrefix = new Map<string, { index: number; value: string }[]>();
  for (const cookie of cookieEntries) {
    const match = cookie.name.match(/^(.*)\.(\d+)$/);
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

async function fetchSupabaseJson<T>({ path, accessToken, serviceRoleKey }: { path: string; accessToken: string; serviceRoleKey?: string }) {
  const supabaseUrl = trimTrailingSlash(requireEnv('NEXT_PUBLIC_SUPABASE_URL'));
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const apiKey = serviceRoleKey || anonKey;
  const bearer = serviceRoleKey || accessToken;

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
  const user = await fetchSupabaseJson<SupabaseUser>({ path: '/auth/v1/user', accessToken });
  return user?.id ? user : null;
}

function readRolesFromJwt(accessToken: string): AppRole[] {
  const payload = parseJwtPayload(accessToken);
  const roleClaims = [payload?.app_role, payload?.role, payload?.roles].flat();
  return roleClaims.filter((role): role is AppRole => typeof role === 'string' && isAppRole(role));
}

async function readRolesFromUserRoles(userId: string, accessToken: string): Promise<AppRole[]> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
  const encodedUserId = encodeURIComponent(userId);
  const rows = await fetchSupabaseJson<RoleRow[]>({
    path: `/rest/v1/user_roles?user_id=eq.${encodedUserId}&select=role`,
    accessToken,
    serviceRoleKey,
  });

  return Array.isArray(rows)
    ? rows.map((row) => row.role).filter((role): role is AppRole => isAppRole(role))
    : [];
}

export async function getAdminAuth(): Promise<AdminAuthResult | null> {
  if (process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED !== 'true') return null;

  const accessToken = await resolveAccessToken();
  if (!accessToken) return null;

  const user = await getAuthenticatedUser(accessToken);
  if (!user) return null;

  const roles = Array.from(new Set([...readRolesFromJwt(accessToken), ...(await readRolesFromUserRoles(user.id, accessToken))]));
  if (!hasAdminRole(roles)) return null;

  return { user, roles };
}

export async function requireAdminAuth() {
  const auth = await getAdminAuth();
  if (!auth) notFound();
  return auth;
}
