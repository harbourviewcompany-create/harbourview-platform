'use client'
import './CommandCentre.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, WatchlistData, PathwayData, SourceCoverageRow, RegistryCoverageSummary, LocalIntelData, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator, CountryEducationOverlay, MySubmission } from '@/lib/dashboard/dashboardLiveData'
import { buildConfidenceLanes, overallConfidence as computeOverallConfidence, type ConfidenceLane } from '@/lib/dashboard/confidenceScoring'
import { useDashboardSignalsRealtime } from '@/components/dashboard/useDashboardSignalsRealtime'
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
import ClinicalPage from './pages/ClinicalPage'
import { CORRIDOR_BANKING, CORRIDOR_AUTHORITY, CORRIDOR_COSTS } from './data/corridorIntel'
import { INDUSTRY_EVENTS, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, type CannabisEvent } from './data/industryEvents'
import { BANKING_PROVIDERS, PROVIDER_TYPE_LABELS, PROVIDER_TYPE_COLORS, STANCE_LABELS, STANCE_COLORS, type BankingProvider } from './data/bankingProviders'
import { PRICE_BENCHMARKS, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_ICONS, TIER_LABELS, TIER_COLORS, type PriceBenchmark } from './data/priceIntelligence'
import { LOGISTICS_PROVIDERS, LOGISTICS_TYPE_LABELS, LOGISTICS_TYPE_COLORS, type LogisticsType } from './data/logisticsProviders'
import { JOB_LISTINGS, JOB_TYPE_LABELS, JOB_TYPE_COLORS, JOB_SECTOR_LABELS, type JobType, type JobSector } from './data/jobsBoard'
import { INSURANCE_PROVIDERS, INSURANCE_LINE_LABELS, INSURANCE_ROLE_LABELS, INSURANCE_ROLE_COLORS, type InsuranceProviderRole, type InsuranceLineType, type InsuranceProvider } from './data/insuranceProviders'
import { EXPORTER_ORIGINS, DESTINATION_MARKETS, FREIGHT_CORRIDORS, LANDED_PRODUCT_LABELS, calcLandedCost, type LandedProductType } from './data/landedCostData'
import { WatchlistPage } from './pages/WatchlistPage'
import { WatchlistUpgradeGate } from './WatchlistUpgradeGate'
import type { FeatureAccess } from '@/lib/billing/entitlements'
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
  | 'regulatory'
  | 'local-intel'
  | 'signals'
  | 'watchlist'
  | 'settings'
  | 'genetics'
  | 'clinical'
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
  | 'talent'

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
  // Subnational selection carried from the globe router (e.g. "Illinois" for
  // US-IL). Not resolved into desktop's own country model — display-only,
  // consumed by MobileCommandCentre's header/Local Intel; accepted here so
  // the shared Props type (DashboardResponsiveShell) stays structurally
  // compatible across both shells.
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
  watchlistAccess?:  FeatureAccess
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
      { id: 'insurance',  label: 'Insurance',       icon: '⊡' },
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
      { id: 'clinical',   label: 'Clinical',    icon: '⚕' },
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

function fmtStatus(v: string | null | undefined, fallback = '—'): string {
  if (!v) return fallback
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

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

const BriefingRoom = React.memo(function BriefingRoom({
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

        <div className="cc-right-section" style={{ borderLeft: '2px solid rgba(212,168,75,.35)', paddingLeft: 12 }}>
          <div className="cc-right-head" style={{ color: '#d4a84b' }}>AI EXECUTIVE BRIEFING</div>
          {aiBriefingLoading ? (
            <p className="cc-right-prose" style={{ color: 'rgba(245,240,232,.4)', fontStyle: 'italic' }}>Generating briefing…</p>
          ) : aiBriefing ? (
            <p className="cc-right-prose" style={{ lineHeight: 1.6 }}>{aiBriefing}</p>
          ) : aiBriefingError ? (
            <p className="cc-right-prose" style={{ color: 'rgba(245,240,232,.3)', fontStyle: 'italic' }}>Briefing unavailable — check connection.</p>
          ) : null}
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
  country, region, role, signals, watchlistData, onPageChange,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  signals: DashboardSignal[]
  watchlistData?: WatchlistData
  onPageChange?: (page: CommandPage) => void
}) {
  const [filterImpact,  setFilterImpact]  = useState('all')
  const [filterConf,    setFilterConf]    = useState('all')
  const [filterType,    setFilterType]    = useState('all')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [selectedSignal, setSelectedSignal] = useState<DashboardSignal | null>(null)
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
      <div className="cc-two-main" style={{ position: 'relative', overflow: 'hidden' }}>
        {selectedSignal && (() => {
          const imp = deriveImpact(selectedSignal.confidence)
          const impColor = selectedSignal.confidence >= 80 ? 'var(--cc-green)' : selectedSignal.confidence >= 65 ? 'var(--cc-amber)' : 'var(--cc-red)'
          const grp = deriveSignalGroup(selectedSignal.title)
          return (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--cc-page-bg, #0b1929)', zIndex: 10, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <button type="button" onClick={() => setSelectedSignal(null)} style={{ alignSelf: 'flex-start', margin: '16px 20px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,168,75,.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← INTELLIGENCE FEED
              </button>
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span className={`cc-imp-badge ${imp.toLowerCase()}`}>{imp}</span>
                  <span style={{ fontSize: '10px', color: 'var(--cc-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{grp}</span>
                  <span style={{ fontSize: '10px', color: 'var(--cc-muted)', marginLeft: 'auto' }}>{selectedSignal.timeAgo}</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cc-text)', lineHeight: 1.3, marginBottom: 8 }}>{selectedSignal.title}</h2>
                {selectedSignal.market && (
                  <p style={{ fontSize: '11px', color: 'var(--cc-muted)', marginBottom: 16 }}>
                    {selectedSignal.market}{region ? ` · ${region}` : ''}
                  </p>
                )}
              </div>
              <div className="cc-jx-fields" style={{ margin: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">◎</span>
                  <div><small>Confidence</small><strong style={{ color: impColor }}>{selectedSignal.confidence}%</strong></div>
                </div>
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">≋</span>
                  <div><small>Impact</small><strong>{imp}</strong></div>
                </div>
                {selectedSignal.market && (
                  <div className="cc-jx-field">
                    <span className="cc-jx-field-icon">◫</span>
                    <div><small>Jurisdiction</small><strong>{selectedSignal.market}</strong></div>
                  </div>
                )}
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">◷</span>
                  <div><small>Detected</small><strong>{selectedSignal.timeAgo}</strong></div>
                </div>
              </div>
              {selectedSignal.commercialImpact && (
                <div style={{ margin: '0 20px 12px', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${impColor}` }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cc-champagne)', marginBottom: 6 }}>Commercial impact</p>
                  <p style={{ fontSize: '12px', color: 'rgba(243,240,234,0.75)', lineHeight: 1.55 }}>{selectedSignal.commercialImpact}</p>
                </div>
              )}
              <div style={{ margin: '0 20px 12px', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cc-champagne)', marginBottom: 6 }}>Why it matters</p>
                <p style={{ fontSize: '12px', color: 'rgba(243,240,234,0.65)', lineHeight: 1.55 }}>
                  This signal affects operations in {selectedSignal.market || country.label}{region ? ` · ${region}` : ''}. {imp === 'High' ? 'High-impact signals indicate regulatory or market changes requiring immediate attention.' : imp === 'Medium' ? 'Medium-impact signals warrant monitoring and may influence near-term decisions.' : 'Low-impact signals provide contextual intelligence for strategic planning.'}
                </p>
              </div>
              <div style={{ margin: '0 20px 20px', display: 'flex', gap: 8 }}>
                <button className="cc-sig-brief" style={{ flex: 1, padding: '8px 0', borderRadius: 10 }} onClick={() => onPageChange?.('watchlist')}>↗ Add to watchlist</button>
                <button className="cc-sig-brief" style={{ flex: 1, padding: '8px 0', borderRadius: 10 }} onClick={() => setSelectedSignal(null)}>Back to feed</button>
              </div>
            </div>
          )
        })()}
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
                      <button className="cc-sig-brief" onClick={() => setSelectedSignal(s)}>Open brief</button>
                      <button className="cc-sig-watch" onClick={() => onPageChange?.('watchlist')}>↗ Add to watchlist</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('watchlist')}>Manage saved filters →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">HIGH-WATCH TOPICS</div>
          {HIGH_WATCH.map(t => (
            <div key={t.label} className="cc-topic-row">
              <span>{t.label}</span>
              <span className="cc-topic-count">{t.n}</span>
            </div>
          ))}
          <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View all topics →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SIGNAL METHODOLOGY</div>
          <p className="cc-right-prose">Signals are sourced from regulatory releases, market data, trade intelligence, and verified industry sources. Each signal is scored for impact and confidence based on source credibility and recency.</p>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">REGULATORY TRACKING</div>
          <p className="cc-right-prose">Monitor legislative changes, consultation periods, and enforcement actions driving signal activity in {country.label}.</p>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('regulatory')}>Open Regulatory Watch →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">WATCHLIST</div>
          <p className="cc-right-prose">Saved topics and jurisdictions — track changes across your priority markets without re-filtering each session.</p>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('watchlist')}>Open Watchlist →</button>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">{nextBest.title.length > 90 ? nextBest.title.slice(0,90)+'…' : nextBest.title}</p>
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('regulatory')}>View Regulatory Context →</button>
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
  country, region, role, marketplaceRows, wantedListings, wantedCount, pathwayData, cannabisOperators = [], operatorLicenceMatrix, pipeline, onPageChange, mySubmissions = [], userEmail,
}: {
  country:           { iso2: string; label: string }
  region:            string
  role:              string
  marketplaceRows?:  Partial<DashboardMarketplaceRows>
  wantedListings?:   WantedListing[]
  wantedCount?:      number
  pathwayData?:      PathwayData
  cannabisOperators?: CannabisOperator[]
  operatorLicenceMatrix?: import('@/lib/intelligence/operatorIntelligence').OperatorLicenceMatrix
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
  const [selectedListingId,  setSelectedListingId]  = useState<string | null>(null)
  const [selectedWantedId,   setSelectedWantedId]   = useState<string | null>(null)
  const [consumablesOpen,        setConsumablesOpen]        = useState(false)
  const selectedWanted = useMemo(
    () => (selectedWantedId ? (wantedListings?.find(w => w.id === selectedWantedId) ?? null) : null),
    [selectedWantedId, wantedListings]
  )
  const [regionFilter, setRegionFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'featured' | 'rating'>('featured')
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
        <DealRoomsSidebarWidget />
        <div className="cc-right-section">
          <div className="cc-right-head">ROUTED INQUIRY</div>
          <p className="cc-right-prose">Submit a quote or sourcing inquiry for Harbourview to review and route to verified suppliers or export partners.</p>
          <button className="cc-right-link" onClick={() => setSubView('quote')}>Submit routed inquiry →</button>
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
          <button className="cc-right-link" onClick={() => setSubView('submit')}>Submit a listing →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('compliance')}>View all requirements →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('compliance')}>Address gaps →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('kyb')}>View counterparty profile →</button>
        </div>

        {cannabisOperators.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">VERIFIED OPERATORS — {country.label.toUpperCase()}</div>
            {cannabisOperators.slice(0, 5).map(op => {
              const licences = operatorLicenceMatrix?.entitled ? operatorLicenceMatrix.byOperatorId[op.id] ?? [] : []
              return (
                <div key={op.id} className="cc-req-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`cc-req-icon ${op.verification_status === 'verified' ? 'ok' : 'pending'}`}>
                      {op.verification_status === 'verified' ? '✓' : '○'}
                    </span>
                    <div>
                      <strong>{op.legal_name}</strong>
                      <small>{op.operator_type ?? 'Operator'}</small>
                    </div>
                  </div>
                  {licences.map((lic, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4, paddingLeft: 26 }}>
                      {lic.gmpCertified && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 100, border: '1px solid rgba(95,184,122,.3)', color: '#5fb87a' }}>GMP</span>}
                      {lic.gacpCertified && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 100, border: '1px solid rgba(95,184,122,.3)', color: '#5fb87a' }}>GACP</span>}
                      {lic.licenceClass && <span style={{ fontSize: 9, color: 'rgba(245,240,232,.4)' }}>{lic.licenceClass}</span>}
                    </div>
                  ))}
                  {operatorLicenceMatrix && !operatorLicenceMatrix.entitled && (
                    <div style={{ fontSize: 9, color: '#d4a84b', paddingLeft: 26, marginTop: 4 }}>🔒 Licence & certification detail — Intel plan</div>
                  )}
                </div>
              )
            })}
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
      <WantedDetailModal
        listing={selectedWanted}
        onClose={() => setSelectedWantedId(null)}
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
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null)
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
      <div className="cc-two-main" style={{ position: 'relative', overflow: 'hidden' }}>
        {selectedModule && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--cc-page-bg, #0b1929)', zIndex: 10, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <button type="button" onClick={() => setSelectedModule(null)} style={{ alignSelf: 'flex-start', margin: '16px 20px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,168,75,.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
              ← LEARNING PATH
            </button>
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <span className={`cc-edu-badge ${selectedModule.level.toLowerCase()}`}>{selectedModule.level}</span>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{selectedModule.icon}</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cc-text)', lineHeight: 1.3, marginBottom: 8 }}>
                {selectedModule.num}. {selectedModule.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(243,240,234,0.65)', lineHeight: 1.55, marginBottom: 16 }}>{selectedModule.desc}</p>
            </div>
            <div className="cc-jx-fields" style={{ margin: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="cc-jx-field">
                <span className="cc-jx-field-icon">◷</span>
                <div><small>Duration</small><strong>{selectedModule.minutes} min</strong></div>
              </div>
              <div className="cc-jx-field">
                <span className="cc-jx-field-icon">◎</span>
                <div><small>Progress</small><strong>{selectedModule.progress > 0 ? `${selectedModule.progress}% complete` : 'Not started'}</strong></div>
              </div>
              <div className="cc-jx-field">
                <span className="cc-jx-field-icon">◫</span>
                <div><small>Jurisdiction</small><strong>{country.label}</strong></div>
              </div>
              <div className="cc-jx-field">
                <span className="cc-jx-field-icon">⊟</span>
                <div><small>Required for</small><strong>Compliance pathway</strong></div>
              </div>
            </div>
            {selectedModule.progress > 0 && (
              <div style={{ margin: '0 20px 12px' }}>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedModule.progress}%`, background: 'var(--cc-green)', borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: '10px', color: 'var(--cc-muted)', marginTop: 4 }}>{selectedModule.progress}% complete</p>
              </div>
            )}
            <div style={{ margin: '0 20px 12px', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cc-champagne)', marginBottom: 8 }}>What you&apos;ll cover</p>
              {[
                'Regulatory framework and legal obligations',
                'Documentation and recordkeeping requirements',
                'Compliance checkpoints and audit readiness',
                'Practical application to your market and role',
              ].map((topic, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ color: 'var(--cc-champagne)', fontSize: '10px', marginTop: 2, flexShrink: 0 }}>◎</span>
                  <span style={{ fontSize: '12px', color: 'rgba(243,240,234,0.7)', lineHeight: 1.45 }}>{topic}</span>
                </div>
              ))}
            </div>
            <div style={{ margin: '0 20px 20px', display: 'flex', gap: 8 }}>
              <button className="cc-edu-cta start" style={{ flex: 1 }} onClick={() => setSelectedModule(null)}>
                {selectedModule.progress > 0 ? 'Continue module' : 'Start module'} →
              </button>
              <button className="cc-sig-brief" style={{ padding: '8px 14px', borderRadius: 10 }} onClick={() => setSelectedModule(null)}>Back</button>
            </div>
          </div>
        )}
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
              <button className={`cc-edu-cta ${m.progress>0?'continue':'start'}`} onClick={() => setSelectedModule(m)}>
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
          <div className="cc-right-head">RELATED EVIDENCE <button className="cc-right-link ml-auto" onClick={() => onPageChange?.('evidence')}>View all →</button></div>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('evidence')}>Go to Evidence &amp; Sources →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">RECENTLY UPDATED MODULES</div>
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
  country, region, role, signals, watchlistData, countryIntel, sourceCoverage, onPageChange,
}: {
  country:         { iso2: string; label: string }
  region:          string
  role:            string
  signals:         DashboardSignal[]
  watchlistData?:  WatchlistData
  countryIntel?:   CountryIntelProfile | null
  sourceCoverage?: SourceCoverageRow[]
  onPageChange?:   (page: CommandPage) => void
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
            <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View change brief →</button>
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
                    <button className="cc-sig-brief" onClick={() => onPageChange?.('signals')}>Open brief</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="cc-feed-footer">
          <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View all events →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('watchlist')}>Manage triggers →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('countries')}>View comparisons →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">OPEN POLICY QUESTIONS</div>
          {POLICY_QS.map((q, i) => (
            <div key={i} className="cc-policy-q">
              <span className="cc-policy-q-icon">?</span>
              <span>{q}</span>
            </div>
          ))}
          <button className="cc-right-link" onClick={() => onPageChange?.('local-intel')}>View all questions →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SOURCE GAPS</div>
          {SOURCE_GAPS.map(g => (
            <div key={g.label} className="cc-source-gap-row">
              <span>{g.label}</span>
              <span className={`cc-gap-badge ${g.level}`}>{g.level === 'high' ? 'High Gap' : 'Medium Gap'}</span>
            </div>
          ))}
          <button className="cc-right-link" onClick={() => onPageChange?.('evidence')}>Improve coverage →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">UPCOMING EVENTS</div>
          <p className="cc-right-prose">Consultations, hearings, and industry events in {country.label} — stay ahead of regulatory movement before it becomes law.</p>
          <button className="cc-nba-btn full" style={{marginTop:'8px'}} onClick={() => onPageChange?.('events')}>View Events Calendar →</button>
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

const ORG_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'supplier',    label: 'Supplier / Cultivator' },
  { value: 'buyer',       label: 'Buyer / Importer' },
  { value: 'broker',      label: 'Broker / Trade Intermediary' },
  { value: 'lab',         label: 'Testing Laboratory' },
  { value: 'pharmacy',    label: 'Pharmacy' },
  { value: 'clinic',      label: 'Clinic' },
  { value: 'equipment',   label: 'Equipment / Technology Provider' },
  { value: 'service',     label: 'Professional Service Provider' },
  { value: 'financial',   label: 'Financial / Investment' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'exporter',    label: 'Exporter' },
  { value: 'importer',    label: 'Importer' },
]

type OrgMeLicence = { id: string; licence_number: string; licence_type: string; jurisdiction_country: string; status: string; verified: boolean; expires_at: string }
type OrgMe = { id: string; name: string; legal_name: string; trade_name: string | null; org_type: string; jurisdiction_country: string; verification_status: string }

const OrganizationPage = React.memo(function OrganizationPage({
  hasOrg, countryOptions, onPageChange,
}: { hasOrg?: boolean; countryOptions: SelectOpt[]; onPageChange?: (page: CommandPage) => void }) {
  const [legalName,   setLegalName]   = useState('')
  const [tradeName,   setTradeName]   = useState('')
  const [orgType,     setOrgType]     = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [region,      setRegionField] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [done,        setDone]        = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (!legalName.trim())          return setError('Legal name is required.')
    if (!orgType)                   return setError('Select an organization type.')
    if (jurisdiction.length !== 2)  return setError('Select a jurisdiction country.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: legalName.trim(),
          trade_name: tradeName.trim() || undefined,
          org_type: orgType,
          jurisdiction_country: jurisdiction,
          jurisdiction_region: region.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(
          json?.error === 'USER_ALREADY_HAS_ORG' ? 'You already belong to an organization.' :
          json?.error === 'SLUG_CONFLICT' ? 'A very similar organization name already exists — try a more specific legal name.' :
          typeof json?.error === 'string' ? json.error : 'Could not create your organization. Please try again.'
        )
        return
      }
      setDone(true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (hasOrg || done) {
    return <OrganizationDashboard countryOptions={countryOptions} justCreated={done} />
  }

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.org-header { margin-bottom: 18px; }
.org-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.org-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.org-row { margin-bottom: 14px; }
.org-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .06em; }
.org-input, .org-select { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 9px 12px; color: #f5f0e8; font-size: .85rem; outline: none; box-sizing: border-box; }
.org-input:focus, .org-select:focus { border-color: #d4a84b; }
.org-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.org-note { font-size: .73rem; line-height: 1.6; color: #9090a0; background: rgba(212,168,75,.08); border: 1px solid rgba(212,168,75,.2); border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; }
.org-error { font-size: .78rem; color: #ef4444; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 9px 12px; margin-bottom: 14px; }
.org-submit { background: #d4a84b; color: #050c18; font-weight: 600; font-size: .85rem; border: none; border-radius: 20px; padding: 10px 22px; cursor: pointer; }
.org-submit:disabled { opacity: .55; cursor: default; }
        `}</style>

        <div className="org-header">
          <div className="org-title">Create Your Organization</div>
          <div className="org-sub">Every counterparty on Harbourview operates through a verified organization. This starts your Passport.</div>
        </div>

        <div className="org-note">
          Created privately and unverified by default. Nothing is public until you submit for review. One organization per account at creation — teammates can be invited afterward.
        </div>

        {error && <div className="org-error">{error}</div>}

        <div className="org-row org-grid">
          <div>
            <label className="org-label">Legal name *</label>
            <input className="org-input" value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Legal entity name" />
          </div>
          <div>
            <label className="org-label">Trade name</label>
            <input className="org-input" value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="If different from legal name" />
          </div>
        </div>

        <div className="org-row">
          <label className="org-label">Organization type *</label>
          <select className="org-select" value={orgType} onChange={e => setOrgType(e.target.value)}>
            <option value="">Select organization type</option>
            {ORG_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="org-row org-grid">
          <div>
            <label className="org-label">Country of registration *</label>
            <select className="org-select" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
              <option value="">Select country</option>
              {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="org-label">State / province (optional)</label>
            <input className="org-input" value={region} onChange={e => setRegionField(e.target.value)} placeholder="Region" />
          </div>
        </div>

        <button className="org-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Organization'}
        </button>
      </div>
    </div>
  )
})

const LICENCE_TYPE_OPTIONS = [
  'Cultivation', 'Processing/Manufacturing', 'Extraction', 'Distribution',
  'Retail/Dispensing', 'Import', 'Export', 'Testing Laboratory', 'Research', 'Other',
]

const OrganizationDashboard = React.memo(function OrganizationDashboard({
  countryOptions, justCreated,
}: { countryOptions: SelectOpt[]; justCreated?: boolean }) {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgMe | null>(null)
  const [licences, setLicences] = useState<OrgMeLicence[]>([])
  const [showForm, setShowForm] = useState(false)

  const [licNumber, setLicNumber] = useState('')
  const [licAuthority, setLicAuthority] = useState('')
  const [licType, setLicType] = useState('')
  const [licCountry, setLicCountry] = useState('')
  const [licRegion, setLicRegion] = useState('')
  const [licExpires, setLicExpires] = useState('')
  const [licSubmitting, setLicSubmitting] = useState(false)
  const [licError, setLicError] = useState<string | null>(null)
  const [licResult, setLicResult] = useState<{ auto_verified: boolean } | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/org/me')
      const json = await res.json()
      setOrg(json?.data?.org ?? null)
      setLicences(json?.data?.licences ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submitLicence = async () => {
    setLicError(null)
    setLicResult(null)
    if (!licNumber.trim())        return setLicError('Licence number is required.')
    if (!licAuthority.trim())     return setLicError('Issuing authority is required.')
    if (!licType)                 return setLicError('Select a licence type.')
    if (licCountry.length !== 2)  return setLicError('Select a jurisdiction country.')
    if (!licExpires)              return setLicError('Expiry date is required.')

    setLicSubmitting(true)
    try {
      const res = await fetch('/api/org/licences/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licence_number: licNumber.trim(), issuing_authority: licAuthority.trim(),
          licence_type: licType, jurisdiction_country: licCountry,
          jurisdiction_region: licRegion.trim() || undefined, expires_at: licExpires,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setLicError(typeof json?.error === 'string' ? json.error : 'Could not submit licence.'); return }
      setLicResult({ auto_verified: !!json?.data?.auto_verified })
      setLicNumber(''); setLicAuthority(''); setLicType(''); setLicCountry(''); setLicRegion(''); setLicExpires('')
      await load()
    } catch {
      setLicError('Network error — please try again.')
    } finally {
      setLicSubmitting(false)
    }
  }

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.org-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.org-sub { font-size: .78rem; color: #8a8a9a; margin-top: 6px; }
.org-status-pill { display: inline-block; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; padding: 3px 10px; border-radius: 999px; margin-top: 10px; }
.org-status-verified { background: rgba(16,185,129,.15); color: #10b981; }
.org-status-pending { background: rgba(212,168,75,.15); color: #d4a84b; }
.org-status-unverified { background: rgba(139,139,154,.15); color: #8a8a9a; }
.org-lic-card { border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 12px 14px; margin-top: 12px; }
.org-lic-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.org-lic-status { font-size: .68rem; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; }
.org-add-btn { margin-top: 18px; background: transparent; border: 1px solid #d4a84b; color: #d4a84b; font-weight: 600; font-size: .8rem; border-radius: 20px; padding: 8px 18px; cursor: pointer; }
.org-row { margin-bottom: 14px; }
.org-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .06em; }
.org-input, .org-select { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 9px 12px; color: #f5f0e8; font-size: .85rem; outline: none; box-sizing: border-box; }
.org-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.org-submit { background: #d4a84b; color: #050c18; font-weight: 600; font-size: .85rem; border: none; border-radius: 20px; padding: 10px 22px; cursor: pointer; margin-top: 4px; }
.org-submit:disabled { opacity: .55; cursor: default; }
.org-error { font-size: .78rem; color: #ef4444; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 9px 12px; margin-bottom: 14px; margin-top: 12px; }
.org-success { font-size: .78rem; color: #10b981; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.25); border-radius: 8px; padding: 9px 12px; margin-top: 12px; }
        `}</style>

        {loading ? (
          <div className="org-sub">Loading your organization…</div>
        ) : !org ? (
          <div className="org-sub">Couldn&apos;t load your organization. Try refreshing.</div>
        ) : (
          <>
            <div className="org-title">{org.trade_name || org.legal_name}</div>
            {org.trade_name && <div className="org-sub">{org.legal_name}</div>}
            <span className={`org-status-pill ${
              org.verification_status === 'verified' ? 'org-status-verified' :
              org.verification_status === 'pending_review' ? 'org-status-pending' : 'org-status-unverified'
            }`}>
              {org.verification_status.replace('_', ' ')}
            </span>

            {justCreated && (
              <div className="org-success">Organization created. Add a licence below to move your Passport toward verification.</div>
            )}

            <div style={{ marginTop: 20, fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Licences ({licences.length})
            </div>
            {licences.length === 0 && (
              <div className="org-sub" style={{ marginTop: 6 }}>No licences submitted yet.</div>
            )}
            {licences.map(l => (
              <div className="org-lic-card" key={l.id}>
                <div className="org-lic-row">
                  <div>
                    <div style={{ fontSize: '.85rem', color: '#f5f0e8' }}>{l.licence_type} — {l.jurisdiction_country}</div>
                    <div className="org-sub">#{l.licence_number} · expires {l.expires_at}</div>
                  </div>
                  <span className="org-lic-status" style={{
                    background: l.status === 'active' ? 'rgba(16,185,129,.15)' : l.status === 'revoked' ? 'rgba(239,68,68,.15)' : 'rgba(212,168,75,.15)',
                    color: l.status === 'active' ? '#10b981' : l.status === 'revoked' ? '#ef4444' : '#d4a84b',
                  }}>
                    {l.verified ? 'Auto-verified' : l.status}
                  </span>
                </div>
              </div>
            ))}

            {!showForm ? (
              <button className="org-add-btn" onClick={() => setShowForm(true)}>+ Add a licence</button>
            ) : (
              <div style={{ marginTop: 20 }}>
                {licError && <div className="org-error">{licError}</div>}
                {licResult && (
                  <div className="org-success">
                    {licResult.auto_verified
                      ? 'Matched the public regulator registry — verified automatically, no review needed.'
                      : 'Submitted. No automatic match was found, so this needs a quick manual review.'}
                  </div>
                )}
                <div className="org-row org-grid" style={{ marginTop: 12 }}>
                  <div>
                    <label className="org-label">Licence number *</label>
                    <input className="org-input" value={licNumber} onChange={e => setLicNumber(e.target.value)} placeholder="Licence number" />
                  </div>
                  <div>
                    <label className="org-label">Issuing authority *</label>
                    <input className="org-input" value={licAuthority} onChange={e => setLicAuthority(e.target.value)} placeholder="e.g. Health Canada" />
                  </div>
                </div>
                <div className="org-row">
                  <label className="org-label">Licence type *</label>
                  <select className="org-select" value={licType} onChange={e => setLicType(e.target.value)}>
                    <option value="">Select licence type</option>
                    {LICENCE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="org-row org-grid">
                  <div>
                    <label className="org-label">Jurisdiction country *</label>
                    <select className="org-select" value={licCountry} onChange={e => setLicCountry(e.target.value)}>
                      <option value="">Select country</option>
                      {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="org-label">State / province</label>
                    <input className="org-input" value={licRegion} onChange={e => setLicRegion(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="org-row">
                  <label className="org-label">Expiry date *</label>
                  <input className="org-input" type="date" value={licExpires} onChange={e => setLicExpires(e.target.value)} />
                </div>
                <button className="org-submit" onClick={submitLicence} disabled={licSubmitting}>
                  {licSubmitting ? 'Submitting…' : 'Submit Licence'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})


const SettingsPage = React.memo(function SettingsPage({
  country, region, role, countryOptions, roleOptions, onCountryChange, onRoleChange, onPageChange,
}: {
  country:          { iso2: string; label: string }
  region:           string
  role:             string
  countryOptions:   SelectOpt[]
  roleOptions:      SelectOpt[]
  onCountryChange?: (iso2: string) => void
  onRoleChange?:    (role: string) => void
  onPageChange?:    (page: CommandPage) => void
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
          <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View all saved views →</button>
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
  country, region, role, signals, countryIntel, localIntel, onPageChange,
}: {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  signals:      DashboardSignal[]
  countryIntel?: CountryIntelProfile | null
  localIntel?:   LocalIntelData | null
  onPageChange?: (page: CommandPage) => void
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
            <button className="cc-right-link" style={{marginTop:'10px',display:'inline-block'}} onClick={() => onPageChange?.('local-intel')}>View full state brief →</button>
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
              <button className="cc-right-link" onClick={() => onPageChange?.('local-intel')}>Explore authorities →</button>
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
            <button className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}} onClick={() => onPageChange?.('local-intel')}>View all municipalities →</button>
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
            <button className="cc-right-link" style={{marginTop:'4px',display:'inline-block'}} onClick={() => onPageChange?.('compliance')}>View constraint detail →</button>
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
            <button className="cc-right-link" style={{marginTop:'4px',display:'inline-block'}} onClick={() => onPageChange?.('access-pathway')}>View routing guidance →</button>
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
            <button className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}} onClick={() => onPageChange?.('local-intel')}>Submit intel request →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('local-intel')}>View all authorities →</button>
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
          <button className="cc-nba-btn" style={{ marginTop: '4px', fontSize: '.73rem' }} onClick={() => onPageChange?.('evidence')}>View Evidence Sources →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">OPEN LOCAL QUESTIONS</div>
          {LI_OPEN_QS.map((q, i) => (
            <div key={i} className="cc-policy-q">
              <span className="cc-policy-q-icon">?</span>
              <span>{q}</span>
            </div>
          ))}
          <button className="cc-nba-btn" style={{ marginTop: '8px', fontSize: '.73rem', width: '100%' }} onClick={() => onPageChange?.('signals')}>View Signals →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">REGULATORY TRACKING</div>
          <p className="cc-right-prose">Monitor rule changes, enforcement actions, and consultations affecting {country.label}{region ? ` · ${region}` : ''} operations.</p>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('regulatory')}>Open Regulatory Watch →</button>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">
              Engage local planning authorities to confirm current zoning status for {country.label}{region ? ` · ${region}` : ''}.
            </p>
            <button className="cc-nba-btn full" style={{marginTop:'8px'}} onClick={() => onPageChange?.('signals')}>View Suggested Actions →</button>
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
type CorridorAlertFeedItem = CorridorAlert & { corridor_key: string }
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
  const [feed,        setFeed]        = useState<CorridorAlertFeedItem[] | null>(null)
  const [feedError,   setFeedError]   = useState(false)

  // Cross-corridor regulatory-alert feed — standing view, loaded once on mount, independent
  // of the per-corridor alerts fetched on row-expand below.
  useEffect(() => {
    let live = true
    fetch('/api/corridors/alerts?limit=20')
      .then(r => r.json())
      .then((d: { alerts?: CorridorAlertFeedItem[] }) => { if (live) setFeed(d.alerts ?? []) })
      .catch(() => { if (live) { setFeed([]); setFeedError(true) } })
    return () => { live = false }
  }, [])

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
          {/* Regulatory alerts feed — live cross-corridor signal, standing view */}
          {feed !== null && feed.length > 0 && (
            <div style={{
              border: '1px solid rgba(212,168,75,.18)', borderRadius: '10px',
              background: 'rgba(212,168,75,.04)', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#d4a84b' }}>◈</span>
                <span style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#d4a84b', fontWeight: 700 }}>
                  Regulatory Alerts
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(245,240,232,.35)' }}>
                  {feed.length} recent · across all corridors
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {feed.map(a => (
                  <details key={a.id} style={{
                    background: 'rgba(255,255,255,.02)', borderRadius: '7px',
                    border: '1px solid rgba(255,255,255,.06)', padding: '8px 11px',
                  }}>
                    <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', gap: '9px', alignItems: 'baseline' }}>
                      <span style={{
                        flexShrink: 0, width: '7px', height: '7px', borderRadius: '50%',
                        background: ALERT_SEVERITY_COLOR[a.severity] ?? 'rgba(245,240,232,.4)',
                        alignSelf: 'center',
                      }} />
                      <span style={{ flexShrink: 0, fontSize: '9px', color: 'rgba(245,240,232,.4)', minWidth: '58px' }}>
                        {new Date(a.alert_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: '9px', color: 'rgba(245,240,232,.5)', fontWeight: 600, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.corridor_key}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(245,240,232,.85)', lineHeight: 1.35 }}>
                        {a.summary}
                      </span>
                    </summary>
                    {(a.detail || a.source) && (
                      <div style={{ marginTop: '7px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {a.detail && <p style={{ margin: 0, fontSize: '11px', color: 'rgba(245,240,232,.6)', lineHeight: 1.5 }}>{a.detail}</p>}
                        {a.source && <div style={{ fontSize: '9px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,.35)' }}>Source: {a.source}</div>}
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </div>
          )}
          {feed !== null && feed.length === 0 && !feedError && (
            <div style={{
              border: '1px solid rgba(255,255,255,.06)', borderRadius: '10px',
              background: 'rgba(255,255,255,.02)', padding: '12px 14px',
              fontSize: '11px', color: 'rgba(245,240,232,.4)',
            }}>
              <span style={{ color: '#d4a84b', marginRight: '7px' }}>◈</span>
              No regulatory alerts on record yet — this feed updates as corridor intelligence lands.
            </div>
          )}

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
  country, region, role, signals, pathwayData, countryIntel, jurisdictionPlaybook, onPageChange,
}: {
  country:              { iso2: string; label: string }
  region:               string
  role:                 string
  signals:              DashboardSignal[]
  pathwayData?:         PathwayData
  countryIntel?:        CountryIntelProfile | null
  jurisdictionPlaybook?: JurisdictionPlaybook
  onPageChange?:        (page: CommandPage) => void
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
                <button className="cc-right-link" onClick={() => onPageChange?.('compliance')}>View {country.label} requirements →</button>

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
                <button className="cc-right-link" style={{marginTop:'8px',display:'inline-block'}} onClick={() => onPageChange?.('compliance')}>View all requirements →</button>
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
          <button className="cc-right-link" onClick={() => onPageChange?.('evidence')}>View all documents →</button>
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
            <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View all signals →</button>
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
        <div className="cc-right-section">
          <div className="cc-right-head">BANKING ACCESS</div>
          <p className="cc-right-prose">Cannabis-compliant banking is required before you can operate. Find verified financial service providers serving {country.label}.</p>
          <button className="cc-nba-btn full" style={{marginTop:'8px'}} onClick={() => onPageChange?.('banking')}>Find Banking Partners →</button>
        </div>
      </aside>
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
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

// ── SyncEmbeddingsPanel ───────────────────────────────────────────────────────

type SyncState = 'idle' | 'running' | 'done' | 'error'

function SyncEmbeddingsPanel() {
  const [syncState, setSyncState] = React.useState<SyncState>('idle')
  const [syncMsg,   setSyncMsg]   = React.useState('')

  async function handleSync() {
    setSyncState('running')
    setSyncMsg('')
    try {
      const res  = await fetch('/api/admin/backfill-source-embeddings', { method: 'POST' })
      const data = await res.json() as { embedded?: number; skipped?: number; total?: number; error?: string; message?: string }
      if (!res.ok) {
        setSyncState('error')
        setSyncMsg(data.error ?? `Error ${res.status}`)
      } else if (data.message) {
        setSyncState('done')
        setSyncMsg(data.message)
      } else {
        setSyncState('done')
        setSyncMsg(`${data.embedded ?? 0} embedded · ${data.skipped ?? 0} skipped`)
      }
    } catch {
      setSyncState('error')
      setSyncMsg('Network error — try again')
    }
  }

  return (
    <div className="cc-right-section" style={{borderTop:'1px solid rgba(255,255,255,.06)',paddingTop:'12px'}}>
      <div className="cc-right-head">SEARCH INDEX</div>
      <p className="cc-right-prose">Sync semantic search index so Evidence Sources search uses AI ranking.</p>
      <button
        className="cc-nba-btn full"
        style={{marginTop:'8px',opacity:syncState==='running'?0.6:1,cursor:syncState==='running'?'default':'pointer'}}
        onClick={handleSync}
        disabled={syncState === 'running'}
      >
        {syncState === 'running' ? '⟳ Syncing…' : syncState === 'done' ? '✓ Sync complete' : 'Sync Embeddings'}
      </button>
      {syncMsg && (
        <small style={{display:'block',marginTop:'6px',color:syncState==='error'?'var(--cc-red)':'var(--cc-dim)'}}>
          {syncMsg}
        </small>
      )}
    </div>
  )
}

// ── EvidenceSourcesPage ───────────────────────────────────────────────────────

const EvidenceSourcesPage = React.memo(function EvidenceSourcesPage({
  country, region, role, evidenceData, pathwayData, professionals = [], registryCoverageSummary, onPageChange,
}: {
  country:        { iso2: string; label: string }
  region:         string
  role:           string
  evidenceData?:  EvidenceData
  pathwayData?:   PathwayData
  professionals?: HvProfessional[]
  registryCoverageSummary?: RegistryCoverageSummary
  onPageChange?:  (page: CommandPage) => void
}) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('regulatory')
  const [searchQuery, setSearchQuery] = useState('')
  const [semanticResults, setSemanticResults] = useState<{ source_id: string; similarity: number }[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const { sources = [], orgDocs = [] } = evidenceData ?? {}

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSemanticResults(null)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(() => {
      fetch('/api/ai/source-search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: searchQuery }),
      })
        .then(r => r.ok ? r.json() : null)
        .then((d: { results?: { source_id: string; similarity: number }[] } | null) => {
          setSemanticResults(d?.results ?? null)
          setSearchLoading(false)
        })
        .catch(() => { setSemanticResults(null); setSearchLoading(false) })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  // Semantic search: rank by similarity; text filter as instant fallback while loading
  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return displaySources
    if (semanticResults) {
      const scoreMap = new Map<string, number>(semanticResults.map(r => [r.source_id, r.similarity] as [string, number]))
      return displaySources
        .filter(s => scoreMap.has(s.id))
        .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0))
    }
    return displaySources.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.notes ?? '').toLowerCase().includes(q)
    )
  }, [displaySources, searchQuery, semanticResults])

  const tabSources = useMemo(() =>
    filteredSources.filter(s => sourceTab(s) === activeTab),
    [filteredSources, activeTab]
  )

  const renderSources = searchQuery.trim() ? filteredSources : tabSources

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

          {registryCoverageSummary && (
            <div className="cc-ev-stat-card">
              <div className="cc-rw-card-lbl">REGISTRY COVERAGE</div>
              <div className="cc-ev-stat-big verified">{registryCoverageSummary.totalActive}</div>
              <small>
                {registryCoverageSummary.tier1Count} tier-1 · {registryCoverageSummary.languages.length}{' '}
                language{registryCoverageSummary.languages.length === 1 ? '' : 's'}
              </small>
            </div>
          )}

          <div className="cc-ev-stat-card">
            <div className="cc-rw-card-lbl">📅 LAST REVIEWED</div>
            <strong className="cc-rw-change-date">{lastChecked ?? '—'}</strong>
            {lastChecked && <small>{new Date(lastChecked).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</small>}
          </div>
        </div>

        {/* ── Source search ─────────────────────────────────── */}
        <div style={{display:'flex',alignItems:'center',gap:'8px',margin:'12px 0 4px'}}>
          <div style={{position:'relative',flex:1}}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search evidence sources…"
              style={{
                width:'100%',boxSizing:'border-box',
                background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',
                borderRadius:'6px',padding:'7px 32px 7px 12px',
                color:'inherit',fontSize:'13px',outline:'none',
              }}
            />
            {searchLoading && (
              <span style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',opacity:.5,fontSize:'14px',animation:'spin 1s linear infinite'}}>⟳</span>
            )}
            {searchQuery && !searchLoading && (
              <button
                onClick={() => setSearchQuery('')}
                style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--cc-dim)',fontSize:'14px',lineHeight:1,padding:'2px'}}
              >✕</button>
            )}
          </div>
        </div>

        {/* ── Tabs (hidden while search active) ────────────── */}
        {!searchQuery.trim() && (
        <div className="cc-mkt-tabs">
          {EV_TABS.map(t => {
            const cnt = filteredSources.filter(s => sourceTab(s) === t.id).length
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
        )}

        {/* ── Source table / Lab Directory ──────────────────── */}
        {!searchQuery.trim() && activeTab === 'labs' ? (
          <LabDirectorySection country={country} />
        ) : renderSources.length === 0 && orgDocs.length === 0 ? (
          <div className="cc-empty-state" style={{flex:1}}>
            <span>⊟</span>
            {searchQuery.trim()
              ? <p>No sources matched &ldquo;{searchQuery}&rdquo;.</p>
              : <p>No {EV_TABS.find(t=>t.id===activeTab)?.label.toLowerCase()} sources for {country.label}.</p>
            }
            <small style={{fontSize:'11px',color:'var(--cc-dim)'}}>
              {searchQuery.trim()
                ? 'Try different keywords or clear the search to browse by category.'
                : 'Sources are added as Harbourview expands coverage for this jurisdiction.'
              }
            </small>
          </div>
        ) : (
          <div className="cc-ev-table-wrap">
            {/* Platform sources */}
            {renderSources.length > 0 && (
              <>
                {searchQuery.trim() && semanticResults && (
                  <div style={{fontSize:'11px',color:'var(--cc-dim)',padding:'6px 0 2px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--cc-gold)',display:'inline-block',flexShrink:0}}/>
                    Ranked by semantic similarity · {renderSources.length} match{renderSources.length !== 1 ? 'es' : ''}
                  </div>
                )}
                <div className="cc-ev-thead">
                  <span className="cc-mkt-th ev-src-col">SOURCE</span>
                  <span className="cc-mkt-th">SOURCE TYPE</span>
                  <span className="cc-mkt-th">JURISDICTION</span>
                  <span className="cc-mkt-th">PATHWAY STEP</span>
                  <span className="cc-mkt-th">CONFIDENCE</span>
                  <span className="cc-mkt-th">LAST REVIEWED</span>
                  <span className="cc-mkt-th">VISIBILITY</span>
                </div>
                {renderSources.map(src => {
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

            {/* Org-uploaded documents (hidden during search — search only covers platform sources) */}
            {!searchQuery.trim() && orgDocs.length > 0 && (
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
          <span>Showing {renderSources.length}{searchQuery.trim() ? ` of ${displaySources.length} sources` : ' sources'}</span>
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
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">NEXT BEST ACTION</div>
          <p className="cc-right-prose">
            {reviewQueue.length > 0
              ? `Review ${reviewQueue.length} item${reviewQueue.length>1?'s':''} in your evidence queue to raise overall confidence.`
              : `Add verified regulatory sources for ${country.label} to improve evidence coverage.`
            }
          </p>
          <button className="cc-nba-btn full" style={{marginTop:'8px'}} onClick={() => onPageChange?.('regulatory')}>Open Regulatory Watch →</button>
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
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('experts')}>Find Verified Experts →</button>
          </div>
        )}

        {professionals.length === 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">EXPERT DIRECTORY</div>
            <p className="cc-right-prose">Connect with verified professionals who can help interpret evidence sources and navigate {country.label} regulatory requirements.</p>
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('experts')}>Find Verified Experts →</button>
          </div>
        )}

        <SyncEmbeddingsPanel />
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
  onPageChange,
}: {
  country: { iso2: string; label: string }
  cultivarPassports?: PublicCultivarPassportDTO[]
  serviceProviders?: PublicServiceProvider[]
  collaborationProjects?: PublicCollaborationProject[]
  onPageChange?: (page: CommandPage) => void
}) {
  const [tab, setTab] = useState<GeneticsTab>('passports')
  const [selectedPassport, setSelectedPassport] = useState<PublicCultivarPassportDTO | null>(null)
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
      <div className="cc-two-main" style={{ position: 'relative', overflow: 'hidden' }}>
        {selectedPassport && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--cc-page-bg, #0b1929)', zIndex: 10, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
              <button type="button" onClick={() => setSelectedPassport(null)} style={{ background: 'none', border: 'none', color: 'rgba(212,168,75,.75)', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                ← CULTIVAR PASSPORTS
              </button>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="cc-opp-tag">{selectedPassport.cultivarCategory.replace(/_/g, ' ')}</span>
                {selectedPassport.cannabisCategory && <span className="cc-opp-tag">{selectedPassport.cannabisCategory.replace(/_/g, ' ')}</span>}
                <span className="cc-opp-tag">{selectedPassport.claimStatus.replace(/_/g, ' ')}</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cc-text)', marginBottom: 8 }}>⊕ {selectedPassport.displayName}</h2>
              <p style={{ fontSize: 13, color: 'var(--cc-dim)', lineHeight: 1.7, marginBottom: 0 }}>{selectedPassport.publicSummary}</p>
            </div>
            {(selectedPassport.originCountryCode || selectedPassport.breederDisplayName || selectedPassport.aliasesPublic.length > 0) && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
                <div className="cc-group-label" style={{ marginBottom: 8 }}>ORIGIN &amp; PROVENANCE</div>
                <div className="cc-jx-fields">
                  {selectedPassport.originCountryCode && <div className="cc-jx-field"><span className="cc-jx-field-icon">◷</span><div><small>Origin</small><strong>{selectedPassport.originJurisdictionLabel ?? selectedPassport.originCountryCode}</strong></div></div>}
                  {selectedPassport.breederDisplayName && <div className="cc-jx-field"><span className="cc-jx-field-icon">◧</span><div><small>Breeder</small><strong>{selectedPassport.breederDisplayName}</strong></div></div>}
                  {selectedPassport.rightsHolderDisplayName && <div className="cc-jx-field"><span className="cc-jx-field-icon">◨</span><div><small>Rights Holder</small><strong>{selectedPassport.rightsHolderDisplayName}</strong></div></div>}
                </div>
                {selectedPassport.aliasesPublic.length > 0 && <div style={{ fontSize: 11, color: 'var(--cc-muted)', marginTop: 8 }}>Also known as: {selectedPassport.aliasesPublic.join(', ')}</div>}
              </div>
            )}
            {(selectedPassport.evidenceScoreSummary || selectedPassport.verificationSummary) && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
                <div className="cc-group-label" style={{ marginBottom: 8 }}>VERIFICATION STATUS</div>
                {selectedPassport.evidenceScoreSummary && <p style={{ fontSize: 12, color: 'var(--cc-text)', lineHeight: 1.7, marginBottom: 6 }}>{selectedPassport.evidenceScoreSummary}</p>}
                {selectedPassport.verificationSummary && <p style={{ fontSize: 11, color: 'var(--cc-dim)', lineHeight: 1.7 }}>{selectedPassport.verificationSummary}</p>}
              </div>
            )}
            {selectedPassport.countryOpportunitiesPublic.length > 0 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
                <div className="cc-group-label" style={{ marginBottom: 8 }}>COUNTRY OPPORTUNITIES ({selectedPassport.countryOpportunitiesPublic.length})</div>
                <div className="cc-sig-group">
                  {selectedPassport.countryOpportunitiesPublic.map((opp, i) => (
                    <div key={i} className="cc-sig-row">
                      <div className="cc-sig-dot medium" />
                      <div className="cc-sig-body">
                        <strong>{opp.jurisdictionLabel ?? opp.countryCode}</strong>
                        <small>{opp.opportunityType.replace(/_/g, ' ')} · {opp.status}</small>
                        {opp.publicNote && <small>{opp.publicNote}</small>}
                      </div>
                      <div className="cc-sig-acts">
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span className="cc-opp-tag">MT: {opp.materialTransferStatus.replace(/_/g, ' ')}</span>
                          <span className="cc-opp-tag">Gate: {opp.jurisdictionGateStatus.replace(/_/g, ' ')}</span>
                        </div>
                        <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true, profileName: selectedPassport.displayName })}>{opp.cta} →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedPassport.publicEvidenceSummaries.length > 0 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
                <div className="cc-group-label" style={{ marginBottom: 8 }}>EVIDENCE SUMMARIES ({selectedPassport.publicEvidenceSummaries.length})</div>
                <div className="cc-sig-group">
                  {selectedPassport.publicEvidenceSummaries.map(ev => (
                    <div key={ev.id} className="cc-sig-row">
                      <div className="cc-sig-dot low" />
                      <div className="cc-sig-body">
                        <strong>{ev.title}</strong>
                        {ev.publicSummary && <small>{ev.publicSummary}</small>}
                      </div>
                      <div className="cc-sig-acts">
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className="cc-opp-tag">{ev.evidenceType.replace(/_/g, ' ')}</span>
                          {ev.sourceLabel && <span className="cc-opp-tag">{ev.sourceLabel}</span>}
                          {ev.sourceDate && <span className="cc-opp-tag">{ev.sourceDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedPassport.publicCollaborationProjects.length > 0 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
                <div className="cc-group-label" style={{ marginBottom: 8 }}>COLLABORATION PROJECTS ({selectedPassport.publicCollaborationProjects.length})</div>
                <div className="cc-sig-group">
                  {selectedPassport.publicCollaborationProjects.map(cp => (
                    <div key={cp.id} className="cc-sig-row">
                      <div className="cc-sig-dot medium" />
                      <div className="cc-sig-body">
                        <strong>⊗ {cp.title}</strong>
                        <small>{cp.publicSummary}</small>
                        {cp.evidenceNeeded && <small>Evidence needed: {cp.evidenceNeeded}</small>}
                      </div>
                      <div className="cc-sig-acts">
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span className="cc-opp-tag">{cp.projectType.replace(/_/g, ' ')}</span>
                          <span className="cc-opp-tag">{cp.status}</span>
                        </div>
                        <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true, profileName: selectedPassport.displayName })}>Start collaboration →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p style={{ fontSize: 10, color: 'var(--cc-dim)', lineHeight: 1.7, padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>{selectedPassport.publicDisclaimer}</p>
          </div>
        )}
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
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="cc-sig-brief" style={{ flex: 1 }} onClick={() => setSelectedPassport(p)}>View passport →</button>
                          {countryOpps.length > 0 && <button className="cc-sig-brief" onClick={() => setRequestModal({ open: true, profileName: p.displayName })}>{countryOpps[0].cta.split(' ')[0]}</button>}
                        </div>
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

        <div className="cc-right-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="cc-nba-btn" style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', color: '#10b981', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => onPageChange?.('evidence')}>
            ⊞ Evidence Sources & Labs →
          </button>
          <button className="cc-nba-btn" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(245,240,232,.55)', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => onPageChange?.('regulatory')}>
            ◷ Regulatory Watch →
          </button>
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

const COMPLIANCE_ROLE_FOCUS: Record<string, { icon: string; items: string[] }> = {
  'Compliance': { icon: '◫',
    items: ['SOP frameworks and audit readiness', 'Licence portfolio and renewal calendar', 'Variance reporting and CAPA documentation', 'Regulatory change impact assessments'] },
  'Legal': { icon: '⊙',
    items: ['Legislative compliance and contract enforceability', 'AML and financial crime obligations', 'Director liability and corporate compliance', 'IP protection and trade secret protocols'] },
  'GMP/QA': { icon: '◎',
    items: ['EU-GMP, ICH Q7, and GACP certification requirements', 'QP-qualified batch release signatories', 'Deviations, OOS investigations, and CAPA', 'Product recall and controlled drug quarantine procedures'] },
  'Lab/QA': { icon: '⊞',
    items: ['ISO 17025 accreditation and scope of testing', 'COA format and potency testing methodology', 'Proficiency testing and inter-lab calibration', 'Chain-of-custody for controlled substance samples'] },
  'Regulator': { icon: '◷',
    items: ['Cross-jurisdictional standards comparison', 'Emerging regulatory frameworks and reform tracking', 'Evidence base for framework design', 'International treaty obligations (1961/1988 Conventions)'] },
  'Importer': { icon: '↓',
    items: ['Import permit requirements and customs documentation', 'GDP cold-chain compliance obligations', 'Country-of-origin and phytosanitary certification', 'Narcotics import certificate (S10/INCB)'] },
  'Exporter': { icon: '↑',
    items: ['Export licence and narcotics export certificate', 'EU GMP equivalency for destination market access', 'GACP and cultivation documentation requirements', 'Multi-market permitting strategy'] },
  'Cultivator': { icon: '⬡',
    items: ['GACP (Good Agricultural and Collection Practice)', 'Seed-to-sale track-and-trace obligations', 'Site security and access control requirements', 'Annual regulatory inspection readiness'] },
  'Processor': { icon: '⬟',
    items: ['GMP manufacturing authorization and facility certification', 'Solvent residue and extraction process validation', 'Batch documentation and QP batch release', 'Controlled substance destruction and disposal records'] },
  'Distributor': { icon: '◈',
    items: ['GDP (Good Distribution Practice) certification', 'Cold-chain monitoring and temperature excursion protocols', 'Controlled drug wholesale licence requirements', 'Chain-of-custody and batch traceability obligations'] },
}

const CompliancePage = React.memo(function CompliancePage({
  country,
  countryIntel,
  jurisdictionPlaybook,
  pathwayMatrix,
  role,
  onPageChange,
}: {
  country: { iso2: string; label: string }
  countryIntel?: CountryIntelProfile | null
  jurisdictionPlaybook?: JurisdictionPlaybook | null
  pathwayMatrix?: import('@/lib/intelligence/regulatoryPathways').CountryPathwayMatrix
  role?: string
  onPageChange?: (page: CommandPage) => void
}) {
  const roleFocus = role ? (COMPLIANCE_ROLE_FOCUS[role] ?? null) : null
  const showLicencesCta = role && ['Compliance', 'GMP/QA', 'Lab/QA', 'Cultivator', 'Processor', 'Distributor', 'Retail', 'Clinic Op.'].includes(role)
  const showKybCta = role && ['Compliance', 'Legal', 'Investor'].includes(role)

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

        {pathwayMatrix && !pathwayMatrix.entitled && (
          <div className="cc-sig-feed">
            <div className="cc-sig-group" style={{ border: '1px dashed rgba(212,168,75,.3)', background: 'rgba(212,168,75,.04)' }}>
              <div className="cc-sig-group-hd"><span>🔒 Format Viability — Intel plan required</span></div>
              <div className="cc-sig-row">
                <div className="cc-sig-body">
                  <small>Which pathway permits which product format here, THC/CBD limits, possession limits — this is part of the Intel tier. The market entry steps above are available now; this is the part that answers whether a format is legally viable before those steps matter.</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {pathwayMatrix?.entitled && pathwayMatrix.pathways.length > 0 && (
          <div className="cc-sig-feed">
            <div className="cc-sig-group">
              <div className="cc-sig-group-hd"><span>Format Viability — {country.label}</span><span>{pathwayMatrix.pathways.length} pathway{pathwayMatrix.pathways.length === 1 ? '' : 's'}</span></div>
              {pathwayMatrix.pathways.map(pathway => (
                <div key={pathway.id} className="cc-sig-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div className="cc-sig-body" style={{ marginBottom: pathway.formats.length > 0 ? 6 : 0 }}>
                    <strong>{pathway.name}</strong>
                    <small>{pathway.regulator ?? pathway.pathwayType.replace(/_/g, ' ')} · {pathway.status}</small>
                  </div>
                  {pathway.formats.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
                      {pathway.formats.map(f => (
                        <span
                          key={f.formatSlug}
                          title={[f.thcLimit && `THC ${f.thcLimit}`, f.cbdLimit && `CBD ${f.cbdLimit}`, f.notes].filter(Boolean).join(' — ') || undefined}
                          style={{
                            fontSize: '10px', padding: '3px 8px', borderRadius: 100, border: '1px solid',
                            borderColor: FORMAT_STATUS_COLOR[f.status] ? `${FORMAT_STATUS_COLOR[f.status]}40` : 'rgba(255,255,255,.12)',
                            color: FORMAT_STATUS_COLOR[f.status] ?? 'rgba(245,240,232,.5)',
                          }}
                        >
                          {f.formatName} · {f.status}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        {roleFocus && (
          <div className="cc-right-section" style={{ borderLeft: '2px solid rgba(16,185,129,.35)', paddingLeft: 12 }}>
            <div className="cc-right-head" style={{ color: '#10b981' }}>COMPLIANCE FOCUS — {(role ?? '').toUpperCase()}</div>
            {roleFocus.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                <span style={{ color: '#10b981', fontSize: '.72rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{roleFocus.icon}</span>
                <span style={{ fontSize: '.73rem', color: 'rgba(245,240,232,.65)', lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">REGULATORY MONITORING</div>
          <p className="cc-right-prose">Track regulatory changes, consultations, and enforcement actions affecting compliance obligations in {country.label}.</p>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('regulatory')}>Open Regulatory Watch →</button>
        </div>

        {showLicencesCta && (
          <div className="cc-right-section">
            <div className="cc-right-head">LICENCE MANAGEMENT</div>
            <p className="cc-right-prose">Track licence expiry, renewal deadlines, and certification compliance across your {country.label} operations.</p>
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('licences')}>Open Licence Tracker →</button>
          </div>
        )}

        {showKybCta && (
          <div className="cc-right-section">
            <div className="cc-right-head">ENTITY VERIFICATION</div>
            <p className="cc-right-prose">Due diligence checklists, AML, and KYB verification for counterparty onboarding and compliance assurance.</p>
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('kyb')}>Open KYB Verification →</button>
          </div>
        )}

        {!roleFocus && (
          <div className="cc-right-section">
            <div className="cc-right-head">CURRENT JURISDICTION</div>
            <p className="cc-right-prose">{country.label} — compliance data for this jurisdiction is subject to source review. Contact Harbourview for a specialist-reviewed access pathway.</p>
            <Link href="/contact" className="cc-right-link">Get compliance support →</Link>
          </div>
        )}
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
  country, role, onPageChange,
}: {
  country:       { iso2: string; label: string }
  region:        string
  role:          string
  onPageChange?: (page: CommandPage) => void
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

        <div className="cc-right-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="cc-nba-btn" style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', color: '#10b981', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => onPageChange?.('compliance')}>
            ◫ Compliance Checklist →
          </button>
          <button className="cc-nba-btn" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(245,240,232,.55)', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => onPageChange?.('access-pathway')}>
            ◎ Access Pathway →
          </button>
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

// ── Expert Directory page ─────────────────────────────────────────────────────

type ExpertRecord = {
  id:                      string
  full_name:               string
  title:                   string | null
  credential_type:         string
  specialties:             string[]
  countries:               string[]
  institution:             string | null
  accepts_referrals:       boolean
  consultation_available:  boolean
  bio_public:              string | null
}

const CREDENTIAL_LABELS: Record<string, string> = {
  physician:          'Physician',
  pharmacist:         'Pharmacist',
  nurse_practitioner: 'Nurse Practitioner',
  researcher:         'Researcher',
  pharmacologist:     'Pharmacologist',
  lawyer:             'Lawyer / Attorney',
  consultant:         'Consultant',
  regulator:          'Regulator',
  educator:           'Educator',
  other:              'Specialist',
}

const CREDENTIAL_COLORS: Record<string, string> = {
  physician:          '#5b9bd5',
  pharmacist:         '#4caf82',
  nurse_practitioner: '#6dd4b8',
  researcher:         '#9b6dd4',
  pharmacologist:     '#d49b6d',
  lawyer:             '#d4a84b',
  consultant:         '#e07b5b',
  regulator:          '#e05c5c',
  educator:           '#5bd4b8',
  other:              '#8a8a9b',
}

const EXPERT_ROLE_CREDS_MAP: Record<string, string[]> = {
  'Doctor':      ['physician', 'pharmacologist'],
  'Pharmacist':  ['pharmacist', 'pharmacologist'],
  'Budtender':   ['educator', 'consultant'],
  'Cultivator':  ['consultant', 'researcher'],
  'Geneticist':  ['researcher', 'pharmacologist'],
  'Processor':   ['researcher', 'consultant', 'pharmacologist'],
  'Lab/QA':      ['researcher', 'pharmacologist'],
  'Importer':    ['lawyer', 'consultant', 'regulator'],
  'Exporter':    ['lawyer', 'consultant', 'regulator'],
  'Distributor': ['consultant', 'lawyer'],
  'Clinic Op.':  ['physician', 'pharmacist', 'nurse_practitioner'],
  'Retail':      ['consultant', 'educator'],
  'Compliance':  ['regulator', 'lawyer', 'consultant'],
  'Legal':       ['lawyer', 'consultant'],
  'Investor':    ['consultant', 'lawyer'],
  'Regulator':   ['regulator', 'lawyer'],
  'Patient Ed.': ['educator', 'nurse_practitioner', 'pharmacist'],
  'GMP/QA':      ['researcher', 'consultant', 'pharmacologist'],
  'Logistics':   ['consultant', 'lawyer'],
}

const ExpertDirectoryPage = React.memo(function ExpertDirectoryPage({
  country, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  onPageChange?: (page: CommandPage) => void
}) {
  const [search,       setSearch]       = useState('')
  const [credential,   setCredential]   = useState('')
  const [countryFilt,  setCountryFilt]  = useState('')
  const [filterMyRole, setFilterMyRole] = useState(false)
  const [experts,      setExperts]      = useState<ExpertRecord[]>([])
  const [loading,      setLoading]      = useState(true)
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [referralSent, setReferralSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    fetch('/api/experts')
      .then(r => r.json())
      .then((d: { experts?: ExpertRecord[] }) => setExperts(d.experts ?? []))
      .catch(() => setExperts([]))
      .finally(() => setLoading(false))
  }, [])

  const roleCredentials = useMemo(
    () => EXPERT_ROLE_CREDS_MAP[role] ?? [],
    [role],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return experts.filter(e => {
      const matchQ    = !q || e.full_name.toLowerCase().includes(q) ||
                        (e.title ?? '').toLowerCase().includes(q) ||
                        (e.institution ?? '').toLowerCase().includes(q) ||
                        e.specialties.some(s => s.toLowerCase().includes(q))
      const matchCred = !credential    || e.credential_type === credential
      const matchCtry = !countryFilt   || e.countries.includes(countryFilt.toUpperCase())
      const matchRole = !filterMyRole  || roleCredentials.includes(e.credential_type)
      return matchQ && matchCred && matchCtry && matchRole
    }).sort((a, b) => {
      if (!role) return 0
      const ar = roleCredentials.includes(a.credential_type) ? 0 : 1
      const br = roleCredentials.includes(b.credential_type) ? 0 : 1
      return ar - br
    })
  }, [experts, search, credential, countryFilt, filterMyRole, roleCredentials, role])

  const consultAvail = filtered.filter(e => e.consultation_available).length
  const referralAvail = filtered.filter(e => e.accepts_referrals).length

  // Countries that appear in expert profiles
  const expertCountries = useMemo(() => {
    const set = new Set<string>()
    experts.forEach(e => e.countries.forEach(c => set.add(c)))
    return Array.from(set).sort()
  }, [experts])

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main" style={{ overflowY: 'auto' }}>
        <div className="cc-inner-header">
          <h2>Expert Directory</h2>
          <p>Verified cannabis industry specialists — regulatory consultants, legal advisors, clinical prescribers, GMP auditors, and market access experts across 191 jurisdictions.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 24px 12px' }}>
          <input
            type="text" placeholder="Search by name, specialty, institution…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 200px', background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px',
              color: '#f5f0e8', fontSize: '12px', padding: '7px 12px', outline: 'none',
            }}
          />
          <select value={credential} onChange={e => setCredential(e.target.value)} style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '8px', color: credential ? '#f5f0e8' : 'rgba(245,240,232,.4)',
            fontSize: '12px', padding: '7px 12px', outline: 'none',
          }}>
            <option value="">All credentials</option>
            {Object.entries(CREDENTIAL_LABELS).map(([k, v]) => (
              <option key={k} value={k} style={{ background: '#050c18' }}>{v}</option>
            ))}
          </select>
          <select value={countryFilt} onChange={e => setCountryFilt(e.target.value)} style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '8px', color: countryFilt ? '#f5f0e8' : 'rgba(245,240,232,.4)',
            fontSize: '12px', padding: '7px 12px', outline: 'none',
          }}>
            <option value="">All jurisdictions</option>
            {expertCountries.map(c => (
              <option key={c} value={c} style={{ background: '#050c18' }}>{flagEmoji(c)} {c}</option>
            ))}
          </select>
          {role && roleCredentials.length > 0 && (
            <button onClick={() => setFilterMyRole(f => !f)} style={{
              padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              border: filterMyRole ? '1px solid rgba(16,185,129,.5)' : '1px solid rgba(255,255,255,.1)',
              background: filterMyRole ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.04)',
              color: filterMyRole ? '#10b981' : 'rgba(245,240,232,.5)',
              fontSize: '11px', fontWeight: filterMyRole ? 700 : 400,
            }}>
              ◎ For {role}s ({experts.filter(e => roleCredentials.includes(e.credential_type)).length})
            </button>
          )}
        </div>

        {/* Expert list */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(245,240,232,.3)', fontSize: '12px' }}>
              Loading expert directory…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="cc-empty-state">
              <span>◈</span>
              <p>No experts match your filters.</p>
            </div>
          )}

          {!loading && filtered.map(expert => {
            const isOpen  = expanded === expert.id
            const credCol = CREDENTIAL_COLORS[expert.credential_type] ?? '#8a8a9b'
            const sent    = referralSent.has(expert.id)
            return (
              <div key={expert.id} style={{
                borderRadius: '10px', overflow: 'hidden',
                border: `1px solid ${isOpen ? 'rgba(212,168,75,.3)' : 'rgba(255,255,255,.07)'}`,
                background: isOpen ? 'rgba(212,168,75,.03)' : 'rgba(255,255,255,.02)',
                transition: 'border-color .15s',
              }}>
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : expert.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%',
                    background: `${credCol}20`, border: `1px solid ${credCol}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', color: credCol, fontWeight: 700,
                  }}>
                    {expert.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>

                  {/* Name + credential + institution */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '13px', color: '#f5f0e8' }}>{expert.full_name}</strong>
                      <span style={{
                        fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600,
                        background: `${credCol}14`, border: `1px solid ${credCol}30`, color: credCol,
                      }}>{CREDENTIAL_LABELS[expert.credential_type] ?? expert.credential_type}</span>
                      {expert.consultation_available && (
                        <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(76,175,130,.12)', border: '1px solid rgba(76,175,130,.25)', color: '#4caf82' }}>CONSULT AVAIL.</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(245,240,232,.5)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {expert.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.32)', marginTop: '1px' }}>
                      {expert.institution}
                    </div>
                  </div>

                  {/* Countries */}
                  <div style={{ flexShrink: 0, display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '80px' }}>
                    {expert.countries.slice(0, 4).map(c => (
                      <span key={c} style={{ fontSize: '14px' }}>{flagEmoji(c)}</span>
                    ))}
                    {expert.countries.length > 4 && (
                      <span style={{ fontSize: '9px', color: 'rgba(245,240,232,.3)', alignSelf: 'center' }}>+{expert.countries.length - 4}</span>
                    )}
                  </div>

                  <span style={{ fontSize: '13px', color: 'rgba(245,240,232,.25)', transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>›</span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,.05)' }}>

                    {/* Bio */}
                    {expert.bio_public && (
                      <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.65)', lineHeight: 1.6, margin: '14px 0 10px' }}>{expert.bio_public}</p>
                    )}

                    {/* Specialties */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>SPECIALTIES</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {expert.specialties.map(s => (
                          <span key={s} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(91,155,213,.08)', border: '1px solid rgba(91,155,213,.2)', color: '#5b9bd5' }}>{s}</span>
                        ))}
                      </div>
                    </div>

                    {/* Countries active */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '5px' }}>JURISDICTIONS COVERED</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {expert.countries.map(c => (
                          <span key={c} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(245,240,232,.6)' }}>
                            {flagEmoji(c)} {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Availability row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(245,240,232,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '3px' }}>REFERRALS</div>
                        <div style={{ fontSize: '11px', color: expert.accepts_referrals ? '#4caf82' : 'rgba(245,240,232,.35)', fontWeight: 600 }}>
                          {expert.accepts_referrals ? '✓ Accepting' : '✕ Not accepting'}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: '7px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(245,240,232,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '3px' }}>CONSULTATION</div>
                        <div style={{ fontSize: '11px', color: expert.consultation_available ? '#4caf82' : 'rgba(245,240,232,.35)', fontWeight: 600 }}>
                          {expert.consultation_available ? '✓ Available' : '✕ Not available'}
                        </div>
                      </div>
                    </div>

                    {/* Request intro CTA */}
                    {sent ? (
                      <div style={{ fontSize: '11px', color: '#4caf82', padding: '8px 0' }}>✓ Introduction request sent. Harbourview will facilitate within 48 hours.</div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setReferralSent(prev => { const s = new Set(prev); s.add(expert.id); return s })}
                          style={{
                            padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg,#d4a84b,#b88c35)', color: '#0d1117',
                            fontSize: '11px', fontWeight: 700,
                          }}
                        >
                          Request Introduction →
                        </button>
                        <a href="/intake" style={{
                          padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)',
                          color: 'rgba(245,240,232,.6)', fontSize: '11px', textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center',
                        }}>
                          Book via Intake
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="cc-feed-footer">
          <span>{experts.length} verified experts · {filtered.length} matching current filters</span>
          <a href="/intake" className="cc-right-link">List your practice →</a>
        </div>
      </div>

      {/* Right panel */}
      <div className="cc-two-right">
        <div style={{ padding: '16px' }}>

          {/* Stats */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>DIRECTORY STATS</div>
            {[
              { lbl: 'Verified experts',       val: String(experts.length) },
              { lbl: 'Consultation available', val: String(consultAvail) },
              { lbl: 'Accepting referrals',    val: String(referralAvail) },
              { lbl: 'Jurisdictions covered',  val: String(expertCountries.length) },
            ].map(({ lbl, val }) => (
              <div key={lbl} className="cc-metric-row">
                <span className="cc-metric-name">{lbl}</span>
                <span className="cc-metric-value">{val}</span>
              </div>
            ))}
          </div>

          {/* By credential type */}
          {!loading && experts.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>BY CREDENTIAL</div>
              {Object.entries(CREDENTIAL_LABELS).map(([k, v]) => {
                const cnt = experts.filter(e => e.credential_type === k).length
                if (cnt === 0) return null
                const col = CREDENTIAL_COLORS[k] ?? '#888'
                return (
                  <button
                    key={k}
                    onClick={() => setCredential(credential === k ? '' : k)}
                    style={{
                      display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0',
                      background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,.04)',
                      cursor: 'pointer', color: credential === k ? col : 'rgba(245,240,232,.55)',
                    }}
                  >
                    <span style={{ fontSize: '11px' }}>{v}</span>
                    <span style={{ fontSize: '11px', color: col, fontWeight: 600 }}>{cnt}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Role experts card */}
          {role && roleCredentials.length > 0 && (() => {
            const roleExperts = experts.filter(e => roleCredentials.includes(e.credential_type))
            const inCountry   = roleExperts.filter(e => e.countries.includes(country.iso2))
            const withConsult = roleExperts.filter(e => e.consultation_available)
            return (
              <div style={{ padding: '12px', background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.2)', borderRadius: '10px', marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#10b981', marginBottom: '8px', fontWeight: 700 }}>FOR {role.toUpperCase()}S</div>
                {[
                  { lbl: 'Matched experts',      val: String(roleExperts.length) },
                  { lbl: `In ${country.label}`,  val: String(inCountry.length) },
                  { lbl: 'Consult available',    val: String(withConsult.length) },
                ].map(({ lbl, val }) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(16,185,129,.08)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(245,240,232,.55)' }}>{lbl}</span>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
                <div style={{ marginTop: '7px', fontSize: '10px', color: 'rgba(245,240,232,.38)', lineHeight: 1.4 }}>
                  Credential types: {roleCredentials.map(c => CREDENTIAL_LABELS[c] ?? c).join(', ')}
                </div>
                <button onClick={() => setFilterMyRole(f => !f)} style={{
                  marginTop: '8px', width: '100%', padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: filterMyRole ? 'rgba(16,185,129,.2)' : 'rgba(16,185,129,.1)',
                  color: '#10b981', fontSize: '10px', fontWeight: 600,
                }}>
                  {filterMyRole ? '✓ Showing Role Experts' : 'Show Role Experts'}
                </button>
              </div>
            )
          })()}

          <a href="/intake" style={{
            display: 'flex', padding: '9px 14px', borderRadius: '8px',
            background: 'rgba(212,168,75,.12)', border: '1px solid rgba(212,168,75,.25)',
            color: '#d4a84b', fontSize: '11px', fontWeight: 600, textDecoration: 'none', gap: '6px', alignItems: 'center',
          }}>
            <span>⊕</span> List your practice
          </a>

          <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 8, padding: '8px 12px', color: '#10b981', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const }}
              onClick={() => onPageChange?.('events')}>
              ◷ Find Experts at Industry Events →
            </button>
            <button
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 12px', color: 'rgba(245,240,232,.6)', fontSize: '11px', cursor: 'pointer', textAlign: 'left' as const }}
              onClick={() => onPageChange?.('access-pathway')}>
              ◎ View Regulatory Access Pathway →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

// ── Banking Directory page ─────────────────────────────────────────────────────

const BANKING_TYPE_OPTIONS = Object.keys(PROVIDER_TYPE_LABELS) as BankingProvider['type'][]
const BANKING_STANCE_OPTIONS = Object.keys(STANCE_LABELS) as BankingProvider['stance'][]

const BANKING_ROLE_TYPES_MAP: Record<string, BankingProvider['type'][]> = {
  'Doctor':      ['bank', 'credit-union'],
  'Pharmacist':  ['bank', 'credit-union'],
  'Budtender':   ['bank', 'credit-union'],
  'Cultivator':  ['bank', 'credit-union', 'fintech'],
  'Geneticist':  ['bank', 'credit-union'],
  'Processor':   ['bank', 'payment-processor', 'fintech'],
  'Lab/QA':      ['bank', 'credit-union'],
  'Importer':    ['bank', 'emi', 'fintech'],
  'Exporter':    ['bank', 'emi', 'fintech', 'payment-processor'],
  'Distributor': ['bank', 'payment-processor', 'fintech'],
  'Clinic Op.':  ['bank', 'credit-union', 'payment-processor'],
  'Retail':      ['bank', 'credit-union', 'payment-processor', 'fintech'],
  'Compliance':  ['bank'],
  'Legal':       ['bank'],
  'Investor':    ['bank', 'crypto', 'fintech'],
  'Regulator':   ['bank'],
  'Patient Ed.': ['bank', 'credit-union'],
  'GMP/QA':      ['bank', 'credit-union'],
  'Logistics':   ['bank', 'emi', 'payment-processor'],
}

const BankingDirectoryPage = React.memo(function BankingDirectoryPage({
  country, region, role, onPageChange,
}: { country: { iso2: string; label: string }; region: string; role: string; onPageChange?: (page: CommandPage) => void }) {
  const [search,      setSearch]      = useState('')
  const [filterType,  setFilterType]  = useState<BankingProvider['type'] | 'all'>('all')
  const [filterStance, setFilterStance] = useState<BankingProvider['stance'] | 'all'>('all')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterMyRole, setFilterMyRole] = useState(false)
  const [expanded,    setExpanded]    = useState<string | null>(null)

  const roleTypes = useMemo<BankingProvider['type'][]>(() => BANKING_ROLE_TYPES_MAP[role] ?? [], [role])

  const filtered = useMemo(() => {
    const ql = search.toLowerCase()
    return BANKING_PROVIDERS
      .filter(p => {
        if (filterType   !== 'all' && p.type   !== filterType)   return false
        if (filterStance !== 'all' && p.stance !== filterStance) return false
        if (filterRegion !== 'all' && !p.regions.includes(filterRegion as BankingProvider['regions'][number])) return false
        if (filterMyRole && roleTypes.length > 0 && !roleTypes.includes(p.type)) return false
        if (search && !p.name.toLowerCase().includes(ql) && !p.notes.toLowerCase().includes(ql) && !p.services.some(s => s.toLowerCase().includes(ql))) return false
        return true
      })
      .sort((a, b) => {
        const aRole = roleTypes.includes(a.type)
        const bRole = roleTypes.includes(b.type)
        if (aRole && !bRole) return -1
        if (bRole && !aRole) return 1
        if (a.featured && !b.featured) return -1
        if (b.featured && !a.featured) return 1
        return 0
      })
  }, [search, filterType, filterStance, filterRegion, filterMyRole, roleTypes])

  const featured = useMemo(() => BANKING_PROVIDERS.filter(p => p.featured), [])

  const regionCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const p of BANKING_PROVIDERS) for (const r of p.regions) m[r] = (m[r] ?? 0) + 1
    return m
  }, [])

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const p of BANKING_PROVIDERS) m[p.type] = (m[p.type] ?? 0) + 1
    return m
  }, [])

  const regions = ['Europe', 'Americas', 'Asia-Pacific', 'Africa', 'Oceania']

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.bnk-header { margin-bottom: 18px; }
.bnk-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; letter-spacing: -.01em; }
.bnk-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.bnk-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.bnk-search { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 7px 12px; color: #f5f0e8; font-size: .82rem; width: 200px; outline: none; }
.bnk-search:focus { border-color: #d4a84b; }
.bnk-filter-btn { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 4px 12px; color: #8a8a9a; font-size: .74rem; cursor: pointer; transition: all .15s; white-space: nowrap; }
.bnk-filter-btn.active { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.bnk-filter-btn:hover:not(.active) { border-color: rgba(255,255,255,.2); color: #f5f0e8; }
.bnk-results { font-size: .74rem; color: #6b7280; margin-bottom: 10px; }
.bnk-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; margin-bottom: 10px; overflow: hidden; transition: border-color .15s; }
.bnk-card:hover { border-color: rgba(212,168,75,.3); }
.bnk-card-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; }
.bnk-card-name { font-size: .9rem; font-weight: 600; color: #f5f0e8; flex: 1; }
.bnk-type-chip { font-size: .68rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.bnk-stance-chip { font-size: .68rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.bnk-expand-arrow { font-size: .8rem; color: #6b7280; transition: transform .2s; }
.bnk-expand-arrow.open { transform: rotate(90deg); }
.bnk-card-body { padding: 0 14px 14px; border-top: 1px solid rgba(255,255,255,.05); padding-top: 12px; }
.bnk-notes { font-size: .8rem; color: #b0b0c0; line-height: 1.5; margin-bottom: 10px; }
.bnk-services { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.bnk-svc-chip { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); border-radius: 4px; padding: 2px 7px; font-size: .7rem; color: #9090a0; }
.bnk-flags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }
.bnk-flag { font-size: 1rem; }
.bnk-cta-row { display: flex; gap: 8px; align-items: center; }
.bnk-visit-btn { background: rgba(212,168,75,.15); border: 1px solid rgba(212,168,75,.4); border-radius: 6px; padding: 5px 12px; color: #d4a84b; font-size: .76rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: background .15s; }
.bnk-visit-btn:hover { background: rgba(212,168,75,.25); }
.bnk-enquire-btn { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 5px 12px; color: #d0cfc8; font-size: .76rem; cursor: pointer; transition: background .15s; }
.bnk-enquire-btn:hover { background: rgba(255,255,255,.12); }
.bnk-featured-badge { font-size: .62rem; padding: 1px 6px; background: rgba(212,168,75,.2); border: 1px solid rgba(212,168,75,.4); border-radius: 8px; color: #d4a84b; font-weight: 700; margin-left: 4px; }
.bnk-empty { text-align: center; padding: 40px 20px; color: #6b7280; font-size: .85rem; }
.bnk-card.role-match { border-left: 3px solid #10b981; }
.bnk-role-match-badge { font-size: .62rem; padding: 1px 6px; background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.35); border-radius: 8px; color: #10b981; font-weight: 700; margin-left: 4px; }
.bnk-my-role-btn { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.3); border-radius: 20px; padding: 4px 12px; color: #10b981; font-size: .74rem; cursor: pointer; transition: all .15s; white-space: nowrap; }
.bnk-my-role-btn.active { background: rgba(16,185,129,.22); border-color: #10b981; font-weight: 600; }
        `}</style>

        <div className="bnk-header">
          <div className="bnk-title">Banking &amp; Finance Directory</div>
          <div className="bnk-sub">Cannabis-friendly banks, EMIs, and payment processors — curated by jurisdiction</div>
        </div>

        <div className="bnk-filters">
          <input
            className="bnk-search"
            placeholder="Search providers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={`bnk-filter-btn${filterType === 'all' ? ' active' : ''}`} onClick={() => setFilterType('all')}>All Types</button>
          {BANKING_TYPE_OPTIONS.map(t => (
            <button key={t} className={`bnk-filter-btn${filterType === t ? ' active' : ''}`} onClick={() => setFilterType(t)}>
              {PROVIDER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="bnk-filters">
          <button className={`bnk-filter-btn${filterStance === 'all' ? ' active' : ''}`} onClick={() => setFilterStance('all')}>Any Stance</button>
          {BANKING_STANCE_OPTIONS.map(s => (
            <button key={s} className={`bnk-filter-btn${filterStance === s ? ' active' : ''}`} onClick={() => setFilterStance(s)}>
              {STANCE_LABELS[s]}
            </button>
          ))}
          <button className={`bnk-filter-btn${filterRegion === 'all' ? ' active' : ''}`} onClick={() => setFilterRegion('all')}>All Regions</button>
          {regions.map(r => (
            <button key={r} className={`bnk-filter-btn${filterRegion === r ? ' active' : ''}`} onClick={() => setFilterRegion(r)}>{r}</button>
          ))}
          {role && roleTypes.length > 0 && (
            <button
              className={`bnk-my-role-btn${filterMyRole ? ' active' : ''}`}
              onClick={() => { setFilterMyRole(v => !v); setFilterType('all') }}
            >
              ◎ For {role}s ({BANKING_PROVIDERS.filter(p => roleTypes.includes(p.type)).length})
            </button>
          )}
        </div>

        <div className="bnk-results">{filtered.length} provider{filtered.length !== 1 ? 's' : ''} found</div>

        {filtered.length === 0 && (
          <div className="bnk-empty">No providers match your filters.<br />Try broadening your search or adjusting the region.</div>
        )}

        {filtered.map(p => {
          const isRoleMatch = roleTypes.includes(p.type)
          return (
          <div key={p.id} className={`bnk-card${isRoleMatch ? ' role-match' : ''}`}>
            <div className="bnk-card-header" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div>
                <div className="bnk-card-name">
                  {p.name}
                  {p.featured && <span className="bnk-featured-badge">FEATURED</span>}
                  {isRoleMatch && role && <span className="bnk-role-match-badge">✓ {role}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span className="bnk-type-chip" style={{ background: PROVIDER_TYPE_COLORS[p.type] + '28', color: PROVIDER_TYPE_COLORS[p.type], border: `1px solid ${PROVIDER_TYPE_COLORS[p.type]}55` }}>
                    {PROVIDER_TYPE_LABELS[p.type]}
                  </span>
                  <span className="bnk-stance-chip" style={{ background: STANCE_COLORS[p.stance] + '28', color: STANCE_COLORS[p.stance], border: `1px solid ${STANCE_COLORS[p.stance]}55` }}>
                    {STANCE_LABELS[p.stance]}
                  </span>
                  {p.countries.slice(0, 5).map(c => (
                    <span key={c} className="bnk-flag">{flagEmoji(c)}</span>
                  ))}
                  {p.countries.length > 5 && <span style={{ fontSize: '.72rem', color: '#6b7280' }}>+{p.countries.length - 5}</span>}
                </div>
              </div>
              <span className={`bnk-expand-arrow${expanded === p.id ? ' open' : ''}`}>▶</span>
            </div>

            {expanded === p.id && (
              <div className="bnk-card-body">
                <p className="bnk-notes">{p.notes}</p>
                <div style={{ fontSize: '.74rem', color: '#8a8a9a', marginBottom: 6 }}>Services offered</div>
                <div className="bnk-services">
                  {p.services.map(s => <span key={s} className="bnk-svc-chip">{s}</span>)}
                </div>
                <div style={{ fontSize: '.74rem', color: '#8a8a9a', marginBottom: 6 }}>Jurisdictions served</div>
                <div className="bnk-flags">
                  {p.countries.map(c => (
                    <span key={c} title={c} className="bnk-flag">{flagEmoji(c)}</span>
                  ))}
                </div>
                <div className="bnk-cta-row">
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="bnk-visit-btn">Visit Website →</a>}
                  <button className="bnk-enquire-btn">Request Introduction</button>
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* For Your Role card */}
        {role && roleTypes.length > 0 && (() => {
          const roleMatchTotal   = BANKING_PROVIDERS.filter(p => roleTypes.includes(p.type)).length
          const roleMatchCountry = BANKING_PROVIDERS.filter(p => roleTypes.includes(p.type) && p.countries.includes(country.iso2)).length
          const roleMatchSpec    = BANKING_PROVIDERS.filter(p => roleTypes.includes(p.type) && p.stance === 'specialized').length
          return (
            <div style={{ background: 'rgba(16,185,129,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.3)' }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>For {role}s</div>
              <div style={{ fontSize: '.76rem', color: '#b0b0c0', marginBottom: 10, lineHeight: 1.5 }}>
                Provider types most relevant to your professional profile.
              </div>
              {([
                ['Relevant Providers', roleMatchTotal],
                ['In Your Market', roleMatchCountry],
                ['Cannabis-Specialized', roleMatchSpec],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
                  <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#10b981' }}>{val}</span>
                </div>
              ))}
              <button
                className={`bnk-my-role-btn${filterMyRole ? ' active' : ''}`}
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => { setFilterMyRole(v => !v); setFilterType('all') }}
              >
                {filterMyRole ? '✓ Showing Your Providers' : `Show ${roleMatchTotal} ${role} Providers`}
              </button>
            </div>
          )
        })()}

        {/* Stats */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Directory Stats</div>
          {([
            ['Total Providers', BANKING_PROVIDERS.length],
            ['Cannabis-Specialized', BANKING_PROVIDERS.filter(p => p.stance === 'specialized').length],
            ['Cannabis-Friendly', BANKING_PROVIDERS.filter(p => p.stance === 'cannabis-friendly').length],
            ['Crypto / Digital Assets', BANKING_PROVIDERS.filter(p => p.type === 'crypto').length],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
              <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#d4a84b' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* By type */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>By Type</div>
          {BANKING_TYPE_OPTIONS.filter(t => (typeCounts[t] ?? 0) > 0).map(t => (
            <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}
              onClick={() => setFilterType(filterType === t ? 'all' : t)}>
              <span style={{ fontSize: '.78rem', color: filterType === t ? '#d4a84b' : '#b0b0c0' }}>{PROVIDER_TYPE_LABELS[t]}</span>
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: PROVIDER_TYPE_COLORS[t] }}>{typeCounts[t] ?? 0}</span>
            </div>
          ))}
        </div>

        {/* By region */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>By Region</div>
          {regions.filter(r => (regionCounts[r] ?? 0) > 0).map(r => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}
              onClick={() => setFilterRegion(filterRegion === r ? 'all' : r)}>
              <span style={{ fontSize: '.78rem', color: filterRegion === r ? '#d4a84b' : '#b0b0c0' }}>{r}</span>
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#f5f0e8' }}>{regionCounts[r] ?? 0}</span>
            </div>
          ))}
        </div>

        {/* Cannabis SAFE Banking Act note */}
        <div style={{ background: 'rgba(212,168,75,.07)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(212,168,75,.2)' }}>
          <div style={{ fontSize: '.72rem', color: '#d4a84b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>US: SAFER Banking</div>
          <div style={{ fontSize: '.78rem', color: '#b0b0c0', lineHeight: 1.5 }}>
            The SAFER Banking Act passed the Senate Banking Committee in 2023. If enacted, it would provide a federal safe harbour for banks serving state-legal cannabis businesses, dramatically expanding traditional banking access.
          </div>
        </div>

        {/* Submit CTA */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Know a provider?</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10 }}>Help the industry by submitting cannabis-friendly financial institutions we haven&apos;t listed yet.</div>
          <button style={{ background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.4)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Submit a Provider
          </button>
        </div>

        <div style={{ background: 'rgba(16,185,129,.06)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.2)' }}>
          <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Counterparty Due Diligence</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Verify banking counterparties and financial institution credentials before opening accounts or transferring funds.</div>
          <button style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '7px 14px', color: '#10b981', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('kyb')}>
            Open KYB Verification →
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Corridor Payment Modelling</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Model cross-border payment costs alongside trade economics — banking fees are a significant component of total landed cost.</div>
          <button style={{ background: 'rgba(212,168,75,.1)', border: '1px solid rgba(212,168,75,.25)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('trade-calc')}>
            Open Landed Cost Calculator →
          </button>
        </div>
      </div>
    </div>
  )
})

// ── Notification Centre page ───────────────────────────────────────────────────

type NotifSeverity = 'critical' | 'high' | 'medium' | 'info'
type NotifCategory = 'regulatory' | 'corridor' | 'watchlist' | 'market' | 'compliance' | 'platform'

type Notification = {
  id:         string
  severity:   NotifSeverity
  category:   NotifCategory
  title:      string
  body:       string
  country?:   string
  date:       string
  read?:      boolean
  actionUrl?: string
  actionLabel?: string
}

const NOTIF_SEVERITY_COLORS: Record<NotifSeverity, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#d4a84b',
  info:     '#6b7280',
}
const NOTIF_SEVERITY_LABELS: Record<NotifSeverity, string> = {
  critical: 'CRITICAL',
  high:     'HIGH',
  medium:   'MEDIUM',
  info:     'INFO',
}
const NOTIF_CATEGORY_LABELS: Record<NotifCategory, string> = {
  regulatory: 'Regulatory',
  corridor:   'Corridor Alert',
  watchlist:  'Watchlist',
  market:     'Market Intel',
  compliance: 'Compliance',
  platform:   'Platform',
}
const NOTIF_CATEGORY_ICONS: Record<NotifCategory, string> = {
  regulatory: '◷',
  corridor:   '⬡',
  watchlist:  '◈',
  market:     '⊞',
  compliance: '◫',
  platform:   '◎',
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-de-cang-update',
    severity: 'critical',
    category: 'regulatory',
    title: 'Germany CanG Amendment — Social Club Cap Revised',
    body: 'The Bundesrat passed an amendment reducing the maximum membership capacity for Anbauvereinigungen from 500 to 300. Clubs above 300 members must apply for transitional exemption by 31 Aug 2026. Check your compliance posture immediately.',
    country: 'DE',
    date: '2026-06-28',
    actionLabel: 'View Regulatory Watch',
    actionUrl: '/dashboard?page=regulatory',
  },
  {
    id: 'n-th-hemp-export',
    severity: 'high',
    category: 'corridor',
    title: 'Thailand–EU Hemp Export Corridor: New Phytosanitary Requirements',
    body: 'The EU Plant Health Authority (EUPHRESCO) issued updated import inspection protocols effective 1 Sep 2026 for hemp biomass from Thailand. TRACES NT pre-notification now mandatory 72h before arrival (previously 24h).',
    country: 'TH',
    date: '2026-06-27',
    actionLabel: 'Access Pathway',
    actionUrl: '/dashboard?page=access-pathway',
  },
  {
    id: 'n-us-safe-banking',
    severity: 'high',
    category: 'regulatory',
    title: 'SAFER Banking Act — Senate Floor Vote Scheduled',
    body: 'Senate Majority Leader has scheduled a floor vote on the SAFER Banking Act for the week of 14 July 2026. If passed, the bill moves to conference with the House. Monitor closely — passage would unlock traditional US banking for plant-touching businesses.',
    country: 'US',
    date: '2026-06-26',
    actionLabel: 'Banking Directory',
    actionUrl: '/dashboard?page=banking',
  },
  {
    id: 'n-pt-infarmed-quota',
    severity: 'high',
    category: 'regulatory',
    title: 'Portugal INFARMED Annual Cultivation Quota Released',
    body: 'INFARMED published the 2026/27 cultivation quota allocations. Total licensed area increased 18% YoY to 412 ha. New applications accepted until 15 Aug 2026. Full quota document available via the INFARMED portal.',
    country: 'PT',
    date: '2026-06-25',
  },
  {
    id: 'n-il-imca-export-halt',
    severity: 'critical',
    category: 'corridor',
    title: 'Israel IMCA: Temporary Export Suspension — Quality Review',
    body: 'IMCA issued a temporary suspension on export certificates for Lot Series 2026-Q2 following a post-market quality audit. Affects exporters shipping EU-GMP flower to Germany and Czech Republic. Estimated suspension duration: 3–4 weeks.',
    country: 'IL',
    date: '2026-06-24',
    actionLabel: 'View Corridor Intel',
    actionUrl: '/dashboard?page=access-pathway',
  },
  {
    id: 'n-nl-tolerance-review',
    severity: 'medium',
    category: 'regulatory',
    title: 'Netherlands Gedoogbeleid Review: Government Consultation Open',
    body: 'The Dutch Ministry of Health (VWS) has opened a public consultation on reforming the tolerance policy for coffeeshops ahead of the pilot cities\' supply chain experiment conclusions (expected Q4 2026). Stakeholder submissions accepted until 31 Jul 2026.',
    country: 'NL',
    date: '2026-06-23',
  },
  {
    id: 'n-au-tga-guidance',
    severity: 'medium',
    category: 'compliance',
    title: 'Australia TGA Updated Medicinal Cannabis Guidance: Label Requirements',
    body: 'TGA published revised labelling guidelines for Schedule 8 medicinal cannabis products effective 1 Oct 2026. Key changes: THC content must now be expressed as mg/unit (not %) for all manufactured dose forms. Update product registrations before the deadline.',
    country: 'AU',
    date: '2026-06-22',
  },
  {
    id: 'n-ca-hc-aha-update',
    severity: 'medium',
    category: 'regulatory',
    title: 'Canada Health Canada — AHA Application Processing Backlog Warning',
    body: 'Health Canada issued an advisory noting a 14-week average processing time for Annual Health Assessment renewals (standard SLA: 8 weeks). Licence holders should submit AHA renewals at least 20 weeks before expiry to avoid operational gaps.',
    country: 'CA',
    date: '2026-06-21',
  },
  {
    id: 'n-za-dagga-project',
    severity: 'medium',
    category: 'regulatory',
    title: 'South Africa: Cannabis for Private Purposes Bill — National Assembly Reading',
    body: 'The Cannabis for Private Purposes Bill is listed for second reading in the National Assembly on 22 July 2026. If enacted, it would decriminalise adult private use and create a foundation for future commercial regulation under SAHPRA.',
    country: 'ZA',
    date: '2026-06-20',
  },
  {
    id: 'n-ch-pilot-enrollment',
    severity: 'medium',
    category: 'regulatory',
    title: 'Switzerland Cannabis Pilot Trials — Basel & Geneva Open Enrollment',
    body: 'Basel-Stadt and Geneva have opened participant enrollment for the federal cannabis pilot trials under Art. 8a nBetmG. Pharmacies in both cantons will begin distribution in September 2026. Up to 5,000 adult participants per city.',
    country: 'CH',
    date: '2026-06-19',
  },
  {
    id: 'n-gb-acmd-thcv',
    severity: 'info',
    category: 'regulatory',
    title: 'UK ACMD Consultation: THCV Scheduling Review',
    body: 'The Advisory Council on the Misuse of Drugs (ACMD) has launched a consultation on the scheduling of THCV following growing evidence of therapeutic potential. Interested parties may submit written evidence before 1 Sep 2026.',
    country: 'GB',
    date: '2026-06-18',
  },
  {
    id: 'n-market-mjbiz-data',
    severity: 'info',
    category: 'market',
    title: 'Global Cannabis Market Report Q2 2026 — Key Findings',
    body: 'MJBizDaily\'s Q2 2026 global report projects the worldwide cannabis market to reach $84B by end of 2026, led by US adult-use ($39B), Canada ($4.9B), and Germany ($2.1B). European medical market growing at 31% YoY, fastest among regulated regions.',
    date: '2026-06-17',
  },
  {
    id: 'n-platform-signals',
    severity: 'info',
    category: 'platform',
    title: 'Harbourview Intelligence: 47 New Regulatory Signals This Week',
    body: 'The signal pipeline processed 47 new regulatory data points this week across 23 jurisdictions. Largest clusters: Germany (12), Netherlands (8), Thailand (6), Portugal (5). Visit the Intelligence page to review and triage.',
    date: '2026-06-16',
    actionLabel: 'Open Intelligence',
    actionUrl: '/dashboard?page=signals',
  },
  {
    id: 'n-co-colombia-decree',
    severity: 'medium',
    category: 'regulatory',
    title: 'Colombia: Decree 613 — Medical Cannabis Export Simplification',
    body: 'Colombia\'s Ministry of Justice issued Decree 613 streamlining the export certification process for cannabis derivatives. Single-window digital submission now replaces the 3-form paper process. Effective immediately for ICA-licensed exporters.',
    country: 'CO',
    date: '2026-06-15',
  },
  {
    id: 'n-be-belgium-update',
    severity: 'info',
    category: 'regulatory',
    title: 'Belgium: Federal Coalition Agreement Includes Medical Cannabis Expansion',
    body: 'The newly formed Belgian federal coalition agreement includes a commitment to expand the medical cannabis access programme and establish a national regulatory framework by mid-2027. Currently only compassionate use is permitted.',
    country: 'BE',
    date: '2026-06-14',
  },
]

const NOTIF_ROLE_CATEGORIES_MAP: Record<string, NotifCategory[]> = {
  'Doctor':      ['regulatory', 'compliance', 'market'],
  'Pharmacist':  ['regulatory', 'compliance', 'market'],
  'Budtender':   ['regulatory', 'market'],
  'Cultivator':  ['regulatory', 'market', 'watchlist'],
  'Geneticist':  ['regulatory', 'market', 'watchlist'],
  'Processor':   ['regulatory', 'compliance', 'market'],
  'Lab/QA':      ['regulatory', 'compliance', 'market'],
  'Importer':    ['corridor', 'regulatory', 'market', 'watchlist'],
  'Exporter':    ['corridor', 'regulatory', 'market', 'watchlist'],
  'Distributor': ['corridor', 'market', 'regulatory'],
  'Clinic Op.':  ['regulatory', 'compliance', 'market'],
  'Retail':      ['regulatory', 'market', 'compliance'],
  'Compliance':  ['regulatory', 'compliance', 'watchlist'],
  'Legal':       ['regulatory', 'compliance', 'watchlist'],
  'Investor':    ['market', 'watchlist', 'regulatory'],
  'Regulator':   ['regulatory', 'compliance', 'watchlist'],
  'Patient Ed.': ['regulatory', 'market'],
  'GMP/QA':      ['regulatory', 'compliance'],
  'Logistics':   ['corridor', 'market', 'regulatory'],
}

const NotificationCentrePage = React.memo(function NotificationCentrePage({
  country, role, onPageChange,
}: { country: { iso2: string; label: string }; region: string; role: string; onPageChange?: (page: CommandPage) => void }) {
  const [readIds,       setReadIds]       = useState<Set<string>>(new Set())
  const [filterCat,     setFilterCat]     = useState<NotifCategory | 'all'>('all')
  const [filterSev,     setFilterSev]     = useState<NotifSeverity | 'all'>('all')
  const [showRead,      setShowRead]      = useState(false)
  const [filterMyRole,  setFilterMyRole]  = useState(false)

  const roleCategories = useMemo<NotifCategory[]>(() => NOTIF_ROLE_CATEGORIES_MAP[role] ?? [], [role])

  const allNotifs = useMemo(() => {
    let list = SEED_NOTIFICATIONS.slice()
    if (country) list = list.filter(n => !n.country || n.country === country.iso2)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [country])

  const filtered = useMemo(() => {
    return allNotifs
      .filter(n => {
        if (!showRead && readIds.has(n.id)) return false
        if (filterCat !== 'all' && n.category !== filterCat) return false
        if (filterSev !== 'all' && n.severity !== filterSev) return false
        if (filterMyRole && roleCategories.length > 0 && !roleCategories.includes(n.category)) return false
        return true
      })
      .sort((a, b) => {
        if (filterMyRole) return 0 // keep date order when already role-filtered
        const aRole = roleCategories.includes(a.category) ? 1 : 0
        const bRole = roleCategories.includes(b.category) ? 1 : 0
        if (bRole - aRole !== 0) return bRole - aRole
        return b.date.localeCompare(a.date)
      })
  }, [allNotifs, readIds, filterCat, filterSev, showRead, filterMyRole, roleCategories])

  const unreadCount = allNotifs.filter(n => !readIds.has(n.id)).length

  const markRead  = (id: string) => setReadIds(prev => new Set([...prev, id]))
  const markAllRead = () => setReadIds(new Set(allNotifs.map(n => n.id)))

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const n of allNotifs) if (!readIds.has(n.id)) m[n.category] = (m[n.category] ?? 0) + 1
    return m
  }, [allNotifs, readIds])

  const sevCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const n of allNotifs) if (!readIds.has(n.id)) m[n.severity] = (m[n.severity] ?? 0) + 1
    return m
  }, [allNotifs, readIds])

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.nc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nc-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.nc-unread-badge { background: rgba(239,68,68,.2); border: 1px solid rgba(239,68,68,.4); border-radius: 10px; padding: 2px 8px; font-size: .74rem; color: #ef4444; font-weight: 700; }
.nc-mark-all { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 5px 12px; color: #9090a0; font-size: .75rem; cursor: pointer; }
.nc-mark-all:hover { color: #f5f0e8; }
.nc-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.nc-filter-btn { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 3px 11px; color: #8a8a9a; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.nc-filter-btn.active { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.nc-filter-btn:hover:not(.active) { color: #f5f0e8; border-color: rgba(255,255,255,.2); }
.nc-show-read { font-size: .74rem; color: #6b7280; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 3px 0; }
.nc-notif { border-radius: 10px; border: 1px solid rgba(255,255,255,.08); padding: 14px; margin-bottom: 8px; transition: border-color .15s; position: relative; }
.nc-notif:hover { border-color: rgba(212,168,75,.25); }
.nc-notif.read { opacity: .5; }
.nc-notif-top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.nc-sev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.nc-notif-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; align-items: center; }
.nc-sev-chip { font-size: .65rem; padding: 1px 6px; border-radius: 8px; font-weight: 700; }
.nc-cat-chip { font-size: .68rem; padding: 1px 6px; border-radius: 8px; background: rgba(255,255,255,.08); color: #9090a0; }
.nc-date { font-size: .68rem; color: #6b7280; }
.nc-flag { font-size: .9rem; }
.nc-notif-title { font-size: .88rem; font-weight: 600; color: #f5f0e8; line-height: 1.35; margin-bottom: 5px; }
.nc-notif-body { font-size: .78rem; color: #9090a0; line-height: 1.5; }
.nc-notif-actions { display: flex; gap: 8px; margin-top: 10px; }
.nc-action-btn { font-size: .73rem; color: #d4a84b; background: rgba(212,168,75,.1); border: 1px solid rgba(212,168,75,.3); border-radius: 5px; padding: 4px 10px; cursor: pointer; text-decoration: none; }
.nc-action-btn:hover { background: rgba(212,168,75,.2); }
.nc-dismiss-btn { font-size: .73rem; color: #6b7280; background: transparent; border: none; cursor: pointer; margin-left: auto; }
.nc-dismiss-btn:hover { color: #9090a0; }
.nc-empty { text-align: center; padding: 40px 20px; color: #6b7280; font-size: .85rem; }
.nc-role-btn { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.3); border-radius: 20px; padding: 3px 11px; color: #10b981; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.nc-role-btn.active { background: rgba(16,185,129,.22); border-color: #10b981; font-weight: 600; }
.nc-notif.role-relevant { border-left: 3px solid rgba(16,185,129,.5); }
        `}</style>

        <div className="nc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nc-title">Notification Centre</div>
            {unreadCount > 0 && <span className="nc-unread-badge">{unreadCount} unread</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="nc-show-read" onClick={() => setShowRead(v => !v)}>
              <span style={{ width: 14, height: 14, border: '1px solid #6b7280', borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem' }}>
                {showRead ? '✓' : ''}
              </span>
              Show read
            </span>
            {unreadCount > 0 && <button className="nc-mark-all" onClick={markAllRead}>Mark all read</button>}
          </div>
        </div>

        {/* Category filters */}
        <div className="nc-filters">
          <button className={`nc-filter-btn${filterCat === 'all' ? ' active' : ''}`} onClick={() => setFilterCat('all')}>All</button>
          {(Object.keys(NOTIF_CATEGORY_LABELS) as NotifCategory[]).map(c => (
            <button key={c} className={`nc-filter-btn${filterCat === c ? ' active' : ''}`} onClick={() => setFilterCat(c)}>
              {NOTIF_CATEGORY_ICONS[c]} {NOTIF_CATEGORY_LABELS[c]}
              {(catCounts[c] ?? 0) > 0 && <span style={{ marginLeft: 4, background: 'rgba(212,168,75,.3)', borderRadius: 8, padding: '0 4px', fontSize: '.65rem', color: '#d4a84b' }}>{catCounts[c]}</span>}
            </button>
          ))}
        </div>

        {/* Severity filters */}
        <div className="nc-filters" style={{ marginBottom: 16 }}>
          <button className={`nc-filter-btn${filterSev === 'all' ? ' active' : ''}`} onClick={() => setFilterSev('all')}>Any Severity</button>
          {(Object.keys(NOTIF_SEVERITY_LABELS) as NotifSeverity[]).map(s => (
            <button key={s} className={`nc-filter-btn${filterSev === s ? ' active' : ''}`}
              style={filterSev === s ? {} : { color: NOTIF_SEVERITY_COLORS[s] + 'cc' }}
              onClick={() => setFilterSev(s)}>
              {NOTIF_SEVERITY_LABELS[s]}
              {(sevCounts[s] ?? 0) > 0 && <span style={{ marginLeft: 4, opacity: .7 }}>{sevCounts[s]}</span>}
            </button>
          ))}
          {role && roleCategories.length > 0 && (
            <button
              className={`nc-role-btn${filterMyRole ? ' active' : ''}`}
              onClick={() => setFilterMyRole(v => !v)}
            >
              ◎ For {role}s ({allNotifs.filter(n => roleCategories.includes(n.category) && !readIds.has(n.id)).length} unread)
            </button>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="nc-empty">
            {showRead ? 'No notifications match your filters.' : 'All caught up — no unread notifications.'}
          </div>
        )}

        {filtered.map(n => {
          const isRead      = readIds.has(n.id)
          const isRoleAlert = roleCategories.includes(n.category)
          return (
            <div key={n.id} className={`nc-notif${isRead ? ' read' : ''}${isRoleAlert && !isRead ? ' role-relevant' : ''}`}
              style={{ background: isRead ? 'rgba(255,255,255,.02)' : `rgba(${n.severity === 'critical' ? '239,68,68' : n.severity === 'high' ? '249,115,22' : '255,255,255'},.04)` }}>
              <div className="nc-notif-top">
                <div className="nc-sev-dot" style={{ background: NOTIF_SEVERITY_COLORS[n.severity] }} />
                <div style={{ flex: 1 }}>
                  <div className="nc-notif-meta">
                    <span className="nc-sev-chip" style={{ background: NOTIF_SEVERITY_COLORS[n.severity] + '28', color: NOTIF_SEVERITY_COLORS[n.severity], border: `1px solid ${NOTIF_SEVERITY_COLORS[n.severity]}55` }}>
                      {NOTIF_SEVERITY_LABELS[n.severity]}
                    </span>
                    <span className="nc-cat-chip">{NOTIF_CATEGORY_ICONS[n.category]} {NOTIF_CATEGORY_LABELS[n.category]}</span>
                    {n.country && <span className="nc-flag">{flagEmoji(n.country)}</span>}
                    <span className="nc-date">{n.date}</span>
                  </div>
                  <div className="nc-notif-title">{n.title}</div>
                  <div className="nc-notif-body">{n.body}</div>
                  {(n.actionLabel || !isRead) && (
                    <div className="nc-notif-actions">
                      {n.actionLabel && (
                        <span className="nc-action-btn">{n.actionLabel} →</span>
                      )}
                      {!isRead && (
                        <button className="nc-dismiss-btn" onClick={() => markRead(n.id)}>Mark read ✕</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Role Alerts card */}
        {role && roleCategories.length > 0 && (() => {
          const roleUnread = allNotifs.filter(n => roleCategories.includes(n.category) && !readIds.has(n.id))
          const roleCritical = roleUnread.filter(n => n.severity === 'critical' || n.severity === 'high').length
          return (
            <div style={{ background: 'rgba(16,185,129,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.3)' }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                {role} Alerts
              </div>
              {([
                ['Unread for Your Role', roleUnread.length],
                ['High Priority', roleCritical],
                ['Categories Tracked', roleCategories.length],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
                  <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#10b981' }}>{val}</span>
                </div>
              ))}
              <button
                className={`nc-role-btn${filterMyRole ? ' active' : ''}`}
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => setFilterMyRole(v => !v)}
              >
                {filterMyRole ? '✓ Showing Role Alerts' : `Show ${roleUnread.length} ${role} Alerts`}
              </button>
            </div>
          )
        })()}

        {/* Summary */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Alert Summary</div>
          {(Object.keys(NOTIF_SEVERITY_LABELS) as NotifSeverity[]).map(s => {
            const count = allNotifs.filter(n => n.severity === s).length
            return (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, cursor: 'pointer' }}
                onClick={() => setFilterSev(filterSev === s ? 'all' : s)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: NOTIF_SEVERITY_COLORS[s], display: 'inline-block' }} />
                  <span style={{ fontSize: '.78rem', color: filterSev === s ? '#d4a84b' : '#b0b0c0' }}>{NOTIF_SEVERITY_LABELS[s]}</span>
                </span>
                <span style={{ fontSize: '.88rem', fontWeight: 700, color: NOTIF_SEVERITY_COLORS[s] }}>{count}</span>
              </div>
            )
          })}
        </div>

        {/* By category */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>By Category</div>
          {(Object.keys(NOTIF_CATEGORY_LABELS) as NotifCategory[]).map(c => {
            const count = allNotifs.filter(n => n.category === c).length
            if (!count) return null
            return (
              <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}
                onClick={() => setFilterCat(filterCat === c ? 'all' : c)}>
                <span style={{ fontSize: '.78rem', color: filterCat === c ? '#d4a84b' : '#b0b0c0' }}>
                  {NOTIF_CATEGORY_ICONS[c]} {NOTIF_CATEGORY_LABELS[c]}
                </span>
                <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#f5f0e8' }}>{count}</span>
              </div>
            )
          })}
        </div>

        {/* Critical alerts callout */}
        {allNotifs.some(n => n.severity === 'critical' && !readIds.has(n.id)) && (
          <div style={{ background: 'rgba(239,68,68,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(239,68,68,.3)' }}>
            <div style={{ fontSize: '.72rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Action Required</div>
            <div style={{ fontSize: '.78rem', color: '#b0b0c0', lineHeight: 1.5 }}>
              You have {allNotifs.filter(n => n.severity === 'critical' && !readIds.has(n.id)).length} critical unread alert{allNotifs.filter(n => n.severity === 'critical' && !readIds.has(n.id)).length !== 1 ? 's' : ''} that may require immediate review.
            </div>
          </div>
        )}

        {/* Preferences note */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Alert Preferences</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Customise which jurisdictions, corridors, and categories trigger alerts. Email and Slack delivery available on Pro plans.</div>
          <button style={{ background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.4)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Configure Alerts
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 8, padding: '9px 14px', color: '#10b981', fontSize: '.76rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => onPageChange?.('regulatory')}>
            ◷ Regulatory Watch →
          </button>
          <button style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '9px 14px', color: 'rgba(245,240,232,.55)', fontSize: '.76rem', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => onPageChange?.('watchlist')}>
            ◎ Manage Watchlist →
          </button>
        </div>
      </div>
    </div>
  )
})

// ── KYB Verification page ─────────────────────────────────────────────────────

type KybCategory = 'identity' | 'licensing' | 'compliance' | 'financial' | 'operational' | 'legal'
type KybStatus   = 'not-started' | 'in-progress' | 'complete' | 'flagged'

type KybCheckItem = {
  id:          string
  category:    KybCategory
  title:       string
  description: string
  mandatory:   boolean
  docsNeeded?: string[]
  tooltip?:    string
}

const KYB_CATEGORY_LABELS: Record<KybCategory, string> = {
  identity:    'Identity & Ownership',
  licensing:   'Licences & Permits',
  compliance:  'Compliance & AML',
  financial:   'Financial Standing',
  operational: 'Operational Capacity',
  legal:       'Legal & Sanctions',
}
const KYB_CATEGORY_ICONS: Record<KybCategory, string> = {
  identity:    '◎',
  licensing:   '◷',
  compliance:  '◫',
  financial:   '⊞',
  operational: '⊕',
  legal:       '⬡',
}
const KYB_CATEGORY_COLORS: Record<KybCategory, string> = {
  identity:    '#6366f1',
  licensing:   '#d4a84b',
  compliance:  '#10b981',
  financial:   '#3b82f6',
  operational: '#8b5cf6',
  legal:       '#ef4444',
}

const KYB_CHECKLIST: KybCheckItem[] = [
  // Identity & Ownership
  { id: 'kyb-cert-incorp', category: 'identity', mandatory: true,
    title: 'Certificate of Incorporation',
    description: 'Obtain a certified copy of the entity\'s certificate of incorporation (or equivalent founding document) from the relevant commercial registry.',
    docsNeeded: ['Certificate of Incorporation', 'Articles of Association'],
  },
  { id: 'kyb-ubo', category: 'identity', mandatory: true,
    title: 'Ultimate Beneficial Owners (UBO) Disclosure',
    description: 'Identify all natural persons who directly or indirectly own or control ≥25% of the entity (or the threshold required under applicable AML law). Verify identity via government-issued ID + proof of address.',
    docsNeeded: ['UBO Declaration Form', 'Passport / National ID (per UBO)', 'Proof of address (per UBO)'],
    tooltip: 'Many jurisdictions apply a 10% threshold for cannabis sector UBO disclosure.',
  },
  { id: 'kyb-director-id', category: 'identity', mandatory: true,
    title: 'Director & Officer Identification',
    description: 'Collect identity documents for all directors, officers, and authorised signatories who will transact with your business.',
    docsNeeded: ['Passport / National ID', 'Proof of address', 'Signed authority mandate'],
  },
  { id: 'kyb-ownership-structure', category: 'identity', mandatory: true,
    title: 'Corporate Ownership Structure Chart',
    description: 'Obtain a group structure chart showing all legal entities in the ownership chain up to the natural-person UBOs, including jurisdiction of incorporation for each entity.',
    docsNeeded: ['Group structure chart (signed)', 'Incorporation docs for each intermediate entity'],
  },
  { id: 'kyb-registered-address', category: 'identity', mandatory: false,
    title: 'Registered Address Verification',
    description: 'Confirm the registered business address matches the official registry entry and obtain a utility bill or bank statement issued within 3 months confirming a physical presence.',
    docsNeeded: ['Utility bill or bank statement (≤3 months)'],
  },
  // Licences & Permits
  { id: 'kyb-cannabis-licence', category: 'licensing', mandatory: true,
    title: 'Cannabis Operating Licence',
    description: 'Obtain a certified copy of the entity\'s current, valid cannabis operating licence issued by the competent regulatory authority (e.g., BfArM DE, INFARMED PT, IMCA IL, Health Canada, TGA AU).',
    docsNeeded: ['Cannabis operating licence (certified copy)', 'Licence schedule / endorsed activities'],
  },
  { id: 'kyb-licence-scope', category: 'licensing', mandatory: true,
    title: 'Licence Scope & Activity Verification',
    description: 'Confirm that the licence covers the specific activities you will transact in (e.g., cultivation, manufacture, import, export, distribution, wholesale). Watch for activity gaps.',
    docsNeeded: ['Licence activities endorsement', 'Any licence amendments or conditions'],
    tooltip: 'A partner with a cultivation licence only cannot legally export without a separate import/export endorsement.',
  },
  { id: 'kyb-gmp', category: 'licensing', mandatory: false,
    title: 'GMP / EU-GMP Certification',
    description: 'For pharmaceutical-grade cannabis, verify current EU-GMP (or equivalent) certification. Check the EMA EUDRAGMDP database for EU-GMP status.',
    docsNeeded: ['GMP certificate (current)', 'Last inspection report (if available)'],
  },
  { id: 'kyb-import-export-permit', category: 'licensing', mandatory: false,
    title: 'Import / Export Permits (transaction-specific)',
    description: 'For each shipment, confirm both the exporting jurisdiction\'s export authorisation and the importing jurisdiction\'s import permit are current and cover the specific lot.',
    docsNeeded: ['Export authorisation (per shipment)', 'Import permit (per shipment)'],
  },
  { id: 'kyb-business-registration', category: 'licensing', mandatory: true,
    title: 'Business Registration / Tax Number',
    description: 'Verify the entity is currently registered and in good standing in its jurisdiction. Obtain the VAT / tax ID and confirm no dissolution or insolvency proceedings are underway.',
    docsNeeded: ['Current business registration extract (≤6 months)', 'VAT / tax registration certificate'],
  },
  // Compliance & AML
  { id: 'kyb-aml-policy', category: 'compliance', mandatory: true,
    title: 'AML / CTF Policy',
    description: 'Request the counterparty\'s current Anti-Money Laundering and Counter-Terrorist Financing policy. Assess whether it is proportionate to the cannabis sector\'s risk profile.',
    docsNeeded: ['AML/CTF Policy (current version)'],
  },
  { id: 'kyb-sanctions-screening', category: 'compliance', mandatory: true,
    title: 'Sanctions & PEP Screening',
    description: 'Screen the entity, its UBOs, directors, and officers against OFAC SDN, EU Consolidated Sanctions List, UN Consolidated List, and HMT (UK) databases. Document screening results and date.',
    tooltip: 'Run screening at onboarding AND on a recurring basis (at minimum annually, or on material news events).',
  },
  { id: 'kyb-adverse-media', category: 'compliance', mandatory: true,
    title: 'Adverse Media & Reputational Check',
    description: 'Conduct a structured adverse media search in local language(s) for the entity name, trading names, and key individuals. Document findings and risk assessment.',
    docsNeeded: ['Adverse media screening report'],
  },
  { id: 'kyb-pep-declaration', category: 'compliance', mandatory: false,
    title: 'Politically Exposed Person (PEP) Declaration',
    description: 'Obtain a signed declaration from each UBO and director confirming whether they are, or are associated with, a PEP. Apply enhanced due diligence if any PEP relationship exists.',
    docsNeeded: ['Signed PEP Declaration (per individual)'],
  },
  { id: 'kyb-compliance-officer', category: 'compliance', mandatory: false,
    title: 'Compliance Officer / MLRO Contact',
    description: 'Identify the counterparty\'s designated compliance officer or Money Laundering Reporting Officer. Maintain direct contact for ongoing compliance matters.',
    docsNeeded: ['Compliance officer name & contact details'],
  },
  // Financial Standing
  { id: 'kyb-financial-statements', category: 'financial', mandatory: true,
    title: 'Audited Financial Statements',
    description: 'Obtain the two most recent audited annual financial statements. Assess solvency, liquidity ratios, and any going-concern qualifications.',
    docsNeeded: ['Audited financials (last 2 years)', 'Auditor\'s report'],
  },
  { id: 'kyb-bank-reference', category: 'financial', mandatory: false,
    title: 'Bank Reference Letter',
    description: 'Request a bank reference letter from the counterparty\'s primary banking institution confirming the account standing and relationship duration.',
    docsNeeded: ['Bank reference letter (≤3 months)'],
  },
  { id: 'kyb-credit-check', category: 'financial', mandatory: false,
    title: 'Credit & Insolvency Check',
    description: 'Run a commercial credit check through a recognised bureau (e.g., Dun & Bradstreet, Creditsafe, Experian Business) and verify no insolvency, administration, or winding-up proceedings.',
    docsNeeded: ['Commercial credit report (≤3 months)'],
  },
  { id: 'kyb-insurance', category: 'financial', mandatory: false,
    title: 'Insurance Certificates',
    description: 'Verify the counterparty holds appropriate insurance for the activities transacted — typically product liability, cargo/transit, and professional indemnity as applicable.',
    docsNeeded: ['Insurance schedule / certificate of currency'],
  },
  // Operational Capacity
  { id: 'kyb-facility-audit', category: 'operational', mandatory: false,
    title: 'Facility Audit or Site Visit',
    description: 'Where material, conduct or commission a physical audit or virtual tour of cultivation/manufacturing facilities to verify capacity and GMP adherence.',
  },
  { id: 'kyb-track-trace', category: 'operational', mandatory: true,
    title: 'Track & Trace System Confirmation',
    description: 'Confirm the counterparty participates in the applicable seed-to-sale or track-and-trace system mandated by their jurisdiction (e.g., METRC in US, Cannabis Tracking System in Canada, BfArM/Narcotics database in Germany).',
    docsNeeded: ['Track-and-trace system account confirmation or certificate'],
  },
  { id: 'kyb-quality-certs', category: 'operational', mandatory: false,
    title: 'COA / Quality Testing Protocols',
    description: 'Review the counterparty\'s standard certificate of analysis (COA) for a reference lot. Confirm testing covers cannabinoids, terpenes, heavy metals, pesticides, microbials, and residual solvents as required by destination market.',
    docsNeeded: ['Sample COA (recent lot)', 'List of accredited testing laboratories used'],
  },
  { id: 'kyb-logistics-capability', category: 'operational', mandatory: false,
    title: 'Logistics & Cold Chain Capability',
    description: 'Verify shipping, storage, and transport arrangements meet applicable requirements — particularly temperature-controlled logistics for perishable or pharmaceutical-grade products.',
    docsNeeded: ['Logistics partner confirmation', 'Controlled substance transport authorisation (if applicable)'],
  },
  // Legal & Sanctions
  { id: 'kyb-litigation-check', category: 'legal', mandatory: true,
    title: 'Litigation & Regulatory Action Check',
    description: 'Search court records and regulatory databases for any pending or past litigation, regulatory sanctions, licence revocations, or enforcement actions against the entity or key individuals.',
  },
  { id: 'kyb-contractual-capacity', category: 'legal', mandatory: true,
    title: 'Contractual Authority Verification',
    description: 'Confirm the individual signing contracts has authority to bind the entity. Obtain board resolution, power of attorney, or equivalent authorisation document.',
    docsNeeded: ['Board resolution or POA authorising signatory'],
  },
  { id: 'kyb-data-protection', category: 'legal', mandatory: false,
    title: 'Data Protection Compliance',
    description: 'Confirm the counterparty is registered with the relevant data protection authority where required (e.g., ICO in UK, DPA in Germany) and has a current privacy policy for any data shared.',
    docsNeeded: ['DPA registration confirmation (if applicable)', 'Data Processing Agreement (DPA)'],
  },
]

const KYB_ROLE_PRIORITY_CATS: Record<string, KybCategory[]> = {
  'Doctor':      ['licensing', 'compliance', 'identity'],
  'Pharmacist':  ['licensing', 'compliance', 'financial'],
  'Budtender':   ['identity', 'licensing', 'operational'],
  'Cultivator':  ['licensing', 'operational', 'compliance'],
  'Geneticist':  ['licensing', 'operational', 'identity'],
  'Processor':   ['licensing', 'operational', 'compliance'],
  'Lab/QA':      ['licensing', 'operational', 'identity'],
  'Importer':    ['licensing', 'compliance', 'legal'],
  'Exporter':    ['licensing', 'compliance', 'legal'],
  'Distributor': ['licensing', 'compliance', 'operational'],
  'Clinic Op.':  ['licensing', 'compliance', 'financial'],
  'Retail':      ['licensing', 'identity', 'financial'],
  'Compliance':  ['compliance', 'legal', 'identity'],
  'Legal':       ['legal', 'compliance', 'identity'],
  'Investor':    ['financial', 'legal', 'identity'],
  'Regulator':   ['licensing', 'legal', 'compliance'],
  'Patient Ed.': ['identity', 'licensing', 'compliance'],
  'GMP/QA':      ['licensing', 'operational', 'compliance'],
  'Logistics':   ['licensing', 'operational', 'legal'],
}

function kybCategoryProgress(items: KybCheckItem[], statuses: Record<string, KybStatus>, cat: KybCategory) {
  const catItems = items.filter(i => i.category === cat)
  const done = catItems.filter(i => statuses[i.id] === 'complete').length
  return { done, total: catItems.length, pct: catItems.length ? Math.round(done / catItems.length * 100) : 0 }
}

const KybVerificationPage = React.memo(function KybVerificationPage({
  country, role, onPageChange,
}: { country: { iso2: string; label: string }; region: string; role: string; onPageChange?: (page: CommandPage) => void }) {
  const [statuses,    setStatuses]    = useState<Record<string, KybStatus>>({})
  const [notes,       setNotes]       = useState<Record<string, string>>({})
  const [filterCat,   setFilterCat]   = useState<KybCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<KybStatus | 'all'>('all')
  const [showMandOnly, setShowMandOnly] = useState(false)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [entityName,  setEntityName]  = useState('')

  const setStatus = (id: string, s: KybStatus) => setStatuses(prev => ({ ...prev, [id]: s }))
  const setNote   = (id: string, v: string)    => setNotes(prev => ({ ...prev, [id]: v }))

  const filtered = useMemo(() => KYB_CHECKLIST.filter(i => {
    if (showMandOnly && !i.mandatory) return false
    if (filterCat    !== 'all' && i.category !== filterCat)              return false
    if (filterStatus !== 'all' && (statuses[i.id] ?? 'not-started') !== filterStatus) return false
    return true
  }), [filterCat, filterStatus, showMandOnly, statuses])

  const totalPct = useMemo(() => {
    const mandatory = KYB_CHECKLIST.filter(i => i.mandatory)
    const done = mandatory.filter(i => statuses[i.id] === 'complete').length
    return mandatory.length ? Math.round(done / mandatory.length * 100) : 0
  }, [statuses])

  const overallComplete = KYB_CHECKLIST.filter(i => statuses[i.id] === 'complete').length
  const flaggedCount    = KYB_CHECKLIST.filter(i => statuses[i.id] === 'flagged').length

  const STATUS_LABELS: Record<KybStatus, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'complete':    'Complete',
    'flagged':     'Flagged',
  }
  const STATUS_COLORS: Record<KybStatus, string> = {
    'not-started': '#6b7280',
    'in-progress': '#d4a84b',
    'complete':    '#10b981',
    'flagged':     '#ef4444',
  }

  const categories = Object.keys(KYB_CATEGORY_LABELS) as KybCategory[]

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.kyb-header { margin-bottom: 18px; }
.kyb-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.kyb-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.kyb-entity-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.kyb-entity-input { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 8px 12px; color: #f5f0e8; font-size: .85rem; flex: 1; outline: none; }
.kyb-entity-input:focus { border-color: #d4a84b; }
.kyb-entity-label { font-size: .76rem; color: #8a8a9a; white-space: nowrap; }
.kyb-progress-bar-wrap { background: rgba(255,255,255,.06); border-radius: 6px; overflow: hidden; height: 8px; margin-bottom: 4px; }
.kyb-progress-bar { height: 8px; border-radius: 6px; transition: width .3s; }
.kyb-progress-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 14px; }
.kyb-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.kyb-filter-btn { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 3px 11px; color: #8a8a9a; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.kyb-filter-btn.active { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.kyb-filter-btn:hover:not(.active) { color: #f5f0e8; border-color: rgba(255,255,255,.2); }
.kyb-mand-toggle { font-size: .73rem; color: #8a8a9a; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.kyb-item { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 10px; margin-bottom: 8px; overflow: hidden; }
.kyb-item.flagged { border-color: rgba(239,68,68,.3); }
.kyb-item.complete { border-color: rgba(16,185,129,.25); }
.kyb-item-header { display: flex; align-items: center; gap: 10px; padding: 11px 14px; cursor: pointer; }
.kyb-mand-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
.kyb-opt-dot  { width: 6px; height: 6px; border-radius: 50%; background: #6b7280; flex-shrink: 0; }
.kyb-item-title { font-size: .85rem; font-weight: 600; color: #f5f0e8; flex: 1; }
.kyb-cat-chip { font-size: .67rem; padding: 1px 7px; border-radius: 8px; font-weight: 600; }
.kyb-status-select { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 3px 7px; font-size: .73rem; color: #f5f0e8; cursor: pointer; outline: none; }
.kyb-item-body { padding: 0 14px 14px; border-top: 1px solid rgba(255,255,255,.05); padding-top: 12px; }
.kyb-item-desc { font-size: .78rem; color: #9090a0; line-height: 1.5; margin-bottom: 10px; }
.kyb-docs { margin-bottom: 10px; }
.kyb-docs-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 5px; }
.kyb-doc-chip { display: inline-block; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); border-radius: 4px; padding: 2px 7px; font-size: .69rem; color: #9090a0; margin: 2px 3px 2px 0; }
.kyb-notes-input { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 6px; padding: 7px 10px; color: #f5f0e8; font-size: .77rem; resize: vertical; min-height: 56px; outline: none; box-sizing: border-box; }
.kyb-notes-input:focus { border-color: #d4a84b; }
.kyb-notes-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 4px; margin-top: 8px; }
.kyb-tooltip { font-size: .72rem; color: #d4a84b; background: rgba(212,168,75,.1); border: 1px solid rgba(212,168,75,.25); border-radius: 5px; padding: 5px 8px; margin-bottom: 8px; }
        `}</style>

        <div className="kyb-header">
          <div className="kyb-title">KYB / Know-Your-Counterparty</div>
          <div className="kyb-sub">Due diligence checklist for cannabis business verification — {KYB_CHECKLIST.length} items across 6 categories</div>
        </div>

        <div className="kyb-entity-row">
          <span className="kyb-entity-label">Counterparty:</span>
          <input
            className="kyb-entity-input"
            placeholder="Enter company name being verified…"
            value={entityName}
            onChange={e => setEntityName(e.target.value)}
          />
        </div>

        <div className="kyb-progress-bar-wrap">
          <div className="kyb-progress-bar" style={{ width: `${totalPct}%`, background: totalPct === 100 ? '#10b981' : totalPct > 50 ? '#d4a84b' : '#6366f1' }} />
        </div>
        <div className="kyb-progress-label">
          {totalPct}% mandatory items complete — {overallComplete} of {KYB_CHECKLIST.length} total
          {flaggedCount > 0 && <span style={{ color: '#ef4444', marginLeft: 10 }}>⚠ {flaggedCount} flagged</span>}
        </div>

        <div className="kyb-filters">
          <button className={`kyb-filter-btn${filterCat === 'all' ? ' active' : ''}`} onClick={() => setFilterCat('all')}>All Categories</button>
          {categories.map(c => (
            <button key={c} className={`kyb-filter-btn${filterCat === c ? ' active' : ''}`} onClick={() => setFilterCat(c)}>
              {KYB_CATEGORY_ICONS[c]} {KYB_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="kyb-filters" style={{ marginBottom: 14 }}>
          <button className={`kyb-filter-btn${filterStatus === 'all' ? ' active' : ''}`} onClick={() => setFilterStatus('all')}>Any Status</button>
          {(['not-started', 'in-progress', 'complete', 'flagged'] as KybStatus[]).map(s => (
            <button key={s} className={`kyb-filter-btn${filterStatus === s ? ' active' : ''}`}
              style={filterStatus === s ? {} : { color: STATUS_COLORS[s] + 'cc' }}
              onClick={() => setFilterStatus(s)}>{STATUS_LABELS[s]}</button>
          ))}
          <span className="kyb-mand-toggle" onClick={() => setShowMandOnly(v => !v)}>
            <span style={{ width: 13, height: 13, border: '1px solid #6b7280', borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem' }}>{showMandOnly ? '✓' : ''}</span>
            Mandatory only
          </span>
        </div>

        {filtered.map(item => {
          const status = (statuses[item.id] ?? 'not-started') as KybStatus
          const isExpanded = expanded === item.id
          return (
            <div key={item.id} className={`kyb-item${status === 'flagged' ? ' flagged' : status === 'complete' ? ' complete' : ''}`}>
              <div className="kyb-item-header" onClick={() => setExpanded(isExpanded ? null : item.id)}>
                <div className={item.mandatory ? 'kyb-mand-dot' : 'kyb-opt-dot'} title={item.mandatory ? 'Mandatory' : 'Optional'} />
                <div className="kyb-item-title">{item.title}</div>
                <span className="kyb-cat-chip" style={{ background: KYB_CATEGORY_COLORS[item.category] + '22', color: KYB_CATEGORY_COLORS[item.category], border: `1px solid ${KYB_CATEGORY_COLORS[item.category]}44` }}>
                  {KYB_CATEGORY_ICONS[item.category]} {KYB_CATEGORY_LABELS[item.category]}
                </span>
                <select
                  className="kyb-status-select"
                  value={status}
                  style={{ color: STATUS_COLORS[status] }}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); setStatus(item.id, e.target.value as KybStatus) }}>
                  {(['not-started', 'in-progress', 'complete', 'flagged'] as KybStatus[]).map(s => (
                    <option key={s} value={s} style={{ color: STATUS_COLORS[s] }}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <span style={{ color: '#6b7280', fontSize: '.8rem', transition: 'transform .2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
              </div>

              {isExpanded && (
                <div className="kyb-item-body">
                  {item.tooltip && <div className="kyb-tooltip">ℹ {item.tooltip}</div>}
                  <div className="kyb-item-desc">{item.description}</div>
                  {item.docsNeeded && item.docsNeeded.length > 0 && (
                    <div className="kyb-docs">
                      <div className="kyb-docs-label">Documents required</div>
                      {item.docsNeeded.map(d => <span key={d} className="kyb-doc-chip">{d}</span>)}
                    </div>
                  )}
                  <div className="kyb-notes-label">Notes / Evidence log</div>
                  <textarea
                    className="kyb-notes-input"
                    placeholder="Record findings, document references, dates…"
                    value={notes[item.id] ?? ''}
                    onChange={e => setNote(item.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Overall progress */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Overall Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: totalPct === 100 ? '#10b981' : '#d4a84b', lineHeight: 1 }}>{totalPct}%</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10 }}>mandatory items complete</div>
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 6, overflow: 'hidden', height: 6, marginBottom: 10 }}>
            <div style={{ height: 6, borderRadius: 6, background: totalPct === 100 ? '#10b981' : totalPct > 50 ? '#d4a84b' : '#6366f1', width: `${totalPct}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: '#8a8a9a' }}>
            <span>{overallComplete} complete</span>
            <span>{flaggedCount > 0 && <span style={{ color: '#ef4444' }}>{flaggedCount} flagged</span>}</span>
            <span>{KYB_CHECKLIST.length - overallComplete} remaining</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>By Category</div>
          {categories.map(c => {
            const { done, total, pct } = kybCategoryProgress(KYB_CHECKLIST, statuses, c)
            return (
              <div key={c} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setFilterCat(filterCat === c ? 'all' : c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '.76rem', color: filterCat === c ? '#d4a84b' : '#b0b0c0' }}>
                    {KYB_CATEGORY_ICONS[c]} {KYB_CATEGORY_LABELS[c]}
                  </span>
                  <span style={{ fontSize: '.74rem', color: '#6b7280' }}>{done}/{total}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden', height: 4 }}>
                  <div style={{ height: 4, borderRadius: 4, background: KYB_CATEGORY_COLORS[c], width: `${pct}%`, transition: 'width .3s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Risk note */}
        {flaggedCount > 0 && (
          <div style={{ background: 'rgba(239,68,68,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(239,68,68,.3)' }}>
            <div style={{ fontSize: '.72rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Risk Flags</div>
            <div style={{ fontSize: '.78rem', color: '#b0b0c0', lineHeight: 1.5 }}>
              {flaggedCount} item{flaggedCount !== 1 ? 's' : ''} flagged. Review flagged items before proceeding with this counterparty. Consider escalating to your compliance officer.
            </div>
          </div>
        )}

        {/* Role priority card */}
        {role && (() => {
          const priorityCats = KYB_ROLE_PRIORITY_CATS[role] ?? []
          if (priorityCats.length === 0) return null
          return (
            <div style={{ background: 'rgba(16,185,129,.05)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.2)' }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, fontWeight: 700 }}>PRIORITY FOR {role.toUpperCase()}S</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(245,240,232,.5)', marginBottom: 10, lineHeight: 1.4 }}>
                Focus these categories first when verifying a {role} counterparty:
              </div>
              {priorityCats.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', gap: 8,
                    padding: '5px 8px', borderRadius: 6, marginBottom: 5, cursor: 'pointer',
                    background: filterCat === cat ? `${KYB_CATEGORY_COLORS[cat]}22` : 'rgba(255,255,255,.03)',
                    border: filterCat === cat ? `1px solid ${KYB_CATEGORY_COLORS[cat]}55` : '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  <span style={{ fontSize: '.75rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ fontSize: '.73rem', color: 'rgba(245,240,232,.7)' }}>{KYB_CATEGORY_ICONS[cat]} {KYB_CATEGORY_LABELS[cat]}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.68rem', color: KYB_CATEGORY_COLORS[cat], fontWeight: 600 }}>
                    {kybCategoryProgress(KYB_CHECKLIST, statuses, cat).done}/{kybCategoryProgress(KYB_CHECKLIST, statuses, cat).total}
                  </span>
                </button>
              ))}
              <button onClick={() => setFilterCat('all')} style={{
                marginTop: 2, width: '100%', padding: '4px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: 'rgba(16,185,129,.1)', color: '#10b981', fontSize: '.71rem', fontWeight: 600,
              }}>Show All Categories</button>
            </div>
          )
        })()}

        {/* Legend */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontSize: '.75rem', color: '#b0b0c0' }}>Red dot = Mandatory item</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} />
            <span style={{ fontSize: '.75rem', color: '#b0b0c0' }}>Grey dot = Optional but recommended</span>
          </div>
        </div>

        {/* Expert Directory CTA */}
        <div style={{ background: 'rgba(16,185,129,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.15)', marginBottom: 8 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Expert Support</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>
            {flaggedCount > 0 ? `${flaggedCount} flagged item${flaggedCount > 1 ? 's' : ''} — get expert guidance on unblocking verification.` : 'Complex verification steps? Connect with a verified compliance or legal expert.'}
          </div>
          <button onClick={() => onPageChange?.('experts')} style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '7px 14px', color: '#10b981', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Find Verified Experts →
          </button>
        </div>

        {/* Export CTA */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Export Report</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Download a PDF due diligence report for your compliance records or to share with your legal team.</div>
          <button onClick={() => window.open('/contact', '_blank')} style={{ background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.4)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Export PDF Report
          </button>
        </div>
      </div>
    </div>
  )
})

// ── Price Intelligence page ────────────────────────────────────────────────────

const PRICE_ROLE_PRODUCTS_MAP: Record<string, string[]> = {
  'Doctor':      ['oil', 'capsule', 'topical'],
  'Pharmacist':  ['oil', 'capsule', 'flower'],
  'Budtender':   ['flower', 'pre-roll', 'edible', 'oil'],
  'Cultivator':  ['flower', 'seeds'],
  'Geneticist':  ['flower', 'seeds'],
  'Processor':   ['oil', 'distillate', 'concentrate', 'wax'],
  'Lab/QA':      ['flower', 'oil', 'concentrate'],
  'Importer':    ['flower', 'oil', 'distillate'],
  'Exporter':    ['flower', 'oil', 'distillate'],
  'Distributor': ['flower', 'oil', 'pre-roll', 'edible'],
  'Clinic Op.':  ['oil', 'capsule', 'topical', 'flower'],
  'Retail':      ['flower', 'pre-roll', 'edible', 'oil', 'topical'],
  'Compliance':  [],
  'Legal':       [],
  'Investor':    ['flower', 'oil', 'distillate'],
  'Regulator':   [],
  'Patient Ed.': ['oil', 'capsule', 'topical', 'flower'],
  'GMP/QA':      ['flower', 'oil', 'concentrate'],
  'Logistics':   ['flower', 'oil'],
}

const PRICE_ROLE_CHANNEL_MAP: Record<string, string> = {
  'Doctor':      'medical-wholesale',
  'Pharmacist':  'medical-wholesale',
  'Budtender':   'wholesale',
  'Cultivator':  'wholesale',
  'Geneticist':  'wholesale',
  'Processor':   'wholesale',
  'Lab/QA':      'wholesale',
  'Importer':    'wholesale',
  'Exporter':    'wholesale',
  'Distributor': 'wholesale',
  'Clinic Op.':  'medical-wholesale',
  'Retail':      'wholesale',
  'Compliance':  '',
  'Legal':       '',
  'Investor':    'wholesale',
  'Regulator':   '',
  'Patient Ed.': 'medical-wholesale',
  'GMP/QA':      'wholesale',
  'Logistics':   'wholesale',
}

// Live, sourced price figures from `market_metrics` (via /api/dashboard/price-references),
// shown as a secondary cross-check against the curated PRICE_BENCHMARKS.
type PriceReference = {
  country_iso2: string
  metric_name:  string
  metric_value: number | string
  metric_unit:  string | null
  source_name:  string | null
  source_url:   string | null
  source_date:  string | null
}

// "Q2 2026" -> last day of that quarter (UTC). Used to decide whether an independent
// reference is dated after the benchmark's own refresh quarter (i.e. genuinely newer).
function benchmarkQuarterEnd(updatedQ: string): Date | null {
  const m = updatedQ.match(/Q([1-4])\s+(\d{4})/)
  if (!m) return null
  const q = parseInt(m[1], 10)
  const year = parseInt(m[2], 10)
  return new Date(Date.UTC(year, q * 3, 0)) // day 0 of month (q*3) = last day of the quarter
}

const PriceIntelligencePage = React.memo(function PriceIntelligencePage({
  country, role, onPageChange,
}: { country: { iso2: string; label: string }; region: string; role: string; onPageChange?: (page: CommandPage) => void }) {
  const [filterProduct,  setFilterProduct]  = useState<string>('all')
  const [filterTier,     setFilterTier]     = useState<string>('all')
  const [filterRegion,   setFilterRegion]   = useState<string>('all')
  const [filterChannel,  setFilterChannel]  = useState<string>('all')
  const [sortBy,         setSortBy]         = useState<'country' | 'price-asc' | 'price-desc' | 'trend' | 'role'>('country')
  const [compareMode,    setCompareMode]    = useState(false)
  const [compareIds,     setCompareIds]     = useState<Set<string>>(new Set())
  const [priceRefs,      setPriceRefs]      = useState<PriceReference[] | null>(null)

  // Load live independent price references once on mount (cross-check vs curated benchmarks).
  useEffect(() => {
    let live = true
    fetch('/api/dashboard/price-references')
      .then(r => r.json())
      .then((d: { references?: PriceReference[] }) => { if (live) setPriceRefs(d.references ?? []) })
      .catch(() => { if (live) setPriceRefs([]) })
    return () => { live = false }
  }, [])

  const roleProducts  = useMemo(() => PRICE_ROLE_PRODUCTS_MAP[role] ?? [], [role])
  const roleChannel   = PRICE_ROLE_CHANNEL_MAP[role] ?? ''

  const filtered = useMemo(() => {
    let list = PRICE_BENCHMARKS.slice()
    if (filterProduct !== 'all') list = list.filter(b => b.product === filterProduct)
    if (filterTier    !== 'all') list = list.filter(b => b.tier    === filterTier)
    if (filterRegion  !== 'all') list = list.filter(b => b.region  === filterRegion)
    if (filterChannel !== 'all') list = list.filter(b => b.channel === filterChannel)
    if (sortBy === 'price-asc')  list.sort((a, b) => a.minPrice - b.minPrice)
    else if (sortBy === 'price-desc') list.sort((a, b) => b.maxPrice - a.maxPrice)
    else if (sortBy === 'trend') list.sort((a, b) => (b.trendPct ?? 0) - (a.trendPct ?? 0))
    else if (sortBy === 'role' && roleProducts.length > 0) {
      list.sort((a, b) => {
        const aRole = roleProducts.includes(a.product) ? 1 : 0
        const bRole = roleProducts.includes(b.product) ? 1 : 0
        if (bRole - aRole !== 0) return bRole - aRole
        if (a.country === country.iso2 && b.country !== country.iso2) return -1
        if (b.country === country.iso2 && a.country !== country.iso2) return  1
        return 0
      })
    } else {
      // default: home country first, then alphabetical
      list.sort((a, b) => {
        if (a.country === country.iso2 && b.country !== country.iso2) return -1
        if (b.country === country.iso2 && a.country !== country.iso2) return  1
        return a.country.localeCompare(b.country)
      })
    }
    return list
  }, [filterProduct, filterTier, filterRegion, filterChannel, sortBy, country, roleProducts])

  const compareItems = useMemo(() => PRICE_BENCHMARKS.filter(b => compareIds.has(b.id)), [compareIds])

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  const trendIcon = (t: string, pct?: number) => {
    if (t === 'up')   return <span style={{ color: '#10b981' }}>▲ {pct ? `+${pct}%` : ''}</span>
    if (t === 'down') return <span style={{ color: '#ef4444' }}>▼ {pct ? `${pct}%` : ''}</span>
    return <span style={{ color: '#6b7280' }}>— {pct ? `${pct}%` : 'stable'}</span>
  }

  const CHANNEL_LABELS: Record<string, string> = {
    'wholesale': 'Wholesale', 'medical-wholesale': 'Medical Wholesale', 'retail': 'Retail'
  }
  const regions = ['Europe', 'Americas', 'Asia-Pacific', 'Africa']
  const products = Object.keys(PRODUCT_TYPE_LABELS) as (keyof typeof PRODUCT_TYPE_LABELS)[]
  const tiers    = Object.keys(TIER_LABELS)    as (keyof typeof TIER_LABELS)[]

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.pi-header { margin-bottom: 16px; }
.pi-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.pi-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.pi-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.pi-filter-btn { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 3px 11px; color: #8a8a9a; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.pi-filter-btn.active { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.pi-filter-btn:hover:not(.active) { color: #f5f0e8; border-color: rgba(255,255,255,.2); }
.pi-sort-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.pi-sort-label { font-size: .73rem; color: #6b7280; }
.pi-sort-select { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 4px 8px; color: #f5f0e8; font-size: .73rem; outline: none; cursor: pointer; }
.pi-compare-toggle { font-size: .73rem; color: #8a8a9a; cursor: pointer; display: flex; align-items: center; gap: 5px; margin-left: auto; }
.pi-compare-toggle.on { color: #d4a84b; }
.pi-results { font-size: .74rem; color: #6b7280; margin-bottom: 10px; }
.pi-table { width: 100%; border-collapse: collapse; }
.pi-th { font-size: .68rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.06); text-align: left; white-space: nowrap; }
.pi-tr { border-bottom: 1px solid rgba(255,255,255,.04); transition: background .12s; cursor: default; }
.pi-tr:hover { background: rgba(255,255,255,.03); }
.pi-tr.selected { background: rgba(212,168,75,.07); }
.pi-td { padding: 9px 8px; font-size: .8rem; vertical-align: middle; }
.pi-flag { font-size: 1.1rem; }
.pi-price { font-weight: 700; color: #f5f0e8; font-size: .82rem; }
.pi-currency { font-size: .68rem; color: #6b7280; margin-left: 3px; }
.pi-tier-chip { font-size: .65rem; padding: 1px 6px; border-radius: 8px; font-weight: 600; }
.pi-prod-chip { font-size: .65rem; padding: 1px 6px; border-radius: 8px; background: rgba(255,255,255,.08); color: #9090a0; }
.pi-trend { font-size: .76rem; font-weight: 600; white-space: nowrap; }
.pi-note { font-size: .72rem; color: #6b7280; max-width: 280px; line-height: 1.4; }
.pi-compare-btn { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 5px; padding: 2px 7px; font-size: .68rem; color: #9090a0; cursor: pointer; }
.pi-compare-btn.selected { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.pi-compare-panel { background: rgba(212,168,75,.06); border: 1px solid rgba(212,168,75,.25); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
.pi-compare-title { font-size: .78rem; font-weight: 600; color: #d4a84b; margin-bottom: 10px; }
.pi-compare-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.pi-compare-card { background: rgba(255,255,255,.05); border-radius: 7px; padding: 10px; }
.pi-compare-card-country { font-size: .72rem; color: #8a8a9a; margin-bottom: 3px; }
.pi-compare-card-price { font-size: 1rem; font-weight: 700; color: #f5f0e8; }
.pi-compare-card-label { font-size: .68rem; color: #6b7280; margin-top: 2px; }
.pi-tr.role-highlight { background: rgba(16,185,129,.04); }
.pi-role-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981; margin-right: 5px; vertical-align: middle; }
        `}</style>

        <div className="pi-header">
          <div className="pi-title">Price Intelligence</div>
          <div className="pi-sub">Wholesale cannabis benchmark prices by jurisdiction, product type, and quality tier — updated {PRICE_BENCHMARKS[0]?.updatedQ}</div>
        </div>

        {compareMode && compareIds.size > 0 && (
          <div className="pi-compare-panel">
            <div className="pi-compare-title">Comparing {compareIds.size} benchmark{compareIds.size !== 1 ? 's' : ''}</div>
            <div className="pi-compare-grid">
              {compareItems.map(b => (
                <div key={b.id} className="pi-compare-card">
                  <div className="pi-compare-card-country">{flagEmoji(b.country)} {b.country} · {TIER_LABELS[b.tier]}</div>
                  <div className="pi-compare-card-price">{b.currency} {b.minPrice.toLocaleString()}–{b.maxPrice.toLocaleString()}</div>
                  <div className="pi-compare-card-label">/{b.unit} · {PRODUCT_TYPE_LABELS[b.product]}</div>
                  <div style={{ marginTop: 4, fontSize: '.7rem' }}>{trendIcon(b.trend, b.trendPct)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="pi-filters">
          <button className={`pi-filter-btn${filterProduct === 'all' ? ' active' : ''}`} onClick={() => setFilterProduct('all')}>All Products</button>
          {products.map(p => (
            <button key={p} className={`pi-filter-btn${filterProduct === p ? ' active' : ''}`} onClick={() => setFilterProduct(p)}>
              {PRODUCT_TYPE_ICONS[p]} {PRODUCT_TYPE_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="pi-filters">
          <button className={`pi-filter-btn${filterTier === 'all' ? ' active' : ''}`} onClick={() => setFilterTier('all')}>All Tiers</button>
          {tiers.map(t => (
            <button key={t} className={`pi-filter-btn${filterTier === t ? ' active' : ''}`} onClick={() => setFilterTier(t)} style={filterTier === t ? {} : { color: TIER_COLORS[t] + 'bb' }}>
              {TIER_LABELS[t]}
            </button>
          ))}
          <button className={`pi-filter-btn${filterRegion === 'all' ? ' active' : ''}`} onClick={() => setFilterRegion('all')}>All Regions</button>
          {regions.map(r => (
            <button key={r} className={`pi-filter-btn${filterRegion === r ? ' active' : ''}`} onClick={() => setFilterRegion(r)}>{r}</button>
          ))}
        </div>
        <div className="pi-filters" style={{ marginBottom: 0 }}>
          <button className={`pi-filter-btn${filterChannel === 'all' ? ' active' : ''}`} onClick={() => setFilterChannel('all')}>All Channels</button>
          {(['wholesale', 'medical-wholesale'] as const).map(c => (
            <button key={c} className={`pi-filter-btn${filterChannel === c ? ' active' : ''}`} onClick={() => setFilterChannel(c)}>{CHANNEL_LABELS[c]}</button>
          ))}
        </div>

        <div className="pi-sort-row">
          <span className="pi-sort-label">Sort:</span>
          <select className="pi-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
            <option value="country">Country</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="trend">Trend (rising first)</option>
            {role && roleProducts.length > 0 && <option value="role">Role Relevance ({role})</option>}
          </select>
          <span className={`pi-compare-toggle${compareMode ? ' on' : ''}`} onClick={() => setCompareMode(v => !v)}>
            ⊞ {compareMode ? `Compare mode (${compareIds.size}/4 selected)` : 'Compare mode'}
          </span>
        </div>

        <div className="pi-results">{filtered.length} price benchmark{filtered.length !== 1 ? 's' : ''}</div>

        <div style={{ overflowX: 'auto' }}>
          <table className="pi-table">
            <thead>
              <tr>
                <th className="pi-th">Market</th>
                <th className="pi-th">Product</th>
                <th className="pi-th">Tier</th>
                <th className="pi-th">Price Range</th>
                <th className="pi-th">Channel</th>
                <th className="pi-th">Trend (QoQ)</th>
                <th className="pi-th">Notes</th>
                {compareMode && <th className="pi-th">Compare</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const isRoleRow = roleProducts.length > 0 && roleProducts.includes(b.product)
                return (
                <tr key={b.id} className={`pi-tr${compareIds.has(b.id) ? ' selected' : ''}${isRoleRow ? ' role-highlight' : ''}`}>
                  <td className="pi-td">
                    <span className="pi-flag">{flagEmoji(b.country)}</span>{' '}
                    <span style={{ fontWeight: 600, color: b.country === country.iso2 ? '#d4a84b' : '#f5f0e8' }}>{b.country}</span>
                  </td>
                  <td className="pi-td">
                    {isRoleRow && <span className="pi-role-dot" title={`Relevant for ${role}s`} />}
                    <span className="pi-prod-chip">{PRODUCT_TYPE_ICONS[b.product]} {PRODUCT_TYPE_LABELS[b.product]}</span>
                  </td>
                  <td className="pi-td">
                    <span className="pi-tier-chip" style={{ background: TIER_COLORS[b.tier] + '22', color: TIER_COLORS[b.tier], border: `1px solid ${TIER_COLORS[b.tier]}44` }}>
                      {TIER_LABELS[b.tier]}
                    </span>
                  </td>
                  <td className="pi-td">
                    <span className="pi-price">{b.minPrice.toLocaleString()}–{b.maxPrice.toLocaleString()}</span>
                    <span className="pi-currency">{b.currency}/{b.unit}</span>
                  </td>
                  <td className="pi-td" style={{ fontSize: '.72rem', color: '#8a8a9a' }}>{CHANNEL_LABELS[b.channel]}</td>
                  <td className="pi-td"><span className="pi-trend">{trendIcon(b.trend, b.trendPct)}</span></td>
                  <td className="pi-td"><div className="pi-note">{b.notes}</div></td>
                  {compareMode && (
                    <td className="pi-td">
                      <button className={`pi-compare-btn${compareIds.has(b.id) ? ' selected' : ''}`} onClick={() => toggleCompare(b.id)}>
                        {compareIds.has(b.id) ? '✓ Added' : '+ Add'}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Role spotlight card */}
        {role && roleProducts.length > 0 && (() => {
          const roleMarketBenchmarks = PRICE_BENCHMARKS.filter(b => roleProducts.includes(b.product) && b.country === country.iso2)
          const roleGlobalCount      = PRICE_BENCHMARKS.filter(b => roleProducts.includes(b.product)).length
          const roleChannelLabel     = roleChannel === 'medical-wholesale' ? 'Medical Wholesale' : roleChannel === 'wholesale' ? 'Wholesale' : 'All'
          return (
            <div style={{ background: 'rgba(16,185,129,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.3)' }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                {role} Price Profile
              </div>
              <div style={{ fontSize: '.74rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>
                Key products for your role in {country?.label || 'your market'} · {roleChannelLabel} channel
              </div>
              {roleMarketBenchmarks.length > 0 ? (
                roleMarketBenchmarks.slice(0, 3).map(b => (
                  <div key={b.id} style={{ marginBottom: 8, padding: '6px 8px', background: 'rgba(255,255,255,.04)', borderRadius: 6 }}>
                    <div style={{ fontSize: '.72rem', color: '#8a8a9a', marginBottom: 2 }}>{PRODUCT_TYPE_ICONS[b.product]} {PRODUCT_TYPE_LABELS[b.product]} · {TIER_LABELS[b.tier]}</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#10b981' }}>{b.currency} {b.minPrice.toLocaleString()}–{b.maxPrice.toLocaleString()}<span style={{ fontSize: '.68rem', fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>/{b.unit}</span></div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '.76rem', color: '#6b7280', fontStyle: 'italic', marginBottom: 8 }}>
                  No benchmarks yet for {country.label}. {roleGlobalCount} global benchmarks available.
                </div>
              )}
              <button
                style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '5px 10px', color: '#10b981', fontSize: '.73rem', cursor: 'pointer', width: '100%', marginTop: 4 }}
                onClick={() => setSortBy(sortBy === 'role' ? 'country' : 'role')}
              >
                {sortBy === 'role' ? '✓ Sorted by Role' : `Sort by ${role} Relevance`}
              </button>
            </div>
          )
        })()}

        {/* Independent price references — live cross-check vs curated benchmarks */}
        {(() => {
          if (!priceRefs || priceRefs.length === 0) return null
          const benchCountries = new Set(PRICE_BENCHMARKS.map(b => b.country))
          const benchQuarter   = new Map(PRICE_BENCHMARKS.map(b => [b.country, b.updatedQ]))
          const shown = priceRefs
            .filter(r => benchCountries.has(r.country_iso2))
            .sort((a, b) =>
              a.country_iso2 === country.iso2 ? -1
              : b.country_iso2 === country.iso2 ? 1
              : a.country_iso2.localeCompare(b.country_iso2))
          if (shown.length === 0) return null
          return (
            <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Independent References</div>
              <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: 10, lineHeight: 1.5 }}>
                Live sourced figures from market monitoring — a secondary cross-check on the curated wholesale benchmarks, not a replacement (often a different channel, e.g. pharmacy/retail).
              </div>
              {shown.map((r, i) => {
                const qEnd    = benchmarkQuarterEnd(benchQuarter.get(r.country_iso2) ?? '')
                const isNewer = !!(r.source_date && qEnd && new Date(r.source_date) > qEnd)
                return (
                  <div key={`${r.country_iso2}-${i}`} style={{ marginBottom: 8, padding: '7px 9px', background: 'rgba(255,255,255,.03)', borderRadius: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '.9rem' }}>{flagEmoji(r.country_iso2)}</span>
                      <span style={{ fontSize: '.72rem', color: '#b0b0c0', fontWeight: 600 }}>{r.country_iso2}</span>
                      {isNewer && (
                        <span title="Source dated after the current benchmark quarter"
                          style={{ fontSize: '.58rem', padding: '1px 6px', borderRadius: 8, background: 'rgba(212,168,75,.18)', color: '#d4a84b', fontWeight: 700, letterSpacing: '.04em' }}>
                          NEWER
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '.82rem', color: '#f5f0e8', fontWeight: 700 }}>
                      {Number(r.metric_value).toLocaleString()}
                      <span style={{ fontSize: '.66rem', color: '#6b7280', fontWeight: 400, marginLeft: 4 }}>{r.metric_unit}</span>
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#8a8a9a', marginTop: 1 }}>{r.metric_name}</div>
                    <div style={{ fontSize: '.64rem', color: '#6b7280', marginTop: 3 }}>
                      {r.source_url
                        ? <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#8a8a9a', textDecoration: 'underline' }}>{r.source_name}</a>
                        : r.source_name}
                      {r.source_date ? ` · ${r.source_date}` : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Coverage */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Coverage</div>
          {([
            ['Total Benchmarks', PRICE_BENCHMARKS.length],
            ['Markets Covered', new Set(PRICE_BENCHMARKS.map(b => b.country)).size],
            ['Product Types', new Set(PRICE_BENCHMARKS.map(b => b.product)).size],
            ['Trending Up', PRICE_BENCHMARKS.filter(b => b.trend === 'up').length],
            ['Trending Down', PRICE_BENCHMARKS.filter(b => b.trend === 'down').length],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
              <span style={{ fontSize: '.88rem', fontWeight: 700, color: '#d4a84b' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Trend summary */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Market Trend — Q2 2026</div>
          <div style={{ fontSize: '.78rem', color: '#b0b0c0', lineHeight: 1.6 }}>
            Global cannabis wholesale prices continue their multi-year compression in most markets. Germany (−8–12%), Israel (−18–25%), and Thailand (−22%) are experiencing the sharpest declines as supply outpaces demand.
            <br /><br />
            South Africa (+8–12%) and Colombia (+6%) are counter-trend — rising on growing EU export demand and competitive cost structures.
          </div>
        </div>

        {/* Methodology */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Methodology</div>
          <div style={{ fontSize: '.74rem', color: '#8a8a9a', lineHeight: 1.55 }}>
            Benchmarks are compiled from Harbourview network transactions, operator surveys, published exchange data, and regulatory filings. Prices represent indicative wholesale ranges — actual transaction prices will vary by volume, specification, incoterms, and counterparty relationship.
          </div>
        </div>

        {/* Submit CTA */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Contribute Pricing Data</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10 }}>Share anonymised transaction data to improve benchmark accuracy for your market.</div>
          <button onClick={() => window.open('/intake', '_blank')} style={{ background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.4)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Submit Price Data
          </button>
        </div>

        {/* Cross-page navigation */}
        <div style={{ background: 'rgba(16,185,129,.06)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.2)' }}>
          <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Model Your Trade Economics</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>
            Use benchmarks to model total landed cost across a trade corridor — including freight, duties, permits, and FX.
          </div>
          <button style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '7px 14px', color: '#10b981', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('trade-calc')}>
            Open Landed Cost Calculator →
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Live Market Listings</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Compare benchmarks against actual available product listings, specs, and ask prices in the marketplace.</div>
          <button style={{ background: 'rgba(212,168,75,.1)', border: '1px solid rgba(212,168,75,.25)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('marketplace')}>
            Open Marketplace →
          </button>
        </div>
      </div>
    </div>
  )
})

// ── Logistics Directory page ───────────────────────────────────────────────────

const LOGISTICS_SPECIALTY_LABELS: Record<string, string> = {
  'controlled-substance': 'Controlled Substance',
  'gdp-compliant':        'GDP Compliant',
  'eu-import':            'EU Import Specialist',
  'pharma-grade':         'Pharma-Grade Handling',
  'air-freight':          'Air Freight',
  'sea-freight':          'Sea Freight',
  'road-freight':         'Road Freight',
}

const LOGISTICS_ROLE_TYPES_MAP: Record<string, LogisticsType[]> = {
  'Doctor':      ['cold-chain', 'courier'],
  'Pharmacist':  ['cold-chain', 'courier'],
  'Budtender':   ['courier'],
  'Cultivator':  ['cold-chain', 'courier', '3pl'],
  'Geneticist':  ['courier', 'cold-chain'],
  'Processor':   ['cold-chain', '3pl', 'courier'],
  'Lab/QA':      ['cold-chain', 'courier'],
  'Importer':    ['freight-forwarder', 'customs-broker', 'cold-chain', 'armoured'],
  'Exporter':    ['freight-forwarder', 'customs-broker', 'cold-chain', 'armoured'],
  'Distributor': ['freight-forwarder', 'cold-chain', '3pl', 'courier'],
  'Clinic Op.':  ['cold-chain', 'courier'],
  'Retail':      ['courier', 'cold-chain', '3pl'],
  'Compliance':  ['customs-broker'],
  'Legal':       ['customs-broker'],
  'Investor':    ['freight-forwarder', '3pl'],
  'Regulator':   ['customs-broker', 'armoured'],
  'Patient Ed.': ['courier', 'cold-chain'],
  'GMP/QA':      ['cold-chain', 'customs-broker'],
  'Logistics':   ['freight-forwarder', 'customs-broker', 'cold-chain', '3pl', 'courier', 'armoured'],
}

const LogisticsDirectoryPage = React.memo(function LogisticsDirectoryPage({
  country, role, onPageChange,
}: { country: { iso2: string; label: string }; region: string; role: string; onPageChange?: (page: CommandPage) => void }) {
  const [search,        setSearch]        = useState('')
  const [filterType,    setFilterType]    = useState<LogisticsType | 'all'>('all')
  const [filterRegion,  setFilterRegion]  = useState<string>('all')
  const [filterMyRole,  setFilterMyRole]  = useState(false)
  const [expanded,      setExpanded]      = useState<string | null>(null)

  const roleTypes = useMemo<LogisticsType[]>(() => LOGISTICS_ROLE_TYPES_MAP[role] ?? [], [role])

  const filtered = useMemo(() => {
    const ql = search.toLowerCase()
    return LOGISTICS_PROVIDERS
      .filter(p => {
        if (filterType   !== 'all' && p.type   !== filterType)   return false
        if (filterRegion !== 'all' && !p.regions.includes(filterRegion)) return false
        if (filterMyRole && roleTypes.length > 0 && !roleTypes.includes(p.type)) return false
        if (search && !p.name.toLowerCase().includes(ql) && !p.description.toLowerCase().includes(ql)) return false
        return true
      })
      .sort((a, b) => {
        const aRole = roleTypes.includes(a.type)
        const bRole = roleTypes.includes(b.type)
        if (aRole && !bRole) return -1
        if (bRole && !aRole) return 1
        if (a.featured && !b.featured) return -1
        if (b.featured && !a.featured) return 1
        return 0
      })
  }, [search, filterType, filterRegion, filterMyRole, roleTypes])

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const p of LOGISTICS_PROVIDERS) m[p.type] = (m[p.type] ?? 0) + 1
    return m
  }, [])

  const types    = Object.keys(LOGISTICS_TYPE_LABELS) as LogisticsType[]
  const regions  = ['Europe', 'Americas', 'Asia-Pacific', 'Africa']

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.log-header { margin-bottom: 16px; }
.log-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.log-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.log-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.log-search { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 7px 12px; color: #f5f0e8; font-size: .82rem; width: 200px; outline: none; }
.log-search:focus { border-color: #d4a84b; }
.log-filter-btn { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 3px 11px; color: #8a8a9a; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.log-filter-btn.active { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.log-filter-btn:hover:not(.active) { color: #f5f0e8; border-color: rgba(255,255,255,.2); }
.log-results { font-size: .74rem; color: #6b7280; margin-bottom: 10px; }
.log-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; margin-bottom: 10px; overflow: hidden; transition: border-color .15s; }
.log-card:hover { border-color: rgba(212,168,75,.3); }
.log-card-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; }
.log-card-name { font-size: .9rem; font-weight: 600; color: #f5f0e8; flex: 1; }
.log-type-chip { font-size: .68rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.log-featured-badge { font-size: .62rem; padding: 1px 6px; background: rgba(212,168,75,.2); border: 1px solid rgba(212,168,75,.4); border-radius: 8px; color: #d4a84b; font-weight: 700; margin-left: 4px; }
.log-card-body { padding: 0 14px 14px; border-top: 1px solid rgba(255,255,255,.05); padding-top: 12px; }
.log-desc { font-size: .8rem; color: #b0b0c0; line-height: 1.5; margin-bottom: 10px; }
.log-spec-row { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
.log-spec-chip { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 4px; padding: 2px 7px; font-size: .68rem; color: #9090a0; }
.log-flags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }
.log-cta-row { display: flex; gap: 8px; }
.log-visit-btn { background: rgba(212,168,75,.15); border: 1px solid rgba(212,168,75,.4); border-radius: 6px; padding: 5px 12px; color: #d4a84b; font-size: .76rem; font-weight: 600; cursor: pointer; text-decoration: none; }
.log-enquire-btn { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 5px 12px; color: #d0cfc8; font-size: .76rem; cursor: pointer; }
.log-card.role-match { border-left: 3px solid #10b981; }
.log-role-match-badge { font-size: .62rem; padding: 1px 6px; background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.35); border-radius: 8px; color: #10b981; font-weight: 700; margin-left: 4px; }
.log-my-role-btn { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.3); border-radius: 20px; padding: 3px 11px; color: #10b981; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.log-my-role-btn.active { background: rgba(16,185,129,.22); border-color: #10b981; font-weight: 600; }
        `}</style>

        <div className="log-header">
          <div className="log-title">Logistics &amp; Shipping Directory</div>
          <div className="log-sub">Cannabis freight forwarders, customs brokers, cold-chain specialists, and armoured transport</div>
        </div>

        <div className="log-filters">
          <input className="log-search" placeholder="Search providers…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className={`log-filter-btn${filterType === 'all' ? ' active' : ''}`} onClick={() => setFilterType('all')}>All Types</button>
          {types.map(t => (
            <button key={t} className={`log-filter-btn${filterType === t ? ' active' : ''}`} onClick={() => setFilterType(t)}>
              {LOGISTICS_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="log-filters" style={{ marginBottom: 12 }}>
          <button className={`log-filter-btn${filterRegion === 'all' ? ' active' : ''}`} onClick={() => setFilterRegion('all')}>All Regions</button>
          {regions.map(r => (
            <button key={r} className={`log-filter-btn${filterRegion === r ? ' active' : ''}`} onClick={() => setFilterRegion(r)}>{r}</button>
          ))}
          {role && roleTypes.length > 0 && (
            <button
              className={`log-my-role-btn${filterMyRole ? ' active' : ''}`}
              onClick={() => { setFilterMyRole(v => !v); setFilterType('all') }}
            >
              ◎ For {role}s ({LOGISTICS_PROVIDERS.filter(p => roleTypes.includes(p.type)).length})
            </button>
          )}
        </div>

        <div className="log-results">{filtered.length} provider{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.map(p => {
          const isRoleMatch = roleTypes.includes(p.type)
          return (
          <div key={p.id} className={`log-card${isRoleMatch ? ' role-match' : ''}`}>
            <div className="log-card-header" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div style={{ flex: 1 }}>
                <div className="log-card-name">
                  {p.name}
                  {p.featured && <span className="log-featured-badge">FEATURED</span>}
                  {isRoleMatch && role && <span className="log-role-match-badge">✓ {role}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="log-type-chip" style={{ background: LOGISTICS_TYPE_COLORS[p.type] + '28', color: LOGISTICS_TYPE_COLORS[p.type], border: `1px solid ${LOGISTICS_TYPE_COLORS[p.type]}55` }}>
                    {LOGISTICS_TYPE_LABELS[p.type]}
                  </span>
                  {p.countries.slice(0, 6).map(c => (
                    <span key={c} style={{ fontSize: '1rem' }}>{flagEmoji(c)}</span>
                  ))}
                  {p.countries.length > 6 && <span style={{ fontSize: '.72rem', color: '#6b7280' }}>+{p.countries.length - 6}</span>}
                </div>
              </div>
              <span style={{ color: '#6b7280', fontSize: '.8rem', transition: 'transform .2s', transform: expanded === p.id ? 'rotate(90deg)' : 'none' }}>▶</span>
            </div>

            {expanded === p.id && (
              <div className="log-card-body">
                <p className="log-desc">{p.description}</p>
                <div style={{ fontSize: '.74rem', color: '#8a8a9a', marginBottom: 5 }}>Specialities</div>
                <div className="log-spec-row">
                  {p.specialties.map(s => <span key={s} className="log-spec-chip">{LOGISTICS_SPECIALTY_LABELS[s] ?? s}</span>)}
                </div>
                <div style={{ fontSize: '.74rem', color: '#8a8a9a', marginBottom: 6 }}>Countries served</div>
                <div className="log-flags">
                  {p.countries.map(c => <span key={c} title={c} style={{ fontSize: '1.05rem' }}>{flagEmoji(c)}</span>)}
                </div>
                <div className="log-cta-row">
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="log-visit-btn">Visit Website →</a>}
                  <button className="log-enquire-btn">Request Quote</button>
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* For Your Role card */}
        {role && roleTypes.length > 0 && (() => {
          const roleMatchTotal   = LOGISTICS_PROVIDERS.filter(p => roleTypes.includes(p.type)).length
          const roleMatchCountry = LOGISTICS_PROVIDERS.filter(p => roleTypes.includes(p.type) && p.countries.includes(country.iso2)).length
          const roleMatchGdp     = LOGISTICS_PROVIDERS.filter(p => roleTypes.includes(p.type) && p.specialties.includes('gdp-compliant')).length
          return (
            <div style={{ background: 'rgba(16,185,129,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.3)' }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>For {role}s</div>
              <div style={{ fontSize: '.76rem', color: '#b0b0c0', marginBottom: 10, lineHeight: 1.5 }}>
                Logistics providers matched to your role&apos;s typical shipping profile.
              </div>
              {([
                ['Matched Providers', roleMatchTotal],
                ['Serving Your Market', roleMatchCountry],
                ['GDP-Compliant', roleMatchGdp],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
                  <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#10b981' }}>{val}</span>
                </div>
              ))}
              <button
                className={`log-my-role-btn${filterMyRole ? ' active' : ''}`}
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => { setFilterMyRole(v => !v); setFilterType('all') }}
              >
                {filterMyRole ? '✓ Showing Your Providers' : `Show ${roleMatchTotal} ${role} Providers`}
              </button>
            </div>
          )
        })()}

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Directory Stats</div>
          {([
            ['Total Providers', LOGISTICS_PROVIDERS.length],
            ['GDP Compliant', LOGISTICS_PROVIDERS.filter(p => p.specialties.includes('gdp-compliant')).length],
            ['Controlled Substance', LOGISTICS_PROVIDERS.filter(p => p.specialties.includes('controlled-substance')).length],
            ['Regions Covered', new Set(LOGISTICS_PROVIDERS.flatMap(p => p.regions)).size],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
              <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#d4a84b' }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>By Type</div>
          {types.filter(t => (typeCounts[t] ?? 0) > 0).map(t => (
            <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}
              onClick={() => setFilterType(filterType === t ? 'all' : t)}>
              <span style={{ fontSize: '.78rem', color: filterType === t ? '#d4a84b' : '#b0b0c0' }}>{LOGISTICS_TYPE_LABELS[t]}</span>
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: LOGISTICS_TYPE_COLORS[t] }}>{typeCounts[t]}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(212,168,75,.07)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(212,168,75,.2)' }}>
          <div style={{ fontSize: '.72rem', color: '#d4a84b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Key Requirement</div>
          <div style={{ fontSize: '.78rem', color: '#b0b0c0', lineHeight: 1.5 }}>
            All cannabis cross-border shipments require a transaction-specific import permit from the destination country AND an export authorisation from the origin country. GDP-compliance and cold-chain documentation are mandatory for EU medical imports.
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Know a provider?</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10 }}>Submit cannabis-experienced logistics providers to help the industry navigate controlled-substance shipping.</div>
          <button style={{ background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.4)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>Submit a Provider</button>
        </div>

        <div style={{ background: 'rgba(16,185,129,.06)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.2)' }}>
          <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Corridor Economics</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Model freight costs, duties, permit fees, and total landed cost across your target trade corridor.</div>
          <button style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '7px 14px', color: '#10b981', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('trade-calc')}>
            Open Landed Cost Calculator →
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Permit Requirements</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Review the import/export permit chain and narcotics documentation required for each trade corridor.</div>
          <button style={{ background: 'rgba(212,168,75,.1)', border: '1px solid rgba(212,168,75,.25)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('access-pathway')}>
            Open Access Pathway →
          </button>
        </div>
      </div>
    </div>
  )
})

// ── Jobs Board page ────────────────────────────────────────────────────────────

const ROLE_SECTORS_MAP: Record<string, JobSector[]> = {
  'Doctor':      ['medical'],
  'Pharmacist':  ['medical'],
  'Budtender':   ['sales'],
  'Cultivator':  ['cultivation', 'research'],
  'Geneticist':  ['research', 'cultivation'],
  'Processor':   ['manufacturing'],
  'Lab/QA':      ['manufacturing', 'research'],
  'Importer':    ['logistics', 'regulatory'],
  'Exporter':    ['logistics', 'regulatory', 'sales'],
  'Distributor': ['logistics', 'sales'],
  'Clinic Op.':  ['medical', 'executive'],
  'Retail':      ['sales', 'executive'],
  'Compliance':  ['regulatory', 'legal'],
  'Legal':       ['legal', 'regulatory'],
  'Investor':    ['finance', 'executive'],
  'Regulator':   ['regulatory'],
  'Patient Ed.': ['medical'],
  'GMP/QA':      ['manufacturing', 'regulatory'],
  'Logistics':   ['logistics'],
}

const JobsBoardPage = React.memo(function JobsBoardPage({
  country, role, onPageChange,
}: { country: { iso2: string; label: string }; region: string; role: string; onPageChange?: (page: CommandPage) => void }) {
  const [search,        setSearch]        = useState('')
  const [filterSector,  setFilterSector]  = useState<JobSector | 'all'>('all')
  const [filterType,    setFilterType]    = useState<JobType | 'all'>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [filterRemote,  setFilterRemote]  = useState(false)
  const [filterMyRole,  setFilterMyRole]  = useState(false)
  const [expanded,      setExpanded]      = useState<string | null>(null)

  const roleSectors = useMemo<JobSector[]>(() => ROLE_SECTORS_MAP[role] ?? [], [role])

  const filtered = useMemo(() => {
    const ql = search.toLowerCase()
    return JOB_LISTINGS.filter(j => {
      if (filterMyRole && roleSectors.length > 0 && !roleSectors.includes(j.sector)) return false
      if (filterSector  !== 'all' && j.sector  !== filterSector)  return false
      if (filterType    !== 'all' && j.type    !== filterType)    return false
      if (filterCountry !== 'all' && j.country !== filterCountry) return false
      if (filterRemote  && !j.remote) return false
      if (search && !j.title.toLowerCase().includes(ql) &&
          !j.company.toLowerCase().includes(ql) &&
          !j.description.toLowerCase().includes(ql)) return false
      return true
    }).sort((a, b) => {
      const aRole = roleSectors.includes(a.sector)
      const bRole = roleSectors.includes(b.sector)
      if (aRole && !bRole) return -1
      if (bRole && !aRole) return  1
      if (a.featured && !b.featured) return -1
      if (b.featured && !a.featured) return  1
      if (country && a.country === country.iso2 && b.country !== country.iso2) return -1
      if (country && b.country === country.iso2 && a.country !== country.iso2) return  1
      return b.posted.localeCompare(a.posted)
    })
  }, [search, filterSector, filterType, filterCountry, filterRemote, filterMyRole, roleSectors, country])

  const sectorCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const j of JOB_LISTINGS) m[j.sector] = (m[j.sector] ?? 0) + 1
    return m
  }, [])

  const countries = useMemo(() => [...new Set(JOB_LISTINGS.map(j => j.country))].sort(), [])
  const sectors   = Object.keys(JOB_SECTOR_LABELS) as JobSector[]
  const types     = Object.keys(JOB_TYPE_LABELS)   as JobType[]

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.jb-header { margin-bottom: 16px; }
.jb-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.jb-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.jb-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.jb-search { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 7px 12px; color: #f5f0e8; font-size: .82rem; width: 220px; outline: none; }
.jb-search:focus { border-color: #d4a84b; }
.jb-filter-btn { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 3px 11px; color: #8a8a9a; font-size: .73rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.jb-filter-btn.active { background: rgba(212,168,75,.18); border-color: #d4a84b; color: #d4a84b; }
.jb-filter-btn:hover:not(.active) { color: #f5f0e8; border-color: rgba(255,255,255,.2); }
.jb-remote-toggle { font-size: .73rem; color: #8a8a9a; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.jb-remote-toggle.on { color: #10b981; }
.jb-results { font-size: .74rem; color: #6b7280; margin-bottom: 10px; }
.jb-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; margin-bottom: 10px; overflow: hidden; transition: border-color .15s; }
.jb-card:hover { border-color: rgba(212,168,75,.3); }
.jb-card.featured { border-color: rgba(212,168,75,.25); background: rgba(212,168,75,.04); }
.jb-card.role-match { border-left: 3px solid #10b981; }
.jb-role-match-badge { font-size: .62rem; padding: 1px 6px; background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.35); border-radius: 8px; color: #10b981; font-weight: 700; }
.jb-my-role-btn { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.35); border-radius: 20px; padding: 3px 11px; color: #10b981; font-size: .73rem; cursor: pointer; white-space: nowrap; font-weight: 600; transition: all .15s; }
.jb-my-role-btn.active { background: rgba(16,185,129,.25); border-color: #10b981; }
.jb-card-header { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; cursor: pointer; }
.jb-card-main { flex: 1; }
.jb-card-title { font-size: .92rem; font-weight: 700; color: #f5f0e8; margin-bottom: 3px; }
.jb-card-company { font-size: .8rem; color: #8a8a9a; margin-bottom: 5px; }
.jb-card-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.jb-type-chip { font-size: .66rem; padding: 2px 7px; border-radius: 8px; font-weight: 600; }
.jb-sector-chip { font-size: .66rem; padding: 2px 7px; border-radius: 8px; background: rgba(255,255,255,.08); color: #9090a0; }
.jb-salary { font-size: .76rem; color: '#d4a84b'; font-weight: 600; }
.jb-remote-badge { font-size: .64rem; padding: 1px 6px; background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.35); border-radius: 8px; color: #10b981; font-weight: 600; }
.jb-featured-badge { font-size: .62rem; padding: 1px 6px; background: rgba(212,168,75,.2); border: 1px solid rgba(212,168,75,.4); border-radius: 8px; color: #d4a84b; font-weight: 700; }
.jb-card-body { padding: 0 14px 14px; border-top: 1px solid rgba(255,255,255,.05); padding-top: 12px; }
.jb-desc { font-size: .8rem; color: #b0b0c0; line-height: 1.5; margin-bottom: 10px; }
.jb-req-label { font-size: .72rem; color: '#8a8a9a'; margin-bottom: 5px; }
.jb-req-list { list-style: none; padding: 0; margin: 0 0 12px; }
.jb-req-item { font-size: .76rem; color: #9090a0; padding: 2px 0 2px 12px; position: relative; }
.jb-req-item::before { content: '·'; position: absolute; left: 0; color: #d4a84b; }
.jb-dates { font-size: .72rem; color: #6b7280; margin-bottom: 10px; }
.jb-cta-row { display: flex; gap: 8px; }
.jb-apply-btn { background: rgba(212,168,75,.15); border: 1px solid rgba(212,168,75,.4); border-radius: 6px; padding: 6px 14px; color: #d4a84b; font-size: .78rem; font-weight: 600; cursor: pointer; }
.jb-save-btn { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 6px 12px; color: #9090a0; font-size: .78rem; cursor: pointer; }
        `}</style>

        <div className="jb-header">
          <div className="jb-title">Cannabis Industry Jobs Board</div>
          <div className="jb-sub">{JOB_LISTINGS.length} live roles across {new Set(JOB_LISTINGS.map(j => j.country)).size} countries — updated weekly</div>
        </div>

        <div className="jb-filters">
          <input className="jb-search" placeholder="Search roles, companies…" value={search} onChange={e => setSearch(e.target.value)} />
          {role && roleSectors.length > 0 && (
            <button
              className={`jb-my-role-btn${filterMyRole ? ' active' : ''}`}
              onClick={() => { setFilterMyRole(v => !v); setFilterSector('all') }}
            >
              ◎ For {role}s ({JOB_LISTINGS.filter(j => roleSectors.includes(j.sector)).length})
            </button>
          )}
          <span className={`jb-remote-toggle${filterRemote ? ' on' : ''}`} onClick={() => setFilterRemote(v => !v)}>
            <span style={{ width: 13, height: 13, border: '1px solid', borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', borderColor: filterRemote ? '#10b981' : '#6b7280' }}>{filterRemote ? '✓' : ''}</span>
            Remote only
          </span>
        </div>

        <div className="jb-filters">
          <button className={`jb-filter-btn${filterSector === 'all' ? ' active' : ''}`} onClick={() => setFilterSector('all')}>All Sectors</button>
          {sectors.filter(s => (sectorCounts[s] ?? 0) > 0).map(s => (
            <button key={s} className={`jb-filter-btn${filterSector === s ? ' active' : ''}`} onClick={() => setFilterSector(s)}>
              {JOB_SECTOR_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="jb-filters" style={{ marginBottom: 12 }}>
          <button className={`jb-filter-btn${filterType === 'all' ? ' active' : ''}`} onClick={() => setFilterType('all')}>Any Type</button>
          {types.map(t => (
            <button key={t} className={`jb-filter-btn${filterType === t ? ' active' : ''}`} onClick={() => setFilterType(t)} style={filterType === t ? {} : { color: JOB_TYPE_COLORS[t] + 'cc' }}>
              {JOB_TYPE_LABELS[t]}
            </button>
          ))}
          <button className={`jb-filter-btn${filterCountry === 'all' ? ' active' : ''}`} onClick={() => setFilterCountry('all')}>All Countries</button>
          {countries.map(c => (
            <button key={c} className={`jb-filter-btn${filterCountry === c ? ' active' : ''}`} onClick={() => setFilterCountry(c)}>
              {flagEmoji(c)} {c}
            </button>
          ))}
        </div>

        <div className="jb-results">{filtered.length} role{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.map(j => {
          const isRoleMatch = roleSectors.includes(j.sector)
          return (
          <div key={j.id} className={`jb-card${j.featured ? ' featured' : ''}${isRoleMatch ? ' role-match' : ''}`}>
            <div className="jb-card-header" onClick={() => setExpanded(expanded === j.id ? null : j.id)}>
              <div className="jb-card-main">
                <div className="jb-card-title">{j.title}</div>
                <div className="jb-card-company">{j.company} · {flagEmoji(j.country)} {j.city}</div>
                <div className="jb-card-meta">
                  <span className="jb-type-chip" style={{ background: JOB_TYPE_COLORS[j.type] + '28', color: JOB_TYPE_COLORS[j.type], border: `1px solid ${JOB_TYPE_COLORS[j.type]}44` }}>{JOB_TYPE_LABELS[j.type]}</span>
                  <span className="jb-sector-chip">{JOB_SECTOR_LABELS[j.sector]}</span>
                  {j.salary && <span className="jb-salary" style={{ color: '#d4a84b', fontSize: '.74rem', fontWeight: 600 }}>{j.salary}</span>}
                  {j.remote  && <span className="jb-remote-badge">REMOTE</span>}
                  {j.featured && <span className="jb-featured-badge">FEATURED</span>}
                  {isRoleMatch && role && <span className="jb-role-match-badge">✓ {role}</span>}
                </div>
              </div>
              <span style={{ color: '#6b7280', fontSize: '.8rem', transition: 'transform .2s', transform: expanded === j.id ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</span>
            </div>

            {expanded === j.id && (
              <div className="jb-card-body">
                <p className="jb-desc">{j.description}</p>
                <div style={{ fontSize: '.72rem', color: '#8a8a9a', marginBottom: 5 }}>Key Requirements</div>
                <ul className="jb-req-list">
                  {j.requirements.map(r => <li key={r} className="jb-req-item">{r}</li>)}
                </ul>
                <div className="jb-dates">
                  Posted: {j.posted}{j.closes ? ` · Closes: ${j.closes}` : ''}
                </div>
                <div className="jb-cta-row">
                  <button className="jb-apply-btn">Apply Now →</button>
                  <button className="jb-save-btn">Save Role</button>
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* For Your Role card — shown only when a role is detected */}
        {role && roleSectors.length > 0 && (() => {
          const roleMatchCount = JOB_LISTINGS.filter(j => roleSectors.includes(j.sector)).length
          const roleMatchCountry = JOB_LISTINGS.filter(j => roleSectors.includes(j.sector) && j.country === country.iso2).length
          return (
            <div style={{ background: 'rgba(16,185,129,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.3)' }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>For {role}s</div>
              <div style={{ fontSize: '.78rem', color: '#b0b0c0', marginBottom: 10, lineHeight: 1.5 }}>
                Roles matched to your professional profile across all markets.
              </div>
              {([
                ['Matching Roles', roleMatchCount],
                ['In Your Market', roleMatchCountry],
                ['Remote Options', JOB_LISTINGS.filter(j => roleSectors.includes(j.sector) && j.remote).length],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
                  <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#10b981' }}>{val}</span>
                </div>
              ))}
              <button
                className={`jb-my-role-btn${filterMyRole ? ' active' : ''}`}
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => { setFilterMyRole(v => !v); setFilterSector('all') }}
              >
                {filterMyRole ? '✓ Showing Your Roles' : `Show ${roleMatchCount} ${role} Roles`}
              </button>
            </div>
          )
        })()}

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Board Stats</div>
          {([
            ['Live Roles', JOB_LISTINGS.length],
            ['Countries', new Set(JOB_LISTINGS.map(j => j.country)).size],
            ['Remote Roles', JOB_LISTINGS.filter(j => j.remote).length],
            ['Featured Roles', JOB_LISTINGS.filter(j => j.featured).length],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.78rem', color: '#b0b0c0' }}>{label}</span>
              <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#d4a84b' }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>By Sector</div>
          {sectors.filter(s => (sectorCounts[s] ?? 0) > 0).map(s => (
            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}
              onClick={() => setFilterSector(filterSector === s ? 'all' : s)}>
              <span style={{ fontSize: '.76rem', color: filterSector === s ? '#d4a84b' : '#b0b0c0' }}>{JOB_SECTOR_LABELS[s]}</span>
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#f5f0e8' }}>{sectorCounts[s]}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 6 }}>Post a Role</div>
          <div style={{ fontSize: '.76rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Reach cannabis professionals across 20 role profiles in 191 jurisdictions. Featured listings appear first and are highlighted to relevant roles.</div>
          <button style={{ background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.4)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>Post a Job</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 8, padding: '9px 14px', color: '#10b981', fontSize: '.76rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => onPageChange?.('experts')}>
            ⊛ Find Verified Experts →
          </button>
          <button style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '9px 14px', color: 'rgba(245,240,232,.55)', fontSize: '.76rem', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => onPageChange?.('events')}>
            ◷ Industry Events →
          </button>
        </div>
      </div>
    </div>
  )
})

// ── Insurance Directory page ──────────────────────────────────────────────────

function InsCard({ p, homeCountry }: { p: InsuranceProvider; homeCountry: string }) {
  const isLocal = p.countries.includes(homeCountry)
  const roleRgba: Record<InsuranceProviderRole, string> = {
    'mga':          'rgba(99,102,241',
    'carrier':      'rgba(16,185,129',
    'broker':       'rgba(212,168,75',
    'lloyd':        'rgba(139,92,246',
    'program-admin':'rgba(6,182,212',
  }
  return (
    <div className={`ins-card${p.featured ? ' ins-featured' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#f5f0e8' }}>
          {p.name}
          {isLocal && <span style={{ fontSize: '.64rem', color: '#d4a84b', marginLeft: 6 }}>★ Your Market</span>}
        </div>
        {p.featured && <span style={{ fontSize: '.62rem', color: '#d4a84b', background: 'rgba(212,168,75,.12)', borderRadius: 4, padding: '2px 7px', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>FEATURED</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
        <span style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.04em', borderRadius: 4, padding: '3px 7px', background: `${roleRgba[p.role]},0.15)`, color: INSURANCE_ROLE_COLORS[p.role] }}>
          {INSURANCE_ROLE_LABELS[p.role]}
        </span>
        {p.countries.map(c => (
          <span key={c} style={{ fontSize: '.68rem', fontWeight: 600, borderRadius: 4, padding: '3px 7px', background: 'rgba(255,255,255,.07)', color: '#b0b0c0' }}>
            {flagEmoji(c)} {c}
          </span>
        ))}
      </div>
      <div style={{ fontSize: '.78rem', color: '#b0b0c0', lineHeight: 1.6, marginBottom: 10 }}>{p.description}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
        {p.types.map(t => (
          <span key={t} style={{ fontSize: '.64rem', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,.07)', color: '#9a9aaa' }}>
            {INSURANCE_LINE_LABELS[t]}
          </span>
        ))}
      </div>
      {p.url && (
        <div style={{ marginTop: 10 }}>
          <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.72rem', color: '#6366f1', textDecoration: 'none' }}>
            {p.url.replace('https://', '')} ↗
          </a>
        </div>
      )}
    </div>
  )
}

const INS_ROLE_OPTIONS: InsuranceProviderRole[] = ['mga', 'carrier', 'broker', 'lloyd', 'program-admin']
const INS_LINE_OPTIONS: InsuranceLineType[] = [
  'commercial-general', 'product-liability', 'directors-officers', 'property',
  'crop', 'professional-indemnity', 'cyber', 'cargo', 'workers-comp',
]

const INSURANCE_PROF_LINES_MAP: Record<string, InsuranceLineType[]> = {
  'Doctor':      ['professional-indemnity', 'commercial-general'],
  'Pharmacist':  ['professional-indemnity', 'product-liability', 'commercial-general'],
  'Budtender':   ['commercial-general', 'workers-comp', 'employers-liability'],
  'Cultivator':  ['crop', 'commercial-general', 'product-liability', 'workers-comp', 'employers-liability'],
  'Geneticist':  ['commercial-general', 'professional-indemnity'],
  'Processor':   ['product-liability', 'commercial-general', 'workers-comp', 'employers-liability'],
  'Lab/QA':      ['professional-indemnity', 'commercial-general', 'product-liability'],
  'Importer':    ['cargo', 'commercial-general', 'product-liability'],
  'Exporter':    ['cargo', 'commercial-general', 'product-liability'],
  'Distributor': ['cargo', 'commercial-general', 'product-liability'],
  'Clinic Op.':  ['professional-indemnity', 'commercial-general', 'product-liability', 'property'],
  'Retail':      ['commercial-general', 'product-liability', 'workers-comp', 'employers-liability', 'property'],
  'Compliance':  ['professional-indemnity', 'cyber'],
  'Legal':       ['professional-indemnity'],
  'Investor':    ['directors-officers', 'commercial-general', 'cyber'],
  'Regulator':   ['commercial-general', 'professional-indemnity'],
  'Patient Ed.': ['professional-indemnity', 'commercial-general'],
  'GMP/QA':      ['professional-indemnity', 'product-liability', 'commercial-general'],
  'Logistics':   ['cargo', 'commercial-general', 'workers-comp', 'employers-liability'],
}

const InsuranceDirectoryPage = React.memo(function InsuranceDirectoryPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  onPageChange?: (page: CommandPage) => void
}) {
  const [search,        setSearch]        = useState('')
  const [filterRole,    setFilterRole]    = useState<InsuranceProviderRole | 'all'>('all')
  const [filterType,    setFilterType]    = useState<InsuranceLineType | 'all'>('all')
  const [filterCountry, setFilterCountry] = useState('')

  const profLines = useMemo<InsuranceLineType[]>(() => INSURANCE_PROF_LINES_MAP[role] ?? [], [role])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return INSURANCE_PROVIDERS
      .filter(p => {
        const matchQ       = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        const matchRole    = filterRole === 'all' || p.role === filterRole
        const matchType    = filterType === 'all' || (p.types as string[]).includes(filterType)
        const matchCountry = !filterCountry || p.countries.includes(filterCountry)
        return matchQ && matchRole && matchType && matchCountry
      })
      .sort((a, b) => {
        const aLines = a.types as string[]
        const bLines = b.types as string[]
        const aScore = profLines.filter(l => aLines.includes(l)).length
        const bScore = profLines.filter(l => bLines.includes(l)).length
        if (bScore - aScore !== 0) return bScore - aScore
        if (a.featured && !b.featured) return -1
        if (b.featured && !a.featured) return 1
        return 0
      })
  }, [search, filterRole, filterType, filterCountry, profLines])

  const featured = filtered.filter(p => p.featured)
  const rest     = filtered.filter(p => !p.featured)
  const homeCountry = country.iso2

  return (
    <div className="cc-two-col-page">
      <style>{`
        .ins-card { background: rgba(255,255,255,.04); border-radius: 12px; border: 1px solid rgba(255,255,255,.08); padding: 18px 20px; margin-bottom: 14px; transition: border-color .15s; }
        .ins-card:hover { border-color: rgba(212,168,75,.35); }
        .ins-card.ins-featured { border-color: rgba(212,168,75,.25); background: rgba(212,168,75,.04); }
        .ins-search { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 9px 14px; color: #f5f0e8; font-size: .84rem; outline: none; margin-bottom: 14px; box-sizing: border-box; }
        .ins-search:focus { border-color: rgba(212,168,75,.5); }
        .ins-section-hdr { font-size: .68rem; text-transform: uppercase; letter-spacing: .1em; color: #d4a84b; margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(212,168,75,.2); }
        .ins-filter-lbl { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: #8a8a9a; margin-bottom: 7px; }
        .ins-filter-btn { display: block; width: 100%; text-align: left; background: none; border: none; padding: 5px 0; font-size: .77rem; color: #9a9aaa; cursor: pointer; }
        .ins-filter-btn.active { color: #d4a84b; font-weight: 600; }
        .ins-filter-select { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 7px 10px; color: #f5f0e8; font-size: .78rem; margin-bottom: 14px; }
      `}</style>

      <div className="cc-two-main">
        <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
          Insurance & Risk Coverage — {filtered.length} providers
        </div>
        <input className="ins-search" placeholder="Search providers, specialties, coverage lines..." value={search} onChange={e => setSearch(e.target.value)} />

        {featured.length > 0 && (
          <>
            <div className="ins-section-hdr">Featured</div>
            {featured.map(p => <InsCard key={p.id} p={p} homeCountry={homeCountry} />)}
          </>
        )}
        {rest.length > 0 && (
          <>
            {featured.length > 0 && <div className="ins-section-hdr">All Providers</div>}
            {rest.map(p => <InsCard key={p.id} p={p} homeCountry={homeCountry} />)}
          </>
        )}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#5a5a7a', padding: '40px 20px', fontSize: '.85rem' }}>No providers match your filters</div>
        )}
      </div>

      <div className="cc-two-right" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Your Coverage Profile */}
        {role && profLines.length > 0 && (
          <div style={{ background: 'rgba(16,185,129,.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.3)' }}>
            <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              {role} Coverage Profile
            </div>
            <div style={{ fontSize: '.72rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>
              Recommended lines for your role:
            </div>
            {profLines.slice(0, 5).map(line => (
              <div key={line}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' }}
                onClick={() => setFilterType(filterType === line ? 'all' : line)}
              >
                <span style={{ fontSize: '.62rem', color: filterType === line ? '#10b981' : '#10b98166', fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: '.76rem', color: filterType === line ? '#10b981' : '#b0b0c0' }}>
                  {INSURANCE_LINE_LABELS[line]}
                  <span style={{ marginLeft: 4, fontSize: '.64rem', color: '#6b7280' }}>
                    ({INSURANCE_PROVIDERS.filter(p => (p.types as string[]).includes(line)).length})
                  </span>
                </span>
              </div>
            ))}
            {profLines.length > 5 && (
              <div style={{ fontSize: '.72rem', color: '#6b7280', marginTop: 4 }}>+{profLines.length - 5} more lines</div>
            )}
            <button
              style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '5px 10px', color: '#10b981', fontSize: '.73rem', cursor: 'pointer', width: '100%', marginTop: 10 }}
              onClick={() => { setFilterType('all'); setFilterRole('all') }}
            >
              Show All for {role}
            </button>
          </div>
        )}

        <div>
        <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Filters</div>

        <div style={{ marginBottom: 16 }}>
          <div className="ins-filter-lbl">Provider Type</div>
          {(['all', ...INS_ROLE_OPTIONS] as const).map(r => (
            <button key={r} className={`ins-filter-btn${filterRole === r ? ' active' : ''}`} onClick={() => setFilterRole(r as InsuranceProviderRole | 'all')}>
              {r === 'all' ? 'All Types' : INSURANCE_ROLE_LABELS[r as InsuranceProviderRole]}
              {r !== 'all' && <span style={{ marginLeft: 4, fontSize: '.64rem', opacity: .7 }}>({INSURANCE_PROVIDERS.filter(p => p.role === r).length})</span>}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="ins-filter-lbl">Line of Insurance</div>
          <select className="ins-filter-select" value={filterType} onChange={e => setFilterType(e.target.value as InsuranceLineType | 'all')}>
            <option value="all">All Lines</option>
            {INS_LINE_OPTIONS.map(t => <option key={t} value={t}>{INSURANCE_LINE_LABELS[t]}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="ins-filter-lbl">Market</div>
          <select className="ins-filter-select" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
            <option value="">All Markets</option>
            {['US','CA','GB','DE','NL','PT','CH','AU','IL','ZA'].map(c => (
              <option key={c} value={c}>{flagEmoji(c)} {c}</option>
            ))}
          </select>
        </div>

        <div style={{ background: 'rgba(212,168,75,.08)', border: '1px solid rgba(212,168,75,.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#d4a84b', marginBottom: 6 }}>Specialist Placement</div>
          <div style={{ fontSize: '.74rem', color: '#b0b0c0', lineHeight: 1.6 }}>Standard brokers frequently decline cannabis risks. Always use a specialist MGA or wholesale broker with a documented cannabis book — standard commercial policies often exclude controlled substances.</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#f5f0e8', marginBottom: 8 }}>Coverage Checklist</div>
          {[
            ['Product Liability', 'Critical — contamination, mislabelling'],
            ['Commercial GL', 'Premises & operations'],
            ['Cargo', 'Cross-border shipments'],
            ['D&O', 'For funded companies'],
            ['Crop', 'Cultivators & LPs'],
            ['Professional Indemnity', 'Advisors & clinicians'],
          ].map(([line, note]) => (
            <div key={line} style={{ marginBottom: 7 }}>
              <div style={{ fontSize: '.76rem', color: '#d4a84b' }}>✓ {line}</div>
              <div style={{ fontSize: '.68rem', color: '#8a8a9a' }}>{note}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(16,185,129,.06)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,.2)' }}>
          <div style={{ fontSize: '.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Compliance Obligations</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Understand the regulatory obligations in {country.label} that drive your minimum insurance coverage requirements.</div>
          <button style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 6, padding: '7px 14px', color: '#10b981', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('compliance')}>
            Open Compliance →
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Licence Renewals</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a', marginBottom: 10, lineHeight: 1.5 }}>Insurance must be maintained throughout the licence lifecycle. Track expiry dates and renewals together.</div>
          <button style={{ background: 'rgba(212,168,75,.1)', border: '1px solid rgba(212,168,75,.25)', borderRadius: 6, padding: '7px 14px', color: '#d4a84b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => onPageChange?.('licences')}>
            Open Licence Tracker →
          </button>
        </div>
        </div>
      </div>
    </div>
  )
})

// ── Licence Tracker page ───────────────────────────────────────────────────────

type TrackedLicence = {
  id:         string
  name:       string
  type:       string
  authority:  string
  country:    string
  licenceNo:  string
  issuedDate: string
  expiryDate: string
  notes:      string
}

type LicenceStatus = 'active' | 'expiring' | 'expired'

function calcLicenceStatus(expiryDate: string): LicenceStatus {
  if (!expiryDate) return 'active'
  const days = Math.ceil((new Date(expiryDate + 'T23:59:59').getTime() - Date.now()) / 86400000)
  if (days < 0)  return 'expired'
  if (days < 60) return 'expiring'
  return 'active'
}

function licenceDaysLeft(expiryDate: string): number | null {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate + 'T23:59:59').getTime() - Date.now()) / 86400000)
}

const LIC_STATUS_COLORS: Record<LicenceStatus, string> = { active: '#10b981', expiring: '#f59e0b', expired: '#ef4444' }
const LIC_STATUS_LABELS: Record<LicenceStatus, string> = { active: 'Active', expiring: 'Expiring', expired: 'Expired' }
const LIC_TYPES = [
  'Import Licence', 'Export Licence', 'Cultivation Licence', 'Manufacturing / GMP',
  'Distribution Licence', 'Wholesale Licence', 'Retail / Dispensary', 'Pharmacy Licence',
  'Research Licence', 'Transport Permit', 'Processing Licence', 'Other',
]
const LIC_LS_KEY = 'hv_licences_v1'

function loadLicences(): TrackedLicence[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LIC_LS_KEY) ?? '[]') } catch { return [] }
}
function saveLicences(lics: TrackedLicence[]) {
  if (typeof window !== 'undefined') localStorage.setItem(LIC_LS_KEY, JSON.stringify(lics))
}

const BLANK_LIC: Omit<TrackedLicence, 'id'> = {
  name: '', type: LIC_TYPES[0], authority: '', country: '',
  licenceNo: '', issuedDate: '', expiryDate: '', notes: '',
}

const LIC_ROLE_TYPES_MAP: Record<string, string[]> = {
  'Doctor':      ['Pharmacy Licence', 'Research Licence', 'Other'],
  'Pharmacist':  ['Pharmacy Licence', 'Other'],
  'Budtender':   ['Retail / Dispensary', 'Other'],
  'Cultivator':  ['Cultivation Licence', 'Manufacturing / GMP', 'Processing Licence'],
  'Geneticist':  ['Cultivation Licence', 'Research Licence'],
  'Processor':   ['Processing Licence', 'Manufacturing / GMP', 'Distribution Licence'],
  'Lab/QA':      ['Research Licence', 'Manufacturing / GMP', 'Other'],
  'Importer':    ['Import Licence', 'Distribution Licence', 'Wholesale Licence'],
  'Exporter':    ['Export Licence', 'Manufacturing / GMP', 'Transport Permit'],
  'Distributor': ['Distribution Licence', 'Wholesale Licence', 'Transport Permit'],
  'Clinic Op.':  ['Pharmacy Licence', 'Retail / Dispensary', 'Other'],
  'Retail':      ['Retail / Dispensary', 'Wholesale Licence', 'Other'],
  'Compliance':  ['Other'],
  'Legal':       ['Other'],
  'Investor':    ['Other'],
  'Regulator':   ['Other'],
  'Patient Ed.': ['Other'],
  'GMP/QA':      ['Manufacturing / GMP', 'Research Licence', 'Other'],
  'Logistics':   ['Transport Permit', 'Distribution Licence', 'Other'],
}

const LicenceTrackerPage = React.memo(function LicenceTrackerPage({
  country, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  onPageChange?: (page: CommandPage) => void
}) {
  const [licences,     setLicences]     = useState<TrackedLicence[]>([])
  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState<string | null>(null)
  const [form,         setForm]         = useState<Omit<TrackedLicence, 'id'>>(BLANK_LIC)
  const [sortKey,      setSortKey]      = useState<'expiryDate' | 'name' | 'type'>('expiryDate')
  const [filterStatus, setFilterStatus] = useState<LicenceStatus | 'all'>('all')

  useEffect(() => { setLicences(loadLicences()) }, [])

  const stats = useMemo(() => ({
    active:   licences.filter(l => calcLicenceStatus(l.expiryDate) === 'active').length,
    expiring: licences.filter(l => calcLicenceStatus(l.expiryDate) === 'expiring').length,
    expired:  licences.filter(l => calcLicenceStatus(l.expiryDate) === 'expired').length,
  }), [licences])

  const sorted = useMemo(() => {
    const list = filterStatus === 'all' ? [...licences] : licences.filter(l => calcLicenceStatus(l.expiryDate) === filterStatus)
    return list.sort((a, b) => {
      if (sortKey === 'expiryDate') {
        const da = licenceDaysLeft(a.expiryDate) ?? 99999
        const db = licenceDaysLeft(b.expiryDate) ?? 99999
        return da - db
      }
      return (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '')
    })
  }, [licences, sortKey, filterStatus])

  function openAdd() {
    setEditId(null); setForm({ ...BLANK_LIC, country: country.iso2 }); setShowForm(true)
  }
  function openEdit(lic: TrackedLicence) {
    setEditId(lic.id); const { id: _id, ...rest } = lic; setForm(rest); setShowForm(true)
  }
  function saveLic() {
    if (!form.name.trim()) return
    const next = editId
      ? licences.map(l => l.id === editId ? { ...form, id: editId } : l)
      : [...licences, { ...form, id: crypto.randomUUID() }]
    setLicences(next); saveLicences(next); setShowForm(false)
  }
  function removeLic(id: string) {
    const next = licences.filter(l => l.id !== id); setLicences(next); saveLicences(next)
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <style>{`
        .lt-stat { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 14px 18px; flex: 1; cursor: pointer; transition: border-color .15s; }
        .lt-stat:hover { border-color: rgba(212,168,75,.3); }
        .lt-num { font-size: 1.6rem; font-weight: 700; font-family: 'Courier New', monospace; }
        .lt-lbl { font-size: .66rem; text-transform: uppercase; letter-spacing: .06em; color: #8a8a9a; margin-top: 3px; }
        .lt-table { width: 100%; border-collapse: collapse; }
        .lt-table th { font-size: .66rem; text-transform: uppercase; letter-spacing: .06em; color: #8a8a9a; padding: 8px 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.09); }
        .lt-table td { padding: 9px 10px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: .78rem; color: #c0c0d0; vertical-align: middle; }
        .lt-table tr:hover td { background: rgba(255,255,255,.025); }
        .lt-pill { display: inline-flex; align-items: center; gap: 5px; font-size: .66rem; padding: 2px 7px; border-radius: 4px; font-weight: 600; }
        .lt-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .lt-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .lt-modal { background: #0f1929; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 28px 32px; width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        .lt-inp { width: 100%; box-sizing: border-box; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 7px; padding: 9px 12px; color: #f5f0e8; font-size: .84rem; outline: none; margin-top: 4px; }
        .lt-inp:focus { border-color: rgba(212,168,75,.5); }
        .lt-inp-lbl { font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: #8a8a9a; margin-top: 12px; display: block; }
        .lt-r2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .lt-btn-p { background: rgba(212,168,75,.15); border: 1px solid rgba(212,168,75,.4); border-radius: 7px; padding: 9px 18px; color: #d4a84b; font-size: .82rem; font-weight: 600; cursor: pointer; }
        .lt-btn-g { background: none; border: 1px solid rgba(255,255,255,.12); border-radius: 7px; padding: 9px 18px; color: #8a8a9a; font-size: .82rem; cursor: pointer; }
        .lt-btn-d { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 4px; padding: 3px 8px; color: #ef4444; font-size: .7rem; cursor: pointer; }
        .lt-sort-btn { background: none; border: none; color: #6a6a8a; cursor: pointer; font-size: .68rem; padding: 2px 6px; border-radius: 3px; }
        .lt-sort-btn.active { color: #d4a84b; background: rgba(212,168,75,.1); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f5f0e8', marginBottom: 3 }}>Licence Tracker</div>
          <div style={{ fontSize: '.75rem', color: '#8a8a9a' }}>Track regulatory licences, permits, and authorisations with automated expiry monitoring. Stored locally on this device.</div>
        </div>
        <button className="lt-btn-p" onClick={openAdd} style={{ flexShrink: 0, marginLeft: 16 }}>+ Add Licence</button>
      </div>

      {/* Role suggestions */}
      {role && (LIC_ROLE_TYPES_MAP[role] ?? []).filter(t => t !== 'Other').length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.68rem', color: 'rgba(16,185,129,.7)', textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0 }}>Common for {role}s:</span>
          {(LIC_ROLE_TYPES_MAP[role] ?? []).filter(t => t !== 'Other').map(t => (
            <button key={t} onClick={() => { setForm(f => ({ ...f, type: t, country: country.iso2 })); setEditId(null); setShowForm(true) }} style={{
              fontSize: '.7rem', padding: '2px 10px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', color: '#10b981',
            }}>+ {t}</button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        {([
          { key: 'active',   label: 'Active',        color: '#10b981' },
          { key: 'expiring', label: 'Expiring ≤60d', color: '#f59e0b' },
          { key: 'expired',  label: 'Expired',       color: '#ef4444' },
          { key: 'total',    label: 'Total',          color: '#6366f1' },
        ] as const).map(({ key, label, color }) => (
          <div
            key={key}
            className="lt-stat"
            style={{ borderColor: filterStatus === key ? `${color}40` : undefined }}
            onClick={() => key !== 'total' && setFilterStatus(prev => prev === key ? 'all' : key as LicenceStatus)}
          >
            <div className="lt-num" style={{ color }}>{key === 'total' ? licences.length : stats[key as LicenceStatus]}</div>
            <div className="lt-lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {stats.expiring > 0 && (
        <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: '11px 15px', marginBottom: 14, fontSize: '.78rem', color: '#f59e0b' }}>
          ⚠ {stats.expiring} licence{stats.expiring > 1 ? 's' : ''} expiring within 60 days — initiate renewal processes immediately.
        </div>
      )}
      {stats.expired > 0 && (
        <div style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '11px 15px', marginBottom: 14, fontSize: '.78rem', color: '#ef4444' }}>
          ✕ {stats.expired} expired licence{stats.expired > 1 ? 's' : ''} — operating without valid authorisation may constitute a regulatory offence.
        </div>
      )}

      {/* Empty state */}
      {licences.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: '#5a5a7a' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14, opacity: .5 }}>◨</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#8a8a9a', marginBottom: 8 }}>No licences tracked</div>
          <div style={{ fontSize: '.8rem', marginBottom: 22, maxWidth: 360, margin: '0 auto 22px' }}>
            Add your import permits, cultivation licences, GMP certificates, and all other regulatory authorisations. Get notified before they expire.
          </div>
          <button className="lt-btn-p" onClick={openAdd}>Add Your First Licence</button>
        </div>
      )}

      {/* Table */}
      {licences.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '.68rem', color: '#6a6a8a', marginRight: 4 }}>Sort:</span>
            {(['expiryDate', 'name', 'type'] as const).map(k => (
              <button key={k} className={`lt-sort-btn${sortKey === k ? ' active' : ''}`} onClick={() => setSortKey(k)}>
                {k === 'expiryDate' ? 'Expiry ▾' : k === 'name' ? 'Name' : 'Type'}
              </button>
            ))}
            {filterStatus !== 'all' && (
              <button className="lt-sort-btn" onClick={() => setFilterStatus('all')} style={{ marginLeft: 'auto', color: '#d4a84b' }}>
                ✕ Clear filter
              </button>
            )}
          </div>
          <table className="lt-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Type</th>
                <th>Authority</th>
                <th>Country</th>
                <th>Licence No.</th>
                <th>Issued</th>
                <th>Expires</th>
                <th>Days</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(lic => {
                const st  = calcLicenceStatus(lic.expiryDate)
                const col = LIC_STATUS_COLORS[st]
                const days = licenceDaysLeft(lic.expiryDate)
                return (
                  <tr key={lic.id}>
                    <td>
                      <span className="lt-pill" style={{ background: `${col}1a`, color: col }}>
                        <span className="lt-dot" style={{ background: col }} />
                        {LIC_STATUS_LABELS[st]}
                      </span>
                    </td>
                    <td style={{ color: '#f5f0e8', fontWeight: 500 }}>{lic.name}</td>
                    <td style={{ color: '#9a9aaa', fontSize: '.74rem' }}>{lic.type}</td>
                    <td>{lic.authority || '—'}</td>
                    <td>{lic.country ? `${flagEmoji(lic.country)} ${lic.country}` : '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.74rem', color: '#8a8a9a' }}>{lic.licenceNo || '—'}</td>
                    <td style={{ fontSize: '.74rem', color: '#8a8a9a' }}>{lic.issuedDate || '—'}</td>
                    <td style={{ fontSize: '.74rem' }}>{lic.expiryDate || '—'}</td>
                    <td style={{ fontWeight: 700, color: days === null ? '#6a6a8a' : days < 0 ? '#ef4444' : days < 60 ? '#f59e0b' : '#10b981' }}>
                      {days === null ? '—' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' as const }}>
                      <button style={{ background: 'none', border: 'none', color: '#8a8a9a', cursor: 'pointer', fontSize: '.72rem', padding: '2px 8px' }} onClick={() => openEdit(lic)}>Edit</button>
                      <button className="lt-btn-d" onClick={() => removeLic(lic.id)}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cross-page navigation */}
      <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px', flexWrap: 'wrap' }}>
        <button style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '8px 14px', color: '#10b981', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => onPageChange?.('compliance')}>
          ◫ Open Compliance →
        </button>
        <button style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 14px', color: 'rgba(245,240,232,.55)', fontSize: '.75rem', cursor: 'pointer' }}
          onClick={() => onPageChange?.('access-pathway')}>
          ◎ View Access Pathway →
        </button>
        <button style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 14px', color: 'rgba(245,240,232,.55)', fontSize: '.75rem', cursor: 'pointer' }}
          onClick={() => onPageChange?.('regulatory')}>
          ◷ Regulatory Watch →
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="lt-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="lt-modal">
            <div style={{ fontSize: '.92rem', fontWeight: 700, color: '#f5f0e8', marginBottom: 18 }}>{editId ? 'Edit Licence' : 'Add Licence'}</div>

            <label className="lt-inp-lbl">Licence Name *</label>
            <input className="lt-inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. BfArM Import Permit — Germany" />

            <div className="lt-r2">
              <div>
                <label className="lt-inp-lbl">Type</label>
                <select className="lt-inp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {LIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="lt-inp-lbl">Country (ISO2)</label>
                <input className="lt-inp" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="DE" maxLength={2} />
              </div>
            </div>

            <label className="lt-inp-lbl">Issuing Authority</label>
            <input className="lt-inp" value={form.authority} onChange={e => setForm(f => ({ ...f, authority: e.target.value }))} placeholder="e.g. BfArM, MHRA, Health Canada, TGA" />

            <label className="lt-inp-lbl">Licence Number</label>
            <input className="lt-inp" value={form.licenceNo} onChange={e => setForm(f => ({ ...f, licenceNo: e.target.value }))} placeholder="Official licence / permit number" />

            <div className="lt-r2">
              <div>
                <label className="lt-inp-lbl">Issue Date</label>
                <input type="date" className="lt-inp" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} />
              </div>
              <div>
                <label className="lt-inp-lbl">Expiry Date</label>
                <input type="date" className="lt-inp" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
              </div>
            </div>

            <label className="lt-inp-lbl">Notes</label>
            <textarea className="lt-inp" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Conditions, restrictions, renewal lead-time, contacts..." rows={3} style={{ resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="lt-btn-g" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="lt-btn-p" onClick={saveLic}>{editId ? 'Save Changes' : 'Add Licence'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// ── Landed Cost / Trade Calculator page ───────────────────────────────────────

function fmtUSD(n: number, dec = 0): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function CostBar({ label, low, high, maxVal, color }: { label: string; low: number; high: number; maxVal: number; color: string }) {
  const mid = (low + high) / 2
  const pct = Math.min((mid / maxVal) * 100, 100)
  const same = Math.abs(high - low) < 0.5
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '.72rem', color: '#b0b0c0' }}>{label}</span>
        <span style={{ fontSize: '.72rem', fontFamily: 'monospace', color: '#f5f0e8', fontWeight: 600 }}>
          {same ? fmtUSD(low) : `${fmtUSD(low)} – ${fmtUSD(high)}`}
        </span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, opacity: .85 }} />
      </div>
    </div>
  )
}

const LandedCostPage = React.memo(function LandedCostPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  onPageChange?: (page: CommandPage) => void
}) {
  const exporterIso2s = EXPORTER_ORIGINS.map(o => o.iso2)
  const importerIso2s = DESTINATION_MARKETS.map(d => d.iso2)

  const [originIso2,      setOriginIso2]      = useState(() => exporterIso2s.includes(country.iso2) ? country.iso2 : 'IL')
  const [destIso2,        setDestIso2]        = useState(() => importerIso2s.includes(country.iso2) ? country.iso2 : 'DE')
  const [product,         setProduct]         = useState<LandedProductType>('flower-premium')
  const [volumeKg,        setVolumeKg]        = useState(20)
  const [compareMode,     setCompareMode]     = useState(false)
  const [customProdLow,   setCustomProdLow]   = useState('')
  const [customProdHigh,  setCustomProdHigh]  = useState('')
  const [targetSellPrice, setTargetSellPrice] = useState('')

  const origin   = EXPORTER_ORIGINS.find(o => o.iso2 === originIso2)
  const dest     = DESTINATION_MARKETS.find(d => d.iso2 === destIso2)
  const corridor = FREIGHT_CORRIDORS.find(c => c.originIso2 === originIso2 && c.destIso2 === destIso2)

  const result = useMemo(() => calcLandedCost(
    originIso2, destIso2, product, volumeKg,
    customProdLow  ? parseFloat(customProdLow)  : undefined,
    customProdHigh ? parseFloat(customProdHigh) : undefined,
  ), [originIso2, destIso2, product, volumeKg, customProdLow, customProdHigh])

  const comparisons = useMemo(() => {
    if (!compareMode) return []
    return EXPORTER_ORIGINS
      .map(o => ({ origin: o, result: calcLandedCost(o.iso2, destIso2, product, volumeKg) }))
      .filter(c => c.result.available)
      .sort((a, b) => a.result.totalLandedPerKg.low - b.result.totalLandedPerKg.low)
  }, [compareMode, destIso2, product, volumeKg])

  const maxBarVal = result.available ? result.totalLandedPerKg.high * 1.2 || 10000 : 10000

  const sell = targetSellPrice ? parseFloat(targetSellPrice) : null
  const customMarginLow  = sell && result.totalLandedPerKg.high > 0 ? ((sell - result.totalLandedPerKg.high) / sell) * 100 : null
  const customMarginHigh = sell && result.totalLandedPerKg.low  > 0 ? ((sell - result.totalLandedPerKg.low ) / sell) * 100 : null

  return (
    <div style={{ padding: '20px 24px' }}>
      <style>{`
        .tc-panel { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 18px 20px; }
        .tc-inp { width: 100%; box-sizing: border-box; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 7px; padding: 8px 11px; color: #f5f0e8; font-size: .82rem; outline: none; }
        .tc-inp:focus { border-color: rgba(212,168,75,.5); }
        .tc-lbl { font-size: .66rem; text-transform: uppercase; letter-spacing: .06em; color: #8a8a9a; margin-bottom: 5px; display: block; }
        .tc-field { margin-bottom: 13px; }
        .tc-hr { border: none; border-top: 1px solid rgba(255,255,255,.07); margin: 14px 0; }
        .tc-sec { font-size: .64rem; text-transform: uppercase; letter-spacing: .1em; color: #d4a84b; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid rgba(212,168,75,.18); }
        .tc-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
        .tc-row-lbl { font-size: .72rem; color: #8a8a9a; }
        .tc-row-val { font-size: .78rem; font-weight: 600; font-family: monospace; color: #f5f0e8; }
        .tc-highlight { background: rgba(212,168,75,.07); border: 1px solid rgba(212,168,75,.22); border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
        .tc-cmp-row { display: grid; grid-template-columns: 22px 1fr 96px 96px 80px; gap: 6px; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,.04); cursor: pointer; }
        .tc-cmp-row:hover { background: rgba(255,255,255,.02); }
        .tc-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: rgba(255,255,255,.1); border-radius: 2px; outline: none; cursor: pointer; }
        .tc-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #d4a84b; cursor: pointer; }
        .tc-unavail { background: rgba(239,68,68,.05); border: 1px solid rgba(239,68,68,.18); border-radius: 8px; padding: 20px; color: #ef4444; font-size: .82rem; text-align: center; margin-top: 16px; line-height: 1.7; }
      `}</style>

      <div style={{ fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
        Trade Economics Calculator — Landed Cost Analysis
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 248px', gap: 14 }}>

        {/* ── Inputs ─────────────────────────────────── */}
        <div className="tc-panel">
          <div className="tc-sec">Trade Parameters</div>

          <div className="tc-field">
            <label className="tc-lbl">Origin Country</label>
            <select className="tc-inp" value={originIso2} onChange={e => setOriginIso2(e.target.value)}>
              {EXPORTER_ORIGINS.map(o => <option key={o.iso2} value={o.iso2}>{flagEmoji(o.iso2)} {o.label}</option>)}
            </select>
            {origin && <div style={{ fontSize: '.65rem', color: '#6a6a8a', marginTop: 3 }}>{origin.regulatoryBody}</div>}
          </div>

          <div className="tc-field">
            <label className="tc-lbl">Destination Market</label>
            <select className="tc-inp" value={destIso2} onChange={e => setDestIso2(e.target.value)}>
              {DESTINATION_MARKETS.map(d => <option key={d.iso2} value={d.iso2}>{flagEmoji(d.iso2)} {d.label}</option>)}
            </select>
            {dest && <div style={{ fontSize: '.65rem', color: '#6a6a8a', marginTop: 3 }}>{dest.regulatoryBody}</div>}
          </div>

          <div className="tc-field">
            <label className="tc-lbl">Product</label>
            <select className="tc-inp" value={product} onChange={e => setProduct(e.target.value as LandedProductType)}>
              {(Object.keys(LANDED_PRODUCT_LABELS) as LandedProductType[]).map(p => (
                <option key={p} value={p}>{LANDED_PRODUCT_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <div className="tc-field">
            <label className="tc-lbl">Volume per Shipment — {volumeKg} kg</label>
            <input type="range" className="tc-range" min={1} max={100} value={volumeKg} onChange={e => setVolumeKg(Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.6rem', color: '#5a5a7a', marginTop: 2 }}>
              <span>1 kg</span><span>50 kg</span><span>100 kg</span>
            </div>
          </div>

          <hr className="tc-hr" />
          <div className="tc-sec">Override Production Cost</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
            <div>
              <label className="tc-lbl">Low (USD/kg)</label>
              <input className="tc-inp" type="number" placeholder={String(origin?.productionCost[product]?.low ?? '')} value={customProdLow} onChange={e => setCustomProdLow(e.target.value)} />
            </div>
            <div>
              <label className="tc-lbl">High (USD/kg)</label>
              <input className="tc-inp" type="number" placeholder={String(origin?.productionCost[product]?.high ?? '')} value={customProdHigh} onChange={e => setCustomProdHigh(e.target.value)} />
            </div>
          </div>
          {origin?.productionCost[product] && !customProdLow && (
            <div style={{ fontSize: '.66rem', color: '#6a6a8a', marginBottom: 4 }}>
              Default: {fmtUSD(origin.productionCost[product]!.low)} – {fmtUSD(origin.productionCost[product]!.high)}/kg
            </div>
          )}

          <hr className="tc-hr" />
          <div className="tc-sec">Target Analysis</div>

          <div className="tc-field">
            <label className="tc-lbl">Your Target Sell Price (USD/kg)</label>
            <input className="tc-inp" type="number" placeholder="Wholesale target" value={targetSellPrice} onChange={e => setTargetSellPrice(e.target.value)} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.78rem', color: '#b0b0c0' }}>
            <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} />
            Compare all origins → {dest?.label ?? destIso2}
          </label>
        </div>

        {/* ── Cost Breakdown ─────────────────────────── */}
        <div>
          {!result.available ? (
            <div className="tc-unavail">
              <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>✕</div>
              <strong>{flagEmoji(originIso2)} {origin?.label}</strong> does not typically export{' '}
              {LANDED_PRODUCT_LABELS[product].toLowerCase()} in commercial volumes.<br />
              Try a different origin or product type.
            </div>
          ) : (
            <>
              <div className="tc-panel" style={{ marginBottom: 12 }}>
                <div className="tc-sec">Cost Waterfall — USD per kg ({volumeKg} kg shipment)</div>
                <CostBar label="Production Cost"             low={result.productionCostPerKg.low}     high={result.productionCostPerKg.high}     maxVal={maxBarVal} color="#6366f1" />
                <CostBar label="Export Permit (amortised)"  low={result.exportPermitPerKg.low}        high={result.exportPermitPerKg.high}        maxVal={maxBarVal} color="#8b5cf6" />
                <CostBar label="Export Documentation"       low={result.exportDocPerKg.low}           high={result.exportDocPerKg.high}           maxVal={maxBarVal} color="#8b5cf6" />
                <CostBar label="Air Freight"                low={result.freightPerKg.low}             high={result.freightPerKg.high}             maxVal={maxBarVal} color="#06b6d4" />
                <CostBar label="Narcotics Handling"         low={result.narcoticsSurchargePerKg.low}  high={result.narcoticsSurchargePerKg.high}  maxVal={maxBarVal} color="#06b6d4" />
                <CostBar label="Import Permit (amortised)"  low={result.importPermitPerKg.low}        high={result.importPermitPerKg.high}        maxVal={maxBarVal} color="#d4a84b" />
                <CostBar label="Customs Clearance"          low={result.customsClearancePerKg.low}    high={result.customsClearancePerKg.high}    maxVal={maxBarVal} color="#d4a84b" />
                {result.dutyPerKg.low > 0.5
                  ? <CostBar label={`Import Duty (${dest?.dutyRatePct?.[product] ?? 0}%)`} low={result.dutyPerKg.low} high={result.dutyPerKg.high} maxVal={maxBarVal} color="#f97316" />
                  : <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, opacity: .65 }}>
                      <span style={{ fontSize: '.72rem', color: '#b0b0c0' }}>Import Duty</span>
                      <span style={{ fontSize: '.72rem', fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>0% — Duty Free (HS 3004)</span>
                    </div>
                }
                <CostBar label="GDP Distribution"          low={result.gdpDistributionPerKg.low}     high={result.gdpDistributionPerKg.high}     maxVal={maxBarVal} color="#10b981" />
                <CostBar label="Destination Lab Testing"   low={result.testingPerKg.low}             high={result.testingPerKg.high}             maxVal={maxBarVal} color="#10b981" />

                <div style={{ borderTop: '2px solid rgba(212,168,75,.3)', paddingTop: 10, marginTop: 10 }}>
                  <CostBar label="TOTAL LANDED COST / KG" low={result.totalLandedPerKg.low} high={result.totalLandedPerKg.high} maxVal={maxBarVal} color="#d4a84b" />
                </div>

                {result.wholesaleTarget && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 10, marginTop: 4 }}>
                    <CostBar
                      label={`${dest?.label ?? destIso2} Wholesale Price Range`}
                      low={result.wholesaleTarget.low}
                      high={result.wholesaleTarget.high}
                      maxVal={maxBarVal}
                      color="#10b981"
                    />
                  </div>
                )}
              </div>

              <div className="tc-panel">
                <div className="tc-sec">Trade Economics</div>
                <div className="tc-row"><span className="tc-row-lbl">Corridor</span><span className="tc-row-val">{flagEmoji(originIso2)} {origin?.label} → {flagEmoji(destIso2)} {dest?.label}</span></div>
                {corridor && <div className="tc-row"><span className="tc-row-lbl">Transit Time (air)</span><span className="tc-row-val">{corridor.transitDays} days</span></div>}
                <div className="tc-row"><span className="tc-row-lbl">Shipment Total Cost</span><span className="tc-row-val">{fmtUSD(result.totalLandedPerKg.low * volumeKg)} – {fmtUSD(result.totalLandedPerKg.high * volumeKg)}</span></div>
                {result.breakEvenVolumeKg !== null && <div className="tc-row"><span className="tc-row-lbl">Break-Even Volume</span><span className="tc-row-val" style={{ color: '#d4a84b' }}>{result.breakEvenVolumeKg} kg / shipment</span></div>}

                {result.impliedMarginPct && (
                  <div className="tc-highlight">
                    <div style={{ fontSize: '.68rem', color: '#d4a84b', marginBottom: 5, fontWeight: 600 }}>Implied Gross Margin at Market Price</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: result.impliedMarginPct.low < 0 ? '#ef4444' : '#10b981' }}>
                      {result.impliedMarginPct.low.toFixed(1)}% – {result.impliedMarginPct.high.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '.65rem', color: '#8a8a9a', marginTop: 2 }}>vs. {dest?.label} current wholesale benchmark</div>
                  </div>
                )}

                {sell !== null && customMarginLow !== null && (
                  <div className="tc-highlight" style={{ marginTop: 10, borderColor: customMarginLow < 0 ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.28)' }}>
                    <div style={{ fontSize: '.68rem', color: '#d4a84b', marginBottom: 5, fontWeight: 600 }}>Margin at Target Price ({fmtUSD(sell)}/kg)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: customMarginLow < 0 ? '#ef4444' : '#10b981' }}>
                      {customMarginLow.toFixed(1)}% – {(customMarginHigh ?? 0).toFixed(1)}%
                    </div>
                    {customMarginLow < 0 && (
                      <div style={{ fontSize: '.7rem', color: '#ef4444', marginTop: 5 }}>
                        ⚠ Target price below landed cost — unprofitable at {volumeKg} kg. Increase volume or revise supply chain.
                      </div>
                    )}
                  </div>
                )}

                {dest && (
                  <div style={{ marginTop: 12, padding: 11, background: 'rgba(255,255,255,.025)', borderRadius: 7, fontSize: '.7rem', color: '#8a8a9a', lineHeight: 1.6 }}>
                    <strong style={{ color: '#b0b0c0' }}>Market Note:</strong> {dest.notes}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel ─────────────────────────────── */}
        <div>
          {compareMode ? (
            <div className="tc-panel">
              <div className="tc-sec">All Origins → {dest?.label}</div>
              <div style={{ marginBottom: 4 }}>
                <div className="tc-cmp-row" style={{ cursor: 'default', opacity: .5, paddingBottom: 4 }}>
                  <div style={{ fontSize: '.6rem', color: '#6a6a8a' }}>#</div>
                  <div style={{ fontSize: '.6rem', color: '#6a6a8a' }}>Origin</div>
                  <div style={{ fontSize: '.6rem', color: '#6a6a8a' }}>Low</div>
                  <div style={{ fontSize: '.6rem', color: '#6a6a8a' }}>High</div>
                  <div style={{ fontSize: '.6rem', color: '#6a6a8a' }}>Margin</div>
                </div>
                {comparisons.map((c, i) => (
                  <div key={c.origin.iso2} className="tc-cmp-row" onClick={() => { setOriginIso2(c.origin.iso2); setCompareMode(false) }}>
                    <span style={{ fontSize: '.7rem', color: i === 0 ? '#10b981' : '#6a6a8a', fontWeight: 600 }}>#{i + 1}</span>
                    <span style={{ fontSize: '.73rem', color: c.origin.iso2 === originIso2 ? '#d4a84b' : '#f5f0e8' }}>
                      {flagEmoji(c.origin.iso2)} {c.origin.label}
                    </span>
                    <span style={{ fontSize: '.71rem', fontFamily: 'monospace', color: '#c0c0d0' }}>{fmtUSD(c.result.totalLandedPerKg.low)}</span>
                    <span style={{ fontSize: '.71rem', fontFamily: 'monospace', color: '#c0c0d0' }}>{fmtUSD(c.result.totalLandedPerKg.high)}</span>
                    <span style={{ fontSize: '.7rem', fontFamily: 'monospace', color: c.result.impliedMarginPct ? (c.result.impliedMarginPct.low < 5 ? '#ef4444' : '#10b981') : '#6a6a8a' }}>
                      {c.result.impliedMarginPct ? `${c.result.impliedMarginPct.low.toFixed(0)}–${c.result.impliedMarginPct.high.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '.65rem', color: '#6a6a8a', marginTop: 8 }}>Click a row to select that origin</div>
            </div>
          ) : (
            <>
              <div className="tc-panel" style={{ marginBottom: 12 }}>
                <div className="tc-sec">Corridor Detail</div>
                {corridor ? (
                  <>
                    <div className="tc-row"><span className="tc-row-lbl">Freight Rate</span><span className="tc-row-val">${corridor.airFreightUSDPerKg.low}–${corridor.airFreightUSDPerKg.high}/kg</span></div>
                    <div className="tc-row"><span className="tc-row-lbl">Narcotics Surcharge</span><span className="tc-row-val">${corridor.narcoticsSurchargeUSDPerKg}/kg</span></div>
                    <div className="tc-row"><span className="tc-row-lbl">Transit</span><span className="tc-row-val">{corridor.transitDays} days (air)</span></div>
                    {corridor.notes && <div style={{ marginTop: 8, fontSize: '.7rem', color: '#8a8a9a', lineHeight: 1.55 }}>{corridor.notes}</div>}
                  </>
                ) : (
                  <div style={{ fontSize: '.74rem', color: '#8a8a9a' }}>No specific corridor data — using regional estimates.</div>
                )}
              </div>

              <div className="tc-panel" style={{ marginBottom: 12 }}>
                <div className="tc-sec">Regulatory</div>
                {origin && <div className="tc-row"><span className="tc-row-lbl">Export Authority</span><span style={{ fontSize: '.7rem', color: '#c0c0d0', textAlign: 'right' as const }}>{origin.exportLicenceBody}</span></div>}
                {dest && <div className="tc-row"><span className="tc-row-lbl">Import Authority</span><span style={{ fontSize: '.7rem', color: '#c0c0d0', textAlign: 'right' as const }}>{dest.regulatoryBody}</span></div>}
                {dest && <div className="tc-row"><span className="tc-row-lbl">Typical Batch</span><span className="tc-row-val">{dest.typicalBatchSizeKg} kg</span></div>}
                {dest && <div className="tc-row"><span className="tc-row-lbl">Duty Rate</span><span className="tc-row-val" style={{ color: (dest.dutyRatePct[product] ?? 0) > 0 ? '#f97316' : '#10b981' }}>{dest.dutyRatePct[product] ?? 0}%</span></div>}
              </div>

              {role && (() => {
                const tips: Record<string, { headline: string; body: string }> = {
                  'Importer':    { headline: 'Importer Focus', body: 'Your key costs are import permits, customs clearance, GDP distribution, and destination testing. Prioritise corridors with established narcotics import channels and known customs brokers.' },
                  'Exporter':    { headline: 'Exporter Focus', body: 'Production cost and export permit fees are your largest variables. GMP certification significantly reduces per-unit compliance cost at scale. Compare origins to benchmark your competitiveness.' },
                  'Distributor': { headline: 'Distributor Focus', body: 'Distribution and in-country logistics dominate your margins. GDP cold-chain costs vary significantly — lock in distribution agreements before committing to import volumes.' },
                  'Logistics':   { headline: 'Logistics Focus', body: 'Air freight rates and narcotics surcharges are your primary cost drivers. Transit time and narcotics handling certification matter as much as rate when bidding corridors.' },
                  'Investor':    { headline: 'Investor Focus', body: 'Total landed cost determines the commercially viable wholesale price floor. Focus on implied margin at market price and break-even volume — the two metrics that drive unit economics.' },
                  'Cultivator':  { headline: 'Cultivator Focus', body: 'Your production cost is the base of every landed cost calculation. Lowering production cost/kg directly expands your export addressable margin. EU-GMP certification opens premium corridors.' },
                  'GMP/QA':      { headline: 'GMP / QA Focus', body: 'Testing costs and GDP compliance add $15–60/kg on most corridors. Accredited lab partnerships in destination markets reduce per-shipment testing fees significantly.' },
                }
                const tip = tips[role]
                if (!tip) return null
                return (
                  <div className="tc-panel" style={{ marginBottom: 12, borderColor: 'rgba(16,185,129,.2)', background: 'rgba(16,185,129,.03)' }}>
                    <div className="tc-sec" style={{ color: '#10b981', borderBottomColor: 'rgba(16,185,129,.18)' }}>{tip.headline}</div>
                    <div style={{ fontSize: '.72rem', color: 'rgba(245,240,232,.5)', lineHeight: 1.6 }}>{tip.body}</div>
                  </div>
                )
              })()}

              <div className="tc-panel">
                <div className="tc-sec">Economics Guide</div>
                <div style={{ fontSize: '.72rem', color: '#8a8a9a', lineHeight: 1.7 }}>
                  <p style={{ marginTop: 0 }}><strong style={{ color: '#c0c0d0' }}>Volume is leverage.</strong> Fixed costs (permits, testing, customs) dilute per kg as shipment size grows. Doubling from 10→20 kg often cuts unit overhead by 30–40%.</p>
                  <p><strong style={{ color: '#c0c0d0' }}>HS 3004 advantage.</strong> Medical cannabis as a pharmaceutical preparation enters most markets at 0% duty. Biomass (HS 1211) typically carries 6.4% EU MFN tariff.</p>
                  <p style={{ marginBottom: 0 }}><strong style={{ color: '#c0c0d0' }}>Compare mode.</strong> Enable above to rank all export origins by landed cost for your destination — essential for supply chain decisions.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <button className="tc-panel" style={{ textAlign: 'left' as const, cursor: 'pointer', color: '#10b981', fontSize: '.76rem', fontWeight: 600, border: '1px solid rgba(16,185,129,.25)' }}
                  onClick={() => onPageChange?.('prices')}>
                  ⊞ Price Intelligence — Benchmark Reference Data →
                </button>
                <button className="tc-panel" style={{ textAlign: 'left' as const, cursor: 'pointer', color: 'rgba(245,240,232,.55)', fontSize: '.76rem', border: '1px solid rgba(255,255,255,.08)' }}
                  onClick={() => onPageChange?.('logistics')}>
                  ⬡ Find GDP-Compliant Logistics Providers →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

// ── Events page ───────────────────────────────────────────────────────────────

const REGION_OPTIONS = ['Europe', 'Americas', 'Asia-Pacific', 'Africa', 'Oceania', 'Online'] as const

function evtDateRange(e: CannabisEvent): string {
  const fmt = (s: string) => {
    const d = new Date(s + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (!e.dateEnd || e.dateEnd === e.dateStart) return fmt(e.dateStart)
  const s = new Date(e.dateStart + 'T00:00:00')
  const f = new Date(e.dateEnd   + 'T00:00:00')
  const sameMonth = s.getMonth() === f.getMonth() && s.getFullYear() === f.getFullYear()
  if (sameMonth) {
    return `${s.getDate()}–${f.getDate()} ${s.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
  }
  return `${fmt(e.dateStart)} – ${fmt(e.dateEnd)}`
}

function evtMonthKey(e: CannabisEvent): string {
  const d = new Date(e.dateStart + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function evtIsUpcoming(e: CannabisEvent): boolean {
  const end = e.dateEnd ?? e.dateStart
  return new Date(end + 'T23:59:59') >= new Date()
}

function evtIsRelevant(e: CannabisEvent, role: string): boolean {
  if (!role) return false
  if (e.roles.includes('all')) return true
  const rl = role.toLowerCase()
  return e.roles.some(r => rl.includes(r))
}

const EventsPage = React.memo(function EventsPage({
  country, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  onPageChange?: (page: CommandPage) => void
}) {
  const [search,     setSearch]     = useState('')
  const [region,     setRegion]     = useState<string>('')
  const [typeFilter,   setTypeFilter]   = useState<string>('')
  const [filterMyRole, setFilterMyRole] = useState(false)
  const [tab,          setTab]          = useState<'upcoming' | 'past'>('upcoming')
  const [submitName,     setSubmitName]     = useState('')
  const [submitCity,     setSubmitCity]     = useState('')
  const [submitDate,     setSubmitDate]     = useState('')
  const [submitOrg,      setSubmitOrg]      = useState('')
  const [submitUrl,      setSubmitUrl]      = useState('')
  const [submitSent,     setSubmitSent]     = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return INDUSTRY_EVENTS.filter(e => {
      const matchUpcoming = tab === 'upcoming' ? evtIsUpcoming(e) : !evtIsUpcoming(e)
      const matchSearch   = !q || e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) ||
                            e.organizer.toLowerCase().includes(q) || e.focus.some(f => f.toLowerCase().includes(q))
      const matchRegion   = !region       || e.region === region
      const matchType     = !typeFilter   || e.type   === typeFilter
      const matchRole     = !filterMyRole || evtIsRelevant(e, role)
      return matchUpcoming && matchSearch && matchRegion && matchType && matchRole
    })
  }, [search, region, typeFilter, tab, filterMyRole, role])

  // Group by month
  const grouped = useMemo(() => {
    const map: Map<string, CannabisEvent[]> = new Map()
    filtered.forEach(e => {
      const mk = evtMonthKey(e)
      if (!map.has(mk)) map.set(mk, [])
      map.get(mk)!.push(e)
    })
    return Array.from(map.entries())
  }, [filtered])

  const relevantCount = useMemo(() =>
    filtered.filter(e => evtIsRelevant(e, role)).length,
    [filtered, role],
  )

  return (
    <div className="cc-page cc-two-col-page">
      <div className="cc-two-main" style={{ overflowY: 'auto' }}>
        <div className="cc-inner-header">
          <h2>Industry Events Calendar</h2>
          <p>Global cannabis industry events — conferences, expos, workshops, and webinars across all jurisdictions. {relevantCount > 0 && role ? `${relevantCount} relevant to ${role}.` : ''}</p>
        </div>

        {/* Tab + filters row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 24px 0' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            {(['upcoming', 'past'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                background: 'transparent',
                color: tab === t ? '#d4a84b' : 'rgba(245,240,232,.4)',
                borderBottom: tab === t ? '2px solid #d4a84b' : '2px solid transparent',
                marginBottom: '-1px', textTransform: 'capitalize',
              }}>{t === 'upcoming' ? 'Upcoming' : 'Past Events'}</button>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '4px' }}>
            <input
              type="text" placeholder="Search events, locations, organizers…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 200px', background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px',
                color: '#f5f0e8', fontSize: '12px', padding: '7px 12px', outline: 'none',
              }}
            />
            <select value={region} onChange={e => setRegion(e.target.value)} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '8px', color: region ? '#f5f0e8' : 'rgba(245,240,232,.4)',
              fontSize: '12px', padding: '7px 12px', outline: 'none',
            }}>
              <option value="">All regions</option>
              {REGION_OPTIONS.map(r => <option key={r} value={r} style={{ background: '#050c18' }}>{r}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '8px', color: typeFilter ? '#f5f0e8' : 'rgba(245,240,232,.4)',
              fontSize: '12px', padding: '7px 12px', outline: 'none',
            }}>
              <option value="">All types</option>
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#050c18' }}>{v}</option>
              ))}
            </select>
            {role && (
              <button onClick={() => setFilterMyRole(f => !f)} style={{
                padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                border: filterMyRole ? '1px solid rgba(16,185,129,.5)' : '1px solid rgba(255,255,255,.1)',
                background: filterMyRole ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.04)',
                color: filterMyRole ? '#10b981' : 'rgba(245,240,232,.5)',
                fontSize: '11px', fontWeight: filterMyRole ? 700 : 400,
              }}>
                ◎ For {role}s ({INDUSTRY_EVENTS.filter(e => evtIsUpcoming(e) && evtIsRelevant(e, role)).length})
              </button>
            )}
          </div>
        </div>

        {/* Event list */}
        <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {grouped.length === 0 && (
            <div className="cc-empty-state">
              <span>◷</span>
              <p>No events match your filters.</p>
            </div>
          )}

          {grouped.map(([month, events]) => (
            <div key={month}>
              <div style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,240,232,.28)', marginBottom: '10px', fontWeight: 700 }}>
                {month}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map(ev => {
                  const isRelevant = evtIsRelevant(ev, role)
                  const typeColor  = EVENT_TYPE_COLORS[ev.type]
                  return (
                    <div key={ev.id} style={{
                      borderRadius: '10px', overflow: 'hidden',
                      border: ev.featured
                        ? '1px solid rgba(212,168,75,.35)'
                        : isRelevant
                          ? '1px solid rgba(76,175,130,.25)'
                          : '1px solid rgba(255,255,255,.07)',
                      background: ev.featured
                        ? 'rgba(212,168,75,.03)'
                        : isRelevant
                          ? 'rgba(76,175,130,.03)'
                          : 'rgba(255,255,255,.02)',
                    }}>
                      <div style={{ padding: '12px 16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        {/* Date badge */}
                        <div style={{
                          flexShrink: 0, width: '44px', textAlign: 'center',
                          background: 'rgba(255,255,255,.04)', borderRadius: '7px',
                          padding: '6px 4px', border: '1px solid rgba(255,255,255,.08)',
                        }}>
                          <div style={{ fontSize: '17px', color: ev.featured ? '#d4a84b' : '#f5f0e8', fontWeight: 700, lineHeight: 1 }}>
                            {new Date(ev.dateStart + 'T00:00:00').getDate()}
                          </div>
                          <div style={{ fontSize: '8px', color: 'rgba(245,240,232,.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '2px' }}>
                            {new Date(ev.dateStart + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}
                          </div>
                        </div>

                        {/* Main content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Name + badges */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                            <span style={{ fontSize: '13px', color: ev.featured ? '#d4a84b' : '#f5f0e8', fontWeight: 600, lineHeight: 1.3, flex: '1 1 auto' }}>
                              {ev.name}
                            </span>
                            {ev.featured && (
                              <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(212,168,75,.15)', border: '1px solid rgba(212,168,75,.3)', color: '#d4a84b', fontWeight: 700, letterSpacing: '.08em', flexShrink: 0 }}>FEATURED</span>
                            )}
                            {isRelevant && (
                              <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(76,175,130,.15)', border: '1px solid rgba(76,175,130,.3)', color: '#4caf82', fontWeight: 700, letterSpacing: '.08em', flexShrink: 0 }}>RELEVANT</span>
                            )}
                          </div>

                          {/* Location + date + type */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(245,240,232,.55)' }}>
                              {ev.countryIso2 !== 'ONLINE' ? `${flagEmoji(ev.countryIso2)} ` : '🌐 '}{ev.city}
                            </span>
                            <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.28)' }}>·</span>
                            <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.4)' }}>{evtDateRange(ev)}</span>
                            <span style={{ fontSize: '10px', color: 'rgba(245,240,232,.28)' }}>·</span>
                            <span style={{
                              fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600,
                              background: `${typeColor}14`, border: `1px solid ${typeColor}30`, color: typeColor,
                            }}>{EVENT_TYPE_LABELS[ev.type]}</span>
                          </div>

                          {/* Organizer */}
                          <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.38)', marginBottom: '5px' }}>by {ev.organizer}</div>

                          {/* Description */}
                          <p style={{ fontSize: '11px', color: 'rgba(245,240,232,.6)', lineHeight: 1.5, margin: '0 0 7px' }}>{ev.description}</p>

                          {/* Focus tags + CTA */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {ev.focus.slice(0, 5).map(f => (
                              <span key={f} style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '4px', background: 'rgba(91,155,213,.07)', border: '1px solid rgba(91,155,213,.18)', color: '#5b9bd5' }}>{f}</span>
                            ))}
                            {ev.url && (
                              <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: '10px', color: '#d4a84b', textDecoration: 'none', flexShrink: 0 }}>
                                Learn more →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="cc-feed-footer">
          <span>{INDUSTRY_EVENTS.filter(evtIsUpcoming).length} upcoming events · Curated by Harbourview · Updated July 2026</span>
          <button
            className="cc-right-link"
            onClick={() => {
              const el = document.getElementById('cc-events-submit')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          >Submit an event →</button>
        </div>
      </div>

      {/* Right panel */}
      <div className="cc-two-right">
        <div style={{ padding: '16px' }}>

          {/* Role events card */}
          {role && (() => {
            const upcoming  = INDUSTRY_EVENTS.filter(e => evtIsUpcoming(e) && evtIsRelevant(e, role))
            const now       = new Date()
            const thisMonth = upcoming.filter(e => {
              const d = new Date(e.dateStart + 'T00:00:00')
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            const nextEvent = upcoming[0]
            return (
              <div style={{ marginBottom: '18px', padding: '12px', background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#10b981', marginBottom: '8px', fontWeight: 700 }}>FOR {role.toUpperCase()}S</div>
                {[
                  { lbl: 'Upcoming relevant', val: String(upcoming.length) },
                  { lbl: 'This month',         val: String(thisMonth.length) },
                ].map(({ lbl, val }) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(16,185,129,.08)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(245,240,232,.55)' }}>{lbl}</span>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
                {nextEvent && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'rgba(245,240,232,.3)', marginBottom: '3px' }}>NEXT FOR YOU</div>
                    <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.75)', fontWeight: 500, lineHeight: 1.3, marginBottom: '2px' }}>{nextEvent.name}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(245,240,232,.35)' }}>{evtDateRange(nextEvent)} · {nextEvent.city}</div>
                  </div>
                )}
                <button onClick={() => setFilterMyRole(f => !f)} style={{
                  marginTop: '8px', width: '100%', padding: '5px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: filterMyRole ? 'rgba(16,185,129,.2)' : 'rgba(16,185,129,.1)',
                  color: '#10b981', fontSize: '10px', fontWeight: 600,
                }}>
                  {filterMyRole ? '✓ Showing Role Events' : 'Show Role Events'}
                </button>
              </div>
            )
          })()}

          {/* Quick stats */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>EVENTS OVERVIEW</div>
            {[
              { lbl: 'Upcoming events',   val: String(INDUSTRY_EVENTS.filter(evtIsUpcoming).length) },
              { lbl: 'Countries covered', val: String(new Set(INDUSTRY_EVENTS.filter(evtIsUpcoming).map(e => e.countryIso2)).size) },
              { lbl: 'Regions',           val: '6' },
              { lbl: `Relevant to ${role || 'you'}`, val: String(INDUSTRY_EVENTS.filter(e => evtIsUpcoming(e) && evtIsRelevant(e, role)).length) },
            ].map(({ lbl, val }) => (
              <div key={lbl} className="cc-metric-row">
                <span className="cc-metric-name">{lbl}</span>
                <span className="cc-metric-value">{val}</span>
              </div>
            ))}
          </div>

          {/* Next featured */}
          {(() => {
            const next = INDUSTRY_EVENTS.filter(e => evtIsUpcoming(e) && e.featured)[0]
            if (!next) return null
            return (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>NEXT FEATURED EVENT</div>
                <div style={{ padding: '10px 12px', background: 'rgba(212,168,75,.05)', border: '1px solid rgba(212,168,75,.2)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#d4a84b', fontWeight: 600, marginBottom: '3px' }}>{next.name}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(245,240,232,.5)', marginBottom: '3px' }}>{flagEmoji(next.countryIso2)} {next.city} · {evtDateRange(next)}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(245,240,232,.35)' }}>{next.organizer}</div>
                </div>
              </div>
            )
          })()}

          {/* By region breakdown */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>UPCOMING BY REGION</div>
            {REGION_OPTIONS.map(r => {
              const cnt = INDUSTRY_EVENTS.filter(e => evtIsUpcoming(e) && e.region === r).length
              if (cnt === 0) return null
              return (
                <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(245,240,232,.55)' }}>{r}</span>
                  <span style={{ fontSize: '11px', color: '#d4a84b', fontWeight: 600 }}>{cnt}</span>
                </div>
              )
            })}
          </div>

          {/* Cross-page navigation */}
          <div style={{ marginBottom: '18px', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '8px 10px', color: '#10b981', fontSize: '10px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const }}
              onClick={() => onPageChange?.('experts')}>
              ⊛ Find Verified Experts →
            </button>
            <button style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 10px', color: 'rgba(245,240,232,.45)', fontSize: '10px', cursor: 'pointer', textAlign: 'left' as const }}
              onClick={() => onPageChange?.('regulatory')}>
              ◷ Regulatory Watch →
            </button>
          </div>

          {/* Submit event form */}
          <div id="cc-events-submit">
            <div style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', marginBottom: '8px' }}>SUBMIT AN EVENT</div>
            {submitSent ? (
              <div style={{ fontSize: '11px', color: '#4caf82' }}>✓ Thank you — we&apos;ll review and add it to the calendar.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { ph: 'Event name', val: submitName, set: setSubmitName },
                  { ph: 'City / Country', val: submitCity, set: setSubmitCity },
                  { ph: 'Date (e.g. Nov 15–17, 2027)', val: submitDate, set: setSubmitDate },
                  { ph: 'Organizer', val: submitOrg, set: setSubmitOrg },
                  { ph: 'Event URL', val: submitUrl, set: setSubmitUrl },
                ].map(({ ph, val, set }) => (
                  <input
                    key={ph} type="text" placeholder={ph} value={val}
                    onChange={e => set(e.target.value)}
                    style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#f5f0e8', fontSize: '11px', padding: '6px 10px', outline: 'none' }}
                  />
                ))}
                <button
                  onClick={() => { if (submitName && submitCity) setSubmitSent(true) }}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(212,168,75,.15)', color: '#d4a84b', fontSize: '11px', fontWeight: 600, marginTop: '2px' }}
                >
                  Submit Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandCentre({
  signals: ssrSignals,
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
  watchlistAccess,
  evidenceData,
  localIntel,
  liveTiles,
  recentEduModules,
  sourceCoverage,
  registryCoverageSummary,
  jurisdictionPlaybook,
  pathwayMatrix,
  educationTracks = [],
  marketMetrics = [],
  tradeFlows = [],
  professionals = [],
  cannabisOperators = [],
  operatorLicenceMatrix,
  userEmail,
  cultivarPassports = [],
  serviceProviders = [],
  collaborationProjects = [],
  mySubmissions = [],
  hasOrg,
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

  const [country,          setCountry]         = useState(initialCountry)
  const [region,           setRegion]          = useState('')
  const [role,             setRole]            = useState(initialRoleId ?? '')
  const [activePage,       setActivePage]      = useState<CommandPage>(initialPage ?? 'briefing')
  const [paletteOpen,      setPaletteOpen]     = useState(false)
  const [liveCountryIntel, setLiveCountryIntel] = useState<CountryIntelProfile | null>(countryIntel ?? null)
  const [intelLoading,     setIntelLoading]     = useState(false)

  // Live, country-scoped signal feed. Seeds from the SSR list, re-scopes to the
  // selected country, and refreshes on Realtime signal inserts (debounced). All
  // pages below consume this `signals` rather than the static SSR prop.
  const { signals } = useDashboardSignalsRealtime(ssrSignals, country.label)

  useEffect(() => {
    if (countryIntel?.country_code === country.iso2) {
      setLiveCountryIntel(countryIntel ?? null)
      setIntelLoading(false)
      return
    }
    let cancelled = false
    setIntelLoading(true)
    fetch(`/api/country-intel?iso2=${country.iso2}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: CountryIntelProfile | null) => { if (!cancelled) { setLiveCountryIntel(data); setIntelLoading(false) } })
      .catch(() => { if (!cancelled) { setLiveCountryIntel(null); setIntelLoading(false) } })
    return () => { cancelled = true }
  }, [country.iso2, countryIntel])

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

  // Real, data-driven BriefingRoom confidence — computed here where the full
  // per-lane data set is in scope (regulatory sources, market metrics, pathway,
  // local intel, education), rather than from a single completeness bucket.
  const briefingConfidence = useMemo<ConfidenceLane[]>(() => buildConfidenceLanes({
    countryIntel:     liveCountryIntel,
    signals,
    countryLabel:     country.label,
    pathwayData,
    localIntel,
    sourceCoverage,
    marketMetrics,
    eduCategories,
    recentEduModules,
  }), [liveCountryIntel, signals, country.label, pathwayData, localIntel, sourceCoverage, marketMetrics, eduCategories, recentEduModules])

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
  const preferencesLoadedRef = useRef(false)
  useEffect(() => {
    if (!userEmail) return
    fetch('/api/dashboard/preferences')
      .then(r => r.json())
      .then(d => { heatmapLayerRef.current = d?.preferences?.heatmap_layer ?? 'none' })
      .catch(() => { heatmapLayerRef.current = 'none' })
      .finally(() => { preferencesLoadedRef.current = true })
  }, [userEmail])

  const persistDashboardPreferences = useCallback((next: { country_iso2?: string; role_id?: string }) => {
    // Dont persist until the initial GET above has resolved otherwise heatmapLayerRef
    // is still stuck at its none initial value and this PATCH would clobber whatever
    // heatmap_layer the user actually has saved (table default is marketplace_activity).
    if (!userEmail || !preferencesLoadedRef.current) return
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
        return <BriefingRoom country={country} region={region} role={roleLabel} countryIntel={liveCountryIntel} intelLoading={intelLoading} signals={signals} marketMetrics={marketMetrics} tradeFlows={tradeFlows} confidence={briefingConfidence} onCountrySelect={handleCountryChange} onPageChange={handlePageChange} />
      case 'digest':
        return <DigestPageLazy country={country} region={region} role={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
      case 'access-pathway':
        return <AccessPathwayPage country={country} region={region} role={roleLabel} signals={signals} pathwayData={pathwayData} countryIntel={liveCountryIntel} jurisdictionPlaybook={jurisdictionPlaybook} onPageChange={handlePageChange} />
      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} pathwayData={pathwayData} cannabisOperators={cannabisOperators} operatorLicenceMatrix={operatorLicenceMatrix} pipeline={pipeline} onPageChange={handlePageChange} mySubmissions={mySubmissions} userEmail={userEmail} />
      case 'evidence':
        return <EvidenceSourcesPage country={country} region={region} role={roleLabel} evidenceData={evidenceData} pathwayData={pathwayData} professionals={professionals} registryCoverageSummary={registryCoverageSummary} onPageChange={handlePageChange} />
      case 'regulatory':
        return <RegulatoryWatchPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} countryIntel={liveCountryIntel} sourceCoverage={sourceCoverage} onPageChange={handlePageChange} />
      case 'local-intel':
        return <LocalIntelPage country={country} region={region} role={roleLabel} signals={signals} countryIntel={liveCountryIntel} localIntel={localIntel} onPageChange={handlePageChange} />
      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} onPageChange={handlePageChange} />
      case 'watchlist':
        if (watchlistAccess && !watchlistAccess.granted) {
          return <WatchlistUpgradeGate access={watchlistAccess} />
        }
        return <WatchlistPage country={country} region={region} role={roleLabel} watchlistData={watchlistData} />
      case 'settings':
        return <SettingsPage country={country} region={region} role={role} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={handleCountryChange} onRoleChange={handleRoleChange} onPageChange={handlePageChange} />
      case 'genetics':
        return <GeneticsPage country={country} cultivarPassports={cultivarPassports} serviceProviders={serviceProviders} collaborationProjects={collaborationProjects} onPageChange={handlePageChange} />
      case 'clinical':
        return <ClinicalPage countryLabel={country.label} countryIso2={country.iso2} roleLabel={roleLabel} />
      case 'compliance':
        return <CompliancePage country={country} countryIntel={liveCountryIntel} jurisdictionPlaybook={jurisdictionPlaybook} pathwayMatrix={pathwayMatrix} role={roleLabel} onPageChange={handlePageChange} />
      case 'countries':
        return <CountriesDirectoryPage signals={signals} onCountrySelect={handleCountryChange} />
      case 'assistant':
        return <AssistantPage country={country} region={region} role={roleLabel} />
      case 'documents':
        return <DocumentsPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'events':
        return <EventsPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'experts':
        return <ExpertDirectoryPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'banking':
        return <BankingDirectoryPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'prices':
        return <PriceIntelligencePage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'logistics':
        return <LogisticsDirectoryPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'jobs':
        return <JobsBoardPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'notifications':
        return <NotificationCentrePage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'kyb':
        return <KybVerificationPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'insurance':
        return <InsuranceDirectoryPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'licences':
        return <LicenceTrackerPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'trade-calc':
        return <LandedCostPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'organization':
        return <OrganizationPage hasOrg={hasOrg} countryOptions={countryOptions} onPageChange={handlePageChange} />
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







