import 'server-only';
import { hasAdminRole, isAppRole, type AppRole } from './adminRoles';
import { assertBrowserSafeSupabaseKey, resolveLockedSupabaseUrl } from '@/lib/supabase/env';

export const ADMIN_SESSION_COOKIE_NAME = 'hv-admin-session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

type SupabasePasswordSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id?: string;
    email?: string;
  };
};

type RoleRow = {
  role: string;
};

type AdminLoginResult =
  | {
      ok: true;
      session: SupabasePasswordSession & { access_token: string; user: { id: string; email?: string } };
    }
  | { ok: false; reason: 'invalid_credentials' | 'missing_admin_role' | 'auth_unavailable' };

class SupabaseAdminLoginError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SupabaseAdminLoginError';
    this.status = status;
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable ${name}`);
  return value.trim();
}

function resolveSupabaseApiKey() {
  return assertBrowserSafeSupabaseKey(
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

function sanitizeSupabaseErrorText(text: string) {
  return text.replace(/("(?:access_token|refresh_token|password|apikey|api_key|token)"\s*:\s*")[^"]+/gi, '$1[redacted]');
}

function logAdminLoginFailure(event: string, details: Record<string, unknown>) {
  console.error(event, {
    ...details,
    supabaseHost: new URL(resolveLockedSupabaseUrl()).hostname,
    keySource: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  });
}

async function fetchSupabaseJson<T>({
  path,
  accessToken,
  init,
}: {
  path: string;
  accessToken?: string;
  init?: RequestInit;
}) {
  const apiKey = resolveSupabaseApiKey();
  const headers: Record<string, string> = {
    apikey: apiKey,
    'Content-Type': 'application/json',
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${resolveLockedSupabaseUrl()}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new SupabaseAdminLoginError(
      response.status,
      `Supabase admin login request failed ${response.status}: ${sanitizeSupabaseErrorText(text)}`
    );
  }

  return text ? JSON.parse(text) as T : null as T;
}

async function readRolesFromUserRoles(userId: string, accessToken: string): Promise<AppRole[]> {
  const rows = await fetchSupabaseJson<RoleRow[]>({
    path: `/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=role`,
    accessToken,
  });

  return Array.isArray(rows)
    ? rows.map((row) => row.role).filter((role): role is AppRole => isAppRole(role))
    : [];
}

export async function signInAdminOperator(email: string, password: string): Promise<AdminLoginResult> {
  if (!email.trim() || !password) return { ok: false, reason: 'invalid_credentials' };

  let session: SupabasePasswordSession;
  try {
    session = await fetchSupabaseJson<SupabasePasswordSession>({
      path: '/auth/v1/token?grant_type=password',
      init: {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      },
    });
  } catch (error) {
    if (error instanceof SupabaseAdminLoginError) {
      logAdminLoginFailure('harbourview_admin_login_auth_failed', {
        status: error.status,
        message: error.message,
      });
      return error.status === 400 || error.status === 422
        ? { ok: false, reason: 'invalid_credentials' }
        : { ok: false, reason: 'auth_unavailable' };
    }

    logAdminLoginFailure('harbourview_admin_login_auth_unavailable', {
      message: error instanceof Error ? error.message : 'Unknown Supabase auth error',
    });
    return { ok: false, reason: 'auth_unavailable' };
  }

  if (!session?.access_token || !session.user?.id) return { ok: false, reason: 'invalid_credentials' };

  let roles: AppRole[];
  try {
    roles = await readRolesFromUserRoles(session.user.id, session.access_token);
  } catch (error) {
    logAdminLoginFailure('harbourview_admin_login_role_lookup_failed', {
      message: error instanceof Error ? error.message : 'Unknown Supabase role lookup error',
    });
    return { ok: false, reason: 'auth_unavailable' };
  }

  if (!hasAdminRole(roles)) return { ok: false, reason: 'missing_admin_role' };

  return {
    ok: true,
    session: session as SupabasePasswordSession & { access_token: string; user: { id: string; email?: string } },
  };
}

export function createAdminSessionCookieValue(session: SupabasePasswordSession) {
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type || 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
  });
}
