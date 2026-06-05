import 'server-only';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

type AdminDataClient = {
  url: string;
  serviceRoleKey: string;
};

export type AdminDataError = {
  code: 'service_role_missing' | 'request_failed';
  message: string;
};

// source: 'db'      — data came from a live Supabase query
// source: 'fixture' — DB was empty / unreachable; fixture data returned
export type AdminDataResult<T> =
  | { ok: true; data: T; source: 'db' | 'fixture' }
  | { ok: false; error: AdminDataError };

// Auth is already enforced by requireAdminAuth() on every admin page.
// The only runtime requirement here is SUPABASE_SERVICE_ROLE_KEY — without it
// we cannot bypass RLS on IA tables and must fall back to fixtures.
function getAdminDataClient(): { ok: true; data: AdminDataClient } | { ok: false; error: AdminDataError } {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    return {
      ok: false,
      error: {
        code: 'service_role_missing',
        message: 'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel environment variables (Production + Preview). IA admin pages will show fixture data until it is configured.',
      },
    };
  }

  return {
    ok: true,
    data: {
      url: resolveLockedSupabaseUrl(),
      serviceRoleKey,
    },
  };
}

export async function fetchAdminSupabaseJson<T>(path: string): Promise<AdminDataResult<T>> {
  const client = getAdminDataClient();
  if (!client.ok) return client;

  const response = await fetch(`${client.data.url}${path}`, {
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const bodyPreview = text.slice(0, 240);

  if (!response.ok) {
    console.error('[harbourview:admin] supabase request failed', {
      status: response.status,
      path,
      body: bodyPreview,
    });
    return {
      ok: false,
      error: { code: 'request_failed', message: `Supabase returned ${response.status} for ${path}` },
    };
  }

  if (!text) return { ok: true, data: null as T, source: 'db' };

  try {
    return { ok: true, data: JSON.parse(text) as T, source: 'db' };
  } catch {
    console.error('[harbourview:admin] invalid JSON from supabase', { path, body: bodyPreview });
    return {
      ok: false,
      error: { code: 'request_failed', message: 'Supabase returned invalid JSON' },
    };
  }
}

/** Type-safe error accessor */
export function getAdminError(result: AdminDataResult<unknown>): AdminDataError {
  if (result.ok) throw new Error('getAdminError called on ok result');
  return (result as Extract<AdminDataResult<unknown>, { ok: false }>).error;
}

/** Mutation variant — PATCH/POST/DELETE with body */
export async function fetchAdminSupabaseJsonMutation<T>(
  path: string,
  method: 'PATCH' | 'POST' | 'DELETE',
  body: Record<string, unknown>,
): Promise<AdminDataResult<T>> {
  const client = getAdminDataClient();
  if (!client.ok) return client;

  const response = await fetch(`${client.data.url}${path}`, {
    method,
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Supabase mutation returned ${response.status}: ${text.slice(0, 240)}` },
    };
  }

  return { ok: true, data: (text ? JSON.parse(text) : null) as T, source: 'db' };
}
