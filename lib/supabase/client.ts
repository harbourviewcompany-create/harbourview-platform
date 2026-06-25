import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use raw env vars — Next.js inlines NEXT_PUBLIC_* at build time.
  // Avoid runtime guard helpers that can throw in browser context before
  // the Supabase call is made, causing silent frozen loading states.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  )
}
