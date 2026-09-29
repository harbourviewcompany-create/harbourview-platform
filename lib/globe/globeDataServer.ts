import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import {
  getGlobeCountryMarkers,
  getGlobeSignals,
  type GlobeLiveData,
} from './supabaseGlobeData'

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
  }) as unknown as SupabaseClient
}

/**
 * Countries and signals are cached independently. unstable_cache does not store
 * a thrown result, so a transient signals failure is never pinned for the whole
 * revalidate window and cannot evict a healthy countries snapshot.
 */
const getCountriesCached = unstable_cache(
  async () => getGlobeCountryMarkers(serverAnonClient()),
  ['globe-countries-v3'],
  { revalidate: GLOBE_REVALIDATE_SECONDS, tags: ['globe'] },
)

const getSignalsCached = unstable_cache(
  async () => getGlobeSignals(serverAnonClient()),
  ['globe-signals-v3'],
  { revalidate: GLOBE_REVALIDATE_SECONDS, tags: ['globe'] },
)

/**
 * Countries are required and throw on hard failure (the route answers 503).
 * Signals degrade to empty with `signalsUnavailable: true`.
 */
export async function getGlobeLiveDataCached(): Promise<GlobeLiveData> {
  const [countries, signals] = await Promise.allSettled([getCountriesCached(), getSignalsCached()])

  if (countries.status === 'rejected') throw countries.reason

  if (signals.status === 'rejected') {
    console.error(
      '[globe] signals unavailable; serving countries only:',
      signals.reason instanceof Error ? signals.reason.message : signals.reason,
    )
    return {
      countries: countries.value,
      signalsByIso2: {},
      unmappedSignalCountries: {},
      signalsUnavailable: true,
    }
  }

  return { countries: countries.value, ...signals.value }
}
