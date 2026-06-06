'use client';

import { createClient } from '@supabase/supabase-js';

export function createHarbourviewBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing browser-safe Supabase public environment variables.');
  }

  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
