'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, LocalIntelData } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

type CommandPage =
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

type Props = {
  signals:          DashboardSignal[]
  eduCategories:    { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?:   string | null
  wantedCount?:     number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?:        PipelineCounts
  wantedListings?:  WantedListing[]
  countryIntel?:    CountryIntelProfile | null
  localIntel?:      LocalIntelData | null
  pathwayData?:     PathwayData
  watchlistData?:   WatchlistData
  evidenceData?:    EvidenceData
  liveTiles?:        LiveEduTile[]
  recentEduModules?: RecentEduModule[]
}

// ── Globe (dynamic — SSR off) ─────────────────────────────────────────────────

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName, slug: c.slug }))

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
    label: 'Settings',
    items: [
      { id: 'settings', label: 'Settings', icon: '⊙' },
    ],
  },
]

// Flat list — used by pageTitle, CommandPalette, mobile nav
const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

// ── BriefingRoom page ─────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  AU: '🇦🇺', NL: '🇳🇱', MX: '🇲🇽', IL: '🇮🇱', CO: '🇨🇴',
  PT: '🇵🇹', IT: '🇮🇹', ES: '🇪🇸', CH: '🇨🇭', PL: '🇵🇱',
  CZ: '🇨🇿', AT: '🇦🇹', BE: '🇧🇪', LU: '🇱🇺', DK: '🇩🇰',
  SE: '🇸🇪', NO: '🇳🇴', FI: '🇫🇮', GR: '🇬🇷', IE: '🇮🇪',
  ZA: '🇿🇦', BR: '🇧🇷', AR: '🇦🇷', TH: '🇹🇭', NZ: '🇳🇿',
  JP: '🇯🇵', SG: '🇸🇬',
}

function buildConfidenceBars(intel?: CountryIntelProfile | null): { label: string; pct: number }[] {
  const dc  = (intel?.data_completeness ?? '').toLowerCase()
  const opp = intel?.opportunity_score ?? null
  const base = dc === 'full' ? 88 : dc === 'high' ? 85 : dc === 'partial' ? 65 : dc === 'stub' ? 50 : 38
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

// ── Role-aware Briefing Room fields ─────────────────────────────────────────
// The Briefing Room previously showed the same 5 generic fields (Medical
// Program, Market Access, Import/Export Status, Opportunity) to every role —
// meaningless to a Logistics/Customs broker, for example. Group roles into
// the same 4 clusters used by the Access Pathway generic templates, and show
// the 5 fields + framing sentence most relevant to that cluster.

type BriefingFocus = 'production' | 'trade' | 'healthcare' | 'oversight'

const ROLE_FOCUS: Record<string, BriefingFocus> = {
  cultivator_producer:         'production',
  geneticist_breeder:          'production',
  processor_extractor:         'production',
  gmp_quality:                  'production',
  lab_qa:                       'production',
  importer:                     'trade',
  exporter:                     'trade',
  distributor_wholesaler:       'trade',
  logistics_customs:            'trade',
  retail_operator:              'trade',
  doctor_prescriber:            'healthcare',
  pharmacist:                   'healthcare',
  clinic_healthcare_operator:   'healthcare',
  patient_caregiver_education:  'healthcare',
  budtender:                    'healthcare',
  regulatory_compliance:        'oversight',
  legal_advisory:               'oversight',
  investor_operator:            'oversight',
  government_regulator:         'oversight',
}

function fmtTradeRoles(roles: string[] | null | undefined): string {
  if (!roles || roles.length === 0) return 'Not Classified'
  return roles.map(r => fmtStatus(r)).join(', ')
}

function getBriefingFields(focus: BriefingFocus | undefined, intel?: CountryIntelProfile | null): { icon: string; label: string; value: string }[] {
  const regulator = intel?.regulator_label?.trim() || 'Not Identified'
  switch (focus) {
    case 'trade':
      return [
        { icon: '↓', label: 'Import Status',  value: fmtStatus(intel?.import_status, 'Not Available') },
        { icon: '↑', label: 'Export Status',  value: fmtStatus(intel?.export_status, 'Not Available') },
        { icon: '⊞', label: 'Trade Role(s)',  value: fmtTradeRoles(intel?.trade_roles) },
        { icon: '⊛', label: 'Market Access',  value: fmtStatus(intel?.market_access_status, 'Status Unknown') },
        { icon: '◎', label: 'Regulator',      value: regulator },
      ]
    case 'production':
      return [
        { icon: '⊛', label: 'Market Access',   value: fmtStatus(intel?.market_access_status, 'Status Unknown') },
        { icon: '↑', label: 'Export Status',   value: fmtStatus(intel?.export_status, 'Not Available') },
        { icon: '◎', label: 'Medical Program', value: fmtStatus(intel?.medical_status, 'No Active Program') },
        { icon: '✦', label: 'Regulator',       value: regulator },
        { icon: '⊙', label: 'Opportunity',     value: intel?.opportunity_score != null ? `${intel.opportunity_score}/100` : 'Not Scored' },
      ]
    case 'healthcare':
      return [
        { icon: '◎', label: 'Medical Program',    value: fmtStatus(intel?.medical_status, 'No Active Program') },
        { icon: '⊕', label: 'Adult-Use Program',  value: fmtStatus(intel?.adult_use_status, 'No Active Program') },
        { icon: '⊛', label: 'Market Access',      value: fmtStatus(intel?.market_access_status, 'Status Unknown') },
        { icon: '✦', label: 'Regulator',          value: regulator },
        { icon: '↓', label: 'Import Status',      value: fmtStatus(intel?.import_status, 'Not Available') },
      ]
    case 'oversight':
      return [
        { icon: '⊛', label: 'Market Access',      value: fmtStatus(intel?.market_access_status, 'Status Unknown') },
        { icon: '◎', label: 'Medical Program',    value: fmtStatus(intel?.medical_status, 'No Active Program') },
        { icon: '⊕', label: 'Adult-Use Program',  value: fmtStatus(intel?.adult_use_status, 'No Active Program') },
        { icon: '✦', label: 'Regulator',          value: regulator },
        { icon: '⊙', label: 'Opportunity',        value: intel?.opportunity_score != null ? `${intel.opportunity_score}/100` : 'Not Scored' },
      ]
    default:
      return [
        { icon: '◎', label: 'Medical Program', value: fmtStatus(intel?.medical_status,       'No Active Program') },
        { icon: '⊛', label: 'Market Access',   value: fmtStatus(intel?.market_access_status, 'Status Unknown')    },
        { icon: '↓', label: 'Import Status',   value: fmtStatus(intel?.import_status,        'Not Available')     },
        { icon: '↑', label: 'Export Status',   value: fmtStatus(intel?.export_status,        'Not Available')     },
        { icon: '⊙', label: 'Opportunity',     value: intel?.opportunity_score != null ? `${intel.opportunity_score}/100` : 'Not Scored' },
      ]
  }
}

function getBriefingFraming(focus: BriefingFocus | undefined, roleLabel: string, countryLabel: string): string | null {
  if (!focus || !roleLabel) return null
  switch (focus) {
    case 'trade':
      return `As a ${roleLabel}, the key questions for ${countryLabel} are: what's the import/export status, what trade role does the country play, and which regulator governs cross-border movement.`
    case 'production':
      return `As a ${roleLabel}, the key questions for ${countryLabel} are: does market access support production for domestic medical supply or export, and how does the opportunity score compare to other markets.`
    case 'healthcare':
      return `As a ${roleLabel}, the key questions for ${countryLabel} are: is there an active medical or adult-use programme you can operate within, and where do patients' products come from.`
    case 'oversight':
      return `As a ${roleLabel}, the key questions for ${countryLabel} are: overall market access status, programme maturity, and the opportunity profile for advisory or investment purposes.`
    default:
      return null
  }
}


const BriefingRoom = React.memo(function BriefingRoom({
  country,
  region,
  role,
  roleLabel,
  countryIntel,
  signals,
  onCountrySelect,
}: {
  country:          { iso2: string; label: string }
  region:           string
  role?:            string
  roleLabel?:       string
  countryIntel?:    CountryIntelProfile | null
  signals:          DashboardSignal[]
  onCountrySelect?: (iso2: string) => void
}) {
  const [focusedIso2, setFocusedIso2] = useState<string | undefined>(undefined)
  const confBars = useMemo(() => buildConfidenceBars(countryIntel), [countryIntel])
  const overall  = overallConfidence(confBars)
  const focus    = role ? ROLE_FOCUS[role] : undefined
  const briefingFields = useMemo(() => getBriefingFields(focus, countryIntel), [focus, countryIntel])
  const briefingFraming = useMemo(() => getBriefingFraming(focus, roleLabel ?? '', country.label), [focus, roleLabel, country.label])
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
          <div className="cc-jx-flag">{FLAG_MAP[country.iso2] ?? '🌐'}</div>
          <div>
            <div className="cc-jx-country">{country.label}</div>
            {region && <div className="cc-jx-region">{region}</div>}
          </div>
        </div>

        {countryIntel?.public_summary && (
          <p className="cc-jx-summary">{countryIntel.public_summary}</p>
        )}

        {briefingFraming && (
          <p className="cc-jx-framing">{briefingFraming}</p>
        )}

        <div className="cc-jx-fields">
          {briefingFields.map(f => (
            <div key={f.label} className="cc-jx-field">
              <span className="cc-jx-field-icon">{f.icon}</span>
              <div>
                <small>{f.label}</small>
                <strong>{f.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <button className="cc-jx-btn">View Full Jurisdiction Profile →</button>
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
          <a href="#" className="cc-right-link">Confidence methodology →</a>
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
                .filter((m, i, a) => m !== country.label && a.indexOf(m) === i)
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
                <button className="cc-watch-region-btn">View</button>
              </div>
            ))}
          </div>
          <a href="#" className="cc-right-link">View all jurisdictions →</a>
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
            <a href="#" className="cc-right-link">View all change activity →</a>
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

  const filtered = useMemo(() => signals.filter(s => {
    const imp = deriveImpact(s.confidence)
    if (filterImpact !== 'all' && imp.toLowerCase() !== filterImpact) return false
    if (filterConf === 'high'   && s.confidence < 80) return false
    if (filterConf === 'medium' && (s.confidence < 65 || s.confidence >= 80)) return false
    if (filterConf === 'low'    && s.confidence >= 65) return false
    if (filterType !== 'all' && deriveSignalGroup(s.title).toLowerCase().replace(/ /g, '_') !== filterType) return false
    return true
  }), [signals, filterImpact, filterConf, filterType])

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
  const nextBest     = signals.find(s => s.confidence >= 80)

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
    signals.forEach(s => {
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
  }, [signals])

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
          {activeGroups.map(grp => (
            <div key={grp} className="cc-sig-group">
              <div className="cc-sig-group-hd">
                <span>{SIG_GROUP_ICONS[grp]}</span>
                {grp}
              </div>
              {grouped[grp]!.map((s, i) => {
                const imp  = deriveImpact(s.confidence)
                const circ = 87.96
                return (
                  <div key={i} className="cc-sig-row">
                    <span className={`cc-sig-dot ${imp.toLowerCase()}`} />
                    <div className="cc-sig-body">
                      <strong>{s.title}</strong>
                      <small>{s.market}{region ? ` · ${region}` : ''} · {s.timeAgo}</small>
                    </div>
                    <div className="cc-sig-why">
                      <em>Why it matters</em>
                      <span>Affects operations in {s.market}{region ? ` · ${region}` : ''}</span>
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
                      <button className="cc-sig-brief">Open brief</button>
                      <button className="cc-sig-watch">↗ Add to watchlist</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="cc-feed-footer">
          <span>Showing {Math.min(filtered.length, 6)}&nbsp;of&nbsp;{signals.length} signals</span>
          <span className="cc-auto-refresh"><span className="cc-refresh-dot"/>Auto-refresh on · Updated 2 min ago</span>
          <div className="cc-pagination">
            <button className="cc-page-btn">‹</button>
            <button className="cc-page-btn active">1</button>
            <button className="cc-page-btn">2</button>
            <button className="cc-page-btn">3</button>
            <button className="cc-page-btn">›</button>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Manage saved filters →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">HIGH-WATCH TOPICS</div>
          {HIGH_WATCH.map(t => (
            <div key={t.label} className="cc-topic-row">
              <span>{t.label}</span>
              <span className="cc-topic-count">{t.n}</span>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all topics →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SIGNAL METHODOLOGY</div>
          <p className="cc-right-prose">Signals are sourced from regulatory releases, market data, trade intelligence, and verified industry sources. Each signal is scored for impact and confidence based on source credibility and recency.</p>
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Learn more about our methodology →</a>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">{nextBest.title.length > 90 ? nextBest.title.slice(0,90)+'…' : nextBest.title}</p>
            <button className="cc-nba-btn">Open Signal Brief ↗</button>
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all recommended actions →</a>
          </div>
        )}
      </aside>
    </div>
  )
})

// ── Marketplace helpers ────────────────────────────────────────────────────────

const MKT_TABS: { id: MarketView; label: string; emptyNoun: string }[] = [
  { id: 'cannabis',      label: 'Listings',      emptyNoun: 'listings' },
  { id: 'wanted',        label: 'Wanted Demand', emptyNoun: 'wanted demand listings' },
  { id: 'opportunities', label: 'Buyer Routes',  emptyNoun: 'buyer route opportunities' },
  { id: 'equipment',     label: 'Equipment',     emptyNoun: 'equipment listings' },
  { id: 'consumables',   label: 'Consumables',   emptyNoun: 'consumables listings' },
  { id: 'services',      label: 'Services',      emptyNoun: 'service listings' },
  { id: 'new-products',  label: 'Opportunities', emptyNoun: 'opportunities' },
]

// MarketRow tuple field indices
const MR = { TITLE:0, DESC:1, JURISDICTION:2, CATEGORY:3, VERIFICATION:4, ACCESS_ROUTE:5, CONFIDENCE:6, ID:7 } as const

// ── MarketplacePage ────────────────────────────────────────────────────────────

const MarketplacePage = React.memo(function MarketplacePage({
  country, region, role, marketplaceRows, wantedListings, wantedCount, pathwayData,
}: {
  country:         { iso2: string; label: string }
  region:          string
  role:            string
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  wantedListings?:  WantedListing[]
  wantedCount?:     number
  pathwayData?:     PathwayData
}) {
  const [activeTab, setActiveTab] = useState<MarketView>('cannabis')
  const [search,    setSearch]    = useState('')

  const rows = useMemo<MarketRow[]>(() => {
    let r: MarketRow[] = marketplaceRows?.[activeTab] ?? []
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
          {MKT_TABS.map(t => (
            <button key={t.id}
              className={`cc-mkt-tab${activeTab===t.id?' active':''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.id==='wanted' && wantedCount ? <span className="cc-tab-badge">{wantedCount}</span> : null}
            </button>
          ))}
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
                      <button className="cc-act-primary">Request access</button>
                      <button className="cc-act-sec">Watch</button>
                      <button className="cc-act-sec">Requirements</button>
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
            <p>No {MKT_TABS.find(t=>t.id===activeTab)?.emptyNoun ?? 'listings'} for {country.label}{region?` · ${region}`:''}.{' '}
              {activeTab!=='wanted' && <button className="cc-right-link" onClick={()=>setActiveTab('wanted')}>Browse wanted demand →</button>}
            </p>
          </div>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all requirements →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Address gaps →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View counterparty profile →</a>
        </div>
      </aside>
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
  country, region, role, eduCategories, liveTiles, recentEduModules, signals, pathwayData,
}: {
  country:           { iso2: string; label: string }
  region:            string
  role:              string
  eduCategories:     { icon: string; title: string; desc: string }[]
  liveTiles?:        LiveEduTile[]
  recentEduModules?: RecentEduModule[]
  signals?:          DashboardSignal[]
  pathwayData?:      PathwayData
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
          <span className="cc-edu-hd-icon">⬛</span>
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
          <div className="cc-right-head">RELATED EVIDENCE <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link ml-auto">View all →</a></div>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Go to Evidence &amp; Sources →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">RECENTLY UPDATED MODULES <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link ml-auto">View all →</a></div>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View module details →</a>
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
  country, region, role, signals, watchlistData, countryIntel,
}: {
  country:       { iso2: string; label: string }
  region:        string
  role:          string
  signals:       DashboardSignal[]
  watchlistData?: WatchlistData
  countryIntel?:  CountryIntelProfile | null
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
  const POLICY_QS = [
    'Will local option sales tax authority expand?',
    'How will packaging rules align with child-resistant standards?',
    'Could advertising restrictions broaden to digital channels?',
  ]
  const SOURCE_GAPS = [
    { label: 'Local Ordinance Texts',           level: 'medium' },
    { label: 'Enforcement Disposition Data',    level: 'high'   },
    { label: 'Court Decisions (Appellate)',     level: 'medium' },
  ]

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
            <strong className="cc-rw-posture-title">Stable with targeted reform activity.</strong>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View change brief →</a>
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
                    <button className="cc-sig-brief">Open brief</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="cc-feed-footer">
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all events →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Manage triggers →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View comparisons →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">OPEN POLICY QUESTIONS</div>
          {POLICY_QS.map((q, i) => (
            <div key={i} className="cc-policy-q">
              <span className="cc-policy-q-icon">?</span>
              <span>{q}</span>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all questions →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SOURCE GAPS</div>
          {SOURCE_GAPS.map(g => (
            <div key={g.label} className="cc-source-gap-row">
              <span>{g.label}</span>
              <span className={`cc-gap-badge ${g.level}`}>{g.level === 'high' ? 'High Gap' : 'Medium Gap'}</span>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Improve coverage →</a>
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
                <small>Last updated May 28, 2025</small>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all saved views →</a>
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
                <small>Started today</small>
              </div>
              <span className="cc-security-badge active">Active</span>
            </div>
          </div>
          <button className="cc-signout-btn">↗ Sign Out</button>
        </div>
      </aside>
    </div>
  )
})

// ── LocalIntelPage ────────────────────────────────────────────────────────────

// LI_CONSTRAINTS, LI_ROUTES, LI_COVERAGE, LI_OPEN_QS: derived dynamically inside LocalIntelPage

function buildMunicipalData(country: { iso2: string; label: string }, region: string) {
  return [
    { name: `${country.label} Capital Region`, status: 'medium' as const, note: 'Review municipal requirements' },
    { name: `${country.label} Metro Areas`,    status: 'low'    as const, note: 'Contact local authorities' },
  ]
}

function buildAuthorities(country: { iso2: string; label: string }) {
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
  localIntel?:  LocalIntelData | null
}) {
  const hasLiveLocalIntel = localIntel?.coverageStatus === 'available'

  const municipalities = useMemo(() => {
    if (hasLiveLocalIntel && localIntel!.municipalities.length > 0) return localIntel!.municipalities
    return buildMunicipalData(country, region)
  }, [country, region, hasLiveLocalIntel, localIntel])

  const authorities = useMemo(() => {
    if (hasLiveLocalIntel && localIntel!.authorities) return localIntel!.authorities
    return buildAuthorities(country)
  }, [country, hasLiveLocalIntel, localIntel])

  // ── Dynamic local intel content derived from countryIntel + signals ──────────
  const LI_CONSTRAINTS = useMemo(() => {
    if (hasLiveLocalIntel && localIntel!.constraints.length > 0) return localIntel!.constraints
    if (countryIntel) {
      const items: { icon: string; label: string; text: string }[] = []
      if (countryIntel.medical_status) items.push({ icon:'◎', label:'Medical Programme', text:`Status: ${fmtStatus(countryIntel.medical_status)}. Operator compliance required under national health authority rules.` })
      if (countryIntel.market_access_status) items.push({ icon:'⊞', label:'Market Access', text:`Classification: ${fmtStatus(countryIntel.market_access_status)}. Verify operator entry requirements before commercial engagement.` })
      if (countryIntel.import_status) items.push({ icon:'↓', label:'Import Constraints', text:`Pathway: ${fmtStatus(countryIntel.import_status)}. Documentation, permit and customs requirements apply.` })
      if (countryIntel.export_status) items.push({ icon:'↑', label:'Export Access', text:`Pathway: ${fmtStatus(countryIntel.export_status)}. GMP, country-of-origin, and consignment documentation required.` })
      if (items.length > 0) return items
    }
    return [
      { icon:'◎', label:'Licensing Requirements',  text:`Verify licensing and permit requirements with the ${country.label} national regulatory authority.` },
      { icon:'⊟', label:'Market Access Rules',     text:'Contact local authorities to confirm current market access conditions and operational constraints.' },
      { icon:'◷', label:'Compliance Obligations',  text:'Maintain current documentation and certification as required by national regulations.' },
      { icon:'⊞', label:'Local Requirements',      text:'Subnational and municipal requirements may vary; confirm with local government offices.' },
    ]
  }, [country, countryIntel, hasLiveLocalIntel, localIntel])

  const LI_ROUTES = useMemo(() => {
    if (hasLiveLocalIntel && localIntel!.routes.length > 0) return localIntel!.routes
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
  }, [country, countryIntel, hasLiveLocalIntel, localIntel])

  const LI_COVERAGE = useMemo(() => {
    if (hasLiveLocalIntel && localIntel!.coverage.length > 0) return localIntel!.coverage
    return [
      { label: 'National Regulatory Sources',  level: 'high'   as const },
      { label: 'Agency Guidance & Bulletins',  level: 'high'   as const },
      { label: 'Trade & Industry Sources',     level: 'medium' as const },
      { label: 'Local Government Notices',     level: 'medium' as const },
      { label: 'Legal & Legislative Tracking', level: 'high'   as const },
    ]
  }, [hasLiveLocalIntel, localIntel])

  const LI_OPEN_QS = useMemo(() => {
    if (hasLiveLocalIntel && localIntel!.openQuestions.length > 0) return localIntel!.openQuestions
    const sigQs = signals.slice(0, 3).map(s => {
      const area = derivePolicyArea(s.title)
      return `How will ${area.toLowerCase()} developments affect operations in ${country.label}${region ? ` · ${region}` : ''}?`
    })
    if (sigQs.length > 0) return sigQs
    return [
      `What are the current enforcement priorities for licensed operators in ${country.label}?`,
      `How will regulatory developments affect market access in ${country.label}?`,
      `What documentation requirements apply to commercial activity in ${country.label}?`,
    ]
  }, [signals, country, region, hasLiveLocalIntel, localIntel])

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
                🌐
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'10px',display:'inline-block'}}>View full state brief →</a>
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
                {authorities.top && (
                  <div className={`cc-li-org-node ${authorities.top.type}`}>
                    <span className="cc-li-org-node-name">{authorities.top.name}</span>
                    <span className="cc-li-org-node-role">{authorities.top.role}</span>
                  </div>
                )}
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
              <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Explore authorities →</a>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}}>View all municipalities →</a>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'4px',display:'inline-block'}}>View constraint detail →</a>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'4px',display:'inline-block'}}>View routing guidance →</a>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}}>Submit intel request →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all authorities →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View coverage map →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">OPEN LOCAL QUESTIONS</div>
          {LI_OPEN_QS.map((q, i) => (
            <div key={i} className="cc-policy-q">
              <span className="cc-policy-q-icon">?</span>
              <span>{q}</span>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all questions →</a>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">
              Engage local planning authorities to confirm current zoning status for {country.label}{region ? ` · ${region}` : ''}.
            </p>
            <button className="cc-nba-btn full" style={{marginTop:'8px'}}>Create Action</button>
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'6px',display:'inline-block'}}>View Suggested Actions →</a>
          </div>
        )}
      </aside>
    </div>
  )
})

// ── Access Pathway types ──────────────────────────────────────────────────────

export type PathwayTemplate      = { id: string; name: string; total_steps: number }
export type PathwayStep          = { id: string; step_number: number; title: string; description: string | null; unlock_condition: string }
export type PathwayRequirement   = { id: string; step_id: string; title: string; description: string | null; evidence_type: string; is_required: boolean; sort_order: number }
export type OrgPathwayProgress   = { current_step: number; status: string; last_action_at: string }
export type OrgRequirementStatus = { requirement_id: string; status: 'pending'|'in_review'|'verified'|'rejected'|'waived'; submitted_at: string | null; reviewed_at: string | null }
export type PathwayData          = {
  template:            PathwayTemplate | null
  steps:               PathwayStep[]
  requirements:        PathwayRequirement[]
  progress:            OrgPathwayProgress | null
  requirementStatuses: OrgRequirementStatus[]
}

const REQ_STATUS_ICON: Record<string, string> = {
  verified: '✓', in_review: '◎', pending: '○', rejected: '✕', waived: '—',
}
const REQ_STATUS_COLOR: Record<string, string> = {
  verified: 'var(--cc-green)', in_review: 'var(--cc-amber)',
  pending:  'var(--cc-dim)',   rejected:  'var(--cc-red)',   waived: 'var(--cc-dim)',
}

// ── AccessPathwayPage ─────────────────────────────────────────────────────────

const AccessPathwayPage = React.memo(function AccessPathwayPage({
  country, region, role, signals, pathwayData,
}: {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  signals:      DashboardSignal[]
  pathwayData?: PathwayData
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

  const CONF_BARS = [
    { label: 'Regulatory',      pct: 85 },
    { label: 'Access Pathway',  pct: 75 },
    { label: 'Evidence Content',pct: 70 },
  ]

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
                <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View {country.label} requirements →</a>

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
                <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}}>View all requirements →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all documents →</a>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all signals →</a>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">EVIDENCE CONFIDENCE</div>
          <div className="cc-confidence-summary">
            <div className="cc-confidence-donut">
              <svg viewBox="0 0 64 64" className="cc-donut-svg">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--cc-gold)" strokeWidth="7"
                  strokeDasharray={`${163.4*75/100} 163.4`} strokeLinecap="round" transform="rotate(-90 32 32)"/>
              </svg>
              <div className="cc-donut-label">
                <strong>75%</strong>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Confidence methodology →</a>
        </div>
      </aside>
    </div>
  )
})

// ── Watchlist types ───────────────────────────────────────────────────────────

export type WatchlistItem = {
  id: string; item_type: string; ref_id: string | null
  title: string; subtitle: string | null; tags: string[]
  jurisdiction: string | null; confidence_pct: number | null
  latest_change_at: string | null; latest_change_note: string | null
  next_action: string | null; watch_status: string
  created_at: string; updated_at: string
}
export type WatchRule          = { id: string; rule_type: string; keywords: string[] }
export type NotificationSummary= { total_alerts: number; awaiting_review: number; resolved: number; snoozed: number }
export type WatchlistData      = { items: WatchlistItem[]; rules: WatchRule[]; notifications: NotificationSummary }

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
          <div className="cc-right-head">RECENT WATCHLIST ACTIVITY <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link ml-auto">View all →</a></div>
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
  country, region, role, evidenceData, pathwayData,
}: {
  country:       { iso2: string; label: string }
  region:        string
  role:          string
  evidenceData?: EvidenceData
  pathwayData?:  PathwayData
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
          <h2>{country.label}{role ? ` ${role}` : ''} Evidence &amp; Sources</h2>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all gaps →</a>
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
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View review queue →</a>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">CONFIDENCE METHODOLOGY</div>
          <p className="cc-right-prose">Weighted scoring across source authority, jurisdiction relevance, recency, and consistency.</p>
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View methodology →</a>
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
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View freshness report →</a>
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
      </aside>
    </div>
  )
})

// ── Placeholder pages (scaffolded, real content in next passes) ───────────────

const ScaffoldPage = React.memo(function ScaffoldPage({
  title, country, region, role,
}: {
  title: string
  country: { label: string }
  region: string
  role: string
}) {
  return (
    <div className="cc-page cc-scaffold">
      <div className="cc-scaffold-inner">
        <div className="cc-scaffold-icon">◎</div>
        <h2>{title}</h2>
        <p>{country.label}{region ? ` · ${region}` : ''} · {role || 'All roles'}</p>
        <div className="cc-scaffold-note">Full page implementation in progress</div>
      </div>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandCentre({
  signals,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  wantedCount = 0,
  marketplaceRows,
  pipeline,
  wantedListings = [],
  countryIntel,
  localIntel,
  pathwayData,
  watchlistData,
  evidenceData,
  liveTiles,
  recentEduModules,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const initialCountry = useMemo(() => {
    const found = COUNTRIES.find(c => c.iso2 === initialCountryIso2)
    return found ?? { iso2: 'GLOBAL', label: 'Global Market' }
  }, [initialCountryIso2])

  const router = useRouter()

  const [country,      setCountry]     = useState(initialCountry)
  const [region,       setRegion]      = useState('')
  const [role,         setRole]        = useState(initialRoleId ?? '')
  const [activePage,   setActivePage]  = useState<CommandPage>('briefing')
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
  const handleCountryChange = useCallback((iso2: string) => {
    const found = COUNTRIES.find(c => c.iso2 === iso2)
    if (!found) return
    // Navigate to the new country page so countryIntel re-fetches server-side.
    // Updating local state only leaves countryIntel stale (the FR/Ireland mismatch).
    const targetRole = role || initialRoleId || 'pharmacist'
    router.push(`/country/${found.slug}/role/${targetRole}`)
  }, [role, initialRoleId, router])

  const handleRoleChange = useCallback((roleId: string) => {
    setRole(roleId)
  }, [])

  // ── Page renderer ──────────────────────────────────────────────────────────
  const renderPage = useCallback(() => {
    const sharedProps = { country, region, role: roleLabel }
    switch (activePage) {
      case 'briefing':
        return <BriefingRoom country={country} region={region} role={role} roleLabel={roleLabel} countryIntel={countryIntel} signals={signals} onCountrySelect={handleCountryChange} />
      case 'access-pathway':
        return <AccessPathwayPage country={country} region={region} role={roleLabel} signals={signals} pathwayData={pathwayData} />
      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} pathwayData={pathwayData} />
      case 'evidence':
        return <EvidenceSourcesPage country={country} region={region} role={roleLabel} evidenceData={evidenceData} pathwayData={pathwayData} />
      case 'education':
        return <EducationPage country={country} region={region} role={roleLabel} eduCategories={eduCategories} liveTiles={liveTiles} recentEduModules={recentEduModules} signals={signals} pathwayData={pathwayData} />
      case 'regulatory':
        return <RegulatoryWatchPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} />
      case 'local-intel':
        return <LocalIntelPage country={country} region={region} role={roleLabel} signals={signals} countryIntel={countryIntel} localIntel={localIntel} />
      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} />
      case 'watchlist':
        return <WatchlistPage country={country} region={region} role={roleLabel} watchlistData={watchlistData} />
      case 'settings':
        return <SettingsPage country={country} region={region} role={role} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={handleCountryChange} onRoleChange={handleRoleChange} />
      default:
        return null
    }
  }, [activePage, country, region, role, roleLabel, countryIntel, localIntel, signals, marketplaceRows, wantedListings, wantedCount, eduCategories, liveTiles, recentEduModules, pathwayData, countryOptions, roleOptions, handleCountryChange, handleRoleChange, watchlistData, evidenceData])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cc-app">
      <style>{CSS}</style>

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
              <button className="cc-change-ctx" onClick={() => setActivePage('briefing')}>
                Change Context
              </button>
            )}
          </div>
        </div>

        <div className="cc-header-right">
          <div className="cc-role-selector">
            <span className="cc-role-label">ROLE</span>
            <CustomSelect
              value={role}
              options={roleOptions}
              placeholder="Select role"
              onChange={setRole}
              className="cc-role-select"
            />
          </div>

          <button
            className="cc-kbd-btn"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette (⌘K)"
          >
            ⌘K
          </button>

          <div className="cc-user-chip">
            <div className="cc-user-avatar">TC</div>
            <div className="cc-user-info">
              <strong>Taylor Chambers</strong>
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
                  onClick={() => setActivePage(item.id)}
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
        {NAV_SECTIONS[0].items.map(item => (
          <button
            key={item.id}
            className={`cc-mob-nav-btn${activePage === item.id ? ' active' : ''}`}
            onClick={() => setActivePage(item.id)}
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
        onPage={setActivePage}
      />
    </div>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* Tokens */
:root {
  --cc-gold:   #d4a84b;
  --cc-gold2:  #d9af63;
  --cc-ink:    #f5f0e8;
  --cc-text:   rgba(245,240,232,.92);
  --cc-muted:  rgba(245,240,232,.55);
  --cc-dim:    rgba(245,240,232,.32);
  --cc-line:   rgba(255,255,255,.08);
  --cc-line2:  rgba(255,255,255,.13);
  --cc-blue:   #5b9bd5;
  --cc-green:  #4caf82;
  --cc-amber:  #e6a533;
  --cc-violet: #9b72d0;
  --cc-red:    #e05555;
  --cc-sans:   'Inter', system-ui, sans-serif;
  --cc-serif:  'Georgia', serif;
  --cc-mono:   'JetBrains Mono', 'Fira Mono', monospace;
  --cc-header: 64px;
  --cc-sidebar:220px;
  --cc-radius: 12px;
}

/* Shell */
.cc-app {
  position:fixed;inset:0;
  display:grid;
  grid-template-columns:var(--cc-sidebar) minmax(0,1fr);
  grid-template-rows:var(--cc-header) minmax(0,1fr);
  background:linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);
  color:var(--cc-text);
  font-family:var(--cc-sans);
  overflow:hidden;
}

/* Header */
.cc-header {
  grid-column:1/-1;grid-row:1;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 20px 0 0;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.96);
  backdrop-filter:blur(12px);
  z-index:20;gap:0;
}
.cc-header-left {
  width:var(--cc-sidebar);flex-shrink:0;
  display:flex;align-items:center;
  padding:0 16px;
  border-right:1px solid var(--cc-line);
  height:100%;
}
.cc-wordmark { display:flex;flex-direction:column;gap:1px; }
.cc-wordmark-main {
  font-family:var(--cc-serif);font-size:13px;
  letter-spacing:.18em;color:var(--cc-gold);
  font-weight:600;
}
.cc-wordmark-sub {
  font-family:var(--cc-mono);font-size:7px;
  letter-spacing:.22em;color:var(--cc-dim);text-transform:uppercase;
}
.cc-header-centre {
  flex:1;padding:0 24px;display:flex;flex-direction:column;gap:2px;
}
.cc-breadcrumb {
  display:flex;align-items:center;gap:6px;
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.14em;color:var(--cc-dim);text-transform:uppercase;
}
.cc-bc-label { color:var(--cc-dim); }
.cc-bc-sep   { color:var(--cc-dim);opacity:.5; }
.cc-bc-region{ color:var(--cc-gold);font-weight:600; }
.cc-bc-select .cc-select-trigger {
  background:none;border:none;padding:0;
  color:var(--cc-gold);font-family:var(--cc-mono);
  font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  cursor:pointer;display:flex;align-items:center;gap:4px;
}
.cc-bc-select .cc-select-arrow { font-size:7px;opacity:.6; }
.cc-page-title {
  font-family:var(--cc-serif);font-size:22px;font-weight:400;
  color:var(--cc-ink);letter-spacing:-.01em;
  display:flex;align-items:center;gap:12px;
}
.cc-change-ctx {
  font-family:var(--cc-sans);font-size:11px;font-weight:500;
  padding:3px 10px;border-radius:20px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);cursor:pointer;
  transition:background .12s,color .12s;
}
.cc-change-ctx:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }

.cc-header-right {
  display:flex;align-items:center;gap:12px;flex-shrink:0;
}
.cc-role-selector {
  display:flex;flex-direction:column;align-items:flex-end;gap:1px;
}
.cc-role-label {
  font-family:var(--cc-mono);font-size:8px;
  letter-spacing:.16em;color:var(--cc-dim);text-transform:uppercase;
}
.cc-role-select .cc-select-trigger {
  background:none;border:none;padding:0;cursor:pointer;
  color:var(--cc-ink);font-size:13px;font-weight:500;
  display:flex;align-items:center;gap:6px;
}
.cc-role-select .cc-select-arrow { color:var(--cc-dim); }
.cc-kbd-btn {
  font-family:var(--cc-mono);font-size:10px;
  padding:5px 10px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);cursor:pointer;
  transition:background .12s,color .12s;
}
.cc-kbd-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-user-chip {
  display:flex;align-items:center;gap:10px;
  padding:6px 10px;border-radius:10px;
  border:1px solid var(--cc-line);background:rgba(255,255,255,.03);
  cursor:pointer;transition:background .12s;
}
.cc-user-chip:hover { background:rgba(255,255,255,.06); }
.cc-user-avatar {
  width:32px;height:32px;border-radius:50%;
  background:linear-gradient(135deg,var(--cc-gold),#8b6914);
  display:grid;place-items:center;
  font-size:11px;font-weight:700;color:#1a1000;flex-shrink:0;
}
.cc-user-info { display:flex;flex-direction:column;gap:1px; }
.cc-user-info strong { font-size:12px;font-weight:600;color:var(--cc-ink);line-height:1; }
.cc-user-info small  { font-size:10px;color:var(--cc-dim); }
.cc-user-arrow { color:var(--cc-dim);font-size:9px; }

/* Sidebar */
.cc-sidebar {
  grid-column:1;grid-row:2;
  display:flex;flex-direction:column;justify-content:space-between;
  padding:12px 10px;
  border-right:1px solid var(--cc-line);
  background:rgba(3,7,17,.7);
  overflow-y:auto;
}
.cc-sidebar-nav { display:flex;flex-direction:column;gap:2px; }
.cc-nav-btn {
  width:100%;height:38px;border-radius:10px;
  border:1px solid transparent;background:transparent;
  color:var(--cc-dim);
  display:flex;align-items:center;gap:10px;
  padding:0 10px;
  cursor:pointer;font:inherit;font-size:11px;text-align:left;
  transition:color .15s,background .15s,border-color .15s;
  flex-shrink:0;
}
.cc-nav-icon { font-size:13px;flex-shrink:0;width:16px;text-align:center; }
.cc-nav-btn em { font-style:normal;font-size:11px;white-space:nowrap;overflow:hidden; }
.cc-nav-btn:hover { color:var(--cc-text);background:rgba(255,255,255,.05); }
.cc-nav-btn.active {
  color:var(--cc-gold2);
  border-color:rgba(212,168,75,.25);
  background:rgba(212,168,75,.07);
}
.cc-sidebar-status {
  display:flex;align-items:center;gap:10px;
  padding:10px 10px;
  border-top:1px solid var(--cc-line);
  margin-top:8px;
}
.cc-status-dot {
  width:8px;height:8px;border-radius:50%;
  background:var(--cc-green);flex-shrink:0;
  box-shadow:0 0 6px var(--cc-green);
  animation:pulseDot 2.4s ease infinite;
}
.cc-sidebar-status strong { display:block;font-size:11px;color:var(--cc-text); }
.cc-sidebar-status small  { display:block;font-size:9px;color:var(--cc-dim); }

/* Main */
.cc-main {
  grid-column:2;grid-row:2;
  overflow-y:auto;overflow-x:hidden;
  background:rgba(4,9,20,.4);
}

/* CustomSelect dropdown */
.cc-select { position:relative; }
.cc-select-dropdown {
  position:absolute;top:calc(100% + 6px);left:0;
  background:#08172a;border:1px solid var(--cc-line2);
  border-radius:10px;padding:6px;
  min-width:180px;max-height:260px;overflow-y:auto;
  z-index:200;box-shadow:0 16px 48px rgba(0,0,0,.7);
}
.cc-select-opt {
  width:100%;text-align:left;padding:7px 10px;border-radius:7px;
  border:none;background:transparent;color:var(--cc-text);
  font:inherit;font-size:12px;cursor:pointer;
  transition:background .1s;
}
.cc-select-opt:hover,.cc-select-opt.selected { background:rgba(255,255,255,.07); }
.cc-select-opt.selected { color:var(--cc-gold); }

/* ── Briefing Room ──────────────────────────────────────────────────────────── */
.cc-page {
  height:100%;display:flex;
  animation:fadeSlideUp .3s ease;
}
.cc-briefing {
  display:grid;
  grid-template-columns:300px minmax(0,1fr) 300px;
  gap:0;height:100%;
}
.cc-briefing-left {
  padding:24px 20px;
  border-right:1px solid var(--cc-line);
  overflow-y:auto;display:flex;flex-direction:column;gap:16px;
  background:rgba(3,7,17,.5);
}
.cc-jx-brief { display:flex;align-items:center;gap:12px; }
.cc-jx-flag  { font-size:28px;line-height:1; }
.cc-jx-country {
  font-family:var(--cc-serif);font-size:20px;
  color:var(--cc-ink);font-weight:400;
}
.cc-jx-region {
  font-family:var(--cc-mono);font-size:11px;
  color:var(--cc-gold);letter-spacing:.1em;margin-top:2px;
}
.cc-jx-summary {
  font-size:12px;line-height:1.65;color:var(--cc-muted);
  border-left:2px solid var(--cc-gold);padding-left:12px;
}
.cc-jx-framing {
  font-size:11px;line-height:1.6;color:var(--cc-dim);
  font-style:italic;border-left:2px solid var(--cc-line);padding-left:12px;
}
.cc-jx-fields { display:flex;flex-direction:column;gap:10px; }
.cc-jx-field {
  display:flex;align-items:flex-start;gap:10px;
  padding:8px 10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
}
.cc-jx-field-icon {
  font-size:13px;color:var(--cc-gold);
  flex-shrink:0;margin-top:1px;
}
.cc-jx-field small  { display:block;font-size:9px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.1em; }
.cc-jx-field strong { display:block;font-size:12px;color:var(--cc-ink);margin-top:2px; }
.cc-jx-btn {
  margin-top:4px;padding:9px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  text-align:left;transition:background .12s,color .12s;
}
.cc-jx-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }

.cc-briefing-globe {
  display:flex;flex-direction:column;overflow:hidden;
}
.cc-globe-wrap {
  flex:1;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 45%,rgba(16,42,72,.6),transparent 70%),
             linear-gradient(180deg,#020814 0%,#010509 100%);
}
.cc-globe-loading {
  position:absolute;inset:0;
  background:radial-gradient(circle at 50% 45%,rgba(16,42,72,.4),transparent 70%);
}
.cc-globe-label {
  position:absolute;
  top:50%;left:50%;
  transform:translate(-50%,-50%) translateX(120px) translateY(40px);
  background:rgba(8,18,32,.92);border:1px solid var(--cc-line2);
  border-radius:8px;padding:5px 12px;
  font-size:12px;font-weight:500;color:var(--cc-ink);
  pointer-events:none;white-space:nowrap;
}
.cc-globe-hint {
  position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font-family:var(--cc-mono);font-size:9px;color:var(--cc-dim);
  letter-spacing:.12em;pointer-events:none;
}
.cc-methodology {
  display:flex;gap:0;
  border-top:1px solid var(--cc-line);
  background:rgba(3,7,17,.7);
  flex-shrink:0;
}
.cc-methodology-item {
  flex:1;display:flex;align-items:flex-start;gap:8px;
  padding:12px 14px;
  border-right:1px solid var(--cc-line);
}
.cc-methodology-item:last-child { border-right:none; }
.cc-methodology-icon { font-size:13px;color:var(--cc-gold);flex-shrink:0;margin-top:1px; }
.cc-methodology-item small { display:block;font-size:8px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.12em; }
.cc-methodology-item span  { display:block;font-size:9px;color:var(--cc-muted);margin-top:2px;line-height:1.4; }

.cc-briefing-right {
  padding:20px 16px;
  border-left:1px solid var(--cc-line);
  overflow-y:auto;display:flex;flex-direction:column;gap:20px;
  background:rgba(3,7,17,.5);
}
.cc-right-section { display:flex;flex-direction:column;gap:10px; }
.cc-right-head {
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.18em;color:var(--cc-dim);
  text-transform:uppercase;display:flex;align-items:center;gap:6px;
}
.cc-right-info { color:var(--cc-dim);cursor:help; }
.cc-right-link {
  font-size:10px;color:var(--cc-gold);
  background:none;border:none;padding:0;
  cursor:pointer;text-align:left;
  transition:opacity .12s;font-family:inherit;
}
.cc-right-link:hover { opacity:.75; }

.cc-confidence-summary { display:flex;gap:14px;align-items:flex-start; }
.cc-confidence-donut   { position:relative;width:72px;height:72px;flex-shrink:0; }
.cc-donut-svg          { width:100%;height:100%; }
.cc-donut-label {
  position:absolute;inset:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
}
.cc-donut-label strong { font-size:16px;font-weight:700;color:var(--cc-gold);line-height:1; }
.cc-donut-label small  { font-size:7px;color:var(--cc-dim);text-align:center;line-height:1.3; }
.cc-confidence-bars    { flex:1;display:flex;flex-direction:column;gap:6px; }
.cc-conf-bar-row       { display:flex;align-items:center;gap:6px; }
.cc-conf-bar-lbl       { font-size:9px;color:var(--cc-muted);width:100px;flex-shrink:0; }
.cc-conf-bar-track     { flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden; }
.cc-conf-bar-fill      { height:100%;background:var(--cc-gold);border-radius:2px; }
.cc-conf-bar-pct       { font-family:var(--cc-mono);font-size:9px;color:var(--cc-muted);width:28px;text-align:right; }

.cc-watch-regions     { display:flex;flex-direction:column;gap:6px; }
.cc-watch-region-row  { display:flex;align-items:center;gap:8px; }
.cc-watch-region-star { color:var(--cc-gold);font-size:11px;flex-shrink:0; }
.cc-watch-region-info { flex:1; }
.cc-watch-region-info strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-watch-region-info small  { display:block;font-size:9px;color:var(--cc-dim); }
.cc-watch-region-btn {
  font-size:9px;padding:3px 8px;border-radius:5px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);cursor:pointer;font:inherit;
  transition:background .1s;flex-shrink:0;
}
.cc-watch-region-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }

.cc-change-notes  { display:flex;flex-direction:column;gap:8px; }
.cc-change-note   { display:flex;gap:8px;align-items:flex-start; }
.cc-change-arrow  { font-size:12px;flex-shrink:0;margin-top:1px; }
.cc-change-arrow.up      { color:var(--cc-green); }
.cc-change-arrow.neutral { color:var(--cc-amber); }
.cc-change-note strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-change-note small  { display:block;font-size:10px;color:var(--cc-muted);line-height:1.4; }
.cc-change-time        { display:block;font-size:9px;color:var(--cc-dim);margin-top:2px; }

/* Scaffold placeholder */
.cc-scaffold {
  width:100%;display:flex;align-items:center;justify-content:center;
}
.cc-scaffold-inner {
  text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;
}
.cc-scaffold-icon { font-size:32px;color:var(--cc-gold);opacity:.4; }
.cc-scaffold-inner h2 { font-family:var(--cc-serif);font-size:24px;font-weight:400;color:var(--cc-ink); }
.cc-scaffold-inner p  { font-size:13px;color:var(--cc-muted); }
.cc-scaffold-note {
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.14em;color:var(--cc-dim);
  padding:6px 14px;border-radius:20px;
  border:1px solid var(--cc-line);background:rgba(255,255,255,.02);
}

/* Command palette */
.cp-overlay {
  position:fixed;inset:0;background:rgba(0,0,0,.7);
  backdrop-filter:blur(4px);z-index:500;
  display:grid;place-items:start center;padding-top:80px;
}
.cp-modal {
  width:100%;max-width:540px;
  background:#060f1e;border:1px solid var(--cc-line2);
  border-radius:14px;overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.8);
}
.cp-search-row {
  display:flex;align-items:center;gap:10px;
  padding:14px 16px;border-bottom:1px solid var(--cc-line);
}
.cp-search-icon { color:var(--cc-gold);font-size:14px;flex-shrink:0; }
.cp-input {
  flex:1;background:none;border:none;outline:none;
  color:var(--cc-text);font:inherit;font-size:14px;
}
.cp-clear {
  background:none;border:none;color:var(--cc-dim);
  cursor:pointer;font-size:16px;padding:0 4px;
}
.cp-results { max-height:340px;overflow-y:auto;padding:8px; }
.cp-group-label {
  padding:6px 10px 4px;
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.16em;color:var(--cc-dim);text-transform:uppercase;
}
.cp-item {
  width:100%;display:flex;align-items:center;gap:10px;
  padding:9px 10px;border-radius:8px;
  border:none;background:transparent;
  color:var(--cc-text);font:inherit;font-size:12px;
  cursor:pointer;text-align:left;
  transition:background .1s;
}
.cp-item:hover,.cp-item.focused { background:rgba(255,255,255,.07); }
.cp-item-icon { color:var(--cc-gold);font-size:13px;flex-shrink:0; }
.cp-item small { margin-left:auto;color:var(--cc-dim);font-size:10px; }
.cp-empty { padding:20px;text-align:center;color:var(--cc-dim);font-size:12px; }
.cp-footer {
  display:flex;align-items:center;gap:16px;
  padding:10px 16px;border-top:1px solid var(--cc-line);
  font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono);
}
.cp-footer-ctx { margin-left:auto;color:var(--cc-muted); }

/* Animations */
@keyframes fadeSlideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseDot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

/* ── Shared two-column page layout ─────────────────────────────────────────── */
.cc-two-col-page {
  display:grid;
  grid-template-columns:minmax(0,1fr) 280px;
  height:100%;
  overflow:hidden;
}
.cc-two-main {
  overflow-y:auto;overflow-x:hidden;
  display:flex;flex-direction:column;
  padding:0;
}
.cc-two-right {
  overflow-y:auto;
  padding:20px 16px;
  border-left:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);
  display:flex;flex-direction:column;gap:20px;
}
.cc-inner-header {
  padding:24px 24px 0;
  border-bottom:1px solid var(--cc-line);
  padding-bottom:16px;
  flex-shrink:0;
}
.cc-inner-header h2 {
  font-family:var(--cc-serif);font-size:22px;font-weight:400;
  color:var(--cc-ink);margin:0 0 6px;
}
.cc-inner-header p { font-size:12px;color:var(--cc-muted);margin:0;line-height:1.55; }
.cc-section-label {
  font-family:var(--cc-mono);font-size:9px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
  padding:16px 24px 8px;flex-shrink:0;
}
.cc-filter-bar {
  display:flex;align-items:center;gap:8px;
  padding:12px 24px;
  border-bottom:1px solid var(--cc-line);
  flex-shrink:0;background:rgba(3,7,17,.3);
}
.cc-filter-sel .cc-select-trigger {
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);
  border-radius:8px;padding:5px 10px;cursor:pointer;
  color:var(--cc-text);font:inherit;font-size:11px;
  display:flex;align-items:center;gap:6px;white-space:nowrap;
}
.cc-filter-sel .cc-select-arrow { color:var(--cc-dim);font-size:9px; }
.cc-filter-clear {
  background:none;border:1px solid var(--cc-line);border-radius:8px;
  padding:5px 10px;color:var(--cc-muted);font:inherit;font-size:11px;
  cursor:pointer;white-space:nowrap;transition:color .12s,border-color .12s;
}
.cc-filter-clear:hover { color:var(--cc-text);border-color:var(--cc-line2); }
.cc-empty-state {
  flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:10px;padding:40px;text-align:center;
  color:var(--cc-muted);font-size:13px;
}
.cc-empty-state span { font-size:28px;color:var(--cc-gold);opacity:.4; }
.cc-feed-footer {
  display:flex;align-items:center;gap:16px;
  padding:12px 24px;
  border-top:1px solid var(--cc-line);
  font-size:11px;color:var(--cc-dim);flex-shrink:0;
  background:rgba(3,7,17,.4);flex-wrap:wrap;
}
.cc-auto-refresh { display:flex;align-items:center;gap:6px;margin-left:auto; }
.cc-refresh-dot {
  width:6px;height:6px;border-radius:50%;background:var(--cc-green);
  box-shadow:0 0 5px var(--cc-green);flex-shrink:0;
  animation:pulseDot 2s ease infinite;
}
.cc-pagination { display:flex;gap:3px;align-items:center; }
.cc-page-btn {
  min-width:26px;height:26px;border-radius:6px;
  border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  transition:background .1s,color .1s;padding:0 6px;
}
.cc-page-btn:hover,.cc-page-btn.active {
  background:rgba(212,168,75,.1);border-color:rgba(212,168,75,.3);color:var(--cc-gold);
}
.cc-right-prose {
  font-size:11px;line-height:1.65;color:var(--cc-muted);margin:0;
}
.cc-nba-btn {
  display:block;width:auto;padding:8px 14px;border-radius:8px;
  background:linear-gradient(135deg,var(--cc-gold),#a87c1e);
  border:none;color:#0b1a2f;font:inherit;font-size:11px;font-weight:700;
  cursor:pointer;transition:opacity .12s;text-align:left;
}
.cc-nba-btn.full { width:100%;text-align:center; }
.cc-nba-btn:hover { opacity:.88; }
.cc-nba-card {
  display:flex;gap:10px;align-items:flex-start;
  padding:10px;border-radius:8px;
  background:rgba(212,168,75,.06);border:1px solid rgba(212,168,75,.15);
}
.cc-nba-card-icon { font-size:16px;color:var(--cc-gold);flex-shrink:0;margin-top:1px; }
.cc-nba-card strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-nba-card small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-nba-card p      { font-size:10px;color:var(--cc-muted);margin:4px 0 0;line-height:1.5; }
.cc-need-help {
  display:flex;align-items:flex-start;gap:10px;
  padding:10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
}
.cc-need-help span { font-size:18px;color:var(--cc-gold);flex-shrink:0; }
.cc-need-help p    { font-size:11px;color:var(--cc-muted);margin:0; }
.cc-mini-donut { width:36px;height:36px;flex-shrink:0; }
.cc-imp-badge {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:3px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0;
  letter-spacing:.06em;text-transform:uppercase;
}
.cc-imp-badge.high   { background:rgba(224,85,85,.15);color:#e05555;border:1px solid rgba(224,85,85,.3); }
.cc-imp-badge.medium { background:rgba(230,165,51,.15);color:#e6a533;border:1px solid rgba(230,165,51,.3); }
.cc-imp-badge.low    { background:rgba(255,255,255,.06);color:var(--cc-dim);border:1px solid var(--cc-line2); }
.cc-saved-row {
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-saved-row:last-of-type { border-bottom:none; }
.cc-saved-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-saved-row small  { display:block;font-size:9px;color:var(--cc-dim); }
.cc-apply-btn {
  padding:3px 10px;border-radius:6px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:10px;cursor:pointer;
  flex-shrink:0;transition:background .1s,color .1s;
}
.cc-apply-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-topic-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:5px 0;border-bottom:1px solid var(--cc-line);font-size:11px;color:var(--cc-muted);
}
.cc-topic-row:last-of-type { border-bottom:none; }
.cc-topic-count {
  font-family:var(--cc-mono);font-size:10px;font-weight:700;
  padding:1px 7px;border-radius:10px;
  background:rgba(212,168,75,.12);color:var(--cc-gold);
  border:1px solid rgba(212,168,75,.2);flex-shrink:0;
}
.ml-auto { margin-left:auto; }

/* ── Signals page ────────────────────────────────────────────────────────────── */
.cc-sig-feed { flex:1;overflow-y:auto;padding:0 0 16px; }
.cc-sig-group { margin-bottom:2px; }
.cc-sig-group-hd {
  display:flex;align-items:center;gap:8px;
  padding:10px 24px;
  font-family:var(--cc-mono);font-size:9px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
  background:rgba(255,255,255,.02);border-bottom:1px solid var(--cc-line);
  font-weight:700;
}
.cc-sig-group-hd span { font-size:12px;color:var(--cc-gold); }
.cc-sig-row {
  display:grid;
  grid-template-columns:12px 1fr 220px 72px 44px 80px 200px;
  align-items:center;gap:12px;
  padding:14px 24px;
  border-bottom:1px solid var(--cc-line);
  transition:background .1s;
}
.cc-sig-row:hover { background:rgba(255,255,255,.025); }
.cc-sig-dot {
  width:8px;height:8px;border-radius:50%;flex-shrink:0;
}
.cc-sig-dot.high   { background:#e05555;box-shadow:0 0 5px rgba(224,85,85,.5); }
.cc-sig-dot.medium { background:#e6a533;box-shadow:0 0 5px rgba(230,165,51,.4); }
.cc-sig-dot.low    { background:var(--cc-dim); }
.cc-sig-body strong { display:block;font-size:12px;color:var(--cc-ink);line-height:1.4; }
.cc-sig-body small  { display:block;font-size:10px;color:var(--cc-dim);margin-top:2px; }
.cc-sig-why em   { display:block;font-style:normal;font-size:9px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px; }
.cc-sig-why span { font-size:10px;color:var(--cc-muted);line-height:1.4; }
.cc-sig-date em  { display:block;font-style:normal;font-size:9px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px; }
.cc-sig-date span{ font-size:10px;color:var(--cc-muted); }
.cc-sig-acts { display:flex;flex-direction:column;gap:4px;align-items:flex-start; }
.cc-sig-brief {
  padding:5px 12px;border-radius:6px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-text);font:inherit;font-size:10px;cursor:pointer;
  transition:background .1s;white-space:nowrap;
}
.cc-sig-brief:hover { background:rgba(255,255,255,.08); }
.cc-sig-watch {
  background:none;border:none;color:var(--cc-dim);font:inherit;
  font-size:10px;cursor:pointer;padding:2px 0;
  transition:color .1s;white-space:nowrap;
}
.cc-sig-watch:hover { color:var(--cc-gold); }

/* ── Marketplace page ────────────────────────────────────────────────────────── */
.cc-mkt-tabs {
  display:flex;align-items:center;gap:0;
  padding:0 24px;
  border-bottom:1px solid var(--cc-line);
  flex-shrink:0;overflow-x:auto;
}
.cc-mkt-tab {
  padding:12px 14px;border:none;background:none;
  color:var(--cc-dim);font:inherit;font-size:12px;cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;
  white-space:nowrap;display:flex;align-items:center;gap:6px;
  transition:color .12s,border-color .12s;flex-shrink:0;
}
.cc-mkt-tab:hover { color:var(--cc-text); }
.cc-mkt-tab.active { color:var(--cc-gold);border-bottom-color:var(--cc-gold); }
.cc-tab-badge {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:1px 6px;border-radius:10px;
  background:rgba(212,168,75,.15);color:var(--cc-gold);
}
.cc-mkt-filters {
  display:flex;align-items:center;gap:8px;
  padding:10px 24px;border-bottom:1px solid var(--cc-line);
  flex-shrink:0;background:rgba(3,7,17,.3);
}
.cc-mkt-search-wrap {
  flex:1;display:flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);
  border-radius:8px;padding:6px 12px;
  font-size:14px;color:var(--cc-dim);
}
.cc-mkt-search {
  flex:1;background:none;border:none;outline:none;
  color:var(--cc-text);font:inherit;font-size:12px;
}
.cc-mkt-filter-btn {
  padding:6px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  white-space:nowrap;transition:background .1s;flex-shrink:0;
}
.cc-mkt-filter-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-mkt-table { flex:1;overflow-y:auto; }
.cc-mkt-thead {
  display:grid;
  grid-template-columns:2fr 100px 120px 130px 110px 56px 200px;
  gap:8px;padding:8px 24px;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);position:sticky;top:0;z-index:2;
}
.cc-mkt-th {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.14em;
  color:var(--cc-dim);text-transform:uppercase;display:flex;align-items:center;
}
.cc-mkt-row {
  display:grid;
  grid-template-columns:2fr 100px 120px 130px 110px 56px 200px;
  gap:8px;padding:14px 24px;
  border-bottom:1px solid var(--cc-line);align-items:center;
  transition:background .1s;
}
.cc-mkt-row:hover { background:rgba(255,255,255,.025); }
.cc-mkt-cell { font-size:12px;color:var(--cc-text);min-width:0; }
.opp-col { display:flex;align-items:flex-start;gap:10px; }
.cc-opp-icon {
  width:34px;height:34px;border-radius:8px;flex-shrink:0;
  background:rgba(212,168,75,.1);border:1px solid rgba(212,168,75,.2);
  display:grid;place-items:center;font-size:14px;color:var(--cc-gold);
}
.cc-opp-body strong { display:block;font-size:12px;color:var(--cc-ink);line-height:1.3; }
.cc-opp-body p      { font-size:10px;color:var(--cc-muted);margin:2px 0;line-height:1.4; }
.cc-opp-tag {
  display:inline-block;font-size:9px;font-weight:600;
  padding:1px 7px;border-radius:4px;
  background:rgba(91,155,213,.12);color:#5b9bd5;border:1px solid rgba(91,155,213,.2);
}
.cc-juris-cell { display:flex;flex-direction:column;gap:3px; }
.cc-export-tag {
  display:inline-block;font-size:9px;font-weight:600;
  padding:1px 6px;border-radius:4px;
  background:rgba(76,175,130,.1);color:var(--cc-green);border:1px solid rgba(76,175,130,.2);
}
.cc-verify-badge {
  font-size:10px;font-weight:600;display:flex;align-items:center;gap:4px;
}
.cc-verify-badge.ok      { color:var(--cc-green); }
.cc-verify-badge.pending { color:var(--cc-amber); }
.cc-acts-col { display:flex;flex-direction:column;gap:4px; }
.cc-act-primary {
  padding:5px 12px;border-radius:6px;
  background:rgba(212,168,75,.12);border:1px solid rgba(212,168,75,.3);
  color:var(--cc-gold);font:inherit;font-size:10px;font-weight:600;
  cursor:pointer;transition:background .1s;white-space:nowrap;
}
.cc-act-primary:hover { background:rgba(212,168,75,.2); }
.cc-act-sec {
  padding:4px 12px;border-radius:6px;
  border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-muted);font:inherit;font-size:10px;cursor:pointer;
  transition:background .1s,color .1s;white-space:nowrap;
}
.cc-act-sec:hover { background:rgba(255,255,255,.05);color:var(--cc-text); }
.cc-req-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-req-row:last-of-type { border-bottom:none; }
.cc-req-icon { font-size:12px;flex-shrink:0;margin-top:1px;font-weight:700; }
.cc-req-icon.ok      { color:var(--cc-green); }
.cc-req-icon.pending { color:var(--cc-dim); }
.cc-req-icon.gap     { color:var(--cc-amber); }
.cc-req-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-req-row small  { display:block;font-size:10px;color:var(--cc-dim); }

/* ── Education page ──────────────────────────────────────────────────────────── */
.cc-edu-header-row {
  display:flex;align-items:flex-start;gap:14px;
}
.cc-edu-hd-icon {
  font-size:28px;color:var(--cc-gold);flex-shrink:0;margin-top:3px;
}
.cc-edu-modules {
  display:flex;flex-direction:column;gap:0;
  padding:0 24px;flex-shrink:0;
}
.cc-edu-row {
  display:grid;
  grid-template-columns:44px 1fr 160px 120px;
  gap:12px;align-items:center;
  padding:16px 0;
  border-bottom:1px solid var(--cc-line);
}
.cc-edu-row:last-child { border-bottom:none; }
.cc-edu-row-icon {
  width:36px;height:36px;border-radius:50%;flex-shrink:0;
  background:rgba(212,168,75,.08);border:1px solid rgba(212,168,75,.18);
  display:grid;place-items:center;font-size:14px;
}
.cc-edu-row-body strong { display:block;font-size:12px;color:var(--cc-ink);line-height:1.3; }
.cc-edu-row-body p      { font-size:10px;color:var(--cc-muted);margin:3px 0;line-height:1.5; }
.cc-edu-row-title { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
.cc-edu-badge {
  font-family:var(--cc-mono);font-size:8px;font-weight:700;letter-spacing:.1em;
  padding:2px 7px;border-radius:4px;text-transform:uppercase;flex-shrink:0;
}
.cc-edu-badge.required    { background:rgba(91,155,213,.12);color:#5b9bd5;border:1px solid rgba(91,155,213,.25); }
.cc-edu-badge.recommended { background:rgba(155,114,208,.12);color:var(--cc-violet);border:1px solid rgba(155,114,208,.25); }
.cc-edu-badge.optional    { background:rgba(255,255,255,.05);color:var(--cc-dim);border:1px solid var(--cc-line2); }
.cc-edu-time { font-size:10px;color:var(--cc-dim);display:flex;align-items:center;gap:4px; }
.cc-edu-row-prog { display:flex;flex-direction:column;gap:5px; }
.cc-edu-pct  { font-size:10px;color:var(--cc-muted); }
.cc-edu-ns   { font-size:10px;color:var(--cc-dim); }
.cc-edu-track {
  height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;
}
.cc-edu-fill {
  height:100%;background:var(--cc-gold);border-radius:2px;
  transition:width .4s ease;
}
.cc-edu-cta {
  padding:7px 14px;border-radius:8px;font:inherit;font-size:11px;font-weight:500;
  cursor:pointer;white-space:nowrap;transition:background .1s,color .1s;
}
.cc-edu-cta.continue {
  background:rgba(212,168,75,.12);border:1px solid rgba(212,168,75,.3);color:var(--cc-gold);
}
.cc-edu-cta.continue:hover { background:rgba(212,168,75,.2); }
.cc-edu-cta.start {
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);color:var(--cc-muted);
}
.cc-edu-cta.start:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-edu-pathway-wrap {
  padding:20px 24px;
  border-top:1px solid var(--cc-line);
  background:rgba(3,7,17,.3);flex-shrink:0;
}
.cc-edu-steps {
  display:flex;align-items:center;flex-wrap:wrap;gap:6px;
  padding:12px 0;
}
.cc-edu-step {
  display:flex;flex-direction:column;align-items:center;gap:4px;min-width:80px;
}
.cc-edu-step-circ {
  width:32px;height:32px;border-radius:50%;
  display:grid;place-items:center;font-size:12px;
  border:2px solid var(--cc-line2);
  background:rgba(255,255,255,.04);
}
.cc-edu-step.unlocked .cc-edu-step-circ {
  border-color:var(--cc-gold);background:rgba(212,168,75,.12);color:var(--cc-gold);
}
.cc-edu-step.locked .cc-edu-step-circ { color:var(--cc-dim); }
.cc-edu-step-name { font-size:10px;color:var(--cc-text);text-align:center;line-height:1.3; }
.cc-edu-step-st   { font-family:var(--cc-mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase; }
.cc-edu-step.unlocked .cc-edu-step-st { color:var(--cc-gold); }
.cc-edu-step.locked   .cc-edu-step-st { color:var(--cc-dim); }
.cc-step-arrow { color:var(--cc-dim);font-size:16px;flex-shrink:0; }
.cc-edu-pathway-foot {
  display:flex;align-items:center;justify-content:space-between;
  padding-top:8px;gap:12px;
}
.cc-edu-pathway-foot p  { font-size:11px;color:var(--cc-muted);margin:0; }
.cc-edu-pathway-btn {
  padding:7px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  white-space:nowrap;flex-shrink:0;transition:background .1s,color .1s;
}
.cc-edu-pathway-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-edu-ev-row {
  display:flex;gap:8px;align-items:flex-start;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-edu-ev-row:last-of-type { border-bottom:none; }
.cc-edu-ev-icon { font-size:13px;color:var(--cc-dim);flex-shrink:0;margin-top:1px; }
.cc-edu-ev-row strong  { display:block;font-size:11px;color:var(--cc-ink);line-height:1.3; }
.cc-edu-ev-row small   { display:block;font-size:10px;color:var(--cc-dim); }
.cc-edu-ev-meta { display:flex;align-items:center;gap:6px;margin-top:2px; }
.cc-edu-ev-tag {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.1em;
  padding:1px 6px;border-radius:3px;text-transform:uppercase;
  background:rgba(255,255,255,.06);color:var(--cc-dim);border:1px solid var(--cc-line);
}

/* ── Regulatory Watch ────────────────────────────────────────────────────────── */
.cc-rw-summary {
  display:grid;grid-template-columns:repeat(4,1fr);gap:0;
  border-bottom:1px solid var(--cc-line);flex-shrink:0;
}
.cc-rw-card {
  padding:16px 18px;border-right:1px solid var(--cc-line);
  display:flex;flex-direction:column;gap:6px;
}
.cc-rw-card:last-child { border-right:none; }
.cc-rw-card-lbl {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
}
.cc-rw-card strong,.cc-rw-posture-title {
  font-size:12px;font-weight:600;color:var(--cc-ink);line-height:1.3;
}
.cc-rw-card p { font-size:10px;color:var(--cc-muted);line-height:1.5;margin:0; }
.cc-rw-operating { display:flex;align-items:center;gap:8px; }
.cc-rw-conf-card { grid-column:span 1; }
.cc-rw-conf-inner { display:flex;gap:10px;align-items:flex-start; }
.cc-rw-donut-wrap {
  position:relative;width:48px;height:48px;flex-shrink:0;
}
.cc-rw-donut-wrap .cc-donut-svg { width:100%;height:100%; }
.cc-rw-donut-wrap .cc-donut-label {
  position:absolute;inset:0;display:grid;place-items:center;
}
.cc-rw-donut-wrap .cc-donut-label strong { font-size:11px;color:var(--cc-gold); }
.cc-rw-conf-bars { flex:1;display:flex;flex-direction:column;gap:4px; }
.cc-conf-mini-row {
  display:grid;grid-template-columns:90px 1fr 28px;
  align-items:center;gap:5px;
}
.cc-conf-mini-row span:first-child { font-size:9px;color:var(--cc-muted); }
.cc-rw-change-date { font-size:11px;color:var(--cc-gold); }
.cc-rw-table-wrap { flex:1;overflow-y:auto; }
.cc-rw-thead {
  display:grid;
  grid-template-columns:2fr 120px 160px 100px 80px 90px 120px 100px;
  gap:8px;padding:8px 24px;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);position:sticky;top:0;z-index:2;
}
.cc-rw-row {
  display:grid;
  grid-template-columns:2fr 120px 160px 100px 80px 90px 120px 100px;
  gap:8px;padding:13px 24px;
  border-bottom:1px solid var(--cc-line);align-items:center;
  transition:background .1s;
}
.cc-rw-row:hover { background:rgba(255,255,255,.025); }
.cc-rw-cell { font-size:11px;color:var(--cc-text);min-width:0; }
.cc-rw-cell.event-col { display:flex;align-items:flex-start;gap:8px; }
.cc-rw-cell strong { display:block;font-size:11px;color:var(--cc-ink);line-height:1.3; }
.cc-rw-cell small  { display:block;font-size:9px;color:var(--cc-dim);margin-top:2px; }
.cc-rw-conf-cell { display:flex;flex-direction:column;gap:3px; }
.cc-rw-impact {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:2px 7px;border-radius:4px;white-space:nowrap;
}
.cc-rw-impact.high   { color:#e05555;background:rgba(224,85,85,.1); }
.cc-rw-impact.medium { color:#e6a533;background:rgba(230,165,51,.1); }
.cc-rw-impact.low    { color:var(--cc-dim);background:rgba(255,255,255,.05); }
.cc-affects-yes {
  font-size:10px;font-weight:600;color:var(--cc-green);
  display:flex;align-items:center;gap:3px;
}
.cc-source-badge {
  font-size:9px;padding:2px 7px;border-radius:4px;
  background:rgba(91,155,213,.1);color:#5b9bd5;
  border:1px solid rgba(91,155,213,.2);white-space:nowrap;
}
.cc-trigger-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:5px 0;border-bottom:1px solid var(--cc-line);
  font-size:11px;color:var(--cc-muted);
}
.cc-trigger-row:last-of-type { border-bottom:none; }
.cc-trigger-dot { font-size:10px;color:var(--cc-dim);flex-shrink:0; }
.cc-trigger-dot.on { color:var(--cc-green); }
.cc-comp-row {
  display:flex;align-items:center;gap:6px;
  padding:5px 0;border-bottom:1px solid var(--cc-line);
  font-size:11px;
}
.cc-comp-row:last-of-type { border-bottom:none; }
.cc-comp-label { flex:1;color:var(--cc-muted); }
.cc-comp-status { font-size:10px;color:var(--cc-dim); }
.cc-comp-status.active { color:var(--cc-amber); }
.cc-comp-dot { font-size:8px;color:var(--cc-dim);flex-shrink:0; }
.cc-comp-dot.active { color:var(--cc-amber); }
.cc-policy-q {
  display:flex;gap:8px;align-items:flex-start;
  padding:5px 0;border-bottom:1px solid var(--cc-line);
  font-size:11px;color:var(--cc-muted);line-height:1.4;
}
.cc-policy-q:last-of-type { border-bottom:none; }
.cc-policy-q-icon {
  width:16px;height:16px;border-radius:50%;flex-shrink:0;
  background:rgba(255,255,255,.06);border:1px solid var(--cc-line2);
  display:grid;place-items:center;font-size:9px;color:var(--cc-dim);
}
.cc-source-gap-row {
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:5px 0;border-bottom:1px solid var(--cc-line);font-size:11px;color:var(--cc-muted);
}
.cc-source-gap-row:last-of-type { border-bottom:none; }
.cc-gap-badge {
  font-family:var(--cc-mono);font-size:8px;font-weight:700;
  padding:2px 7px;border-radius:4px;white-space:nowrap;flex-shrink:0;
}
.cc-gap-badge.high   { background:rgba(224,85,85,.1);color:#e05555;border:1px solid rgba(224,85,85,.2); }
.cc-gap-badge.medium { background:rgba(230,165,51,.1);color:#e6a533;border:1px solid rgba(230,165,51,.2); }

/* ── Settings page ───────────────────────────────────────────────────────────── */
.cc-settings-rows {
  display:flex;flex-direction:column;
  padding:0 24px;
}
.cc-settings-row {
  display:flex;align-items:flex-start;gap:16px;
  padding:20px 0;border-bottom:1px solid var(--cc-line);
}
.cc-settings-row:last-child { border-bottom:none; }
.cc-settings-row-icon {
  width:40px;height:40px;border-radius:10px;flex-shrink:0;
  background:rgba(212,168,75,.08);border:1px solid rgba(212,168,75,.18);
  display:grid;place-items:center;font-size:16px;color:var(--cc-gold);margin-top:2px;
}
.cc-settings-row-body { flex:1;min-width:0; }
.cc-settings-row-body strong { display:block;font-size:13px;color:var(--cc-ink);margin-bottom:4px; }
.cc-settings-row-body p { font-size:11px;color:var(--cc-muted);margin:0;line-height:1.5; }
.cc-settings-row-right {
  display:flex;align-items:center;gap:12px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;
}
.cc-settings-row-right > span:not(.cc-settings-chev) { font-size:12px;color:var(--cc-muted); }
.cc-settings-row-right > div > span { display:block;font-size:12px;color:var(--cc-text); }
.cc-settings-row-right > div > small { display:block;font-size:10px;color:var(--cc-dim); }
.cc-settings-chev { color:var(--cc-dim);font-size:16px;flex-shrink:0; }
.cc-settings-row-ctrl { display:flex;flex-direction:column;gap:3px;align-items:flex-end; }
.cc-settings-row-ctrl small { font-family:var(--cc-mono);font-size:8px;letter-spacing:.12em;color:var(--cc-dim);text-transform:uppercase; }
.cc-settings-sel .cc-select-trigger {
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);
  border-radius:8px;padding:5px 10px;cursor:pointer;
  color:var(--cc-text);font:inherit;font-size:12px;
  display:flex;align-items:center;gap:6px;white-space:nowrap;min-width:140px;
}
.cc-settings-sel .cc-select-arrow { color:var(--cc-dim); }
.cc-settings-juris { gap:16px;align-items:flex-end; }
.cc-settings-juris-col { display:flex;flex-direction:column;gap:4px; }
.cc-settings-juris-col small { font-family:var(--cc-mono);font-size:8px;letter-spacing:.12em;color:var(--cc-dim);text-transform:uppercase; }
.cc-settings-region { font-size:12px;color:var(--cc-text); }
.cc-settings-edit-btn {
  padding:6px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  transition:background .1s,color .1s;white-space:nowrap;
}
.cc-settings-edit-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-settings-notifs { gap:20px;align-items:flex-start; }
.cc-settings-notif-col { display:flex;flex-direction:column;gap:4px;align-items:flex-start;min-width:120px; }
.cc-settings-notif-col small:first-child { font-family:var(--cc-mono);font-size:8px;letter-spacing:.12em;color:var(--cc-dim);text-transform:uppercase; }
.cc-settings-notif-col small:last-child  { font-size:10px;color:var(--cc-dim); }
.cc-notif-desc { font-size:11px;font-weight:600;color:var(--cc-ink); }
.cc-toggle {
  position:relative;width:36px;height:20px;border-radius:10px;
  background:rgba(255,255,255,.1);border:1px solid var(--cc-line2);
  cursor:pointer;transition:background .2s,border-color .2s;padding:0;flex-shrink:0;
}
.cc-toggle.on { background:rgba(76,175,130,.3);border-color:var(--cc-green); }
.cc-toggle-thumb {
  position:absolute;top:2px;left:2px;
  width:14px;height:14px;border-radius:50%;
  background:var(--cc-dim);transition:transform .2s,background .2s;
}
.cc-toggle.on .cc-toggle-thumb { transform:translateX(16px);background:var(--cc-green); }
.cc-settings-display { gap:16px;align-items:flex-start; }
.cc-settings-display-col { display:flex;flex-direction:column;gap:4px;min-width:120px; }
.cc-settings-display-col small:first-child { font-family:var(--cc-mono);font-size:8px;letter-spacing:.12em;color:var(--cc-dim);text-transform:uppercase; }
.cc-settings-display-col small:last-child  { font-size:10px;color:var(--cc-dim); }
.cc-settings-account { flex-direction:column;align-items:stretch;gap:0; }
.cc-settings-account-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:7px 0;border-bottom:1px solid var(--cc-line);
  font-size:12px;color:var(--cc-muted);cursor:pointer;
  transition:color .1s;
}
.cc-settings-account-row:last-child { border-bottom:none; }
.cc-settings-account-row:hover { color:var(--cc-text); }
.cc-ctx-rows { display:flex;flex-direction:column;gap:8px; }
.cc-ctx-row {
  display:flex;align-items:center;gap:10px;
  padding:8px 10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
}
.cc-ctx-flag { font-size:16px;flex-shrink:0; }
.cc-ctx-row strong { display:block;font-size:12px;color:var(--cc-ink); }
.cc-ctx-row small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-preset-row {
  display:flex;align-items:center;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-preset-row:last-of-type { border-bottom:none; }
.cc-preset-icon  { font-size:12px;color:var(--cc-dim);flex-shrink:0; }
.cc-preset-label { flex:1;font-size:11px;color:var(--cc-ink); }
.cc-preset-type {
  font-family:var(--cc-mono);font-size:8px;font-weight:700;
  padding:2px 7px;border-radius:4px;flex-shrink:0;
}
.cc-preset-type.default { background:rgba(212,168,75,.12);color:var(--cc-gold);border:1px solid rgba(212,168,75,.2); }
.cc-preset-type.custom  { background:rgba(255,255,255,.05);color:var(--cc-dim);border:1px solid var(--cc-line); }
.cc-security-rows { display:flex;flex-direction:column;gap:8px; }
.cc-security-row {
  display:flex;align-items:center;gap:10px;
  padding:8px 10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
}
.cc-security-icon { font-size:14px;color:var(--cc-dim);flex-shrink:0; }
.cc-security-row > div { flex:1;min-width:0; }
.cc-security-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-security-row small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-security-badge {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:2px 8px;border-radius:4px;flex-shrink:0;
}
.cc-security-badge.enabled { background:rgba(76,175,130,.12);color:var(--cc-green);border:1px solid rgba(76,175,130,.2); }
.cc-security-badge.active  { background:rgba(91,155,213,.12);color:#5b9bd5;border:1px solid rgba(91,155,213,.2); }
.cc-signout-btn {
  width:100%;margin-top:10px;padding:8px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.03);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  transition:background .1s,color .1s;
}
.cc-signout-btn:hover { background:rgba(224,85,85,.1);color:#e05555;border-color:rgba(224,85,85,.2); }

/* ── Local Intel page ────────────────────────────────────────────────────────── */
.cc-li-header { gap:12px; }
.cc-li-header-title { display:flex;align-items:center;gap:10px;margin-bottom:4px; }
.cc-li-header-icon  { font-size:24px;line-height:1; }
.cc-li-refresh      { font-family:var(--cc-mono);font-size:9px;color:var(--cc-dim);letter-spacing:.08em; }

.cc-li-top {
  display:grid;grid-template-columns:1fr 1fr;gap:0;
  border-bottom:1px solid var(--cc-line);flex-shrink:0;
  min-height:240px;
}
.cc-li-notes-panel {
  padding:16px 20px;border-right:1px solid var(--cc-line);
  display:flex;flex-direction:column;
}
.cc-li-notes { display:flex;flex-direction:column;gap:8px;flex:1; }
.cc-li-note  { display:flex;align-items:flex-start;gap:8px;font-size:11px;color:var(--cc-muted);line-height:1.5; }
.cc-li-note-dot {
  width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px;
}
.cc-li-note.high .cc-li-note-dot   { background:#e05555; }
.cc-li-note.medium .cc-li-note-dot { background:#e6a533; }
.cc-li-note.low .cc-li-note-dot    { background:var(--cc-dim); }

.cc-li-auth-panel  { padding:16px 20px;display:flex;flex-direction:column;gap:8px; }
.cc-li-auth-header { display:flex;flex-direction:column;gap:6px; }
.cc-li-auth-legend {
  display:flex;flex-wrap:wrap;gap:10px;
  font-size:9px;color:var(--cc-dim);
}
.cc-li-auth-legend span { display:flex;align-items:center;gap:4px; }
.cc-auth-dot {
  width:7px;height:7px;border-radius:50%;flex-shrink:0;
}
.cc-auth-dot.primary    { background:var(--cc-gold); }
.cc-auth-dot.oversight  { background:#5b9bd5; }
.cc-auth-dot.enforcement{ background:var(--cc-green); }

/* Org chart */
.cc-li-org { display:flex;flex-direction:column;gap:0;align-items:center;flex:1; }
.cc-li-org-level {
  display:flex;gap:6px;justify-content:center;width:100%;
}
.cc-li-org-connector {
  width:1px;height:14px;background:var(--cc-line2);flex-shrink:0;
}
.cc-li-org-node {
  flex:1;max-width:180px;padding:7px 10px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.03);
  display:flex;flex-direction:column;gap:2px;cursor:default;
  transition:background .12s,border-color .12s;
}
.cc-li-org-node:hover { background:rgba(255,255,255,.06); }
.cc-li-org-node.primary     { border-color:rgba(212,168,75,.3);background:rgba(212,168,75,.06); }
.cc-li-org-node.oversight   { border-color:rgba(91,155,213,.25);background:rgba(91,155,213,.04); }
.cc-li-org-node.enforcement { border-color:rgba(76,175,130,.25);background:rgba(76,175,130,.04); }
.cc-li-org-node-name { font-size:10px;font-weight:600;color:var(--cc-ink);line-height:1.3; }
.cc-li-org-node-role { font-size:9px;color:var(--cc-dim); }
.cc-li-org-level.top .cc-li-org-node { max-width:260px; }
.cc-li-auth-footer {
  display:flex;align-items:center;justify-content:space-between;
  padding-top:6px;
}
.cc-li-auth-footer small { font-size:9px;color:var(--cc-dim); }

/* Bottom 4-col grid */
.cc-li-grid {
  display:grid;grid-template-columns:repeat(4,1fr);gap:0;
  flex:1;min-height:0;
}
.cc-li-grid-section {
  padding:16px 16px;border-right:1px solid var(--cc-line);
  overflow-y:auto;display:flex;flex-direction:column;
}
.cc-li-grid-section:last-child { border-right:none; }

.cc-li-muni-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:7px 0;border-bottom:1px solid var(--cc-line);
}
.cc-li-muni-row:last-of-type { border-bottom:none; }
.cc-li-muni-icon { font-size:11px;color:var(--cc-dim);flex-shrink:0;margin-top:2px; }
.cc-li-muni-body { flex:1;min-width:0; }
.cc-li-muni-body strong { display:block;font-size:10px;color:var(--cc-ink);line-height:1.3; }
.cc-li-muni-body small  { display:block;font-size:9px;color:var(--cc-dim); }
.cc-li-muni-badge {
  font-family:var(--cc-mono);font-size:8px;font-weight:700;
  padding:2px 6px;border-radius:4px;white-space:nowrap;flex-shrink:0;
}
.cc-li-muni-badge.high   { background:rgba(224,85,85,.12);color:#e05555;border:1px solid rgba(224,85,85,.2); }
.cc-li-muni-badge.medium { background:rgba(230,165,51,.12);color:#e6a533;border:1px solid rgba(230,165,51,.2); }
.cc-li-muni-badge.low    { background:rgba(76,175,130,.1);color:var(--cc-green);border:1px solid rgba(76,175,130,.2); }

.cc-li-item {
  display:flex;align-items:flex-start;gap:8px;
  padding:7px 0;border-bottom:1px solid var(--cc-line);
}
.cc-li-item:last-of-type { border-bottom:none; }
.cc-li-item-icon { font-size:11px;color:var(--cc-gold);flex-shrink:0;margin-top:2px; }
.cc-li-item strong { display:block;font-size:10px;font-weight:600;color:var(--cc-ink);line-height:1.3; }
.cc-li-item p      { font-size:9px;color:var(--cc-muted);margin:2px 0 0;line-height:1.5; }

.cc-li-gap-item {
  display:flex;align-items:flex-start;gap:8px;
  padding:7px 0;border-bottom:1px solid var(--cc-line);
}
.cc-li-gap-item:last-of-type { border-bottom:none; }
.cc-li-gap-item p { font-size:10px;color:var(--cc-muted);margin:0;line-height:1.5; }

.cc-li-auth-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:7px 0;border-bottom:1px solid var(--cc-line);
}
.cc-li-auth-row:last-of-type { border-bottom:none; }
.cc-li-auth-badge {
  width:28px;height:28px;border-radius:6px;flex-shrink:0;
  background:rgba(212,168,75,.08);border:1px solid rgba(212,168,75,.2);
  display:grid;place-items:center;font-size:12px;color:var(--cc-gold);
}
.cc-li-auth-row strong { display:block;font-size:10px;color:var(--cc-ink);line-height:1.3; }
.cc-li-auth-row small  { display:block;font-size:9px;color:var(--cc-dim); }

.cc-li-cov-row {
  display:flex;align-items:center;gap:6px;
  padding:5px 0;border-bottom:1px solid var(--cc-line);font-size:10px;
}
.cc-li-cov-row:last-of-type { border-bottom:none; }
.cc-li-cov-label { flex:1;color:var(--cc-muted);font-size:10px; }
.cc-li-cov-level { font-family:var(--cc-mono);font-size:8px;font-weight:700;flex-shrink:0; }
.cc-li-cov-level.high   { color:var(--cc-green); }
.cc-li-cov-level.medium { color:var(--cc-amber); }

/* ── Access Pathway page ─────────────────────────────────────────────────────── */
.cc-ap-strip {
  display:flex;align-items:flex-start;
  padding:20px 24px;
  border-bottom:1px solid var(--cc-line);
  gap:0;overflow-x:auto;flex-shrink:0;
  background:rgba(3,7,17,.3);
}
.cc-ap-node {
  display:flex;flex-direction:column;align-items:center;gap:5px;
  background:none;border:none;cursor:pointer;
  min-width:100px;max-width:140px;flex:1;
  padding:4px 6px;
}
.cc-ap-node-circle {
  width:36px;height:36px;border-radius:50%;
  border:2px solid var(--cc-line2);background:rgba(255,255,255,.04);
  display:grid;place-items:center;
  font-size:13px;font-weight:700;color:var(--cc-dim);
  transition:all .15s;flex-shrink:0;
}
.cc-ap-node.done   .cc-ap-node-circle { border-color:var(--cc-green);background:rgba(76,175,130,.12);color:var(--cc-green); }
.cc-ap-node.current .cc-ap-node-circle { border-color:var(--cc-gold);background:rgba(212,168,75,.12);color:var(--cc-gold); }
.cc-ap-node.selected .cc-ap-node-circle {
  border-color:var(--cc-gold);background:var(--cc-gold);
  color:#0b1a2f;box-shadow:0 0 14px rgba(212,168,75,.4);
  transform:scale(1.12);
}
.cc-ap-node-title  { font-size:10px;font-weight:600;color:var(--cc-muted);text-align:center;line-height:1.3; }
.cc-ap-node-status { font-family:var(--cc-mono);font-size:8px;color:var(--cc-dim);letter-spacing:.08em; }
.cc-ap-node.done   .cc-ap-node-title  { color:var(--cc-green); }
.cc-ap-node.done   .cc-ap-node-status { color:var(--cc-green); }
.cc-ap-node.selected .cc-ap-node-title { color:var(--cc-gold); }
.cc-ap-node.current .cc-ap-node-status { color:var(--cc-gold); }
.cc-ap-connector {
  flex:1;height:2px;background:var(--cc-line);
  align-self:center;margin-bottom:26px;min-width:16px;
}
.cc-ap-connector.done { background:var(--cc-green); }

.cc-ap-detail {
  flex:1;overflow-y:auto;display:flex;flex-direction:column;
}
.cc-ap-detail-head {
  padding:20px 24px 16px;
  border-bottom:1px solid var(--cc-line);flex-shrink:0;
}
.cc-ap-step-badge {
  font-family:var(--cc-mono);font-size:9px;letter-spacing:.16em;
  color:var(--cc-gold);text-transform:uppercase;
  display:block;margin-bottom:6px;
}
.cc-ap-detail-title {
  font-family:var(--cc-serif);font-size:20px;font-weight:400;
  color:var(--cc-ink);margin:0 0 6px;
}
.cc-ap-detail-cols {
  display:grid;grid-template-columns:1fr 1fr;gap:0;
  flex:1;min-height:0;
}
.cc-ap-detail-left {
  padding:20px 24px;border-right:1px solid var(--cc-line);
  display:flex;flex-direction:column;gap:12px;overflow-y:auto;
}
.cc-ap-detail-right {
  padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;
}
.cc-ap-section-lbl {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
}
.cc-ap-status-card {
  padding:14px;border-radius:10px;
  background:rgba(212,168,75,.05);border:1px solid rgba(212,168,75,.15);
  display:flex;flex-direction:column;gap:4px;
}
.cc-ap-status-pill {
  display:inline-block;font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:3px 10px;border-radius:20px;letter-spacing:.08em;
}
.cc-ap-status-pill.complete { background:rgba(76,175,130,.15);color:var(--cc-green);border:1px solid rgba(76,175,130,.3); }
.cc-ap-status-pill.progress { background:rgba(212,168,75,.15);color:var(--cc-gold);border:1px solid rgba(212,168,75,.3); }
.cc-ap-status-pill.pending  { background:rgba(255,255,255,.05);color:var(--cc-dim);border:1px solid var(--cc-line); }
.cc-ap-reqs { display:flex;flex-direction:column;gap:8px;flex:1; }
.cc-ap-req-row {
  display:flex;align-items:flex-start;gap:10px;
  padding:9px 12px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
  transition:background .1s;
}
.cc-ap-req-row.verified { background:rgba(76,175,130,.04);border-color:rgba(76,175,130,.15); }
.cc-ap-req-row:hover { background:rgba(255,255,255,.05); }
.cc-ap-req-icon { font-size:13px;flex-shrink:0;margin-top:1px;font-weight:700; }
.cc-ap-req-body { flex:1;min-width:0; }
.cc-ap-req-body strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-ap-req-body small  { display:block;font-size:10px;color:var(--cc-dim);margin-top:2px; }
.cc-ap-req-badge {
  font-family:var(--cc-mono);font-size:8px;font-weight:700;
  padding:2px 7px;border-radius:4px;white-space:nowrap;flex-shrink:0;
}
.cc-ap-req-badge.verified   { background:rgba(76,175,130,.12);color:var(--cc-green); }
.cc-ap-req-badge.in_review  { background:rgba(230,165,51,.12);color:var(--cc-amber); }
.cc-ap-req-badge.pending    { background:rgba(255,255,255,.05);color:var(--cc-dim); }
.cc-ap-req-badge.rejected   { background:rgba(224,85,85,.1);color:#e05555; }
.cc-ap-req-badge.waived     { background:rgba(255,255,255,.05);color:var(--cc-dim); }
.cc-ap-next-action {
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:16px 24px;
  border-top:1px solid var(--cc-line);
  background:rgba(212,168,75,.04);flex-shrink:0;
}
.cc-ap-na-content { display:flex;align-items:flex-start;gap:12px;flex:1; }
.cc-ap-na-arrow   { font-size:18px;color:var(--cc-gold);flex-shrink:0;margin-top:2px; }
.cc-ap-na-content strong { display:block;font-size:12px;color:var(--cc-ink); }
.cc-ap-na-content p      { font-size:11px;color:var(--cc-muted);margin:3px 0 0; }

/* ── Watchlist page ──────────────────────────────────────────────────────────── */
.cc-wl-table-wrap { flex:1;overflow-y:auto; }
.cc-wl-thead {
  display:grid;
  grid-template-columns:2.5fr 120px 140px 160px 60px 160px;
  gap:8px;padding:8px 24px;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);position:sticky;top:0;z-index:2;
}
.cc-wl-row {
  display:grid;
  grid-template-columns:2.5fr 120px 140px 160px 60px 160px;
  gap:8px;padding:14px 24px;
  border-bottom:1px solid var(--cc-line);align-items:center;
  transition:background .1s;cursor:pointer;
}
.cc-wl-row:hover { background:rgba(255,255,255,.025); }
.cc-wl-cell { font-size:11px;color:var(--cc-text);min-width:0; }
.cc-wl-cell.name-col { display:flex;align-items:flex-start;gap:10px; }
.cc-wl-item-icon {
  width:32px;height:32px;border-radius:8px;flex-shrink:0;
  background:rgba(212,168,75,.08);border:1px solid rgba(212,168,75,.15);
  display:grid;place-items:center;font-size:13px;color:var(--cc-gold);
}
.cc-wl-item-body { min-width:0; }
.cc-wl-item-body strong { display:block;font-size:11px;color:var(--cc-ink);line-height:1.3; }
.cc-wl-item-body small  { display:block;font-size:10px;color:var(--cc-dim);margin-top:1px; }
.cc-wl-tags { display:flex;flex-wrap:wrap;gap:3px;margin-top:3px; }
.cc-wl-type-badge {
  font-size:10px;font-weight:500;color:var(--cc-muted);
  text-transform:capitalize;white-space:nowrap;
}
.cc-wl-change-cell { display:flex;flex-direction:column;gap:2px; }
.cc-wl-change-cell span { font-size:11px;color:var(--cc-ink); }
.cc-wl-change-cell small{ font-size:10px;color:var(--cc-dim); }
.cc-wl-action-cell {
  display:flex;align-items:center;justify-content:space-between;
  font-size:11px;color:var(--cc-muted);
}
.cc-wl-rule-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-wl-rule-row:last-of-type { border-bottom:none; }
.cc-wl-rule-icon { font-size:12px;color:var(--cc-gold);flex-shrink:0;margin-top:2px; }
.cc-wl-rule-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-wl-rule-row small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-wl-suggestion {
  display:flex;align-items:flex-start;justify-content:space-between;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-wl-suggestion:last-of-type { border-bottom:none; }
.cc-wl-suggestion strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-wl-suggestion small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-wl-add-btn {
  width:24px;height:24px;border-radius:6px;flex-shrink:0;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:14px;cursor:pointer;
  display:grid;place-items:center;transition:background .1s,color .1s;
}
.cc-wl-add-btn:hover { background:rgba(212,168,75,.12);color:var(--cc-gold);border-color:rgba(212,168,75,.3); }
.cc-wl-notif-grid {
  display:grid;grid-template-columns:1fr 1fr;gap:8px;
  margin-top:4px;
}
.cc-wl-notif-card {
  padding:10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
  display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;
}
.cc-wl-notif-card.alert { background:rgba(224,85,85,.06);border-color:rgba(224,85,85,.2); }
.cc-wl-notif-card strong { font-size:20px;font-weight:700;color:var(--cc-ink);line-height:1; }
.cc-wl-notif-card.alert strong { color:#e05555; }
.cc-wl-notif-card small { font-size:9px;color:var(--cc-dim);line-height:1.3;text-align:center; }
.cc-wl-alert-note {
  display:block;margin-top:6px;
  font-family:var(--cc-mono);font-size:9px;color:#e05555;
  letter-spacing:.08em;
}

/* ── Evidence & Sources page ─────────────────────────────────────────────────── */
.cc-ev-summary {
  display:grid;grid-template-columns:220px repeat(4,1fr);gap:0;
  border-bottom:1px solid var(--cc-line);flex-shrink:0;
}
.cc-ev-stat-card {
  padding:14px 16px;border-right:1px solid var(--cc-line);
  display:flex;flex-direction:column;gap:4px;
}
.cc-ev-stat-card:last-child { border-right:none; }
.cc-ev-conf-wrap { display:flex;align-items:center;gap:10px; }
.cc-ev-conf-label { display:block;font-size:13px;font-weight:700;color:var(--cc-gold); }
.cc-ev-conf-wrap small { display:block;font-size:10px;color:var(--cc-dim); }
.cc-ev-stat-big {
  font-size:28px;font-weight:700;line-height:1;
}
.cc-ev-stat-big.verified    { color:var(--cc-green); }
.cc-ev-stat-big.needs-review{ color:var(--cc-amber); }
.cc-ev-stat-big.unknown     { color:var(--cc-violet); }
.cc-ev-stat-card small { font-size:10px;color:var(--cc-dim); }

.cc-ev-table-wrap { flex:1;overflow-y:auto; }
.cc-ev-thead {
  display:grid;
  grid-template-columns:2.5fr 140px 160px 160px 120px 130px 110px;
  gap:8px;padding:8px 24px;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);position:sticky;top:0;z-index:2;
}
.cc-ev-row {
  display:grid;
  grid-template-columns:2.5fr 140px 160px 160px 120px 130px 110px;
  gap:8px;padding:13px 24px;
  border-bottom:1px solid var(--cc-line);align-items:start;
  transition:background .1s;cursor:pointer;
}
.cc-ev-row:hover { background:rgba(255,255,255,.025); }
.cc-ev-cell { font-size:11px;color:var(--cc-text);min-width:0; }
.cc-ev-cell.ev-src-col { display:flex;align-items:flex-start;gap:8px; }
.cc-ev-src-icon { font-size:14px;color:var(--cc-dim);flex-shrink:0;margin-top:1px; }
.cc-ev-cell strong { display:block;font-size:11px;color:var(--cc-ink);line-height:1.3; }
.cc-ev-cell small  { display:block;font-size:10px;color:var(--cc-dim);margin-top:1px; }
.cc-ev-src-ref     { display:block;font-size:9px;color:var(--cc-dim);margin-top:2px;font-family:var(--cc-mono);letter-spacing:.04em; }
.cc-ev-juris-badge {
  font-family:var(--cc-mono);font-size:8px;font-weight:600;
  padding:2px 7px;border-radius:4px;
  background:rgba(91,155,213,.1);color:#5b9bd5;border:1px solid rgba(91,155,213,.2);
  white-space:nowrap;
}
.cc-ev-step-badge {
  font-size:10px;color:var(--cc-muted);
}
.cc-ev-step-badge small { color:var(--cc-green);font-size:9px; }
.cc-ev-conf-badge {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:2px 8px;border-radius:4px;
}
.cc-ev-conf-badge.high   { background:rgba(76,175,130,.12);color:var(--cc-green);border:1px solid rgba(76,175,130,.25); }
.cc-ev-conf-badge.medium { background:rgba(230,165,51,.12);color:var(--cc-amber);border:1px solid rgba(230,165,51,.25); }
.cc-ev-conf-badge.low    { background:rgba(224,85,85,.1);color:#e05555;border:1px solid rgba(224,85,85,.2); }
.cc-ev-date-cell { display:flex;flex-direction:column;gap:3px; }
.cc-ev-fresh {
  font-family:var(--cc-mono);font-size:8px;font-weight:600;letter-spacing:.08em;
}
.cc-ev-fresh.current   { color:var(--cc-green); }
.cc-ev-fresh.recent    { color:var(--cc-green); }
.cc-ev-fresh.due-soon  { color:var(--cc-amber); }
.cc-ev-fresh.overdue   { color:#e05555; }
.cc-ev-vis-badge { font-size:10px;color:var(--cc-muted); }
.cc-ev-section-divider {
  padding:8px 24px;
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
  background:rgba(255,255,255,.02);border-bottom:1px solid var(--cc-line);
}
.cc-ev-gap-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-ev-gap-row:last-of-type { border-bottom:none; }
.cc-ev-gap-dot { color:var(--cc-amber);font-size:8px;flex-shrink:0;margin-top:3px; }
.cc-ev-gap-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-ev-gap-row small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-ev-queue-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-ev-queue-row:last-of-type { border-bottom:none; }
.cc-ev-queue-dot         { font-size:8px;flex-shrink:0;margin-top:3px; }
.cc-ev-queue-dot.pending { color:var(--cc-amber); }
.cc-ev-queue-row strong  { display:block;font-size:11px;color:var(--cc-ink); }
.cc-ev-queue-row small   { display:block;font-size:10px;color:var(--cc-dim); }
.cc-ev-fresh-row {
  display:flex;align-items:center;gap:6px;
  padding:4px 0;font-size:10px;
}
.cc-ev-fresh-label { width:80px;flex-shrink:0;color:var(--cc-muted); }

/* Mobile */
.cc-mob-nav { display:none; }
@media(max-width:1024px) {
  .cc-app {
    grid-template-columns:1fr;
    grid-template-rows:var(--cc-header) minmax(0,1fr) 56px;
    position:relative;height:100svh;
  }
  .cc-sidebar { display:none; }
  .cc-main { grid-column:1; }
  .cc-mob-nav {
    display:flex;align-items:stretch;
    grid-column:1;grid-row:3;
    border-top:1px solid var(--cc-line);
    background:rgba(3,7,17,.97);
  }
  .cc-mob-nav-btn {
    flex:1;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:3px;border:none;background:none;
    color:var(--cc-dim);font:inherit;font-size:8px;cursor:pointer;
    transition:color .12s;padding:6px 4px;
  }
  .cc-mob-nav-btn em   { font-style:normal;font-size:7px; }
  .cc-mob-nav-btn.active { color:var(--cc-gold); }
  .cc-briefing {
    grid-template-columns:1fr;
    grid-template-rows:auto auto auto;
    height:auto;
  }
  .cc-briefing-left,.cc-briefing-right { border:none;border-bottom:1px solid var(--cc-line); }
  .cc-methodology { flex-wrap:wrap; }
  .cc-header-right .cc-user-chip { display:none; }
}
/* ── Sidebar sections ────────────────────────────────────────────────────────── */
.cc-nav-section { display:flex;flex-direction:column;gap:2px; }
.cc-nav-section + .cc-nav-section {
  margin-top:8px;padding-top:8px;
  border-top:1px solid var(--cc-line);
}
.cc-nav-section-header {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.18em;
  color:var(--cc-dim);text-transform:uppercase;
  padding:2px 10px 6px;
  pointer-events:none;user-select:none;
}
`

