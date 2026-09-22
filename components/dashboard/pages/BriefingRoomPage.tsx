'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type {
  CountryIntelProfile,
  MarketMetric,
  PipelineCounts,
  TradeFlow,
} from '@/lib/dashboard/dashboardLiveData'
import {
  buildConfidenceLanes,
  overallConfidence as computeOverallConfidence,
  type ConfidenceLane,
} from '@/lib/dashboard/confidenceScoring'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { formatOpportunityScore } from '@/lib/dashboard/opportunityScore'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { CommandPage } from '../CommandCentre'
import { getRoleCommandDefault } from '@/lib/dashboard/roleCommandDefaults'
import { combinePipelineStatus, pipelineSloMessage } from '@/lib/dashboard/pipelineSlo'
import { formatRate, type MarketplaceFunnelMetrics } from '@/lib/dashboard/marketplaceFunnelMetrics'
import { buildBriefingActions } from '@/lib/dashboard/briefingActions'
import { buildCoverageMapSnapshot, coverageOverridesFromLiveSources } from '@/lib/dashboard/coverageMap'
import { GlobeProvider } from '@/components/globe/GlobeProvider'

const MyBriefingsPanel = dynamic(
  () => import('@/components/dashboard/MyBriefingsPanel').then((m) => ({ default: m.MyBriefingsPanel })),
  { ssr: false },
)
const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

function fmtStatus(v: string | null | undefined, fallback = '—'): string {
  if (!v) return fallback
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── BriefingRoom page ─────────────────────────────────────────────────────────

// Converts any ISO 3166-1 alpha-2 code → emoji flag (all 196 countries)

const BRIEFING_ROLE_MODULES: Record<string, Array<{ page: CommandPage; icon: string; label: string; why: string }>> = {
  'Doctor':      [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Patient prescription framework & clinical authorizations' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Track prescribing and formulary rule changes' },
    { page: 'experts',        icon: '⊛', label: 'Expert Directory',   why: 'Connect with clinical pharmacologists & peers' },
  ],
  'Pharmacist':  [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Dispensing authorization and pharmacy permit chain' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Pharmacy permit renewals and compliance deadlines' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Formulary, scheduling, and dispensing rule updates' },
  ],
  'Budtender':   [
        { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Retail sales rules and age-verification requirements' },
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Available SKUs, new listings, and product mix' },
  ],
  'Cultivator':  [
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Cultivation licence renewal and compliance tracking' },
    { page: 'prices',         icon: '⊞', label: 'Price Intelligence', why: 'Wholesale benchmark pricing for your output markets' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Production approval and GMP certification pathway' },
  ],
  'Geneticist':  [
    { page: 'genetics',       icon: '◈', label: 'Genetics',           why: 'Cultivar passports, phenotype registry, and research' },
    { page: 'evidence',       icon: '⊛', label: 'Evidence Sources',   why: 'Peer-reviewed genetics and pharmacology literature' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Plant variety protection and IP filing requirements' },
  ],
  'Processor':   [
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Processing and extraction licence compliance tracking' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Manufacturing authorization and GMP certification' },
    { page: 'prices',         icon: '⊞', label: 'Price Intelligence', why: 'Distillate and concentrate benchmark pricing' },
  ],
  'Lab/QA':      [
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Testing standards, SOP frameworks, and lab certifications' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'ISO 17025 accreditation and operating licence renewals' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'COA format requirements and potency testing rule changes' },
  ],
  'Importer':    [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Import permit process and customs clearance framework' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Model corridor economics and total landed cost' },
    { page: 'banking',        icon: '⊙', label: 'Banking',            why: 'Cross-border payment infrastructure for trade corridors' },
  ],
  'Exporter':    [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Export licence and narcotics certificate requirements' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Benchmark your export pricing against corridor comps' },
    { page: 'prices',         icon: '◷', label: 'Price Intelligence', why: 'Destination market wholesale reference prices' },
  ],
  'Distributor': [
    { page: 'logistics',      icon: '⬡', label: 'Logistics',          why: 'GDP-certified freight forwarders and cold-chain specialists' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Distribution licence renewals and GDP certification' },
    { page: 'banking',        icon: '⊞', label: 'Banking',            why: 'Treasury and payment rails for multi-market distribution' },
  ],
  'Clinic Op.':  [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Clinical authorization and patient prescription framework' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Clinic operating licence and prescribing authority tracking' },
    { page: 'kyb',            icon: '◫', label: 'KYB Verification',   why: 'Due diligence on suppliers, labs, and clinic partners' },
  ],
  'Retail':      [
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Retail operating and cannabis sales licence management' },
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Available product listings and approved SKUs' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Age verification, signage, and retail compliance rules' },
  ],
  'Compliance':  [
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Jurisdiction playbook, SOP frameworks, and audit readiness' },
    { page: 'kyb',            icon: '◈', label: 'KYB Verification',   why: 'Entity due diligence checklists and verification tracking' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Portfolio-wide licence expiry and renewal management' },
  ],
  'Legal':       [
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Legislative reform tracking and pending consultation alerts' },
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Jurisdiction legal framework and regulatory precedents' },
    { page: 'kyb',            icon: '◈', label: 'KYB Verification',   why: 'AML and entity verification for client onboarding' },
  ],
  'Investor':    [
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Approved listings, deal flow, and operator landscape' },
    { page: 'prices',         icon: '⊞', label: 'Price Intelligence', why: 'Wholesale benchmark pricing driving unit economics' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Market entry difficulty and timeline risk by jurisdiction' },
  ],
  'Regulator':   [
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Cross-jurisdictional reform tracking and comparable markets' },
    { page: 'evidence',       icon: '⊛', label: 'Evidence Sources',   why: 'Scientific evidence base informing regulatory frameworks' },
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Standards and SOPs across regulated jurisdictions' },
  ],
  'Patient Ed.': [
        { page: 'experts',        icon: '⊛', label: 'Expert Directory',   why: 'Find qualified patient educators and healthcare professionals' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Patient access framework for your jurisdiction' },
  ],
  'GMP/QA':      [
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'EU-GMP, ICH Q7, and GACP compliance frameworks' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'GMP certification renewals and inspection due dates' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'GMP-gated export corridor requirements' },
  ],
  'Logistics':   [
    { page: 'logistics',      icon: '⬡', label: 'Logistics',          why: 'Freight forwarders, customs brokers, and narcotics handlers' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Air freight rates, narcotics surcharges, and corridor costs' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Import/export permit chain for each corridor' },
  ],
}

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
  pipeline,
  wantedCount = 0,
  listingCount = 0,
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
  pipeline?:        PipelineCounts | null
  wantedCount?:     number
  listingCount?:    number
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
  const [pipelineHealth, setPipelineHealth] = useState<{
    status: 'healthy' | 'warning' | 'critical' | 'unknown'
    feedAgeHours: number | null
    digestAgeDays: number | null
    alertCount: number
  } | null>(null)
  const [funnelMetrics, setFunnelMetrics] = useState<MarketplaceFunnelMetrics | null>(null)
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

  /** Role playbook modules (max 3) with urgency / deadline from live signals. */
  const priorityActions = useMemo(() => {
    const modules = (role ? BRIEFING_ROLE_MODULES[role] : null) ?? []
    return buildBriefingActions({
      roleShort: role,
      signals,
      playbook: modules.length > 0 ? modules.slice(0, 3) : undefined,
    })
  }, [role, signals])
  const roleFocus = useMemo(() => getRoleCommandDefault(role).focus, [role])
  const coverageMap = useMemo(() => {
    const pipelineOpen = pipeline
      ? (pipeline.wanted ?? 0) + (pipeline.inquiry ?? 0) + (pipeline.proof_review ?? 0) + (pipeline.matched ?? 0) + (pipeline.deal_room ?? 0)
      : 0
    return buildCoverageMapSnapshot(
      country.iso2,
      coverageOverridesFromLiveSources({
        signalCount: signals.length,
        marketplaceCount: listingCount + wantedCount,
        pipelineOpen,
        hasPathway: Boolean(countryIntel?.commercial_pathway_summary),
      }),
    )
  }, [country.iso2, signals.length, listingCount, wantedCount, pipeline, countryIntel?.commercial_pathway_summary])

  React.useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    void Promise.all([
      fetch('/api/dashboard/pipeline-health', { signal })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/dashboard/marketplace-funnel', { signal })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([health, funnel]) => {
      const d = health as {
        status?: 'healthy' | 'warning' | 'critical'
        metrics?: { feed_age_hours?: number | null; digest_age_days?: number | null }
        alerts?: unknown[]
      } | null
      if (!d?.status) {
        setPipelineHealth({ status: 'unknown', feedAgeHours: null, digestAgeDays: null, alertCount: 0 })
      } else {
        setPipelineHealth({
          status: d.status,
          feedAgeHours: d.metrics?.feed_age_hours ?? null,
          digestAgeDays: d.metrics?.digest_age_days ?? null,
          alertCount: Array.isArray(d.alerts) ? d.alerts.length : 0,
        })
      }
      const f = funnel as { metrics?: MarketplaceFunnelMetrics } | null
      if (f?.metrics) setFunnelMetrics(f.metrics)
    })
    return () => controller.abort()
  }, [])

  // Reset AI narrative when context changes; do not auto-fetch (cost + TTI).
  React.useEffect(() => {
    setAiBriefing(null)
    setAiBriefingError(false)
    setAiBriefingLoading(false)
  }, [country.label, country.iso2, role])

  const loadAiBriefing = React.useCallback(() => {
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
      opportunity_score:    countryIntel!.opportunity_score,
      public_summary:       countryIntel!.public_summary,
    } : null
    fetch('/api/ai/briefing', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ country: country.label, role: role ?? '', intel }),
      signal:  controller.signal,
    })
      .then(r => r.json())
      .then((d: { briefing?: string; error?: string }) => {
        if (d.briefing) setAiBriefing(d.briefing)
        else setAiBriefingError(true)
      })
      .catch(err => { if (err?.name !== 'AbortError') setAiBriefingError(true) })
      .finally(() => setAiBriefingLoading(false))
    return () => controller.abort()
  }, [country.label, country.iso2, role, countryIntel])

  if (showMyBriefings) {
    return (
      <div className="cc-page cc-briefing">
        <div className="cc-mybrief-wrap">
          <button type="button" className="cc-signals-search-toggle" style={{ marginBottom: 16 }} onClick={() => setShowMyBriefings(false)}>
            ← Back to jurisdiction briefing
          </button>
          <MyBriefingsPanel onOpenWatchlist={() => onPageChange?.('watchlist')} />
        </div>
      </div>
    )
  }

  return (
    <div className="cc-page cc-briefing">
      <button type="button" className="cc-signals-search-toggle" style={{ position: 'absolute', top: 16, right: 20, zIndex: 5 }} onClick={() => setShowMyBriefings(true)}>
        ◈ My briefings
      </button>

      {/* ── Left: Jurisdiction brief ──────────────────────────────── */}
      <aside className="cc-briefing-left">
        <div className="cc-jx-brief">
          <div className="cc-jx-flag">{flagEmoji(country.iso2)}</div>
          <div>
            <div className="cc-jx-country">{country.label}</div>
            {region && <div className="cc-jx-region">{region}</div>}
          </div>
        </div>

        {countryIntel?.public_summary && (
          <p className="cc-jx-summary">{countryIntel.public_summary}</p>
        )}

        <div className="cc-jx-fields" style={{position:'relative'}}>
          {intelLoading && (
            <div style={{
              position:'absolute',top:0,right:0,
              fontSize:'10px',color:'var(--cc-dim)',
              display:'flex',alignItems:'center',gap:'4px',
            }}>
              <span style={{display:'inline-block',width:'6px',height:'6px',borderRadius:'50%',background:'var(--cc-gold)',opacity:.7,animation:'pulse 1.2s ease-in-out infinite'}}/>
              Refreshing…
            </div>
          )}
          {([
            { icon: '◎', label: 'Medical Program', value: fmtStatus(countryIntel?.medical_status,       'No Active Program') },
            { icon: '⊛', label: 'Market Access',   value: fmtStatus(countryIntel?.market_access_status, 'Status Unknown')    },
            { icon: '↓', label: 'Import Status',   value: fmtStatus(countryIntel?.import_status,        'Not Available')     },
            { icon: '↑', label: 'Export Status',   value: fmtStatus(countryIntel?.export_status,        'Not Available')     },
            { icon: '⊙', label: 'Opportunity',     value: countryIntel?.opportunity_score != null
                ? formatOpportunityScore(countryIntel.opportunity_score)
                : 'Not Scored' },
          ] as { icon: string; label: string; value: string }[]).map(f => (
            <div key={f.label} className="cc-jx-field">
              <span className="cc-jx-field-icon">{f.icon}</span>
              <div>
                <small>{f.label}</small>
                <strong>{f.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <a className="cc-jx-btn" href={`/dashboard/country/${country.iso2.toLowerCase()}`}>View Full Jurisdiction Profile →</a>

        {pipelineHealth && (
          <div
            className="cc-pipeline-health"
            role="status"
            aria-label="Intelligence pipeline health"
            style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,.08)',
              background:
                pipelineHealth.status === 'critical'
                  ? 'rgba(224,85,85,.08)'
                  : pipelineHealth.status === 'warning'
                    ? 'rgba(212,168,75,.08)'
                    : pipelineHealth.status === 'healthy'
                      ? 'rgba(95,184,122,.08)'
                      : 'rgba(255,255,255,.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background:
                    pipelineHealth.status === 'critical'
                      ? '#e05555'
                      : pipelineHealth.status === 'warning'
                        ? '#d4a84b'
                        : pipelineHealth.status === 'healthy'
                          ? '#5fb87a'
                          : 'rgba(245,240,232,.35)',
                }}
              />
              <strong style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,.75)' }}>
                Pipeline {pipelineHealth.status}
              </strong>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(245,240,232,.45)', lineHeight: 1.45 }}>
              {pipelineSloMessage(
                combinePipelineStatus(pipelineHealth.status, pipelineHealth.feedAgeHours, pipelineHealth.digestAgeDays),
                pipelineHealth.feedAgeHours,
              )}
              <br />
              Feed age:{' '}
              {pipelineHealth.feedAgeHours == null
                ? 'unknown'
                : `${Math.round(pipelineHealth.feedAgeHours)}h`}
              {' · '}
              Digest:{' '}
              {pipelineHealth.digestAgeDays == null
                ? 'unknown'
                : `${pipelineHealth.digestAgeDays}d`}
              {pipelineHealth.alertCount > 0
                ? ` · ${pipelineHealth.alertCount} alert${pipelineHealth.alertCount === 1 ? '' : 's'}`
                : ''}
            </div>
            {roleFocus ? (
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(245,240,232,.4)' }}>
                Focus: {roleFocus}
              </div>
            ) : null}
            <button
              type="button"
              className="cc-right-link"
              style={{ marginTop: 8, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
              onClick={() => onPageChange?.('signals')}
            >
              Open intelligence feed →
            </button>
          </div>
        )}
      </aside>

      {/* ── Centre: Globe ─────────────────────────────────────────── */}
      <div className="cc-briefing-globe">
        <div className="cc-globe-wrap">
          <GlobeProvider>
            <GlobeCanvas
              className="absolute inset-0 w-full h-full"
              selectedCountryIso2={country.iso2}
              selectedCountryIso2s={[country.iso2]}
              focusedCountryIso2={focusedIso2}
              activeLayerId="country_select"
              onHoverCountry={setFocusedIso2}
              onSelectCountry={onCountrySelect}
            />
          </GlobeProvider>
          <div className="cc-globe-label">
            {country.label}
            {region && <span> · {region}</span>}
          </div>
          <div className="cc-globe-hint">Click a region to explore · Rotate · Zoom · Drag</div>
        </div>

        {/* Methodology strip */}
        <div className="cc-methodology">
          {[
            { icon: '◎', label: 'Data Sources',    val: 'Government, regulatory, market & verified industry sources' },
            { icon: '✓', label: 'Verification',    val: 'Multi-layer review and validation by domain experts' },
            { icon: '↻', label: 'Update Cadence',  val: 'Regulatory: Real-time · Market: Daily · Intel: Continuous' },
            { icon: '⊞', label: 'Coverage',        val: `${ALL_COUNTRIES.length} Countries & Territories · 100+ Data Sources` },
            { icon: '◷', label: 'Last Updated',    val: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` },
          ].map(item => (
            <div key={item.label} className="cc-methodology-item">
              <span className="cc-methodology-icon">{item.icon}</span>
              <div>
                <small>{item.label}</small>
                <span>{item.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Evidence confidence + Watch regions ────────────── */}
      <aside className="cc-briefing-right">
        {priorityActions.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">TODAY&apos;S PRIORITY ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {priorityActions.map((m, i) => (
                <button
                  key={m.page}
                  type="button"
                  onClick={() => onPageChange?.(m.page)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,.08)',
                    background: i === 0 ? 'rgba(212,168,75,.08)' : 'rgba(255,255,255,.03)',
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ opacity: 0.7 }}>{m.icon}</span>
                    <strong style={{ fontSize: 12 }}>{i + 1}. {m.label}</strong>
                    {'urgency' in m && m.urgency ? (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: 9,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: m.urgency === 'now' ? '#e05555' : m.urgency === 'soon' ? '#d4a84b' : 'rgba(245,240,232,.4)',
                      }}>
                        {m.urgency}
                      </span>
                    ) : null}
                  </div>
                  <p className="cc-right-prose" style={{ margin: 0, fontSize: 11, color: 'rgba(245,240,232,.45)' }}>
                    {m.why}
                    {'deadlineLabel' in m && m.deadlineLabel ? ` · ${m.deadlineLabel}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {(funnelMetrics || pipeline || listingCount > 0 || wantedCount > 0) && (
          <div className="cc-right-section">
            <div className="cc-right-head">MARKETPLACE FUNNEL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Listings', value: funnelMetrics?.buckets.find(b => b.key === 'listings')?.count ?? listingCount, page: 'marketplace' as const },
                { label: 'Wanted', value: funnelMetrics?.buckets.find(b => b.key === 'wanted')?.count ?? (wantedCount || pipeline?.wanted || 0), page: 'marketplace' as const },
                { label: 'Open inquiry', value: funnelMetrics?.openInquiry ?? pipeline?.inquiry ?? 0, page: 'marketplace' as const },
                { label: 'Qualified', value: funnelMetrics?.qualified ?? pipeline?.matched ?? 0, page: 'marketplace' as const },
              ].map((cell) => (
                <button
                  key={cell.label}
                  type="button"
                  onClick={() => onPageChange?.(cell.page)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,.08)',
                    background: 'rgba(255,255,255,.03)',
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#d4a84b' }}>{cell.value}</div>
                  <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,.45)', marginTop: 2 }}>
                    {cell.label}
                  </div>
                </button>
              ))}
            </div>
            {funnelMetrics && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(245,240,232,.45)', lineHeight: 1.45 }}>
                Contact rate {formatRate(funnelMetrics.contactRate)}
                {' · '}
                Qualify rate {formatRate(funnelMetrics.qualificationRate)}
                {' · '}
                Conversion {formatRate(funnelMetrics.conversionRate)}
                <br />
                Outcomes: {funnelMetrics.wonProxy} won
                {' · '}
                {funnelMetrics.lostProxy} lost
                {' · '}
                Loss rate {formatRate(funnelMetrics.lossRate)}
                {' · '}
                {funnelMetrics.closed} closed
              </div>
            )}
            <button
              type="button"
              className="cc-right-link"
              style={{ marginTop: 10, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
              onClick={() => onPageChange?.('marketplace')}
            >
              Open marketplace pipeline →
            </button>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">COVERAGE MAP · {country.iso2}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {coverageMap.cells.map((cell) => (
              <span
                key={cell.domain}
                title={cell.note ?? cell.label}
                style={{
                  fontSize: 10,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.08)',
                  color:
                    cell.tier === 'live' ? '#5fb87a'
                    : cell.tier === 'mixed' ? '#d4a84b'
                    : 'rgba(245,240,232,.45)',
                  background:
                    cell.tier === 'live' ? 'rgba(95,184,122,.1)'
                    : cell.tier === 'mixed' ? 'rgba(212,168,75,.1)'
                    : 'rgba(255,255,255,.03)',
                }}
              >
                {cell.label}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(245,240,232,.35)' }}>
            {coverageMap.liveCount} live · {coverageMap.mixedCount} mixed · {coverageMap.referenceCount} reference
          </div>
        </div>

        <div className="cc-right-section" style={{ borderLeft: '2px solid rgba(212,168,75,.35)', paddingLeft: 12 }}>
          <div className="cc-right-head" style={{ color: '#d4a84b' }}>AI EXECUTIVE BRIEFING</div>
          {aiBriefingLoading ? (
            <p className="cc-right-prose" style={{ color: 'rgba(245,240,232,.4)', fontStyle: 'italic' }}>Generating briefing…</p>
          ) : aiBriefing ? (
            <div>
              <p className="cc-right-prose" style={{ lineHeight: 1.6 }}>{aiBriefing}</p>
              <button type="button" className="cc-btn cc-btn-ghost" style={{ marginTop: 8 }} onClick={() => loadAiBriefing()}>
                Refresh AI briefing
              </button>
            </div>
          ) : (
            <div>
              {aiBriefingError ? (
                <p className="cc-right-prose" style={{ color: 'rgba(245,240,232,.3)', fontStyle: 'italic', marginBottom: 8 }}>
                  Briefing unavailable — check connection.
                </p>
              ) : (
                <p className="cc-right-prose" style={{ color: 'rgba(245,240,232,.35)', fontStyle: 'italic', marginBottom: 8 }}>
                  Optional AI narrative — runs only when requested.
                </p>
              )}
              <button type="button" className="cc-btn cc-btn-ghost" onClick={() => loadAiBriefing()}>
                Generate AI briefing
              </button>
            </div>
          )}
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">EVIDENCE CONFIDENCE <span className="cc-right-info">ⓘ</span></div>
          <div className="cc-confidence-summary">
            <div className="cc-confidence-donut">
              <svg viewBox="0 0 64 64" className="cc-donut-svg">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke="var(--cc-gold)" strokeWidth="7"
                  strokeDasharray={`${163.4 * overall / 100} 163.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dasharray .6s ease' }}
                />
              </svg>
              <div className="cc-donut-label">
                <strong>{overall}%</strong>
                <small>Overall<br/>Confidence</small>
              </div>
            </div>
            <div className="cc-confidence-bars">
              {confBars.map(bar => (
                <div
                  key={bar.key}
                  className={`cc-conf-bar-row${bar.available ? '' : ' cc-conf-bar-row-pending'}`}
                  title={bar.basis}
                >
                  <span className="cc-conf-bar-lbl">{bar.label}</span>
                  <div className="cc-conf-bar-track">
                    <div
                      className="cc-conf-bar-fill"
                      style={{ width: bar.available ? `${bar.pct}%` : '0%' }}
                    />
                  </div>
                  <span className="cc-conf-bar-pct">{bar.available ? `${bar.pct}%` : '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/source-methodology" className="cc-right-link">Confidence methodology →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">WATCH REGIONS</div>
          <div className="cc-watch-regions">
            {[
              {
                label: country.label,
                status: fmtStatus(
                  countryIntel?.market_access_status ?? countryIntel?.medical_status,
                  'Active Program',
                ),
                star: true,
              },
              ...signals
                .map(s => s.market)
                .filter((m, i, a) => !!m && m !== country.label && a.indexOf(m) === i)
                .slice(0, 4)
                .map(m => ({
                  label: m,
                  status: signals.find(s => s.market === m)?.tag.label ?? 'Signal Activity',
                  star: false,
                })),
            ].map(r => (
              <div key={r.label} className="cc-watch-region-row">
                <span className="cc-watch-region-star">{r.star ? '★' : '○'}</span>
                <div className="cc-watch-region-info">
                  <strong>{r.label}</strong>
                  <small>{r.status}</small>
                </div>
                <button className="cc-watch-region-btn" onClick={() => onPageChange?.('signals')}>View</button>
              </div>
            ))}
          </div>
          <button className="cc-right-link" onClick={() => onPageChange?.('countries')}>View all jurisdictions →</button>
        </div>

        {role && (BRIEFING_ROLE_MODULES[role] ?? []).length > 0 && (
          <div className="cc-right-section" style={{ borderLeft: '2px solid rgba(16,185,129,.35)', paddingLeft: 12 }}>
            <div className="cc-right-head" style={{ color: '#10b981' }}>PRIORITY MODULES — {role.toUpperCase()}</div>
            {(BRIEFING_ROLE_MODULES[role] ?? []).map((m, i) => (
              <div
                key={m.page}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, cursor: 'pointer' }}
                onClick={() => onPageChange?.(m.page)}
              >
                <span style={{ fontSize: '.82rem', color: '#10b981', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '.78rem', color: '#f5f0e8', fontWeight: 600 }}>{m.icon} {m.label}</span>
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(245,240,232,.45)', lineHeight: 1.4, marginTop: 2 }}>{m.why}</div>
                </div>
                <span style={{ fontSize: '.68rem', color: 'rgba(16,185,129,.6)', flexShrink: 0, marginTop: 3 }}>→</span>
              </div>
            ))}
          </div>
        )}

        {recentChanges.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">RECENT CHANGE NOTES</div>
            <div className="cc-change-notes">
              {recentChanges.map((c, i) => (
                <div key={i} className="cc-change-note">
                  <span className={`cc-change-arrow ${c.up ? 'up' : 'neutral'}`}>{c.up ? '↑' : '●'}</span>
                  <div>
                    <strong>{c.market}</strong>
                    <small>{c.title}</small>
                    <span className="cc-change-time">{c.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View all change activity →</button>
          </div>
        )}

        {marketMetrics.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">MARKET METRICS</div>
            <div className="cc-metrics-list">
              {marketMetrics.slice(0, 6).map((m, i) => (
                <div key={i} className="cc-metric-row">
                  <span className="cc-metric-name">{fmtStatus(m.metric_name)}</span>
                  <span className="cc-metric-value">
                    {m.metric_value.toLocaleString()}{m.metric_unit ? ` ${m.metric_unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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












