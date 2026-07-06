/**
 * components/globe/useGlobeRealtime.ts
 *
 * Note on "heartbeat": the pasted handoff's heartbeat was dead code — it set
 * `lastPongRef.current = now` unconditionally every tick, so the staleness
 * check (`now - lastPongRef.current > 8000`) could never fire. Supabase's
 * Realtime client already runs its own Phoenix-protocol heartbeat internally
 * and reports connection health via the `subscribe(status, err)` callback
 * (SUBSCRIBED / CHANNEL_ERROR / TIMED_OUT / CLOSED). Re-implementing a
 * separate ping on top of that would either duplicate it or (as in the
 * pasted version) fake it. This hook reacts to the real status callback
 * instead, which is the actual signal Supabase gives you.
 *
 * Requires: `enable_realtime_globe_tables.sql` migration applied first —
 * otherwise these channels will report SUBSCRIBED but never receive events.
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type RealtimeStatus = 'connected' | 'reconnecting' | 'degraded'

type ChangePayload = {
  table: 'signals' | 'countries' | 'market_metrics'
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
}

const MAX_RECONNECT_ATTEMPTS = 5
const BACKOFF_BASE_MS = 1000

export function useGlobeRealtime(onChange: (payload: ChangePayload) => void) {
  const [status, setStatus] = useState<RealtimeStatus>('reconnecting')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const connect = useCallback(() => {
    const supabase = createClient()

    // Clean up any previous channel before creating a new one.
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('globe-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        (payload) =>
          onChangeRef.current({
            table: 'signals',
            eventType: payload.eventType as ChangePayload['eventType'],
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'countries' },
        (payload) =>
          onChangeRef.current({
            table: 'countries',
            eventType: payload.eventType as ChangePayload['eventType'],
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_metrics' },
        (payload) =>
          onChangeRef.current({
            table: 'market_metrics',
            eventType: payload.eventType as ChangePayload['eventType'],
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
      )
      .subscribe((subStatus, err) => {
        if (!mountedRef.current) return

        if (subStatus === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0
          setStatus('connected')
          return
        }

        // CHANNEL_ERROR, TIMED_OUT, or CLOSED — this is the real signal to
        // reconnect, not a manually simulated ping.
        if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT' || subStatus === 'CLOSED') {
          if (err) console.error('[useGlobeRealtime] subscription error:', err)
          scheduleReconnect()
        }
      })

    channelRef.current = channel
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('degraded')
      return
    }

    setStatus('reconnecting')
    reconnectAttemptsRef.current += 1
    const delay = BACKOFF_BASE_MS * Math.pow(2, reconnectAttemptsRef.current - 1)

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect()
    }, delay)
  }, [connect])

  // Manual reconnect for a "Retry" button in the degraded-state UI.
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [connect])

  return { status, reconnect }
}
