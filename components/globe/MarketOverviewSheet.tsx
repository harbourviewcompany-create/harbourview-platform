'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { RouterBottomSheet } from './RouterBottomSheet'
import { getSupabaseUrl, getSupabasePublicClientKey } from '@/lib/supabase/env'
import type { JurisdictionBriefing } from '@/lib/globe/jurisdictionBriefingTypes'
import { BRIEFING_SELECT } from '@/lib/globe/jurisdictionBriefingTypes'

/** Lazy singleton — reuses one client instance for the lifetime of the page. */
function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
  })
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
    <div className="grid gap-1">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8be76]/72">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-[#f5f1e8]/80">{text}</dd>
    </div>
  )
}

// ── Confidence ring ────────────────────────────────────────────────────────────
// Rendered only when confidence_score is a number. Gracefully absent when NULL.

const RING_R = 18
const RING_CIRC = 2 * Math.PI * RING_R

function scoreColor(score: number): string {
  if (score >= 80) return '#6daa45'  // green — high confidence
  if (score >= 55) return '#c6a55a'  // gold  — moderate
  return '#a13544'                    // red   — low
}

function ConfidenceRing({ score, categories }: {
  score: number
  categories: JurisdictionBriefing['confidence_categories']
}) {
  const dash = (score / 100) * RING_CIRC
  const gap  = RING_CIRC - dash
  const color = scoreColor(score)

  return (
    <div className="grid gap-3">
      {/* Overall ring + label */}
      <div className="flex items-center gap-4">
        <svg width="48" height="48" viewBox="0 0 48 48" aria-label={`Confidence score ${score}%`}>
          {/* Track */}
          <circle
            cx="24" cy="24" r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          {/* Arc */}
          <circle
            cx="24" cy="24" r={RING_R}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={RING_CIRC * 0.25}  /* start at 12 o'clock */
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text
            x="24" y="28"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={color}
          >
            {Math.round(score)}
          </text>
        </svg>
        <div className="grid gap-0.5">
          <span className="text-xs font-semibold text-[#f5f1e8]/80">Data Confidence</span>
          <span className="text-[10px] uppercase tracking-widest text-[#d8be76]/50">
            {score >= 80 ? 'High' : score >= 55 ? 'Moderate' : 'Low'}
          </span>
        </div>
      </div>

      {/* Per-category bars — only when categories are present */}
      {categories && categories.length > 0 && (
        <div className="grid gap-2">
          {categories.map((cat) => (
            <div key={cat.label} className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#d8be76]/60">
                  {cat.label}
                </span>
                <span className="text-[10px] text-[#f5f1e8]/50">
                  {cat.pct != null ? `${cat.pct}%` : '—'}
                </span>
              </div>
              <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/8">
                {cat.pct != null && (
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.pct}%`,
                      background: scoreColor(cat.pct),
                      transition: 'width 0.5s ease',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

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

    async function load(): Promise<JurisdictionBriefing | null> {
      const db = getClient()

      if (code.includes('-')) {
        const parentIso2 = code.split('-')[0]

        const { data: stateRow, error: stateErr } = await db
          .from('cc_jurisdiction_briefings')
          .select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2)
          .eq('state_iso2', code)
          .order('last_reviewed_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (stateErr) console.error('[MarketOverviewSheet] subnational fetch:', stateErr.message)
        if (stateRow) return stateRow as unknown as JurisdictionBriefing

        const { data: countryRow, error: countryErr } = await db
          .from('cc_jurisdiction_briefings')
          .select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2)
          .eq('jurisdiction_type', 'country')
          .order('last_reviewed_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (countryErr) console.error('[MarketOverviewSheet] country fallback fetch:', countryErr.message)
        return (countryRow as unknown as JurisdictionBriefing | null) ?? null
      }

      const { data, error } = await db
        .from('cc_jurisdiction_briefings')
        .select(BRIEFING_SELECT)
        .eq('country_iso2', code)
        .eq('jurisdiction_type', 'country')
        .order('last_reviewed_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) console.error('[MarketOverviewSheet] country fetch:', error.message)
      return (data as unknown as JurisdictionBriefing | null) ?? null
    }

    load()
      .then((briefing) => {
        if (cancelled) return
        cache.current.set(code, briefing)
        setState({ status: 'ok', briefing })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('[MarketOverviewSheet] unexpected error:', err)
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

          {/* Confidence — only when scored */}
          {briefing.confidence_score != null && (
            <>
              <div className="h-px bg-[#c6a55a]/14" />
              <ConfidenceRing
                score={briefing.confidence_score}
                categories={briefing.confidence_categories}
              />
            </>
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
