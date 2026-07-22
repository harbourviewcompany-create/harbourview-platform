/**
 * components/globe/GlobeProvider.tsx
 *
 * Wires the real schema (countries / signals / market_metrics) into context.
 * Realtime deltas are merged into state here. `signals.country_iso2` is
 * resolved server-side by the `trg_signals_resolve_geo` trigger before the
 * row commits, so `payload.new.country_iso2` is already correct — no
 * client-side country→iso2 lookup needed.
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
  mergeSignalRealtimeRow,
  type GlobeLiveData,
  type GlobeCountryMarker,
  type SignalRealtimeRow,
} from '@/lib/globe/supabaseGlobeData'

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
    getGlobeLiveData()
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

          return mergeSignalRealtimeRow(prev, payload.new as unknown as SignalRealtimeRow)
        }

        // market_metrics: currently loaded on init only; live updates here
        // are intentionally not merged yet — no UI consumes them live. Add
        // a case here when an overlay actually reads from this table.
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
