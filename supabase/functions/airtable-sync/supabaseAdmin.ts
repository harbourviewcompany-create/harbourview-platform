import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getEnv } from './config.ts';

export function createSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return undefined;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
