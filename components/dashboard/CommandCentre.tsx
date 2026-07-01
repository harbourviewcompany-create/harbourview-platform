'use client'
import './CommandCentre.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, WatchlistData, PathwayData, SourceCoverageRow, LocalIntelData, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import { complianceRegions } from '@/lib/compliance/regions'
import { ListingDetailModal } from './ListingDetailModal'
import { WantedDetailModal } from './WantedDetailModal'
import { GeneticsRequestModal } from './GeneticsRequestModal'
import { GeneticsProgramModal } from './GeneticsProgramModal'
import { QuoteModal } from './QuoteModal'
import { SubmitListingModal } from './SubmitListingModal'
import { MySubmissionsPanel } from './MySubmissionsPanel'
import { ConsumablesRequestModal } from './ConsumablesRequestModal'
import { DealRoomsPanel } from './DealRoomsPanel'
import { AssistantPage } from './pages/AssistantPage'
import { CORRIDOR_BANKING, CORRIDOR_AUTHORITY, CORRIDOR_COSTS } from './data/corridorIntel'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

export type CommandPage =
  | 'briefing'
  | 'access-pathway'
  | 'marketplace'
  | 'evidence'
  | 'education'
  | 'regulatory'
  | 'local-intel'
  | 'signals'
  | 'watchlist'
  | 'settings'
  | 'genetics'
  | 'compliance'
  | 'countries'
  | 'assistant'
  | 'documents'

type PublicServiceProvider = {
  id: string
  displayName: string
  service_category: string
  service_summary: string
  country_code: string | null
  jurisdiction_label: string | null
  verification_level: string
}

type PublicCollaborationProject = {
  id: string
  slug: string
  title: string
  projectType: string
  status: string
  countryCode: string | null
  jurisdictionLabel: string | null
  publicSummary: string
  evidenceNeeded: string | null
  cta: string
}

type Props = {
  signals:          DashboardSignal[]
  eduCategories:    { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?:   string | null
  initialPage?:     CommandPage | null
  wantedCount?:     number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?:        PipelineCounts
  wantedListings?:  WantedListing[]
  countryIntel?:    CountryIntelProfile | null
  localIntel?:      LocalIntelData | null
  pathwayData?:     PathwayData
  watchlistData?:    WatchlistData
  evidenceData?:     EvidenceData
  liveTiles?:           LiveEduTile[]
  recentEduModules?:    RecentEduModule[]
  sourceCoverage?:      SourceCoverageRow[]
  jurisdictionPlaybook?: JurisdictionPlaybook
  educationTracks?:     EducationTrack[]
  marketMetrics?:       MarketMetric[]
  tradeFlows?:          TradeFlow[]
  professionals?:       HvProfessional[]
  cannabisOperators?:   CannabisOperator[]
  userEmail?:           string | null
  cultivarPassports?:   PublicCultivarPassportDTO[]
  serviceProviders?:    PublicServiceProvider[]
  collaborationProjects?: PublicCollaborationProject[]
}

// ── Globe (dynamic — SSR off) ─────────────────────────────────────────────────

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

type NavItem    = { id: CommandPage; label: string; icon: string }
type NavSection = { label?: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { id: 'briefing',    label: 'Briefing Room', icon: '◎' },
      { id: 'marketplace', label: 'Marketplace',   icon: '⊞' },
      { id: 'signals',     label: 'Intelligence',  icon: '≋' },
      { id: 'education',   label: 'Education',     icon: '⬛' },
      { id: 'watchlist',   label: 'Watchlist',     icon: '◈' },
    ],
  },
  {
    label: 'Prescribers',
    items: [
      { id: 'access-pathway', label: 'Access Pathway',   icon: '⬡' },
      { id: 'regulatory',     label: 'Regulatory Watch', icon: '◷' },
      { id: 'local-intel',    label: 'Local Intel',      icon: '◉' },
    ],
  },
  {
    label: 'Research',
    items: [
      { id: 'evidence', label: 'Research', icon: '⊟' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'genetics',    label: 'Genetics',    icon: '⊕' },
      { id: 'compliance',  label: 'Compliance',  icon: '◫' },
      { id: 'countries',   label: 'Countries',   icon: '⊗' },
      { id: 'assistant',   label: 'AI Assistant', icon: '◈' },
      { id: 'documents',   label: 'Documents',    icon: '⊡' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'settings', label: 'Settings', icon: '⊙' },
    ],
  },
]

// Flat list — used by pageTitle, CommandPalette, mobile nav
const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

// ── BriefingRoom page ─────────────────────────────────────────────────────────

// Converts any ISO 3166-1 alpha-2 code → emoji flag (all 196 countries)

function buildConfidenceBars(intel?: CountryIntelProfile | null): { label: string; pct: number }[] {
  const dc  = (intel?.data_completeness ?? '').toLowerCase()
  const opp = intel?.opportunity_score ?? null
  const base = dc === 'full' ? 88 : dc === 'high' ? 85 : dc === 'partial' ? 65 : 38
  const mkt  = opp != null ? Math.min(94, Math.max(20, Math.round(opp * 0.94))) : Math.max(20, base - 5)
  return [
    { label: 'Regulatory',        pct: Math.min(94, base) },
    { label: 'Market Data',       pct: mkt },
    { label: 'Access Pathway',    pct: Math.max(20, base - 8) },
    { label: 'Local Intel',       pct: Math.max(20, base - 12) },
    { label: 'Education Content', pct: Math.min(94, base + 4) },
  ]
}

function overallConfidence(bars: { pct: number }[]) {
  return Math.round(bars.reduce((s, b) => s + b.pct, 0) / bars.length)
}

function fmtStatus(v: string | null | undefined, fallback = '—'): string {
  if (!v) return fallback
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const BriefingRoom = React.memo(function BriefingRoom({
  country,
  region,
  countryIntel,
  signals,
  marketMetrics = [],
  tradeFlows = [],
  onCountrySelect,
}: {
  country:          { iso2: string; label: string }
  region:           string
  countryIntel?:    CountryIntelProfile | null
  signals:          DashboardSignal[]
  marketMetrics?:   MarketMetric[]
  tradeFlows?:      TradeFlow[]
  onCountrySelect?: (iso2: string) => void
}) {
  const [focusedIso2, setFocusedIso2] = useState<string | undefined>(undefined)
  const confBars = useMemo(() => buildConfidenceBars(countryIntel), [countryIntel])
  const overall  = overallConfidence(confBars)
  const recentChanges = useMemo(() =>
    signals.slice(0, 3).map(s => ({
      market:  s.market,
      title:   s.title,
      timeAgo: s.timeAgo,
      up:      s.confidence >= 75,
    })),
    [signals],
  )

  return (
    <div className="cc-page cc-briefing">

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

        <div className="cc-jx-fields">
          {([
            { icon: '◎', label: 'Medical Program', value: fmtStatus(countryIntel?.medical_status,       'No Active Program') },
            { icon: '⊛', label: 'Market Access',   value: fmtStatus(countryIntel?.market_access_status, 'Status Unknown')    },
            { icon: '↓', label: 'Import Status',   value: fmtStatus(countryIntel?.import_status,        'Not Available')     },
            { icon: '↑', label: 'Export Status',   value: fmtStatus(countryIntel?.export_status,        'Not Available')     },
            { icon: '⊙', label: 'Opportunity',     value: countryIntel?.opportunity_score != null
                ? `${countryIntel.opportunity_score}/100`
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
      </aside>

      {/* ── Centre: Globe ─────────────────────────────────────────── */}
      <div className="cc-briefing-globe">
        <div className="cc-globe-wrap">
          <GlobeCanvas
            className="absolute inset-0 w-full h-full"
            selectedCountryIso2={country.iso2}
            selectedCountryIso2s={[country.iso2]}
            focusedCountryIso2={focusedIso2}
            activeLayerId="country_select"
            onHoverCountry={setFocusedIso2}
            onSelectCountry={onCountrySelect}
          />
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
                <div key={bar.label} className="cc-conf-bar-row">
                  <span className="cc-conf-bar-lbl">{bar.label}</span>
                  <div className="cc-conf-bar-track">
                    <div className="cc-conf-bar-fill" style={{ width: `${bar.pct}%` }} />
                  </div>
                  <span className="cc-conf-bar-pct">{bar.pct}%</span>
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
                <a className="cc-watch-region-btn" href="/dashboard?page=signals">View</a>
              </div>
            ))}
          </div>
          <Link href="/dashboard?page=countries" className="cc-right-link">View all jurisdictions →</Link>
        </div>

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
            <Link href="/signals" className="cc-right-link">View all change activity →</Link>
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

// ── Signals helpers ───────────────────────────────────────────────────────────

type SignalGroup = 'REGULATORY' | 'MARKET ACCESS' | 'SUPPLY CHAIN' | 'TESTING & COMPLIANCE' | 'EXPORT / BUYER MOVEMENT' | 'EVIDENCE UPDATES'

function deriveSignalGroup(title: string): SignalGroup {
  const t = title.toLowerCase()
  if (/export|import|buyer|gacp|eu.gmp|international/.test(t)) return 'EXPORT / BUYER MOVEMENT'
  if (/test|coa|compliance|qa|quality|lab|microbial|pesticide|threshold/.test(t)) return 'TESTING & COMPLIANCE'
  if (/supply|packaging|shipping|logistics|lead.time|transport/.test(t)) return 'SUPPLY CHAIN'
  if (/retail|dispensary|demand|patient|consumer|pos|sales/.test(t)) return 'MARKET ACCESS'
  if (/study|evidence|research|clinical|terpene|data/.test(t)) return 'EVIDENCE UPDATES'
  return 'REGULATORY'
}

function derivePolicyArea(title: string): string {
  const t = title.toLowerCase()
  if (/tax/.test(t)) return 'Taxation'
  if (/packag|label/.test(t)) return 'Packaging & Labeling'
  if (/advertis/.test(t)) return 'Marketing & Advertising'
  if (/record|retention/.test(t)) return 'Recordkeeping & Compliance'
  if (/test|lab|coa|microbial|pesticide/.test(t)) return 'Laboratory Testing & QC'
  if (/licen|permit|cap|moratorium/.test(t)) return 'Licensing & Permits'
  if (/zon|local|municipal/.test(t)) return 'Local Zoning & Ordinance'
  if (/track|trace|system|software/.test(t)) return 'Track & Trace'
  return 'Regulatory & Policy'
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

// ── SignalsPage ────────────────────────────────────────────────────────────────

const SignalsPage = React.memo(function SignalsPage({
  country, region, role, signals, watchlistData,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  signals: DashboardSignal[]
  watchlistData?: WatchlistData
}) {
  const [filterImpact,  setFilterImpact]  = useState('all')
  const [filterConf,    setFilterConf]    = useState('all')
  const [filterType,    setFilterType]    = useState('all')
  const [currentPage,   setCurrentPage]   = useState(1)
  const PAGE_SIZE = 6

  // ── Live signal fetch ──────────────────────────────────────────────────────
  // SSR props give instant first paint; this effect hydrates with the full
  // 803-row signals table, country-filtered, on mount.
  const [liveSignals, setLiveSignals] = useState<DashboardSignal[] | null>(null)
  const [liveTotal,   setLiveTotal]   = useState<number | null>(null)
  const [isFetching,  setIsFetching]  = useState(false)

  // Effective signals: live (full dataset) when available, SSR props as fallback
  const effectiveSignals = liveSignals ?? signals

  React.useEffect(() => {
    let cancelled = false
    async function fetchLiveSignals() {
      setIsFetching(true)
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (country.label) params.set('country', country.label)
        const res = await fetch(`/api/dashboard/signals?${params.toString()}`)
        if (!res.ok || cancelled) return
        const json = await res.json() as { signals: DashboardSignal[]; total: number; source: string }
        if (!cancelled && Array.isArray(json.signals) && json.signals.length > 0) {
          setLiveSignals(json.signals)
          setLiveTotal(json.total)
        }
      } catch {
        // Keep SSR props on fetch failure — silent degradation
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    fetchLiveSignals()
    return () => { cancelled = true }
  }, [country.label])

  const filtered = useMemo(() => effectiveSignals.filter(s => {
    const imp = deriveImpact(s.confidence)
    if (filterImpact !== 'all' && imp.toLowerCase() !== filterImpact) return false
    if (filterConf === 'high'   && s.confidence < 80) return false
    if (filterConf === 'medium' && (s.confidence < 65 || s.confidence >= 80)) return false
    if (filterConf === 'low'    && s.confidence >= 65) return false
    if (filterType !== 'all' && deriveSignalGroup(s.title).toLowerCase().replace(/ /g, '_') !== filterType) return false
    return true
  }), [effectiveSignals, filterImpact, filterConf, filterType])

  const grouped = useMemo(() => {
    const map: Partial<Record<SignalGroup, DashboardSignal[]>> = {}
    filtered.forEach(s => {
      const g = deriveSignalGroup(s.title)
      ;(map[g] ??= []).push(s)
    })
    return map
  }, [filtered])

  const activeGroups = SIG_GROUP_ORDER.filter(g => grouped[g]?.length)
  const hasFilters   = filterImpact !== 'all' || filterConf !== 'all' || filterType !== 'all'

  // Reset to page 1 whenever filters change
  const prevFilters = React.useRef({ filterImpact, filterConf, filterType })
  if (prevFilters.current.filterImpact !== filterImpact ||
      prevFilters.current.filterConf   !== filterConf   ||
      prevFilters.current.filterType   !== filterType) {
    prevFilters.current = { filterImpact, filterConf, filterType }
    setCurrentPage(1)
  }

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const pagedGroups = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    const end   = start + PAGE_SIZE
    let count = 0
    const result: Partial<Record<SignalGroup, DashboardSignal[]>> = {}
    for (const g of activeGroups) {
      const rows = grouped[g]!
      if (count >= end) break
      const slice = rows.slice(Math.max(0, start - count), end - count)
      count += rows.length
      if (slice.length) result[g] = slice
    }
    return result
  }, [grouped, activeGroups, currentPage, PAGE_SIZE])
  const nextBest     = effectiveSignals.find(s => s.confidence >= 80)

  const SAVED_FILTERS = useMemo(() => {
    const rules = watchlistData?.rules ?? []
    if (rules.length > 0) {
      const TYPE_LABELS: Record<string, string> = {
        jurisdiction: 'Jurisdiction Watch', signal: 'Signal Feed',
        pathway: 'Access Pathway',          policy: 'Policy Monitor',
        marketplace: 'Market Watch',        source: 'Source Monitor',
      }
      return rules.slice(0, 3).map(r => ({
        label: TYPE_LABELS[r.rule_type] ?? r.rule_type.replace(/_/g, ' ') + ' Watch',
        tags:  r.keywords.slice(0, 2).join(' · ') || r.rule_type,
      }))
    }
    return [
      { label: `${country.label} Regulatory Watch`, tags: 'Regulatory · High Impact' },
      { label: 'Cultivation Ops',        tags: 'Supply Chain · Testing' },
      { label: 'Export Opportunities',   tags: 'Export · Market Access' },
    ]
  }, [watchlistData, country])

  const HIGH_WATCH = useMemo(() => {
    const areaCount: Record<string, number> = {}
    effectiveSignals.forEach(s => {
      const a = derivePolicyArea(s.title)
      areaCount[a] = (areaCount[a] ?? 0) + 1
    })
    const entries = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (entries.length > 0) return entries.map(([label, n]) => ({ label, n }))
    return [
      { label: 'License Caps & Moratorium',  n: 2 },
      { label: 'Testing Standards',          n: 3 },
      { label: 'Water & Environmental Rules', n: 1 },
      { label: 'Federal Rescheduling',       n: 2 },
      { label: 'Export Market Access',       n: 4 },
    ]
  }, [effectiveSignals])

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main feed ───────────────────────────────────────── */}
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{region ? ` ${region}` : ''}{role ? ` ${role}` : ''} Signals</h2>
          <p>Intelligence feed surfacing regulatory, market, export, and operational signals relevant to the resolved jurisdiction{role ? ' and your role' : ''}.</p>
        </div>

        <div className="cc-filter-bar">
          <CustomSelect value={filterType} className="cc-filter-sel" onChange={setFilterType} options={[
            { value: 'all',                    label: 'All Types' },
            { value: 'regulatory',             label: 'Regulatory' },
            { value: 'market_access',          label: 'Market Access' },
            { value: 'supply_chain',           label: 'Supply Chain' },
            { value: 'testing_&_compliance',   label: 'Testing & Compliance' },
            { value: 'export_/_buyer_movement',label: 'Export / Buyer' },
            { value: 'evidence_updates',       label: 'Evidence Updates' },
          ]} />
          <CustomSelect value={filterImpact} className="cc-filter-sel" onChange={setFilterImpact} options={[
            { value: 'all',   label: 'All Impact' },
            { value: 'high',  label: 'High Impact' },
            { value: 'medium',label: 'Medium Impact' },
            { value: 'low',   label: 'Low Impact' },
          ]} />
          <CustomSelect value={filterConf} className="cc-filter-sel" onChange={setFilterConf} options={[
            { value: 'all',   label: 'All Confidence' },
            { value: 'high',  label: 'High (≥80%)' },
            { value: 'medium',label: 'Medium (65–79%)' },
            { value: 'low',   label: 'Low (<65%)' },
          ]} />
          {hasFilters && (
            <button className="cc-filter-clear" onClick={() => { setFilterImpact('all'); setFilterConf('all'); setFilterType('all') }}>
              ↺ Clear All
            </button>
          )}
        </div>

        <div className="cc-sig-feed">
          {activeGroups.length === 0 && (
            <div className="cc-empty-state">No signals match the current filters.</div>
          )}
          {(Object.keys(pagedGroups) as SignalGroup[]).map(grp => (
            <div key={grp} className="cc-sig-group">
              <div className="cc-sig-group-hd">
                <span>{SIG_GROUP_ICONS[grp]}</span>
                {grp}
              </div>
              {pagedGroups[grp]!.map((s, i) => {
                const imp  = deriveImpact(s.confidence)
                const circ = 87.96
                return (
                  <div key={i} className="cc-sig-row">
                    <span className={`cc-sig-dot ${imp.toLowerCase()}`} />
                    <div className="cc-sig-body">
                      <strong>{s.title}</strong>
                      <small>{s.market ? `${s.market}${region ? ` · ${region}` : ''} · ` : ''}{s.timeAgo}</small>
                    </div>
                    <div className="cc-sig-why">
                      <em>Why it matters</em>
                      <span>Affects operations in {s.market || country.label}{region ? ` · ${region}` : ''}</span>
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
                    <div className="cc-sig-date">
                      <em>Date</em>
                      <span>{s.timeAgo}</span>
                    </div>
                    <div className="cc-sig-acts">
                      <Link href={s.slug ? `/signals/${s.slug}` : '/signals'} className="cc-sig-brief">Open brief</Link>
                      <Link href="/signals" className="cc-sig-watch">↗ Add to watchlist</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="cc-feed-footer">
          <span>
            Showing {Math.min(currentPage * PAGE_SIZE, filtered.length)}&nbsp;of&nbsp;{filtered.length}
            {filtered.length !== effectiveSignals.length ? ` (${effectiveSignals.length} total)` : ''}
            {liveTotal !== null && liveTotal > effectiveSignals.length ? ` · ${liveTotal} in database` : ''}
            {' '}signals
          </span>
          <span className="cc-auto-refresh">
            {isFetching
              ? <><span className="cc-refresh-dot" style={{ background: 'var(--cc-amber)' }}/>Refreshing…</>
              : liveSignals !== null
                ? <><span className="cc-refresh-dot"/>Live · {liveTotal ?? effectiveSignals.length} signals</>
                : <><span className="cc-refresh-dot"/>Auto-refresh on · Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
            }
          </span>
          <div className="cc-pagination">
            <button className="cc-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5 ? i+1 : currentPage <= 3 ? i+1 : currentPage + i - 2
              if (pg < 1 || pg > totalPages) return null
              return <button key={pg} className={`cc-page-btn${currentPage===pg?' active':''}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
            })}
            <button className="cc-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">SAVED FILTERS</div>
          {SAVED_FILTERS.map(f => (
            <div key={f.label} className="cc-saved-row">
              <div>
                <strong>{f.label}</strong>
                <small>{f.tags}</small>
              </div>
              <button className="cc-apply-btn">Apply</button>
            </div>
          ))}
          <Link href="/signals" className="cc-right-link">Manage saved filters →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">HIGH-WATCH TOPICS</div>
          {HIGH_WATCH.map(t => (
            <div key={t.label} className="cc-topic-row">
              <span>{t.label}</span>
              <span className="cc-topic-count">{t.n}</span>
            </div>
          ))}
          <Link href="/signals" className="cc-right-link">View all topics →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SIGNAL METHODOLOGY</div>
          <p className="cc-right-prose">Signals are sourced from regulatory releases, market data, trade intelligence, and verified industry sources. Each signal is scored for impact and confidence based on source credibility and recency.</p>
          <Link href="/source-methodology" className="cc-right-link">Learn more about our methodology →</Link>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">{nextBest.title.length > 90 ? nextBest.title.slice(0,90)+'…' : nextBest.title}</p>
            <a className="cc-nba-btn" href={nextBest?.slug ? `/signals/${nextBest.slug}` : '/signals'}>Open Signal Brief ↗</a>
            <Link href="/signals" className="cc-right-link">View all recommended actions →</Link>
          </div>
        )}
      </aside>
    </div>
  )
})

// ── Marketplace helpers ────────────────────────────────────────────────────────

const MKT_TABS: { id: MarketView; label: string }[] = [
  { id: 'cannabis',      label: 'Listings' },
  { id: 'wanted',        label: 'Wanted Demand' },
  { id: 'opportunities', label: 'Buyer Routes' },
  { id: 'equipment',     label: 'Equipment' },
  { id: 'consumables',   label: 'Consumables' },
  { id: 'services',      label: 'Services' },
  { id: 'new-products',  label: 'Opportunities' },
]

// MarketRow tuple field indices
const MR = { TITLE:0, DESC:1, JURISDICTION:2, CATEGORY:3, VERIFICATION:4, ACCESS_ROUTE:5, CONFIDENCE:6, ID:7 } as const

// ── MarketplacePage ────────────────────────────────────────────────────────────

const MarketplacePage = React.memo(function MarketplacePage({
  country, region, role, marketplaceRows, wantedListings, wantedCount, pathwayData, cannabisOperators = [], pipeline, onPageChange,
}: {
  country:           { iso2: string; label: string }
  region:            string
  role:              string
  marketplaceRows?:  Partial<DashboardMarketplaceRows>
  wantedListings?:   WantedListing[]
  wantedCount?:      number
  pathwayData?:      PathwayData
  cannabisOperators?: CannabisOperator[]
  pipeline?:         PipelineCounts
  onPageChange?:     (page: CommandPage) => void
}) {
  const [activeTab, setActiveTab] = useState<MarketView>(() => {
    for (const t of MKT_TABS) {
      if (t.id === 'wanted') { if ((wantedListings?.length ?? 0) > 0) return 'wanted' }
      else if ((marketplaceRows?.[t.id] ?? []).length > 0) return t.id
    }
    return 'cannabis'
  })
  const [search,    setSearch]    = useState('')
  const [selectedListingId,  setSelectedListingId]  = useState<string | null>(null)
  const [selectedWantedId,   setSelectedWantedId]   = useState<string | null>(null)
  const [quoteOpen,              setQuoteOpen]              = useState(false)
  const [submitListingOpen,      setSubmitListingOpen]      = useState(false)
  const [consumablesOpen,        setConsumablesOpen]        = useState(false)
  const selectedWanted = useMemo(
    () => (selectedWantedId ? (wantedListings?.find(w => w.id === selectedWantedId) ?? null) : null),
    [selectedWantedId, wantedListings]
  )

  const rows = useMemo<MarketRow[]>(() => {
    let r: MarketRow[] = marketplaceRows?.[activeTab as MarketView] ?? []
    if (activeTab === 'wanted' && wantedListings?.length) {
      r = wantedListings.map(w => [
        w.title,
        w.summary ?? '',
        w.location_country ?? country.iso2,
        'Wanted Demand',
        'Verified',
        'Direct',
        '72',
        w.id,
      ] as MarketRow)
    }
    if (search.trim()) {
      const lq = search.toLowerCase()
      r = r.filter(row => row[MR.TITLE].toLowerCase().includes(lq) || row[MR.DESC].toLowerCase().includes(lq))
    }
    return r
  }, [activeTab, marketplaceRows, wantedListings, search, country])

  const ACCESS_REQS = useMemo(() => {
    const step1 = pathwayData?.steps.find(s => s.step_number === 1)
    const reqs  = step1
      ? (pathwayData?.requirements.filter(r => r.step_id === step1.id && r.is_required) ?? [])
      : []
    if (reqs.length > 0) {
      return reqs.slice(0, 4).map(r => {
        const st = pathwayData?.requirementStatuses.find(rs => rs.requirement_id === r.id)
        const ok = st?.status === 'verified'
        const detail = ok
          ? `Verified${st?.reviewed_at ? ' · ' + new Date(st.reviewed_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : ''}`
          : st?.status === 'in_review' ? 'Under review' : 'Pending'
        return { label: r.title, ok, detail }
      })
    }
    return [
      { label: `${country.label} Licence`,              ok: false, detail: 'Pending' },
      { label: 'Facility Registration & Site Plan',     ok: false, detail: 'Pending' },
      { label: 'Standard Operating Procedures',        ok: false, detail: 'Pending' },
      { label: 'Traceability System Documentation',    ok: false, detail: 'Pending' },
    ]
  }, [pathwayData, country])

  const VERIFY_GAPS = useMemo(() => {
    const gaps = (pathwayData?.requirements ?? [])
      .filter(r => {
        const st = pathwayData?.requirementStatuses.find(rs => rs.requirement_id === r.id)
        return !st || st.status === 'pending'
      })
      .slice(0, 3)
    if (gaps.length > 0) {
      return gaps.map(r => {
        const step = pathwayData?.steps.find(s => s.id === r.step_id)
        return { label: r.title, detail: r.description ?? step?.title ?? 'Required for access pathway' }
      })
    }
    return [
      { label: 'EU-GMP Certification',   detail: 'Required for EU export routes' },
      { label: 'Pest Management Plan',   detail: 'Requires export-level detail' },
      { label: 'Residual Testing SOP',   detail: 'Needs method verification' },
    ]
  }, [pathwayData])

  const COUNTERPARTY = [
    { label: 'Harbourview Due Diligence',    detail: 'Review in progress' },
    { label: 'Sanctions & Watchlist Screen', detail: 'Pending verification' },
    { label: 'Financial Standing',           detail: 'Submit documentation' },
  ]

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main table ──────────────────────────────────────── */}
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Marketplace &amp; Access</h2>
          <p>Mediated market access to export-ready and compliance-gated opportunities. Requests are reviewed by Harbourview&apos;s market access team.</p>
        </div>

        <div className="cc-mkt-tabs">
          {MKT_TABS.map(t => {
            const cnt = t.id === 'wanted' ? (wantedListings?.length ?? wantedCount ?? 0) : (marketplaceRows?.[t.id] ?? []).length
            return (
              <button key={t.id}
                className={`cc-mkt-tab${activeTab===t.id?' active':''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {cnt > 0 ? <span className="cc-tab-badge">{cnt}</span> : null}
              </button>
            )
          })}
        </div>

        <div className="cc-mkt-filters">
          <div className="cc-mkt-search-wrap">
            <span>⌕</span>
            <input className="cc-mkt-search" placeholder="Search listings…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="cc-mkt-filter-btn">≡ Filters</button>
        </div>

        {rows.length > 0 ? (
          <>
            <div className="cc-mkt-table">
              <div className="cc-mkt-thead">
                <span className="cc-mkt-th opp-col">OPPORTUNITY</span>
                <span className="cc-mkt-th">CATEGORY</span>
                <span className="cc-mkt-th">JURISDICTION</span>
                <span className="cc-mkt-th">VERIFICATION</span>
                <span className="cc-mkt-th">ACCESS ROUTE</span>
                <span className="cc-mkt-th">EVIDENCE</span>
                <span className="cc-mkt-th">ACTIONS</span>
              </div>
              {rows.slice(0,10).map((row, i) => {
                const conf = parseInt(row[MR.CONFIDENCE])||72
                const ok   = row[MR.VERIFICATION]?.toLowerCase()==='verified'
                return (
                  <div key={row[MR.ID]||String(i)} className="cc-mkt-row">
                    <div className="cc-mkt-cell opp-col">
                      <div className="cc-opp-icon">◎</div>
                      <div className="cc-opp-body">
                        <strong>{row[MR.TITLE]}</strong>
                        {row[MR.DESC] && <p>{row[MR.DESC].slice(0,80)}{row[MR.DESC].length>80?'…':''}</p>}
                        {row[MR.CATEGORY] && <span className="cc-opp-tag">{row[MR.CATEGORY]}</span>}
                      </div>
                    </div>
                    <div className="cc-mkt-cell">{row[MR.CATEGORY]||'—'}</div>
                    <div className="cc-mkt-cell cc-juris-cell">
                      <span>{row[MR.JURISDICTION]||country.iso2}</span>
                      {ok && <span className="cc-export-tag">Export-Ready</span>}
                    </div>
                    <div className="cc-mkt-cell">
                      <span className={`cc-verify-badge ${ok?'ok':'pending'}`}>
                        {ok?'✓':'○'} {row[MR.VERIFICATION]||'Pending Review'}
                      </span>
                    </div>
                    <div className="cc-mkt-cell">{row[MR.ACCESS_ROUTE]||'Mediated'}</div>
                    <div className="cc-mkt-cell">
                      <svg viewBox="0 0 36 36" className="cc-mini-donut">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4"/>
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke={conf>=80?'var(--cc-green)':conf>=65?'var(--cc-amber)':'var(--cc-red)'}
                          strokeWidth="4"
                          strokeDasharray={`${87.96*conf/100} 87.96`}
                          strokeLinecap="round" transform="rotate(-90 18 18)"
                        />
                        <text x="18" y="22" textAnchor="middle" fontSize="9" fill="var(--cc-text)" fontWeight="600">{conf}%</text>
                      </svg>
                    </div>
                    <div className="cc-mkt-cell cc-acts-col">
                      {activeTab === 'wanted' ? (
                        <>
                          <button className="cc-act-primary" onClick={() => setSelectedWantedId(row[MR.ID])}>Respond</button>
                          <button className="cc-act-sec" onClick={() => setSelectedWantedId(row[MR.ID])}>View demand</button>
                        </>
                      ) : (
                        <>
                          <button className="cc-act-primary" onClick={() => setSelectedListingId(row[MR.ID])}>Request access</button>
                          <button className="cc-act-sec" onClick={() => setSelectedListingId(row[MR.ID])}>Watch</button>
                          <button className="cc-act-sec" onClick={() => setSelectedListingId(row[MR.ID])}>Requirements</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="cc-feed-footer">
              <span>Showing {Math.min(rows.length,10)} of {rows.length} opportunities</span>
            </div>
          </>
        ) : (
          <div className="cc-empty-state">
            <span>⊞</span>
            <p>No {activeTab === 'cannabis' ? '' : (MKT_TABS.find(t=>t.id===activeTab)?.label.toLowerCase() ?? '') + ' '}listings for {country.label}{region?` · ${region}`:''}.{' '}
              {activeTab!=='wanted' && <button className="cc-right-link" onClick={()=>setActiveTab('wanted')}>Browse wanted demand →</button>}
            </p>
          </div>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        {pipeline && (pipeline.wanted + pipeline.matched + pipeline.proof_review + pipeline.inquiry + pipeline.deal_room) > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">PIPELINE STATUS</div>
            {[
              { label: 'Wanted demand',   value: pipeline.wanted },
              { label: 'Matched',         value: pipeline.matched },
              { label: 'Proof review',    value: pipeline.proof_review },
              { label: 'Inquiry',         value: pipeline.inquiry },
              { label: 'Deal room',       value: pipeline.deal_room },
            ].filter(r => r.value > 0).map(r => (
              <div key={r.label} className="cc-req-row">
                <span className="cc-req-icon ok">◎</span>
                <div>
                  <strong>{r.label}</strong>
                  <small>{r.value} active</small>
                </div>
              </div>
            ))}
            <Link href="/marketplace/deals" className="cc-right-link">View pipeline →</Link>
          </div>
        )}
        <DealRoomsPanel />
        <div className="cc-right-section">
          <div className="cc-right-head">ROUTED INQUIRY</div>
          <p className="cc-right-prose">Submit a quote or sourcing inquiry for Harbourview to review and route to verified suppliers or export partners.</p>
          <button className="cc-right-link" onClick={() => setQuoteOpen(true)}>Submit routed inquiry →</button>
        </div>
        {activeTab === 'consumables' && (
          <div className="cc-right-section">
            <div className="cc-right-head">CONSUMABLES SOURCING</div>
            <p className="cc-right-prose">Request pre-roll cones, pouches, jars, labels, closures, or production tools. Harbourview reviews fit before any supplier routing.</p>
            <button className="cc-right-link" onClick={() => setConsumablesOpen(true)}>Request consumables →</button>
          </div>
        )}
        <div className="cc-right-section">
          <div className="cc-right-head">SUBMIT LISTING</div>
          <p className="cc-right-prose">List inventory, equipment, or a business opportunity for Harbourview&apos;s private review. All submissions are screened before any routing or visibility is granted.</p>
          <button className="cc-right-link" onClick={() => setSubmitListingOpen(true)}>Submit a listing →</button>
        </div>
        <MySubmissionsPanel />
        <div className="cc-right-section">
          <div className="cc-right-head">MARKETPLACE ACCESS REQUIREMENTS</div>
          {ACCESS_REQS.map(r => (
            <div key={r.label} className="cc-req-row">
              <span className={`cc-req-icon ${r.ok?'ok':'pending'}`}>{r.ok?'✓':'○'}</span>
              <div>
                <strong>{r.label}</strong>
                <small>{r.detail}</small>
              </div>
            </div>
          ))}
          <Link href={`/compliance/country-pathways/${country.iso2.toLowerCase()}`} className="cc-right-link">View all requirements →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">VERIFICATION GAPS</div>
          {VERIFY_GAPS.map(g => (
            <div key={g.label} className="cc-req-row">
              <span className="cc-req-icon gap">△</span>
              <div>
                <strong>{g.label}</strong>
                <small>{g.detail}</small>
              </div>
            </div>
          ))}
          <Link href="/compliance" className="cc-right-link">Address gaps →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">COUNTERPARTY STATUS</div>
          {COUNTERPARTY.map(c => (
            <div key={c.label} className="cc-req-row">
              <span className="cc-req-icon ok">✓</span>
              <div>
                <strong>{c.label}</strong>
                <small>{c.detail}</small>
              </div>
            </div>
          ))}
          <Link href="/marketplace" className="cc-right-link">View counterparty profile →</Link>
        </div>

        {cannabisOperators.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">VERIFIED OPERATORS — {country.label.toUpperCase()}</div>
            {cannabisOperators.slice(0, 5).map(op => (
              <div key={op.id} className="cc-req-row">
                <span className={`cc-req-icon ${op.verification_status === 'verified' ? 'ok' : 'pending'}`}>
                  {op.verification_status === 'verified' ? '✓' : '○'}
                </span>
                <div>
                  <strong>{op.legal_name}</strong>
                  <small>{op.operator_type ?? 'Operator'}</small>
                </div>
              </div>
            ))}
            <Link href="/marketplace" className="cc-right-link">View all operators →</Link>
          </div>
        )}
      </aside>

      <ListingDetailModal
        listingId={selectedListingId}
        onClose={() => setSelectedListingId(null)}
        onRequestAccess={() => onPageChange?.('access-pathway')}
        onWatch={() => onPageChange?.('watchlist')}
      />
      <WantedDetailModal
        listing={selectedWanted}
        onClose={() => setSelectedWantedId(null)}
      />
      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
      />
      <SubmitListingModal
        open={submitListingOpen}
        onClose={() => setSubmitListingOpen(false)}
      />
      <ConsumablesRequestModal
        open={consumablesOpen}
        onClose={() => setConsumablesOpen(false)}
      />
    </div>
  )
})

// ── Education helpers ──────────────────────────────────────────────────────────

type LearningModule = {
  num: number; icon: string; title: string; desc: string
  level: 'REQUIRED'|'RECOMMENDED'|'OPTIONAL'; progress: number; minutes: number
}

function buildLearningPath(eduCats: { icon: string; title: string; desc: string }[]): LearningModule[] {
  const defaults: LearningModule[] = [
    { num:1, icon:'◎', title:'Licence & Regulatory Foundations', desc:'Understand the regulatory framework, licensing requirements, and your ongoing obligations.',                         level:'REQUIRED',    progress:0, minutes:35 },
    { num:2, icon:'⬡', title:'Production Readiness',              desc:'Build compliant operational practices, facility standards, and operational controls.',                               level:'REQUIRED',    progress:0, minutes:45 },
    { num:3, icon:'⬟', title:'Testing, COA & Compliance',         desc:'Navigate testing requirements, COAs, batch release, and quality assurance.',                                        level:'REQUIRED',    progress:0, minutes:40 },
    { num:4, icon:'◈', title:'Buyer & Export Readiness',           desc:'Meet buyer expectations, understand export fundamentals, and documentation for international markets.',            level:'RECOMMENDED', progress:0, minutes:50 },
    { num:5, icon:'⊟', title:'Evidence & Documentation',           desc:'Master recordkeeping, evidence management, and audit readiness for regulators and buyers.',                        level:'OPTIONAL',    progress:0, minutes:30 },
  ]
  return defaults.map((m, i) => {
    const cat = eduCats[i]
    if (!cat) return m
    return { ...m, icon: cat.icon || m.icon, title: cat.title || m.title, desc: cat.desc || m.desc }
  })
}

const PATHWAY_STEPS = [
  { num:1, label:'Foundations',  unlocked:true  },
  { num:2, label:'Compliance',   unlocked:true  },
  { num:3, label:'Application',  unlocked:false },
  { num:4, label:'Approval',     unlocked:false },
  { num:5, label:'Market Access',unlocked:false },
]

// ── EducationPage ──────────────────────────────────────────────────────────────

const EducationPage = React.memo(function EducationPage({
  country, region, role, eduCategories, liveTiles, recentEduModules, signals, pathwayData, educationTracks = [], onPageChange,
}: {
  country:           { iso2: string; label: string }
  region:            string
  role:              string
  eduCategories:     { icon: string; title: string; desc: string }[]
  liveTiles?:        LiveEduTile[]
  recentEduModules?: RecentEduModule[]
  signals?:          DashboardSignal[]
  pathwayData?:      PathwayData
  educationTracks?:  EducationTrack[]
  onPageChange?:     (page: CommandPage) => void
}) {
  const modules    = useMemo(() => buildLearningPath(eduCategories), [eduCategories])
  const roleDisp   = role ? role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Professional'
  const nextModule = modules.find(m => m.progress < 100 && m.level === 'REQUIRED')

  const REL_EVIDENCE = useMemo(() => {
    if (liveTiles && liveTiles.length > 0) {
      return liveTiles.slice(0, 3).map(t => ({ tag: 'EDUCATION', title: t.title, date: '—' }))
    }
    const eduSigs = (signals ?? []).filter(s => deriveSignalGroup(s.title) === 'EVIDENCE UPDATES').slice(0, 3)
    if (eduSigs.length > 0) return eduSigs.map(s => ({ tag: 'SIGNAL', title: s.title, date: s.timeAgo }))
    return [
      { tag: 'REGULATION', title: `${country.label} Regulatory Framework Overview`, date: '—' },
      { tag: 'GUIDANCE',   title: 'Cultivation Facility Standards Guide',            date: '—' },
      { tag: 'TEMPLATE',   title: 'Sample COA Requirements',                         date: '—' },
    ]
  }, [liveTiles, signals, country.label])

  const RECENT_UPDATES = useMemo(() => {
    if (recentEduModules && recentEduModules.length > 0) {
      return recentEduModules.map(m => ({
        title:  m.title,
        detail: m.detail,
        date:   m.updated_at
          ? new Date(m.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—',
      }))
    }
    return [
      { title: 'Testing, COA & Compliance',        detail: 'Added batch release & recall guidance', date: '—' },
      { title: 'Buyer & Export Readiness',          detail: 'Updated export documentation overview', date: '—' },
      { title: 'Licence & Regulatory Foundations',  detail: 'Clarified reporting obligations',       date: '—' },
    ]
  }, [recentEduModules])

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main ────────────────────────────────────────────── */}
      <div className="cc-two-main">
        <div className="cc-inner-header cc-edu-header-row">
          <span className="cc-edu-hd-icon">📋</span>
          <div>
            <h2>{country.label} {roleDisp} Learning Path</h2>
            <p>Build the knowledge and documentation discipline that drives compliance, export eligibility, and market access.</p>
          </div>
        </div>

        <div className="cc-section-label">LEARNING MODULES</div>

        <div className="cc-edu-modules">
          {modules.map(m => (
            <div key={m.num} className="cc-edu-row">
              <div className="cc-edu-row-icon"><span>{m.icon}</span></div>
              <div className="cc-edu-row-body">
                <div className="cc-edu-row-title">
                  <strong>{m.num}. {m.title}</strong>
                  <span className={`cc-edu-badge ${m.level.toLowerCase()}`}>{m.level}</span>
                </div>
                <p>{m.desc}</p>
                <small className="cc-edu-time">◷ {m.minutes} min</small>
              </div>
              <div className="cc-edu-row-prog">
                {m.progress > 0
                  ? <><span className="cc-edu-pct">{m.progress}% complete</span>
                      <div className="cc-edu-track"><div className="cc-edu-fill" style={{width:`${m.progress}%`}}/></div></>
                  : <span className="cc-edu-ns">Not started</span>
                }
              </div>
              <button className={`cc-edu-cta ${m.progress>0?'continue':'start'}`}>
                {m.progress>0?'Continue':'Start module'}
              </button>
            </div>
          ))}
        </div>

        <div className="cc-edu-pathway-wrap">
          <div className="cc-section-label">EDUCATION UNLOCKS ACCESS PATHWAY STEPS</div>
          <div className="cc-edu-steps">
            {(pathwayData?.steps?.length
                ? pathwayData.steps.slice(0, 5).map(s => ({
                    num: s.step_number, label: s.title,
                    unlocked: s.step_number < (pathwayData.progress?.current_step ?? 1),
                  }))
                : PATHWAY_STEPS
              ).map((step, i) => (
              <React.Fragment key={step.num}>
                <div className={`cc-edu-step ${step.unlocked?'unlocked':'locked'}`}>
                  <div className="cc-edu-step-circ">{step.unlocked?'✓':'🔒'}</div>
                  <span className="cc-edu-step-name">{step.num}. {step.label}</span>
                  <span className="cc-edu-step-st">{step.unlocked?'Unlocked':'Locked'}</span>
                </div>
                {i < PATHWAY_STEPS.length-1 && <span className="cc-step-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="cc-edu-pathway-foot">
            <p>Complete required modules to unlock and advance each step.</p>
            <button className="cc-edu-pathway-btn">View Access Pathway →</button>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">RELATED EVIDENCE <Link href="/education" className="cc-right-link ml-auto">View all →</Link></div>
          {REL_EVIDENCE.map(e => (
            <div key={e.title} className="cc-edu-ev-row">
              <span className="cc-edu-ev-icon">⊟</span>
              <div>
                <strong>{e.title}</strong>
                <div className="cc-edu-ev-meta">
                  <span className="cc-edu-ev-tag">{e.tag}</span>
                  <small>{e.date}</small>
                </div>
              </div>
            </div>
          ))}
          <Link href="/dashboard?page=evidence" className="cc-right-link">Go to Evidence &amp; Sources →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">RECENTLY UPDATED MODULES <Link href="/education" className="cc-right-link ml-auto">View all →</Link></div>
          {RECENT_UPDATES.map(u => (
            <div key={u.title} className="cc-edu-ev-row">
              <span className="cc-edu-ev-icon">⊟</span>
              <div>
                <strong>{u.title}</strong>
                <small>{u.detail}</small>
                <span className="cc-change-time">{u.date}</span>
              </div>
            </div>
          ))}
        </div>

        {nextModule && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <div className="cc-nba-card">
              <div className="cc-nba-card-icon">◎</div>
              <div>
                <strong>Continue {nextModule.title}</strong>
                <small>You&apos;re {nextModule.progress}% complete</small>
                <p>Finishing this module unlocks the Compliance step and accelerates pathway progression.</p>
              </div>
            </div>
            <button className="cc-nba-btn full">Continue module →</button>
            <Link href="/education" className="cc-right-link">View module details →</Link>
          </div>
        )}

        {educationTracks.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">LEARNING TRACKS</div>
            {educationTracks.slice(0, 6).map(t => (
              <div key={t.id} className="cc-edu-ev-row">
                <span className="cc-edu-ev-icon">{t.icon ?? '⬛'}</span>
                <div>
                  <strong>{t.title}</strong>
                  <small>{t.level ?? 'Track'}{t.description ? ` · ${t.description.slice(0, 60)}` : ''}</small>
                </div>
              </div>
            ))}
            <Link href="/education" className="cc-right-link">Browse all tracks →</Link>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">NEED HELP?</div>
          <div className="cc-need-help">
            <span>⬟</span>
            <div>
              <p>Book a session with a Harbourview Advisor.</p>
              <button className="cc-nba-btn" style={{marginTop:'8px'}}>Book now</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
})

// ── RegulatoryWatchPage ───────────────────────────────────────────────────────

const RW_TABS = [
  { id: 'recent',        label: 'Recent Changes' },
  { id: 'pending',       label: 'Pending Reform' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'enforcement',   label: 'Enforcement / Restrictions' },
  { id: 'comparable',    label: 'Comparable Jurisdictions' },
  { id: 'international', label: 'International Movement' },
]

const RegulatoryWatchPage = React.memo(function RegulatoryWatchPage({
  country, region, role, signals, watchlistData, countryIntel, sourceCoverage,
}: {
  country:         { iso2: string; label: string }
  region:          string
  role:            string
  signals:         DashboardSignal[]
  watchlistData?:  WatchlistData
  countryIntel?:   CountryIntelProfile | null
  sourceCoverage?: SourceCoverageRow[]
}) {
  const [activeTab, setActiveTab] = useState('recent')

  const regSignals = useMemo(() =>
    signals.filter(s => {
      const g = deriveSignalGroup(s.title)
      return g === 'REGULATORY' || g === 'TESTING & COMPLIANCE'
    }),
    [signals],
  )

  const lastChange = regSignals[0] ?? signals[0] ?? null

  const RW_CONF_BARS = useMemo(() => buildConfidenceBars(countryIntel).slice(0, 4), [countryIntel])
  const rwOverall = Math.round(RW_CONF_BARS.reduce((s, b) => s + b.pct, 0) / RW_CONF_BARS.length)

  const WATCH_TRIGGERS = useMemo(() => {
    const rules = watchlistData?.rules ?? []
    if (rules.length > 0) {
      const TYPE_LABELS: Record<string, string> = {
        jurisdiction: 'Jurisdiction Changes',  signal: 'Signal Monitoring',
        pathway: 'Pathway Updates',            marketplace: 'Marketplace Activity',
        source: 'Source Monitoring',           policy: 'Policy Changes',
      }
      return rules.map(r => ({
        label: TYPE_LABELS[r.rule_type] ?? r.rule_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        on: true,
      }))
    }
    return [
      { label: 'Rulemaking (Regulatory)', on: true  },
      { label: 'Legislation & Bills',     on: true  },
      { label: 'Taxation Changes',        on: true  },
      { label: 'Enforcement Actions',     on: true  },
      { label: 'Local Ordinances',        on: false },
      { label: 'Federal Developments',    on: false },
    ]
  }, [watchlistData])

  const COMPARABLE = useMemo(() => {
    const uniqueMarkets = [...new Set(signals.map(s => s.market).filter(m => m && m !== country.label))]
    if (uniqueMarkets.length > 0) {
      return uniqueMarkets.slice(0, 5).map(m => ({
        label:  m,
        status: signals.filter(s => s.market === m).some(s => s.confidence >= 80) ? 'Reform Active' : 'Stable',
        active: signals.filter(s => s.market === m).some(s => s.confidence >= 80),
      }))
    }
    return [
      { label: 'California',     status: 'Stable',        active: false },
      { label: 'Michigan',       status: 'Reform Active', active: true  },
      { label: 'Massachusetts',  status: 'Reform Active', active: true  },
      { label: 'Colorado',       status: 'Stable',        active: false },
      { label: 'Ontario, Canada',status: 'Stable',        active: false },
    ]
  }, [signals, country])
  const POLICY_QS = useMemo(() => {
    // Aggregate signal titles into policy areas; generate open questions per area
    const areaCounts: Record<string, number> = {}
    regSignals.concat(signals).forEach(s => {
      const a = derivePolicyArea(s.title)
      areaCounts[a] = (areaCounts[a] ?? 0) + 1
    })
    const topAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area)

    const AREA_QUESTIONS: Record<string, string> = {
      'Licensing & Permits':       `How will ${country.label} licensing caps or moratoriums evolve?`,
      'Testing & Compliance':      `How will testing standards align with international benchmarks in ${country.label}?`,
      'Export Access':             `Which export pathway developments will open new markets from ${country.label}?`,
      'Import Rules':              `How will import permit and documentation requirements change?`,
      'Tax & Pricing':             'Will taxation policy changes affect product pricing and margin structure?',
      'Advertising & Marketing':   'Could advertising restrictions broaden to digital and social channels?',
      'Product Standards':         'How will product and packaging standards evolve under current reform proposals?',
      'Enforcement':               `What enforcement priorities are most likely to affect operators in ${country.label}?`,
      'Federal & National Policy': `How will national-level regulatory reform affect ${country.label} operations?`,
      'Medical Programme':         `What changes to the medical programme will affect patient access in ${country.label}?`,
      'Other Regulatory':          `How will upcoming regulatory amendments affect compliance obligations?`,
    }

    if (topAreas.length > 0) {
      return topAreas.map(a => AREA_QUESTIONS[a] ?? `How will ${a.toLowerCase()} developments affect ${country.label} operators?`)
    }

    // Fallback: country-aware generic questions
    if (country.iso2 === 'US') return [
      'Will local option sales tax authority expand?',
      'How will packaging rules align with child-resistant standards?',
      'Could advertising restrictions broaden to digital channels?',
    ]
    return [
      `How will ${country.label} regulatory reform affect operator licensing obligations?`,
      `What market access pathway changes are expected in the next legislative cycle?`,
      `How will international standards influence ${country.label} testing and compliance requirements?`,
    ]
  }, [regSignals, signals, country])
  const SOURCE_GAPS = useMemo(() => {
    // Priority 1: live source_registry data — 683 active sources with type+tier per market
    if (sourceCoverage && sourceCoverage.length > 0) {
      const TYPE_LABELS: Record<string, { label: string; level: 'high' | 'medium' | 'low' }> = {
        regulator: { label: 'Official Regulatory & Government Sources', level: 'high'   },
        trade:     { label: 'Industry & Trade Publications',            level: 'medium' },
        news:      { label: 'News & Mainstream Media Coverage',         level: 'low'    },
      }
      const coveredTypes = new Set(
        sourceCoverage.filter(r => r.tier <= 2).map(r => r.source_type),
      )
      const missing = Object.entries(TYPE_LABELS)
        .filter(([type]) => !coveredTypes.has(type))
        .map(([, v]) => v).slice(0, 3)
      if (missing.length > 0) return missing

      const tier1Types = new Set(sourceCoverage.filter(r => r.tier === 1).map(r => r.source_type))
      const needsTier1 = Object.entries(TYPE_LABELS)
        .filter(([type]) => !tier1Types.has(type))
        .map(([, v]) => ({ label: `Tier-1 ${v.label}`, level: v.level })).slice(0, 3)
      if (needsTier1.length > 0) return needsTier1

      return [{ label: 'All primary source types covered for this market', level: 'low' as const }]
    }

    // Priority 2: signal group coverage gaps
    const covered = new Set(regSignals.map(s => deriveSignalGroup(s.title)))
    const GROUP_MAP: Record<string, { label: string; level: 'high' | 'medium' | 'low' }> = {
      'REGULATORY':           { label: 'Regulatory Guidance & Bulletins', level: 'high'   },
      'TESTING & COMPLIANCE': { label: 'Testing Standards & Lab Reports', level: 'high'   },
      'LICENSING':            { label: 'Licensing & Permit Registers',     level: 'high'   },
      'ENFORCEMENT':          { label: 'Enforcement Disposition Data',     level: 'high'   },
      'EXPORT ACCESS':        { label: 'Export Pathway Documentation',     level: 'medium' },
      'POLICY UPDATES':       { label: 'Legislative & Policy Tracking',    level: 'medium' },
    }
    const sigGaps = Object.entries(GROUP_MAP)
      .filter(([g]) => !covered.has(g as SignalGroup))
      .map(([, v]) => v).slice(0, 3)
    if (sigGaps.length > 0) return sigGaps

    const dc = (countryIntel?.data_completeness ?? '').toLowerCase()
    if (dc === 'partial' || dc === 'low') return [
      { label: 'Local Ordinance & Municipal Texts', level: 'medium' as const },
      { label: 'Enforcement Disposition Data',      level: 'high'   as const },
      { label: 'Court & Appellate Decisions',       level: 'medium' as const },
    ]
    return [
      { label: 'Enforcement Disposition Data',      level: 'high'   as const },
      { label: 'Local Ordinance Texts',             level: 'medium' as const },
      { label: 'Court Decisions (Appellate)',       level: 'medium' as const },
    ]
  }, [sourceCoverage, signals, regSignals, countryIntel])

  const displaySignals = regSignals.length > 0 ? regSignals : signals

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Regulatory Watch</h2>
          <p>Continuous monitoring of regulatory and policy developments that may impact your{role ? ` ${role.toLowerCase()}` : ''} operations.</p>
        </div>

        {/* ── Summary bar ───────────────────────────────────── */}
        <div className="cc-rw-summary">
          <div className="cc-rw-card">
            <div className="cc-rw-card-lbl">◎ POSTURE BRIEF</div>
            <strong className="cc-rw-posture-title">{countryIntel?.briefing_regulatory_outlook ?? 'Stable with targeted reform activity.'}</strong>
            <p>Operational environment remains stable with measured progress on facility rules and testing standards. Monitor taxation and packaging proposals.</p>
          </div>

          <div className="cc-rw-card">
            <div className="cc-rw-card-lbl">● OPERATING STATE</div>
            <div className="cc-rw-operating">
              <span className="cc-status-dot" />
              <strong>Stable</strong>
            </div>
            <p>No immediate material risk changes identified.</p>
          </div>

          <div className="cc-rw-card cc-rw-conf-card">
            <div className="cc-rw-card-lbl">EVIDENCE CONFIDENCE</div>
            <div className="cc-rw-conf-inner">
              <div className="cc-rw-donut-wrap">
                <svg viewBox="0 0 52 52" className="cc-donut-svg">
                  <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="5"/>
                  <circle cx="26" cy="26" r="20" fill="none" stroke="var(--cc-gold)" strokeWidth="5"
                    strokeDasharray={`${125.7 * rwOverall / 100} 125.7`}
                    strokeLinecap="round" transform="rotate(-90 26 26)"
                  />
                </svg>
                <div className="cc-donut-label">
                  <strong>{rwOverall}%</strong>
                </div>
              </div>
              <div className="cc-rw-conf-bars">
                {RW_CONF_BARS.map(b => (
                  <div key={b.label} className="cc-conf-mini-row">
                    <span>{b.label}</span>
                    <div className="cc-conf-bar-track"><div className="cc-conf-bar-fill" style={{width:`${b.pct}%`}}/></div>
                    <span className="cc-conf-bar-pct">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/signals" className="cc-right-link">View change brief →</Link>
          </div>

          <div className="cc-rw-card">
            <div className="cc-rw-card-lbl">📅 LAST MEANINGFUL CHANGE</div>
            {lastChange ? (
              <>
                <strong className="cc-rw-change-date">{lastChange.timeAgo}</strong>
                <p>{lastChange.title.slice(0, 80)}{lastChange.title.length > 80 ? '…' : ''}</p>
              </>
            ) : (
              <p>No recent changes recorded.</p>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="cc-mkt-tabs">
          {RW_TABS.map(t => (
            <button key={t.id}
              className={`cc-mkt-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {/* ── Events table ──────────────────────────────────── */}
        <div className="cc-rw-table-wrap">
          <div className="cc-rw-thead">
            <span className="cc-mkt-th event-col">EVENT</span>
            <span className="cc-mkt-th">JURISDICTION</span>
            <span className="cc-mkt-th">POLICY AREA</span>
            <span className="cc-mkt-th">IMPACT</span>
            <span className="cc-mkt-th">CONFIDENCE</span>
            <span className="cc-mkt-th">AFFECTS YOU</span>
            <span className="cc-mkt-th">SOURCE STATUS</span>
            <span className="cc-mkt-th">ACTION</span>
          </div>

          {displaySignals.length === 0 ? (
            <div className="cc-empty-state">
              <span>◎</span>
              <p>No regulatory events for {country.label}.</p>
            </div>
          ) : (
            displaySignals.slice(0, 8).map((s, i) => {
              const imp = deriveImpact(s.confidence)
              const dir = imp === 'High' ? '↑' : imp === 'Medium' ? '✕' : '—'
              return (
                <div key={i} className="cc-rw-row">
                  <div className="cc-rw-cell event-col">
                    <span className={`cc-sig-dot ${imp.toLowerCase()}`} />
                    <div>
                      <strong>{s.title}</strong>
                      <small>{s.market} · {s.timeAgo}</small>
                    </div>
                  </div>
                  <div className="cc-rw-cell">
                    <span>{s.market}</span>
                    <small>Statewide</small>
                  </div>
                  <div className="cc-rw-cell">{derivePolicyArea(s.title)}</div>
                  <div className="cc-rw-cell">
                    <span className={`cc-rw-impact ${imp.toLowerCase()}`}>{dir} {imp}</span>
                  </div>
                  <div className="cc-rw-cell cc-rw-conf-cell">
                    <div className="cc-conf-bar-track">
                      <div className="cc-conf-bar-fill" style={{width:`${s.confidence}%`}}/>
                    </div>
                    <small>{s.confidence}%</small>
                  </div>
                  <div className="cc-rw-cell"><span className="cc-affects-yes">✓ Yes</span></div>
                  <div className="cc-rw-cell"><span className="cc-source-badge">Official Source</span></div>
                  <div className="cc-rw-cell">
                    <Link href={s.slug ? `/signals/${s.slug}` : '/signals'} className="cc-sig-brief">Open brief</Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="cc-feed-footer">
          <Link href="/signals" className="cc-right-link">View all events →</Link>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">WATCH TRIGGERS</div>
          {WATCH_TRIGGERS.map(t => (
            <div key={t.label} className="cc-trigger-row">
              <span>{t.label}</span>
              <span className={`cc-trigger-dot ${t.on ? 'on' : ''}`}>●</span>
            </div>
          ))}
          <Link href="/signals" className="cc-right-link">Manage triggers →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">COMPARABLE JURISDICTIONS</div>
          {COMPARABLE.map(j => (
            <div key={j.label} className="cc-comp-row">
              <span className="cc-comp-label">{j.label}</span>
              <span className={`cc-comp-status ${j.active ? 'active' : ''}`}>{j.status}</span>
              <span className={`cc-comp-dot ${j.active ? 'active' : ''}`}>●</span>
            </div>
          ))}
          <Link href="/dashboard?page=countries" className="cc-right-link">View comparisons →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">OPEN POLICY QUESTIONS</div>
          {POLICY_QS.map((q, i) => (
            <div key={i} className="cc-policy-q">
              <span className="cc-policy-q-icon">?</span>
              <span>{q}</span>
            </div>
          ))}
          <Link href="/intelligence" className="cc-right-link">View all questions →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SOURCE GAPS</div>
          {SOURCE_GAPS.map(g => (
            <div key={g.label} className="cc-source-gap-row">
              <span>{g.label}</span>
              <span className={`cc-gap-badge ${g.level}`}>{g.level === 'high' ? 'High Gap' : 'Medium Gap'}</span>
            </div>
          ))}
          <Link href="/dashboard?page=evidence" className="cc-right-link">Improve coverage →</Link>
        </div>
      </aside>
    </div>
  )
})

// ── SettingsPage ───────────────────────────────────────────────────────────────

const SAVED_PRESETS = [
  { label: 'Overview',               type: 'Default' },
  { label: 'Regulatory Radar',       type: 'Custom'  },
  { label: 'Market Access Monitor',  type: 'Custom'  },
  { label: 'Evidence Deep Dive',     type: 'Custom'  },
  { label: 'Legislative Tracker',    type: 'Custom'  },
]

const SettingsPage = React.memo(function SettingsPage({
  country, region, role, countryOptions, roleOptions, onCountryChange, onRoleChange,
}: {
  country:          { iso2: string; label: string }
  region:           string
  role:             string
  countryOptions:   SelectOpt[]
  roleOptions:      SelectOpt[]
  onCountryChange?: (iso2: string) => void
  onRoleChange?:    (role: string) => void
}) {
  const [watchlistAlerts, setWatchlistAlerts] = useState(true)
  const [signalsAlerts,   setSignalsAlerts]   = useState(true)
  const [mapPref,         setMapPref]         = useState('globe')
  const [reducedMotion,   setReducedMotion]   = useState(false)
  const [evidenceConf,    setEvidenceConf]    = useState('standard')

  const roleLabel = roleOptions.find(o => o.value === role)?.label ?? role

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>Command Centre Settings</h2>
          <p>Manage your context, preferences, notifications, display behavior, and saved views.</p>
        </div>

        <div className="cc-settings-rows">

          {/* Context Preferences */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">◎</div>
            <div className="cc-settings-row-body">
              <strong>Context Preferences</strong>
              <p>Control how your route context, regions, and data are applied across the Command Centre.</p>
            </div>
            <div className="cc-settings-row-right">
              <span>Manage context behavior</span>
              <span className="cc-settings-chev">›</span>
            </div>
          </div>

          {/* Role / Intent */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">◈</div>
            <div className="cc-settings-row-body">
              <strong>Role / Intent Settings</strong>
              <p>Define your role, intent, and operating focus to tailor insights and recommendations.</p>
            </div>
            <div className="cc-settings-row-right">
              <div className="cc-settings-row-ctrl">
                <small>Role</small>
                <CustomSelect value={role} options={roleOptions} placeholder="Select role" onChange={v => onRoleChange?.(v)} className="cc-settings-sel" />
              </div>
              <span className="cc-settings-chev">›</span>
            </div>
          </div>

          {/* Jurisdiction Defaults */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">⬡</div>
            <div className="cc-settings-row-body">
              <strong>Jurisdiction Defaults</strong>
              <p>Set your default country and state/territory for data, alerts, and jurisdictional views.</p>
            </div>
            <div className="cc-settings-row-right cc-settings-juris">
              <div className="cc-settings-juris-col">
                <small>COUNTRY</small>
                <CustomSelect value={country.iso2} options={countryOptions} onChange={v => onCountryChange?.(v)} className="cc-settings-sel" />
              </div>
              {region && (
                <div className="cc-settings-juris-col">
                  <small>STATE</small>
                  <span className="cc-settings-region">{region}</span>
                </div>
              )}
              <button className="cc-settings-edit-btn">Edit Defaults</button>
            </div>
          </div>

          {/* Notification Rules */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">◷</div>
            <div className="cc-settings-row-body">
              <strong>Notification Rules</strong>
              <p>Configure alerts and notifications for watchlist items, signals, and regulatory changes.</p>
            </div>
            <div className="cc-settings-row-right cc-settings-notifs">
              <div className="cc-settings-notif-col">
                <small>WATCHLIST ALERTS</small>
                <button
                  className={`cc-toggle ${watchlistAlerts ? 'on' : ''}`}
                  onClick={() => setWatchlistAlerts(v => !v)}
                  aria-pressed={watchlistAlerts}
                >
                  <span className="cc-toggle-thumb" />
                </button>
                <span className="cc-notif-desc">{watchlistAlerts ? 'Enabled' : 'Disabled'}</span>
                <small>Notify on new matches &amp; changes</small>
              </div>
              <div className="cc-settings-notif-col">
                <small>SIGNALS ALERTS</small>
                <button
                  className={`cc-toggle ${signalsAlerts ? 'on' : ''}`}
                  onClick={() => setSignalsAlerts(v => !v)}
                  aria-pressed={signalsAlerts}
                >
                  <span className="cc-toggle-thumb" />
                </button>
                <span className="cc-notif-desc">{signalsAlerts ? 'Enabled' : 'Disabled'}</span>
                <small>Notify on high &amp; critical signals</small>
              </div>
              <span className="cc-settings-chev">›</span>
            </div>
          </div>

          {/* Saved Views */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">⊟</div>
            <div className="cc-settings-row-body">
              <strong>Saved Views</strong>
              <p>Save and manage your custom views, filters, and dashboards.</p>
            </div>
            <div className="cc-settings-row-right">
              <div>
                <span>5 Saved Views</span>
                <small>Last updated {new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</small>
              </div>
              <span className="cc-settings-chev">›</span>
            </div>
          </div>

          {/* Display & Accessibility */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">⊞</div>
            <div className="cc-settings-row-body">
              <strong>Display &amp; Accessibility</strong>
              <p>Adjust map preferences, motion, contrast, and information density.</p>
            </div>
            <div className="cc-settings-row-right cc-settings-display">
              <div className="cc-settings-display-col">
                <small>MAP PREFERENCE</small>
                <CustomSelect value={mapPref} onChange={setMapPref} className="cc-settings-sel" options={[
                  { value: 'globe', label: '🌐 Globe View' },
                  { value: 'flat',  label: '⊞ Flat Map' },
                ]} />
                <small>Global perspective</small>
              </div>
              <div className="cc-settings-display-col">
                <small>REDUCED MOTION</small>
                <button
                  className={`cc-toggle ${reducedMotion ? 'on' : ''}`}
                  onClick={() => setReducedMotion(v => !v)}
                  aria-pressed={reducedMotion}
                >
                  <span className="cc-toggle-thumb" />
                </button>
                <small>{reducedMotion ? 'Animations disabled' : 'Animations enabled'}</small>
              </div>
              <div className="cc-settings-display-col">
                <small>EVIDENCE CONFIDENCE</small>
                <CustomSelect value={evidenceConf} onChange={setEvidenceConf} className="cc-settings-sel" options={[
                  { value: 'standard',  label: '⊟ Standard' },
                  { value: 'detailed',  label: '⊟ Detailed' },
                  { value: 'minimal',   label: '⊟ Minimal' },
                ]} />
                <small>Show 3 of 5 levels</small>
              </div>
              <span className="cc-settings-chev">›</span>
            </div>
          </div>

          {/* Account */}
          <div className="cc-settings-row">
            <div className="cc-settings-row-icon">⊙</div>
            <div className="cc-settings-row-body">
              <strong>Account</strong>
              <p>Manage your account, security settings, and session preferences.</p>
            </div>
            <div className="cc-settings-row-right cc-settings-account">
              {['Profile & Organization', 'Security Settings', 'Session Preferences'].map(item => (
                <div key={item} className="cc-settings-account-row">
                  <span>{item}</span>
                  <span className="cc-settings-chev">›</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">ACTIVE CONTEXT</div>
          <div className="cc-ctx-rows">
            <div className="cc-ctx-row">
              <span className="cc-ctx-flag">🌐</span>
              <div>
                <strong>{country.label}</strong>
                <small>Country</small>
              </div>
            </div>
            {region && (
              <div className="cc-ctx-row">
                <span className="cc-ctx-flag">⬡</span>
                <div>
                  <strong>{region}</strong>
                  <small>State / Region</small>
                </div>
              </div>
            )}
            <div className="cc-ctx-row">
              <span className="cc-ctx-flag">◈</span>
              <div>
                <strong>{roleLabel || 'No role set'}</strong>
                <small>Role</small>
              </div>
            </div>
            <div className="cc-ctx-row">
              <span className="cc-ctx-flag">📅</span>
              <div>
                <strong>{new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</strong>
                <small>As of {new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</small>
              </div>
            </div>
          </div>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SAVED VIEW PRESETS</div>
          {SAVED_PRESETS.map(p => (
            <div key={p.label} className="cc-preset-row">
              <span className="cc-preset-icon">⊟</span>
              <span className="cc-preset-label">{p.label === 'Overview' ? `${country.label} ${p.label}` : p.label}</span>
              <span className={`cc-preset-type ${p.type.toLowerCase()}`}>{p.type}</span>
            </div>
          ))}
          <Link href="/signals" className="cc-right-link">View all saved views →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SECURITY / SESSION</div>
          <div className="cc-security-rows">
            <div className="cc-security-row">
              <span className="cc-security-icon">◎</span>
              <div>
                <strong>Multi-Factor Authentication</strong>
                <small>Account security</small>
              </div>
              <span className="cc-security-badge enabled">Enabled</span>
            </div>
            <div className="cc-security-row">
              <span className="cc-security-icon">⊙</span>
              <div>
                <strong>Session Status</strong>
                <small>Started {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
              <span className="cc-security-badge active">Active</span>
            </div>
          </div>
          <button className="cc-signout-btn" onClick={async () => {
            try {
              const { createClient } = await import('@supabase/supabase-js')
              const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!)
              await sb.auth.signOut()
            } catch {}
            window.location.href = '/'
          }}>↗ Sign Out</button>
        </div>
      </aside>
    </div>
  )
})

// ── LocalIntelPage ────────────────────────────────────────────────────────────

// LI_CONSTRAINTS, LI_ROUTES, LI_COVERAGE, LI_OPEN_QS: derived dynamically inside LocalIntelPage

function buildMunicipalData(country: { iso2: string; label: string }, region: string) {
  if (country.iso2 === 'US') {
    const base = region || 'Florida'
    return [
      { name: 'Miami-Dade County',      status: 'medium' as const, note: 'Dispensary caps in place' },
      { name: 'Orlando (Orange County)',status: 'high'   as const, note: 'Zoning moratorium active' },
      { name: 'Tampa (Hillsborough)',   status: 'high'   as const, note: 'Conditional approvals paused' },
      { name: 'Jacksonville (Duval)',   status: 'low'    as const, note: 'Accepting applications' },
      { name: 'Palm Beach County',      status: 'medium' as const, note: 'Case-by-case review' },
    ]
  }
  return [
    { name: `${country.label} Capital Region`, status: 'medium' as const, note: 'Review municipal requirements' },
    { name: `${country.label} Metro Areas`,    status: 'low'    as const, note: 'Contact local authorities' },
  ]
}

function buildAuthorities(country: { iso2: string; label: string }) {
  if (country.iso2 === 'US') {
    return {
      top: { name: 'Office of Medical Marijuana Use (OMMU)', role: 'Program Lead', type: 'primary' as const },
      mid: [
        { name: 'FL Dept of Health',                          role: 'Health Oversight',        type: 'primary' as const },
        { name: 'FL Dept of Agriculture & Consumer Services', role: 'Lab & Product Oversight', type: 'oversight' as const },
        { name: 'FL Office of Insurance Regulation',          role: 'Licensing & Compliance',  type: 'oversight' as const },
      ],
      bot: [
        { name: 'Division of Law Enforcement (MMJ Team)', role: 'Investigations & Enforcement', type: 'enforcement' as const },
        { name: 'Local Law Enforcement Agencies',         role: 'Local Enforcement',            type: 'enforcement' as const },
      ],
      keyList: [
        { name: 'Office of Medical Marijuana Use (OMMU)',            role: 'Program lead & licensure' },
        { name: 'Florida Department of Health',                      role: 'Health oversight' },
        { name: 'FL Dept of Agriculture & Consumer Services',        role: 'Lab & product oversight' },
        { name: 'Division of Law Enforcement (MMJ Enforcement Team)',role: 'Investigations & enforcement' },
      ],
    }
  }
  return {
    top: { name: `${country.label} National Regulator`, role: 'Primary Regulatory Body', type: 'primary' as const },
    mid: [
      { name: 'Health Ministry',    role: 'Health & Access Oversight',    type: 'primary' as const },
      { name: 'Licensing Body',     role: 'Licensing & Compliance',       type: 'oversight' as const },
      { name: 'Trade Enforcement',  role: 'Market Oversight',             type: 'oversight' as const },
    ],
    bot: [
      { name: 'Enforcement Agency', role: 'Investigations & Enforcement', type: 'enforcement' as const },
      { name: 'Local Authorities',  role: 'Local Enforcement',            type: 'enforcement' as const },
    ],
    keyList: [
      { name: `${country.label} National Regulator`, role: 'Primary regulatory body' },
      { name: 'Health Ministry',                     role: 'Health & access oversight' },
    ],
  }
}

const LocalIntelPage = React.memo(function LocalIntelPage({
  country, region, role, signals, countryIntel, localIntel,
}: {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  signals:      DashboardSignal[]
  countryIntel?: CountryIntelProfile | null
  localIntel?:   LocalIntelData | null
}) {
  const municipalities = useMemo(() => buildMunicipalData(country, region), [country, region])
  const authorities    = useMemo(() => buildAuthorities(country), [country])

  // ── Dynamic local intel content derived from countryIntel + signals ──────────
  const LI_CONSTRAINTS = useMemo(() => {
    if (countryIntel) {
      const items: { icon: string; label: string; text: string }[] = []
      if (countryIntel.medical_status) items.push({ icon:'◎', label:'Medical Programme', text:`Status: ${fmtStatus(countryIntel.medical_status)}. Operator compliance required under national health authority rules.` })
      if (countryIntel.market_access_status) items.push({ icon:'⊞', label:'Market Access', text:`Classification: ${fmtStatus(countryIntel.market_access_status)}. Verify operator entry requirements before commercial engagement.` })
      if (countryIntel.import_status) items.push({ icon:'↓', label:'Import Constraints', text:`Pathway: ${fmtStatus(countryIntel.import_status)}. Documentation, permit and customs requirements apply.` })
      if (countryIntel.export_status) items.push({ icon:'↑', label:'Export Access', text:`Pathway: ${fmtStatus(countryIntel.export_status)}. GMP, country-of-origin, and consignment documentation required.` })
      if (items.length > 0) return items
    }
    if (country.iso2 === 'US') return [
      { icon:'⊞', label:'Zoning & Land Use',     text:'Local zoning approval required in most jurisdictions; moratoriums active in several counties.' },
      { icon:'⊟', label:'Cap & Licensing Limits', text:'Dispensary caps at state level; local license quotas may apply.' },
      { icon:'◉', label:'Facility Siting',        text:'Buffer zones near schools, places of worship, and parks strictly enforced.' },
      { icon:'◷', label:'Inspection Backlog',     text:'Inspection backlog may extend time to licensure renewal or modification.' },
    ]
    return [
      { icon:'◎', label:'Licensing Requirements',  text:`Verify licensing and permit requirements with the ${country.label} national regulatory authority.` },
      { icon:'⊟', label:'Market Access Rules',     text:'Contact local authorities to confirm current market access conditions and operational constraints.' },
      { icon:'◷', label:'Compliance Obligations',  text:'Maintain current documentation and certification as required by national regulations.' },
      { icon:'⊞', label:'Local Requirements',      text:'Subnational and municipal requirements may vary; confirm with local government offices.' },
    ]
  }, [country, countryIntel])

  const LI_ROUTES = useMemo(() => {
    if (country.iso2 === 'US') return [
      { icon:'⬡', label:'In-State Cultivation → Processing', text:'Vertical integration required; limited third-party processing options.' },
      { icon:'◈', label:'Processing → Dispensary',           text:'Direct delivery with prior regulatory approval; chain-of-custody mandatory.' },
      { icon:'⊟', label:'Out-of-State Inputs',               text:'Restricted; only approved ancillary inputs permitted.' },
      { icon:'◎', label:'Waste Disposal',                    text:'Use licensed waste transporters; records retention required.' },
    ]
    const cats = countryIntel?.opportunity_categories ?? []
    if (cats.length > 0) {
      const ICON_MAP: Record<string, string> = { export:'↑', import:'↓', medical:'◎', retail:'⊞', cultivation:'⬡', processing:'⬟', distribution:'◈' }
      return cats.slice(0, 4).map(cat => {
        const key  = cat.toLowerCase()
        const icon = Object.entries(ICON_MAP).find(([k]) => key.includes(k))?.[1] ?? '⬡'
        return { icon, label: cat.replace(/_/g,' ').replace(/\w/g, c => c.toUpperCase()), text: `${cat.replace(/_/g,' ')} commercial route available in ${country.label}.` }
      })
    }
    return [
      { icon:'⬡', label:'Domestic Supply Routes',    text:`Consult Harbourview to map available commercial routes for ${country.label}.` },
      { icon:'◈', label:'Import / Export Pathways',  text:'Import/export routes subject to national regulatory framework. Request a pathway briefing.' },
      { icon:'◎', label:'Documentation Requirements',text:'Chain-of-custody, COA, and permit documentation required for all commercial movements.' },
    ]
  }, [country, countryIntel])

  const LI_COVERAGE = useMemo(() => [
    { label: 'National Regulatory Sources',  level: 'high'   as const },
    { label: 'Agency Guidance & Bulletins',  level: 'high'   as const },
    { label: 'Trade & Industry Sources',     level: 'medium' as const },
    { label: 'Local Government Notices',     level: 'medium' as const },
    { label: 'Legal & Legislative Tracking', level: 'high'   as const },
  ], [])

  const LI_OPEN_QS = useMemo(() => {
    const sigQs = signals.slice(0, 3).map(s => {
      const area = derivePolicyArea(s.title)
      return `How will ${area.toLowerCase()} developments affect operations in ${country.label}${region ? ` · ${region}` : ''}?`
    })
    if (sigQs.length > 0) return sigQs
    if (country.iso2 === 'US') return [
      'How will county-level zoning variances affect facility proximity requirements?',
      'What are local enforcement priorities for packaging and labelling?',
      'Will additional municipal licence caps be adopted in the next legislative cycle?',
    ]
    return [
      `What are the current enforcement priorities for licensed operators in ${country.label}?`,
      `How will regulatory developments affect market access in ${country.label}?`,
      `What documentation requirements apply to commercial activity in ${country.label}?`,
    ]
  }, [signals, country, region])

  const operatingNotes = useMemo(() => {
    const fromSignals = signals.slice(0, 5).map(s => ({
      text: s.title + (s.timeAgo ? ' · ' + s.timeAgo : '') + '.',
      level: deriveImpact(s.confidence).toLowerCase() as 'high' | 'medium' | 'low',
    }))
    if (fromSignals.length) return fromSignals
    return [{ text: `No active regulatory updates for ${country.label}.`, level: 'low' as const }]
  }, [signals, country])

  const nextBest = signals.find(s => s.confidence >= 80)
  const refreshTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  const refreshDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const TYPE_COLOR = {
    primary:    'var(--cc-gold)',
    oversight:  '#5b9bd5',
    enforcement:'var(--cc-green)',
  } as const

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="cc-inner-header cc-li-header">
          <div>
            <div className="cc-li-header-title">
              <span className="cc-li-header-icon">
                {country.iso2 === 'US' ? '🌴' : country.iso2 === 'CA' ? '🍁' : '🌐'}
              </span>
              <h2>{country.label}{region ? ` ${region}` : ''} Local Intel</h2>
            </div>
            <p>Subnational intelligence on operations, compliance, authorities, and market conditions</p>
            <small className="cc-li-refresh">Last refreshed: {refreshDate} · {refreshTime}</small>
          </div>
        </div>

        {/* ── Top section: Notes + Authorities map ─────────── */}
        <div className="cc-li-top">

          {/* Statewide notes */}
          <div className="cc-li-notes-panel">
            <div className="cc-section-label" style={{padding:'0 0 8px'}}>STATEWIDE OPERATING NOTES</div>
            <div className="cc-li-notes">
              {operatingNotes.map((n, i) => (
                <div key={i} className={`cc-li-note ${n.level}`}>
                  <span className="cc-li-note-dot" />
                  <span>{n.text}</span>
                </div>
              ))}
            </div>
            <Link href={`/country/${country.iso2.toLowerCase()}/intel`} className="cc-right-link" style={{marginTop:'10px',display:'inline-block'}}>View full state brief →</Link>
          </div>

          {/* Authorities org chart */}
          <div className="cc-li-auth-panel">
            <div className="cc-li-auth-header">
              <div className="cc-section-label" style={{padding:'0 0 8px'}}>AUTHORITIES MAP</div>
              <div className="cc-li-auth-legend">
                <span><span className="cc-auth-dot primary"/>State Authority (Primary)</span>
                <span><span className="cc-auth-dot oversight"/>Enforcement / Oversight</span>
                <span><span className="cc-auth-dot enforcement"/>Advisory / Support</span>
              </div>
            </div>

            <div className="cc-li-org">
              {/* Level 0 — top node */}
              <div className="cc-li-org-level top">
                <div className={`cc-li-org-node ${authorities.top.type}`}>
                  <span className="cc-li-org-node-name">{authorities.top.name}</span>
                  <span className="cc-li-org-node-role">{authorities.top.role}</span>
                </div>
              </div>
              <div className="cc-li-org-connector top-mid" />
              {/* Level 1 */}
              <div className="cc-li-org-level mid">
                {authorities.mid.map(node => (
                  <div key={node.name} className={`cc-li-org-node ${node.type}`}>
                    <span className="cc-li-org-node-name">{node.name}</span>
                    <span className="cc-li-org-node-role">{node.role}</span>
                  </div>
                ))}
              </div>
              <div className="cc-li-org-connector mid-bot" />
              {/* Level 2 */}
              <div className="cc-li-org-level bot">
                {authorities.bot.map(node => (
                  <div key={node.name} className={`cc-li-org-node ${node.type}`}>
                    <span className="cc-li-org-node-name">{node.name}</span>
                    <span className="cc-li-org-node-role">{node.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cc-li-auth-footer">
              <small>Hover or select for details</small>
              <Link href="/intelligence" className="cc-right-link">Explore authorities →</Link>
            </div>
          </div>
        </div>

        {/* ── Bottom grid ───────────────────────────────────── */}
        <div className="cc-li-grid">

          {/* Municipal Watch */}
          <div className="cc-li-grid-section">
            <div className="cc-section-label">MUNICIPAL WATCH</div>
            {municipalities.map(m => (
              <div key={m.name} className="cc-li-muni-row">
                <span className="cc-li-muni-icon">⊟</span>
                <div className="cc-li-muni-body">
                  <strong>{m.name}</strong>
                  <small>{m.note}</small>
                </div>
                <span className={`cc-li-muni-badge ${m.status}`}>
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </span>
              </div>
            ))}
            <Link href={`/country/${country.iso2.toLowerCase()}/intel`} className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}}>View all municipalities →</Link>
          </div>

          {/* Local Access Constraints */}
          <div className="cc-li-grid-section">
            <div className="cc-section-label">LOCAL ACCESS CONSTRAINTS</div>
            {LI_CONSTRAINTS.map(c => (
              <div key={c.label} className="cc-li-item">
                <span className="cc-li-item-icon">{c.icon}</span>
                <div>
                  <strong>{c.label}</strong>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
            <Link href="/compliance" className="cc-right-link" style={{marginTop:'4px',display:'inline-block'}}>View constraint detail →</Link>
          </div>

          {/* Local Commercial Routes */}
          <div className="cc-li-grid-section">
            <div className="cc-section-label">LOCAL COMMERCIAL ROUTES</div>
            {LI_ROUTES.map(r => (
              <div key={r.label} className="cc-li-item">
                <span className="cc-li-item-icon">{r.icon}</span>
                <div>
                  <strong>{r.label}</strong>
                  <p>{r.text}</p>
                </div>
              </div>
            ))}
            <Link href={`/compliance/country-pathways/${country.iso2.toLowerCase()}`} className="cc-right-link" style={{marginTop:'4px',display:'inline-block'}}>View routing guidance →</Link>
          </div>

          {/* Evidence Gaps */}
          <div className="cc-li-grid-section">
            <div className="cc-section-label">EVIDENCE GAPS <span style={{color:'var(--cc-dim)'}}>?</span></div>
            {LI_OPEN_QS.map((q, i) => (
              <div key={i} className="cc-li-gap-item">
                <span className="cc-policy-q-icon">?</span>
                <p>{q}</p>
              </div>
            ))}
            <Link href="/intelligence" className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}}>Submit intel request →</Link>
          </div>
        </div>

      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">KEY {country.label.toUpperCase()} AUTHORITIES</div>
          {authorities.keyList.map(a => (
            <div key={a.name} className="cc-li-auth-row">
              <div className="cc-li-auth-badge">⊙</div>
              <div>
                <strong>{a.name}</strong>
                <small>{a.role}</small>
              </div>
              <button className="cc-apply-btn" style={{flexShrink:0}}>View</button>
            </div>
          ))}
          <Link href="/intelligence" className="cc-right-link">View all authorities →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">LOCAL SOURCE COVERAGE</div>
          {LI_COVERAGE.map(c => (
            <div key={c.label} className="cc-li-cov-row">
              <span className="cc-li-cov-label">{c.label}</span>
              <span className={`cc-li-cov-level ${c.level}`}>{c.level.charAt(0).toUpperCase() + c.level.slice(1)}</span>
              <div className="cc-conf-bar-track" style={{width:'60px'}}>
                <div className="cc-conf-bar-fill" style={{
                  width: c.level==='high'?'85%':'55%',
                  background: c.level==='high'?'var(--cc-green)':'var(--cc-amber)',
                }}/>
              </div>
            </div>
          ))}
          <Link href="/dashboard?page=evidence" className="cc-right-link">View coverage map →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">OPEN LOCAL QUESTIONS</div>
          {LI_OPEN_QS.map((q, i) => (
            <div key={i} className="cc-policy-q">
              <span className="cc-policy-q-icon">?</span>
              <span>{q}</span>
            </div>
          ))}
          <Link href="/intelligence" className="cc-right-link">View all questions →</Link>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">
              Engage local planning authorities to confirm current zoning status for {country.label}{region ? ` · ${region}` : ''}.
            </p>
            <button className="cc-nba-btn full" style={{marginTop:'8px'}}>Create Action</button>
            <Link href="/signals" className="cc-right-link" style={{marginTop:'6px',display:'inline-block'}}>View Suggested Actions →</Link>
          </div>
        )}
      </aside>
    </div>
  )
})

const REQ_STATUS_ICON: Record<string, string> = {
  verified: '✓', in_review: '◎', pending: '○', rejected: '✕', waived: '—',
}
const REQ_STATUS_COLOR: Record<string, string> = {
  verified: 'var(--cc-green)', in_review: 'var(--cc-amber)',
  pending:  'var(--cc-dim)',   rejected:  'var(--cc-red)',   waived: 'var(--cc-dim)',
}

// ── Corridor Playbooks ────────────────────────────────────────────────────────

type Corridor = {
  from:             string
  to:               string
  status:           'Active' | 'Emerging' | 'Restricted' | 'Pilot'
  authority:        string
  permit:           string
  leadWeeks:        string
  docs:             string[]
  bottleneck:       string
  note:             string
  destLicenceClass: string
  clearanceDays:    string
  rejectionReasons: string[]
  keyRisk:          string
  timeline:         string
}

const CORRIDORS: Corridor[] = [
  // ── Established EU Medical Corridors ─────────────────────────────────────
  {
    from: 'Netherlands', to: 'Germany', status: 'Active', authority: 'BfArM / iBCS',
    permit: 'BfArM Import Permit', leadWeeks: '6–10',
    docs: ['COA (EU GMP)', 'Batch Release', 'Import Permit', 'GACP Certificate'],
    bottleneck: 'BfArM permit processing backlog; strict THC/CBD ratio limits',
    note: 'Highest-volume EU medical corridor. Bedrocan primary supplier. Intra-EU shipment via licensed wholesale.',
    destLicenceClass: 'BfArM Narcotics Import Permit (§3 BtMG)',
    clearanceDays: '3–5',
    rejectionReasons: ['THC/CBD ratio outside BfArM specification', 'Missing EU GMP batch release signatory', 'Incomplete GACP documentation'],
    keyRisk: 'BfArM processing backlog — 8–12 week queue common; plan permit applications 16+ weeks before target delivery',
    timeline: '10–16 weeks end-to-end',
  },
  {
    from: 'Canada', to: 'Germany', status: 'Active', authority: 'Health Canada / BfArM',
    permit: 'Section 56 Exemption + BfArM Import Permit', leadWeeks: '10–16',
    docs: ['EU GMP Certificate', 'COA', 'Import/Export Permit', 'GACP Cert', 'Batch Release'],
    bottleneck: 'EU GMP equivalency audit timeline; currency hedging on CAD/EUR',
    note: 'Largest trans-Atlantic medical corridor. Canopy, Aurora, Aphria all active. EU GMP audit is single biggest barrier.',
    destLicenceClass: 'BfArM Narcotics Import Permit (Schedule I BtMG)',
    clearanceDays: '5–8',
    rejectionReasons: ['EU GMP equivalency not recognised for facility', 'Health Canada export licence not in place', 'COA not formatted to EU GMP Annex 11 standard'],
    keyRisk: 'EU GMP equivalency — Canadian facilities must obtain full EU GMP audit; can add 6–12 months for first-time producers',
    timeline: '14–22 weeks end-to-end',
  },
  {
    from: 'Canada', to: 'United Kingdom', status: 'Active', authority: 'Health Canada / MHRA',
    permit: 'MHRA Import Licence + Home Office Authority', leadWeeks: '8–12',
    docs: ['MHRA Import Licence', 'COA', 'UK GMP Certificate', 'Home Office Controlled Drug Licence'],
    bottleneck: 'MHRA licence processing 8–12 weeks; Schedule 2 CDL requirements; post-Brexit UK GMP divergence',
    note: 'Growing post-2018 UK medical expansion. Tilray, Canopy, Aurora dominant. UK GMP now separate from EU GMP post-Brexit.',
    destLicenceClass: 'Schedule 2 Controlled Drug Importation Licence (MHRA / Home Office)',
    clearanceDays: '5–10',
    rejectionReasons: ['MHRA licence not issued before shipment', 'UK GMP not obtained (separate from EU GMP)', 'Product not on UK approved product list'],
    keyRisk: 'Post-Brexit dual GMP burden — UK GMP recognition is separate from EU GMP; producers must maintain both certifications for dual-market access',
    timeline: '12–18 weeks end-to-end',
  },
  {
    from: 'Portugal', to: 'Germany / EU', status: 'Active', authority: 'Infarmed / BfArM',
    permit: 'EU Import Permit', leadWeeks: '8–14',
    docs: ['EU GMP Certificate', 'COA', 'Phytosanitary', 'Import Permit', 'GACP Cert'],
    bottleneck: 'EU GMP audit backlog for Portuguese cultivators; QP batch release signatory qualification',
    note: 'Lowest-cost EU cultivation base. RPK Biopharma, Sativa Group, Clever Leaves active. Strong outdoor climate.',
    destLicenceClass: 'EU National Narcotics Import Permit (BfArM / destination authority)',
    clearanceDays: '3–5',
    rejectionReasons: ['EU GMP audit not yet complete for facility', 'Phytosanitary certificate errors from DGAV', 'Batch release signatory not EQP-qualified'],
    keyRisk: 'EU GMP audit backlog — Portuguese producers face 6–12 month delays entering EU GMP certification queue',
    timeline: '10–16 weeks (once EU GMP in place)',
  },
  {
    from: 'Denmark', to: 'Germany / EU', status: 'Active', authority: 'DKMA / BfArM',
    permit: 'EU Narcotics Export/Import Permit', leadWeeks: '6–10',
    docs: ['DKMA Export Cert', 'COA', 'EU GMP Cert', 'Import Permit', 'Batch Release'],
    bottleneck: 'Limited licensed cultivators; production scale constraints; domestic pilot scheme demand',
    note: 'Aurora Cannabis, Stenocare operating. Danish pilot scheme expanding to EU distribution. Limited supplier base creates concentration risk.',
    destLicenceClass: 'EU National Narcotics Import Permit',
    clearanceDays: '3–5',
    rejectionReasons: ['Production volume constraints limit contract fulfilment', 'Labelling non-compliance with EU Annex 17', 'GACP gaps for outdoor cultivation lots'],
    keyRisk: 'Single-source concentration — limited licensed Danish producers; supply disruption from one facility affects multiple EU buyers',
    timeline: '8–14 weeks end-to-end',
  },
  {
    from: 'Australia', to: 'Global', status: 'Active', authority: 'ODC (TGA)',
    permit: 'ODC Import/Export Permit', leadWeeks: '8–12',
    docs: ['ODC Export Permit', 'TGA Import Permit (dest)', 'COA', 'GMP Cert', 'Phytosanitary'],
    bottleneck: 'Destination country import permits; TGA scheduling classification at destination',
    note: 'Asia-Pacific hub. Cann Group, Cannatrek, Althea, Bod Australia active exporters. Each market requires separate destination import permit.',
    destLicenceClass: 'Varies by destination — TGA GMP-equivalent required at receiving jurisdiction',
    clearanceDays: '5–14',
    rejectionReasons: ['Destination import permit not issued before export dispatch', 'Incorrect product scheduling classification at destination', 'TGA GMP not recognised by destination authority'],
    keyRisk: 'Destination regulatory patchwork — each export market requires separate import permit; multi-market strategy requires parallel permitting processes',
    timeline: '12–20 weeks end-to-end (destination permit-dependent)',
  },
  {
    from: 'Germany', to: 'EU Distribution', status: 'Active', authority: 'BfArM',
    permit: 'Wholesale Distribution Licence (GDP)', leadWeeks: '4–8',
    docs: ['EU GMP Cert', 'Wholesale Licence', 'COA', 'Batch Release Certificate', 'GDP Compliance Certificate'],
    bottleneck: 'Pharmacy-only distribution until adult-use commercial expansion; tight batch documentation requirements',
    note: 'Intra-EU distribution hub. Cannamedical, Demecan, Cansativa dominant distributors. Germany Anbauvereinigungen framework expanding domestic supply.',
    destLicenceClass: 'EU Wholesale Distribution Authorisation (GDP compliant) at destination',
    clearanceDays: '2–4',
    rejectionReasons: ['Batch documentation incomplete for GDP chain-of-custody', 'GDP cold chain breach during transit', 'Consignee wholesale licence expired or not covering product category'],
    keyRisk: 'Batch documentation integrity — EU GDP requires complete chain-of-custody from cultivation to pharmacy; any gap triggers batch quarantine',
    timeline: '6–10 weeks end-to-end',
  },

  // ── Trans-Atlantic & Cross-Regional ──────────────────────────────────────
  {
    from: 'Netherlands', to: 'United Kingdom', status: 'Active', authority: 'CBG / MHRA',
    permit: 'MHRA Import Licence + Home Office Authority', leadWeeks: '8–12',
    docs: ['MHRA Import Licence', 'Home Office Controlled Drug Authority', 'UK GMP Cert', 'COA', 'Batch Release'],
    bottleneck: 'Post-Brexit UK GMP recognition separate from EU GMP; MHRA processing 10–14 weeks',
    note: 'Bedrocan, Transvaal active on this route. UK medical cannabis market growing rapidly. Netherlands remains dominant EU supplier to UK.',
    destLicenceClass: 'Schedule 2 Controlled Drug Importation Licence (MHRA / Home Office)',
    clearanceDays: '5–8',
    rejectionReasons: ['UK GMP not yet granted for EU facility (post-Brexit divergence)', 'Home Office authority not in place before shipment', 'Import licence product specification mismatch'],
    keyRisk: 'Post-Brexit dual GMP burden — EU GMP alone insufficient for UK market access; separate UK GMP recognition adds 4–8 months',
    timeline: '12–18 weeks end-to-end',
  },
  {
    from: 'Canada', to: 'Australia', status: 'Active', authority: 'Health Canada / ODC (TGA)',
    permit: 'ODC Import Permit + TGA GMP Licence', leadWeeks: '10–14',
    docs: ['ODC Import Permit', 'Health Canada Export Permit', 'TGA GMP Licence', 'COA', 'Phytosanitary'],
    bottleneck: 'TGA GMP recognition — Canadian producers must hold TGA manufacturing licence separately from Health Canada/EU GMP',
    note: 'Trans-Pacific route growing. Tilray, Aurora, Canopy have TGA-recognised facilities. Second-largest Canadian export corridor after Germany.',
    destLicenceClass: 'ODC Cannabis Import Permit (Schedule 8 Controlled Drug, TGA)',
    clearanceDays: '5–10',
    rejectionReasons: ['TGA GMP not recognised for Canadian facility', 'Incorrect product scheduling under TGA Poisons Standard', 'ODC import permit not issued before dispatch'],
    keyRisk: 'TGA GMP recognition — entirely separate from Canadian and EU GMP regimes; TGA audit adds 4–8 months for producers without prior recognition',
    timeline: '14–20 weeks end-to-end',
  },
  {
    from: 'Canada', to: 'France', status: 'Active', authority: 'Health Canada / ANSM',
    permit: 'ANSM Import Authorisation + Health Canada Export', leadWeeks: '10–16',
    docs: ['ANSM Import Authorisation', 'Health Canada Export Permit', 'EU GMP Cert', 'COA', 'GACP Cert'],
    bottleneck: 'ANSM processing timelines; each product SKU requires separate authorisation; flower/extract distinction in French framework',
    note: 'France cannabis médicale pilot expanded 2024 — flower and extract both authorised. Aurora, Tilray among authorised Canadian suppliers.',
    destLicenceClass: 'ANSM Stupéfiants Import Authorisation (Art. L.5132-8 CSP)',
    clearanceDays: '5–8',
    rejectionReasons: ['Product format not covered by ANSM authorisation', 'EU GMP not recognised for Canadian facility', 'GACP documentation missing for flower products'],
    keyRisk: 'ANSM product-level authorisation — each product format and SKU requires separate ANSM import authorisation; SKU proliferation multiplies administrative burden',
    timeline: '14–22 weeks end-to-end',
  },
  {
    from: 'Canada', to: 'Israel', status: 'Active', authority: 'Health Canada / IMCA',
    permit: 'Health Canada Export Licence + IMCA Import Permit', leadWeeks: '10–14',
    docs: ['Health Canada Export Licence', 'IMCA Import Permit', 'IMC-GMP or Canadian GMP Cert', 'COA'],
    bottleneck: 'IMCA import volumes quota-controlled; Israeli shekel/USD exchange volatility; shipping route constraints via Europe',
    note: 'Active bilateral medical corridor. Israel is a significant testing ground for Canadian products ahead of EU regulatory expansion. Multiple Canadian LPs active.',
    destLicenceClass: 'IMCA (Israeli Medical Cannabis Agency) Import Permit',
    clearanceDays: '5–10',
    rejectionReasons: ['IMCA quarterly quota exhausted', 'GMP certificate not IMCA-recognised format', 'COA not in IMCA-compliant format', 'Transit country prohibited by IMCA routing requirements'],
    keyRisk: 'IMCA volume quotas — quarterly import limits can be filled by dominant suppliers; late-cycle applications may be rejected regardless of product quality',
    timeline: '14–20 weeks end-to-end',
  },
  {
    from: 'Portugal', to: 'United Kingdom', status: 'Active', authority: 'Infarmed / MHRA',
    permit: 'MHRA Import Licence + Infarmed Export Cert', leadWeeks: '10–14',
    docs: ['MHRA Import Licence', 'UK GMP Certificate', 'COA', 'Infarmed Export Authorisation', 'GACP Cert'],
    bottleneck: 'UK GMP separate from EU GMP for Portuguese producers; MHRA processing 8–12 weeks; post-Brexit regulatory divergence',
    note: 'Growing route as Portuguese operators pursue multi-market export diversification beyond Germany. RPK Biopharma among active exporters.',
    destLicenceClass: 'Schedule 2 Controlled Drug Import Licence (MHRA)',
    clearanceDays: '5–8',
    rejectionReasons: ['UK GMP not obtained (separate from EU GMP post-Brexit)', 'MHRA licence not issued for specific product specification', 'Infarmed export cert missing or expired'],
    keyRisk: 'Post-Brexit dual GMP burden — EU GMP certification alone is insufficient; UK GMP recognition requires separate MHRA audit process',
    timeline: '14–20 weeks end-to-end',
  },
  {
    from: 'Colombia', to: 'EU / LATAM', status: 'Emerging', authority: 'MinSalud / INVIMA',
    permit: 'INVIMA Export Cert + Destination Import Permit', leadWeeks: '14–20',
    docs: ['INVIMA Export Cert', 'GACP Cert', 'COA', 'Dest Import Permit', 'Phytosanitary'],
    bottleneck: 'EU GMP certification gap; Colombian peso volatility; INVIMA export cert processing 4–8 weeks',
    note: 'Scale cultivation advantage. Khiron, Flora Growth, Clever Leaves, Ecomedics active. Lowest-cost medical cannabis globally at scale.',
    destLicenceClass: 'EU Narcotics Import Permit / LATAM equivalent (destination-specific)',
    clearanceDays: '8–14',
    rejectionReasons: ['EU GMP gap — Colombian facilities typically GACP-certified only', 'INVIMA export cert delays', 'Currency controls delaying payment settlement'],
    keyRisk: 'EU GMP certification gap — Colombian producers require full EU GMP audit before EU medical export; bridging period of GACP-only production limits destination markets',
    timeline: '18–28 weeks end-to-end',
  },
  {
    from: 'Colombia', to: 'United Kingdom', status: 'Active', authority: 'MinSalud / MHRA',
    permit: 'MHRA Import Licence + INVIMA Export Cert', leadWeeks: '12–18',
    docs: ['MHRA Import Licence', 'UK GMP Certificate', 'INVIMA Export Cert', 'COA', 'GACP Cert'],
    bottleneck: 'UK GMP separate from EU GMP; INVIMA export cert processing delays; MHRA licence backlog',
    note: 'UK–Colombia corridor growing as Colombian exporters diversify. Khiron, Clever Leaves active on this route. UK became priority market post-Brexit.',
    destLicenceClass: 'Schedule 2 Controlled Drug Importation Licence (MHRA)',
    clearanceDays: '7–12',
    rejectionReasons: ['UK GMP not obtained for Colombian facility', 'INVIMA export cert not issued in time', 'MHRA licence processing backlog', 'COA format not UK GMP-compliant'],
    keyRisk: 'Dual UK/EU GMP burden — producers targeting both markets must obtain and maintain separate certifications; significant ongoing compliance cost',
    timeline: '16–26 weeks end-to-end',
  },

  // ── Emerging / Pilot ─────────────────────────────────────────────────────
  {
    from: 'Israel', to: 'Germany / EU', status: 'Emerging', authority: 'IMCA / BfArM',
    permit: 'Research Grade Import Authorisation', leadWeeks: '12–20',
    docs: ['IMCA Export Authorisation', 'Research Protocol', 'COA', 'Import Permit', 'End-Use Declaration'],
    bottleneck: 'EU GMP equivalency not yet confirmed for all Israeli producers; regulatory parity debate between EU and Israel',
    note: 'High R&D-grade quality. IMC-GMP certification underway for EU access. Tikun Olam, BOL Pharma among producers targeting EU equivalency.',
    destLicenceClass: 'BfArM Import Permit — Research Grade',
    clearanceDays: '7–14',
    rejectionReasons: ['IMC-GMP not accepted as EU GMP equivalent', 'Research protocol required for non-standard clinical applications', 'Extended customs hold for non-EU-GMP products'],
    keyRisk: 'EU GMP equivalency unresolved — IMC-GMP parity with EU GMP expected 2025–2026; until then, Israeli products enter EU only under research pathways',
    timeline: '16–26 weeks end-to-end',
  },
  {
    from: 'Malta', to: 'EU', status: 'Pilot', authority: 'MRA',
    permit: 'MRA Cultivation Licence + Export Certificate', leadWeeks: '16–24',
    docs: ['MRA Export Cert', 'COA', 'EU GMP Cert', 'Import Permit (dest)', 'GACP Certificate'],
    bottleneck: 'First adult-use EU licensed market; limited production volume at launch; export framework operational maturity',
    note: 'Pioneer EU adult-use jurisdiction. MRA regulatory model still maturing. Small island geography limits cultivation scale.',
    destLicenceClass: 'EU National Narcotics Import Permit (destination-specific)',
    clearanceDays: '5–10',
    rejectionReasons: ['MRA export licence not yet issued to specific producer', 'Production volumes insufficient for commercial shipment minimum', 'EU GMP not yet certified for Maltese facility'],
    keyRisk: 'Framework maturity — Malta adult-use framework <2 years old; export rules and commercial precedents still being established',
    timeline: '20–32 weeks end-to-end',
  },
  {
    from: 'Switzerland', to: 'EU', status: 'Pilot', authority: 'Swissmedic / FOPH',
    permit: 'Swissmedic Narcotics Export Permit', leadWeeks: '10–16',
    docs: ['Swissmedic Export Permit', 'COA', 'GMP Certificate', 'Phytosanitary', 'Dest Import Permit'],
    bottleneck: 'Non-EU MRA status; bilateral negotiations ongoing; each shipment requires separate government authorisation',
    note: 'Swiss cannabis pilot (2025) — medical and adult-use research export anticipated. Non-EU MRA creates additional bilateral permitting burden.',
    destLicenceClass: 'EU National Narcotics Import Permit + Swissmedic Narcotics Export Permit',
    clearanceDays: '5–10',
    rejectionReasons: ['Non-EU MRA status — dual certification burden for each shipment', 'Swissmedic permit valid only if EU destination authority pre-authorised', 'Pilot scheme volume caps exceeded'],
    keyRisk: 'Bilateral authorisation per shipment — Switzerland–EU MRA does not cover narcotics; each export requires co-authorisation from both Swissmedic and destination authority',
    timeline: '14–22 weeks end-to-end',
  },
  {
    from: 'Spain', to: 'EU', status: 'Emerging', authority: 'AEMPS',
    permit: 'AEMPS Narcotic Export Authorisation', leadWeeks: '12–18',
    docs: ['AEMPS Export Auth', 'EU GMP Certificate', 'GACP Certificate', 'COA', 'Dest Import Permit'],
    bottleneck: 'Spain cultivation licensed but export framework nascent; AEMPS export authorisation process not fully operationalised',
    note: 'Multiple licensed cultivators established post-2021 but primarily domestic supply. Export corridor emerging 2024–2025. Strong outdoor climate advantage.',
    destLicenceClass: 'EU National Narcotics Import Permit (destination-specific)',
    clearanceDays: '5–10',
    rejectionReasons: ['AEMPS export authorisation process still being operationalised', 'Product not on EU pharmacopoeia monograph', 'Batch release signatory qualification gaps'],
    keyRisk: 'Framework nascency — Spain export regulations still being operationalised; no established commercial export precedent creates first-mover uncertainty',
    timeline: '16–26 weeks end-to-end',
  },
  {
    from: 'North Macedonia', to: 'EU', status: 'Emerging', authority: 'Agency for Medicines / BfArM',
    permit: 'National Export Certificate + EU Import Permit', leadWeeks: '12–18',
    docs: ['National Export Certificate', 'EU GMP Cert', 'COA', 'GACP Certificate', 'Dest Import Permit'],
    bottleneck: 'EU candidacy complicates regulatory alignment; EU GMP for North Macedonian facilities requires EU-qualified QP oversight',
    note: 'Tikun Olam North Macedonia, CannabisMK active. Low-cost outdoor cultivation base with EU access ambitions. EU accession process may streamline pathway.',
    destLicenceClass: 'EU National Narcotics Import Permit',
    clearanceDays: '5–10',
    rejectionReasons: ['EU GMP not certified for facility', 'QP batch release signatory not EU-qualified or EU-based', 'GACP documentation gaps for outdoor cultivation'],
    keyRisk: 'EU GMP QP requirement — non-EU producers must engage an EU-qualified QP for batch release; adds ongoing cost and dependency',
    timeline: '16–26 weeks end-to-end',
  },
  {
    from: 'Greece', to: 'EU Distribution', status: 'Emerging', authority: 'EOF',
    permit: 'EOF Export Permit + Dest Import Permit', leadWeeks: '10–16',
    docs: ['EOF Export Permit', 'EU GMP Certificate', 'GACP Cert', 'COA', 'Phytosanitary', 'Dest Import Permit'],
    bottleneck: 'Greek EU GMP-certified capacity limited; EOF regulatory capacity stretched; few established commercial exporters',
    note: 'Greece 2019 medical cannabis export framework. Ideal Mediterranean climate for outdoor cultivation. InsightFul, Ecoark Hellas active.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '5–10',
    rejectionReasons: ['EU GMP not certified for facility', 'EOF export permit processing delays', 'GACP documentation gaps for outdoor cultivation', 'Phytosanitary certificate errors'],
    keyRisk: 'EU GMP for outdoor cultivation — EU GMP inspection standards are biased toward indoor facilities; outdoor Greek cultivators face additional audit complexity',
    timeline: '14–22 weeks end-to-end',
  },
  {
    from: 'Czech Republic', to: 'EU Distribution', status: 'Active', authority: 'SÚKL',
    permit: 'SÚKL Narcotics Export Permit + Dest Import Permit', leadWeeks: '6–10',
    docs: ['SÚKL Export Permit', 'EU GMP Certificate', 'COA', 'Batch Release Certificate', 'Dest Import Permit'],
    bottleneck: 'Limited domestic export-oriented producers; large domestic prescription demand competes with export volume allocation',
    note: 'Czech Republic has largest EU medical cannabis market by prescription volume. Elkana, MedCan among producers. Domestic demand typically prioritised over export.',
    destLicenceClass: 'EU National Narcotics Import Permit',
    clearanceDays: '3–6',
    rejectionReasons: ['SÚKL export permit delays due to domestic prioritisation', 'Batch release documentation incomplete', 'Specification mismatch between import permit and actual product batch'],
    keyRisk: 'Domestic market cannibalism — rapidly growing Czech prescription volumes compete directly with export allocation; supply commitments at risk in high-demand periods',
    timeline: '8–14 weeks end-to-end',
  },
  {
    from: 'Italy', to: 'EU Distribution', status: 'Emerging', authority: 'ISS / AIFA',
    permit: 'ISS Narcotics Export Authorisation + Dest Import Permit', leadWeeks: '12–20',
    docs: ['ISS Export Authorisation', 'EU GMP Certificate', 'GACP Cert', 'COA', 'Dest Import Permit'],
    bottleneck: 'Italy domestic medical market prioritised by ISS; export framework operationally underutilised; limited private sector EU GMP capacity',
    note: 'Italy large domestic cannabis market. FAMFB (Army) sole historical EU GMP producer; private sector growing. Export corridor emerging as private capacity scales.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '5–10',
    rejectionReasons: ['ISS export authorisation processing delays', 'Limited private sector EU GMP capacity in Italy', 'Product volume constraints given domestic supply priority'],
    keyRisk: 'State supply priority — ISS historically prioritises domestic pharmacy supply; commercial export framework slow to develop',
    timeline: '16–26 weeks end-to-end',
  },
  {
    from: 'Poland', to: 'EU Distribution', status: 'Active', authority: 'URPL',
    permit: 'URPL Narcotics Export Permit + Dest Import Permit', leadWeeks: '6–10',
    docs: ['URPL Export Permit', 'EU GMP Certificate', 'COA', 'Batch Release Certificate', 'Dest Import Permit'],
    bottleneck: 'Polish domestic prescription market large and fast-growing; URPL processing time 8–12 weeks; few export-oriented licensed producers',
    note: 'Poland largest EU medical cannabis market by prescription volume. Growing licensed producer base. Aurora-licensed, Canopy distribution active.',
    destLicenceClass: 'EU National Narcotics Import Permit (destination-specific)',
    clearanceDays: '3–6',
    rejectionReasons: ['URPL export permit processing delays due to high domestic demand', 'Batch release documentation incomplete', 'Product specification mismatch between import permit and actual batch'],
    keyRisk: 'URPL processing capacity — high domestic demand creates competing priorities; export permit processing may be deprioritised during domestic supply crunches',
    timeline: '8–14 weeks end-to-end',
  },

  // ── Africa ───────────────────────────────────────────────────────────────
  {
    from: 'South Africa', to: 'Germany / EU', status: 'Emerging', authority: 'SAHPRA / BfArM',
    permit: 'SAHPRA Export Permit + BfArM Import Permit', leadWeeks: '14–22',
    docs: ['SAHPRA Export Permit', 'EU GMP Certificate', 'COA', 'GACP Certificate', 'Phytosanitary', 'Import Permit'],
    bottleneck: 'EU GMP certification for South African facilities; SAHPRA processing capacity; cold chain over 9,000km haul',
    note: 'Galeshewe, Africanpure, others pursuing EU GMP. Climate advantage for outdoor cultivation at scale. Long logistics chain requires robust cold chain.',
    destLicenceClass: 'BfArM Import Permit (§3 BtMG) / EU Narcotics Import Permit',
    clearanceDays: '7–14',
    rejectionReasons: ['EU GMP not yet certified (SAHPRA GMP not EU-equivalent)', 'SAHPRA export permit delays (8–16 weeks processing)', 'Cold chain documentation incomplete for long-haul', 'Phytosanitary inspection failures'],
    keyRisk: 'EU GMP gap — SAHPRA GMP not accepted as EU equivalent; full EU GMP audit mandatory for all South African producers targeting EU markets',
    timeline: '20–32 weeks end-to-end',
  },
  {
    from: 'Zimbabwe', to: 'EU / UK', status: 'Emerging', authority: 'MCAZ / BfArM or MHRA',
    permit: 'MCAZ Export Licence + EU/UK Import Permit', leadWeeks: '16–24',
    docs: ['MCAZ Export Licence', 'EU/UK GMP Certificate', 'COA', 'GACP Certificate', 'Phytosanitary'],
    bottleneck: 'Limited EU/UK GMP-certified capacity; MCAZ framework nascent; currency and international banking constraints',
    note: 'Creso Pharma, Doozy Products active. Low-cost outdoor cultivation. MCAZ (Medicines Control Authority Zimbabwe) regulatory framework maturing.',
    destLicenceClass: 'EU Narcotics Import Permit / UK Schedule 2 CDL (destination-specific)',
    clearanceDays: '8–16',
    rejectionReasons: ['GMP not certified for EU/UK market', 'MCAZ export licence processing delays', 'International banking restrictions on Zimbabwean transactions', 'GACP documentation inadequate for EU import'],
    keyRisk: 'Banking restrictions — international payment infrastructure for Zimbabwean entities remains constrained; payment delays can halt shipment release',
    timeline: '22–34 weeks end-to-end',
  },
  {
    from: 'Lesotho', to: 'EU', status: 'Emerging', authority: 'LHDA / BfArM or ANSM',
    permit: 'Lesotho Health Dept Export Cert + EU Import Permit', leadWeeks: '14–22',
    docs: ['Health Dept Export Cert', 'EU GMP Certificate', 'COA', 'GACP Certificate', 'Phytosanitary'],
    bottleneck: 'EU GMP not yet certified for major Lesotho operators; landlocked logistics dependency on South Africa transit routing',
    note: 'MG Health, Medigrow, Mountain High active. Highest-altitude cultivation globally — exceptional terpene and quality profile. Landlocked geography adds logistics complexity.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '7–14',
    rejectionReasons: ['EU GMP gap — most operators GACP-level only', 'Landlocked transit routing via RSA disrupted', 'Phytosanitary cert errors from Lesotho health authority', 'COA not EU GMP Annex 11 formatted'],
    keyRisk: 'Landlocked logistics — all shipments transit South Africa; any RSA border disruption, labour action, or customs delay affects entire Lesotho supply chain',
    timeline: '20–30 weeks end-to-end',
  },
  {
    from: 'Rwanda', to: 'EU / Africa', status: 'Emerging', authority: 'RDB / BfArM',
    permit: 'RDB Cannabis Export Permit + Dest Import Permit', leadWeeks: '14–20',
    docs: ['RDB Export Permit', 'GACP Certificate', 'COA', 'Phytosanitary', 'Dest Import Permit'],
    bottleneck: 'Very early-stage framework — RDB licensing issued 2022; EU GMP-certified capacity essentially absent; limited accredited testing infrastructure',
    note: 'Rwanda targeting medical cannabis as economic diversification. RightGreen Health, others licensed. Pioneer of African continental cannabis regulatory compliance framework.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '7–14',
    rejectionReasons: ['EU GMP absent — production at GACP level only', 'RDB export permit processing delays', 'Limited accredited laboratory access for COA generation'],
    keyRisk: 'Framework nascency — Rwanda cannabis regulation <3 years old; EU export pathway not commercially proven; first-mover must build regulatory precedent',
    timeline: '20–30 weeks end-to-end',
  },
  {
    from: 'Morocco', to: 'EU', status: 'Emerging', authority: 'ONICL / EMA',
    permit: 'Agricultural Export Certificate', leadWeeks: '8–14',
    docs: ['Agricultural Export Cert', 'COA', 'Phytosanitary (ONSSA)', 'Hemp <0.2% THC Declaration'],
    bottleneck: 'Medical THC framework nascent; hemp/CBD export viable but THC limit compliance critical; ONSSA phytosanitary requirements',
    note: 'Major hemp cultivation base — traditionally illicit kif production. CBD isolate, fibre, seed export active. Medical THC pathway emerging post-2021 legalisation.',
    destLicenceClass: 'EU Hemp Import Certificate (no narcotics permit for compliant hemp <0.2% THC)',
    clearanceDays: '5–10',
    rejectionReasons: ['THC content exceeding EU hemp threshold (0.2%)', 'Missing ONSSA phytosanitary certificate', 'Product misclassification at EU customs as controlled substance'],
    keyRisk: 'Medical THC pathway absent — hemp/CBD export is viable; medical cannabis THC export pathway does not yet exist commercially',
    timeline: '8–14 weeks end-to-end (hemp/CBD only)',
  },

  // ── Americas ─────────────────────────────────────────────────────────────
  {
    from: 'Jamaica', to: 'North America / EU', status: 'Restricted', authority: 'CLA (Cannabis Licensing Authority)',
    permit: 'CLA Export Permit + Destination Narcotics Import Permit', leadWeeks: '16–28',
    docs: ['CLA Export Permit', 'COA', 'GACP Cert', 'Phytosanitary', 'Dest Permit', 'End-Use Cert'],
    bottleneck: 'Limited regulatory framework maturity; US Schedule I barrier blocks THC products entirely; EU regulatory parity not established',
    note: 'Heritage and CBD products viable. Medical THC export pathway limited to non-US jurisdictions. CLA framework gaining maturity.',
    destLicenceClass: 'DEA Schedule I Permit (US, THC) — effectively blocked / EU Narcotics Import Permit',
    clearanceDays: '14–21',
    rejectionReasons: ['US Schedule I barrier — Jamaican THC products cannot legally enter US regardless of Jamaican licensing', 'CLA framework not recognised as EU equivalent', 'Financial transaction complications from US banking sensitivity'],
    keyRisk: 'US Schedule I wall — US market completely inaccessible for Jamaican THC products under current federal law; EU-only viable for medical THC',
    timeline: '24–36 weeks end-to-end (EU pathway only)',
  },
  {
    from: 'Uruguay', to: 'EU', status: 'Restricted', authority: 'IRCCA / Ministry of Health',
    permit: 'IRCCA Authorization + EU Import Permit', leadWeeks: '20–30',
    docs: ['IRCCA Cert', 'COA', 'GMP Cert', 'Phytosanitary', 'EU Import Permit', 'End-Use Declaration'],
    bottleneck: 'State-only supply model; IRCCA restricts commercial export volumes; EU GMP equivalency not formally established for Uruguayan producers',
    note: 'First adult-use legalisation globally (2013). IRCCA state-controlled production model restricts commercial scale. Export pathway exists but volumes tightly constrained.',
    destLicenceClass: 'EU National Narcotics Import Permit + IRCCA export authorisation',
    clearanceDays: '10–18',
    rejectionReasons: ['IRCCA state-only model limits commercial operator access', 'EU GMP equivalency not established for Uruguayan facilities', 'Limited product range under state-controlled cultivation parameters'],
    keyRisk: 'State supply model — IRCCA permits only state-licensed production; commercial export at scale essentially unavailable to private operators',
    timeline: '24–36 weeks end-to-end',
  },
  {
    from: 'Mexico', to: 'United States', status: 'Restricted', authority: 'COFEPRIS / FDA',
    permit: 'FDA Prior Notice + DEA Hemp Registration', leadWeeks: '8–16',
    docs: ['FDA Prior Notice', 'COA (<0.3% THC)', 'COFEPRIS Export Cert', 'Certificate of Origin', 'USDA Phytosanitary'],
    bottleneck: 'FDA Import Alert 54-15 applies to CBD; DEA hemp import rules complex; THC content testing at border',
    note: 'Hemp-derived CBD and fibre viable under 2018 US Farm Bill. THC products face Schedule I barrier. COFEPRIS hemp framework established 2019.',
    destLicenceClass: 'FDA-registered importer; DEA Hemp Importer Registration (>0.1% THC lots)',
    clearanceDays: '5–12',
    rejectionReasons: ['THC content >0.3% — automatic Schedule I seizure and DEA referral', 'FDA Import Alert 54-15 coverage for CBD', 'Missing COFEPRIS phytosanitary clearance', 'Certificate of origin discrepancy at border'],
    keyRisk: 'THC threshold enforcement — any product testing above 0.3% THC at US border triggers Schedule I seizure; margin-of-error lots require testing well below threshold',
    timeline: '10–20 weeks end-to-end',
  },
  {
    from: 'Brazil', to: 'EU', status: 'Emerging', authority: 'ANVISA / EMA',
    permit: 'ANVISA Export Authorisation + EU Import Permit', leadWeeks: '14–20',
    docs: ['ANVISA Export Auth', 'GACP Cert', 'COA', 'EU GMP Certificate', 'Phytosanitary', 'Dest Import Permit'],
    bottleneck: 'ANVISA framework principally import-focused; export pathway for cannabis derivatives nascent; EU GMP gap for Brazilian producers',
    note: 'Brazil fastest-growing medical cannabis import market globally. Export potential for CBDA, isolates. Regulatory inversion to full export framework likely by 2026.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '8–14',
    rejectionReasons: ['ANVISA export framework not fully operationalised', 'EU GMP gap for Brazilian producers', 'Product classification uncertainty (extract vs. finished pharmaceutical product)'],
    keyRisk: 'ANVISA export framework gap — Brazilian regulations are oriented toward importation; commercial export pathway is being established but not commercially proven',
    timeline: '18–28 weeks end-to-end',
  },
  {
    from: 'Ecuador', to: 'EU', status: 'Emerging', authority: 'ARCSA / EMA',
    permit: 'ARCSA Export Certificate + EU Import Permit', leadWeeks: '14–22',
    docs: ['ARCSA Export Cert', 'GACP Cert', 'COA', 'EU GMP Certificate', 'Phytosanitary', 'Dest Import Permit'],
    bottleneck: 'Cannabis regulatory framework nascent post-2021 reform; EU GMP gap; controlled substance export logistics infrastructure still being built',
    note: 'Ecuador 2021 cannabis reform opened cultivation for medicinal and industrial use. Export framework early stage. Ideal equatorial growing conditions for year-round cultivation.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '8–14',
    rejectionReasons: ['ARCSA export certificate not yet operationalised for cannabis', 'EU GMP absent for all Ecuadorian facilities', 'Limited accredited testing infrastructure for compliant COA generation'],
    keyRisk: 'Framework nascency — Ecuador regulatory infrastructure for controlled substance export still being built; no commercial export precedent established',
    timeline: '20–32 weeks end-to-end',
  },
  {
    from: 'Peru', to: 'EU', status: 'Emerging', authority: 'DIGEMID / EMA',
    permit: 'DIGEMID Export Authorisation + EU Import Permit', leadWeeks: '16–24',
    docs: ['DIGEMID Export Auth', 'GACP Cert', 'COA', 'Phytosanitary', 'EU Import Permit'],
    bottleneck: 'Peru cannabis medical decree (2019) principally enables importation; EU GMP-certified export capacity essentially absent',
    note: 'Peru emerging cultivation corridor. CBD oil and derivatives active domestically. Medical THC export framework very early stage. Andean altitude cultivation advantage.',
    destLicenceClass: 'EU Narcotics Import Permit (destination-specific)',
    clearanceDays: '8–16',
    rejectionReasons: ['EU GMP absent for all Peruvian producers', 'DIGEMID export authorisation not yet operationalised for cannabis', 'Limited accredited testing capacity', 'Phytosanitary certification gaps'],
    keyRisk: 'EU GMP gap — Peruvian producers at GACP level at best; EU medical cannabis requires complete EU GMP-certified supply chain',
    timeline: '22–34 weeks end-to-end',
  },

  // ── Asia-Pacific ─────────────────────────────────────────────────────────
  {
    from: 'Thailand', to: 'Asia-Pacific', status: 'Emerging', authority: 'FDA Thailand / ONCB',
    permit: 'ONCB Export Licence', leadWeeks: '12–20',
    docs: ['ONCB Export Licence', 'FDA Thailand Certificate', 'COA', 'Phytosanitary', 'Dest Import Permit'],
    bottleneck: 'Regulatory rollback risk; limited licensed exporters; patchwork regional import rules across Asia-Pacific markets',
    note: 'Post-2022 delisting created unprecedented access. 2024 partial re-scheduling added uncertainty. Regional regulatory fragmentation remains primary commercial barrier.',
    destLicenceClass: 'ONCB-equivalent narcotics import permit at destination',
    clearanceDays: '7–14',
    rejectionReasons: ['Destination country refuses Thai regulatory status due to re-scheduling controversy', 'ONCB export licence processing delays', 'Inconsistent product classification between Thai and destination scheduling'],
    keyRisk: 'Regulatory rollback risk — Thailand 2024 partial re-scheduling created uncertainty; commercial export volumes limited until regulatory stability confirmed',
    timeline: '16–24 weeks end-to-end',
  },
  {
    from: 'New Zealand', to: 'Australia', status: 'Active', authority: 'Medsafe / TGA',
    permit: 'Medsafe Export Certificate + TGA Import Permit', leadWeeks: '6–10',
    docs: ['Medsafe Export Certificate', 'TGA Import Permit', 'COA', 'GMP Certificate', 'Phytosanitary'],
    bottleneck: 'Trans-Tasman MRA does not cover cannabis specifically; separate TGA and Medsafe licensing required despite close regulatory alignment',
    note: 'Helius Therapeutics, Tilray NZ among exporters. Shortest established corridor by distance. TGA recognition growing for NZ facilities.',
    destLicenceClass: 'ODC Cannabis Import Permit + TGA-registered product (Schedule 8)',
    clearanceDays: '3–6',
    rejectionReasons: ['TGA product registration not completed for specific formulation', 'ODC import permit not issued before dispatch', 'COA method reference not TGA-recognised'],
    keyRisk: 'TGA product registration — each product formulation must be separately registered with TGA before import; SKU proliferation multiplies registration burden',
    timeline: '10–16 weeks end-to-end',
  },
  {
    from: 'Singapore', to: 'Asia-Pacific (Transit)', status: 'Active', authority: 'HSA Singapore',
    permit: 'HSA Controlled Drug Transit Permit', leadWeeks: '1–2 (transit only)',
    docs: ['HSA Transit Permit', 'Intact Manifest (no break of bulk)', 'Dest Import Permit', 'COA', 'Airway Bill'],
    bottleneck: 'Singapore zero-tolerance — no storage, no transhipment with break of bulk; criminal liability for any unauthorised handling',
    note: 'Singapore is Asia-Pacific logistics hub but has absolute zero-tolerance cannabis policy. Transit permitted only with HSA pre-authorisation, sealed original packaging, no storage.',
    destLicenceClass: 'Destination country narcotics import permit (Singapore issues transit permit only)',
    clearanceDays: '1–3 (airside transit only)',
    rejectionReasons: ['Break of bulk attempted during transit — immediate seizure', 'Missing HSA transit permit obtained in advance', 'Product not in original sealed manufacturer packaging', 'Airway bill discrepancy from cargo manifest'],
    keyRisk: 'Zero-tolerance enforcement — Singapore imposes severe penalties including death for drug trafficking above threshold weights; any transit irregularity carries extreme legal risk',
    timeline: 'Adds 2–5 days to overall route (transit component only)',
  },

  // ── Hemp / CBD Routes ─────────────────────────────────────────────────────
  {
    from: 'United States', to: 'EU', status: 'Active', authority: 'DEA / USDA / EMA',
    permit: 'DEA Export Certificate (hemp) + EU CBD Novel Food Authorisation', leadWeeks: '8–14',
    docs: ['DEA Export Certificate', 'USDA Phytosanitary', 'COA (<0.3% THC)', 'EU Novel Food Authorisation', 'Dest Import Permit'],
    bottleneck: 'EU Novel Food classification for CBD creates additional approval requirements; separate EU and US THC threshold standards (0.3% US vs 0.2% EU)',
    note: 'CBD isolate, broad-spectrum, and hemp seed oil exported from US to EU. Novel Food status complicates consumer product imports. Industrial hemp fibre unaffected.',
    destLicenceClass: 'EU Novel Food Authorisation (CBD) / Hemp Import Certificate',
    clearanceDays: '5–10',
    rejectionReasons: ['CBD classified as Novel Food — EU authorisation not in place', 'THC content >0.2% (EU threshold lower than US 0.3%)', 'USDA phytosanitary cert missing or incorrect', 'Novel Food labelling non-compliance at EU customs'],
    keyRisk: 'EU Novel Food classification — CBD requires separate Novel Food authorisation in EU; adds 6–12 months and significant cost for new product market entries',
    timeline: '12–20 weeks end-to-end',
  },
  {
    from: 'Turkey', to: 'EU', status: 'Active', authority: 'TEAB / EU Customs',
    permit: 'TEAB Export Certificate + EU Hemp Import Declaration', leadWeeks: '6–10',
    docs: ['TEAB Export Certificate', 'Certificate of Origin', 'Phytosanitary', 'COA (<0.2% THC)', 'EU Hemp Declaration'],
    bottleneck: 'Medical THC products prohibited for export; hemp fibre and seed only; EU THC threshold (0.2%) compliance critical; customs scrutiny at EU border',
    note: 'Turkey major hemp cultivation base. Fibre, seed, and CBD (<0.2% THC) export active to EU. No medical THC export pathway under current Turkish law.',
    destLicenceClass: 'EU Hemp/Agricultural Import Certificate (no narcotics permit required for compliant hemp)',
    clearanceDays: '4–8',
    rejectionReasons: ['THC content >0.2% EU threshold', 'Missing TEAB export certificate', 'Certificate of origin discrepancy at customs', 'Phytosanitary inspection failure at origin or destination'],
    keyRisk: 'THC compliance near-threshold — hemp products near EU limit risk testing above threshold during transit due to temperature/environmental variation; lots should target <0.15%',
    timeline: '8–14 weeks end-to-end',
  },

  // ── Restricted / Complex ─────────────────────────────────────────────────
  {
    from: 'Lebanon', to: 'EU', status: 'Pilot', authority: 'MoPH Lebanon / BfArM or ANSM',
    permit: 'MoPH Export Authorisation + EU Import Permit', leadWeeks: '16–28',
    docs: ['MoPH Export Authorisation', 'GACP Cert', 'COA', 'Phytosanitary', 'EU Import Permit', 'End-Use Certificate'],
    bottleneck: 'Lebanon economic and political instability severely constrains pharmaceutical-grade export infrastructure; banking crisis blocks international payment',
    note: 'Lebanon 2020 cannabis legalisation for medical export. Significant cultivation knowledge base and historic expertise. Infrastructure and banking constraints currently dominate.',
    destLicenceClass: 'EU Narcotics Import Permit + End-Use Certificate (heightened due diligence required)',
    clearanceDays: '10–20',
    rejectionReasons: ['International banking transaction cannot complete due to Lebanese banking restrictions', 'MoPH export authorisation delayed by government capacity constraints', 'GMP not certified for export standard', 'EU heightened due diligence requirements for Lebanese counterparties'],
    keyRisk: 'Banking/financial infrastructure — Lebanese banking crisis prevents standard cannabis trade payment flows; creative financial structuring required for each transaction',
    timeline: '24–40 weeks end-to-end',
  },
]

const CORRIDOR_STATUS_COLOR: Record<string, string> = {
  Active: '#4caf82', Emerging: '#d4a84b', Restricted: '#e05c5c', Pilot: '#5b9bd5',
}

type CorridorStats = {
  count: number | null; avg_days: number | null; median_days: number | null
  min_days: number | null; max_days: number | null; p90_days: number | null
}
type CorridorAlert = {
  id: string; alert_date: string; severity: 'major' | 'minor' | 'watch'
  summary: string; detail: string; source: string
}
const ALERT_SEVERITY_COLOR: Record<string, string> = { major: '#e05c5c', minor: '#d4a84b', watch: '#5b9bd5' }
function parseLogisticsRange(s: string): { currency: string; lo: number; hi: number } | null {
  const m = s.match(/^(€|£|CAD\s?|AUD\s?|USD\s?)([\d,]+)[–\-]([\d,]+)/)
  if (!m) return null
  return { currency: m[1].trim(), lo: parseFloat(m[2].replace(/,/g, '')), hi: parseFloat(m[3].replace(/,/g, '')) }
}

function CorridorPlaybooksSection({ country, role }: { country: { iso2: string; label: string }; role: string }) {
  const [sectionTab,  setSectionTab]  = useState<'corridors' | 'modeller'>('corridors')
  const [search,      setSearch]      = useState('')
  const [filterFrom,  setFilterFrom]  = useState('')
  const [filterTo,    setFilterTo]    = useState('')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [liveData,    setLiveData]    = useState<Record<string, { stats: CorridorStats; alerts: CorridorAlert[] }>>({})
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const [submitDays,  setSubmitDays]  = useState('')
  const [submitRole,  setSubmitRole]  = useState('')
  const [submitted,   setSubmitted]   = useState<Set<string>>(new Set())
  const [submitErr,   setSubmitErr]   = useState<string | null>(null)
  const [modelKey,    setModelKey]    = useState('')
  const [modelKg,     setModelKg]     = useState('10')

  const roleIsImporter = role.toLowerCase().includes('import') || role.toLowerCase().includes('buyer') || role.toLowerCase().includes('pharma')
  const roleIsExporter = role.toLowerCase().includes('export') || role.toLowerCase().includes('supplier') || role.toLowerCase().includes('cultivat')

  useEffect(() => {
    if (!expanded || liveData[expanded] || loadingKeys.has(expanded)) return
    setLoadingKeys(prev => { const s = new Set(prev); s.add(expanded); return s })
    fetch(`/api/corridors/data?key=${encodeURIComponent(expanded)}`)
      .then(r => r.json())
      .then((d: { stats?: CorridorStats; alerts?: CorridorAlert[] }) =>
        setLiveData(prev => ({ ...prev, [expanded]: { stats: d.stats ?? {} as CorridorStats, alerts: d.alerts ?? [] } })))
      .catch(() => setLiveData(prev => ({ ...prev, [expanded]: { stats: {} as CorridorStats, alerts: [] } })))
      .finally(() => setLoadingKeys(prev => { const s = new Set(prev); s.delete(expanded); return s }))
  }, [expanded])

  const handleSubmit = async (intelKey: string) => {
    const days = parseInt(submitDays, 10)
    if (isNaN(days) || days < 1 || days > 999) { setSubmitErr('Enter a valid number of days (1–999)'); return }
    setSubmitErr(null)
    const res = await fetch('/api/corridors/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corridorKey: intelKey, daysTaken: days, role: submitRole }),
    })
    if (res.ok) { setSubmitted(prev => new Set(prev).add(intelKey)); setSubmitDays(''); setSubmitRole('') }
    else setSubmitErr('Submission failed. Please try again.')
  }

  const filtered = CORRIDORS.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.from.toLowerCase().includes(q) || c.to.toLowerCase().includes(q) || c.authority.toLowerCase().includes(q) || c.note.toLowerCase().includes(q)
    const matchFrom = !filterFrom || c.from.toLowerCase().includes(filterFrom.toLowerCase())
    const matchTo   = !filterTo   || c.to.toLowerCase().includes(filterTo.toLowerCase())
    return matchSearch && matchFrom && matchTo
  })

  const sorted = [...filtered].sort((a, b) => {
    const aRel = a.from.toLowerCase().includes(country.label.toLowerCase()) || a.to.toLowerCase().includes(country.label.toLowerCase()) ? -1 : 0
    const bRel = b.from.toLowerCase().includes(country.label.toLowerCase()) || b.to.toLowerCase().includes(country.label.toLowerCase()) ? -1 : 0
    return aRel - bRel
  })

  const fromOptions = Array.from(new Set(CORRIDORS.map(c => c.from))).sort()
  const toOptions   = Array.from(new Set(CORRIDORS.map(c => c.to))).sort()
  const costKeys    = Object.keys(CORRIDOR_COSTS)
  const modelCost   = modelKey ? CORRIDOR_COSTS[modelKey] : null
  const modelCorr   = modelKey ? CORRIDORS.find(c => `${c.from}→${c.to}` === modelKey) : null
  const kgNum       = parseFloat(modelKg) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflow: 'auto' }}>

      {/* Section tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        {([['corridors', `Corridor Playbooks (${CORRIDORS.length})`], ['modeller', '⊞ Cost Modeller']] as Array<['corridors'|'modeller', string]>).map(([t, label]) => (
          <button key={t} onClick={() => setSectionTab(t)} style={{
            padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: 'transparent',
            color: sectionTab === t ? '#d4a84b' : 'rgba(245,240,232,.4)',
            borderBottom: sectionTab === t ? '2px solid #d4a84b' : '2px solid transparent', marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {sectionTab === 'modeller' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(245,240,232,.5)', lineHeight: 1.5 }}>
            Estimate regulatory and logistics costs for a corridor and shipment volume. Reference ranges based on July 2026 intelligence.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 200px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>CORRIDOR</div>
              <select value={modelKey} onChange={e => setModelKey(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: modelKey ? '#f5f0e8' : 'rgba(245,240,232,.4)', fontSize: '12px', padding: '8px 12px', outline: 'none' }}>
                <option value="">Select corridor…</option>
                {costKeys.map(k => <option key={k} value={k} style={{ background: '#050c18' }}>{k}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>VOLUME (KG)</div>
              <input type="number" min="0.1" step="0.5" value={modelKg} onChange={e => setModelKg(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#f5f0e8', fontSize: '12px', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          {modelCost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { lbl: 'PERMIT FEE',          val: modelCost.permitFee },
                  { lbl: 'LAB COST / BATCH',    val: modelCost.labCostBatch },
                  { lbl: 'FX EXPOSURE',          val: modelCost.fxExposure },
                  { lbl: 'GMP AUDIT (ONE-TIME)', val: modelCost.gmpAudit },
                ].map(({ lbl, val }) => (
                  <div key={lbl} style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '8px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '4px' }}>{lbl}</div>
                    <div style={{ fontSize: '11px', color: '#f5f0e8', lineHeight: 1.4 }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(212,168,75,.06)', border: '1px solid rgba(212,168,75,.2)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#d4a84b', marginBottom: '6px' }}>LOGISTICS ESTIMATE FOR {kgNum} KG</div>
                <div style={{ fontSize: '12px', color: '#f5f0e8', fontWeight: 600, marginBottom: '4px' }}>
                  {(() => {
                    const p = parseLogisticsRange(modelCost.logisticsPerKg)
                    if (!p || kgNum <= 0) return modelCost.logisticsPerKg
                    return `${p.currency}${Math.round(p.lo * kgNum).toLocaleString()}–${p.currency}${Math.round(p.hi * kgNum).toLocaleString()} (${p.currency}${p.lo}–${p.hi}/kg × ${kgNum}kg)`
                  })()}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.45)' }}>{modelCost.logisticsPerKg}</div>
              </div>
              {modelCost.notes && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,.02)', borderRadius: '7px', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '4px' }}>NOTES</div>
                  <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.55)', lineHeight: 1.5, margin: 0 }}>{modelCost.notes}</p>
                </div>
              )}
              {modelCorr && (
                <div style={{ padding: '10px 12px', background: 'rgba(76,175,130,.05)', borderRadius: '7px', border: '1px solid rgba(76,175,130,.15)' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#4caf82', marginBottom: '4px' }}>ESTIMATED START-BY DATE</div>
                  <div style={{ fontSize: '12px', color: '#f5f0e8', fontWeight: 600 }}>
                    {(() => {
                      const wks = parseInt(modelCorr.leadWeeks, 10)
                      if (isNaN(wks)) return '—'
                      const d = new Date(); d.setDate(d.getDate() + wks * 7 + 14)
                      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    })()}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.4)', marginTop: '2px' }}>Based on {modelCorr.leadWeeks}-week permit lead time + 2-week buffer from today</div>
                </div>
              )}
            </div>
          ) : (
            <div className="cc-empty-state" style={{ padding: '32px' }}>
              <span>⊞</span><p>Select a corridor above to see cost estimates.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Role context banner */}
          {(roleIsImporter || roleIsExporter) && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '11px',
              background: 'rgba(212,168,75,.06)', border: '1px solid rgba(212,168,75,.18)',
              color: 'rgba(245,240,232,.7)', display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <span style={{ color: '#d4a84b' }}>◎</span>
              {roleIsImporter
                ? `Showing corridors relevant to ${country.label} importers. Corridors reaching ${country.label} are highlighted.`
                : `Showing corridors relevant to ${country.label} exporters. Corridors originating from ${country.label} are highlighted.`}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search corridors, authorities, notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 200px', minWidth: '160px', background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px',
                color: '#f5f0e8', fontSize: '12px', padding: '7px 12px', outline: 'none',
              }}
            />
            <select
              value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '8px', color: filterFrom ? '#f5f0e8' : 'rgba(245,240,232,.4)',
                fontSize: '12px', padding: '7px 12px', outline: 'none',
              }}
            >
              <option value="">All origins</option>
              {fromOptions.map(f => <option key={f} value={f} style={{ background: '#050c18' }}>{f}</option>)}
            </select>
            <select
              value={filterTo} onChange={e => setFilterTo(e.target.value)}
              style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '8px', color: filterTo ? '#f5f0e8' : 'rgba(245,240,232,.4)',
                fontSize: '12px', padding: '7px 12px', outline: 'none',
              }}
            >
              <option value="">All destinations</option>
              {toOptions.map(t => <option key={t} value={t} style={{ background: '#050c18' }}>{t}</option>)}
            </select>
          </div>

          {/* Corridor list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sorted.length === 0 && (
              <div className="cc-empty-state" style={{ padding: '24px' }}>
                <span>⬡</span><p>No corridors match your filters.</p>
              </div>
            )}
            {sorted.map((c, i) => {
              const intelKey    = `${c.from}→${c.to}`
              const isOpen      = expanded === intelKey
              const isLocal     = c.from.toLowerCase().includes(country.label.toLowerCase()) || c.to.toLowerCase().includes(country.label.toLowerCase())
              const live        = liveData[intelKey]
              const isLoading   = loadingKeys.has(intelKey)
              const banking     = CORRIDOR_BANKING[intelKey]
              const authority   = CORRIDOR_AUTHORITY[intelKey]
              const costs       = CORRIDOR_COSTS[intelKey]
              const majorAlerts = live?.alerts.filter(a => a.severity === 'major').length ?? 0
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: '10px', overflow: 'hidden',
                    border: isLocal ? '1px solid rgba(212,168,75,.3)' : '1px solid rgba(255,255,255,.07)',
                    background: isLocal ? 'rgba(212,168,75,.04)' : 'rgba(255,255,255,.02)',
                  }}
                >
                  {/* Header row */}
                  <button
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onClick={() => setExpanded(isOpen ? null : intelKey)}
                  >
                    <span style={{ color: CORRIDOR_STATUS_COLOR[c.status], fontSize: '16px', flexShrink: 0 }}>⬡</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '13px', color: '#f5f0e8' }}>{c.from}</strong>
                        <span style={{ fontSize: '12px', color: 'rgba(245,240,232,.35)' }}>→</span>
                        <strong style={{ fontSize: '13px', color: '#f5f0e8' }}>{c.to}</strong>
                        {isLocal && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.3)', color: '#d4a84b' }}>RELEVANT</span>}
                        {majorAlerts > 0 && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(224,92,92,.15)', border: '1px solid rgba(224,92,92,.3)', color: '#e05c5c' }}>⚠ {majorAlerts} ALERT{majorAlerts > 1 ? 'S' : ''}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(245,240,232,.42)', marginTop: '2px' }}>{c.authority}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '9px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600,
                        background: `${CORRIDOR_STATUS_COLOR[c.status]}18`,
                        border: `1px solid ${CORRIDOR_STATUS_COLOR[c.status]}40`,
                        color: CORRIDOR_STATUS_COLOR[c.status],
                      }}>{c.status}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(245,240,232,.35)', minWidth: '60px', textAlign: 'right' }}>{c.leadWeeks}w</span>
                      <span style={{ fontSize: '13px', color: 'rgba(245,240,232,.25)', transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                      {/* Key risk */}
                      <div style={{
                        marginTop: '14px', padding: '10px 12px', borderRadius: '8px',
                        background: 'rgba(224,92,92,.07)', border: '1px solid rgba(224,92,92,.22)',
                        display: 'flex', gap: '8px', alignItems: 'flex-start',
                      }}>
                        <span style={{ color: '#e05c5c', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>⚠</span>
                        <div>
                          <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#e05c5c', marginBottom: '3px', fontWeight: 600 }}>KEY RISK</div>
                          <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.75)', lineHeight: 1.5, margin: 0 }}>{c.keyRisk}</p>
                        </div>
                      </div>

                      {/* Live loading indicator */}
                      {isLoading && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(245,240,232,.35)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span>⟳</span> Loading live intelligence…
                        </div>
                      )}

                      {/* Regulatory alerts */}
                      {(live?.alerts.length ?? 0) > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '6px' }}>REGULATORY ALERTS</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {live!.alerts.slice(0, 5).map(a => (
                              <div key={a.id} style={{
                                padding: '8px 10px', borderRadius: '7px',
                                background: `${ALERT_SEVERITY_COLOR[a.severity] ?? '#888'}10`,
                                border: `1px solid ${ALERT_SEVERITY_COLOR[a.severity] ?? '#888'}28`,
                                display: 'flex', gap: '8px', alignItems: 'flex-start',
                              }}>
                                <span style={{ color: ALERT_SEVERITY_COLOR[a.severity] ?? '#888', fontSize: '9px', marginTop: '2px', flexShrink: 0, fontWeight: 700, letterSpacing: '.06em' }}>{a.severity.toUpperCase()}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '11px', color: '#f5f0e8', fontWeight: 600, lineHeight: 1.35 }}>{a.summary}</div>
                                  <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.45)', lineHeight: 1.4, marginTop: '2px' }}>{a.detail}</div>
                                  <div style={{ fontSize: '9px', color: 'rgba(245,240,232,.28)', marginTop: '3px' }}>{a.alert_date} · {a.source}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4-cell stats grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>PERMIT TYPE</div>
                          <div style={{ fontSize: '11px', color: '#f5f0e8', fontWeight: 600, lineHeight: 1.35 }}>{c.permit}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>PERMIT LEAD TIME</div>
                          <div style={{ fontSize: '14px', color: '#d4a84b', fontWeight: 700 }}>{c.leadWeeks} <span style={{ fontSize: '10px', fontWeight: 400 }}>weeks</span></div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>CUSTOMS CLEARANCE</div>
                          <div style={{ fontSize: '14px', color: '#5b9bd5', fontWeight: 700 }}>{c.clearanceDays} <span style={{ fontSize: '10px', fontWeight: 400 }}>days</span></div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>END-TO-END TIMELINE</div>
                          <div style={{ fontSize: '11px', color: '#4caf82', fontWeight: 600, lineHeight: 1.35 }}>{c.timeline}</div>
                        </div>
                      </div>

                      {/* Community processing times */}
                      {live?.stats && live.stats.count != null && live.stats.count > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(76,175,130,.05)', border: '1px solid rgba(76,175,130,.15)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#4caf82', marginBottom: '6px' }}>COMMUNITY PROCESSING TIMES (n={live.stats.count})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '6px' }}>
                            {[
                              { lbl: 'AVG',    val: live.stats.avg_days    != null ? `${Math.round(live.stats.avg_days)}d`    : '—' },
                              { lbl: 'MEDIAN', val: live.stats.median_days != null ? `${Math.round(live.stats.median_days)}d` : '—' },
                              { lbl: 'P90',    val: live.stats.p90_days    != null ? `${Math.round(live.stats.p90_days)}d`    : '—' },
                              { lbl: 'RANGE',  val: live.stats.min_days    != null ? `${live.stats.min_days}–${live.stats.max_days}d` : '—' },
                            ].map(({ lbl, val }) => (
                              <div key={lbl} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '8px', color: 'rgba(245,240,232,.3)', letterSpacing: '.1em' }}>{lbl}</div>
                                <div style={{ fontSize: '13px', color: '#4caf82', fontWeight: 700 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Named authority & queue */}
                      {authority && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '6px' }}>NAMED AUTHORITY & QUEUE STATUS</div>
                          <div style={{ fontSize: '11px', color: '#f5f0e8', fontWeight: 600, marginBottom: '2px' }}>{authority.team}</div>
                          <div style={{ fontSize: '10px', color: '#5b9bd5', marginBottom: '3px' }}>{authority.email}</div>
                          <div style={{ fontSize: '10px', color: '#d4a84b', marginBottom: '4px' }}>⏱ {authority.queue}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.45)', lineHeight: 1.45 }}>{authority.notes}</div>
                        </div>
                      )}

                      {/* Destination licence class */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>DESTINATION LICENCE CLASS</div>
                        <div style={{ fontSize: '11px', color: 'rgba(245,240,232,.7)', lineHeight: 1.4 }}>{c.destLicenceClass}</div>
                      </div>

                      {/* Required documentation */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '6px' }}>REQUIRED DOCUMENTATION</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {c.docs.map(d => (
                            <span key={d} style={{
                              fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                              background: 'rgba(91,155,213,.08)', border: '1px solid rgba(91,155,213,.2)', color: '#5b9bd5',
                            }}>{d}</span>
                          ))}
                        </div>
                      </div>

                      {/* Banking intelligence */}
                      {banking && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>BANKING INTELLIGENCE</div>
                          <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.7)', lineHeight: 1.5, margin: '0 0 6px' }}>{banking.summary}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                            {banking.providers.map(p => (
                              <span key={p} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(76,175,130,.08)', border: '1px solid rgba(76,175,130,.2)', color: '#4caf82' }}>{p}</span>
                            ))}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.45)' }}>FX: {banking.fxRisk}</div>
                        </div>
                      )}

                      {/* Cost reference */}
                      {costs && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(212,168,75,.03)', border: '1px solid rgba(212,168,75,.12)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: '#d4a84b', marginBottom: '6px' }}>COST REFERENCE</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                            {[
                              { lbl: 'Permit fee',     val: costs.permitFee },
                              { lbl: 'Lab / batch',    val: costs.labCostBatch },
                              { lbl: 'Logistics / kg', val: costs.logisticsPerKg },
                              { lbl: 'FX exposure',    val: costs.fxExposure },
                              { lbl: 'GMP audit',      val: costs.gmpAudit },
                            ].map(({ lbl, val }) => (
                              <div key={lbl}>
                                <div style={{ fontSize: '8px', color: 'rgba(245,240,232,.3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{lbl}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.65)', lineHeight: 1.3 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          {costs.notes && <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.4)', marginTop: '6px', lineHeight: 1.4 }}>{costs.notes}</div>}
                        </div>
                      )}

                      {/* Rejection risk factors */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '6px' }}>COMMON REJECTION / DELAY REASONS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {c.rejectionReasons.map((r, ri) => (
                            <div key={ri} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                              <span style={{ color: '#e05c5c', fontSize: '9px', marginTop: '2px', flexShrink: 0 }}>✕</span>
                              <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.5)', lineHeight: 1.45 }}>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottleneck */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '4px' }}>OPERATIONAL BOTTLENECK</div>
                        <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.55)', lineHeight: 1.5, margin: 0 }}>{c.bottleneck}</p>
                      </div>

                      {/* Intelligence notes */}
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '4px' }}>INTELLIGENCE NOTES</div>
                        <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.45)', lineHeight: 1.5, margin: 0 }}>{c.note}</p>
                      </div>

                      {/* Crowdsource processing time */}
                      <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>SHARE YOUR EXPERIENCE</div>
                        {submitted.has(intelKey) ? (
                          <div style={{ fontSize: '11px', color: '#4caf82' }}>✓ Thank you. Your data will be reviewed and added to the community dataset.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <input
                                type="number" min="1" max="999" placeholder="Days taken (permit to arrival)"
                                value={submitDays} onChange={e => setSubmitDays(e.target.value)}
                                style={{ flex: '1 1 140px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#f5f0e8', fontSize: '11px', padding: '6px 10px', outline: 'none' }}
                              />
                              <input
                                type="text" placeholder="Your role (optional)"
                                value={submitRole} onChange={e => setSubmitRole(e.target.value)}
                                style={{ flex: '1 1 120px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#f5f0e8', fontSize: '11px', padding: '6px 10px', outline: 'none' }}
                              />
                              <button
                                onClick={() => { void handleSubmit(intelKey) }}
                                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(212,168,75,.15)', color: '#d4a84b', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}
                              >Submit</button>
                            </div>
                            {submitErr && <div style={{ fontSize: '10px', color: '#e05c5c' }}>{submitErr}</div>}
                          </div>
                        )}
                      </div>

                      <a href="/intake" style={{
                        display: 'inline-flex', marginTop: '14px', padding: '8px 18px', borderRadius: '8px',
                        background: 'linear-gradient(135deg,#d4a84b,#b88c35)', color: '#0d1117',
                        fontSize: '11px', fontWeight: 700, textDecoration: 'none',
                      }}>Request Introduction for this corridor →</a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="cc-feed-footer">
            <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.3)' }}>
              {sorted.length} of {CORRIDORS.length} corridors · Harbourview curated · Updated July 2026 · EU · Americas · Africa · Asia-Pacific
            </span>
            <a href="/intake" className="cc-right-link">Request corridor analysis →</a>
          </div>
        </>
      )}
    </div>
  )
}

// ── AccessPathwayPage ─────────────────────────────────────────────────────────

const AccessPathwayPage = React.memo(function AccessPathwayPage({
  country, region, role, signals, pathwayData, countryIntel, jurisdictionPlaybook,
}: {
  country:              { iso2: string; label: string }
  region:               string
  role:                 string
  signals:              DashboardSignal[]
  pathwayData?:         PathwayData
  countryIntel?:        CountryIntelProfile | null
  jurisdictionPlaybook?: JurisdictionPlaybook
}) {
  const {
    template, steps = [], requirements = [],
    progress, requirementStatuses = [],
  } = pathwayData ?? { template: null, steps: [], requirements: [], progress: null, requirementStatuses: [] }

  const [activeStep, setActiveStep] = useState<number>(progress?.current_step ?? 1)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [mainTab, setMainTab]     = useState<'pathway' | 'corridors'>('pathway')

  const currentStep     = steps.find(s => s.step_number === activeStep)
  const currentStepReqs = requirements.filter(r => r.step_id === currentStep?.id)
  const getReqSt        = (id: string) => requirementStatuses.find(rs => rs.requirement_id === id)

  const verifiedCount = currentStepReqs.filter(r => getReqSt(r.id)?.status === 'verified').length
  const totalRequired = currentStepReqs.filter(r => r.is_required).length
  const pct           = totalRequired > 0 ? Math.round(verifiedCount / totalRequired * 100) : 0
  const nextPending   = currentStepReqs.find(r => { const s = getReqSt(r.id); return !s || s.status === 'pending' })

  const relSignals = signals.filter(s => {
    const g = deriveSignalGroup(s.title)
    return g === 'REGULATORY' || g === 'TESTING & COMPLIANCE'
  }).slice(0, 3)

  // Derive CONF_BARS: prefer countryIntel-sourced bars, blend in live pathway pct
  const CONF_BARS = useMemo(() => {
    const base = buildConfidenceBars(countryIntel).filter(b =>
      ['Regulatory', 'Access Pathway', 'Education Content'].includes(b.label),
    )
    // Replace "Access Pathway" bar with live pathway completion pct when available
    return base.map(b =>
      b.label === 'Access Pathway' && pct > 0
        ? { ...b, pct }
        : b,
    )
  }, [countryIntel, pct])
  const confOverall = useMemo(() =>
    Math.round(CONF_BARS.reduce((s, b) => s + b.pct, 0) / CONF_BARS.length),
    [CONF_BARS],
  )

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Access Pathway</h2>
          <p>Follow the pathway to establish and maintain access to export markets.</p>
          <div className="cc-mkt-tabs" style={{marginTop:'14px'}}>
            <button className={`cc-mkt-tab${mainTab==='pathway'?' active':''}`} onClick={() => setMainTab('pathway')}>My Pathway</button>
            <button className={`cc-mkt-tab${mainTab==='corridors'?' active':''}`} onClick={() => setMainTab('corridors')}>Corridor Playbooks <span className="cc-tab-badge">40</span></button>
          </div>
        </div>

        {mainTab === 'corridors' ? (
          <CorridorPlaybooksSection country={country} role={role} />
        ) : !template ? (
          <div className="cc-empty-state" style={{flex:1}}>
            <span>⬡</span>
            <p>No Access Pathway defined for {country.label}{role ? ` · ${role}` : ''}.</p>
            <small style={{fontSize:'11px',color:'var(--cc-dim)'}}>Pathways are configured per country and role. Contact Harbourview to set up your pathway.</small>
          </div>
        ) : (
          <>
            {/* ── Step progress strip ───────────────────────────── */}
            <div className="cc-ap-strip">
          {steps.map((step, i) => {
            const isSelected = step.step_number === activeStep
            const isCurrent  = step.step_number === (progress?.current_step ?? 1)
            const isDone     = step.step_number < (progress?.current_step ?? 1)
            return (
              <React.Fragment key={step.id}>
                <button
                  className={`cc-ap-node${isSelected?' selected':''}${isDone?' done':''}${isCurrent&&!isSelected?' current':''}`}
                  onClick={() => setActiveStep(step.step_number)}
                >
                  <div className="cc-ap-node-circle">{isDone ? '✓' : step.step_number}</div>
                  <span className="cc-ap-node-title">{step.title}</span>
                  <span className="cc-ap-node-status">
                    {isDone ? 'Verified' : isCurrent ? 'In Progress' : 'Not Started'}
                  </span>
                </button>
                {i < steps.length - 1 && <div className={`cc-ap-connector${isDone?' done':''}`} />}
              </React.Fragment>
            )
          })}
        </div>

        {/* ── Step detail ───────────────────────────────────── */}
        {currentStep && (
          <div className="cc-ap-detail">
            <div className="cc-ap-detail-head">
              <span className="cc-ap-step-badge">STEP {currentStep.step_number} OF {template.total_steps}</span>
              <h3 className="cc-ap-detail-title">{currentStep.title}</h3>
              {currentStep.description && <p className="cc-right-prose">{currentStep.description}</p>}
            </div>

            <div className="cc-ap-detail-cols">
              {/* Left */}
              <div className="cc-ap-detail-left">
                <div className="cc-ap-section-lbl">WHAT THIS MEANS</div>
                <p className="cc-right-prose">
                  {currentStep.description ?? `Complete all required evidence for step ${currentStep.step_number} to advance your pathway.`}
                </p>
                <Link href={`/compliance/country-pathways/${country.iso2.toLowerCase()}`} className="cc-right-link">View {country.label} requirements →</Link>

                <div className="cc-ap-status-card">
                  <div className="cc-ap-section-lbl">CURRENT STATUS</div>
                  <span className={`cc-ap-status-pill ${pct===100?'complete':pct>0?'progress':'pending'}`}>
                    {pct===100 ? '✓ Complete' : pct>0 ? 'In Progress' : 'Not Started'}
                  </span>
                  <p style={{fontSize:'11px',color:'var(--cc-muted)',margin:'6px 0'}}>
                    {verifiedCount} of {totalRequired} requirements verified
                  </p>
                  <div className="cc-edu-track">
                    <div className="cc-edu-fill" style={{width:`${pct}%`}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                    <span style={{fontSize:'11px',fontWeight:700,color:'var(--cc-gold)'}}>{pct}%</span>
                    {progress?.last_action_at && (
                      <small style={{fontSize:'10px',color:'var(--cc-dim)'}}>
                        Last updated: {new Date(progress.last_action_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: requirements */}
              <div className="cc-ap-detail-right">
                <div className="cc-ap-section-lbl">REQUIRED EVIDENCE</div>
                <div className="cc-ap-reqs">
                  {[...currentStepReqs].sort((a,b) => a.sort_order - b.sort_order).map(req => {
                    const status = getReqSt(req.id)?.status ?? 'pending'
                    return (
                      <div key={req.id} className={`cc-ap-req-row ${status}`}>
                        <span className="cc-ap-req-icon" style={{color: REQ_STATUS_COLOR[status]}}>
                          {REQ_STATUS_ICON[status]}
                        </span>
                        <div className="cc-ap-req-body">
                          <strong>{req.title}</strong>
                          {req.description && <small>{req.description}</small>}
                        </div>
                        <span className={`cc-ap-req-badge ${status}`}>
                          {status.charAt(0).toUpperCase()+status.slice(1).replace('_',' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Link href={`/compliance/country-pathways/${country.iso2.toLowerCase()}`} className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}}>View all requirements →</Link>
              </div>
            </div>

            {/* Next action */}
            {nextPending && (
              <div className="cc-ap-next-action">
                <div className="cc-ap-na-content">
                  <span className="cc-ap-na-arrow">→</span>
                  <div>
                    <strong>Upload {nextPending.title}</strong>
                    {nextPending.description && <p>{nextPending.description}</p>}
                  </div>
                </div>
                <button className="cc-nba-btn">Upload Document</button>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">REQUIRED DOCUMENTS</div>
          {requirements.slice(0, 5).map(r => {
            const status = getReqSt(r.id)?.status ?? 'pending'
            return (
              <div key={r.id} className="cc-req-row">
                <span className="cc-req-icon" style={{color: REQ_STATUS_COLOR[status]}}>{REQ_STATUS_ICON[status]}</span>
                <div>
                  <strong>{r.title}</strong>
                  <small>{status==='verified'?'Verified':status==='in_review'?'Under review':'Pending'}</small>
                </div>
              </div>
            )
          })}
          <Link href="/dashboard?page=evidence" className="cc-right-link">View all documents →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">ROUTED INQUIRY</div>
          <p className="cc-right-prose">Submit a sourcing or access inquiry for Harbourview to review before routing to the appropriate export partner.</p>
          <button className="cc-right-link" onClick={() => setQuoteOpen(true)}>Submit inquiry →</button>
        </div>

        {relSignals.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">RELATED SIGNALS</div>
            {relSignals.map((s, i) => (
              <div key={i} className="cc-edu-ev-row">
                <span className={`cc-sig-dot ${deriveImpact(s.confidence).toLowerCase()}`} style={{flexShrink:0,marginTop:'5px'}}/>
                <div>
                  <strong style={{fontSize:'11px'}}>{s.title}</strong>
                  <small>{s.market} · {s.timeAgo}</small>
                </div>
              </div>
            ))}
            <Link href="/signals" className="cc-right-link">View all signals →</Link>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">EVIDENCE CONFIDENCE</div>
          <div className="cc-confidence-summary">
            <div className="cc-confidence-donut">
              <svg viewBox="0 0 64 64" className="cc-donut-svg">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--cc-gold)" strokeWidth="7"
                  strokeDasharray={`${163.4*confOverall/100} 163.4`} strokeLinecap="round" transform="rotate(-90 32 32)"/>
              </svg>
              <div className="cc-donut-label">
                <strong>{confOverall}%</strong>
                <small>Overall<br/>Confidence</small>
              </div>
            </div>
            <div className="cc-confidence-bars">
              {CONF_BARS.map(b => (
                <div key={b.label} className="cc-conf-bar-row">
                  <span className="cc-conf-bar-lbl">{b.label}</span>
                  <div className="cc-conf-bar-track"><div className="cc-conf-bar-fill" style={{width:`${b.pct}%`}}/></div>
                  <span className="cc-conf-bar-pct">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/source-methodology" className="cc-right-link">Confidence methodology →</Link>
        </div>

        {jurisdictionPlaybook && (
          <div className="cc-right-section">
            <div className="cc-right-head">JURISDICTION PLAYBOOK</div>
            <div className="cc-playbook-card">
              {jurisdictionPlaybook.difficulty && (
                <div className="cc-playbook-row">
                  <span className="cc-playbook-lbl">Difficulty</span>
                  <span className="cc-playbook-val">{jurisdictionPlaybook.difficulty}</span>
                </div>
              )}
              {jurisdictionPlaybook.typical_timeline_months && (
                <div className="cc-playbook-row">
                  <span className="cc-playbook-lbl">Timeline</span>
                  <span className="cc-playbook-val">{jurisdictionPlaybook.typical_timeline_months} mo</span>
                </div>
              )}
              {jurisdictionPlaybook.estimated_cost_range && (
                <div className="cc-playbook-row">
                  <span className="cc-playbook-lbl">Est. Cost</span>
                  <span className="cc-playbook-val">{jurisdictionPlaybook.estimated_cost_range}</span>
                </div>
              )}
              {jurisdictionPlaybook.legal_framework_summary && (
                <p className="cc-playbook-summary">{jurisdictionPlaybook.legal_framework_summary}</p>
              )}
              {jurisdictionPlaybook.common_pitfalls.length > 0 && (
                <div className="cc-playbook-pitfalls">
                  <span className="cc-playbook-pitfalls-lbl">Common pitfalls</span>
                  {jurisdictionPlaybook.common_pitfalls.slice(0, 3).map((p, i) => (
                    <div key={i} className="cc-playbook-pitfall">⚠ {p}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  )
})

// ── Watchlist types ───────────────────────────────────────────────────────────

type WatchlistTab = 'jurisdiction'|'signal'|'pathway'|'marketplace_item'|'source'|'policy'

const WL_TABS: { id: WatchlistTab; label: string }[] = [
  { id: 'jurisdiction',    label: 'Jurisdictions'     },
  { id: 'signal',          label: 'Signals'           },
  { id: 'pathway',         label: 'Pathways'          },
  { id: 'marketplace_item',label: 'Marketplace Items' },
  { id: 'source',          label: 'Sources'           },
  { id: 'policy',          label: 'Policies'          },
]
const WL_ICONS: Record<string, string> = {
  jurisdiction: '⬡', signal: '≋', pathway: '◈',
  marketplace_item: '⊞', source: '⊟', policy: '◎',
}
const WL_RULE_LABELS: Record<string, string> = {
  jurisdiction: 'Jurisdictions', signal: 'Signals', pathway: 'Pathways',
  marketplace: 'Marketplace', source: 'Sources', policy: 'Policies',
}
const WL_SUGGESTED = [
  { label: 'Canada Medical Cannabis Export Rules', type: 'Jurisdiction', sub: 'Canada' },
  { label: 'FSMA Produce Safety Rule Updates',     type: 'Signal',       sub: 'United States' },
  { label: 'German Pharmacy Buyer Contacts',       type: 'Marketplace',  sub: 'Germany' },
]

// ── WatchlistPage ─────────────────────────────────────────────────────────────

const WatchlistPage = React.memo(function WatchlistPage({
  country, region, role, watchlistData,
}: {
  country:        { iso2: string; label: string }
  region:         string
  role:           string
  watchlistData?: WatchlistData
}) {
  const [activeTab, setActiveTab] = useState<WatchlistTab>('jurisdiction')
  const { items = [], rules = [], notifications = { total_alerts:0, awaiting_review:0, resolved:0, snoozed:0 } } = watchlistData ?? {}

  const filtered = useMemo(() => items.filter(i => i.item_type === activeTab), [items, activeTab])

  const rulesByType = useMemo(() => {
    const map: Record<string, string[]> = {}
    rules.forEach(r => { (map[r.rule_type] ??= []).push(...r.keywords) })
    return map
  }, [rules])

  const recentActivity = useMemo(() =>
    [...items]
      .filter(i => i.latest_change_at)
      .sort((a,b) => new Date(b.latest_change_at!).getTime()-new Date(a.latest_change_at!).getTime())
      .slice(0,5),
    [items]
  )

  const NOTIF_STATS = [
    { label: 'Total Alerts',    value: notifications.total_alerts,   highlight: notifications.total_alerts > 0 },
    { label: 'Awaiting Review', value: notifications.awaiting_review, highlight: false },
    { label: 'Resolved',        value: notifications.resolved,        highlight: false },
    { label: 'Snoozed',         value: notifications.snoozed,         highlight: false },
  ]

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Watchlist</h2>
          <p>Monitored intelligence across saved jurisdictions, signals, pathways, marketplace opportunities, source files, and policy questions tied to your role and jurisdiction.</p>
        </div>

        <div className="cc-mkt-tabs">
          {WL_TABS.map(t => {
            const count = items.filter(i => i.item_type === t.id).length
            return (
              <button key={t.id}
                className={`cc-mkt-tab${activeTab===t.id?' active':''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {count > 0 && <span className="cc-tab-badge">{count}</span>}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="cc-empty-state" style={{flex:1}}>
            <span>{WL_ICONS[activeTab]??'◎'}</span>
            <p>No {WL_TABS.find(t=>t.id===activeTab)?.label.toLowerCase()} on your watchlist.</p>
            <small style={{fontSize:'11px',color:'var(--cc-dim)'}}>
              Add items from any page using the &quot;Add to watchlist&quot; action.
            </small>
          </div>
        ) : (
          <>
            <div className="cc-wl-table-wrap">
              <div className="cc-wl-thead">
                <span className="cc-mkt-th name-col">NAME</span>
                <span className="cc-mkt-th">TYPE</span>
                <span className="cc-mkt-th">JURISDICTION</span>
                <span className="cc-mkt-th">LATEST CHANGE</span>
                <span className="cc-mkt-th">CONFIDENCE</span>
                <span className="cc-mkt-th">NEXT ACTION</span>
              </div>
              {filtered.map(item => {
                const conf = item.confidence_pct ?? 0
                return (
                  <div key={item.id} className="cc-wl-row">
                    <div className="cc-wl-cell name-col">
                      <div className="cc-wl-item-icon">{WL_ICONS[item.item_type]??'◎'}</div>
                      <div className="cc-wl-item-body">
                        <strong>{item.title}</strong>
                        {item.subtitle && <small>{item.subtitle}</small>}
                        <div className="cc-wl-tags">
                          {item.tags.slice(0,3).map(tag => <span key={tag} className="cc-opp-tag">{tag}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="cc-wl-cell">
                      <span className="cc-wl-type-badge">{item.item_type.replace(/_/g,' ')}</span>
                    </div>
                    <div className="cc-wl-cell">{item.jurisdiction ?? country.label}</div>
                    <div className="cc-wl-cell cc-wl-change-cell">
                      {item.latest_change_at
                        ? <><span>{new Date(item.latest_change_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                            {item.latest_change_note && <small>{item.latest_change_note}</small>}</>
                        : <span style={{color:'var(--cc-dim)'}}>—</span>
                      }
                    </div>
                    <div className="cc-wl-cell">
                      {conf > 0 ? (
                        <svg viewBox="0 0 36 36" className="cc-mini-donut">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4"/>
                          <circle cx="18" cy="18" r="14" fill="none"
                            stroke={conf>=80?'var(--cc-green)':conf>=65?'var(--cc-amber)':'var(--cc-red)'}
                            strokeWidth="4" strokeDasharray={`${87.96*conf/100} 87.96`}
                            strokeLinecap="round" transform="rotate(-90 18 18)"/>
                          <text x="18" y="22" textAnchor="middle" fontSize="9" fill="var(--cc-text)" fontWeight="600">{conf}%</text>
                        </svg>
                      ) : <span style={{color:'var(--cc-dim)'}}>—</span>}
                    </div>
                    <div className="cc-wl-cell cc-wl-action-cell">
                      <span>{item.next_action??'Review'}</span>
                      <span className="cc-settings-chev">›</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="cc-feed-footer">
              <span>Showing {filtered.length} of {items.length} items</span>
            </div>
          </>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">
            WATCH RULES <span className="cc-right-info">ⓘ</span>
            <button className="cc-apply-btn" style={{marginLeft:'auto'}}>Manage</button>
          </div>
          {Object.entries(WL_RULE_LABELS).map(([type, label]) => {
            const kw = rulesByType[type]
            if (!kw?.length) return null
            return (
              <div key={type} className="cc-wl-rule-row">
                <span className="cc-wl-rule-icon">{WL_ICONS[type]??'◎'}</span>
                <div><strong>{label}</strong><small>{kw.join('; ')}</small></div>
              </div>
            )
          })}
          {!Object.keys(rulesByType).length && (
            <p className="cc-right-prose">No watch rules configured yet.</p>
          )}
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">RECENT WATCHLIST ACTIVITY <Link href="/education" className="cc-right-link ml-auto">View all →</Link></div>
          {recentActivity.length === 0
            ? <p className="cc-right-prose">No recent activity.</p>
            : recentActivity.map(item => (
                <div key={item.id} className="cc-change-note">
                  <span className="cc-change-arrow up">↑</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.latest_change_note??'Updated'}</small>
                    <span className="cc-change-time">
                      {item.latest_change_at ? new Date(item.latest_change_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : ''}
                    </span>
                  </div>
                </div>
              ))
          }
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SUGGESTED ADDITIONS</div>
          {WL_SUGGESTED.map(s => (
            <div key={s.label} className="cc-wl-suggestion">
              <div><strong>{s.label}</strong><small>{s.type} · {s.sub}</small></div>
              <button className="cc-wl-add-btn">+</button>
            </div>
          ))}
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">NOTIFICATION SUMMARY</div>
          <div className="cc-wl-notif-grid">
            {NOTIF_STATS.map(s => (
              <div key={s.label} className={`cc-wl-notif-card${s.highlight?' alert':''}`}>
                <strong>{s.value}</strong>
                <small>{s.label}</small>
              </div>
            ))}
          </div>
          {notifications.total_alerts > 0 && (
            <small className="cc-wl-alert-note">{notifications.total_alerts} High Priority</small>
          )}
        </div>
      </aside>
    </div>
  )
})

// ── Evidence & Sources helpers ────────────────────────────────────────────────

type EvidenceTab = 'regulatory'|'guidance'|'licensing'|'clinical'|'market'|'import_export'|'education'|'local'|'labs'

const EV_TABS: { id: EvidenceTab; label: string }[] = [
  { id: 'regulatory',    label: 'Regulatory & Statute'    },
  { id: 'guidance',      label: 'Guidance & Policy'       },
  { id: 'licensing',     label: 'Licensing / Authority'   },
  { id: 'clinical',      label: 'Clinical / Practice'     },
  { id: 'market',        label: 'Market / Commercial'     },
  { id: 'import_export', label: 'Import / Export'         },
  { id: 'education',     label: 'Education / Professional'},
  { id: 'local',         label: 'Local / Subnational'     },
  { id: 'labs',          label: 'Lab Directory'           },
]

type LabEntry = {
  name:         string
  country:      string
  accreditation: string[]
  scope:        string[]
  iso:          string
  intl:         boolean
}

const LAB_REGISTRY: LabEntry[] = [
  { name: 'Eurofins Scientific',       country: 'Germany / Global',    accreditation: ['ISO/IEC 17025', 'EU GMP'],           scope: ['Potency', 'Pesticides', 'Mycotoxins', 'Heavy Metals', 'Terpenes', 'Microbiological'], iso: 'ISO/IEC 17025', intl: true },
  { name: 'Tentamus Cannabis Lab',     country: 'Germany',             accreditation: ['ISO/IEC 17025', 'EU GMP Annex 16'],  scope: ['Potency', 'Pesticides', 'Residual Solvents', 'Contaminants', 'COA Issuance'],           iso: 'ISO/IEC 17025', intl: true },
  { name: 'TÜV SÜD',                  country: 'Germany / Global',    accreditation: ['ISO/IEC 17025', 'GMP'],              scope: ['Potency', 'Contaminants', 'Terpenes', 'Stability Testing'],                              iso: 'ISO/IEC 17025', intl: true },
  { name: 'Cannalytics Supply GmbH',  country: 'Germany',             accreditation: ['ISO/IEC 17025'],                      scope: ['Potency', 'Terpenes', 'Residual Solvents', 'Pesticides'],                               iso: 'ISO/IEC 17025', intl: false },
  { name: 'Bedrocan Quality Labs',    country: 'Netherlands',          accreditation: ['ISO/IEC 17025', 'GMP'],              scope: ['Potency', 'Microbiological', 'Pesticides', 'Heavy Metals', 'Full Panel'],                 iso: 'ISO/IEC 17025', intl: true },
  { name: 'Centre for Natural Products', country: 'Canada (Health Canada)', accreditation: ['ISO/IEC 17025', 'GMP'],         scope: ['Potency', 'Pesticides', 'Microbiological', 'Heavy Metals', 'Terpenes'],                   iso: 'ISO/IEC 17025', intl: true },
  { name: 'Anandia Labs',             country: 'Canada',               accreditation: ['ISO/IEC 17025', 'GMP'],              scope: ['Potency', 'Terpenes', 'Pesticides', 'Contaminants', 'Genetic Testing'],                   iso: 'ISO/IEC 17025', intl: true },
  { name: 'Green Leaf Lab',           country: 'USA (Oregon)',         accreditation: ['ISO/IEC 17025', 'ORELAP'],           scope: ['Potency', 'Pesticides', 'Microbiological', 'Terpenes', 'Residual Solvents'],               iso: 'ISO/IEC 17025', intl: false },
  { name: 'SC Laboratories',          country: 'USA (California)',     accreditation: ['ISO/IEC 17025', 'CDPH'],             scope: ['Full Panel', 'Potency', 'Pesticides', 'Heavy Metals', 'Terpenes'],                        iso: 'ISO/IEC 17025', intl: false },
  { name: 'KCL / Aphria Labs',        country: 'UK',                   accreditation: ['ISO/IEC 17025', 'MHRA GMP'],         scope: ['Potency', 'Purity', 'Contaminants', 'Microbiological', 'Stability'],                      iso: 'ISO/IEC 17025', intl: true },
  { name: 'PhytoVista Laboratories',  country: 'UK',                   accreditation: ['ISO/IEC 17025', 'UKAS'],             scope: ['Cannabinoid Profile', 'Terpenes', 'Contaminants', 'Heavy Metals', 'Pesticides'],           iso: 'ISO/IEC 17025', intl: true },
  { name: 'Alkemist Labs',            country: 'USA (California)',     accreditation: ['ISO/IEC 17025'],                      scope: ['Botanical Identity', 'Potency', 'Contaminants', 'Pesticides', 'Adulterant Screening'],   iso: 'ISO/IEC 17025', intl: false },
  { name: 'Steep Hill Labs',          country: 'USA (Multi-state)',    accreditation: ['ISO/IEC 17025'],                      scope: ['Full Panel', 'Potency', 'Pesticides', 'Terpenes', 'Residual Solvents'],                   iso: 'ISO/IEC 17025', intl: false },
  { name: 'RPC Photonics / AgriScience Labs', country: 'Australia',   accreditation: ['ISO/IEC 17025', 'NATA'],             scope: ['Potency', 'Pesticides', 'Microbiological', 'Heavy Metals'],                               iso: 'ISO/IEC 17025', intl: true },
]

function LabDirectorySection({ country }: { country: { iso2: string; label: string } }) {
  const [search, setSearch] = useState('')
  const [intlOnly, setIntlOnly] = useState(false)
  const filtered = LAB_REGISTRY.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q) || l.scope.some(s => s.toLowerCase().includes(q))
    const matchIntl = !intlOnly || l.intl
    return matchSearch && matchIntl
  })
  const highlighted = filtered.filter(l =>
    l.country.toLowerCase().includes(country.label.toLowerCase()) ||
    l.intl,
  )
  const display = search || intlOnly ? filtered : highlighted.length > 0 ? highlighted : filtered

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search labs by name, country, or test type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '8px', color: '#f5f0e8', fontSize: '12px', padding: '7px 12px', outline: 'none',
          }}
        />
        <button
          onClick={() => setIntlOnly(v => !v)}
          style={{
            padding: '7px 14px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
            background: intlOnly ? 'rgba(212,168,75,.15)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${intlOnly ? 'rgba(212,168,75,.35)' : 'rgba(255,255,255,.1)'}`,
            color: intlOnly ? '#d4a84b' : 'rgba(245,240,232,.5)',
            transition: 'all .12s',
          }}
        >
          International Samples Only
        </button>
      </div>

      <div className="cc-ev-thead">
        <span className="cc-mkt-th" style={{ flex: '2' }}>LAB NAME</span>
        <span className="cc-mkt-th">COUNTRY</span>
        <span className="cc-mkt-th">ACCREDITATION</span>
        <span className="cc-mkt-th">TESTING SCOPE</span>
        <span className="cc-mkt-th">INTL SAMPLES</span>
      </div>
      {display.map(lab => (
        <div key={lab.name} className="cc-ev-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 80px' }}>
          <div className="cc-ev-cell">
            <strong style={{ fontSize: '12px', color: '#f5f0e8' }}>{lab.name}</strong>
            <small style={{ display: 'block', fontSize: '10px', color: 'rgba(245,240,232,.35)', marginTop: '2px' }}>{lab.iso}</small>
          </div>
          <div className="cc-ev-cell" style={{ fontSize: '11px', color: 'rgba(245,240,232,.6)' }}>{lab.country}</div>
          <div className="cc-ev-cell">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {lab.accreditation.map(a => (
                <span key={a} style={{
                  fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                  background: 'rgba(76,175,130,.1)', border: '1px solid rgba(76,175,130,.2)', color: '#4caf82',
                }}>{a}</span>
              ))}
            </div>
          </div>
          <div className="cc-ev-cell">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {lab.scope.slice(0, 4).map(s => (
                <span key={s} style={{
                  fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: 'rgba(245,240,232,.45)',
                }}>{s}</span>
              ))}
              {lab.scope.length > 4 && (
                <span style={{ fontSize: '9px', color: 'rgba(245,240,232,.3)' }}>+{lab.scope.length - 4} more</span>
              )}
            </div>
          </div>
          <div className="cc-ev-cell">
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '99px',
              background: lab.intl ? 'rgba(91,155,213,.1)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${lab.intl ? 'rgba(91,155,213,.25)' : 'rgba(255,255,255,.07)'}`,
              color: lab.intl ? '#5b9bd5' : 'rgba(245,240,232,.3)',
            }}>
              {lab.intl ? 'Yes' : 'Domestic'}
            </span>
          </div>
        </div>
      ))}
      {display.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(245,240,232,.35)', fontSize: '12px' }}>
          No labs match your search.
        </div>
      )}
      <div className="cc-feed-footer" style={{ marginTop: '8px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.3)' }}>
          {display.length} accredited labs · Harbourview curated registry · Contact Harbourview to add your lab
        </span>
      </div>
    </div>
  )
}

const CAT_TO_TAB: Record<string, EvidenceTab> = {
  cannabis_licence_database:    'regulatory',
  regulator_updates:            'guidance',
  licence_database:             'licensing',
  clinical_research:            'clinical',
  market_data:                  'market',
  auction_surplus:              'market',
  import_export:                'import_export',
  education:                    'education',
  local_government:             'local',
}

const CAT_TO_TYPE: Record<string, string> = {
  cannabis_licence_database: 'Licence Database',
  regulator_updates:         'Regulatory Bulletin',
  auction_surplus:           'Market Listing',
  market_data:               'Market Data',
  local_government:          'Local Authority',
}

const CAT_TO_STEP: Record<string, string> = {
  cannabis_licence_database: '1 · Licence Status',
  regulator_updates:         '2 · Production Readiness',
  market_data:               '5 · Buyer Route',
  auction_surplus:           '5 · Buyer Route',
}

const REL_TO_CONF: Record<string, { pct: number; label: string }> = {
  high:   { pct: 85, label: 'High' },
  medium: { pct: 70, label: 'Medium' },
  low:    { pct: 50, label: 'Low' },
}

function sourceTab(src: EvidenceSource): EvidenceTab {
  return CAT_TO_TAB[src.category] ?? 'regulatory'
}

function confFromReliability(r: string) {
  return REL_TO_CONF[r] ?? { pct: 65, label: 'Medium' }
}

function freshnessLabel(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 30)  return 'Current'
  if (days <= 90)  return 'Recent'
  if (days <= 180) return 'Due Soon'
  return 'Overdue'
}

// ── EvidenceSourcesPage ───────────────────────────────────────────────────────

const EvidenceSourcesPage = React.memo(function EvidenceSourcesPage({
  country, region, role, evidenceData, pathwayData, professionals = [],
}: {
  country:        { iso2: string; label: string }
  region:         string
  role:           string
  evidenceData?:  EvidenceData
  pathwayData?:   PathwayData
  professionals?: HvProfessional[]
}) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('regulatory')
  const { sources = [], orgDocs = [] } = evidenceData ?? {}

  // Filter sources relevant to selected country
  const countrySources = useMemo(() =>
    sources.filter(s =>
      s.markets.length === 0 ||
      s.markets.some(m => m.toLowerCase().includes(country.label.toLowerCase()) ||
                          country.label.toLowerCase().includes(m.toLowerCase()))
    ),
    [sources, country]
  )

  // If no country-specific sources, show all (graceful fallback)
  const displaySources = countrySources.length > 0 ? countrySources : sources

  const tabSources = useMemo(() =>
    displaySources.filter(s => sourceTab(s) === activeTab),
    [displaySources, activeTab]
  )

  // Summary stats
  const verified     = displaySources.filter(s => s.reliability === 'high').length
  const needsReview  = displaySources.filter(s => s.reliability === 'medium').length
  const unknownAreas = orgDocs.filter(d => d.verification_status === 'pending').length
  const lastChecked  = displaySources.find(s => s.last_checked)?.last_checked ?? null
  const overallConf  = displaySources.length > 0
    ? Math.round(displaySources.reduce((acc, s) => acc + confFromReliability(s.reliability).pct, 0) / displaySources.length)
    : 0

  // Freshness buckets
  const upToDate   = displaySources.filter(s => freshnessLabel(s.last_checked) === 'Current').length
  const dueSoon    = displaySources.filter(s => ['Recent','Due Soon'].includes(freshnessLabel(s.last_checked))).length
  const overdue    = displaySources.filter(s => freshnessLabel(s.last_checked) === 'Overdue').length
  const totalFresh = upToDate + dueSoon + overdue || 1

  // Review queue: org docs needing verification
  const reviewQueue = useMemo(() =>
    orgDocs.filter(d => d.verification_status === 'pending' || d.verification_status === 'needs_review').slice(0, 4),
    [orgDocs]
  )

  // Evidence gaps from pathway requirements
  const evidenceGaps = useMemo(() => {
    if (!pathwayData?.requirements?.length) return [
      { text: `${country.label} local authority data coverage`, applies: 'Local Intel' },
      { text: 'Export route verification documentation',          applies: 'Buyer Route' },
      { text: 'Third-party lab result cross-referencing',        applies: 'Testing & COA' },
    ]
    return pathwayData.requirements
      .filter(r => {
        const st = pathwayData.requirementStatuses.find(rs => rs.requirement_id === r.id)
        return !st || st.status === 'pending'
      })
      .slice(0, 3)
      .map(r => {
        const step = pathwayData.steps.find(s => s.id === r.step_id)
        return { text: r.title, applies: step?.title ?? 'Access Pathway' }
      })
  }, [pathwayData, country])

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Research</h2>
          <p>Curated, verified, and mapped evidence to support compliant{role ? ` ${role.toLowerCase()}` : ''} operations.</p>
        </div>

        {/* ── Summary bar ───────────────────────────────────── */}
        <div className="cc-ev-summary">
          <div className="cc-ev-stat-card">
            <div className="cc-rw-card-lbl">OVERALL CONFIDENCE</div>
            <div className="cc-ev-conf-wrap">
              <div className="cc-rw-donut-wrap" style={{width:'52px',height:'52px'}}>
                <svg viewBox="0 0 52 52" className="cc-donut-svg">
                  <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="5"/>
                  <circle cx="26" cy="26" r="20" fill="none" stroke="var(--cc-gold)" strokeWidth="5"
                    strokeDasharray={`${125.7*overallConf/100} 125.7`}
                    strokeLinecap="round" transform="rotate(-90 26 26)"/>
                </svg>
                <div className="cc-donut-label"><strong style={{fontSize:'12px'}}>{overallConf}%</strong></div>
              </div>
              <div>
                <strong className="cc-ev-conf-label">{overallConf >= 80 ? 'Good' : overallConf >= 60 ? 'Fair' : 'Needs Work'}</strong>
                <small>Based on {displaySources.length} sources</small>
              </div>
            </div>
          </div>

          <div className="cc-ev-stat-card">
            <div className="cc-rw-card-lbl">VERIFIED SOURCES</div>
            <div className="cc-ev-stat-big verified">{verified}</div>
            <small>Sources</small>
          </div>

          <div className="cc-ev-stat-card">
            <div className="cc-rw-card-lbl">NEEDS REVIEW</div>
            <div className="cc-ev-stat-big needs-review">{needsReview}</div>
            <small>Sources</small>
          </div>

          <div className="cc-ev-stat-card">
            <div className="cc-rw-card-lbl">UNKNOWN AREAS</div>
            <div className="cc-ev-stat-big unknown">{unknownAreas}</div>
            <small>Areas</small>
          </div>

          <div className="cc-ev-stat-card">
            <div className="cc-rw-card-lbl">📅 LAST REVIEWED</div>
            <strong className="cc-rw-change-date">{lastChecked ?? '—'}</strong>
            {lastChecked && <small>{new Date(lastChecked).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</small>}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="cc-mkt-tabs">
          {EV_TABS.map(t => {
            const cnt = displaySources.filter(s => sourceTab(s) === t.id).length
            return (
              <button key={t.id}
                className={`cc-mkt-tab${activeTab===t.id?' active':''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {cnt > 0 && <span className="cc-tab-badge">{cnt}</span>}
              </button>
            )
          })}
        </div>

        {/* ── Source table / Lab Directory ──────────────────── */}
        {activeTab === 'labs' ? (
          <LabDirectorySection country={country} />
        ) : tabSources.length === 0 && orgDocs.length === 0 ? (
          <div className="cc-empty-state" style={{flex:1}}>
            <span>⊟</span>
            <p>No {EV_TABS.find(t=>t.id===activeTab)?.label.toLowerCase()} sources for {country.label}.</p>
            <small style={{fontSize:'11px',color:'var(--cc-dim)'}}>Sources are added as Harbourview expands coverage for this jurisdiction.</small>
          </div>
        ) : (
          <div className="cc-ev-table-wrap">
            {/* Platform sources */}
            {tabSources.length > 0 && (
              <>
                <div className="cc-ev-thead">
                  <span className="cc-mkt-th ev-src-col">SOURCE</span>
                  <span className="cc-mkt-th">SOURCE TYPE</span>
                  <span className="cc-mkt-th">JURISDICTION</span>
                  <span className="cc-mkt-th">PATHWAY STEP</span>
                  <span className="cc-mkt-th">CONFIDENCE</span>
                  <span className="cc-mkt-th">LAST REVIEWED</span>
                  <span className="cc-mkt-th">VISIBILITY</span>
                </div>
                {tabSources.map(src => {
                  const conf      = confFromReliability(src.reliability)
                  const srcType   = CAT_TO_TYPE[src.category] ?? 'Source'
                  const stepLabel = CAT_TO_STEP[src.category] ?? '—'
                  const freshness = freshnessLabel(src.last_checked)
                  return (
                    <div key={src.id} className="cc-ev-row">
                      <div className="cc-ev-cell ev-src-col">
                        <span className="cc-ev-src-icon">⊟</span>
                        <div>
                          <strong>{src.name}</strong>
                          <small>{src.markets.join(', ') || 'Global'}</small>
                          {src.notes && <span className="cc-ev-src-ref">{src.notes.slice(0,60)}</span>}
                        </div>
                      </div>
                      <div className="cc-ev-cell">{srcType}</div>
                      <div className="cc-ev-cell">
                        <span className="cc-ev-juris-badge">{src.markets[0] ?? 'Global'} · Statewide</span>
                      </div>
                      <div className="cc-ev-cell">
                        {stepLabel !== '—'
                          ? <span className="cc-ev-step-badge">{stepLabel}<br/><small>Verified</small></span>
                          : <span style={{color:'var(--cc-dim)'}}>General</span>
                        }
                      </div>
                      <div className="cc-ev-cell">
                        <span className={`cc-ev-conf-badge ${src.reliability}`}>{conf.label}</span>
                        <small style={{display:'block',fontSize:'9px',color:'var(--cc-dim)',marginTop:'2px'}}>Supports claim</small>
                      </div>
                      <div className="cc-ev-cell cc-ev-date-cell">
                        {src.last_checked ?? '—'}
                        <span className={`cc-ev-fresh ${freshness.toLowerCase().replace(' ','-')}`}>{freshness}</span>
                      </div>
                      <div className="cc-ev-cell">
                        <span className="cc-ev-vis-badge">🔓 Public</span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Org-uploaded documents */}
            {orgDocs.length > 0 && (
              <>
                <div className="cc-ev-section-divider">UPLOADED DOCUMENTS ({orgDocs.length})</div>
                {orgDocs.slice(0,5).map(doc => {
                  const verified = doc.verification_status === 'verified'
                  return (
                    <div key={doc.id} className="cc-ev-row">
                      <div className="cc-ev-cell ev-src-col">
                        <span className="cc-ev-src-icon">⊞</span>
                        <div>
                          <strong>{doc.display_name}</strong>
                          <small>{doc.document_type}</small>
                        </div>
                      </div>
                      <div className="cc-ev-cell">{doc.document_type}</div>
                      <div className="cc-ev-cell"><span className="cc-ev-juris-badge">{country.label}</span></div>
                      <div className="cc-ev-cell">—</div>
                      <div className="cc-ev-cell">
                        <span className={`cc-ev-conf-badge ${verified?'high':'medium'}`}>{verified?'Verified':'Pending'}</span>
                      </div>
                      <div className="cc-ev-cell cc-ev-date-cell">
                        {new Date(doc.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                        {doc.expiry_date && <span className="cc-ev-fresh">Exp: {doc.expiry_date}</span>}
                      </div>
                      <div className="cc-ev-cell">
                        <span className="cc-ev-vis-badge">🔒 Operator</span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        <div className="cc-feed-footer">
          <button className="cc-mkt-filter-btn" style={{marginRight:'auto'}}>↓ Export Evidence Map</button>
          <span>Showing {tabSources.length} sources</span>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">OPEN EVIDENCE GAPS</div>
          {evidenceGaps.map((g, i) => (
            <div key={i} className="cc-ev-gap-row">
              <span className="cc-ev-gap-dot">●</span>
              <div>
                <strong>{g.text}</strong>
                <small>Applies to: {g.applies}</small>
              </div>
            </div>
          ))}
          <Link href="/dashboard?page=evidence" className="cc-right-link">View all gaps →</Link>
        </div>

        {reviewQueue.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">REVIEW QUEUE</div>
            {reviewQueue.map(doc => (
              <div key={doc.id} className="cc-ev-queue-row">
                <span className="cc-ev-queue-dot pending">●</span>
                <div>
                  <strong>{doc.display_name}</strong>
                  <small>{doc.document_type} · Pending review</small>
                </div>
              </div>
            ))}
            <Link href="/admin/regulatory-signals" className="cc-right-link">View review queue →</Link>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">CONFIDENCE METHODOLOGY</div>
          <p className="cc-right-prose">Weighted scoring across source authority, jurisdiction relevance, recency, and consistency.</p>
          <Link href="/source-methodology" className="cc-right-link">View methodology →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">FRESHNESS STATUS</div>
          {[
            { label: 'Up to date', n: upToDate,  pct: Math.round(upToDate/totalFresh*100),  cls:'current'   },
            { label: 'Due soon',   n: dueSoon,   pct: Math.round(dueSoon/totalFresh*100),    cls:'due-soon'  },
            { label: 'Overdue',    n: overdue,   pct: Math.round(overdue/totalFresh*100),    cls:'overdue'   },
          ].map(row => (
            <div key={row.label} className="cc-ev-fresh-row">
              <span className="cc-ev-fresh-label">{row.label}</span>
              <div className="cc-conf-bar-track" style={{flex:1}}>
                <div className="cc-conf-bar-fill" style={{
                  width: `${row.pct}%`,
                  background: row.cls==='current'?'var(--cc-green)':row.cls==='due-soon'?'var(--cc-amber)':'var(--cc-red)',
                }}/>
              </div>
              <span className="cc-conf-bar-pct">{row.n} ({row.pct}%)</span>
            </div>
          ))}
          <Link href="/dashboard?page=evidence" className="cc-right-link">View freshness report →</Link>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">NEXT BEST ACTION</div>
          <p className="cc-right-prose">
            {reviewQueue.length > 0
              ? `Review ${reviewQueue.length} item${reviewQueue.length>1?'s':''} in your evidence queue to raise overall confidence.`
              : `Add verified regulatory sources for ${country.label} to improve evidence coverage.`
            }
          </p>
          <button className="cc-nba-btn full" style={{marginTop:'8px'}}>Go to Review Queue →</button>
        </div>

        {professionals.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">VERIFIED PROFESSIONALS</div>
            {professionals.slice(0, 4).map(p => (
              <div key={p.id} className="cc-ev-gap-row">
                <span className="cc-ev-gap-dot" style={{color:'var(--cc-green)'}}>✓</span>
                <div>
                  <strong>{p.full_name}</strong>
                  <small>{p.title ?? p.credential_type ?? 'Professional'}{p.institution ? ` · ${p.institution}` : ''}</small>
                  {p.accepts_referrals && <small style={{color:'var(--cc-gold)'}}>Accepts referrals</small>}
                </div>
              </div>
            ))}
            <Link href="/intake" className="cc-right-link">Request introduction →</Link>
          </div>
        )}
      </aside>
    </div>
  )
})

// ── Command palette ───────────────────────────────────────────────────────────

type CmdItem = { id: string; group: string; label: string; sub?: string; icon?: string; action: () => void }

function CommandPalette({
  open, onClose, country, role, onPage,
}: {
  open:    boolean
  onClose: () => void
  country: { iso2: string; label: string }
  role:    string
  onPage:  (p: CommandPage) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 40) }
  }, [open])

  const items = useMemo<CmdItem[]>(() => [
    ...NAV_ITEMS_FLAT.map(n => ({
      id: n.id, group: 'Navigation', label: n.label, icon: n.icon,
      action: () => { onPage(n.id); onClose() },
    })),
    { id: 'mkt', group: 'Marketplace', label: 'Browse listings', icon: '⊞',
      action: () => { onPage('marketplace'); onClose() } },
    { id: 'sig', group: 'Intelligence', label: 'Weekly signals', icon: '≋',
      action: () => { onPage('signals'); onClose() } },
  ], [onPage, onClose])

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const lq = q.toLowerCase()
    return items.filter(i => i.label.toLowerCase().includes(lq) || i.group.toLowerCase().includes(lq))
  }, [items, q])

  useEffect(() => setIdx(0), [filtered])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')    { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter')     { filtered[idx]?.action() }
  }

  if (!open) return null

  const groups = [...new Set(filtered.map(i => i.group))]

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <div className="cp-search-row">
          <span className="cp-search-icon">⌘</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search pages, actions…"
            className="cp-input"
          />
          {q && <button className="cp-clear" onClick={() => setQ('')}>×</button>}
        </div>
        <div className="cp-results">
          {groups.map(group => (
            <div key={group}>
              <div className="cp-group-label">{group}</div>
              {filtered.filter(i => i.group === group).map((item, gi) => {
                const globalIdx = filtered.indexOf(item)
                return (
                  <button
                    key={item.id}
                    className={`cp-item${globalIdx === idx ? ' focused' : ''}`}
                    onMouseEnter={() => setIdx(globalIdx)}
                    onClick={item.action}
                  >
                    {item.icon && <span className="cp-item-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.sub && <small>{item.sub}</small>}
                  </button>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && <div className="cp-empty">No results for &ldquo;{q}&rdquo;</div>}
        </div>
        <div className="cp-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="cp-footer-ctx">
            {country.label}{role ? ` · ${ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.short ?? role}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── CustomSelect ──────────────────────────────────────────────────────────────

type SelectOpt = { value: string; label: string }

function CustomSelect({ value, options, placeholder, onChange, className }: {
  value: string; options: SelectOpt[]; placeholder?: string
  onChange: (v: string) => void; className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const label = options.find(o => o.value === value)?.label ?? placeholder ?? 'Select'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={rootRef} className={`cc-select${open ? ' open' : ''}${className ? ` ${className}` : ''}`}>
      <button type="button" className="cc-select-trigger" onClick={() => setOpen(o => !o)} aria-haspopup="listbox">
        <span>{label}</span>
        <span className="cc-select-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="cc-select-dropdown" role="listbox">
          {options.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cc-select-opt${opt.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Genetics page ─────────────────────────────────────────────────────────────

type GeneticsTab = 'passports' | 'services' | 'projects'

const GeneticsPage = React.memo(function GeneticsPage({
  country,
  cultivarPassports = [],
  serviceProviders = [],
  collaborationProjects = [],
}: {
  country: { iso2: string; label: string }
  cultivarPassports?: PublicCultivarPassportDTO[]
  serviceProviders?: PublicServiceProvider[]
  collaborationProjects?: PublicCollaborationProject[]
}) {
  const [tab, setTab] = useState<GeneticsTab>('passports')
  const [requestModal, setRequestModal] = useState<{ open: boolean; profileName?: string }>({ open: false })
  const [programModal, setProgramModal] = useState(false)

  const isGlobal = country.iso2 === 'GLOBAL'
  const filteredPassports = isGlobal ? cultivarPassports : cultivarPassports.filter(p => p.countryOpportunitiesPublic.some(o => o.countryCode === country.iso2))
  const displayPassports = filteredPassports.length > 0 ? filteredPassports : cultivarPassports
  const filteredProviders = isGlobal ? serviceProviders : serviceProviders.filter(sp => sp.country_code === country.iso2)
  const displayProviders = filteredProviders.length > 0 ? filteredProviders : serviceProviders
  const filteredProjects = isGlobal ? collaborationProjects : collaborationProjects.filter(cp => cp.countryCode === country.iso2)
  const displayProjects = filteredProjects.length > 0 ? filteredProjects : collaborationProjects

  const tabs: { id: GeneticsTab; label: string; count: number }[] = [
    { id: 'passports', label: 'Cultivar Passports', count: displayPassports.length },
    { id: 'services',  label: 'Service Providers',  count: displayProviders.length },
    { id: 'projects',  label: 'Collaboration',      count: displayProjects.length },
  ]

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>Genetics Intelligence</h2>
          <p>Public cultivar passports, verified service providers, and open collaboration projects{isGlobal ? '' : ` relevant to ${country.label}`}. Country-specific opportunities and evidence summaries are available per passport.</p>
        </div>

        <div className="cc-mkt-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`cc-mkt-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.count > 0 && <span className="cc-tab-badge">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'passports' && (
          displayPassports.length === 0 ? (
            <div className="cc-empty-state" style={{ flex: 1 }}>
              <span>⊕</span>
              <p>No public cultivar passports yet.</p>
              <small style={{ fontSize: '11px', color: 'var(--cc-dim)' }}>Passports publish when source-backed review is complete.</small>
            </div>
          ) : (
            <div className="cc-sig-feed">
              <div className="cc-sig-group">
                {displayPassports.map(p => {
                  const countryOpps = isGlobal ? [] : p.countryOpportunitiesPublic.filter(o => o.countryCode === country.iso2)
                  return (
                    <div key={p.id} className="cc-sig-row">
                      <div className="cc-sig-dot medium" />
                      <div className="cc-sig-body">
                        <strong>{p.displayName}</strong>
                        <small>{p.publicSummary}</small>
                      </div>
                      <div className="cc-sig-acts">
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span className="cc-opp-tag">{p.cultivarCategory.replace(/_/g, ' ')}</span>
                          {p.cannabisCategory && <span className="cc-opp-tag">{p.cannabisCategory.replace(/_/g, ' ')}</span>}
                          <span className="cc-opp-tag">{p.claimStatus.replace(/_/g, ' ')}</span>
                          {isGlobal && p.countryOpportunitiesPublic.length > 0 && <span className="cc-opp-tag">{p.countryOpportunitiesPublic.length} opportunities</span>}
                        </div>
                        {countryOpps.map((opp, i) => (
                          <div key={i} style={{ fontSize: '10px', color: 'var(--cc-muted)', margin: '2px 0', lineHeight: 1.4 }}>
                            <span style={{ color: 'var(--cc-text)', fontWeight: 600 }}>{opp.opportunityType.replace(/_/g, ' ')}</span>
                            {' · '}{opp.status}
                            {opp.publicNote && <span> — {opp.publicNote}</span>}
                          </div>
                        ))}
                        {countryOpps.length > 0 ? (
                          <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true, profileName: p.displayName })}>{countryOpps[0].cta} →</button>
                        ) : (
                          <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true, profileName: p.displayName })}>Request access →</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}

        {tab === 'services' && (
          displayProviders.length === 0 ? (
            <div className="cc-empty-state" style={{ flex: 1 }}>
              <span>◫</span>
              <p>No verified service providers listed yet.</p>
            </div>
          ) : (
            <div className="cc-sig-feed">
              <div className="cc-sig-group">
                {displayProviders.map(sp => (
                  <div key={sp.id} className="cc-sig-row">
                    <div className="cc-sig-dot low" />
                    <div className="cc-sig-body">
                      <strong>{sp.displayName}</strong>
                      <small>{sp.service_summary}</small>
                    </div>
                    <div className="cc-sig-acts">
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span className="cc-opp-tag">{sp.service_category.replace(/_/g, ' ')}</span>
                        <span className="cc-opp-tag">{sp.verification_level.replace(/_/g, ' ')}</span>
                        {sp.country_code && <span className="cc-opp-tag">{sp.country_code}</span>}
                      </div>
                      <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true })}>Request verification →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {tab === 'projects' && (
          displayProjects.length === 0 ? (
            <div className="cc-empty-state" style={{ flex: 1 }}>
              <span>⊗</span>
              <p>No open collaboration projects at this time.</p>
            </div>
          ) : (
            <div className="cc-sig-feed">
              <div className="cc-sig-group">
                {displayProjects.map(cp => (
                  <div key={cp.id} className="cc-sig-row">
                    <div className="cc-sig-dot medium" />
                    <div className="cc-sig-body">
                      <strong>{cp.title}</strong>
                      <small>{cp.publicSummary}</small>
                    </div>
                    <div className="cc-sig-acts">
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span className="cc-opp-tag">{cp.projectType.replace(/_/g, ' ')}</span>
                        <span className="cc-opp-tag">{cp.status.replace(/_/g, ' ')}</span>
                        {cp.countryCode && <span className="cc-opp-tag">{cp.countryCode}</span>}
                      </div>
                      <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true })}>{cp.cta} →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">GENETICS OVERVIEW</div>
          <div className="cc-jx-fields">
            {[
              { icon: '⊕', label: 'Cultivar Passports',    value: String(displayPassports.length) },
              { icon: '◫', label: 'Service Providers',     value: String(displayProviders.length) },
              { icon: '⊗', label: 'Collaboration Projects', value: String(displayProjects.length) },
            ].map(f => (
              <div key={f.label} className="cc-jx-field">
                <span className="cc-jx-field-icon">{f.icon}</span>
                <div><small>{f.label}</small><strong>{f.value}</strong></div>
              </div>
            ))}
          </div>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">ACCESS &amp; LICENSING</div>
          <p className="cc-right-prose">Cultivar data is subject to IP, PVP, and licensing controls. Harbourview passports are public-safe summaries only. Full evidence and commercial terms require an access request.</p>
          <button className="cc-right-link" onClick={() => setRequestModal({ open: true })}>Request genetics access →</button>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">GENETICS PROGRAMS</div>
          <p className="cc-right-prose">Breeders, seed companies, and tissue-culture laboratories can submit programs for controlled Harbourview visibility.</p>
          <button className="cc-right-link" onClick={() => setProgramModal(true)}>Submit a program →</button>
        </div>
      </aside>

      <GeneticsRequestModal
        open={requestModal.open}
        profileName={requestModal.profileName}
        onClose={() => setRequestModal({ open: false })}
      />
      <GeneticsProgramModal
        open={programModal}
        onClose={() => setProgramModal(false)}
      />
    </div>
  )
})

// ── Compliance page ───────────────────────────────────────────────────────────

const CompliancePage = React.memo(function CompliancePage({
  country,
  countryIntel,
  jurisdictionPlaybook,
}: {
  country: { iso2: string; label: string }
  countryIntel?: CountryIntelProfile | null
  jurisdictionPlaybook?: JurisdictionPlaybook | null
}) {
  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>Global Compliance Intelligence</h2>
          <p>Regional compliance frameworks, documentation controls, and commercial pathway summaries for regulated cannabis markets. Specialist review required before commercial reliance.</p>
        </div>

        {countryIntel && (
          <div className="cc-sig-feed" style={{ marginBottom: 0 }}>
            <div className="cc-sig-group">
              <div className="cc-sig-group-hd">
                <span>{country.label} — Current Jurisdiction Status</span>
                {countryIntel.briefing_last_reviewed && (() => { const [y, m] = countryIntel.briefing_last_reviewed.split('-'); const d = new Date(+y, +m - 1); return isNaN(d.getTime()) ? null : <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.6 }}>Reviewed {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span> })()}
              </div>
              <div className="cc-sig-row">
                <div className="cc-sig-dot medium" />
                <div className="cc-sig-body">
                  <strong>{countryIntel.briefing_regulatory_body ?? countryIntel.regulator_label ?? 'Regulatory Authority'}</strong>
                  <small>{countryIntel.briefing_regulatory_outlook ?? countryIntel.public_summary ?? 'Regulatory outlook under Harbourview review.'}</small>
                </div>
                <div className="cc-sig-acts">
                  {([
                    { label: 'Medical', value: countryIntel.medical_status },
                    { label: 'Adult-use', value: countryIntel.adult_use_status },
                    { label: 'Import', value: countryIntel.import_status },
                    { label: 'Export', value: countryIntel.export_status },
                  ] as { label: string; value: string | null | undefined }[]).filter(f => f.value).map(f => (
                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--cc-muted)', margin: '1px 0' }}>
                      <span>{f.label}</span><span style={{ color: 'var(--cc-text)' }}>{f.value}</span>
                    </div>
                  ))}
                  {jurisdictionPlaybook?.typical_timeline_months && (
                    <div style={{ fontSize: '10px', color: 'var(--cc-muted)', marginTop: 4 }}>Est. timeline: {jurisdictionPlaybook.typical_timeline_months} months</div>
                  )}
                </div>
              </div>
              {countryIntel.trade_roles && countryIntel.trade_roles.length > 0 && (
                <div className="cc-jx-field" style={{ marginTop: 8 }}>
                  <span className="cc-jx-field-icon">◈</span>
                  <div>
                    <small>Trade roles</small>
                    <strong>{countryIntel.trade_roles.map(r => r.replace(/_/g, ' ')).join(' · ')}</strong>
                  </div>
                </div>
              )}
              {([
                { label: 'Program status', value: countryIntel.briefing_program_status },
                { label: 'Market dynamics', value: countryIntel.briefing_market_dynamics },
                { label: 'Patient access', value: countryIntel.briefing_patient_access },
                { label: 'Physician access', value: countryIntel.briefing_physician_access },
              ] as { label: string; value: string | null | undefined }[]).filter(f => f.value).map(f => (
                <div key={f.label} className="cc-sig-row">
                  <div className="cc-sig-dot low" />
                  <div className="cc-sig-body">
                    <strong>{f.label}</strong>
                    <small>{f.value}</small>
                  </div>
                </div>
              ))}
            </div>
            {jurisdictionPlaybook?.steps && jurisdictionPlaybook.steps.length > 0 && (
              <div className="cc-sig-group">
                <div className="cc-sig-group-hd"><span>Market Entry Steps</span><span>{jurisdictionPlaybook.steps.length}</span></div>
                {jurisdictionPlaybook.steps.slice(0, 5).map(s => (
                  <div key={s.step} className="cc-sig-row">
                    <div className="cc-sig-dot low" />
                    <div className="cc-sig-body">
                      <strong>{s.step}. {s.title}</strong>
                      <small>{s.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {jurisdictionPlaybook?.key_regulators && jurisdictionPlaybook.key_regulators.length > 0 && (
              <div className="cc-sig-group">
                <div className="cc-sig-group-hd"><span>Key Regulators</span></div>
                {jurisdictionPlaybook.key_regulators.map(r => (
                  <div key={r.name} className="cc-sig-row">
                    <div className="cc-sig-dot low" />
                    <div className="cc-sig-body">
                      <strong>{r.name}</strong>
                      <small>{r.role}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {jurisdictionPlaybook?.common_pitfalls && jurisdictionPlaybook.common_pitfalls.length > 0 && (
              <div className="cc-sig-group">
                <div className="cc-sig-group-hd"><span>Common Pitfalls</span></div>
                {jurisdictionPlaybook.common_pitfalls.map((pitfall, i) => (
                  <div key={i} className="cc-sig-row">
                    <div className="cc-sig-dot medium" />
                    <div className="cc-sig-body">
                      <small>{pitfall}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="cc-sig-feed">
          <div className="cc-sig-group">
            {complianceRegions.map(region => (
              <div key={region.slug} className="cc-sig-row">
                <div className="cc-sig-dot low" />
                <div className="cc-sig-body">
                  <strong>{region.name}</strong>
                  <small>{region.summary}</small>
                </div>
                <div className="cc-sig-acts">
                  <p style={{ fontSize: '10px', color: 'var(--cc-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>{region.commercialFocus}</p>
                  <Link href="/contact" className="cc-sig-brief">Request compliance review →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="cc-two-right">
        {countryIntel?.opportunity_score != null && (
          <div className="cc-right-section">
            <div className="cc-right-head">{country.label.toUpperCase()} OVERVIEW</div>
            <div className="cc-jx-fields">
              <div className="cc-jx-field">
                <span className="cc-jx-field-icon">◎</span>
                <div><small>Opportunity score</small><strong>{countryIntel.opportunity_score}/10</strong></div>
              </div>
              {countryIntel.regulatory_tier && (
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">◫</span>
                  <div><small>Regulatory tier</small><strong>{countryIntel.regulatory_tier}</strong></div>
                </div>
              )}
              {jurisdictionPlaybook?.difficulty && (
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">⊗</span>
                  <div><small>Entry difficulty</small><strong>{jurisdictionPlaybook.difficulty}</strong></div>
                </div>
              )}
              {jurisdictionPlaybook?.estimated_cost_range && (
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">≋</span>
                  <div><small>Est. cost range</small><strong>{jurisdictionPlaybook.estimated_cost_range}</strong></div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="cc-right-section">
          <div className="cc-right-head">COMPLIANCE REGIONS</div>
          <div className="cc-jx-fields">
            {complianceRegions.map(r => (
              <div key={r.slug} className="cc-jx-field">
                <span className="cc-jx-field-icon">◫</span>
                <div><small>{r.name}</small><strong>Coverage active</strong></div>
              </div>
            ))}
          </div>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">CURRENT JURISDICTION</div>
          <p className="cc-right-prose">{country.label} — compliance data for this jurisdiction is subject to source review. Contact Harbourview for a specialist-reviewed access pathway.</p>
          <Link href="/contact" className="cc-right-link">Get compliance support →</Link>
        </div>
      </aside>
    </div>
  )
})

// ── Countries directory page ──────────────────────────────────────────────────

const CountriesDirectoryPage = React.memo(function CountriesDirectoryPage({
  signals,
  onCountrySelect,
}: {
  signals: DashboardSignal[]
  onCountrySelect?: (iso2: string) => void
}) {
  const [search, setSearch] = useState('')

  const signalCountByIso2 = useMemo(() => {
    const nameToIso2 = new Map(ALL_COUNTRIES.map(c => [c.displayName.toLowerCase(), c.iso2]))
    const counts: Record<string, number> = {}
    for (const s of signals) {
      if (!s.market) continue
      const iso2 = nameToIso2.get(s.market.toLowerCase())
      if (iso2) counts[iso2] = (counts[iso2] ?? 0) + 1
    }
    return counts
  }, [signals])

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES
    const q = search.toLowerCase()
    return ALL_COUNTRIES.filter(c => c.displayName.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q))
  }, [search])

  const byRegion = useMemo(() => {
    const map = new Map<string, typeof ALL_COUNTRIES>()
    for (const c of filtered) {
      const key = c.region ?? 'Other'
      map.set(key, [...(map.get(key) ?? []), c])
    }
    return map
  }, [filtered])

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>Country &amp; Territory Directory</h2>
          <p>All {ALL_COUNTRIES.length} Harbourview countries and territories. Click any entry to load its jurisdiction data into the Command Centre.</p>
        </div>

        <div style={{ padding: '0 24px 12px' }}>
          <input
            className="cc-search-input"
            type="text"
            placeholder="Search countries…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="cc-empty-state" style={{ flex: 1 }}>
            <span>⊗</span>
            <p>No countries match &ldquo;{search}&rdquo;.</p>
          </div>
        ) : (
          <div className="cc-sig-feed">
            {[...byRegion.entries()].map(([region, countries]) => (
              <div key={region} className="cc-sig-group">
                <div className="cc-sig-group-hd">
                  <span>{region}</span>
                  <span>{countries.length}</span>
                </div>
                {countries.map(c => {
                  const sigCount = signalCountByIso2[c.iso2] ?? 0
                  return (
                    <div
                      key={c.iso2}
                      className="cc-sig-row"
                      style={{ cursor: onCountrySelect ? 'pointer' : 'default' }}
                      onClick={() => onCountrySelect?.(c.iso2)}
                    >
                      <div className="cc-sig-dot" style={{ background: sigCount > 0 ? 'var(--cc-gold)' : undefined }} />
                      <div className="cc-sig-body">
                        <strong>{flagEmoji(c.iso2)} {c.displayName}</strong>
                        <small>{c.iso2}{sigCount > 0 ? ` · ${sigCount} signal${sigCount > 1 ? 's' : ''}` : ''}</small>
                      </div>
                      <div className="cc-sig-acts">
                        <Link
                          href={`/country/${c.iso2.toLowerCase()}/role/importer`}
                          className="cc-sig-brief"
                          onClick={e => e.stopPropagation()}
                        >Profile →</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">DIRECTORY STATS</div>
          <div className="cc-jx-fields">
            {[
              { icon: '⊗', label: 'Total Countries',      value: String(ALL_COUNTRIES.length) },
              { icon: '≋', label: 'With Active Signals',  value: String(Object.keys(signalCountByIso2).length) },
            ].map(f => (
              <div key={f.label} className="cc-jx-field">
                <span className="cc-jx-field-icon">{f.icon}</span>
                <div><small>{f.label}</small><strong>{f.value}</strong></div>
              </div>
            ))}
          </div>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">CLICK TO EXPLORE</div>
          <p className="cc-right-prose">Select any country to load its briefing, market data, and access pathway into the Command Centre panels.</p>
          <Link href="/dashboard?page=countries" className="cc-right-link">Full country directory →</Link>
        </div>
      </aside>
    </div>
  )
})

// ── Documents page ────────────────────────────────────────────────────────────

type DocTemplate = {
  id:       string
  title:    string
  desc:     string
  category: string
  tags:     string[]
  pages?:   number
  format:   string
}

const DOC_TEMPLATES: DocTemplate[] = [
  // Import / Export
  { id: 'ie-1', category: 'Import / Export', format: 'DOCX', pages: 4, tags: ['import','permit','application'],
    title: 'Import Permit Application Template',
    desc:  'Standardised narrative sections for national import permit applications covering product specs, importer credentials, intended use, and storage conditions.' },
  { id: 'ie-2', category: 'Import / Export', format: 'DOCX', pages: 3, tags: ['phytosanitary','certificate','plant health'],
    title: 'Phytosanitary Certificate Requirements Checklist',
    desc:  'Country-by-country checklist of phytosanitary certificate requirements, endorsement language, and inspection schedules for cannabis/hemp shipments.' },
  { id: 'ie-3', category: 'Import / Export', format: 'XLSX', pages: 2, tags: ['COA','certificate of analysis','specification'],
    title: 'Certificate of Analysis (COA) Specification Template',
    desc:  'Standardised COA template covering cannabinoid profile, residual solvents, microbials, heavy metals, pesticides, and moisture — aligned to EU GMP Annex 1 requirements.' },
  { id: 'ie-4', category: 'Import / Export', format: 'PDF', pages: 2, tags: ['bill of lading','shipping','documentation'],
    title: 'Cannabis Shipment Documentation Checklist',
    desc:  'Master checklist of all documentation required for a cross-border cannabis shipment: import/export permits, COA, phytosanitary cert, bill of lading, commercial invoice, packing list.' },
  { id: 'ie-5', category: 'Import / Export', format: 'DOCX', pages: 5, tags: ['export','permit','application'],
    title: 'Export Permit Application Framework',
    desc:  'Structured framework for export permit applications including product schedule, consignee attestation, end-use declarations, and authority notification requirements.' },
  { id: 'ie-6', category: 'Import / Export', format: 'DOCX', pages: 3, tags: ['DEA','S1','controlled substance','import'],
    title: 'Controlled Substance Import Declaration (DEA Form 357)',
    desc:  'Annotated template and completion guide for US DEA Form 357 import declarations for Schedule I/II cannabis-derived substances.' },

  // Compliance & Licensing
  { id: 'cl-1', category: 'Compliance & Licensing', format: 'DOCX', pages: 2, tags: ['GMP','declaration','EU','quality'],
    title: 'EU GMP Declaration of Conformance Template',
    desc:  'Declaration template confirming compliance with EU GMP Annex requirements for cannabis APIs, including batch release signatory fields.' },
  { id: 'cl-2', category: 'Compliance & Licensing', format: 'DOCX', pages: 8, tags: ['quality','agreement','contract','supplier'],
    title: 'Quality Agreement Template (Supplier / Manufacturer)',
    desc:  'Bilateral quality agreement covering responsibilities, batch release criteria, change control, deviations, recall procedures, and audit rights — aligned to ICH Q10.' },
  { id: 'cl-3', category: 'Compliance & Licensing', format: 'XLSX', pages: 4, tags: ['facility','audit','GMP','inspection'],
    title: 'Facility GMP Audit Checklist',
    desc:  'Pre-audit self-assessment checklist covering premises, personnel, documentation, production, QC, storage and distribution — maps to EU GMP chapters and WHO guidelines.' },
  { id: 'cl-4', category: 'Compliance & Licensing', format: 'DOCX', pages: 3, tags: ['licence','application','cover letter','regulatory'],
    title: 'Licence Application Cover Letter Template',
    desc:  'Professional cover letter template for national cannabis licence applications, including applicant background narrative, regulatory compliance history, and competency statements.' },
  { id: 'cl-5', category: 'Compliance & Licensing', format: 'DOCX', pages: 6, tags: ['SOP','standard operating procedure','GMP'],
    title: 'Standard Operating Procedure (SOP) Framework',
    desc:  'Skeleton SOP framework with header, purpose, scope, definitions, procedure, responsibilities, and revision history sections — ready for facility-specific population.' },
  { id: 'cl-6', category: 'Compliance & Licensing', format: 'DOCX', pages: 3, tags: ['GACP','cultivation','good agricultural'],
    title: 'GACP Cultivation Compliance Declaration',
    desc:  'Declaration template attesting to Good Agricultural and Collection Practices (GACP) compliance for cannabis cultivation sites, aligned to WHO/EMEA guidelines.' },

  // Commercial
  { id: 'cm-1', category: 'Commercial', format: 'DOCX', pages: 2, tags: ['LOI','letter of intent','supply'],
    title: 'Letter of Intent (LOI) — Cannabis Supply',
    desc:  'Non-binding LOI template for cannabis supply arrangements covering product specs, indicative volumes, pricing basis, exclusivity, and next-step milestones.' },
  { id: 'cm-2', category: 'Commercial', format: 'DOCX', pages: 4, tags: ['term sheet','supply','commercial'],
    title: 'Supply Agreement Term Sheet',
    desc:  'Commercial term sheet for cannabis supply agreements: product definition, volume commitments, pricing mechanism (fixed/indexed), delivery terms (Incoterms), and key conditions precedent.' },
  { id: 'cm-3', category: 'Commercial', format: 'DOCX', pages: 3, tags: ['NDA','confidentiality','cannabis'],
    title: 'Cannabis Industry NDA Template',
    desc:  'Mutual NDA template tailored for cannabis industry contexts — covers proprietary regulatory strategies, strain IP, client lists, pricing, and cultivation/extraction methods.' },
  { id: 'cm-4', category: 'Commercial', format: 'DOCX', pages: 12, tags: ['supply','agreement','framework','long-form'],
    title: 'Supply Agreement Framework (Long-Form)',
    desc:  'Comprehensive supply agreement framework with boilerplate covering product specifications, quality obligations, regulatory compliance warranties, force majeure, and dispute resolution.' },
  { id: 'cm-5', category: 'Commercial', format: 'DOCX', pages: 3, tags: ['distribution','agreement','wholesale'],
    title: 'Distribution Agreement Term Sheet',
    desc:  'Term sheet for cannabis distribution arrangements covering territory, exclusivity, minimum purchase obligations, pricing, marketing, and termination provisions.' },
  { id: 'cm-6', category: 'Commercial', format: 'DOCX', pages: 2, tags: ['invoice','commercial','customs'],
    title: 'Commercial Invoice Template (Cross-Border)',
    desc:  'Compliant commercial invoice template for cross-border cannabis transactions including HS codes, country of origin, Incoterms declaration, and controlled substance descriptions.' },

  // Due Diligence
  { id: 'dd-1', category: 'Due Diligence', format: 'XLSX', pages: 3, tags: ['KYC','counterparty','verification'],
    title: 'Counterparty KYC Checklist',
    desc:  'Know-Your-Counterparty checklist covering entity verification, beneficial ownership, licence validation, sanctions screening, and financial crime red flags for cannabis operators.' },
  { id: 'dd-2', category: 'Due Diligence', format: 'XLSX', pages: 2, tags: ['operator','verification','licence'],
    title: 'Operator Verification Checklist',
    desc:  'Step-by-step checklist for verifying a cannabis operator\'s licence status, facility approvals, GMP certificates, and regulatory standing across key jurisdictions.' },
  { id: 'dd-3', category: 'Due Diligence', format: 'XLSX', pages: 2, tags: ['COA','lab','verification','testing'],
    title: 'Lab COA Verification Checklist',
    desc:  'Checklist for verifying cannabis certificate of analysis authenticity: lab accreditation status, chain of custody, test method references, and result plausibility checks.' },
  { id: 'dd-4', category: 'Due Diligence', format: 'DOCX', pages: 5, tags: ['M&A','acquisition','due diligence','cannabis'],
    title: 'M&A Due Diligence Request List — Cannabis',
    desc:  'Structured due diligence request list for cannabis company acquisitions covering corporate structure, licences, regulatory history, key contracts, IP, financials, and litigation.' },
]

const DOC_CATEGORIES = ['Import / Export', 'Compliance & Licensing', 'Commercial', 'Due Diligence'] as const

const DOC_CATEGORY_META: Record<string, { icon: string; desc: string }> = {
  'Import / Export':       { icon: '↔', desc: 'Permits, certificates, shipping documentation' },
  'Compliance & Licensing': { icon: '◫', desc: 'GMP, GACP, audit tools, licence applications' },
  'Commercial':            { icon: '⊞', desc: 'NDAs, term sheets, supply agreements, invoices' },
  'Due Diligence':         { icon: '◉', desc: 'KYC, operator verification, M&A checklists' },
}

const DOC_FORMAT_COLOR: Record<string, string> = {
  DOCX: 'rgba(91,155,213,.9)',
  XLSX: 'rgba(76,175,82,.9)',
  PDF:  'rgba(212,168,75,.9)',
}

const DocumentsPage = React.memo(function DocumentsPage({
  country, role,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
}) {
  const [search,      setSearch]      = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [requested,   setRequested]   = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return DOC_TEMPLATES.filter(d => {
      const catMatch = activeCategory === 'all' || d.category === activeCategory
      if (!catMatch) return false
      if (!q) return true
      return d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.tags.some(t => t.includes(q))
    })
  }, [search, activeCategory])

  const handleRequest = (id: string) => {
    setRequested(prev => new Set([...prev, id]))
  }

  const countByCategory = useMemo(() => {
    const m: Record<string, number> = { all: DOC_TEMPLATES.length }
    for (const t of DOC_TEMPLATES) m[t.category] = (m[t.category] ?? 0) + 1
    return m
  }, [])

  return (
    <div className="cc-page cc-two-col-page">
      <style>{DOC_CSS}</style>
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>Document Template Library</h2>
          <p>
            {DOC_TEMPLATES.length} professional templates for cannabis import/export, compliance, commercial, and due diligence workflows.
            {country.label !== 'Global' ? ` Contextualised for ${country.label}.` : ''}
            {role ? ` · ${role}` : ''}
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="doc-toolbar">
          <input
            className="cc-search-input"
            type="text"
            placeholder="Search templates by title, keyword, or tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        {/* Category filter tabs */}
        <div className="doc-cat-tabs">
          <button
            className={`doc-cat-tab${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All <span className="cc-tab-badge">{countByCategory.all}</span>
          </button>
          {DOC_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`doc-cat-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {DOC_CATEGORY_META[cat].icon} {cat.split('/')[0].trim()}
              <span className="cc-tab-badge">{countByCategory[cat] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Template grid */}
        {filtered.length === 0 ? (
          <div className="cc-empty-state">
            <span>⊡</span>
            <p>No templates match your search. Try a different keyword.</p>
          </div>
        ) : (
          <div className="doc-grid">
            {filtered.map(doc => {
              const isRequested = requested.has(doc.id)
              return (
                <div key={doc.id} className="doc-card">
                  <div className="doc-card-top">
                    <div className="doc-card-meta">
                      <span className="doc-format-badge" style={{ background: DOC_FORMAT_COLOR[doc.format] ?? 'rgba(255,255,255,.15)' }}>
                        {doc.format}
                      </span>
                      {doc.pages && <span className="doc-pages">{doc.pages}p</span>}
                      <span className="doc-category-label">{doc.category}</span>
                    </div>
                    <h4 className="doc-card-title">{doc.title}</h4>
                    <p className="doc-card-desc">{doc.desc}</p>
                    <div className="doc-tags">
                      {doc.tags.slice(0, 4).map(t => (
                        <span key={t} className="doc-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    className={`doc-request-btn${isRequested ? ' requested' : ''}`}
                    onClick={() => handleRequest(doc.id)}
                    disabled={isRequested}
                  >
                    {isRequested ? '✓ Template requested' : 'Request template →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ fontSize: '10px', color: 'rgba(245,240,232,.2)', padding: '8px 24px 20px', textAlign: 'center' }}>
          Templates are professional frameworks — review with qualified legal/regulatory counsel before use in your jurisdiction.
        </p>
      </div>

      {/* Right sidebar */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">TEMPLATE CATEGORIES</div>
          {DOC_CATEGORIES.map(cat => (
            <div key={cat} className="doc-cat-summary" onClick={() => setActiveCategory(cat)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px', color: '#d4a84b' }}>{DOC_CATEGORY_META[cat].icon}</span>
                <span style={{ fontSize: '11px', color: '#f5f0e8', fontWeight: 500 }}>{cat}</span>
                <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.4)', marginLeft: 'auto' }}>{countByCategory[cat] ?? 0}</span>
              </div>
              <p style={{ fontSize: '10px', color: 'rgba(245,240,232,.4)', margin: '0 0 10px 22px', lineHeight: 1.4 }}>
                {DOC_CATEGORY_META[cat].desc}
              </p>
            </div>
          ))}
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">CUSTOM TEMPLATES</div>
          <p className="cc-right-prose">
            Need a jurisdiction-specific or role-specific document template? Harbourview can produce custom compliance documents tailored to {country.label} requirements.
          </p>
          <button className="cc-nba-btn" style={{ marginTop: '8px', width: '100%' }}>
            Request custom template →
          </button>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">AI ASSISTANT</div>
          <p className="cc-right-prose">
            Use the Compliance Intelligence Assistant to draft bespoke compliance narratives, permit application language, or regulatory correspondence for {country.label}.
          </p>
        </div>
      </aside>
    </div>
  )
})

const DOC_CSS = `
.doc-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px 12px;
}
.doc-cat-tabs {
  display: flex;
  gap: 6px;
  padding: 0 24px 16px;
  flex-wrap: wrap;
}
.doc-cat-tab {
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.09);
  color: rgba(245,240,232,.55);
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.doc-cat-tab:hover { background: rgba(255,255,255,.09); color: #f5f0e8; }
.doc-cat-tab.active {
  background: rgba(212,168,75,.12);
  border-color: rgba(212,168,75,.35);
  color: #d4a84b;
}
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 0 24px 24px;
}
.doc-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  transition: border-color .12s, background .12s;
}
.doc-card:hover { background: rgba(255,255,255,.05); border-color: rgba(212,168,75,.2); }
.doc-card-top { display: flex; flex-direction: column; gap: 8px; }
.doc-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.doc-format-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .08em;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0d1117;
}
.doc-pages {
  font-size: 10px;
  color: rgba(245,240,232,.35);
}
.doc-category-label {
  font-size: 9px;
  color: rgba(245,240,232,.3);
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-left: auto;
}
.doc-card-title {
  font-family: 'Georgia', serif;
  font-size: 13px;
  font-weight: 400;
  color: #f5f0e8;
  margin: 0;
  line-height: 1.4;
}
.doc-card-desc {
  font-size: 11px;
  color: rgba(245,240,232,.5);
  line-height: 1.55;
  margin: 0;
}
.doc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.doc-tag {
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  color: rgba(245,240,232,.4);
  letter-spacing: .03em;
}
.doc-request-btn {
  font-size: 11px;
  padding: 8px 14px;
  border-radius: 7px;
  background: rgba(212,168,75,.1);
  border: 1px solid rgba(212,168,75,.25);
  color: #d4a84b;
  cursor: pointer;
  transition: background .12s, border-color .12s, color .12s;
  text-align: left;
  width: 100%;
}
.doc-request-btn:hover:not(:disabled) { background: rgba(212,168,75,.18); border-color: rgba(212,168,75,.4); }
.doc-request-btn.requested {
  background: rgba(76,175,82,.08);
  border-color: rgba(76,175,82,.25);
  color: #4caf82;
  cursor: default;
}
.doc-cat-summary { border-bottom: 1px solid rgba(255,255,255,.05); padding-bottom: 2px; }
.doc-cat-summary:last-child { border-bottom: none; }
`

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandCentre({
  signals,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  initialPage,
  wantedCount = 0,
  marketplaceRows,
  pipeline,
  wantedListings = [],
  countryIntel,
  pathwayData,
  watchlistData,
  evidenceData,
  localIntel,
  liveTiles,
  recentEduModules,
  sourceCoverage,
  jurisdictionPlaybook,
  educationTracks = [],
  marketMetrics = [],
  tradeFlows = [],
  professionals = [],
  cannabisOperators = [],
  userEmail,
  cultivarPassports = [],
  serviceProviders = [],
  collaborationProjects = [],
}: Props) {
  const router = useRouter()

  // ── State ──────────────────────────────────────────────────────────────────
  const initialCountry = useMemo(() => {
    const found = COUNTRIES.find(c => c.iso2 === initialCountryIso2)
    return found ?? { iso2: 'GLOBAL', label: 'Global Market' }
  }, [initialCountryIso2])

  // ── Live auth user — header chip initials & display name ───────────────────
  const userInitials = useMemo(() => {
    if (!userEmail) return 'HV'
    const namePart = userEmail.split('@')[0]
    const parts = namePart.split(/[._-]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return namePart.slice(0, 2).toUpperCase()
  }, [userEmail])

  const userDisplayName = useMemo(() => {
    if (!userEmail) return 'Account'
    const namePart = userEmail.split('@')[0]
    const parts = namePart.split(/[._-]+/).filter(Boolean)
    if (parts.length >= 2) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    }
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
  }, [userEmail])

  const [country,      setCountry]     = useState(initialCountry)
  const [region,       setRegion]      = useState('')
  const [role,         setRole]        = useState(initialRoleId ?? '')
  const [activePage,   setActivePage]  = useState<CommandPage>(initialPage ?? 'briefing')
  const [paletteOpen,  setPaletteOpen] = useState(false)

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const countryOptions = useMemo<SelectOpt[]>(() => COUNTRIES.map(c => ({ value: c.iso2, label: c.label })), [])
  const roleOptions    = useMemo<SelectOpt[]>(() =>
    Object.entries(ROLE_PROFILES).map(([k, v]) => ({ value: k, label: v.label })),
    [],
  )
  const roleLabel = useMemo(() =>
    role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.short ?? role) : '',
    [role],
  )
  const pageTitle = useMemo(() => NAV_ITEMS_FLAT.find(n => n.id === activePage)?.label ?? 'Command Centre', [activePage])

  // ── Handlers ───────────────────────────────────────────────────────────────
  // Shared URL-sync helper — keeps country/role/page in the query string so any
  // Command Centre view can be deep-linked from a redirect or a shared link.
  const syncUrl = useCallback((next: { countryIso2: string; roleId: string; page: CommandPage }) => {
    const params = new URLSearchParams()
    if (next.countryIso2 !== 'GLOBAL') params.set('country', next.countryIso2)
    if (next.roleId) params.set('role', next.roleId)
    if (next.page !== 'briefing') params.set('page', next.page)
    const qs = params.toString()
    router.replace(qs ? `/dashboard?${qs}` : '/dashboard', { scroll: false })
  }, [router])

  const handleCountryChange = useCallback((iso2: string) => {
    const found = COUNTRIES.find(c => c.iso2 === iso2)
    if (!found) return
    setCountry(found)
    setRegion('')
    syncUrl({ countryIso2: iso2, roleId: role, page: activePage })
  }, [role, activePage, syncUrl])

  const handleRoleChange = useCallback((roleId: string) => {
    setRole(roleId)
    syncUrl({ countryIso2: country.iso2, roleId, page: activePage })
  }, [country.iso2, activePage, syncUrl])

  const handlePageChange = useCallback((page: CommandPage) => {
    setActivePage(page)
    syncUrl({ countryIso2: country.iso2, roleId: role, page })
  }, [country.iso2, role, syncUrl])

  // ── Page renderer ──────────────────────────────────────────────────────────
  const renderPage = () => {
    const sharedProps = { country, region, role: roleLabel }
    switch (activePage) {
      case 'briefing':
        return <BriefingRoom country={country} region={region} countryIntel={countryIntel} signals={signals} marketMetrics={marketMetrics} tradeFlows={tradeFlows} onCountrySelect={handleCountryChange} />
      case 'access-pathway':
        return <AccessPathwayPage country={country} region={region} role={roleLabel} signals={signals} pathwayData={pathwayData} countryIntel={countryIntel} jurisdictionPlaybook={jurisdictionPlaybook} />
      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} pathwayData={pathwayData} cannabisOperators={cannabisOperators} pipeline={pipeline} onPageChange={handlePageChange} />
      case 'evidence':
        return <EvidenceSourcesPage country={country} region={region} role={roleLabel} evidenceData={evidenceData} pathwayData={pathwayData} professionals={professionals} />
      case 'education':
        return <EducationPage country={country} region={region} role={roleLabel} eduCategories={eduCategories} liveTiles={liveTiles} recentEduModules={recentEduModules} signals={signals} pathwayData={pathwayData} educationTracks={educationTracks} onPageChange={handlePageChange} />
      case 'regulatory':
        return <RegulatoryWatchPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} sourceCoverage={sourceCoverage} />
      case 'local-intel':
        return <LocalIntelPage country={country} region={region} role={roleLabel} signals={signals} countryIntel={countryIntel} localIntel={localIntel} />
      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} />
      case 'watchlist':
        return <WatchlistPage country={country} region={region} role={roleLabel} watchlistData={watchlistData} />
      case 'settings':
        return <SettingsPage country={country} region={region} role={role} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={handleCountryChange} onRoleChange={handleRoleChange} />
      case 'genetics':
        return <GeneticsPage country={country} cultivarPassports={cultivarPassports} serviceProviders={serviceProviders} collaborationProjects={collaborationProjects} />
      case 'compliance':
        return <CompliancePage country={country} countryIntel={countryIntel} jurisdictionPlaybook={jurisdictionPlaybook} />
      case 'countries':
        return <CountriesDirectoryPage signals={signals} onCountrySelect={handleCountryChange} />
      case 'assistant':
        return <AssistantPage country={country} region={region} role={roleLabel} />
      case 'documents':
        return <DocumentsPage country={country} region={region} role={roleLabel} />
      default:
        return null
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cc-app">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="cc-header">
        <div className="cc-header-left">
          <div className="cc-wordmark">
            <span className="cc-wordmark-main">HARBOURVIEW</span>
            <span className="cc-wordmark-sub">COMMAND CENTRE</span>
          </div>
        </div>

        <div className="cc-header-centre">
          <div className="cc-breadcrumb">
            <span className="cc-bc-label">ROUTE CONTEXT</span>
            <span className="cc-bc-sep">›</span>
            <CustomSelect
              value={country.iso2}
              options={countryOptions}
              onChange={handleCountryChange}
              className="cc-bc-select"
            />
            {region && (
              <>
                <span className="cc-bc-sep">/</span>
                <span className="cc-bc-region">{region.toUpperCase()}</span>
              </>
            )}
          </div>
          <div className="cc-page-title">
            {pageTitle}
            {activePage !== 'briefing' && (
              <button className="cc-change-ctx" onClick={() => handlePageChange('briefing')}>
                Change Context
              </button>
            )}
          </div>
        </div>

        <div className="cc-header-right">
          <button
            className="cc-kbd-btn"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette (⌘K)"
          >
            ⌘K
          </button>

          <div className="cc-user-chip">
            <div className="cc-user-avatar">{userInitials}</div>
            <div className="cc-user-info">
              <strong>{userDisplayName}</strong>
              <small>Harbourview</small>
            </div>
            <span className="cc-user-arrow">▾</span>
          </div>
        </div>
      </header>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <nav className="cc-sidebar" aria-label="Command centre navigation">
        <div className="cc-sidebar-nav">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="cc-nav-section">
              {section.label && (
                <div className="cc-nav-section-header" aria-hidden="true">
                  {section.label}
                </div>
              )}
              {section.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`cc-nav-btn${activePage === item.id ? ' active' : ''}`}
                  onClick={() => handlePageChange(item.id)}
                  aria-current={activePage === item.id ? 'page' : undefined}
                >
                  <span className="cc-nav-icon" aria-hidden="true">{item.icon}</span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="cc-sidebar-status">
          <span className="cc-status-dot" />
          <div>
            <strong>System Online</strong>
            <small>All systems operational</small>
          </div>
        </div>
      </nav>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="cc-main">
        {renderPage()}
      </main>

      {/* ── Mobile nav ────────────────────────────────────────────── */}
      <nav className="cc-mob-nav" aria-label="Mobile navigation">
        {NAV_ITEMS_FLAT.map(item => (
          <button
            key={item.id}
            className={`cc-mob-nav-btn${activePage === item.id ? ' active' : ''}`}
            onClick={() => handlePageChange(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <em>{item.label}</em>
          </button>
        ))}
      </nav>

      {/* ── Command palette ───────────────────────────────────────── */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        country={country}
        role={role}
        onPage={handlePageChange}
      />
    </div>
  )
}






