'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { RouterBottomSheet } from './RouterBottomSheet'
import { hvPanelPrimaryCtaClass } from '@/components/ui/HarbourviewPanel'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import type { JurisdictionBriefing } from '@/lib/globe/jurisdictionBriefingTypes'
import { BRIEFING_SELECT } from '@/lib/globe/jurisdictionBriefingTypes'

function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any, 'api'>(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

const FETCH_TIMEOUT_MS = 7_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
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
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--hv-gold-light)]/72">{label}</dt>
      <dd className="text-sm leading-6 text-[color:var(--hv-ivory)]/80">{text}</dd>
    </div>
  )
}

export function MarketOverviewSheet({ countryIso2, countryName, onEnter, onBack }: Props) {
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
  const title = isLoading ? 'Loading regulatory overview…' : (briefing?.program_status ?? 'Market overview')
  const commandReturn = `/dashboard?country=${encodeURIComponent(countryIso2)}&page=briefing&section=overview`
  const parentCountry = countryIso2.split('-')[0]
  const createOrgHref = `/organization/new?country=${encodeURIComponent(parentCountry)}&returnTo=${encodeURIComponent(commandReturn)}`

  return (
    <RouterBottomSheet
      eyebrow={countryName.toUpperCase()}
      title={title}
      size="search"
      onBack={onBack}
      footer={
        <div className="grid gap-3">
          <button
            type="button"
            onClick={onEnter}
            disabled={isLoading}
            className={hvPanelPrimaryCtaClass}
          >
            Enter {countryName} Market
          </button>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <Link href={`/login?next=${encodeURIComponent(commandReturn)}`} className="text-[color:var(--hv-gold-light)]/80 hover:text-[color:var(--hv-gold-light)]">Sign in</Link>
            <Link href={`/login?mode=signup&next=${encodeURIComponent(commandReturn)}`} className="text-[color:var(--hv-gold-light)]/80 hover:text-[color:var(--hv-gold-light)]">Create account</Link>
            <Link href={createOrgHref} className="text-[color:var(--hv-gold-light)]/80 hover:text-[color:var(--hv-gold-light)]">Create organization</Link>
          </div>
        </div>
      }
    >
      {state.status === 'loading' && (
        <div className="flex items-center gap-3 py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--hv-gold)]/40 border-t-[color:var(--hv-gold)]" />
          <span className="text-sm text-white/50">Fetching regulatory data…</span>
        </div>
      )}

      {state.status === 'error' && (
        <div className="grid gap-3 py-4">
          <p className="text-sm leading-6 text-white/50">Could not load regulatory data. Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              cache.current.delete(countryIso2.toUpperCase())
              setRetryKey((k) => k + 1)
            }}
            className="self-start text-xs font-semibold uppercase tracking-widest text-[color:var(--hv-gold)] hover:brightness-110"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === 'ok' && briefing && (
        <dl className="grid gap-5">
          {briefing.public_summary && (
            <div className="grid gap-1">
              <dt className="sr-only">Overview</dt>
              <dd className="text-sm leading-6 text-[color:var(--hv-ivory)]/90">{briefing.public_summary}</dd>
            </div>
          )}
          <div className="h-px bg-[color:var(--hv-gold)]/14" />
          {briefing.patient_access && <BriefingSection label="Patient Access" text={briefing.patient_access} />}
          {briefing.physician_access && <BriefingSection label="Physician Access" text={briefing.physician_access} />}
          {briefing.market_dynamics && <BriefingSection label="Market Dynamics" text={briefing.market_dynamics} />}
          {briefing.regulatory_outlook && <BriefingSection label="Regulatory Outlook" text={briefing.regulatory_outlook} />}
          {briefing.regulatory_body && <BriefingSection label="Regulatory Body" text={briefing.regulatory_body} />}
          {briefing.last_reviewed_date && (
            <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--hv-gold-light)]/50">
              Last reviewed{' '}
              {new Date(briefing.last_reviewed_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </p>
          )}
        </dl>
      )}

      {state.status === 'ok' && !briefing && (
        <p className="py-4 text-sm leading-6 text-white/50">
          No regulatory briefing is on file for {countryName} yet. You can still enter the market to view available intelligence.
        </p>
      )}
    </RouterBottomSheet>
  )
}
