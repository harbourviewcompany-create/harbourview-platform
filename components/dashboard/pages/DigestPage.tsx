'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import type { DashboardSignal, DigestWindow } from '@/lib/dashboard/dashboardShared'

type SignalGroup = 'REGULATORY' | 'MARKET ACCESS' | 'SUPPLY CHAIN' | 'TESTING & COMPLIANCE' | 'EXPORT / BUYER MOVEMENT' | 'EVIDENCE UPDATES'

function deriveSignalGroup(title: string, contentType?: string | null): SignalGroup {
  const ct = (contentType ?? '').toLowerCase()
  if (ct === 'research') return 'EVIDENCE UPDATES'
  if (ct === 'market') return 'MARKET ACCESS'
  const t = title.toLowerCase()
  if (/export|import|buyer|gacp|eu.gmp|international/.test(t)) return 'EXPORT / BUYER MOVEMENT'
  if (/test|coa|compliance|qa|quality|lab|microbial|pesticide|threshold/.test(t)) return 'TESTING & COMPLIANCE'
  if (/supply|packaging|shipping|logistics|lead.time|transport/.test(t)) return 'SUPPLY CHAIN'
  if (/retail|dispensary|demand|patient|consumer|pos|sales/.test(t)) return 'MARKET ACCESS'
  if (/study|evidence|research|clinical|terpene|data/.test(t)) return 'EVIDENCE UPDATES'
  return 'REGULATORY'
}

function deriveImpact(conf: number): 'High' | 'Medium' | 'Low' {
  return conf >= 80 ? 'High' : conf >= 65 ? 'Medium' : 'Low'
}

const SIG_GROUP_ICONS: Record<SignalGroup, string> = {
  'REGULATORY':               '◎',
  'MARKET ACCESS':            '⊞',
  'SUPPLY CHAIN':             '⬡',
  'TESTING & COMPLIANCE':     '⬟',
  'EXPORT / BUYER MOVEMENT':  '◈',
  'EVIDENCE UPDATES':         '⊟',
}

const SIG_GROUP_ORDER: SignalGroup[] = [
  'REGULATORY', 'MARKET ACCESS', 'SUPPLY CHAIN',
  'TESTING & COMPLIANCE', 'EXPORT / BUYER MOVEMENT', 'EVIDENCE UPDATES',
]

const DIGEST_WINDOW_COPY: Record<DigestWindow, { kicker: string; sub: string }> = {
  '24h':    { kicker: 'New in the last 24 hours',  sub: 'Fresh reviewed intelligence since yesterday.' },
  '7d':     { kicker: 'This week',                 sub: 'Nothing new in 24h — showing the last 7 days.' },
  '30d':    { kicker: 'This month',                sub: 'Quiet week — showing the last 30 days of reviewed intel.' },
  'recent': { kicker: 'Most recent',               sub: 'No new intel in the recent window — showing the latest reviewed signals.' },
}

function QualityChips({ s }: { s: DashboardSignal }) {
  const chips: string[] = []
  if (s.corroborationCount && s.corroborationCount > 1) {
    chips.push(`${s.corroborationCount} sources reporting`)
  }
  if (s.translated && s.originalLanguageLabel) {
    chips.push(`Translated from ${s.originalLanguageLabel}`)
  }
  if (s.signalContentType && s.signalContentType !== 'regulatory') {
    chips.push(s.signalContentType)
  }
  if (!chips.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {chips.map((c) => (
        <span
          key={c}
          style={{
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#C6A55A',
            border: '1px solid rgba(198,165,90,0.35)',
            background: 'rgba(198,165,90,0.08)',
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export type DigestPageProps = {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  digestSignals?: DashboardSignal[]
  digestWindow?:  DigestWindow
  signals: DashboardSignal[]
}

export const DigestPage = React.memo(function DigestPage({
  country, region, role, digestSignals, digestWindow, signals,
}: DigestPageProps) {
  const [liveSignals, setLiveSignals] = useState<DashboardSignal[] | null>(null)
  const [liveWindow,  setLiveWindow]  = useState<DigestWindow | null>(null)
  const [liveTotal,   setLiveTotal]   = useState<number | null>(null)
  const [isFetching,  setIsFetching]  = useState(false)

  const effectiveSignals = liveSignals ?? digestSignals ?? signals.slice(0, 20)
  const effectiveWindow: DigestWindow = liveWindow ?? digestWindow ?? 'recent'

  React.useEffect(() => {
    let cancelled = false
    async function run() {
      setIsFetching(true)
      try {
        const params = new URLSearchParams({ limit: '20' })
        if (country.label) params.set('country', country.label)
        const res = await fetch(`/api/dashboard/digest?${params.toString()}`)
        if (!res.ok || cancelled) return
        const json = await res.json() as { signals: DashboardSignal[]; window: DigestWindow; total: number; totalReviewed: number; source: string }
        if (!cancelled && Array.isArray(json.signals)) {
          setLiveSignals(json.signals)
          setLiveWindow(json.window)
          setLiveTotal(json.totalReviewed)
        }
      } catch {
        /* keep SSR props on failure — silent degradation */
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [country.label])

  const copy = DIGEST_WINDOW_COPY[effectiveWindow]
  const isStale = effectiveWindow !== '24h'

  const rollup = useMemo(() => {
    const map: Partial<Record<SignalGroup, number>> = {}
    effectiveSignals.forEach(s => {
      const g = deriveSignalGroup(s.title, s.signalContentType)
      map[g] = (map[g] ?? 0) + 1
    })
    return SIG_GROUP_ORDER.filter(g => map[g]).map(g => ({ group: g, n: map[g]! }))
  }, [effectiveSignals])

  const topSignal = useMemo(
    () => [...effectiveSignals].sort((a, b) => {
      const corr = (b.corroborationCount ?? 1) - (a.corroborationCount ?? 1)
      if (corr !== 0) return corr
      return b.confidence - a.confidence
    })[0] ?? null,
    [effectiveSignals],
  )

  return (
    <div className="cc-page">
      <div className="cc-inner-header">
        <h2>Daily Digest — {country.label}{region ? ` · ${region}` : ''}{role ? ` · ${role}` : ''}</h2>
        <p>Your once-a-day read on the freshest quality-gated intelligence for the resolved jurisdiction. {copy.sub}</p>
      </div>

      <div className={`cc-digest-banner${isStale ? ' stale' : ''}`}>
        <span className={`cc-digest-live-dot${isStale ? '' : ' active'}`} aria-hidden="true" />
        <div className="cc-digest-banner-body">
          <strong>{copy.kicker}</strong>
          <small>
            {effectiveSignals.length} signal{effectiveSignals.length !== 1 ? 's' : ''}
            {liveTotal !== null ? ` · ${liveTotal} reviewed in feed` : ''}
            {isFetching ? ' · refreshing…' : ''}
          </small>
        </div>
        {rollup.length > 0 && (
          <div className="cc-digest-rollup">
            {rollup.map(r => (
              <span key={r.group} className="cc-digest-rollup-chip">
                <span aria-hidden="true">{SIG_GROUP_ICONS[r.group]}</span>
                {r.n} {r.group.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {topSignal && (
        <div className="cc-digest-lead">
          <div className="cc-digest-lead-tag">
            {topSignal.contentType === 'editorial'
              ? 'Featured this week'
              : `Lead signal · ${topSignal.confidence}% confidence${
                  topSignal.corroborationCount && topSignal.corroborationCount > 1
                    ? ` · ${topSignal.corroborationCount} sources`
                    : ''
                }`}
          </div>
          <strong>{topSignal.title}</strong>
          <p>{topSignal.commercialImpact}</p>
          <QualityChips s={topSignal} />
          <div className="cc-digest-lead-meta">
            <span>{topSignal.market || country.label}</span>
            <span>·</span>
            <span>{topSignal.timeAgo}</span>
            {topSignal.contentType === 'editorial'
              ? (topSignal.sourceUrl && (
                  <a href={topSignal.sourceUrl} target="_blank" rel="noopener noreferrer" className="cc-digest-lead-link">
                    Read at {topSignal.sourceLabel ?? 'source'} →
                  </a>
                ))
              : <Link href={topSignal.slug ? `/signals/${topSignal.slug}` : '/signals'} className="cc-digest-lead-link">Open brief →</Link>}
          </div>
        </div>
      )}

      <div className="cc-sig-feed">
        {effectiveSignals.length === 0 ? (
          <div className="cc-empty-state">
            No reviewed intelligence available yet. New quality-gated items appear here as the daily pipeline publishes.
          </div>
        ) : (
          effectiveSignals.map((s, i) => {
            if (s.contentType === 'editorial') {
              return (
                <div key={s.id ?? i} className="cc-sig-row" style={{ gridTemplateColumns: '12px 1fr 160px' }}>
                  <span className="cc-sig-dot" style={{ background: '#B8AF9E' }} />
                  <div className="cc-sig-body">
                    <strong>{s.title}</strong>
                    <small>{s.market ? `${s.market} · ` : ''}{s.timeAgo}{s.sourceLabel ? ` · ${s.sourceLabel}` : ''}</small>
                    <span style={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden', fontSize: 11, color: 'var(--cc-muted)', lineHeight: 1.5, marginTop: 4,
                    }}>{s.commercialImpact}</span>
                  </div>
                  <div className="cc-sig-acts">
                    {s.sourceUrl && (
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="cc-sig-brief">Read source</a>
                    )}
                  </div>
                </div>
              )
            }
            const imp  = deriveImpact(s.confidence)
            const circ = 87.96
            return (
              <div key={s.id ?? i} className="cc-sig-row">
                <span className={`cc-sig-dot ${imp.toLowerCase()}`} />
                <div className="cc-sig-body">
                  <strong>{s.title}</strong>
                  <small>
                    {s.market ? `${s.market} · ` : ''}{s.timeAgo}
                    {s.corroborationCount && s.corroborationCount > 1 ? ` · ${s.corroborationCount} sources` : ''}
                    {s.translated && s.originalLanguageLabel ? ` · from ${s.originalLanguageLabel}` : ''}
                  </small>
                  <QualityChips s={s} />
                </div>
                <div className="cc-sig-why">
                  <em>Why it matters</em>
                  <span>{s.commercialImpact || `Affects operations in ${s.market || country.label}`}</span>
                </div>
                <span className={`cc-imp-badge ${imp.toLowerCase()}`}>{imp}</span>
                <svg viewBox="0 0 36 36" className="cc-mini-donut" aria-label={`${s.confidence}% confidence`}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4"/>
                  <circle cx="18" cy="18" r="14" fill="none"
                    stroke={s.confidence>=80?'var(--cc-green)':s.confidence>=65?'var(--cc-amber)':'var(--cc-red)'}
                    strokeWidth="4"
                    strokeDasharray={`${circ*s.confidence/100} ${circ}`}
                    strokeLinecap="round" transform="rotate(-90 18 18)"
                  />
                  <text x="18" y="22" textAnchor="middle" fontSize="9" fill="var(--cc-text)" fontWeight="600">{s.confidence}%</text>
                </svg>
                <div className="cc-sig-acts">
                  <Link href={s.slug ? `/signals/${s.slug}` : '/signals'} className="cc-sig-brief">Open brief</Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="cc-feed-footer">
        <span>Digest window: {copy.kicker.toLowerCase()} · {effectiveSignals.length} shown</span>
        <span className="cc-auto-refresh">
          {isFetching
            ? <><span className="cc-refresh-dot" style={{ background: 'var(--cc-amber)' }}/>Refreshing…</>
            : <><span className="cc-refresh-dot"/>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
        </span>
      </div>
    </div>
  )
})
