'use client'

import { useEffect, useState } from 'react'
import { EmptyState, Metric, StatusPill } from './SectionUI'

type CorpusHit = {
  signalId: string
  title: string
  market: string
  matchedKeywords: string[]
  signalDate: string
  confidence: string | null
  source: 'corpus'
}

type Registry = {
  count: number
  ready: boolean
  claimBoundary: string
}

type Payload = {
  corpusHits?: CorpusHit[]
  activeRuleCount?: number
  jurisdictionRegistry?: Registry
  note?: string
}

/**
 * Fetches org keyword matches against the public reviewed corpus
 * (beyond the session-sliced Command Centre feed).
 */
export function CorpusWatchPanel() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hits, setHits] = useState<CorpusHit[]>([])
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [note, setNote] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/watch-hits', { credentials: 'same-origin' })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = (await res.json()) as Payload
        if (cancelled) return
        setHits(Array.isArray(data.corpusHits) ? data.corpusHits : [])
        setRegistry(data.jurisdictionRegistry ?? null)
        setNote(data.note ?? '')
        setState('ready')
      } catch {
        if (!cancelled) setState('error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <section aria-labelledby="hvm2-corpus-watch" className="hvm2-local-intel-groups">
      <div className="hvm2-intel-group-heading">
        <span>Beyond session</span>
        <strong id="hvm2-corpus-watch">Corpus rule matches</strong>
        <small>{state === 'loading' ? 'Loading…' : `${hits.length} hits`}</small>
      </div>

      {registry ? (
        <div className="hvm2-metric-grid hvm2-regulatory-metrics">
          <Metric
            label="Jurisdiction registry"
            value={registry.ready ? registry.count : 0}
            detail={registry.ready ? 'Identity rows live' : 'Not ready'}
          />
          <Metric label="Corpus hits" value={hits.length} detail="Reviewed public feed" />
        </div>
      ) : null}

      {registry?.ready ? (
        <article className="hvm2-note">
          <StatusPill tone="ok">Jurisdiction identity live</StatusPill>
          <p>
            {registry.count} identity rows available ({registry.claimBoundary}). Decision Intel Stage 0 still requires
            separate merge and migration apply — this does not publish dossiers by itself.
          </p>
        </article>
      ) : registry && !registry.ready ? (
        <article className="hvm2-note">
          <StatusPill tone="warn">Jurisdiction registry unavailable</StatusPill>
          <p>Canonical jurisdiction identity could not be confirmed for this session.</p>
        </article>
      ) : null}

      {state === 'loading' ? (
        <p className="hvm2-intel-unknown">Scanning public reviewed corpus against active keyword rules…</p>
      ) : null}

      {state === 'error' ? (
        <EmptyState title="Corpus watch unavailable" detail="Could not load reviewed-corpus rule matches for this session." />
      ) : null}

      {state === 'ready' && hits.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label="Corpus watch rule hits">
          {hits.map(hit => (
            <article key={hit.signalId} className="hvm2-intel-record-card">
              <div className="hvm2-intel-meta-row">
                <span>{hit.market}</span>
                {hit.confidence ? <span>{hit.confidence}</span> : null}
                <span>{hit.signalDate}</span>
                <StatusPill>Corpus</StatusPill>
              </div>
              <strong>{hit.title}</strong>
              <p>Matched: {hit.matchedKeywords.join(', ')}</p>
            </article>
          ))}
        </div>
      ) : null}

      {state === 'ready' && hits.length === 0 ? (
        <EmptyState
          title="No corpus matches"
          detail={note || 'Active keyword rules did not hit the current public reviewed feed window.'}
        />
      ) : null}
    </section>
  )
}
