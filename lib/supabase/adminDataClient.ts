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
  if (!response.ok) {
    console.error('harbourview_admin_data_request_failed', {
      status: response.status,
      statusText: response.statusText,
      path,
      body: text.slice(0, 240),
    });

    return {
      ok: false,
      error: {
        code: 'request_failed',
        message: `Admin inquiry review could not read Supabase data. Supabase returned ${response.status}.`,
      },
    };
  }

  return {
    ok: true,
    data: text ? JSON.parse(text) as T : null as T,
  };
}
