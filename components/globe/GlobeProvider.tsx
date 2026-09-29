/**
 * components/globe/GlobeProvider.tsx
 *
 * Regulatory heatmap colours are loaded directly from evidence-backed published
 * columns on countries, then kept current by Realtime country changes. Cached
 * country data is never authoritative first paint.
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
  mergeSignalRealtimeRow,
  resolveGlobeRegulatoryTier,
  type GlobeLiveData,
  type GlobeCountryMarker,
  type SignalRealtimeRow,
} from '@/lib/globe/supabaseGlobeData'

/** Per-attempt ceiling so a hung /api/globe cannot hold the intro spin forever. */
const FETCH_TIMEOUT_MS = 8000

export async function fetchGlobeBootstrapData(): Promise<{ data: GlobeLiveData; degraded: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch('/api/globe', { cache: 'no-store', signal: controller.signal })
    if (!res.ok) throw new Error(`globe fetch failed: ${res.status}`)
    const data = (await res.json()) as GlobeLiveData & { degraded?: boolean }
    return {
      data: {
        countries: data.countries ?? [],
        signalsByIso2: data.signalsByIso2 ?? {},
        unmappedSignalCountries: data.unmappedSignalCountries ?? {},
        signalsUnavailable: data.signalsUnavailable === true,
      },
      degraded: data.degraded === true || data.signalsUnavailable === true,
    }
  } catch (err) {
    if (controller.signal.aborted) throw new Error(`globe fetch timed out after ${FETCH_TIMEOUT_MS}ms`)
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function withRetry<T>(attempt: () => Promise<T>, backoffsMs: readonly number[]): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= backoffsMs.length; i++) {
    try {
      return await attempt()
    } catch (err) {
      lastErr = err
      if (i < backoffsMs.length) await new Promise((resolve) => setTimeout(resolve, backoffsMs[i]))
    }
  }
  throw lastErr
}
const FETCH_RETRY_BACKOFFS_MS = [800] as const

type GlobeContextType = {
  liveData: GlobeLiveData
  status: RealtimeStatus
  loading: boolean
  loadError: string | null
  degraded: boolean
  loadedAt: number | null
  reconnect: () => void
  /** Re-run the /api/globe bootstrap (used by the degraded-state Retry). */
  reload: () => void
}

/** Exported so surfaces that only need liveData can soft-fall back outside the provider (SSR smoke). */
export const GlobeContext = createContext<GlobeContextType | null>(null)
const EMPTY_DATA: GlobeLiveData = { countries: [], signalsByIso2: {}, unmappedSignalCountries: {} }

export function GlobeProvider({ children }: { children: ReactNode }) {
  const [liveData, setLiveData] = useState<GlobeLiveData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [degraded, setDegraded] = useState(false)
  const [loadedAt, setLoadedAt] = useState<number | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const reload = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    setReloadToken((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    withRetry(() => fetchGlobeBootstrapData(), FETCH_RETRY_BACKOFFS_MS)
      .then((bootstrap) => {
        if (cancelled) return
        // Countries and signals arrive together from the server-cached bootstrap.
        // Avoid a second browser PostgREST country query; Realtime remains the
        // live-update path after the cached snapshot is installed.
        setLiveData(bootstrap.data)
        setDegraded(bootstrap.degraded)
        setLoadError(null)
        setLoadedAt(Date.now())
      })
      .catch((err) => {
        if (!cancelled) {
          setDegraded(true)
          setLoadError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [reloadToken])

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
            verified_regulatory_tier: string | null
            regulatory_tier_evidence_key: string | null
            regulatory_tier_verified_at: string | null
            regulatory_tier_expires_at: string | null
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
            ...(() => {
              const resolved = resolveGlobeRegulatoryTier(updated)
              return { regulatoryTier: resolved.tier, regulatoryTierProvenance: resolved.provenance }
            })(),
            regulatoryTierEvidenceKey: updated.regulatory_tier_evidence_key ?? null,
            regulatoryTierVerifiedAt: updated.regulatory_tier_verified_at ?? null,
            regulatoryTierExpiresAt: updated.regulatory_tier_expires_at ?? null,
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
    }, []
  )

  const { status, reconnect } = useGlobeRealtime(handleRealtimeChange)
  const value = useMemo(
    () => ({ liveData, status, loading, loadError, degraded, loadedAt, reconnect, reload }),
    [liveData, status, loading, loadError, degraded, loadedAt, reconnect, reload]
  )
  return <GlobeContext.Provider value={value}>{children}</GlobeContext.Provider>
}

export function useGlobe() {
  const ctx = useContext(GlobeContext)
  if (!ctx) throw new Error('useGlobe must be used within GlobeProvider')
  return ctx
}
