import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createHarbourviewServerSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
