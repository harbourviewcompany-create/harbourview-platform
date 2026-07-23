'use client'

import './CommandCentre.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, WatchlistData, PathwayData, SourceCoverageRow, RegistryCoverageSummary, LocalIntelData, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator, CountryEducationOverlay, MySubmission } from '@/lib/dashboard/dashboardLiveData'
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
import { WantedDetailModal } from './WantedDetailModal'
import { GeneticsRequestModal } from './GeneticsRequestModal'
import { GeneticsProgramModal } from './GeneticsProgramModal'
import { QuoteModal } from './QuoteModal'
import { MySubmissionsPanel } from './MySubmissionsPanel'
import { ConsumablesRequestModal } from './ConsumablesRequestModal'
import { DealRoomsPanel as DealRoomsSidebarWidget } from './DealRoomsPanel'
import { AssistantPage } from './pages/AssistantPage'
import { CORRIDOR_BANKING, CORRIDOR_AUTHORITY, CORRIDOR_COSTS } from './data/corridorIntel'
import { INDUSTRY_EVENTS, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, type CannabisEvent } from './data/industryEvents'
import { BANKING_PROVIDERS, PROVIDER_TYPE_LABELS, PROVIDER_TYPE_COLORS, STANCE_LABELS, STANCE_COLORS, type BankingProvider } from './data/bankingProviders'
import { PRICE_BENCHMARKS, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_ICONS, TIER_LABELS, TIER_COLORS, type PriceBenchmark } from './data/priceIntelligence'
import { LOGISTICS_PROVIDERS, LOGISTICS_TYPE_LABELS, LOGISTICS_TYPE_COLORS, type LogisticsType } from './data/logisticsProviders'
import { JOB_LISTINGS, JOB_TYPE_LABELS, JOB_TYPE_COLORS, JOB_SECTOR_LABELS, type JobType, type JobSector } from './data/jobsBoard'
import { INSURANCE_PROVIDERS, INSURANCE_LINE_LABELS, INSURANCE_ROLE_LABELS, INSURANCE_ROLE_COLORS, type InsuranceProviderRole, type InsuranceLineType, type InsuranceProvider } from './data/insuranceProviders'
import { EXPORTER_ORIGINS, DESTINATION_MARKETS, FREIGHT_CORRIDORS, LANDED_PRODUCT_LABELS, calcLandedCost, type LandedProductType } from './data/landedCostData'
import { WatchlistPage } from './pages/WatchlistPage'

const DigestPageLazy = dynamic(() => import('./pages/DigestPage').then(m => m.DigestPage))

import { GlobeProvider } from '@/components/globe/GlobeProvider'
import { DealRoomsPanel } from './pages/DealRoomsPanel'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import QuoteRequestForm from '@/app/marketplace/quote/QuoteRequestForm'
import { MyListingsClient } from '@/app/marketplace/my-listings/MyListingsClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'

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
  | 'assistant'
  | 'documents'
  | 'events'
  | 'experts'
  | 'banking'
  | 'notifications'
  | 'kyb'
  | 'prices'
  | 'logistics'
  | 'jobs'
  | 'insurance'
  | 'licences'
  | 'trade-calc'
  | 'organization'

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
  regionLabel?:     string | null
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
  registryCoverageSummary?: RegistryCoverageSummary
  jurisdictionPlaybook?: JurisdictionPlaybook
  pathwayMatrix?:       import('@/lib/intelligence/regulatoryPathways').CountryPathwayMatrix
  educationTracks?:     EducationTrack[]
  marketMetrics?:       MarketMetric[]
  tradeFlows?:          TradeFlow[]
  professionals?:       HvProfessional[]
  cannabisOperators?:   CannabisOperator[]
  operatorLicenceMatrix?: import('@/lib/intelligence/operatorIntelligence').OperatorLicenceMatrix
  userEmail?:           string | null
  cultivarPassports?:   PublicCultivarPassportDTO[]
  serviceProviders?:    PublicServiceProvider[]
  collaborationProjects?: PublicCollaborationProject[]
  mySubmissions?:       MySubmission[]
  hasOrg?:              boolean
}

// ── Globe (dynamic — SSR off) ─────────────────────────────────────────────────

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

const FORMAT_STATUS_COLOR: Record<string, string> = {
  permitted: '#5fb87a',
  restricted: '#d4a84b',
  prohibited: '#e05555',
  unclear: 'rgba(245,240,232,.4)',
}

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
      { id: 'evidence',       label: 'Research',         icon: '⊟' },
    ],
  },
  {
    label: 'Trade & Commerce',
    items: [
      { id: 'prices',     label: 'Price Intel',     icon: '⊕' },
      { id: 'trade-calc', label: 'Trade Calculator', icon: '⊜' },
      { id: 'logistics',  label: 'Logistics',       icon: '⬡' },
      { id: 'banking',    label: 'Banking',         icon: '⊟' },
    ],
  },
  {
    label: 'Industry',
    items: [
      { id: 'events',  label: 'Events',          icon: '◷' },
      { id: 'jobs',    label: 'Jobs Board',      icon: '◉' },
      { id: 'experts', label: 'Expert Directory', icon: '⊚' },
    ],
  },
  {
    label: 'Compliance & Legal',
    items: [
      { id: 'genetics',   label: 'Genetics',    icon: '⊕' },
      { id: 'compliance', label: 'Compliance',  icon: '◫' },
      { id: 'licences',   label: 'Licences',    icon: '◨' },
      { id: 'kyb',        label: 'KYB / Verify', icon: '◫' },
      { id: 'countries',  label: 'Countries',   icon: '⊗' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'assistant',     label: 'AI Assistant',  icon: '◈' },
      { id: 'notifications', label: 'Notifications', icon: '◎' },
      { id: 'documents',     label: 'Documents',     icon: '⊡' },
      { id: 'organization',  label: 'Organization',  icon: '⊙' },
      { id: 'settings',      label: 'Settings',      icon: '⊙' },
    ],
  },
]

// Flat list — used by pageTitle, CommandPalette, mobile nav
const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

// ── BriefingRoom page ─────────────────────────────────────────────────────────

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
  return v.replace(/_/g, ' ').replace(/\w/g, c => c.toUpperCase())
}

const BRIEFING_ROLE_MODULES: Record<string, Array<{ page: CommandPage; icon: string; label: string; why: string }>> = {
  'Doctor':      [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Patient prescription framework & clinical authorizations' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Track prescribing and formulary rule changes' },
    { page: 'experts',        icon: '⊛', label: 'Expert Directory',   why: 'Connect with clinical pharmacologists & peers' },
  ],
  // Extend with more roles as needed
}

// ── Main CommandCentre Component ───────────────────────────────────────────────

export default function CommandCentre(props: Props) {
  const router = useRouter()

  const initialCountry = useMemo(() => {
    const found = COUNTRIES.find(c => c.iso2 === props.initialCountryIso2)
    return found ?? { iso2: 'GLOBAL', label: 'Global Market' }
  }, [props.initialCountryIso2])

  const [country, setCountry] = useState(initialCountry)
  const [region, setRegion] = useState(props.regionLabel ?? '')
  const [role, setRole] = useState(props.initialRoleId ?? '')
  const [activePage, setActivePage] = useState<CommandPage>(props.initialPage ?? 'briefing')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [liveCountryIntel, setLiveCountryIntel] = useState<CountryIntelProfile | null>(props.countryIntel ?? null)
  const [intelLoading, setIntelLoading] = useState(false)

  // Live signals for SignalsPage
  const [liveSignals, setLiveSignals] = useState<DashboardSignal[] | null>(null)

  // Use Supabase realtime for signals
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Placeholder — replace with actual Supabase client import
    // const supabase = createClient(...)
    // const channel = supabase.channel('signals')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_signals' }, payload => {
    //     // Merge / update liveSignals
    //   })
    //   .subscribe()

    // return () => channel.unsubscribe()
  }, [country.iso2])

  const handleCountryChange = useCallback((iso2: string) => {
    const found = COUNTRIES.find(c => c.iso2 === iso2)
    if (!found) return
    setCountry(found)
    setRegion('')
    // Update URL
    const params = new URLSearchParams(window.location.search)
    params.set('country', iso2)
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }, [router])

  const handleRoleChange = useCallback((roleId: string) => {
    setRole(roleId)
    const params = new URLSearchParams(window.location.search)
    params.set('role', roleId)
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }, [router])

  const handlePageChange = useCallback((page: CommandPage) => {
    setActivePage(page)
    const params = new URLSearchParams(window.location.search)
    params.set('page', page)
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }, [router])

  // Render selected page
  const renderPage = () => {
    const commonProps = {
      country,
      region,
      role,
      liveCountryIntel,
      intelLoading,
      onCountrySelect: handleCountryChange,
      onPageChange: handlePageChange,
      ...props,
    }

    switch (activePage) {
      case 'briefing':
        return <BriefingRoom {...commonProps} />
      // ... other pages (add as you create them)
      default:
        return <div>Page "{activePage}" not implemented yet.</div>
    }
  }

  return (
    <div className="cc-app flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* Sidebar Nav */}
      <aside className="w-72 border-r border-zinc-800 flex-shrink-0 overflow-y-auto bg-zinc-950">
        <nav className="p-6">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className="mb-10">
              {section.label && (
                <div className="uppercase text-xs tracking-[2px] text-zinc-500 mb-4 px-4">{section.label}</div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all mb-1 hover:bg-zinc-900/80 ${
                    activePage === item.id
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl opacity-75">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-zinc-950">{renderPage()}</main>
    </div>
  )
}

// ── BriefingRoom Component (Full) ─────────────────────────────────────────────

function BriefingRoom({
  country,
  region,
  role,
  liveCountryIntel,
  intelLoading,
  pipeline,
  wantedListings,
  onPageChange,
}: any) {
  const bars = buildConfidenceBars(liveCountryIntel)
  const confidence = overallConfidence(bars)

  return (
    <div className="p-10 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="text-7xl drop-shadow-md">{flagEmoji(country.iso2)}</div>
          <div>
            <h1 className="text-6xl font-bold tracking-tighter">{country.label}</h1>
            {region && <p className="text-2xl text-zinc-400 mt-1">{region}</p>}
          </div>
        </div>

        <div className="text-right">
          <div className="text-emerald-400 text-xs tracking-widest">CONFIDENCE SCORE</div>
          <div className="text-[120px] font-mono leading-none font-bold -mt-4">{confidence}</div>
        </div>
      </div>

      {/* Confidence Breakdown */}
      <div>
        <h3 className="uppercase text-sm tracking-widest text-zinc-500 mb-8">Intelligence Coverage</h3>
        <div className="grid grid-cols-5 gap-6">
          {bars.map((bar, i) => (
            <div key={i} className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
              <div className="text-sm text-zinc-400 mb-8">{bar.label}</div>
              <div className="text-[88px] font-mono font-semibold text-white tracking-tighter">{bar.pct}</div>
              <div className="mt-6 h-1.5 bg-zinc-800 rounded">
                <div
                  className="h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 rounded"
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Snapshot */}
      {pipeline && (
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-10">
            <div className="text-emerald-400">Pipeline Health</div>
            <div className="text-8xl font-mono mt-4">{pipeline.active_deals || 0}</div>
            <div className="text-xl text-zinc-400">Active Opportunities</div>
          </div>
          {/* More cards... */}
        </div>
      )}

      {/* Role Guidance */}
      {role && BRIEFING_ROLE_MODULES[role] && (
        <div>
          <h3 className="uppercase text-sm tracking-widest text-zinc-500 mb-6">Tailored Actions</h3>
          <div className="grid grid-cols-3 gap-6">
            {BRIEFING_ROLE_MODULES[role].map((mod, i) => (
              <button
                key={i}
                onClick={() => onPageChange(mod.page)}
                className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-3xl p-9 text-left transition-all"
              >
                <div className="text-5xl mb-8 transition-transform group-hover:scale-110">{mod.icon}</div>
                <div className="text-2xl font-semibold">{mod.label}</div>
                <p className="text-zinc-400 mt-4 text-[15px] leading-relaxed pr-6">{mod.why}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wants */}
      {wantedListings?.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="uppercase text-sm tracking-widest text-zinc-500">Hot Wants</h3>
            <button onClick={() => onPageChange('marketplace')} className="text-sm text-blue-400 hover:underline">
              All opportunities →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {wantedListings.slice(0, 4).map((w) => (
              <div key={w.id} className="bg-zinc-900 border border-amber-900/40 rounded-3xl p-7">
                <div className="font-semibold text-xl">{w.title}</div>
                <div className="text-amber-400 font-mono mt-1">{w.budget_range}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
