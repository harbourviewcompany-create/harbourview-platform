import 'server-only';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';

type AdminDataClient = {
  url: string;
  serviceRoleKey: string;
};

export type AdminDataError = {
  code: 'admin_review_disabled' | 'service_role_missing' | 'request_failed';
  message: string;
};

export type AdminDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdminDataError };

export function getAdminDataClient(): AdminDataResult<AdminDataClient> {
  if (process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED !== 'true') {
    return {
      ok: false,
      error: {
        code: 'admin_review_disabled',
        message: 'Admin inquiry review is disabled. Set HARBOURVIEW_ADMIN_REVIEW_ENABLED=true in the server environment.',
      },
    };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    return {
      ok: false,
      error: {
        code: 'service_role_missing',
        message: 'Admin inquiry review requires SUPABASE_SERVICE_ROLE_KEY in the server environment.',
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
  if (!client.ok) return client as any;

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
    console.error('harbourview_admin_data_request_failed', {
      status: response.status,
      statusText: response.statusText,
      path,
      body: bodyPreview,
    });

    return {
      ok: false,
      error: {
        code: 'request_failed',
        message: `Admin inquiry review could not read Supabase data. Supabase returned ${response.status}.`,
      },
    };
  }

  // Intentionally preserve prior behavior: empty 2xx response bodies are treated as `null` payloads
  // so callers relying on PostgREST 204/empty responses continue to work without shape changes.
  if (!text) {
    return {
      ok: true,
      data: null as T,
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(text) as T,
    };
  } catch {
    console.error('harbourview_admin_data_request_failed', {
      status: response.status,
      statusText: response.statusText,
      path,
      body: bodyPreview,
      parseError: 'invalid_json',
    });

    return {
      ok: false,
      error: {
        code: 'request_failed',
        message: 'Admin inquiry review received invalid JSON from Supabase upstream.',
      },
    };
  }
}

/** Type-safe error accessor for AdminDataResult after !result.ok check */
export function getAdminError(result: AdminDataResult<unknown>): AdminDataError {
  if (result.ok) throw new Error('getAdminError called on ok result')
  return (result as any).error
}

/** Mutation variant — supports PATCH/POST/DELETE with a body. */
export async function fetchAdminSupabaseJsonMutation<T>(
  path: string,
  method: 'PATCH' | 'POST' | 'DELETE',
  body: Record<string, unknown>,
): Promise<AdminDataResult<T>> {
  const client = getAdminDataClient();
  if (!client.ok) return client as AdminDataResult<T>;

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
      error: {
        code: 'request_failed',
        message: `Supabase mutation returned ${response.status}: ${text.slice(0, 240)}`,
      },
    };
  }

  return { ok: true, data: (text ? JSON.parse(text) : null) as T };
}

