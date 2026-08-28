'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { CountryIntelProfile, MarketMetric, TradeFlow } from '@/lib/dashboard/dashboardLiveData'
import { buildConfidenceLanes, overallConfidence as computeOverallConfidence, type ConfidenceLane } from '@/lib/dashboard/confidenceScoring'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { formatOpportunityScore } from '@/lib/dashboard/opportunityScore'
import { MyBriefingsPanel } from '@/components/dashboard/MyBriefingsPanel'
import type { CommandPage } from '../types'
import { BRIEFING_ROLE_MODULES } from '../navConfig'
import { fmtStatus } from '../sharedHelpers'
import { GlobeProvider } from '@/components/globe/GlobeProvider'

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

export const BriefingRoom = React.memo(function BriefingRoom({
  country,
  region,
  role,
  countryIntel,
  intelLoading = false,
  signals,
  marketMetrics = [],
  tradeFlows = [],
  confidence,
  onCountrySelect,
  onPageChange,
}: {
  country:          { iso2: string; label: string }
  region:           string
  role?:            string
  countryIntel?:    CountryIntelProfile | null
  intelLoading?:    boolean
  signals:          DashboardSignal[]
  marketMetrics?:   MarketMetric[]
  tradeFlows?:      TradeFlow[]
  // Real, data-driven confidence lanes computed upstream in CommandCentre from
  // the full per-lane data set. Optional: when absent (e.g. a caller that only
  // has country intel in scope) BriefingRoom falls back to computing lanes from
  // the country intel + signals it does have.
  confidence?:      ConfidenceLane[]
  onCountrySelect?: (iso2: string) => void
  onPageChange?:    (page: CommandPage) => void
}) {
  const [focusedIso2, setFocusedIso2] = useState<string | undefined>(undefined)
  const [showMyBriefings, setShowMyBriefings] = useState(false)
  const [aiBriefing, setAiBriefing] = useState<string | null>(null)
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false)
  const [aiBriefingError, setAiBriefingError] = useState(false)
  const confBars = useMemo<ConfidenceLane[]>(
    () => confidence ?? buildConfidenceLanes({ countryIntel, signals, countryLabel: country.label }),
    [confidence, countryIntel, signals, country.label],
  )
  const overall  = useMemo(() => computeOverallConfidence(confBars), [confBars])
  const recentChanges = useMemo(() =>
    signals.slice(0, 3).map(s => ({
      market:  s.market,
      title:   s.title,
      timeAgo: s.timeAgo,
      up:      s.confidence >= 75,
    })),
    [signals],
  )

  React.useEffect(() => {
    const controller = new AbortController()
    setAiBriefing(null)
    setAiBriefingError(false)
    setAiBriefingLoading(true)
    const intelMatches = countryIntel && countryIntel.country_code === country.iso2
    const intel = intelMatches ? {
      medical_status:       countryIntel!.medical_status,
      market_access_status: countryIntel!.market_access_status,
      import_status:        countryIntel!.import_status,
      export_status:        countryIntel!.export_status,
      cultivation_status:   countryIntel!.cultivation_status,
      regulatory_summary:   countryIntel!.regulatory_summary,
      key_risks:            countryIntel!.key_risks,
      opportunity_score:    countryIntel!.opportunity_score,
    } : null
    fetch('/api/dashboard/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryIso2: country.iso2,
        countryLabel: country.label,
        region,
        role: role || 'Operator',
        signals: signals.slice(0, 8).map(s => ({ title: s.title, market: s.market, confidence: s.confidence })),
        intel,
      }),
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { briefing?: string }) => {
        if (d.briefing) setAiBriefing(d.briefing)
        else setAiBriefingError(true)
      })
      .catch(err => {
        if (err?.name !== 'AbortError') setAiBriefingError(true)
      })
      .finally(() => setAiBriefingLoading(false))
    return () => controller.abort()
  }, [country.iso2, country.label, region, role, countryIntel, signals])

  const roleModules = useMemo(() => {
    const r = (role || 'Operator').toLowerCase()
    for (const [key, mods] of Object.entries(BRIEFING_ROLE_MODULES)) {
      if (r.includes(key.toLowerCase()) || key.toLowerCase().includes(r)) return mods
    }
    return BRIEFING_ROLE_MODULES['Operator'] || []
  }, [role])

  return (
    <div className="cc-briefing">
      <div className="cc-briefing-main">
        <div className="cc-briefing-header">
          <div className="cc-briefing-title-row">
            <h1 className="cc-page-title">Briefing Room</h1>
            <button
              type="button"
              className="cc-btn-ghost"
              onClick={() => setShowMyBriefings(v => !v)}
            >
              {showMyBriefings ? 'Hide saved' : 'My briefings'}
            </button>
          </div>
          <p className="cc-page-sub">
            {flagEmoji(country.iso2)} {country.label}
            {region ? ` · ${region}` : ''}
            {role ? ` · ${role}` : ''}
          </p>
        </div>

        {showMyBriefings && (
          <div className="cc-briefing-saved">
            <MyBriefingsPanel />
          </div>
        )}

        <div className="cc-briefing-grid">
          <section className="cc-briefing-card cc-briefing-ai">
            <div className="cc-card-head">AI BRIEFING</div>
            {aiBriefingLoading && <div className="cc-muted">Generating briefing…</div>}
            {aiBriefingError && !aiBriefingLoading && (
              <div className="cc-muted">Briefing unavailable — check signals and country intel.</div>
            )}
            {aiBriefing && !aiBriefingLoading && (
              <div className="cc-briefing-body">{aiBriefing}</div>
            )}
          </section>

          <section className="cc-briefing-card">
            <div className="cc-card-head">CONFIDENCE</div>
            <div className="cc-conf-overall">{overall}%</div>
            <div className="cc-conf-bars">
              {confBars.map(b => (
                <div key={b.lane} className="cc-conf-row">
                  <span className="cc-conf-lane">{b.lane}</span>
                  <div className="cc-conf-track">
                    <div className="cc-conf-fill" style={{ width: `${b.score}%` }} />
                  </div>
                  <span className="cc-conf-score">{b.score}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="cc-briefing-card">
            <div className="cc-card-head">MARKET STATUS</div>
            {intelLoading && <div className="cc-muted">Loading intel…</div>}
            {!intelLoading && countryIntel && countryIntel.country_code === country.iso2 && (
              <div className="cc-status-grid">
                <div><span className="cc-label">Medical</span> {fmtStatus(countryIntel.medical_status)}</div>
                <div><span className="cc-label">Access</span> {fmtStatus(countryIntel.market_access_status)}</div>
                <div><span className="cc-label">Import</span> {fmtStatus(countryIntel.import_status)}</div>
                <div><span className="cc-label">Export</span> {fmtStatus(countryIntel.export_status)}</div>
                <div><span className="cc-label">Cultivation</span> {fmtStatus(countryIntel.cultivation_status)}</div>
                {countryIntel.opportunity_score != null && (
                  <div><span className="cc-label">Opportunity</span> {formatOpportunityScore(countryIntel.opportunity_score)}</div>
                )}
              </div>
            )}
            {!intelLoading && (!countryIntel || countryIntel.country_code !== country.iso2) && (
              <div className="cc-muted">No country intel for {country.label}.</div>
            )}
          </section>

          <section className="cc-briefing-card">
            <div className="cc-card-head">ROLE MODULES</div>
            <ul className="cc-role-mods">
              {roleModules.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="cc-briefing-card cc-briefing-globe">
          <div className="cc-card-head">GLOBE</div>
          <div className="cc-globe-wrap" style={{ height: 280 }}>
            <GlobeProvider>
              <GlobeCanvas
                focusedIso2={focusedIso2 ?? country.iso2}
                onCountryClick={(iso2) => {
                  setFocusedIso2(iso2)
                  onCountrySelect?.(iso2)
                }}
              />
            </GlobeProvider>
          </div>
        </section>

        {marketMetrics.length > 0 && (
          <section className="cc-briefing-card">
            <div className="cc-card-head">MARKET METRICS</div>
            <div className="cc-metrics-row">
              {marketMetrics.slice(0, 6).map((m, i) => (
                <div key={i} className="cc-metric">
                  <span className="cc-metric-label">{m.label ?? m.metric}</span>
                  <span className="cc-metric-val">{m.value}{m.unit ? ` ${m.unit}` : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="cc-briefing-side">
        <div className="cc-right-section">
          <div className="cc-right-head">RECENT SIGNALS</div>
          <div className="cc-signal-list">
            {recentChanges.map((c, i) => (
              <button
                key={i}
                type="button"
                className="cc-signal-item"
                onClick={() => onPageChange?.('signals')}
              >
                <span className={`cc-signal-dot ${c.up ? 'up' : 'down'}`} />
                <span className="cc-signal-title">{c.title}</span>
                <span className="cc-signal-meta">{c.market} · {c.timeAgo}</span>
              </button>
            ))}
            {recentChanges.length === 0 && <div className="cc-muted">No recent signals</div>}
          </div>
          <Link href="#" className="cc-link" onClick={(e) => { e.preventDefault(); onPageChange?.('signals') }}>
            View all signals →
          </Link>
        </div>

        {tradeFlows.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">TRADE FLOWS</div>
            <div className="cc-trade-list">
              {tradeFlows.slice(0, 5).map((t, i) => (
                <div key={i} className="cc-trade-row">
                  <span className="cc-trade-dir">{t.origin_iso2} → {t.destination_iso2}</span>
                  <span className="cc-trade-cat">{t.product_category ?? 'Cannabis'}</span>
                  <span className={`cc-trade-status ${t.legal_status === 'legal' ? 'cc-trade--legal' : 'cc-trade--restricted'}`}>
                    {t.legal_status ?? 'Review'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
})
