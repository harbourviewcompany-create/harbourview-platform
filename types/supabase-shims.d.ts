declare module '@supabase/supabase-js' {
  export interface SupabaseClient {
    from: (table: string) => unknown
    auth?: unknown
    [key: string]: unknown
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): SupabaseClient
}

declare module '@supabase/ssr' {
  import type { SupabaseClient } from '@supabase/supabase-js'

  export function createBrowserClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): SupabaseClient

  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): SupabaseClient
}
