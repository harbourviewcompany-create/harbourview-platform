import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getEnv } from './config.ts';

// PostgREST on this project only exposes the `api` schema (not `public`).
// Edge Functions run in Deno and can't import the Next.js lib/supabase/env.ts
// module, so the schema is inlined here directly. Keep in sync with
// SUPABASE_DB_SCHEMA in lib/supabase/env.ts if that ever changes.
const DB_SCHEMA = 'api';

export function createSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return undefined;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: DB_SCHEMA },
  });
}
