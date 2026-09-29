import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import {
  getGlobeCountryMarkers,
  getGlobeSignals,
  getStaticGlobeCountryMarkers,
  type GlobeLiveData,
} from './supabaseGlobeData'
import { createTimeoutFetch } from './fetchWithTimeout'

/** How long a cached globe payload is served before revalidation. */
export const GLOBE_REVALIDATE_SECONDS = 300

/**
 * Per-request ceiling for the server-side Supabase queries. Must stay well under
 * the client's 8s /api/globe deadline (GlobeProvider) so a hung database yields
 * the static fallback instead of a client timeout.
 */
export const GLOBE_QUERY_TIMEOUT_MS = 4000

/**
 * Anonymous, cookie-free server client. Deliberately NOT the cookie-aware
 * `lib/supabase/server` client — reading cookies would opt the route into
 * dynamic rendering and defeat caching. Globe data is public, so anon is correct.
 */
function serverAnonClient() {
  return createClient(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
    global: { fetch: createTimeoutFetch(GLOBE_QUERY_TIMEOUT_MS) },
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
 * Live country metadata and signals are cached independently. A backend outage
 * must not take down country routing: countries fall back to neutral checked-in
 * geography, while signals fall back to empty. Flags tell the UI which layer
 * is unavailable.
 */
export async function getGlobeLiveDataCached(): Promise<GlobeLiveData> {
  const [countries, signals] = await Promise.allSettled([getCountriesCached(), getSignalsCached()])

  const countriesUnavailable = countries.status === 'rejected'
  const signalsUnavailable = signals.status === 'rejected'

  if (countriesUnavailable) {
    console.error(
      '[globe] countries unavailable; serving neutral static geography:',
      countries.reason instanceof Error ? countries.reason.message : countries.reason,
    )
  }
  if (signalsUnavailable) {
    console.error(
      '[globe] signals unavailable; serving without live signals:',
      signals.reason instanceof Error ? signals.reason.message : signals.reason,
    )
  }

  return {
    countries: countriesUnavailable ? getStaticGlobeCountryMarkers() : countries.value,
    signalsByIso2: signalsUnavailable ? {} : signals.value.signalsByIso2,
    unmappedSignalCountries: signalsUnavailable ? {} : signals.value.unmappedSignalCountries,
    ...(countriesUnavailable ? { countriesUnavailable: true } : {}),
    ...(signalsUnavailable ? { signalsUnavailable: true } : {}),
  }
}
