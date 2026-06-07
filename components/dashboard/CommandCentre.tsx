'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countries as ALL_COUNTRIES } from '@/lib/dashboard/countries'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { PipelineCounts, WantedListing, CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { REGIONS, REGION_LABELS, WARN_REGIONS as WARN_REGIONS_BY_COUNTRY } from '@/lib/dashboard/countryRegions'

// ── Exports consumed by app/dashboard/page.tsx ────────────────────────────────
export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

// ── Internal types ─────────────────────────────────────────────────────────────
type CommandPanel =
  | 'marketplace' | 'education' | 'signals' | 'wanted'
  | 'local-intel' | 'watchlist' | 'proof' | 'coa'
  | 'module' | 'settings' | 'search' | 'suppliers'
  | 'account' | 'notifications'

type RequestState = 'idle' | 'queued' | 'unavailable'

type CmdItem = {
  id: string
  group: string
  label: string
  sub?: string
  icon?: string
  action: () => void
}

type Props = {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?: PipelineCounts
  wantedListings?: WantedListing[]
  countryIntel?: CountryIntelProfile | null
}

// ── Constants ─────────────────────────────────────────────────────────────────
const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))
const WARN_REGIONS = new Set(Object.values(WARN_REGIONS_BY_COUNTRY).flat())

const VIEW_LABELS: Record<MarketView, string> = {
  cannabis:      'Cannabis inventory · flower · extract · biomass · genetics',
  equipment:     'Cultivation · extraction · processing · lab instrumentation',
  consumables:   'Packaging · substrates · nutrients · solvents · inputs',
  'new-products':'Seeds · formulations · devices · clones · new product lots',
  services:      'GDP logistics · compliance · lab testing · regulatory counsel',
  opportunities: 'Acquisitions · partnerships · licence transfers · distressed assets',
  wanted:        'Wanted demand · active buyer requests · matched supply',
}

const VIEW_BLOCK_TITLES: Record<MarketView, string> = {
  cannabis:      'Cannabis inventory',
  equipment:     'Equipment marketplace',
  consumables:   'Consumables & inputs',
  'new-products':'New products',
  services:      'Services marketplace',
  opportunities: 'Business opportunities',
  wanted:        'Active wanted requests',
}

const VIEW_TAB_LABELS: Record<MarketView, string> = {
  cannabis:      'Cannabis',
  equipment:     'Equipment',
  consumables:   'Consumables',
  'new-products':'New Products',
  services:      'Services',
  opportunities: 'Opportunities',
  wanted:        'Wanted',
}

const COMMAND_NAV: { id: CommandPanel; label: string; icon: string }[] = [
  { id: 'marketplace', label: 'Marketplace',  icon: '⊞' },
  { id: 'wanted',      label: 'Wanted Demand',icon: '⬇' },
  { id: 'local-intel', label: 'Local Intel',  icon: '◉' },
  { id: 'education',   label: 'Education',    icon: '⬡' },
  { id: 'signals',     label: 'Signals',      icon: '≋' },
  { id: 'watchlist',   label: 'Watchlist',    icon: '◈' },
  { id: 'settings',    label: 'Settings',     icon: '⊙' },
]

const ROLE_FIRST_MODULES: Record<string, { icon: string; title: string; desc: string; stage: string }[]> = {
  geneticist_breeder: [
    { icon: '🧬', title: 'Cultivar IP and breeding records', desc: 'Provenance logs, phenotyping evidence, lineage records, and export-safe genetic material workflows.', stage: 'Role module 01' },
    { icon: '🌱', title: 'Seed, clone, and tissue culture transfer controls', desc: 'Phytosanitary evidence, chain of custody, and restricted-market genetics movement.', stage: 'Role module 02' },
    { icon: '🔬', title: 'Genetic stability and QA proof pack', desc: 'Build a breeder-ready proof bundle for cultivar claims, lab verification, and counterparty review.', stage: 'Role module 03' },
  ],
}

const DEFAULT_ROLE_MODULES = [
  { icon: '🎯', title: 'Role operating path', desc: 'Role-specific market access, proof gates, and safe next actions for the selected workspace.', stage: 'Role module 01' },
  { icon: '✅', title: 'Compliance proof pack', desc: 'Documents and checks needed before marketplace contact or regional execution.', stage: 'Role module 02' },
]

// ── Pure helpers ──────────────────────────────────────────────────────────────
function getMainAction(roleId: string | null): string {
  if (!roleId) return 'Post Wanted Demand'
  if (['exporter','cultivator_producer','processor_extractor'].includes(roleId)) return 'Create Supply Listing'
  if (['doctor_prescriber','clinic_healthcare_operator'].includes(roleId)) return 'Start Clinician Onboarding'
  if (roleId === 'pharmacist') return 'Open Pharmacy Education'
  if (['investor_operator','government_regulator'].includes(roleId)) return 'View Opportunities'
  if (['lab_qa','gmp_quality'].includes(roleId)) return 'Post Lab Services'
  return 'Post Wanted Demand'
}

function getRequestKind(label: string): 'proof' | 'coa' {
  return label.toLowerCase().includes('coa') ? 'coa' : 'proof'
}

function getRegionalIntel(
  country: { iso2: string; label: string },
  region: string,
  roleLabel: string,
  warn: boolean,
  countryIntel?: CountryIntelProfile | null,
) {
  const intelSummary         = countryIntel?.public_summary ?? null
  const commercialPathway    = countryIntel?.commercial_pathway_summary ?? null
  const reviewStatus         = countryIntel?.review_status ?? null

  if (country.iso2 === 'AF') {
    return {
      title: `${country.label}${region ? ` · ${region}` : ''} Local Intel`,
      summary: region
        ? `${region} is operating under a review-gated Afghanistan workspace. Stay intelligence-led until source review completes.`
        : 'Afghanistan workspace is available with national intelligence, but no province has been selected.',
      ruleStatus:        'Review-gated / restricted',
      marketplaceImpact: 'No default transaction path; proof requests queued for analyst review.',
      roleImpact:        `${roleLabel} actions prioritize provenance, phytosanitary evidence, and non-transactional diligence.`,
      confidence:        'Limited public-source confidence · analyst verification required',
      nextAction:        region ? 'Queue proof request or open regional source review.' : 'Select a province to scope source review.',
      intelSummary, commercialPathway, reviewStatus, empty: !region,
    }
  }

  return {
    title:             `${country.label}${region ? ` · ${region}` : ''} Regional Intelligence`,
    summary:            intelSummary ?? (region
      ? `${region} rules are filtering marketplace rows, wanted demand, education modules, and proof-gated counterparty actions.`
      : `${country.label} has no configured region yet. Use national-level intelligence until regional data is loaded.`),
    ruleStatus:        region ? (warn ? 'Review required' : 'Allowed with proof') : 'National context only',
    marketplaceImpact: region ? (warn ? 'Marketplace restricted' : 'Supply + clinical routes visible') : 'Regional impact unavailable',
    roleImpact:        region ? (warn ? 'Education before action' : `${roleLabel} can proceed through proof gates`) : 'Role impact unavailable until regional data is configured',
    confidence:        region ? 'Regional rule status · source trail in review' : 'No regional source data configured',
    nextAction:        region ? (warn ? 'Open source review before inquiry.' : 'Request proof before counterparty contact.') : 'Use country-level search or request intel coverage.',
    intelSummary, commercialPathway, reviewStatus, empty: !region,
  }
}

function getProactiveBanner(
  signals: DashboardSignal[],
  country: { iso2: string; label: string },
  watching: Set<string>,
  pipeline: PipelineCounts | undefined,
  wantedListings: WantedListing[],
): string | null {
  const countrySignals = signals.filter(s =>
    s.market.toLowerCase().includes(country.label.toLowerCase()) ||
    s.market.toLowerCase().includes(country.iso2.toLowerCase())
  )
  if (countrySignals.length > 0) {
    return `${countrySignals.length} active signal${countrySignals.length > 1 ? 's' : ''} for ${country.label} — review before counterparty contact`
  }
  if (pipeline && pipeline.proof_review > 0) {
    return `${pipeline.proof_review} proof request${pipeline.proof_review > 1 ? 's' : ''} pending in your pipeline — action required`
  }
  const recentWanted = wantedListings.filter(w => {
    const h = (Date.now() - new Date(w.created_at).getTime()) / 3_600_000
    return h < 48 && (w.location_country === country.iso2 || w.location_country === country.label)
  })
  if (recentWanted.length > 0) {
    return `${recentWanted.length} new wanted request${recentWanted.length > 1 ? 's' : ''} in ${country.label} in the last 48h`
  }
  if (watching.size >= 3) {
    return `${watching.size} items in your watchlist — signals and price movement are being monitored`
  }
  return null
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TagPills({ str }: { str: string }) {
  return (
    <div className="hv-tags">
      {str.split('|').map(t => <span key={t} className="hv-tag">{t}</span>)}
    </div>
  )
}

function TrustBar({ str }: { str: string }) {
  return (
    <div className="hv-trust">
      {str.split('|').map(x => {
        const [a, c] = x.split(':')
        return <i key={x} className={c ?? ''}>{a}</i>
      })}
    </div>
  )
}

// ── KPI pipeline strip with count-up animation ────────────────────────────────
const kpis_check = (p: PipelineCounts) => p.wanted === 0 && p.matched === 0 && p.proof_review === 0 && p.inquiry === 0 && p.deal_room === 0

function KpiStrip({ pipeline }: { pipeline: PipelineCounts }) {
  const [counts, setCounts] = useState<PipelineCounts>({ wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 4)
      setCounts({
        wanted:       Math.round(pipeline.wanted       * ease),
        matched:      Math.round(pipeline.matched      * ease),
        proof_review: Math.round(pipeline.proof_review * ease),
        inquiry:      Math.round(pipeline.inquiry      * ease),
        deal_room:    Math.round(pipeline.deal_room    * ease),
      })
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [pipeline])

  const isEmpty = kpis_check(pipeline)

  if (isEmpty) {
    return (
      <div className="cc-kpi-strip cc-kpi-empty-state">
        <span className="cc-kpi-head">PIPELINE</span>
        <span className="cc-kpi-empty">No active pipeline · submit a listing or post wanted demand to begin</span>
      </div>
    )
  }

  const kpis: { key: keyof PipelineCounts; label: string; color?: string }[] = [
    { key: 'wanted',       label: 'Wanted',       color: 'var(--cc-violet)' },
    { key: 'matched',      label: 'Matched',      color: 'var(--cc-green)'  },
    { key: 'proof_review', label: 'Proof Review', color: 'var(--cc-amber)'  },
    { key: 'inquiry',      label: 'Inquiry',      color: 'var(--cc-blue)'   },
    { key: 'deal_room',    label: 'Deal Room',    color: 'var(--cc-gold2)'  },
  ]

  return (
    <div className="cc-kpi-strip">
      <span className="cc-kpi-head">PIPELINE</span>
      {kpis.map((k, i) => (
        <div key={k.key} className="cc-kpi-item">
          <span className="cc-kpi-num" style={{ color: k.color }}>{counts[k.key]}</span>
          <span className="cc-kpi-lbl">{k.label}</span>
          {i < kpis.length - 1 && <span className="cc-kpi-sep" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

// ── SVG sparkline for signal confidence ───────────────────────────────────────
function MiniSpark({ confidence, idx = 0 }: { confidence: number; idx?: number }) {
  const W = 52, H = 22
  const seed = confidence * 0.01 + idx * 0.7
  const pts = Array.from({ length: 8 }, (_, i) => {
    const base = confidence / 100
    const wave = Math.sin(i * 1.9 + seed) * 0.14 + Math.cos(i * 3.1 + seed * 2) * 0.08
    return Math.max(0.06, Math.min(0.94, base + wave))
  })
  const d = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * W
    const y = H - p * H
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const stroke = confidence >= 75 ? 'var(--cc-green)' : confidence >= 50 ? 'var(--cc-amber)' : 'var(--cc-red)'
  const approxLen = W * 1.4

  return (
    <svg className="cc-spark" width={W} height={H} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: approxLen,
          strokeDashoffset: approxLen,
          animation: `sparkDraw 1.1s ${idx * 0.12}s ease forwards`,
        }}
      />
    </svg>
  )
}

// ── Wanted listing card ────────────────────────────────────────────────────────
function WantedCard({ listing, onAction }: { listing: WantedListing; onAction: (id: string) => void }) {
  const ago = useMemo(() => {
    const ms = Date.now() - new Date(listing.created_at).getTime()
    const h  = Math.floor(ms / 3_600_000)
    if (h < 1)  return 'just now'
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return `${d}d ago`
  }, [listing.created_at])

  const location = [listing.location_region, listing.location_country].filter(Boolean).join(' · ')

  return (
    <article className="cc-wanted-card">
      <div className="cc-wanted-head">
        <span className="cc-wanted-tag">WANTED</span>
        {location && <span className="cc-wanted-loc">{location}</span>}
        <span className="cc-wanted-ago">{ago}</span>
      </div>
      <h4 className="cc-wanted-title">{listing.title}</h4>
      {listing.summary && <p className="cc-wanted-sum">{listing.summary}</p>}
      <button className="cc-row-action" onClick={() => onAction(listing.id)}>Respond to request</button>
    </article>
  )
}

// ── ⌘K Command Palette ───────────────────────────────────────────────────────
type PaletteProps = {
  open: boolean
  onClose: () => void
  signals: DashboardSignal[]
  country: { iso2: string; label: string }
  role: string
  onPanel: (panel: CommandPanel, item?: string) => void
  onView: (v: MarketView) => void
}

function CommandPalette({ open, onClose, signals, country, role, onPanel, onView }: PaletteProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  const baseItems = useMemo<CmdItem[]>(() => [
    { id: 'mp',       group: 'Navigate',    label: 'Marketplace command',   icon: '⊞', action: () => onPanel('marketplace') },
    { id: 'wanted',   group: 'Navigate',    label: 'Wanted demand',         icon: '⬇', action: () => onPanel('wanted')      },
    { id: 'intel',    group: 'Navigate',    label: 'Local intel',           icon: '◉', action: () => onPanel('local-intel') },
    { id: 'edu',      group: 'Navigate',    label: 'Education hub',         icon: '⬡', action: () => onPanel('education')   },
    { id: 'sig',      group: 'Navigate',    label: 'Weekly signals',        icon: '≋', action: () => onPanel('signals')     },
    { id: 'watch',    group: 'Navigate',    label: 'Watchlist',             icon: '◈', action: () => onPanel('watchlist')   },
    { id: 'notif',    group: 'Navigate',    label: 'Notifications',         icon: '◐', action: () => onPanel('notifications') },
    { id: 'v-can',    group: 'Marketplace', label: 'Cannabis inventory',    icon: '🌿', action: () => { onView('cannabis');      onPanel('marketplace') } },
    { id: 'v-equip',  group: 'Marketplace', label: 'Equipment marketplace', icon: '⚙️', action: () => { onView('equipment');     onPanel('marketplace') } },
    { id: 'v-svc',    group: 'Marketplace', label: 'Services marketplace',  icon: '📋', action: () => { onView('services');      onPanel('marketplace') } },
    { id: 'v-opp',    group: 'Marketplace', label: 'Opportunities',         icon: '📊', action: () => { onView('opportunities'); onPanel('marketplace') } },
  ], [onPanel, onView])

  const items = useMemo<CmdItem[]>(() => {
    if (!query.trim()) return baseItems
    const q = query.toLowerCase()
    const base = baseItems.filter(i => i.label.toLowerCase().includes(q))
    const sigItems: CmdItem[] = signals
      .filter(s => s.title.toLowerCase().includes(q) || s.market.toLowerCase().includes(q))
      .slice(0, 5)
      .map(s => ({
        id:     `s-${s.id}`,
        group:  'Signals',
        label:  s.title,
        sub:    `${s.market} · conf ${s.confidence}`,
        action: () => onPanel('signals', s.title),
      }))
    return [...base, ...sigItems]
  }, [query, baseItems, signals, onPanel])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')    { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, items.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && items[cursor]) { items[cursor].action(); onClose() }
  }

  if (!open) return null

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-box" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cp-topbar">
          <span className="cp-search-icon">⌘</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder={`Commands · signals · ${country.label} intel…`}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            onKeyDown={handleKey}
          />
          <kbd className="cp-esc" onClick={onClose}>ESC</kbd>
        </div>
        <div className="cp-results">
          {items.length === 0
            ? <div className="cp-empty">No results for &quot;{query}&quot;</div>
            : items.map((item, idx) => (
              <div key={item.id}>
                {(idx === 0 || items[idx - 1].group !== item.group) && (
                  <div className="cp-group-head">{item.group}</div>
                )}
                <button
                  className={`cp-item${cursor === idx ? ' active' : ''}`}
                  onClick={() => { item.action(); onClose() }}
                  onMouseEnter={() => setCursor(idx)}
                >
                  {item.icon && <span className="cp-item-icon">{item.icon}</span>}
                  <span className="cp-item-label">{item.label}</span>
                  {item.sub && <span className="cp-item-sub">{item.sub}</span>}
                </button>
              </div>
            ))
          }
        </div>
        <div className="cp-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="cp-footer-ctx">{country.label}{role ? ` · ${ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.short ?? role}` : ''}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CommandCentre({
  signals,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  wantedCount = 4,
  marketplaceRows,
  pipeline,
  wantedListings = [],
  countryIntel,
}: Props) {
  const defaultCountry = useMemo(
    () => COUNTRIES.find(c => c.iso2 === initialCountryIso2) ?? COUNTRIES[0],
    [initialCountryIso2],
  )

  const [country,          setCountry]          = useState(defaultCountry)
  const [region,           setRegion]           = useState((REGIONS[defaultCountry.iso2] ?? [])[0] ?? '')
  const [role,             setRole]             = useState(initialRoleId ?? '')
  const [view,             setView]             = useState<MarketView>('cannabis')
  const [activePanel,      setActivePanel]      = useState<CommandPanel>('marketplace')
  const [panelOpen,        setPanelOpen]        = useState(false)
  const [search,           setSearch]           = useState('')
  const [watching,         setWatching]         = useState<Set<string>>(new Set())
  const [proofState,       setProofState]       = useState<RequestState>('idle')
  const [coaState,         setCoaState]         = useState<RequestState>('idle')
  const [selectedItem,     setSelectedItem]     = useState('')
  const [selectedModule,   setSelectedModule]   = useState('')
  const [paletteOpen,      setPaletteOpen]      = useState(false)
  const [bannerDismissed,  setBannerDismissed]  = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Sync state when URL-derived props change (globe → dashboard nav doesn't remount)
  useEffect(() => {
    const found = COUNTRIES.find(c => c.iso2 === initialCountryIso2)
    if (found && found.iso2 !== country.iso2) {
      setCountry(found)
      setRegion((REGIONS[found.iso2] ?? [])[0] ?? '')
    }
  }, [initialCountryIso2]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialRoleId && initialRoleId !== role) {
      setRole(initialRoleId)
    }
  }, [initialRoleId]) // eslint-disable-line react-hooks/exhaustive-deps

  const savePreferences = useCallback((patch: { country_iso2?: string; role_id?: string }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/dashboard/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch(() => {})
    }, 600)
  }, [])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const openPanel = useCallback((panel: CommandPanel, item?: string) => {
    if (item) setSelectedItem(item)
    setActivePanel(panel)
    setPanelOpen(true)
  }, [])

  const handleCountryChange = (iso2: string) => {
    const next       = COUNTRIES.find(c => c.iso2 === iso2) ?? country
    const nextRegions = REGIONS[iso2] ?? []
    setCountry(next)
    setRegion(nextRegions[0] ?? '')
    setBannerDismissed(false)
    savePreferences({ country_iso2: iso2 })
  }

  const handleRoleChange = (nextRole: string) => {
    setRole(nextRole)
    savePreferences({ role_id: nextRole })
  }

  // In-dashboard search — no route push
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const q = e.currentTarget.value.trim()
    setSearch(q)
    if (q) openPanel('search', q)
  }

  const queueRequest = (kind: 'proof' | 'coa', item: string) => {
    setSelectedItem(item)
    const unavailable = country.iso2 === 'AF' && kind === 'coa'
    if (kind === 'coa')   setCoaState(unavailable ? 'unavailable' : 'queued')
    if (kind === 'proof') setProofState('queued')
    openPanel(kind, item)
  }

  const toggleWatch = (item: string) => {
    setWatching(prev => {
      const next = new Set(prev)
      if (next.has(item)) { next.delete(item) } else { next.add(item) }
      return next
    })
    openPanel('watchlist', item)
  }

  const rows = marketplaceRows?.[view] ?? []

  // In-dashboard filtered rows (no redirect)
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r =>
      r[2].toLowerCase().includes(q) ||
      r[3].toLowerCase().includes(q) ||
      r[1].toLowerCase().includes(q),
    )
  }, [rows, search])

  const warn       = WARN_REGIONS.has(region)
  const roleLabel  = role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.label ?? 'General') : 'General'
  const roleModules = ROLE_FIRST_MODULES[role] ?? DEFAULT_ROLE_MODULES
  const learningPath = [
    ...roleModules,
    ...eduCategories.map(cat => ({ ...cat, stage: `${country.label}${region ? ` · ${region}` : ''}` })),
  ]
  const regionalIntel = getRegionalIntel(country, region, roleLabel, warn, countryIntel)
  const tierLabel     = ['doctor_prescriber','pharmacist','clinic_healthcare_operator'].includes(role)
    ? 'CLINICAL PARTNER · Education'
    : 'FREE · Weekly Signals'

  const banner = bannerDismissed
    ? null
    : getProactiveBanner(signals, country, watching, pipeline, wantedListings)

  const notifCount = useMemo(() =>
    signals.filter(s => s.confidence >= 75).length + (pipeline?.proof_review ?? 0),
    [signals, pipeline],
  )

  // ── Drawer panel renderer ────────────────────────────────────────────────────
  const renderPanel = () => {
    const requestState = activePanel === 'coa' ? coaState : proofState
    const panelTitle   = COMMAND_NAV.find(i => i.id === activePanel)?.label ?? activePanel

    return (
      <aside className={`cc-command-panel${panelOpen ? ' open' : ''}`} aria-label={`${panelTitle} panel`}>
        <div className="cc-drawer-head">
          <div>
            <small>Command centre expansion</small>
            <h3>{panelTitle}</h3>
          </div>
          <button className="cc-close" onClick={() => setPanelOpen(false)} aria-label="Close panel">×</button>
        </div>
        <div className="cc-drawer-body">

          {activePanel === 'marketplace' && (
            <section className="cc-drawer-card">
              <b>{VIEW_BLOCK_TITLES[view]} expanded</b>
              <p>{filteredRows.length} {VIEW_TAB_LABELS[view].toLowerCase()} rows · {country.label}{region ? ` / ${region}` : ''}</p>
              <div className="cc-panel-list">
                {filteredRows.map(row => <span key={row[2]}>{row[2]} · {row[6]}</span>)}
              </div>
              <a href="/marketplace" className="cc-link-external">Full marketplace →</a>
            </section>
          )}

          {activePanel === 'education' && (
            <section className="cc-drawer-card">
              <b>{roleLabel} learning path</b>
              <p>Role-specific modules prioritized, then {country.label}{region ? ` / ${region}` : ''} context.</p>
              <div className="cc-panel-list">
                {learningPath.map(item => (
                  <span key={`${item.stage}-${item.title}`}>{item.stage}: {item.title}</span>
                ))}
              </div>
            </section>
          )}

          {activePanel === 'signals' && (
            <section className="cc-drawer-card">
              <b>Weekly Signals · {signals.length} active</b>
              <p>Source confidence · marketplace impact · operator next actions.</p>
              <div className="cc-panel-signal-list">
                {signals.map((signal, i) => (
                  <div key={signal.id} className="cc-panel-signal">
                    <div className="cc-panel-signal-head">
                      <span
                        className="cc-signal-tag"
                        style={{ borderColor: signal.tag.border, color: signal.tag.color, background: signal.tag.bg }}
                      >
                        {signal.tag.label}
                      </span>
                      <MiniSpark confidence={signal.confidence} idx={i} />
                      <span className="cc-conf-num" style={{ color: signal.confidence >= 75 ? 'var(--cc-green)' : 'var(--cc-amber)' }}>
                        {signal.confidence}%
                      </span>
                    </div>
                    <b className="cc-panel-signal-title">{signal.title}</b>
                    <p className="cc-panel-signal-impact">{signal.commercialImpact}</p>
                    <small>{signal.market} · {signal.timeAgo}</small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activePanel === 'wanted' && (
            <section className="cc-drawer-card">
              <b>Wanted Demand — {wantedListings.length > 0 ? `${wantedListings.length} active requests` : `${wantedCount} requests`}</b>
              <p>Active buyer demand available in this workspace.</p>
              {wantedListings.length > 0
                ? (
                  <div className="cc-panel-wanted">
                    {wantedListings.map(listing => (
                      <WantedCard
                        key={listing.id}
                        listing={listing}
                        onAction={id => { setSelectedItem(id); setProofState('queued') }}
                      />
                    ))}
                  </div>
                )
                : (
                  <button className="cc-primary inline" onClick={() => setProofState('queued')}>
                    Queue wanted demand review
                  </button>
                )
              }
            </section>
          )}

          {activePanel === 'local-intel' && (
            <section className="cc-drawer-card">
              <b>{regionalIntel.title}</b>
              <p>{regionalIntel.summary}</p>
              {regionalIntel.intelSummary && regionalIntel.intelSummary !== regionalIntel.summary && (
                <div className="cc-intel-block">
                  <small>INTEL SUMMARY</small>
                  <p>{regionalIntel.intelSummary}</p>
                </div>
              )}
              {regionalIntel.commercialPathway && (
                <div className="cc-intel-block accent-blue">
                  <small>COMMERCIAL PATHWAY</small>
                  <p>{regionalIntel.commercialPathway}</p>
                </div>
              )}
              <div className="cc-rule-grid">
                <div><small>Rule status</small><strong>{regionalIntel.ruleStatus}</strong></div>
                <div><small>Marketplace impact</small><strong>{regionalIntel.marketplaceImpact}</strong></div>
                <div><small>Role impact</small><strong>{regionalIntel.roleImpact}</strong></div>
                <div><small>Confidence / source</small><strong>{regionalIntel.confidence}</strong></div>
                {regionalIntel.reviewStatus && (
                  <div><small>Intel review status</small><strong>{regionalIntel.reviewStatus}</strong></div>
                )}
              </div>
              <p className="cc-next-action">Next operator action: {regionalIntel.nextAction}</p>
            </section>
          )}

          {activePanel === 'watchlist' && (
            <section className="cc-drawer-card">
              <b>Watchlist · {watching.size} item{watching.size !== 1 ? 's' : ''}</b>
              <p>
                {selectedItem
                  ? `${selectedItem} is ${watching.has(selectedItem) ? 'now watched' : 'removed from watch'} in the ${country.label} workspace.`
                  : `Watching ${watching.size} items in the ${country.label} workspace.`}
              </p>
              <div className="cc-panel-list">
                {Array.from(watching).map(item => (
                  <span key={item} className="cc-watch-item">
                    <span className="cc-watch-dot" />
                    {item}
                  </span>
                ))}
                {watching.size === 0 && <span>No watched rows yet. Use the Watch button on any listing.</span>}
              </div>
            </section>
          )}

          {(activePanel === 'proof' || activePanel === 'coa') && (
            <section className="cc-drawer-card">
              <b>{activePanel === 'coa' ? 'COA request' : 'Proof request'} — {selectedItem}</b>
              <p>
                Status:{' '}
                {requestState === 'queued'
                  ? 'Queued for operator review.'
                  : requestState === 'unavailable'
                    ? 'Unavailable for this country/region until source review completes.'
                    : 'Ready to queue.'}
              </p>
              <p>Context: {country.label}{region ? ` / ${region}` : ''} · {roleLabel} · {VIEW_TAB_LABELS[view]}</p>
            </section>
          )}

          {activePanel === 'module' && (
            <section className="cc-drawer-card">
              <b>{selectedModule || 'Education module'}</b>
              <p>Module open in-dashboard. All context preserved: country, region, role, category.</p>
            </section>
          )}

          {activePanel === 'settings' && (
            <section className="cc-drawer-card">
              <b>Command Centre settings</b>
              <p>Saved layout, module priority, proof gates, and workspace density.</p>
              <div className="cc-settings-grid">
                <div className="cc-setting-item"><small>Workspace</small><strong>{country.label}{region ? ` · ${region}` : ''}</strong></div>
                <div className="cc-setting-item"><small>Active role</small><strong>{roleLabel}</strong></div>
                <div className="cc-setting-item"><small>Tier</small><strong>{tierLabel}</strong></div>
                <div className="cc-setting-item"><small>Watchlist</small><strong>{watching.size} items</strong></div>
                {pipeline && <div className="cc-setting-item"><small>Wanted pipeline</small><strong>{pipeline.wanted} requests</strong></div>}
                {pipeline && <div className="cc-setting-item"><small>Deal room</small><strong>{pipeline.deal_room} active</strong></div>}
              </div>
              <button className="cc-primary inline" onClick={() => setActivePanel('marketplace')}>Apply layout</button>
            </section>
          )}

          {activePanel === 'search' && (
            <section className="cc-drawer-card">
              <b>Search: &quot;{selectedItem || search}&quot;</b>
              <p>{filteredRows.length} matching rows in current {VIEW_TAB_LABELS[view]} view.</p>
              <div className="cc-panel-list">
                {filteredRows.slice(0, 10).map(row => <span key={row[2]}>{row[2]} · {row[7]}</span>)}
              </div>
              <a
                href={`/marketplace?q=${encodeURIComponent(search)}`}
                className="cc-link-external"
              >
                Full marketplace search →
              </a>
            </section>
          )}

          {activePanel === 'notifications' && (
            <section className="cc-drawer-card">
              <b>Notifications · {notifCount} active</b>
              <div className="cc-panel-list">
                {signals.filter(s => s.confidence >= 75).map(s => (
                  <span key={s.id} className="cc-notif-item">
                    <span className="cc-notif-dot signal" />
                    {s.title} · {s.market}
                  </span>
                ))}
                {(pipeline?.proof_review ?? 0) > 0 && (
                  <span className="cc-notif-item">
                    <span className="cc-notif-dot pipeline" />
                    {pipeline!.proof_review} proof request{pipeline!.proof_review > 1 ? 's' : ''} pending review
                  </span>
                )}
                {notifCount === 0 && <span>No active notifications.</span>}
              </div>
            </section>
          )}

          {activePanel === 'suppliers' && (
            <section className="cc-drawer-card">
              <b>Supplier command surface</b>
              <p>Supplier discovery filtered by {country.label} and {roleLabel}.</p>
            </section>
          )}

          {activePanel === 'account' && (
            <section className="cc-drawer-card">
              <b>Account controls</b>
              <p>Workspace preferences, notification routing, and proof-request defaults.</p>
            </section>
          )}

        </div>
      </aside>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      <div className="cc-app">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="cc-top">
          <div className="cc-brand">
            <strong>HARBOURVIEW</strong>
            <span>MARKET ACCESS · INTELLIGENCE · EDUCATION</span>
          </div>

          <div className="cc-context">
            <label className="cc-field">
              <span>Country</span>
              <select value={country.iso2} onChange={e => handleCountryChange(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.iso2} value={c.iso2}>{c.label}</option>)}
              </select>
            </label>
            <label className="cc-field">
              <span>Region</span>
              <select value={region} onChange={e => setRegion(e.target.value)}>
                {(REGIONS[country.iso2] ?? []).length
                  ? (REGIONS[country.iso2] ?? []).map(r => <option key={r} value={r}>{r}</option>)
                  : <option value="">Country-level</option>}
              </select>
            </label>
            <label className="cc-field">
              <span>Role</span>
              <select value={role} onChange={e => handleRoleChange(e.target.value)}>
                <option value="">— select role —</option>
                {Object.entries(ROLE_PROFILES).map(([id, profile]) => (
                  <option key={id} value={id}>{profile!.label}</option>
                ))}
              </select>
            </label>
            <label className="cc-field">
              <span>Search</span>
              <input
                type="text"
                value={search}
                placeholder="Search listings, intel, education…"
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </label>
          </div>

          <div className="cc-actions">
            <div className="cc-tier">{tierLabel}</div>

            {/* ⌘K button */}
            <button
              className="cc-kbd-btn"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette (⌘K)"
              title="Command palette ⌘K"
            >
              <span>⌘K</span>
            </button>

            {/* Notifications bell */}
            <button
              className="cc-icon-btn cc-notif-btn"
              aria-label={`Open notifications (${notifCount})`}
              title="Notifications"
              onClick={() => openPanel('notifications')}
            >
              <span className="cc-bell-icon">◐</span>
              {notifCount > 0 && (
                <span className="cc-notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
              )}
            </button>

            <button className="cc-soft-btn" onClick={() => openPanel('wanted')}>
              {wantedCount} Wanted
            </button>
            <button className="cc-soft-btn" onClick={() => openPanel('settings')}>Customize</button>
            <button className="cc-primary" onClick={() => openPanel('wanted')}>
              {getMainAction(role)}
            </button>
          </div>
        </header>

        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <nav className="cc-sidebar" aria-label="Command centre navigation">
          {COMMAND_NAV.map(item => (
            <button
              key={item.id}
              type="button"
              className={`cc-nav-btn${activePanel === item.id ? ' active' : ''}`}
              aria-label={item.label}
              aria-pressed={activePanel === item.id}
              onClick={() => openPanel(item.id as CommandPanel)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <em>{item.label}</em>
            </button>
          ))}
        </nav>

        {/* ── Workspace ──────────────────────────────────────────────── */}
        <main className="cc-workspace">

          {/* Pipeline KPI strip */}
          {pipeline && <KpiStrip pipeline={pipeline} />}

          {/* Proactive intelligence banner */}
          {banner && (
            <div className="cc-banner">
              <span className="cc-banner-dot" />
              <span className="cc-banner-text">{banner}</span>
              <button className="cc-banner-dismiss" onClick={() => setBannerDismissed(true)} aria-label="Dismiss banner">×</button>
            </div>
          )}

          {/* 3-column grid */}
          <div className="cc-grid">

            {/* ── Col 1: Marketplace ─────────────────────────────────── */}
            <section className="cc-panel cc-market">
              <div className="cc-head">
                <div>
                  <h2>Marketplace &amp; Access</h2>
                  <small>{VIEW_LABELS[view]}</small>
                </div>
                <div className="cc-head-actions">
                  <button className="cc-wanted-cta" onClick={() => openPanel('wanted')}>
                    {wantedCount} Wanted →
                  </button>
                  <button className="cc-soft-btn" onClick={() => openPanel('marketplace')}>
                    View All →
                  </button>
                </div>
              </div>

              <div className="cc-view-bar">
                <div className="cc-views">
                  {(['cannabis','equipment','consumables','new-products','services','opportunities'] as MarketView[]).map(v => (
                    <button key={v} className={`cc-view${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
                      {VIEW_TAB_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cc-market-grid">
                <div className="cc-market-block">
                  <div className="cc-block-title">
                    <b>{VIEW_BLOCK_TITLES[view]}</b>
                    <span>
                      {search ? `${filteredRows.length} of ${rows.length} · filtered` : rows.length > 0 ? `${rows.length} rows · region-filtered` : 'No listings yet'}
                    </span>
                  </div>
                  <div className="cc-rows">
                    {filteredRows.length === 0
                      ? (
                        <div className="cc-empty-state">
                          <p>{search ? `No results for "${search}" in this category.` : 'No live listings for this category yet.'}</p>
                          {!search && <a href="/marketplace/sell" className="cc-empty-cta">Submit a listing →</a>}
                          {search && <button className="cc-empty-cta" onClick={() => setSearch('')}>Clear search</button>}
                        </div>
                      )
                      : filteredRows.map((row, i) => (
                        <article key={row[2]} className="cc-row" style={{ animationDelay: `${i * 45}ms` }}>
                          <div className={`cc-spec ${row[0]}`} />
                          <div>
                            <div className="cc-type">{row[1]}</div>
                            <h4>{row[2]}</h4>
                            <p>{row[3]}</p>
                            <TagPills str={row[4]} />
                            <TrustBar str={row[5]} />
                          </div>
                          <div className="cc-action-box">
                            <strong>{row[7]}</strong>
                            <small>{row[1].toLowerCase()}</small>
                            <button className="cc-row-action" onClick={() => queueRequest(getRequestKind(row[6]), row[2])}>
                              {row[6]}
                            </button>
                            <button
                              className={`cc-secondary${watching.has(row[2]) ? ' active' : ''}`}
                              onClick={() => toggleWatch(row[2])}
                            >
                              {watching.has(row[2]) ? 'Watching' : 'Watch'}
                            </button>
                          </div>
                        </article>
                      ))
                    }
                  </div>
                </div>
              </div>
            </section>

            {/* ── Col 2: Education ───────────────────────────────────── */}
            <section className="cc-col2">
              <div className="cc-panel cc-education">
                <div className="cc-head">
                  <div>
                    <h3>Education Hub</h3>
                    <small>Role-first learning path</small>
                  </div>
                  <button className="cc-link-btn" onClick={() => openPanel('education')}>View All →</button>
                </div>
                <div className="cc-body">
                  <div className="cc-edu-intro">
                    <strong>{roleLabel} Learning Path</strong>
                    <p>Role-specific modules prioritized, then {country.label}{region ? ` / ${region}` : ''} context.</p>
                    {countryIntel?.review_status && (
                      <div className="cc-edu-intel-badge">
                        <span className="cc-intel-dot" />
                        Intel: {countryIntel.review_status} · {country.label}
                      </div>
                    )}
                  </div>
                  <div className="cc-edu-cards">
                    {learningPath.slice(0, 5).map(item => (
                      <div key={`${item.stage}-${item.title}`} className="cc-edu">
                        <small>{item.stage}</small>
                        <b>{item.icon} {item.title}</b>
                        <p>{item.desc}</p>
                        <button
                          className="cc-edu-cta"
                          onClick={() => {
                            setSelectedModule(item.title)
                            openPanel('module', item.title)
                          }}
                        >
                          Open module
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Col 3: Signals + Local Intel ───────────────────────── */}
            <section className="cc-col3">

              <div className="cc-panel cc-signals">
                <div className="cc-head">
                  <div>
                    <h3>Weekly Signals</h3>
                    <small>Free summaries · paid source trail · marketplace impact</small>
                  </div>
                  <button className="cc-link-btn" onClick={() => openPanel('signals')}>View All →</button>
                </div>
                <div className="cc-body">
                  <div className="cc-signal-list">
                    {signals.slice(0, 3).map((signal, i) => (
                      <article key={signal.id} className="cc-signal">
                        <span className={`cc-sev${signal.tag.label === 'REGULATION' || signal.tag.label === 'COMPLIANCE' ? '' : ' low'}`} />
                        <div>
                          <div className="cc-signal-top">
                            <b>{signal.title}</b>
                            <MiniSpark confidence={signal.confidence} idx={i} />
                          </div>
                          <p>{signal.commercialImpact}</p>
                          <small>{signal.market} · conf {signal.confidence} · {signal.timeAgo}</small>
                          <div className="cc-impact">
                            <span
                              className="cc-signal-tag"
                              style={{ borderColor: signal.tag.border, color: signal.tag.color, background: signal.tag.bg }}
                            >
                              {signal.tag.label}
                            </span>
                            {' '}Impact: {signal.commercialImpact.toLowerCase()}
                          </div>
                        </div>
                        <button className="cc-badge" onClick={() => openPanel('signals', signal.title)}>WATCH</button>
                      </article>
                    ))}
                    <div className="cc-pay-boundary">
                      <b>Intel Plus unlocks</b>
                      <p>Source trails, contradiction review, counterparty movement, corridor alerts, regional rule-change monitoring, and saved watch alerts.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cc-panel cc-map-panel">
                <div className="cc-head">
                  <div>
                    <h3>Local Intel</h3>
                    <small>{REGION_LABELS[country.iso2] ?? 'Country-level intelligence'}</small>
                  </div>
                  <button className="cc-link-btn" onClick={() => openPanel('local-intel')}>Open Intel</button>
                </div>
                <div className="cc-body cc-map-body">
                  {/* CountryIntel public summary */}
                  {countryIntel?.public_summary && (
                    <div className="cc-country-intel-card">
                      <div className="cc-country-intel-head">
                        <span className="cc-country-intel-dot" />
                        <small>{countryIntel.country_name} · {countryIntel.review_status}</small>
                      </div>
                      <p>{countryIntel.public_summary}</p>
                    </div>
                  )}
                  <div className="cc-legend">
                    <span>● Allow</span>
                    <span>● Review</span>
                    <span>● Restrict</span>
                    <span>● Edu required</span>
                  </div>
                  <div className="cc-map-wrap">
                    <div className="cc-region-grid">
                      {(REGIONS[country.iso2] ?? []).length
                        ? (REGIONS[country.iso2] ?? []).map(r => (
                          <button
                            key={r}
                            className={`cc-region-tile${region === r ? ' active' : ''}${WARN_REGIONS.has(r) ? ' warn' : ''}`}
                            onClick={() => setRegion(r)}
                          >
                            {r}
                          </button>
                        ))
                        : <div className="cc-empty-state">No regional tiles configured. Showing country-level intelligence.</div>
                      }
                    </div>
                    <div className="cc-rules">
                      <b>{regionalIntel.title}</b>
                      <p>{regionalIntel.summary}</p>
                      <div className="cc-rule-grid">
                        <div><small>Rule status</small><strong>{regionalIntel.ruleStatus}</strong></div>
                        <div><small>Marketplace impact</small><strong>{regionalIntel.marketplaceImpact}</strong></div>
                        <div><small>Role impact</small><strong>{regionalIntel.roleImpact}</strong></div>
                        <div><small>Confidence</small><strong>{regionalIntel.confidence}</strong></div>
                      </div>
                      <p className="cc-next-action">Next action: {regionalIntel.nextAction}</p>
                    </div>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </main>

        {/* ── Status bar ─────────────────────────────────────────────── */}
        <footer className="cc-status">
          <span><b>LIVE</b> role-aware · region-filtered · proof-gated</span>
          <span>
            {pipeline
              ? `Pipeline: ${pipeline.wanted} wanted · ${pipeline.matched} matched · ${pipeline.deal_room} deal room`
              : 'Marketplace · Intel Signals · Education'}
          </span>
          <span>
            {watching.size > 0 ? `${watching.size} watched · ` : ''}
            {search ? `Filtered: "${search}" · ` : ''}
            All commands resolve in-dashboard
          </span>
        </footer>
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      {panelOpen && <div className="cc-scrim" onClick={() => setPanelOpen(false)} />}
      {renderPanel()}

      {/* ── Mobile bottom nav ──────────────────────────────────────── */}
      <nav className="cc-mob-nav" aria-label="Mobile navigation">
        {COMMAND_NAV.slice(0, 5).map(item => (
          <button
            key={item.id}
            className={`cc-mob-nav-btn${activePanel === item.id ? ' active' : ''}`}
            onClick={() => openPanel(item.id as CommandPanel)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <em>{item.label}</em>
          </button>
        ))}
      </nav>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        signals={signals}
        country={country}
        role={role}
        onPanel={(panel, item) => { openPanel(panel, item); setPaletteOpen(false) }}
        onView={v => { setView(v); setPaletteOpen(false) }}
      />
    </>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cormorant+Garamond:wght@400;500;600&display=swap');

@keyframes fadeSlideUp  { from { opacity:0; transform:translateY(7px) } to { opacity:1; transform:translateY(0) } }
@keyframes sparkDraw    { to   { stroke-dashoffset:0 } }
@keyframes pulseDot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
@keyframes rowIn        { from { opacity:0; transform:translateX(-4px) } to { opacity:1; transform:translateX(0) } }
@keyframes kpiReveal    { from { opacity:0; transform:translateY(3px) } to { opacity:1; transform:translateY(0) } }
@keyframes bannerSlide  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }

:root {
  --cc-bg:#040814;
  --cc-panel:#0b1929;
  --cc-ink:#f7efe1;
  --cc-text:#d8e1e9;
  --cc-muted:#9aa8b6;
  --cc-dim:#627282;
  --cc-line:rgba(232,240,248,.115);
  --cc-line2:rgba(232,240,248,.18);
  --cc-gold:#d9af63;
  --cc-gold2:#f3cf86;
  --cc-green:#74d28e;
  --cc-blue:#79b2ea;
  --cc-red:#e27466;
  --cc-amber:#e7b053;
  --cc-violet:#ad92ee;
  --cc-cyan:#6de3d6;
  --cc-shadow:0 28px 88px rgba(0,0,0,.44);
  --cc-sans:"DM Mono",ui-monospace,SFMono-Regular,Consolas,monospace;
  --cc-serif:"Cormorant Garamond",Georgia,"Times New Roman",serif;
  --cc-mono:"DM Mono",ui-monospace,SFMono-Regular,Consolas,monospace;
}

/* ── App shell ──────────────────────────────────────────────────────────── */
.cc-app {
  position:fixed;inset:0;
  display:grid;
  grid-template-columns:72px minmax(0,1fr);
  grid-template-rows:70px minmax(0,1fr) 40px;
  background:linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);
  color:var(--cc-text);
  font-family:var(--cc-sans);
  overflow:hidden;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.cc-top {
  grid-column:1/-1;grid-row:1;z-index:10;
  display:grid;grid-template-columns:220px minmax(0,1fr) auto;
  gap:14px;align-items:center;
  padding:10px 16px;
  border-bottom:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(5,10,20,.97),rgba(6,13,24,.92));
}
.cc-brand strong {
  display:block;color:var(--cc-gold2);
  font-family:var(--cc-serif);letter-spacing:.16em;font-size:17px;font-weight:600;
}
.cc-brand span {
  display:block;margin-top:2px;color:var(--cc-dim);
  text-transform:uppercase;letter-spacing:.15em;font-size:8px;white-space:nowrap;
  font-family:var(--cc-mono);
}
.cc-context {
  display:grid;grid-template-columns:130px 140px 160px minmax(150px,1fr);
  gap:8px;min-width:0;
}
.cc-field { height:44px;position:relative; }
.cc-field span {
  position:absolute;left:11px;top:5px;
  color:var(--cc-dim);font-size:8px;letter-spacing:.14em;
  text-transform:uppercase;pointer-events:none;z-index:1;
  font-family:var(--cc-mono);
}
.cc-field select,.cc-field input {
  width:100%;height:100%;
  border:1px solid var(--cc-line2);border-radius:12px;
  background:linear-gradient(180deg,rgba(17,35,53,.9),rgba(7,16,28,.96));
  color:var(--cc-ink);outline:none;
  padding:17px 10px 5px 11px;
  font:inherit;font-size:12px;
  transition:border-color .15s;
}
.cc-field select:focus,.cc-field input:focus { border-color:rgba(217,175,99,.5); }
.cc-actions { display:flex;align-items:center;gap:7px;justify-content:flex-end;white-space:nowrap; }
.cc-tier {
  height:42px;border:1px solid rgba(217,175,99,.35);border-radius:12px;
  background:rgba(217,175,99,.07);color:var(--cc-gold2);
  padding:0 11px;display:flex;align-items:center;
  font-family:var(--cc-mono);font-size:9px;letter-spacing:.1em;white-space:nowrap;
}
.cc-kbd-btn {
  height:42px;padding:0 12px;border-radius:12px;
  border:1px solid var(--cc-line2);
  background:linear-gradient(180deg,rgba(15,31,49,.9),rgba(7,16,28,.98));
  color:var(--cc-muted);cursor:pointer;font-family:var(--cc-mono);font-size:11px;
  display:flex;align-items:center;gap:5px;
  transition:border-color .15s,color .15s;
}
.cc-kbd-btn:hover { border-color:rgba(217,175,99,.5);color:var(--cc-gold2); }
.cc-icon-btn,.cc-soft-btn,.cc-primary {
  height:42px;border-radius:12px;border:1px solid var(--cc-line2);
  background:linear-gradient(180deg,rgba(15,31,49,.9),rgba(7,16,28,.98));
  color:var(--cc-muted);padding:0 12px;
  display:inline-flex;align-items:center;gap:7px;
  cursor:pointer;font:inherit;font-size:12px;text-decoration:none;
  transition:border-color .15s,transform .1s;
}
.cc-icon-btn { width:42px;padding:0;justify-content:center;position:relative; }
.cc-notif-btn { font-size:16px; }
.cc-bell-icon { line-height:1; }
.cc-notif-badge {
  position:absolute;right:5px;top:5px;
  min-width:15px;height:15px;border-radius:999px;
  background:var(--cc-red);color:#fff;
  font-size:8px;font-family:var(--cc-mono);font-weight:700;
  display:flex;align-items:center;justify-content:center;
  padding:0 3px;
  animation:fadeSlideUp .25s ease;
}
.cc-primary {
  border-color:rgba(217,175,99,.56);
  background:linear-gradient(135deg,#f0cc82,#c89136);
  color:#07111d;font-weight:700;
}
.cc-primary:hover,.cc-soft-btn:hover { transform:translateY(-1px); }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.cc-sidebar {
  grid-column:1;grid-row:2/4;z-index:5;
  padding:14px 9px;
  border-right:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(4,9,18,.8),rgba(3,8,17,.97));
  display:flex;flex-direction:column;align-items:center;gap:8px;
}
.cc-nav-btn {
  width:50px;height:50px;border-radius:16px;
  border:1px solid transparent;background:transparent;
  color:var(--cc-dim);
  display:grid;place-items:center;
  cursor:pointer;position:relative;
  font-size:17px;
  transition:color .15s,background .15s,border-color .15s;
}
.cc-nav-btn:hover { color:var(--cc-text);background:rgba(255,255,255,.06); }
.cc-nav-btn.active {
  color:var(--cc-gold2);
  border-color:rgba(217,175,99,.35);
  background:rgba(217,175,99,.08);
}
.cc-nav-btn em {
  position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);
  background:rgba(10,22,36,.97);border:1px solid var(--cc-line2);
  border-radius:10px;padding:6px 11px;white-space:nowrap;
  font-style:normal;font-size:11px;color:var(--cc-text);
  z-index:100;opacity:0;pointer-events:none;
  transition:opacity .12s ease;font-weight:500;
}
.cc-nav-btn:hover em { opacity:1; }

/* ── Workspace ───────────────────────────────────────────────────────────── */
.cc-workspace {
  grid-column:2;grid-row:2;
  display:flex;flex-direction:column;
  min-width:0;min-height:0;overflow:hidden;
}

/* KPI strip */
.cc-kpi-strip {
  flex-shrink:0;height:38px;
  display:flex;align-items:center;
  padding:0 16px;gap:0;
  border-bottom:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(8,18,30,.92),rgba(5,13,23,.96));
  animation:fadeSlideUp .4s ease;
}
.cc-kpi-head {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--cc-dim);
  margin-right:14px;flex-shrink:0;
}
.cc-kpi-item {
  display:flex;align-items:center;gap:6px;
  padding:0 14px;position:relative;
  animation:kpiReveal .5s ease both;
}
.cc-kpi-item:nth-child(2) { animation-delay:.05s }
.cc-kpi-item:nth-child(3) { animation-delay:.10s }
.cc-kpi-item:nth-child(4) { animation-delay:.15s }
.cc-kpi-item:nth-child(5) { animation-delay:.20s }
.cc-kpi-item:nth-child(6) { animation-delay:.25s }
.cc-kpi-num {
  font-family:var(--cc-mono);font-size:16px;font-weight:500;
  letter-spacing:-.01em;line-height:1;
}
.cc-kpi-lbl {
  font-size:8px;text-transform:uppercase;letter-spacing:.13em;
  color:var(--cc-muted);font-family:var(--cc-mono);white-space:nowrap;
}
.cc-kpi-empty { flex:1;color:var(--cc-dim);font-size:10px;font-family:var(--cc-mono);font-style:italic; }
.cc-kpi-empty-state { opacity:.7; }
.cc-kpi-sep {
  position:absolute;right:0;top:20%;bottom:20%;
  width:1px;background:var(--cc-line);
}

/* Proactive banner */
.cc-banner {
  flex-shrink:0;
  display:flex;align-items:center;gap:10px;
  padding:7px 16px;
  background:linear-gradient(90deg,rgba(231,176,83,.07),rgba(231,176,83,.04));
  border-bottom:1px solid rgba(231,176,83,.18);
  animation:bannerSlide .3s ease;
}
.cc-banner-dot {
  width:7px;height:7px;border-radius:50%;
  background:var(--cc-amber);flex-shrink:0;
  animation:pulseDot 2s infinite;
}
.cc-banner-text { flex:1;font-size:11px;color:var(--cc-amber);font-family:var(--cc-mono); }
.cc-banner-dismiss {
  background:transparent;border:none;color:var(--cc-dim);
  cursor:pointer;font-size:16px;padding:0 4px;line-height:1;
}
.cc-banner-dismiss:hover { color:var(--cc-muted); }

/* 3-column grid */
.cc-grid {
  flex:1;min-height:0;
  display:grid;
  grid-template-columns:minmax(540px,2fr) minmax(260px,1fr) minmax(280px,1fr);
  gap:12px;padding:12px;overflow:hidden;
}

/* ── Panels ──────────────────────────────────────────────────────────────── */
.cc-panel {
  min-width:0;min-height:0;
  border:1px solid var(--cc-line);border-radius:24px;
  background:linear-gradient(180deg,rgba(12,28,44,.93),rgba(5,13,23,.96));
  box-shadow:var(--cc-shadow);overflow:hidden;
}
.cc-head {
  height:58px;padding:0 16px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  border-bottom:1px solid var(--cc-line);
}
.cc-head h2,.cc-head h3 { margin:0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:500; }
.cc-head h2 { font-size:21px; }
.cc-head h3 { font-size:16px; }
.cc-head small {
  display:block;margin-top:2px;color:var(--cc-dim);
  font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--cc-mono);
}
.cc-head-actions { display:flex;gap:7px;align-items:center; }
.cc-link-btn { color:var(--cc-gold);font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;background:transparent;border:none;cursor:pointer; }
.cc-wanted-cta {
  border:1px solid rgba(173,146,238,.42);background:rgba(173,146,238,.08);
  color:var(--cc-violet);border-radius:9px;padding:5px 11px;
  font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer;font:inherit;
}
.cc-body { flex:1;min-height:0;overflow-y:auto;padding:12px; }
.cc-market,.cc-education,.cc-signals,.cc-map-panel {
  display:flex;flex-direction:column;min-height:0;
}

/* Marketplace tab bar */
.cc-view-bar { position:relative; }
.cc-view-bar::after { content:""; position:absolute; right:0; top:0; bottom:0; width:32px; background:linear-gradient(to left,rgba(11,25,41,1),transparent); pointer-events:none; }
.cc-view-bar {
  border-bottom:1px solid var(--cc-line);padding:7px 14px;
  display:flex;align-items:center;
  background:rgba(255,255,255,.016);flex-shrink:0;
}
.cc-views { display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px; }
.cc-views::-webkit-scrollbar{display:none;}
.cc-view {
  height:32px;border:1px solid var(--cc-line);border-radius:999px;
  background:rgba(255,255,255,.024);color:var(--cc-muted);
  padding:0 11px;white-space:nowrap;font-size:11px;cursor:pointer;font:inherit;
  transition:background .15s,color .15s,border-color .15s;
}
.cc-view.active {
  color:var(--cc-gold2);border-color:rgba(217,175,99,.42);
  background:rgba(217,175,99,.09);
}
.cc-view:hover:not(.active) { background:rgba(255,255,255,.044);color:var(--cc-text); }

/* Marketplace rows */
.cc-market-grid { flex:1;min-height:0;overflow:hidden;padding:10px;display:flex;flex-direction:column; }
.cc-market-block {
  border:1px solid var(--cc-line);border-radius:18px;
  background:rgba(255,255,255,.02);overflow:hidden;
  display:flex;flex-direction:column;flex:1;min-height:0;
}
.cc-block-title {
  padding:9px 13px;border-bottom:1px solid var(--cc-line);
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
}
.cc-block-title b { color:var(--cc-gold);font-size:10px;letter-spacing:.17em;text-transform:uppercase; }
.cc-block-title span { font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono); }
.cc-rows { flex:1;overflow-y:auto;padding:9px;display:grid;gap:9px;align-content:start; }
.cc-row {
  border:1px solid var(--cc-line);border-radius:17px;
  background:linear-gradient(180deg,rgba(18,38,58,.72),rgba(7,17,29,.92));
  padding:11px;
  display:grid;grid-template-columns:96px minmax(0,1fr) 138px;gap:11px;align-items:center;
  animation:rowIn .35s ease both;
  transition:transform .15s,box-shadow .15s,border-color .15s;
}
.cc-row:hover {
  transform:translateY(-1px);
  box-shadow:0 6px 24px rgba(0,0,0,.32);
  border-color:rgba(217,175,99,.22);
}
.cc-spec { width:96px;height:76px;border-radius:13px;border:1px solid var(--cc-line2);background:#0a1624; }
.cc-spec.supply { background:radial-gradient(circle at 32% 28%,rgba(217,175,99,.32),transparent 25%),#0a1624; }
.cc-spec.equip  { background:repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 1px,transparent 1px 8px),#0a1624; }
.cc-spec.service{ background:linear-gradient(135deg,rgba(115,210,141,.16),rgba(122,177,234,.08)),#0a1624; }
.cc-type { font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--cc-gold);font-family:var(--cc-mono);margin-bottom:3px; }
.cc-row h4 { margin:0;color:var(--cc-ink);font-size:14px;line-height:1.2;font-family:var(--cc-serif); }
.cc-row p  { margin:4px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.5;font-family:var(--cc-serif); }
.hv-tags  { display:flex;gap:5px;flex-wrap:wrap;margin-top:6px; }
.hv-tag   { height:19px;display:inline-flex;align-items:center;border:1px solid var(--cc-line2);border-radius:999px;padding:0 6px;color:var(--cc-muted);background:rgba(255,255,255,.024);font-size:9px;font-family:var(--cc-mono); }
.hv-trust { margin-top:6px;display:grid;grid-template-columns:repeat(5,52px);gap:4px; }
.hv-trust i { font-style:normal;height:18px;border:1px solid rgba(232,239,247,.1);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--cc-dim);font-size:8px;font-family:var(--cc-mono);background:rgba(255,255,255,.016); }
.hv-trust i.ok   { color:var(--cc-green); border-color:rgba(115,210,141,.26); }
.hv-trust i.warn { color:var(--cc-amber); border-color:rgba(230,176,83,.28); }
.hv-trust i.lock { color:var(--cc-violet);border-color:rgba(173,146,238,.28); }
.cc-action-box { text-align:right; }
.cc-action-box strong { display:block;color:var(--cc-ink);font-size:13px; }
.cc-action-box small  { display:block;color:var(--cc-dim);font-family:var(--cc-mono);font-size:9px;margin-top:2px; }
.cc-row-action,.cc-secondary,.cc-edu-cta {
  margin-top:6px;border-radius:9px;
  border:1px solid rgba(217,175,99,.34);background:rgba(217,175,99,.07);
  color:var(--cc-gold2);padding:6px 9px;font-size:10px;font-weight:600;
  display:inline-flex;cursor:pointer;font:inherit;
  transition:background .15s,transform .1s;
}
.cc-row-action:hover,.cc-edu-cta:hover { background:rgba(217,175,99,.14);transform:translateY(-1px); }
.cc-secondary { border-color:rgba(217,175,99,.28);background:rgba(217,175,99,.04);color:var(--cc-gold);display:flex;justify-content:center; }
.cc-secondary.active { border-color:rgba(120,215,211,.5);background:rgba(120,215,211,.14);color:var(--cc-cyan);font-weight:600; }
.cc-empty-state { border:1px dashed var(--cc-line2);border-radius:12px;padding:14px;color:var(--cc-muted);font-size:11px; }
.cc-empty-cta { color:var(--cc-gold);font-size:11px;cursor:pointer;background:transparent;border:none;display:inline-block;margin-top:6px; }

/* Education */
.cc-col2,.cc-col3 { display:flex;flex-direction:column;gap:12px;min-height:0;overflow:hidden; }
.cc-education { flex:1; }
.cc-education .cc-body { display:flex;flex-direction:column;overflow:hidden; }
.cc-edu-intro {
  border:1px solid rgba(217,175,99,.24);border-radius:16px;padding:11px;
  background:linear-gradient(135deg,rgba(217,175,99,.09),rgba(120,215,211,.04));
  margin-bottom:9px;flex-shrink:0;
}
.cc-edu-intro strong { display:block;color:var(--cc-gold2);font-family:var(--cc-serif);font-weight:500;font-size:16px; }
.cc-edu-intro p,.cc-edu p,.cc-signal p,.cc-pay-boundary p,.cc-rules p { margin:5px 0 0;color:var(--cc-muted);font-size:13px;line-height:1.5;font-family:var(--cc-serif); }
.cc-edu-intel-badge {
  margin-top:8px;display:flex;align-items:center;gap:6px;
  font-size:10px;color:var(--cc-blue);font-family:var(--cc-mono);
}
.cc-intel-dot { width:6px;height:6px;border-radius:50%;background:var(--cc-blue);animation:pulseDot 2.5s infinite; }
.cc-edu-cards { display:grid;gap:7px;overflow-y:auto;flex:1;min-height:0;align-content:start; }
.cc-edu { border:1px solid var(--cc-line);border-radius:14px;background:rgba(255,255,255,.024);padding:10px;transition:border-color .15s; }
.cc-edu:hover { border-color:rgba(217,175,99,.22); }
.cc-edu small { display:block;color:var(--cc-gold);font-family:var(--cc-mono);font-size:8px;letter-spacing:.13em;text-transform:uppercase;margin-bottom:4px; }
.cc-edu b { display:block;color:var(--cc-ink);font-size:12px;font-family:var(--cc-serif); }

/* Signals */
.cc-signals { flex:1.05; }
.cc-map-panel { flex:.95; }
.cc-signal-list { display:grid;gap:9px;align-content:start; }
.cc-signal {
  border:1px solid var(--cc-line);border-radius:15px;
  background:rgba(255,255,255,.024);padding:11px;
  display:grid;grid-template-columns:6px minmax(0,1fr) auto;gap:9px;align-items:start;
  transition:border-color .15s;
}
.cc-signal:hover { border-color:rgba(232,240,248,.22); }
.cc-sev { height:100%;min-height:54px;border-radius:999px;background:var(--cc-green); }
.cc-sev.low { background:var(--cc-amber); }
.cc-signal-top { display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px; }
.cc-signal b,.cc-pay-boundary b,.cc-rules b { display:block;color:var(--cc-ink);font-size:12px;line-height:1.25;font-family:var(--cc-serif); }
.cc-signal small { display:block;margin-top:4px;color:var(--cc-dim);font-family:var(--cc-mono);font-size:9px; }
.cc-impact { margin-top:6px;border:1px solid rgba(217,175,99,.18);border-radius:8px;padding:5px;color:var(--cc-gold2);font-size:9px;background:rgba(217,175,99,.04); }
.cc-signal-tag { border:1px solid;border-radius:999px;padding:2px 6px;font-family:var(--cc-mono);font-size:8px; }
.cc-badge { border:1px solid rgba(217,175,99,.3);color:var(--cc-gold);border-radius:999px;padding:3px 7px;font-family:var(--cc-mono);font-size:8px;white-space:nowrap;cursor:pointer;background:transparent; }
.cc-pay-boundary { margin-top:9px;border:1px solid rgba(173,146,238,.28);border-radius:15px;padding:11px;background:linear-gradient(135deg,rgba(173,146,238,.08),rgba(255,255,255,.02)); }
.cc-spark { display:block;flex-shrink:0; }

/* Local intel / map */
.cc-map-body { display:flex;flex-direction:column;gap:8px; }
.cc-country-intel-card {
  border:1px solid rgba(122,177,234,.22);border-radius:13px;padding:10px;
  background:rgba(122,177,234,.04);flex-shrink:0;
}
.cc-country-intel-head { display:flex;align-items:center;gap:7px;margin-bottom:6px; }
.cc-country-intel-dot { width:6px;height:6px;border-radius:50%;background:var(--cc-blue);animation:pulseDot 3s infinite; }
.cc-country-intel-head small { color:var(--cc-blue);font-family:var(--cc-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase; }
.cc-country-intel-card p { margin:0;color:var(--cc-muted);font-size:13px;line-height:1.5;font-family:var(--cc-serif); }
.cc-legend { display:flex;gap:5px;flex-wrap:wrap;flex-shrink:0; }
.cc-legend span { height:20px;border:1px solid var(--cc-line);border-radius:999px;padding:0 7px;display:inline-flex;align-items:center;font-size:9px;color:var(--cc-muted);font-family:var(--cc-mono); }
.cc-map-wrap { flex:1;min-height:0;border:1px solid var(--cc-line);border-radius:17px;background:linear-gradient(180deg,rgba(255,255,255,.026),rgba(255,255,255,.01));overflow:hidden;display:flex;flex-direction:column; }
.cc-region-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:9px;overflow:auto;flex-shrink:0; }
.cc-region-tile { border:1px solid var(--cc-line);border-radius:11px;background:rgba(122,177,234,.1);color:var(--cc-text);padding:9px;font:inherit;font-size:10px;cursor:pointer;transition:background .15s,border-color .15s; }
.cc-region-tile.active { background:rgba(217,175,99,.22);border-color:rgba(243,207,134,.75); }
.cc-region-tile.warn  { box-shadow:inset 0 0 0 1px rgba(226,116,102,.24); }
.cc-region-tile:hover:not(.active) { background:rgba(255,255,255,.06); }
.cc-rules { border-top:1px solid var(--cc-line);padding:9px 11px;background:rgba(5,13,23,.76);overflow-y:auto; }
.cc-rule-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px; }
.cc-rule-grid div { border:1px solid var(--cc-line);border-radius:11px;padding:8px;background:rgba(255,255,255,.022); }
.cc-rule-grid strong { display:block;color:var(--cc-ink);font-size:11px;margin-top:2px; }
.cc-rule-grid small { display:block;color:var(--cc-muted);font-size:9px;text-transform:uppercase;letter-spacing:.12em;font-family:var(--cc-mono); }
.cc-next-action { margin-top:9px!important;color:var(--cc-gold2)!important;font-size:11px; }

/* ── Status bar ──────────────────────────────────────────────────────────── */
.cc-status {
  grid-column:2/-1;grid-row:3;z-index:5;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 16px;
  border-top:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(4,9,18,.94),rgba(3,8,17,.99));
  font-size:9px;color:var(--cc-dim);font-family:var(--cc-mono);gap:14px;
}
.cc-status b { color:var(--cc-green); }

/* ── Scrim ────────────────────────────────────────────────────────────────── */
.cc-scrim {
  position:fixed;inset:0;background:rgba(0,0,0,.44);z-index:20;
  backdrop-filter:blur(2px);
}

/* ── Command panel drawer ────────────────────────────────────────────────── */
.cc-command-panel {
  position:fixed;right:0;top:0;bottom:0;width:440px;max-width:92vw;z-index:30;
  background:linear-gradient(180deg,rgba(10,22,36,.99),rgba(5,13,24,1));
  border-left:1px solid var(--cc-line2);
  box-shadow:-32px 0 96px rgba(0,0,0,.52);
  transform:translateX(100%);transition:transform .28s cubic-bezier(.25,.46,.45,.94);
  display:flex;flex-direction:column;
}
.cc-command-panel.open { transform:translateX(0); }
.cc-drawer-head { padding:18px 20px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between; }
.cc-drawer-head small { display:block;color:var(--cc-dim);font-size:9px;text-transform:uppercase;letter-spacing:.16em;font-family:var(--cc-mono); }
.cc-drawer-head h3 { margin:5px 0 0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:500;font-size:17px; }
.cc-close { width:34px;height:34px;border-radius:9px;border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);color:var(--cc-muted);font-size:20px;cursor:pointer;display:grid;place-items:center;flex-shrink:0; }
.cc-drawer-body { flex:1;overflow:auto;padding:18px 20px;display:grid;gap:14px;align-content:start; }
.cc-drawer-card { border:1px solid var(--cc-line);border-radius:17px;padding:15px;background:rgba(255,255,255,.02); }
.cc-drawer-card b { display:block;color:var(--cc-ink);font-size:14px;font-family:var(--cc-serif);margin-bottom:5px; }
.cc-drawer-card p { margin:0;color:var(--cc-muted);font-size:13px;line-height:1.5;font-family:var(--cc-serif); }
.cc-panel-list { display:grid;gap:6px;margin-top:11px; }
.cc-panel-list span { border:1px solid var(--cc-line);border-radius:9px;padding:7px;color:var(--cc-muted);font-size:10px;background:rgba(255,255,255,.022); }

/* Panel signal list */
.cc-panel-signal-list { display:grid;gap:9px;margin-top:11px; }
.cc-panel-signal { border:1px solid var(--cc-line);border-radius:13px;padding:10px;background:rgba(255,255,255,.018); }
.cc-panel-signal-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:7px; }
.cc-panel-signal-title { display:block;color:var(--cc-ink);font-size:12px;font-family:var(--cc-serif);margin-bottom:3px; }
.cc-panel-signal-impact { margin:0 0 4px;color:var(--cc-muted);font-size:13px;line-height:1.5;font-family:var(--cc-serif); }
.cc-conf-num { font-family:var(--cc-mono);font-size:11px;font-weight:500; }

/* Wanted cards */
.cc-panel-wanted { display:grid;gap:9px;margin-top:10px; }
.cc-wanted-card { border:1px solid rgba(173,146,238,.2);border-radius:14px;padding:11px;background:rgba(173,146,238,.04); }
.cc-wanted-head { display:flex;align-items:center;gap:7px;margin-bottom:7px; }
.cc-wanted-tag { font-family:var(--cc-mono);font-size:8px;letter-spacing:.14em;color:var(--cc-violet);border:1px solid rgba(173,146,238,.3);border-radius:999px;padding:2px 7px; }
.cc-wanted-loc { color:var(--cc-dim);font-size:9px;font-family:var(--cc-mono); }
.cc-wanted-ago { color:var(--cc-dim);font-size:9px;font-family:var(--cc-mono);margin-left:auto; }
.cc-wanted-title { margin:0 0 4px;color:var(--cc-ink);font-size:13px;font-family:var(--cc-serif); }
.cc-wanted-sum { margin:0 0 8px;color:var(--cc-muted);font-size:13px;line-height:1.5;font-family:var(--cc-serif); }

/* Intel blocks */
.cc-intel-block { margin:10px 0;border:1px solid rgba(122,177,234,.2);border-radius:11px;padding:9px;background:rgba(122,177,234,.04); }
.cc-intel-block.accent-blue { border-color:rgba(122,177,234,.3);background:rgba(122,177,234,.07); }
.cc-intel-block small { display:block;color:var(--cc-blue);font-family:var(--cc-mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px; }
.cc-intel-block p { margin:0;color:var(--cc-muted);font-size:13px;line-height:1.5;font-family:var(--cc-serif); }

/* Watchlist */
.cc-watch-item { display:flex;align-items:center;gap:7px;font-size:11px;color:var(--cc-text); }
.cc-watch-dot  { width:6px;height:6px;border-radius:50%;background:var(--cc-gold);flex-shrink:0; }

/* Notifications */
.cc-notif-item { display:flex;align-items:center;gap:8px;font-size:11px;color:var(--cc-text); }
.cc-notif-dot        { width:7px;height:7px;border-radius:50%;flex-shrink:0; }
.cc-notif-dot.signal  { background:var(--cc-amber); }
.cc-notif-dot.pipeline{ background:var(--cc-blue); }

/* Settings grid */
.cc-settings-grid { display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:11px 0; }
.cc-setting-item { border:1px solid var(--cc-line);border-radius:11px;padding:9px;background:rgba(255,255,255,.022); }
.cc-setting-item small { display:block;color:var(--cc-muted);font-size:9px;text-transform:uppercase;letter-spacing:.11em;margin-bottom:3px;font-family:var(--cc-mono); }
.cc-setting-item strong { color:var(--cc-ink);font-size:11px; }

/* External link */
.cc-link-external { display:inline-block;margin-top:11px;color:var(--cc-gold);font-size:11px;text-decoration:none; }
.cc-link-external:hover { color:var(--cc-gold2); }

/* Primary inline */
.cc-primary.inline { height:auto;padding:9px 12px;margin-top:11px;font-size:12px; }

/* ── Command Palette ─────────────────────────────────────────────────────── */
.cp-overlay {
  position:fixed;inset:0;z-index:50;
  background:rgba(0,0,0,.7);backdrop-filter:blur(10px);
  display:grid;place-items:start center;padding-top:10vh;
}
.cp-box {
  width:560px;max-width:96vw;
  background:linear-gradient(180deg,rgba(12,24,40,.99),rgba(6,14,26,1));
  border:1px solid rgba(232,240,248,.2);border-radius:22px;
  overflow:hidden;
  box-shadow:0 52px 120px rgba(0,0,0,.76);
  animation:fadeSlideUp .18s ease;
}
.cp-topbar {
  display:flex;align-items:center;gap:11px;
  padding:16px 18px;border-bottom:1px solid var(--cc-line);
}
.cp-search-icon { color:var(--cc-gold);font-size:14px;font-family:var(--cc-mono);flex-shrink:0; }
.cp-input {
  flex:1;background:transparent;border:none;outline:none;
  color:var(--cc-ink);font:inherit;font-size:14px;
}
.cp-input::placeholder { color:var(--cc-dim); }
.cp-esc {
  border:1px solid var(--cc-line2);border-radius:7px;
  padding:3px 7px;font-family:var(--cc-mono);font-size:9px;
  color:var(--cc-muted);cursor:pointer;background:rgba(255,255,255,.04);
  letter-spacing:.1em;
}
.cp-results { max-height:380px;overflow-y:auto;padding:8px; }
.cp-group-head {
  padding:7px 10px 3px;font-size:8px;text-transform:uppercase;
  letter-spacing:.16em;color:var(--cc-dim);font-family:var(--cc-mono);
}
.cp-item {
  width:100%;display:flex;align-items:center;gap:9px;
  padding:9px 10px;border-radius:10px;
  border:none;background:transparent;color:var(--cc-text);
  cursor:pointer;font:inherit;font-size:12px;text-align:left;
  transition:background .1s,color .1s;
}
.cp-item.active { background:rgba(217,175,99,.1);color:var(--cc-gold2); }
.cp-item:hover:not(.active) { background:rgba(255,255,255,.04); }
.cp-item-icon { font-size:13px;width:20px;text-align:center;flex-shrink:0; }
.cp-item-label { flex:1; }
.cp-item-sub { font-size:10px;color:var(--cc-muted);font-family:var(--cc-mono); }
.cp-empty { padding:24px;text-align:center;color:var(--cc-muted);font-size:12px; }
.cp-footer {
  padding:9px 14px;border-top:1px solid var(--cc-line);
  display:flex;align-items:center;gap:14px;
}
.cp-footer span { font-size:9px;color:var(--cc-dim);font-family:var(--cc-mono);letter-spacing:.08em; }
.cp-footer-ctx { margin-left:auto;color:var(--cc-gold);font-family:var(--cc-mono);font-size:9px; }


/* ── Mobile bottom nav ───────────────────────────────────────────────────── */
.cc-mob-nav {
  display:none;
  position:fixed;bottom:0;left:0;right:0;
  height:56px;
  background:rgba(4,8,18,.97);
  border-top:1px solid var(--cc-line2);
  z-index:40;
  padding:0 8px env(safe-area-inset-bottom,0);
  backdrop-filter:blur(12px);
}
.cc-mob-nav-btn {
  flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:3px;
  background:transparent;border:none;
  color:var(--cc-dim);cursor:pointer;font:inherit;
  padding:5px 0;
  transition:color .15s;
}
.cc-mob-nav-btn span { font-size:18px;line-height:1; }
.cc-mob-nav-btn em { font-style:normal;font-size:8px;text-transform:uppercase;letter-spacing:.09em; }
.cc-mob-nav-btn.active { color:var(--cc-gold2); }

/* ── Responsive fallback ─────────────────────────────────────────────────── */
@media(max-width:1180px) {
  .cc-app { position:relative;min-height:100vh;overflow:auto;display:block; }
  .cc-top { display:flex;flex-direction:column;align-items:stretch; }
  .cc-context { grid-template-columns:1fr 1fr; }
  .cc-sidebar { display:none; }
  .cc-workspace { display:flex;padding-bottom:64px; }
  .cc-grid { display:grid;grid-template-columns:1fr;overflow:visible;padding:10px;gap:10px; }
  .cc-status { display:none; }
  .cc-row { grid-template-columns:1fr; }
  .cc-spec { display:none; }
  .cc-action-box { text-align:left; }
  .cc-col2,.cc-col3 { overflow:visible; }
  .cc-command-panel { inset:0;width:100vw;max-width:none;border-left:0; }
  .cp-box { width:min(92vw,560px); }
  .cc-mob-nav { display:flex; }
  .cc-pay-boundary p,.cc-intel-block p,.cc-wanted-sum,.cc-drawer-card p { font-size:14px; }
  .cc-row h4 { font-size:16px; }
  .cc-row p { font-size:13px; }
}
`
