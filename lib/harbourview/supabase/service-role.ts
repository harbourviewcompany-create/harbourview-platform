import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function createHarbourviewServiceRoleSupabaseClient() {
  // Accept either env var so server clients resolve the same project URL
  // regardless of which one is configured in a given environment.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing server-only Supabase service role configuration.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
