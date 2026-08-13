'use client'

import { useEffect, useState } from 'react'
import { EmptyState, Metric, StatusPill } from './SectionUI'

type CorpusHit = { signalId: string; title: string; market: string; matchedKeywords: string[]; signalDate: string; confidence: string | null; source: 'corpus'; contextual?: boolean; score?: number }
type Registry = { count: number; ready: boolean; claimBoundary: string }
type Payload = { corpusHits?: CorpusHit[]; activeRuleCount?: number; jurisdictionRegistry?: Registry; note?: string; silent?: boolean; scannedAt?: string; feedFreshness?: string; feedAgeHours?: number | null }

export function CorpusWatchPanel({ countryLabel }: { countryLabel?: string }) {
  const [state, setState] = useState<'loading'|'ready'|'error'>('loading')
  const [hits, setHits] = useState<CorpusHit[]>([])
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [note, setNote] = useState('')
  const [silent, setSilent] = useState(false)
  const [scannedAt, setScannedAt] = useState<string | null>(null)
  const [feedFreshness, setFeedFreshness] = useState<string | null>(null)
  const [feedAgeHours, setFeedAgeHours] = useState<number | null>(null)
  const [activeRuleCount, setActiveRuleCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const qs = countryLabel ? `?country=${encodeURIComponent(countryLabel)}` : ''
        const res = await fetch(`/api/dashboard/watch-hits${qs}`, { credentials: 'same-origin' })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json() as Payload
        if (cancelled) return
        setHits(Array.isArray(data.corpusHits) ? data.corpusHits : [])
        setRegistry(data.jurisdictionRegistry ?? null)
        setNote(data.note ?? '')
        setSilent(Boolean(data.silent))
        setScannedAt(data.scannedAt ?? null)
        setFeedFreshness(data.feedFreshness ?? null)
        setFeedAgeHours(typeof data.feedAgeHours === 'number' ? data.feedAgeHours : null)
        setActiveRuleCount(data.activeRuleCount ?? 0)
        setState('ready')
      } catch { if (!cancelled) setState('error') }
    })()
    return () => { cancelled = true }
  }, [countryLabel])

  const scanLabel = scannedAt ? new Date(scannedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
  return <section aria-labelledby="hvm2-corpus-watch" className="hvm2-local-intel-groups">
    <div className="hvm2-intel-group-heading"><span>Beyond session</span><strong id="hvm2-corpus-watch">Corpus rule matches</strong><small>{state === 'loading' ? 'Loading…' : `${hits.length} hits`}</small></div>
    <div className="hvm2-metric-grid hvm2-regulatory-metrics">
      <Metric label="Jurisdiction registry" value={registry?.ready ? registry.count : 0} detail={registry?.ready ? 'Identity rows live' : 'Not confirmed'} />
      <Metric label="Corpus hits" value={hits.length} detail={countryLabel ? `Prioritised for ${countryLabel}` : 'Reviewed public feed'} />
      <Metric label="Active rules" value={activeRuleCount} detail={feedFreshness ? `Feed ${feedFreshness}` : 'Keyword rules'} />
    </div>
    {registry?.ready ? <article className="hvm2-note"><StatusPill tone="ok">Jurisdiction identity live</StatusPill><p>{registry.count} identity rows available ({registry.claimBoundary}).</p></article> : registry ? <article className="hvm2-note"><StatusPill tone="warn">Jurisdiction registry unavailable</StatusPill><p>Canonical jurisdiction identity could not be confirmed for this session.</p></article> : null}
    {state === 'loading' ? <p className="hvm2-intel-unknown">Scanning public reviewed corpus against active keyword rules…</p> : null}
    {state === 'error' ? <EmptyState title="Corpus watch unavailable" detail="Could not load reviewed-corpus rule matches for this session." /> : null}
    {state === 'ready' && hits.length > 0 ? <div className="hvm2-intel-record-list" aria-label="Corpus watch rule hits">{hits.map(hit => <article key={hit.signalId} className="hvm2-intel-record-card"><div className="hvm2-intel-meta-row"><span>{hit.market}</span>{hit.confidence ? <span>{hit.confidence}</span> : null}<span>{hit.signalDate}</span><StatusPill>Corpus</StatusPill>{hit.contextual ? <StatusPill tone="ok">Context</StatusPill> : null}</div><strong>{hit.title}</strong><p>Matched: {hit.matchedKeywords.join(', ')}</p></article>)}</div> : null}
    {state === 'ready' && hits.length === 0 ? <EmptyState title={silent ? 'Watch silence in current window' : 'No corpus matches'} detail={[note || 'Active keyword rules did not hit the current public reviewed feed window.', scanLabel ? `Scanned ${scanLabel}.` : null, feedAgeHours != null ? `Newest feed item ~${Math.round(feedAgeHours)}h old.` : null].filter(Boolean).join(' ')} /> : null}
    {state === 'ready' && scanLabel ? <p className="hvm2-intel-unknown">Last corpus scan {scanLabel}</p> : null}
  </section>
}
