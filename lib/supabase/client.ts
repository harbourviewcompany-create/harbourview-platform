import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use raw env vars — Next.js inlines NEXT_PUBLIC_* at build time.
  // Avoid runtime guard helpers that can throw in browser context before
  // the Supabase call is made, causing silent frozen loading states.
  //
  // PostgREST on this project only exposes the `api` schema (not `public`).
  // All supabase-js calls must target `api` to avoid PGRST106 "Invalid schema"
  // 406 errors on every REST request.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { db: { schema: 'api' } }
  )
}
