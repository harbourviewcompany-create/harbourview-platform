'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { MobileCommandCentreProps } from '../props'
import type { NextAction } from '../contracts'
import { SectionShell, StatusPill, type SectionRef } from '../SectionUI'

export type BriefingCadenceSeed = {
  markets?: string[]
  frequency?: 'daily' | 'weekly'
}

type Cadence = {
  markets?: string[]
  frequency?: 'daily' | 'weekly'
  active?: boolean
}

type SynthBriefing = {
  iso2: string
  briefing: {
    week_ending: string
    generated_at?: string
    headline: string
    summary: string
    what_changed?: string | null
    operator_implications?: string | null
    whats_coming?: string | null
    legal_status?: string
    market_maturity?: string
    signal_count: number
  }
}

type StaticBriefing = {
  iso2: string
  briefing: {
    regulatory_body?: string | null
    program_status?: string | null
    market_dynamics?: string | null
    regulatory_outlook?: string | null
  } | null
}

type PersonalBriefingPayload = {
  cadence?: Cadence
  personal?: {
    narrative?: string
    marketsCovered?: string[]
    source?: 'llm' | 'fallback'
  }
  synthBriefings?: SynthBriefing[]
  staticBriefings?: StaticBriefing[]
}

type LoadState =
  | { status: 'loading'; data: null }
  | { status: 'error'; data: PersonalBriefingPayload | null }
  | { status: 'done'; data: PersonalBriefingPayload }

const STALE_AFTER_MS = 8 * 86_400_000

function clampText(value: string | null | undefined, max: number) {
  const trimmed = (value ?? '').replace(/\s+/g, ' ').trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function timestamp(value: string | undefined) {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function dateLabel(value: string | undefined) {
  const ms = timestamp(value)
  if (ms == null) return 'unknown'
  return new Date(ms).toISOString().slice(0, 10)
}

function latestSynthesis(rows: SynthBriefing[]) {
  return [...rows].sort((a, b) => {
    const aMs = timestamp(a.briefing.generated_at) ?? timestamp(a.briefing.week_ending) ?? 0
    const bMs = timestamp(b.briefing.generated_at) ?? timestamp(b.briefing.week_ending) ?? 0
    return bMs - aMs
  })[0]
}

function pickContextSynthesis(rows: SynthBriefing[], countryIso2: string | undefined) {
  if (countryIso2) {
    return rows.find(row => row.iso2.toUpperCase() === countryIso2.toUpperCase())
  }
  return latestSynthesis(rows)
}

export function PersonalBriefingSection({
  sectionRef,
  roleShort,
  countryLabel,
  countryIso2,
  narrative,
  marketplaceCount,
  signalCount,
  pipelineTotal,
  actionCount,
  reviewStatus,
  sourceCoverageCount,
  nextAction,
  initialCadence,
}: {
  sectionRef: SectionRef
  roleShort: string
  countryLabel: string
  countryIso2?: string
  narrative: string
  marketplaceCount: number
  signalCount: number
  pipelineTotal: number
  actionCount: number
  signals: MobileCommandCentreProps['signals']
  reviewStatus: string
  sourceCoverageCount: number
  nextAction?: NextAction
  initialCadence?: BriefingCadenceSeed
}) {
  const [state, setState] = useState<LoadState>({ status: 'loading', data: null })
  const [marketsInput, setMarketsInput] = useState(() => initialCadence?.markets?.join(', ') ?? '')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(() =>
    initialCadence?.frequency === 'weekly' ? 'weekly' : 'daily',
  )
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const applyPayload = useCallback((payload: PersonalBriefingPayload) => {
    if (Array.isArray(payload.cadence?.markets)) setMarketsInput(payload.cadence!.markets!.join(', '))
    if (payload.cadence?.frequency === 'daily' || payload.cadence?.frequency === 'weekly') {
      setFrequency(payload.cadence.frequency)
    }
  }, [])

  const loadBriefing = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/my-briefings', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('briefing load failed')
      const payload = await response.json() as PersonalBriefingPayload
      applyPayload(payload)
      setState({ status: 'done', data: payload })
    } catch {
      setState(previous => ({ status: 'error', data: previous.data }))
    }
  }, [applyPayload])

  useEffect(() => {
    void loadBriefing()
  }, [loadBriefing])

  const synthBriefings = state.data?.synthBriefings ?? []
  const staticBriefings = state.data?.staticBriefings ?? []
  const contextSynthesis = useMemo(
    () => pickContextSynthesis(synthBriefings, countryIso2),
    [countryIso2, synthBriefings],
  )
  const newestAt = contextSynthesis?.briefing.generated_at ?? contextSynthesis?.briefing.week_ending
  const newestMs = timestamp(newestAt)
  const isStale = state.status !== 'done' || newestMs == null || Date.now() - newestMs > STALE_AFTER_MS

  const personalNarrative = clampText(state.data?.personal?.narrative || narrative, 600)
  const whatChanged = clampText(
    contextSynthesis?.briefing.what_changed || contextSynthesis?.briefing.headline,
    180,
  )
  const whyItMatters = clampText(contextSynthesis?.briefing.operator_implications, 180)

  async function saveCadence() {
    setSaving(true)
    setSaveMsg(null)
    const markets = marketsInput
      .split(/[,\s]+/)
      .map(value => value.trim().toUpperCase())
      .filter(value => /^[A-Z]{2}$/.test(value))

    try {
      const response = await fetch('/api/dashboard/briefing-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markets, frequency, active: true }),
      })
      if (!response.ok) throw new Error('save failed')
      setSaveMsg('Cadence saved.')
      await loadBriefing()
    } catch {
      setSaveMsg('Could not save cadence. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionShell
      id="personal-briefing"
      sectionRef={sectionRef}
      eyebrow="Intel"
      title={`${roleShort} briefing · ${countryLabel}`}
      description="Current personal synthesis, jurisdiction briefings, evidence freshness and delivery cadence."
    >
      <div className="hvm2-intel-topline-left" aria-label="Briefing freshness">
        <StatusPill tone={isStale ? 'warn' : 'ok'}>{isStale ? 'Stale' : 'Current'}</StatusPill>
        <StatusPill tone="neutral">
          {state.status === 'loading'
            ? 'Refreshing…'
            : contextSynthesis
              ? `Generated ${dateLabel(contextSynthesis.briefing.generated_at)} · week ${contextSynthesis.briefing.week_ending}`
              : countryIso2
                ? `No generated ${countryIso2.toUpperCase()} synthesis`
                : 'No generated synthesis'}
        </StatusPill>
      </div>

      {state.status === 'error' ? (
        <p className="hvm2-briefing-meta" role="status">
          Briefing refresh is unavailable. The text below is fallback context and is not marked current.
        </p>
      ) : null}

      <div className="hvm2-briefing-decision-grid" aria-label="Briefing decision summary">
        <article>
          <span>What changed</span>
          <strong>{whatChanged || 'No current synthesized change is available.'}</strong>
        </article>
        <article>
          <span>Why it matters</span>
          <strong>{whyItMatters || 'No current operator implication is available.'}</strong>
        </article>
      </div>

      <article className="hvm2-narrative-card hvm2-briefing-narrative">
        <span className="hvm2-intel-kicker">Personal synthesis</span>
        <p>{personalNarrative || 'No personal synthesis has been generated yet.'}</p>
        <div className="hvm2-narrative-grid">
          <div><span>Commercial records</span><strong>{marketplaceCount}</strong></div>
          <div><span>Fresh signals</span><strong>{signalCount}</strong></div>
          <div><span>Pipeline items</span><strong>{pipelineTotal}</strong></div>
          <div><span>Action queue</span><strong>{actionCount}</strong></div>
        </div>
        <p className="hvm2-briefing-meta">
          Evidence: {reviewStatus || 'Unknown'}
          {sourceCoverageCount > 0 ? ` · ${sourceCoverageCount} source${sourceCoverageCount === 1 ? '' : 's'}` : ''}
          {state.data?.personal?.source ? ` · synthesis ${state.data.personal.source}` : ''}
          {nextAction?.href ? <> · <Link className="hvm2-text-link" href={nextAction.href}>Open action →</Link></> : null}
        </p>
      </article>

      <div className="hvm2-briefing-cadence" aria-label="Briefing cadence">
        <span className="hvm2-intel-kicker">Briefing cadence</span>
        <p>Markets (ISO2) and how often to synthesize this briefing.</p>
        <div className="hvm2-cadence-row">
          <label>
            <span>Markets</span>
            <input
              value={marketsInput}
              onChange={event => setMarketsInput(event.target.value)}
              placeholder="CA, DE, AU"
              autoComplete="off"
              spellCheck={false}
              aria-label="Markets comma-separated ISO2"
            />
          </label>
          <label>
            <span>Frequency</span>
            <select
              value={frequency}
              onChange={event => setFrequency(event.target.value as 'daily' | 'weekly')}
              aria-label="Briefing frequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>
        <button type="button" className="hvm2-cadence-save" onClick={saveCadence} disabled={saving}>
          {saving ? 'Saving…' : 'Save cadence'}
        </button>
        {saveMsg ? <p className="hvm2-cadence-msg" role="status">{saveMsg}</p> : null}
      </div>

      <div className="hvm2-intel-record-list" aria-label="Current synthesized market briefings">
        {synthBriefings.map(({ iso2, briefing }) => (
          <article className="hvm2-intel-record-card" key={`synth-${iso2}`}>
            <span className="hvm2-intel-record-type">{iso2} · week {briefing.week_ending}</span>
            <strong>{briefing.headline}</strong>
            <p>{clampText(briefing.summary, 320)}</p>
            {briefing.operator_implications ? <p>{clampText(briefing.operator_implications, 240)}</p> : null}
            <small>
              Generated {dateLabel(briefing.generated_at)} · {briefing.signal_count} signal{briefing.signal_count === 1 ? '' : 's'}
            </small>
          </article>
        ))}
      </div>

      {staticBriefings.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label="Published orientation briefings">
          {staticBriefings.map(({ iso2, briefing }) => (
            <article className="hvm2-intel-record-card" key={`orientation-${iso2}`}>
              <span className="hvm2-intel-record-type">{iso2} · orientation</span>
              <strong>{briefing?.regulatory_body || `${iso2} jurisdiction briefing`}</strong>
              <p>{clampText(
                briefing?.program_status || briefing?.market_dynamics || briefing?.regulatory_outlook || 'Published jurisdiction orientation available.',
                280,
              )}</p>
            </article>
          ))}
        </div>
      ) : null}
    </SectionShell>
  )
}
