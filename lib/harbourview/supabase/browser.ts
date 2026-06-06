'use client';

import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createHarbourviewBrowserSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
