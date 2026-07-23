import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { getGlobeLiveData, type GlobeLiveData } from './supabaseGlobeData'

/** How long a cached globe payload is served before revalidation. */
export const GLOBE_REVALIDATE_SECONDS = 300

/**
 * Anonymous, cookie-free server client. Deliberately NOT the cookie-aware
 * `lib/supabase/server` client — reading cookies would opt the route into
 * dynamic rendering and defeat caching. Globe data is public, so anon is correct.
 */
function serverAnonClient() {
  return createClient(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

/**
 * Cached globe payload. The underlying DB query runs at most once per
 * GLOBE_REVALIDATE_SECONDS regardless of visitor count. This both removes
 * per-visitor load from the (Micro) database and lets the globe render from
 * cache during a transient DB blip. Throws on hard failure — the route handler
 * degrades gracefully rather than surfacing an error to the client.
 */
export const getGlobeLiveDataCached = unstable_cache(
  // Cast: serverAnonClient() is typed to the `api` schema; getGlobeLiveData's
  // param defaults to the browser client type. Runtime `.from()` is schema-agnostic.
  async (): Promise<GlobeLiveData> =>
    getGlobeLiveData(serverAnonClient() as unknown as SupabaseClient),
  ['globe-live-data-v1'],
  { revalidate: GLOBE_REVALIDATE_SECONDS, tags: ['globe'] },
)
