/**
 * components/dashboard/useDashboardSignalsRealtime.ts
 *
 * Keeps the Command Centre signal feed live and scoped to the selected country.
 *
 * The dashboard SSRs a single global signals list (`fetchDashboardSignals`) that
 * never changed after load, regardless of which country the user selected. This
 * hook:
 *   1. Re-scopes the feed to the active country (global stays global) via the
 *      existing auth-gated, DTO-safe `/api/dashboard/signals` endpoint — so no
 *      raw signal columns or private fields are ever mapped client-side.
 *   2. Subscribes to Supabase Realtime INSERTs on the `signals` table and
 *      refreshes the (scoped) feed when new intelligence lands, debounced so a
 *      burst of inserts triggers one refetch, not dozens.
 *
 * Requires the `signals` table to be in the Realtime publication (the same
 * migration the globe realtime relies on). If Realtime is unavailable the hook
 * degrades to the initial SSR feed plus country-scoped refetch on selection —
 * it never throws or blanks the feed.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

export type SignalsRealtimeStatus = 'live' | 'connecting' | 'degraded'

const REFRESH_DEBOUNCE_MS = 1500
const FEED_LIMIT = 30

function isGlobal(label: string): boolean {
  const l = label.trim().toLowerCase()
  return !l || l === 'global' || l === 'global market'
}

export function useDashboardSignalsRealtime(
  initialSignals: DashboardSignal[],
  countryLabel: string,
): { signals: DashboardSignal[]; status: SignalsRealtimeStatus } {
  const [signals, setSignals] = useState<DashboardSignal[]>(initialSignals)
  const [status, setStatus] = useState<SignalsRealtimeStatus>('connecting')

  const countryRef = useRef(countryLabel)
  countryRef.current = countryLabel
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    const label = countryRef.current
    const scope = isGlobal(label) ? 'all' : label
    inFlightRef.current?.abort()
    const controller = new AbortController()
    inFlightRef.current = controller
    try {
      const res = await fetch(
        `/api/dashboard/signals?country=${encodeURIComponent(scope)}&limit=${FEED_LIMIT}`,
        { signal: controller.signal, cache: 'no-store' },
      )
      if (!res.ok) return // keep the current feed; never blank it on error
      const data = (await res.json()) as { signals?: DashboardSignal[] }
      if (!mountedRef.current || controller.signal.aborted) return
      if (Array.isArray(data.signals)) setSignals(data.signals)
    } catch {
      // network/abort — keep the existing feed
    }
  }, [])

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (mountedRef.current) void refresh()
    }, REFRESH_DEBOUNCE_MS)
  }, [refresh])

  // Re-scope immediately when the selected country changes. For the global view
  // we already have the SSR feed, so avoid an unnecessary refetch on first mount.
  const firstRunRef = useRef(true)
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      if (isGlobal(countryLabel)) return // SSR feed is already global
    }
    void refresh()
  }, [countryLabel, refresh])

  // Realtime subscription — refresh the scoped feed on new signal inserts.
  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()
    const channel: RealtimeChannel = supabase
      .channel('dashboard-signals-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals' },
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
