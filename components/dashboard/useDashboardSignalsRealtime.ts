/**
 * Keeps the Command Centre signal feed live and scoped to the selected country.
 *
 * The first render is canonicalized locally with the same freshness/dedup rules
 * as the API, then every mount performs an authenticated no-store refresh. This
 * prevents the previous SSR/digest -> client-feed swap from flashing stale or
 * unrelated intelligence while still keeping a useful first paint.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import {
  canonicalizeDashboardSignals,
  isGlobalSignalScope,
  WEEKLY_SIGNAL_WINDOW_DAYS,
} from '@/lib/dashboard/signalFreshness'

export type SignalsRealtimeStatus = 'live' | 'connecting' | 'degraded'

const REFRESH_DEBOUNCE_MS = 1200
const FEED_LIMIT = 30

export function useDashboardSignalsRealtime(
  initialSignals: DashboardSignal[],
  countryLabel: string,
): { signals: DashboardSignal[]; status: SignalsRealtimeStatus } {
  const initialScope = isGlobalSignalScope(countryLabel) ? 'all' : countryLabel
  const [signals, setSignals] = useState<DashboardSignal[]>(() =>
    canonicalizeDashboardSignals(initialSignals, initialScope, {
      windowDays: WEEKLY_SIGNAL_WINDOW_DAYS,
      limit: FEED_LIMIT,
    }),
  )
  const [status, setStatus] = useState<SignalsRealtimeStatus>('connecting')

  const countryRef = useRef(initialScope)
  countryRef.current = isGlobalSignalScope(countryLabel) ? 'all' : countryLabel
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    const scope = countryRef.current
    inFlightRef.current?.abort()
    const controller = new AbortController()
    inFlightRef.current = controller
    try {
      const res = await fetch(
        `/api/dashboard/signals?country=${encodeURIComponent(scope)}&limit=${FEED_LIMIT}`,
        {
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        },
      )
      if (!res.ok) {
        if (!controller.signal.aborted) setStatus('degraded')
        return
      }
      const data = (await res.json()) as { signals?: DashboardSignal[] }
      if (!mountedRef.current || controller.signal.aborted) return
      if (Array.isArray(data.signals)) {
        setSignals(canonicalizeDashboardSignals(data.signals, scope, {
          windowDays: WEEKLY_SIGNAL_WINDOW_DAYS,
          limit: FEED_LIMIT,
        }))
      }
    } catch {
      if (!controller.signal.aborted && mountedRef.current) setStatus('degraded')
    }
  }, [])

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (mountedRef.current) void refresh()
    }, REFRESH_DEBOUNCE_MS)
  }, [refresh])

  // Canonicalize the server/session payload immediately for this scope and then
  // refresh from the one authoritative endpoint on every mount/context change.
  useEffect(() => {
    const scope = isGlobalSignalScope(countryLabel) ? 'all' : countryLabel
    countryRef.current = scope
    setStatus('connecting')
    setSignals(canonicalizeDashboardSignals(initialSignals, scope, {
      windowDays: WEEKLY_SIGNAL_WINDOW_DAYS,
      limit: FEED_LIMIT,
    }))
    void refresh()
  }, [countryLabel, initialSignals, refresh])

  // Refresh when a signal is inserted OR later updated into reviewed/published
  // state. INSERT-only subscriptions missed the common review/promotion path.
  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()
    const channel: RealtimeChannel = supabase
      .channel('dashboard-signals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        () => scheduleRefresh(),
      )
      .subscribe((subStatus) => {
        if (!mountedRef.current) return
        if (subStatus === 'SUBSCRIBED') setStatus('live')
        else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT' || subStatus === 'CLOSED') {
          setStatus('degraded')
        }
      })

    return () => {
      mountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
      inFlightRef.current?.abort()
      supabase.removeChannel(channel)
    }
  }, [scheduleRefresh])

  return { signals, status }
}
