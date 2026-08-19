'use client'

import { useCallback, useEffect, useState } from 'react'

type WatchRule = { id: string; rule_type: string; keywords: string[] }
type StaticBriefing = {
  iso2: string
  briefing: {
    regulatory_body?: string | null
    program_status?: string | null
    market_dynamics?: string | null
    regulatory_outlook?: string | null
  } | null
}
type SynthBriefing = {
  iso2: string
  briefing: {
    week_ending: string
    headline: string
    summary: string
    operator_implications?: string | null
    legal_status: string
    market_maturity: string
    signal_count: number
  }
}
type Cadence = {
  markets: string[]
  frequency: 'daily' | 'weekly'
  active: boolean
  min_confidence: number
  subscriptionId: string | null
}
type MyBriefingsData = {
  activeRules: WatchRule[]
  keywordPool: string[]
  iso2List?: string[]
  cadence?: Cadence
  staticBriefings: StaticBriefing[]
  synthBriefings: SynthBriefing[]
  personal: { narrative: string; marketsCovered: string[]; source: 'llm' | 'fallback' }
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; data: MyBriefingsData }

export function MyBriefingsPanel({ onOpenWatchlist }: { onOpenWatchlist?: () => void }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [marketsInput, setMarketsInput] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [active, setActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    setState({ status: 'loading' })
    fetch('/api/dashboard/my-briefings')
      .then((r) => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      })
      .then((data: MyBriefingsData) => {
        setState({ status: 'done', data })
        if (data.cadence) {
          setMarketsInput(data.cadence.markets.join(', '))
          setFrequency(data.cadence.frequency)
          setActive(data.cadence.active)
        }
      })
      .catch(() => setState({ status: 'error' }))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveCadence() {
    setSaving(true)
    setSaveMsg(null)
    const markets = marketsInput
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{2}$/.test(s))
    try {
      const res = await fetch('/api/dashboard/briefing-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markets, frequency, active }),
      })
      if (!res.ok) throw new Error('save failed')
      setSaveMsg('Cadence saved. Email delivery uses the same subscription as signal digests when active.')
      load()
    } catch {
      setSaveMsg('Could not save cadence. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="cc-empty-state">
        <p>Assembling your briefing…</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="cc-empty-state">
        <p>Could not load your briefings. Try again shortly.</p>
      </div>
    )
  }

  const { activeRules, keywordPool, staticBriefings, synthBriefings, personal } = state.data

  return (
    <div className="cc-mybrief">
      <section className="cc-mybrief-section">
        <h4>Briefing cadence</h4>
        <p className="cc-mybrief-empty" style={{ marginBottom: 12 }}>
          Choose markets (ISO2) and how often Harbourview should synthesize a personal briefing. When
          active, the daily cron can email via Resend (same path as signal digests).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
          <label style={{ fontSize: 12, color: 'rgba(245,240,232,.5)' }}>
            Markets (comma-separated ISO2)
            <input
              value={marketsInput}
              onChange={(e) => setMarketsInput(e.target.value)}
              placeholder="CA, DE, AU"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,.12)',
                background: 'rgba(0,0,0,.35)',
                color: '#f5f0e8',
              }}
            />
          </label>
          <label style={{ fontSize: 12, color: 'rgba(245,240,232,.5)' }}>
            Frequency
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
              style={{
                display: 'block',
                marginTop: 4,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,.12)',
                background: 'rgba(0,0,0,.35)',
                color: '#f5f0e8',
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (include in synthesis + email tick)
          </label>
          <button
            type="button"
            onClick={saveCadence}
            disabled={saving}
            className="cc-right-link"
            style={{ alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving…' : 'Save cadence'}
          </button>
          {saveMsg && <p className="cc-mybrief-empty">{saveMsg}</p>}
        </div>
      </section>

      <section className="cc-mybrief-personal">
        <div className="cc-mybrief-personal-head">
          <h3>Personal synthesis</h3>
          <span
            className={`cc-status-badge cc-status-badge--${personal.source === 'llm' ? 'intel' : 'free'}`}
          >
            {personal.source === 'llm' ? 'LLM' : 'Assembled'}
          </span>
        </div>
        <p className="cc-mybrief-narrative">{personal.narrative}</p>
        {personal.marketsCovered.length > 0 && (
          <div className="cc-mybrief-chips">
            {personal.marketsCovered.map((m) => (
              <span key={m} className="cc-mybrief-chip cc-mybrief-chip--gold">
                {m}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="cc-mybrief-section">
        <h4>Active watch rules ({activeRules.length})</h4>
        {activeRules.length === 0 ? (
          <p className="cc-mybrief-empty">
            No active rules yet.{' '}
            <button
              type="button"
              className="cc-right-link"
              onClick={onOpenWatchlist}
              style={{ display: 'inline' }}
            >
              Add keyword or jurisdiction rules →
            </button>
          </p>
        ) : (
          <ul className="cc-mybrief-rules">
            {activeRules.map((r) => (
              <li key={r.id} className="cc-mybrief-rule">
                <span className="cc-mybrief-rule-type">{r.rule_type.replace(/_/g, ' ')}</span>
                <div className="cc-mybrief-chips">
                  {r.keywords.map((k) => (
                    <span key={k} className="cc-mybrief-chip">
                      {k}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {keywordPool.length > 0 && (
        <section className="cc-mybrief-section">
          <h4>Keyword focus</h4>
          <div className="cc-mybrief-chips">
            {keywordPool.map((k) => (
              <span key={k} className="cc-mybrief-chip cc-mybrief-chip--gold">
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="cc-mybrief-section">
        <h4>Weekly LLM market briefings ({synthBriefings.length})</h4>
        {synthBriefings.length === 0 ? (
          <p className="cc-mybrief-empty">No published weekly synthesis for your watched markets yet.</p>
        ) : (
          <div className="cc-mybrief-grid">
            {synthBriefings.map(({ iso2, briefing }) => (
              <article key={`synth-${iso2}`} className="cc-mybrief-card cc-mybrief-card--synth">
                <div className="cc-mybrief-card-iso">
                  {iso2} · week {briefing.week_ending}
                </div>
                <h5>{briefing.headline}</h5>
                <p>{briefing.summary.slice(0, 320)}</p>
                {briefing.operator_implications && (
                  <p className="cc-mybrief-card-ops">{briefing.operator_implications.slice(0, 220)}</p>
                )}
                <div className="cc-mybrief-card-meta">
                  <span>{briefing.legal_status.replace(/_/g, ' ')}</span>
                  <span>{briefing.market_maturity}</span>
                  <span>{briefing.signal_count} signals</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cc-mybrief-section">
        <h4>Orientation briefings ({staticBriefings.length})</h4>
        {staticBriefings.length === 0 ? (
          <p className="cc-mybrief-empty">
            Add watched markets or jurisdiction keywords to your watch rules to surface published
            orientation briefings here.
          </p>
        ) : (
          <div className="cc-mybrief-grid">
            {staticBriefings.map(({ iso2, briefing }) => (
              <article key={iso2} className="cc-mybrief-card">
                <div className="cc-mybrief-card-iso">{iso2}</div>
                <h5>{briefing?.regulatory_body || `${iso2} jurisdiction briefing`}</h5>
                <p>
                  {(
                    briefing?.program_status ||
                    briefing?.market_dynamics ||
                    briefing?.regulatory_outlook ||
                    'Published jurisdiction briefing available.'
                  ).slice(0, 280)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="cc-mybrief-empty" style={{ marginTop: 16 }}>
        <a href="/dashboard/corridor-plan" className="cc-right-link">
          Open corridor execution plan →
        </a>
        {' · '}
        <a href="/intelligence/logistics-simulator" className="cc-right-link">
          Logistics simulator →
        </a>
      </p>
    </div>
  )
}
