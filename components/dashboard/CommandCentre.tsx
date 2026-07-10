'use client'
import './CommandCentre.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, WatchlistData, PathwayData, SourceCoverageRow, LocalIntelData, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator, CountryEducationOverlay, MySubmission } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal, DigestWindow } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import { complianceRegions } from '@/lib/compliance/regions'
import { formatOpportunityScore } from '@/lib/dashboard/opportunityScore'
import { getModuleContent } from '@/lib/dashboard/educationModuleContent'
import { getRoleNavRank } from '@/lib/dashboard/roleNavPriority'
import { ListingDetailModal } from './ListingDetailModal'
import { WatchlistPage } from './pages/WatchlistPage'
const DigestPageLazy = dynamic(() => import('./pages/DigestPage').then(m => m.DigestPage))
import { GlobeProvider } from '@/components/globe/GlobeProvider'
import { DealRoomsPanel } from './pages/DealRoomsPanel'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import QuoteRequestForm from '@/app/marketplace/quote/QuoteRequestForm'
import { MyListingsClient } from '@/app/marketplace/my-listings/MyListingsClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
// Trailing 2 slots (RATING, REVIEW_COUNT) are pre-formatted strings, empty when unrated.
export type MarketRow = [string, string, string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

export type CommandPage =
  | 'briefing'
  | 'digest'
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

export type { DigestWindow }

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
  digestSignals?:   DashboardSignal[]
  digestWindow?:    DigestWindow
  eduCategories:    { icon: string; title: string; desc: string }[]
  countryEducationOverlays?: CountryEducationOverlay[]
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
  mySubmissions?:       MySubmission[]
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
      { id: 'digest',      label: 'Daily Digest',  icon: '❑' },
      { id: 'marketplace', label: 'Marketplace',   icon: '⊞' },
      { id: 'signals',     label: 'Intelligence',  icon: '≋' },
      { id: 'education',   label: 'Education',     icon: '⬛' },
      { id: 'watchlist',   label: 'Watchlist',     icon: '◈' },
    ],
  },
  {
    label: 'Market Access',
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
                <a className="cc-watch-region-btn" href={`/signals/countries/${r.label.toLowerCase().replace(/ /g, '-')}`}>View</a>
              </div>
            ))}
          </div>
          <Link href="/signals/countries" className="cc-right-link">View all jurisdictions →</Link>
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
const MR = { TITLE:0, DESC:1, JURISDICTION:2, CATEGORY:3, VERIFICATION:4, ACCESS_ROUTE:5, CONFIDENCE:6, ID:7, RATING:8, REVIEW_COUNT:9 } as const

// ── MarketplacePage ────────────────────────────────────────────────────────────

type MarketSubView = 'browse' | 'submit' | 'quote' | 'deals' | 'my-listings'

const MKT_ACTION_TABS: { id: MarketSubView; label: string }[] = [
  { id: 'submit',      label: 'Submit Listing' },
  { id: 'quote',       label: 'Request Quote' },
  { id: 'deals',       label: 'Deal Rooms' },
  { id: 'my-listings', label: 'My Listings' },
]

const MarketplacePage = React.memo(function MarketplacePage({
  country, region, role, marketplaceRows, wantedListings, wantedCount, pathwayData, cannabisOperators = [], pipeline, onPageChange, mySubmissions = [], userEmail,
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
  mySubmissions?:    MySubmission[]
  userEmail?:        string | null
}) {
  const [activeTab, setActiveTab] = useState<MarketView>(() => {
    for (const t of MKT_TABS) {
      if (t.id === 'wanted') { if ((wantedListings?.length ?? 0) > 0) return 'wanted' }
      else if ((marketplaceRows?.[t.id] ?? []).length > 0) return t.id
    }
    return 'cannabis'
  })
  const [search,    setSearch]    = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'featured' | 'rating'>('featured')
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [subView, setSubView] = useState<MarketSubView>('browse')

  const changeTab = (id: MarketView) => {
    setActiveTab(id)
    setRegionFilter('all')
  }

  const regionOptions = useMemo(() => {
    const base: MarketRow[] = activeTab === 'wanted' && wantedListings?.length
      ? wantedListings.map(w => [
          w.title, w.summary ?? '', w.location_country ?? country.iso2,
          'Wanted Demand', 'Verified', 'Direct', '72', w.id, '', '',
        ] as MarketRow)
      : (marketplaceRows?.[activeTab as MarketView] ?? [])
    return Array.from(new Set(base.map(row => row[MR.JURISDICTION]).filter(Boolean))).sort()
  }, [activeTab, marketplaceRows, wantedListings, country])

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
        '',
        '',
      ] as MarketRow)
    }
    if (regionFilter !== 'all') {
      r = r.filter(row => row[MR.JURISDICTION] === regionFilter)
    }
    if (search.trim()) {
      const lq = search.toLowerCase()
      r = r.filter(row => row[MR.TITLE].toLowerCase().includes(lq) || row[MR.DESC].toLowerCase().includes(lq))
    }
    if (sortBy === 'rating') {
      r = [...r].sort((a, b) => {
        const ratingDiff = (Number(b[MR.RATING]) || 0) - (Number(a[MR.RATING]) || 0)
        return ratingDiff !== 0 ? ratingDiff : (Number(b[MR.REVIEW_COUNT]) || 0) - (Number(a[MR.REVIEW_COUNT]) || 0)
      })
    }
    return r
  }, [activeTab, marketplaceRows, wantedListings, search, regionFilter, sortBy, country])

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

        <div className="cc-mkt-actions-bar">
          <button
            className={`cc-mkt-action-btn${subView==='browse'?' active':''}`}
            onClick={() => setSubView('browse')}
          >
            Browse
          </button>
          {MKT_ACTION_TABS.map(t => (
            <button key={t.id}
              className={`cc-mkt-action-btn${subView===t.id?' active':''}`}
              onClick={() => setSubView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {subView === 'submit' ? (
          <div className="cc-mkt-subview">
            <DynamicMarketplaceIntakeForm />
          </div>
        ) : subView === 'quote' ? (
          <div className="cc-mkt-subview">
            <QuoteRequestForm />
          </div>
        ) : subView === 'deals' ? (
          <DealRoomsPanel />
        ) : subView === 'my-listings' ? (
          <div className="cc-mkt-subview">
            <MyListingsClient submissions={mySubmissions} userEmail={userEmail ?? ''} />
          </div>
        ) : (
        <>
        <div className="cc-mkt-tabs">
          {MKT_TABS.map(t => {
            const cnt = t.id === 'wanted' ? (wantedListings?.length ?? wantedCount ?? 0) : (marketplaceRows?.[t.id] ?? []).length
            return (
              <button key={t.id}
                className={`cc-mkt-tab${activeTab===t.id?' active':''}`}
                onClick={() => changeTab(t.id)}
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
          <select className="cc-mkt-select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} aria-label="Filter by jurisdiction">
            <option value="all">All regions</option>
            {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="cc-mkt-select" value={sortBy} onChange={e=>setSortBy(e.target.value as 'featured' | 'rating')} aria-label="Sort listings">
            <option value="featured">Featured first</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        {rows.length > 0 ? (
          <>
            <div className="cc-mkt-table">
              <div className="cc-mkt-thead">
                <span className="cc-mkt-th opp-col">OPPORTUNITY</span>
                <span className="cc-mkt-th">CATEGORY</span>
                <span className="cc-mkt-th">RATING</span>
                <span className="cc-mkt-th">JURISDICTION</span>
                <span className="cc-mkt-th">VERIFICATION</span>
                <span className="cc-mkt-th">ACCESS ROUTE</span>
                <span className="cc-mkt-th">EVIDENCE</span>
                <span className="cc-mkt-th">ACTIONS</span>
              </div>
              {rows.slice(0,10).map((row, i) => {
                const conf = parseInt(row[MR.CONFIDENCE])||72
                const ok   = row[MR.VERIFICATION]?.toLowerCase()==='verified'
                const rating = Number(row[MR.RATING]) || 0
                const reviewCount = Number(row[MR.REVIEW_COUNT]) || 0
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
                    <div className="cc-mkt-cell">
                      {rating > 0 && reviewCount > 0
                        ? <span className="cc-mkt-rating"><span className="cc-mkt-star">★</span>{rating.toFixed(1)} <span className="cc-mkt-rating-count">({reviewCount})</span></span>
                        : <span className="cc-mkt-rating cc-mkt-rating-empty">—</span>}
                    </div>
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
                      {/* "Wanted" rows carry a wanted_requests id, not a marketplace_public_listings_v1 id — the
                          detail modal can only resolve real listings, so skip wiring it for that tab. */}
                      <button className="cc-act-primary" onClick={activeTab !== 'wanted' ? () => setSelectedListingId(row[MR.ID]) : undefined}>Request access</button>
                      <button className="cc-act-sec" onClick={activeTab !== 'wanted' ? () => setSelectedListingId(row[MR.ID]) : undefined}>Watch</button>
                      <button className="cc-act-sec" onClick={activeTab !== 'wanted' ? () => setSelectedListingId(row[MR.ID]) : undefined}>Requirements</button>
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
        </>
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
            <button className="cc-right-link" onClick={() => setSubView('browse')}>View pipeline →</button>
          </div>
        )}
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
          <button className="cc-right-link" onClick={() => setSubView('browse')}>View counterparty profile →</button>
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
            <button className="cc-right-link" onClick={() => setSubView('browse')}>View all operators →</button>
          </div>
        )}
      </aside>

      <ListingDetailModal
        listingId={selectedListingId}
        onClose={() => setSelectedListingId(null)}
        onRequestAccess={() => onPageChange?.('access-pathway')}
        onWatch={() => onPageChange?.('watchlist')}
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
  country, region, role, eduCategories, liveTiles, recentEduModules, signals, pathwayData, educationTracks = [], countryEducationOverlays, onPageChange,
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
  countryEducationOverlays?: CountryEducationOverlay[]
  onPageChange?:     (page: CommandPage) => void
}) {
  const modules    = useMemo(() => buildLearningPath(eduCategories), [eduCategories])
  const roleDisp   = role ? role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Professional'
  const nextModule = modules.find(m => m.progress < 100 && m.level === 'REQUIRED')
  const [expandedModule, setExpandedModule] = useState<number | null>(null)
  // Same source of truth as the mobile Education tab (lib/dashboard/educationModuleContent.ts)
  // so country-specific verified guidance and the "not yet verified" fallback labeling
  // match exactly between desktop and mobile instead of drifting.
  const moduleContent = useMemo(
    () => new Map(modules.map(m => [m.num, getModuleContent(m.title, countryEducationOverlays)])),
    [modules, countryEducationOverlays],
  )

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
          {modules.map(m => {
            const content = moduleContent.get(m.num)
            const isExpanded = expandedModule === m.num
            return (
            <div key={m.num} className="cc-edu-row">
              <div className="cc-edu-row-icon"><span>{m.icon}</span></div>
              <div className="cc-edu-row-body">
                <div className="cc-edu-row-title">
                  <strong>{m.num}. {m.title}</strong>
                  <span className={`cc-edu-badge ${m.level.toLowerCase()}`}>{m.level}</span>
                  {content?.isVerified && (
                    <span className="cc-edu-badge" style={{ background: 'rgba(76,175,130,.12)', color: 'var(--cc-green)', border: '1px solid rgba(76,175,130,.25)' }}>
                      Verified for {country.label}
                    </span>
                  )}
                </div>
                <p>{m.desc}</p>
                {content && !content.isVerified && (
                  <small style={{ color: 'rgba(212,168,75,.6)', display: 'block', marginTop: 2 }}>
                    General guidance — not yet verified for {country.label}
                  </small>
                )}
                <small className="cc-edu-time">◷ {m.minutes} min</small>
                {content && (
                  <button
                    type="button"
                    className="cc-right-link"
                    style={{ marginTop: 6, display: 'inline-block' }}
                    onClick={() => setExpandedModule(isExpanded ? null : m.num)}
                  >
                    {isExpanded ? 'Hide topics ↑' : 'View topics →'}
                  </button>
                )}
                {isExpanded && content && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'rgba(245,240,232,.75)', fontSize: 13, lineHeight: 1.6 }}>
                    {content.topics.map((topic, i) => <li key={i}>{topic}</li>)}
                  </ul>
                )}
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
            )
          })}
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
          <Link href="/intelligence/source-engine" className="cc-right-link">Go to Evidence &amp; Sources →</Link>
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
          <Link href="/signals/countries" className="cc-right-link">View comparisons →</Link>
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
          <Link href="/intelligence/source-engine" className="cc-right-link">Improve coverage →</Link>
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
          <Link href="/intelligence/source-engine" className="cc-right-link">View coverage map →</Link>
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

  if (!template) {
    return (
      <div className="cc-page cc-two-col-page">
        <div className="cc-two-main">
          <div className="cc-empty-state" style={{flex:1}}>
            <span>⬡</span>
            <p>No Access Pathway defined for {country.label}{role ? ` · ${role}` : ''}.</p>
            <small style={{fontSize:'11px',color:'var(--cc-dim)'}}>Pathways are configured per country and role. Contact Harbourview to set up your pathway.</small>
          </div>
        </div>
        <aside className="cc-two-right" />
      </div>
    )
  }

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Access Pathway</h2>
          <p>Follow the pathway to establish and maintain access to export markets.</p>
        </div>

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
          <Link href="/intelligence/source-engine" className="cc-right-link">View all documents →</Link>
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
    </div>
  )
})

// ── Evidence & Sources helpers ────────────────────────────────────────────────

type EvidenceTab = 'regulatory'|'guidance'|'licensing'|'clinical'|'market'|'import_export'|'education'|'local'

const EV_TABS: { id: EvidenceTab; label: string }[] = [
  { id: 'regulatory',    label: 'Regulatory & Statute'    },
  { id: 'guidance',      label: 'Guidance & Policy'       },
  { id: 'licensing',     label: 'Licensing / Authority'   },
  { id: 'clinical',      label: 'Clinical / Practice'     },
  { id: 'market',        label: 'Market / Commercial'     },
  { id: 'import_export', label: 'Import / Export'         },
  { id: 'education',     label: 'Education / Professional'},
  { id: 'local',         label: 'Local / Subnational'     },
]

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

        {/* ── Source table ──────────────────────────────────── */}
        {tabSources.length === 0 && orgDocs.length === 0 ? (
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
          <Link href="/intelligence/source-engine" className="cc-right-link">View all gaps →</Link>
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
          <Link href="/intelligence/source-engine" className="cc-right-link">View freshness report →</Link>
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
                          <Link href={`/genetics/cultivars/${p.slug}`} className="cc-sig-brief">{countryOpps[0].cta} →</Link>
                        ) : (
                          <Link href={`/genetics/cultivars/${p.slug}`} className="cc-sig-brief">View passport →</Link>
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
                      <Link href="/contact" className="cc-sig-brief">Request verification →</Link>
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
                      <Link href="/contact" className="cc-sig-brief">{cp.cta} →</Link>
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
          <Link href="/genetics" className="cc-right-link">Genetics hub →</Link>
        </div>
      </aside>
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
                <div><small>Opportunity score</small><strong>{formatOpportunityScore(countryIntel.opportunity_score)}</strong></div>
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
                          href={`/countries/${c.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
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
          <Link href="/countries" className="cc-right-link">Full country profiles →</Link>
        </div>
      </aside>
    </div>
  )
})

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandCentre({
  signals,
  digestSignals,
  digestWindow,
  eduCategories,
  countryEducationOverlays,
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
  mySubmissions = [],
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

  // Per-role sidebar ordering: promote modules relevant to this role within each
  // nav section, without hiding anything. 'briefing' always stays first (it's the
  // default landing page). Items with no per-role signal keep their original order.
  const navRank = useMemo(() => getRoleNavRank(role), [role])
  const orderedNavSections = useMemo<NavSection[]>(() => NAV_SECTIONS.map(section => ({
    ...section,
    items: [...section.items].sort((a, b) => {
      if (a.id === 'briefing') return -1
      if (b.id === 'briefing') return 1
      return (navRank[a.id] ?? Infinity) - (navRank[b.id] ?? Infinity)
    }),
  })), [navRank])
  const orderedNavFlat = useMemo(() => orderedNavSections.flatMap(s => s.items), [orderedNavSections])

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

  // Persist role/country for signed-in users, same fix as MobileCommandCentre —
  // this API already existed and works, only UniversalDashboard.tsx (a separate,
  // unrelated dashboard component) was ever calling it.
  const heatmapLayerRef = useRef<string>('none')
  useEffect(() => {
    if (!userEmail) return
    fetch('/api/dashboard/preferences')
      .then(r => r.json())
      .then(d => { heatmapLayerRef.current = d?.preferences?.heatmap_layer ?? 'none' })
      .catch(() => { heatmapLayerRef.current = 'none' })
  }, [userEmail])

  const persistDashboardPreferences = useCallback((next: { country_iso2?: string; role_id?: string }) => {
    if (!userEmail) return
    void fetch('/api/dashboard/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        country_iso2: next.country_iso2 ?? country.iso2,
        role_id: next.role_id ?? role,
        heatmap_layer: heatmapLayerRef.current,
      }),
    }).catch(() => undefined)
  }, [userEmail, country.iso2, role])

  const handleCountryChange = useCallback((iso2: string) => {
    const found = COUNTRIES.find(c => c.iso2 === iso2)
    if (!found) return
    setCountry(found)
    setRegion('')
    syncUrl({ countryIso2: iso2, roleId: role, page: activePage })
    persistDashboardPreferences({ country_iso2: iso2 })
  }, [role, activePage, syncUrl, persistDashboardPreferences])

  const handleRoleChange = useCallback((roleId: string) => {
    setRole(roleId)
    syncUrl({ countryIso2: country.iso2, roleId, page: activePage })
    persistDashboardPreferences({ role_id: roleId })
  }, [country.iso2, activePage, syncUrl, persistDashboardPreferences])

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
      case 'digest':
        return <DigestPageLazy country={country} region={region} role={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
      case 'access-pathway':
        return <AccessPathwayPage country={country} region={region} role={roleLabel} signals={signals} pathwayData={pathwayData} countryIntel={countryIntel} jurisdictionPlaybook={jurisdictionPlaybook} />
      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} pathwayData={pathwayData} cannabisOperators={cannabisOperators} pipeline={pipeline} onPageChange={handlePageChange} mySubmissions={mySubmissions} userEmail={userEmail} />
      case 'evidence':
        return <EvidenceSourcesPage country={country} region={region} role={roleLabel} evidenceData={evidenceData} pathwayData={pathwayData} professionals={professionals} />
      case 'education':
        return <EducationPage country={country} region={region} role={roleLabel} eduCategories={eduCategories} liveTiles={liveTiles} recentEduModules={recentEduModules} signals={signals} pathwayData={pathwayData} educationTracks={educationTracks} countryEducationOverlays={countryEducationOverlays} onPageChange={handlePageChange} />
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
          {orderedNavSections.map((section, si) => (
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
        {orderedNavFlat.map(item => (
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






