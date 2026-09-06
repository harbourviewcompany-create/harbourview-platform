import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use raw env vars — Next.js inlines NEXT_PUBLIC_* at build time.
  // Avoid runtime guard helpers that can throw in browser context before
  // the Supabase call is made, causing silent frozen loading states.
  //
  // PostgREST on this project exposes FOUR schemas, and `public` is the
  // default because it is listed first:
  //
  //   pgrst.db_schemas = "public, graphql_public, job_search, api"
  //
  // Corrected 2026-09-06. This comment previously said only `api` was exposed.
  // That was wrong, and it was load-bearing: it implied a raw `fetch` to
  // /rest/v1/<relation> would land on `api`, so several modules omitted the
  // schema header entirely and silently resolved to `public` instead. For
  // relations whose public.* counterpart grants SELECT to service_role only
  // (listings, marketplace_public_listings_v1), that returned no rows for every
  // anon and authenticated caller -- the Market feed read empty in production
  // while api.* held 175 rows.
  //
  // supabase-js sends Accept-Profile/Content-Profile from the `db.schema`
  // option below. A raw fetch does NOT: it must set 'Accept-Profile': 'api'
  // itself (or 'Content-Profile' for writes).
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { db: { schema: 'api' } }
  )
}
