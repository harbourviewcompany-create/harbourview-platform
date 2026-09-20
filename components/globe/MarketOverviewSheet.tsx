'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { RouterBottomSheet } from './RouterBottomSheet'
import { hvPanelPrimaryCtaClass } from '@/components/ui/HarbourviewPanel'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import type { JurisdictionBriefing } from '@/lib/globe/jurisdictionBriefingTypes'
import { BRIEFING_SELECT } from '@/lib/globe/jurisdictionBriefingTypes'
import { useGlobe } from './GlobeProvider'

function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any, 'api'>(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

const FETCH_TIMEOUT_MS = 7_000
const FETCH_RETRY_BACKOFFS_MS = [800, 2000] as const

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms)
    promise.then((value) => { clearTimeout(timer); resolve(value) }, (err) => { clearTimeout(timer); reject(err) })
  })
}

async function withRetry<T>(attempt: () => Promise<T>, backoffsMs: readonly number[]): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= backoffsMs.length; i++) {
    try { return await attempt() } catch (err) {
      lastErr = err
      if (i < backoffsMs.length) await new Promise((resolve) => setTimeout(resolve, backoffsMs[i]))
    }
  }
  throw lastErr
}

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
    <div className="grid gap-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--hv-gold-light)]/72">{label}</dt>
      <dd className="text-sm leading-6 text-[color:var(--hv-ivory)]/80">{text}</dd>
    </div>
  )
}

function SignalMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5">
      <div className="text-lg font-semibold text-[color:var(--hv-ivory)]">{value}</div>
      <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/38">{label}</div>
    </div>
  )
}

function compactProgramStatus(value: string | null | undefined) {
  const text = value?.trim()
  if (!text) return 'Market framework'
  const firstSentence = text.split(/(?<=[.!?])\s+/)[0]
  return firstSentence.length <= 150 ? firstSentence : `${firstSentence.slice(0, 147).trimEnd()}…`
}

export function MarketOverviewSheet({ countryIso2, countryName, onEnter, onBack }: Props) {
  const [state, setState] = useState<FetchState>({ status: 'loading' })
  const [expanded, setExpanded] = useState(false)
  const cache = useRef<Map<string, JurisdictionBriefing | null>>(new Map())
  const [retryKey, setRetryKey] = useState(0)
  const { liveData } = useGlobe()

  const signalList = useMemo(
    () => liveData.signalsByIso2[countryIso2.toUpperCase()] ?? [],
    [liveData.signalsByIso2, countryIso2],
  )
  const signalCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const signal of signalList) {
      const key = (signal.cat ?? 'market').toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [signalList])

  useEffect(() => {
    setState({ status: 'loading' })
    let cancelled = false
    const code = countryIso2.toUpperCase()

    if (cache.current.has(code)) {
      setState({ status: 'ok', briefing: cache.current.get(code)! })
      return
    }

    function firstOrThrow(
      result: { data: JurisdictionBriefing[] | null; error: { message: string } | null },
      label: string,
    ): JurisdictionBriefing | null {
      if (result.error) throw new Error(`cc_jurisdiction_briefings[${label}]: ${result.error.message}`)
      return result.data?.[0] ?? null
    }

    async function load(): Promise<JurisdictionBriefing | null> {
      const db = getClient()
      if (code.includes('-')) {
        const parentIso2 = code.split('-')[0]
        const stateRes = await db.from('cc_jurisdiction_briefings').select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2).eq('state_iso2', code)
          .order('last_reviewed_date', { ascending: false }).limit(1).returns<JurisdictionBriefing[]>()
        const stateRow = firstOrThrow(stateRes, 'state')
        if (stateRow) return stateRow

        const countryRes = await db.from('cc_jurisdiction_briefings').select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2).eq('jurisdiction_type', 'country')
          .order('last_reviewed_date', { ascending: false }).limit(1).returns<JurisdictionBriefing[]>()
        return firstOrThrow(countryRes, 'country-fallback')
      }

      const res = await db.from('cc_jurisdiction_briefings').select(BRIEFING_SELECT)
        .eq('country_iso2', code).eq('jurisdiction_type', 'country')
        .order('last_reviewed_date', { ascending: false }).limit(1).returns<JurisdictionBriefing[]>()
      return firstOrThrow(res, 'country')
    }

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
  const briefing = state.status === 'ok' ? state.briefing : null
  const commandReturn = `/dashboard?country=${encodeURIComponent(countryIso2)}&page=briefing&section=overview`
  const parentCountry = countryIso2.split('-')[0]
  const createOrgHref = `/organization/new?country=${encodeURIComponent(parentCountry)}&returnTo=${encodeURIComponent(commandReturn)}`
  const title = `${countryName} market`
  const reviewed = briefing?.last_reviewed_date
    ? new Date(briefing.last_reviewed_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  return (
    <RouterBottomSheet
      eyebrow={countryName.toUpperCase()}
      title={title}
      size={expanded ? 'search' : 'market'}
      onBack={onBack}
      footer={
        <div className="grid gap-2.5">
          <button type="button" onClick={onEnter} disabled={isLoading} className={hvPanelPrimaryCtaClass}>
            Enter {countryName} market
          </button>
          <div className="flex items-center justify-center gap-5 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <Link href={`/login?next=${encodeURIComponent(commandReturn)}`} className="text-[color:var(--hv-gold-light)]/80">Sign in</Link>
            <Link href={`/login?mode=signup&next=${encodeURIComponent(commandReturn)}`} className="text-[color:var(--hv-gold-light)]/80">Create account</Link>
            <Link href={createOrgHref} className="text-[color:var(--hv-gold-light)]/80">Create organization</Link>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2 rounded-2xl border border-[color:var(--hv-gold)]/18 bg-[color:var(--hv-gold)]/[0.045] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--hv-gold-light)]/78">Market access</span>
            {reviewed ? <span className="text-[9px] uppercase tracking-[0.14em] text-white/35">Reviewed {reviewed}</span> : null}
          </div>
          <p className="text-sm font-medium leading-5 text-[color:var(--hv-ivory)]">
            {isLoading ? 'Loading market framework…' : compactProgramStatus(briefing?.program_status)}
          </p>
          {briefing?.regulatory_body ? (
            <p className="text-[11px] leading-5 text-white/45">{briefing.regulatory_body}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SignalMetric label="Live signals" value={signalList.length} />
          <SignalMetric label="Regulatory" value={signalCounts.get('regulatory') ?? signalCounts.get('regulation') ?? 0} />
          <SignalMetric label="Trade / market" value={(signalCounts.get('trade') ?? 0) + (signalCounts.get('market') ?? 0)} />
        </div>

        {briefing?.public_summary ? (
          <div className="grid gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--hv-gold-light)]/72">Market snapshot</p>
            <p className="text-sm leading-6 text-[color:var(--hv-ivory)]/82">{briefing.public_summary}</p>
          </div>
        ) : null}

        {signalList.length > 0 ? (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--hv-gold-light)]/72">Live intelligence</p>
              <span className="text-[9px] uppercase tracking-[0.12em] text-emerald-300/70">Live</span>
            </div>
            <div className="grid gap-2">
              {signalList.slice(0, expanded ? 5 : 2).map((signal) => (
                <article key={signal.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hv-gold-light)]/68">{signal.cat ?? 'Market'}</span>
                    <time className="text-[9px] text-white/30">{new Date(signal.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</time>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-white/75">{signal.headline}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="min-h-10 rounded-full border border-[color:var(--hv-gold)]/22 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hv-gold-light)]/82 transition hover:bg-white/[0.04]"
        >
          {expanded ? 'Collapse market intelligence' : 'View market intelligence'}
        </button>

        {expanded && briefing ? (
          <dl className="grid gap-5 border-t border-[color:var(--hv-gold)]/12 pt-4">
            {briefing.patient_access && <BriefingSection label="Patient access" text={briefing.patient_access} />}
            {briefing.physician_access && <BriefingSection label="Physician access" text={briefing.physician_access} />}
            {briefing.market_dynamics && <BriefingSection label="Market dynamics" text={briefing.market_dynamics} />}
            {briefing.regulatory_outlook && <BriefingSection label="Regulatory outlook" text={briefing.regulatory_outlook} />}
            {briefing.regulatory_body && <BriefingSection label="Regulatory body" text={briefing.regulatory_body} />}
            {briefing.confidence_score != null ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
                  <span className="text-white/42">Briefing confidence</span>
                  <span className="text-[color:var(--hv-gold-light)]">{briefing.confidence_score}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-[color:var(--hv-gold)]" style={{ width: `${Math.max(0, Math.min(100, briefing.confidence_score))}%` }} />
                </div>
              </div>
            ) : null}
          </dl>
        ) : null}

        {state.status === 'error' ? (
          <div className="rounded-xl border border-red-500/15 bg-red-900/10 p-3 text-sm text-red-200/75">
            Could not load the market briefing.
            <button type="button" onClick={() => { cache.current.delete(countryIso2.toUpperCase()); setRetryKey((k) => k + 1) }} className="ml-2 font-semibold text-[color:var(--hv-gold-light)]">Retry</button>
          </div>
        ) : null}

        {state.status === 'ok' && !briefing ? (
          <p className="text-xs leading-5 text-white/45">No formal briefing is on file yet. Available live intelligence remains accessible above.</p>
        ) : null}
      </div>
    </RouterBottomSheet>
  )
}
