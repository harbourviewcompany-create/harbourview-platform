import 'server-only';

const ADMIN_DATABASE_KEY_ENV = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable ${name}`);
  return value.trim();
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

export function isAdminDatabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    && process.env[ADMIN_DATABASE_KEY_ENV]?.trim()
    && process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED === 'true',
  );
}

export async function fetchAdminDatabase(path: string, init: RequestInit = {}) {
  const url = trimTrailingSlash(requireEnv('NEXT_PUBLIC_SUPABASE_URL'));
  const adminDatabaseKey = requireEnv(ADMIN_DATABASE_KEY_ENV);
  const headers = new Headers(init.headers);

  headers.set('apikey', adminDatabaseKey);
  headers.set('Authorization', `Bearer ${adminDatabaseKey}`);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}
