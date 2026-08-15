'use client'

import { useEffect, useState } from 'react'

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
type MyBriefingsData = {
  activeRules: WatchRule[]
  keywordPool: string[]
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

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/my-briefings')
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json() })
      .then((data: MyBriefingsData) => { if (!cancelled) setState({ status: 'done', data }) })
      .catch(() => { if (!cancelled) setState({ status: 'error' }) })
    return () => { cancelled = true }
  }, [])

  if (state.status === 'loading') {
    return <div className="cc-empty-state"><p>Assembling your briefing…</p></div>
  }
  if (state.status === 'error') {
    return <div className="cc-empty-state"><p>Could not load your briefings. Try again shortly.</p></div>
  }

  const { activeRules, keywordPool, staticBriefings, synthBriefings, personal } = state.data

  return (
    <div className="cc-mybrief">
      <section className="cc-mybrief-personal">
        <div className="cc-mybrief-personal-head">
          <h3>Personal synthesis</h3>
          <span className={`cc-status-badge cc-status-badge--${personal.source === 'llm' ? 'intel' : 'free'}`}>
            {personal.source === 'llm' ? 'LLM' : 'Assembled'}
          </span>
        </div>
        <p className="cc-mybrief-narrative">{personal.narrative}</p>
        {personal.marketsCovered.length > 0 && (
          <div className="cc-mybrief-chips">
            {personal.marketsCovered.map(m => <span key={m} className="cc-mybrief-chip cc-mybrief-chip--gold">{m}</span>)}
          </div>
        )}
      </section>

      <section className="cc-mybrief-section">
        <h4>Active watch rules ({activeRules.length})</h4>
        {activeRules.length === 0 ? (
          <p className="cc-mybrief-empty">
            No active rules yet. <button type="button" className="cc-right-link" onClick={onOpenWatchlist} style={{ display: 'inline' }}>Add keyword or jurisdiction rules →</button>
          </p>
        ) : (
          <ul className="cc-mybrief-rules">
            {activeRules.map(r => (
              <li key={r.id} className="cc-mybrief-rule">
                <span className="cc-mybrief-rule-type">{r.rule_type.replace(/_/g, ' ')}</span>
                <div className="cc-mybrief-chips">
                  {r.keywords.map(k => <span key={k} className="cc-mybrief-chip">{k}</span>)}
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
            {keywordPool.map(k => <span key={k} className="cc-mybrief-chip cc-mybrief-chip--gold">{k}</span>)}
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
                <div className="cc-mybrief-card-iso">{iso2} · week {briefing.week_ending}</div>
                <h5>{briefing.headline}</h5>
                <p>{briefing.summary.slice(0, 320)}</p>
                {briefing.operator_implications && <p className="cc-mybrief-card-ops">{briefing.operator_implications.slice(0, 220)}</p>}
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
          <p className="cc-mybrief-empty">Add watched markets or jurisdiction keywords to your watch rules to surface published orientation briefings here.</p>
        ) : (
          <div className="cc-mybrief-grid">
            {staticBriefings.map(({ iso2, briefing }) => (
              <article key={iso2} className="cc-mybrief-card">
                <div className="cc-mybrief-card-iso">{iso2}</div>
                <h5>{briefing?.regulatory_body || `${iso2} jurisdiction briefing`}</h5>
                <p>{(briefing?.program_status || briefing?.market_dynamics || briefing?.regulatory_outlook || 'Published jurisdiction briefing available.').slice(0, 280)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
