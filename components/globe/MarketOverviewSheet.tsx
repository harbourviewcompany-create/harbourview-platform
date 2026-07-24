'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { RouterBottomSheet } from './RouterBottomSheet'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import type { JurisdictionBriefing } from '@/lib/globe/jurisdictionBriefingTypes'
import { BRIEFING_SELECT } from '@/lib/globe/jurisdictionBriefingTypes'

/** Lazy singleton — reuses one client instance for the lifetime of the page. */
function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any, 'api'>(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

/**
 * Guards a promise against a hung network request. Supabase-js has no built-in
 * client timeout, so a stalled fetch (DNS, TLS, or edge cold-start hang) would
 * otherwise leave the sheet spinning on "Fetching regulatory data…" forever.
 * Rejecting here routes the hang into the existing retryable error state.
 */
const FETCH_TIMEOUT_MS = 7_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out after ${ms}ms: ${label}`))
    }, ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}


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

interface Props {
  countryIso2: string
  countryName: string
  onEnter: () => void
  onBack: () => void
}

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; briefing: JurisdictionBriefing | null }
  | { status: 'error' }

function BriefingSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8be76]/72">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-[#f5f1e8]/80">{text}</dd>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────

export function MarketOverviewSheet({
  countryIso2,
  countryName,
  onEnter,
  onBack,
}: Props) {
  const [state, setState] = useState<FetchState>({ status: 'loading' })
  const cache = useRef<Map<string, JurisdictionBriefing | null>>(new Map())
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setState({ status: 'loading' })
    let cancelled = false

    const code = countryIso2.toUpperCase()

    if (cache.current.has(code)) {
      setState({ status: 'ok', briefing: cache.current.get(code)! })
      return
    }

    // Throw on a real PostgREST/transport error so it surfaces as the retryable
    // error state. A clean empty result (`[]`) returns null — genuine "no briefing".
    function firstOrThrow(
      result: { data: JurisdictionBriefing[] | null; error: { message: string } | null },
      label: string,
    ): JurisdictionBriefing | null {
      if (result.error) {
        // Real failure (auth, RLS, network, schema) — do NOT mask as "no briefing".
        throw new Error(`cc_jurisdiction_briefings[${label}]: ${result.error.message}`)
      }
      return result.data?.[0] ?? null
    }

    // NOTE: we use `.limit(1)` returning an ARRAY, never `.maybeSingle()`.
    // PostgREST returns HTTP 406 for the single-object accept header when zero
    // rows match; supabase-js surfaces that as an error, making a genuinely
    // empty briefing indistinguishable from a real transport failure (the root
    // cause of every jurisdiction rendering "no briefing on file"). An array
    // select makes an empty result a clean `[]` (HTTP 200); only true errors throw.
    async function load(): Promise<JurisdictionBriefing | null> {
      const db = getClient()

      if (code.includes('-')) {
        const parentIso2 = code.split('-')[0]

        const stateRes = await db
          .from('cc_jurisdiction_briefings')
          .select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2)
          .eq('state_iso2', code)
          .order('last_reviewed_date', { ascending: false })
          .limit(1)
          .returns<JurisdictionBriefing[]>()
        const stateRow = firstOrThrow(stateRes, 'state')
        if (stateRow) return stateRow

        const countryRes = await db
          .from('cc_jurisdiction_briefings')
          .select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2)
          .eq('jurisdiction_type', 'country')
          .order('last_reviewed_date', { ascending: false })
          .limit(1)
          .returns<JurisdictionBriefing[]>()
        return firstOrThrow(countryRes, 'country-fallback')
      }

      const res = await db
        .from('cc_jurisdiction_briefings')
        .select(BRIEFING_SELECT)
        .eq('country_iso2', code)
        .eq('jurisdiction_type', 'country')
        .order('last_reviewed_date', { ascending: false })
        .limit(1)
        .returns<JurisdictionBriefing[]>()
      return firstOrThrow(res, 'country')
    }

    // PATCH: guard the fetch with a client-side timeout. Without this a hung
    // request (never resolving, never rejecting) leaves `state` stuck on
    // 'loading' forever — the gold spinner that never clears. On timeout we
    // reject into the existing retryable error state.
    withRetry(() => withTimeout(load(), FETCH_TIMEOUT_MS, `briefing:${code}`), FETCH_RETRY_BACKOFFS_MS)
      .then((briefing) => {
        if (cancelled) return
        cache.current.set(code, briefing)
        setState({ status: 'ok', briefing })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('[MarketOverviewSheet] fetch failed:', err)
        setState({ status: 'error' })
      })

    return () => { cancelled = true }
  }, [countryIso2, retryKey])

  const isLoading = state.status === 'loading'
  const briefing  = state.status === 'ok' ? state.briefing : null

  const title = isLoading
    ? 'Loading regulatory overview…'
    : (briefing?.program_status ?? 'Market overview')

  return (
    <RouterBottomSheet
      eyebrow={countryName.toUpperCase()}
      title={title}
      size="search"
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onEnter}
          disabled={isLoading}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#c6a55a] px-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d] shadow-[0_0_34px_rgba(198,165,90,0.18)] transition hover:bg-[#d4b46a] disabled:opacity-40"
        >
          Enter {countryName} Market
        </button>
      }
    >
      {/* ── Loading ── */}
      {state.status === 'loading' && (
        <div className="flex items-center gap-3 py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c6a55a]/40 border-t-[#c6a55a]" />
          <span className="text-sm text-white/50">Fetching regulatory data…</span>
        </div>
      )}

      {/* ── Error ── */}
      {state.status === 'error' && (
        <div className="grid gap-3 py-4">
          <p className="text-sm leading-6 text-white/50">
            Could not load regulatory data. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              cache.current.delete(countryIso2.toUpperCase())
              setRetryKey((k) => k + 1)
            }}
            className="self-start text-xs font-semibold uppercase tracking-widest text-[#c6a55a] hover:text-[#d4b46a]"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Data ── */}
      {state.status === 'ok' && briefing && (
        <dl className="grid gap-5">
          {briefing.public_summary && (
            <div className="grid gap-1">
              <dt className="sr-only">Overview</dt>
              <dd className="text-sm leading-6 text-[#f5f1e8]/90">{briefing.public_summary}</dd>
            </div>
          )}

          <div className="h-px bg-[#c6a55a]/14" />

          {briefing.patient_access && (
            <BriefingSection label="Patient Access"     text={briefing.patient_access} />
          )}
          {briefing.physician_access && (
            <BriefingSection label="Physician Access"   text={briefing.physician_access} />
          )}
          {briefing.market_dynamics && (
            <BriefingSection label="Market Dynamics"    text={briefing.market_dynamics} />
          )}
          {briefing.regulatory_outlook && (
            <BriefingSection label="Regulatory Outlook" text={briefing.regulatory_outlook} />
          )}
          {briefing.regulatory_body && (
            <BriefingSection label="Regulatory Body"    text={briefing.regulatory_body} />
          )}

          {/* Last reviewed */}
          {briefing.last_reviewed_date && (
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d8be76]/50">
              Last reviewed{' '}
              {new Date(briefing.last_reviewed_date).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </dl>
      )}

      {/* ── Empty ── */}
      {state.status === 'ok' && !briefing && (
        <p className="py-4 text-sm leading-6 text-white/50">
          No regulatory briefing is on file for {countryName} yet. You can still enter the
          market to view available intelligence.
        </p>
      )}
    </RouterBottomSheet>
  )
}
