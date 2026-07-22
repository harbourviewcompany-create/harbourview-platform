/**
 * components/globe/GlobeProvider.tsx
 *
 * Wires the real schema (countries / signals / market_metrics) into context.
 * Realtime deltas are merged into state here rather than in the hook, since
 * merging requires the current `countries` list (for the country-name→iso2
 * lookup used by `signals` inserts).
 */
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import { useGlobeRealtime, type RealtimeStatus } from './useGlobeRealtime'
import {
  getGlobeLiveData,
  type GlobeLiveData,
  type GlobeCountryMarker,
  type GlobeSignal,
} from '@/lib/globe/supabaseGlobeData'
import { resolveCountryToIso2 } from '@/lib/globe/countryAlias'

/**
 * Retries a promise-returning fn with backoff. The diagnosed cause of the
 * "Could not load regulatory data" / uncoloured-gold globe was transient
 * database latency that recovers within seconds; a retry turns a blip into a
 * brief reload instead of a dead-end. Each attempt is independently
 * timeout-guarded by the caller where applicable.
 */
async function withRetry<T>(attempt: () => Promise<T>, backoffsMs: readonly number[]): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= backoffsMs.length; i++) {
    try {
      return await attempt()
    } catch (err) {
      lastErr = err
      if (i < backoffsMs.length) {
        await new Promise((resolve) => setTimeout(resolve, backoffsMs[i]))
      }
    }
  }
  throw lastErr
}
const FETCH_RETRY_BACKOFFS_MS = [800, 2000] as const

type GlobeContextType = {
  liveData: GlobeLiveData
  status: RealtimeStatus
  loading: boolean
  loadError: string | null
  reconnect: () => void
}

const GlobeContext = createContext<GlobeContextType | null>(null)

const EMPTY_DATA: GlobeLiveData = {
  countries: [],
  signalsByIso2: {},
  unmappedSignalCountries: {},
}

export function GlobeProvider({ children }: { children: ReactNode }) {
  const [liveData, setLiveData] = useState<GlobeLiveData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    withRetry(() => getGlobeLiveData(), FETCH_RETRY_BACKOFFS_MS)
      .then((data) => {
        if (!cancelled) setLiveData(data)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const iso2ByName = useMemo(
    () => new Map(liveData.countries.map((c) => [c.name.toLowerCase(), c.iso2])),
    [liveData.countries]
  )

  const handleRealtimeChange = useCallback(
    (payload: {
      table: 'signals' | 'countries' | 'market_metrics'
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      new: Record<string, unknown>
      old: Record<string, unknown>
    }) => {
      setLiveData((prev) => {
        if (payload.table === 'countries') {
          const updated = payload.new as unknown as {
            iso_alpha2: string
            country_name: string
            lat: number
            lng: number
            opportunity_score: number | null
            signals_status: string | null
            market_access_status: string | null
            regulatory_tier: string | null
          }
          if (payload.eventType === 'DELETE' || !updated?.iso_alpha2) return prev

          const marker: GlobeCountryMarker = {
            iso2: updated.iso_alpha2,
            name: updated.country_name,
            lat: updated.lat,
            lng: updated.lng,
            opportunityScore: updated.opportunity_score,
            signalsStatus: updated.signals_status,
            marketAccessStatus: updated.market_access_status,
            regulatoryTier: (updated.regulatory_tier as GlobeCountryMarker['regulatoryTier']) ?? null,
          }

          const withoutOld = prev.countries.filter((c) => c.iso2 !== marker.iso2)
          return { ...prev, countries: [...withoutOld, marker] }
        }

        if (payload.table === 'signals') {
          if (payload.eventType === 'DELETE') return prev // out of scope for this pass

          const row = payload.new as unknown as {
            id: string
            headline: string
            score: number | null
            cat: string | null
            country: string | null
            created_at: string
          }

          const iso2 = resolveCountryToIso2(row.country, iso2ByName)
          const signal: GlobeSignal = {
            id: row.id,
            headline: row.headline,
            score: row.score,
            cat: row.cat,
            createdAt: row.created_at,
            countryIso2: iso2,
          }

          if (!iso2) {
            const key = row.country ?? '(null)'
            return {
              ...prev,
              unmappedSignalCountries: {
                ...prev.unmappedSignalCountries,
                [key]: (prev.unmappedSignalCountries[key] ?? 0) + 1,
              },
            }
          }

          const existing = prev.signalsByIso2[iso2] ?? []
          return {
            ...prev,
            signalsByIso2: {
              ...prev.signalsByIso2,
              [iso2]: [signal, ...existing].slice(0, 50), // cap per-country
            },
          }
        }

        // market_metrics: currently loaded on init only; live updates here
        // are intentionally not merged yet — no UI consumes them live. Add
        // a case here when an overlay actually reads from this table.
        return prev
      })
    },
    [iso2ByName]
  )

  const { status, reconnect } = useGlobeRealtime(handleRealtimeChange)

  const value = useMemo(
    () => ({ liveData, status, loading, loadError, reconnect }),
    [liveData, status, loading, loadError, reconnect]
  )

  return <GlobeContext.Provider value={value}>{children}</GlobeContext.Provider>
}

export function useGlobe() {
  const ctx = useContext(GlobeContext)
  if (!ctx) throw new Error('useGlobe must be used within GlobeProvider')
  return ctx
}
