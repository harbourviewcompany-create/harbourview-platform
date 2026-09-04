/**
 * components/globe/GlobeProvider.tsx
 *
 * Wires the real schema (countries / signals / market_metrics) into context.
 * Regulatory heatmap colours are loaded directly from the current countries
 * rows on every initial browser load, then kept current by Realtime changes.
 * The heavier signal payload may still bootstrap from the cached /api/globe
 * route; cached country tiers are never used as the authoritative first paint.
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
  getGlobeCountryMarkers,
  mergeSignalRealtimeRow,
  type GlobeLiveData,
  type GlobeCountryMarker,
  type SignalRealtimeRow,
} from '@/lib/globe/supabaseGlobeData'

/**
 * Cached bootstrap for signal data. Country rows returned by this route are
 * deliberately replaced by a direct live countries query before state is
 * published, so a CDN/Next cache cannot keep a stale regulatory colour alive.
 */
async function fetchGlobeBootstrapData(): Promise<GlobeLiveData> {
  const res = await fetch('/api/globe', { cache: 'no-store' })
  if (!res.ok) throw new Error(`globe fetch failed: ${res.status}`)
  const data = (await res.json()) as GlobeLiveData & { degraded?: boolean }
  return {
    countries: data.countries ?? [],
    signalsByIso2: data.signalsByIso2 ?? {},
    unmappedSignalCountries: data.unmappedSignalCountries ?? {},
  }
}

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

    const bootstrapPromise = withRetry(() => fetchGlobeBootstrapData(), FETCH_RETRY_BACKOFFS_MS)
    const liveCountriesPromise = withRetry(() => getGlobeCountryMarkers(), FETCH_RETRY_BACKOFFS_MS)

    Promise.allSettled([bootstrapPromise, liveCountriesPromise])
      .then(([bootstrapResult, countriesResult]) => {
        if (cancelled) return

        if (bootstrapResult.status === 'rejected' && countriesResult.status === 'rejected') {
          throw bootstrapResult.reason ?? countriesResult.reason
        }

        const bootstrap = bootstrapResult.status === 'fulfilled' ? bootstrapResult.value : EMPTY_DATA

        if (countriesResult.status === 'fulfilled') {
          setLiveData({ ...bootstrap, countries: countriesResult.value })
          return
        }

        // Regulatory claims fail closed. A cached countries array may be stale,
        // so if the direct live tier query fails we keep countries empty/neutral
        // rather than painting a possibly obsolete legal status.
        console.error('[GlobeProvider] live countries query failed; rendering regulatory tiers neutral:', countriesResult.reason)
        setLiveData({ ...bootstrap, countries: [] })
        setLoadError('Live regulatory tier data is temporarily unavailable.')
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
          if (payload.eventType === 'DELETE') return prev
          return mergeSignalRealtimeRow(prev, payload.new as unknown as SignalRealtimeRow)
        }

        return prev
      })
    },
    []
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
