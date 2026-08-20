'use client'
import '../CommandCentre.css'

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
import { ListingDetailModal } from '../ListingDetailModal'
import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'
import type { UserTier } from '@/lib/stripe/tier'
import { DesktopDecisionIntelBridge } from '@/components/dashboard/DesktopDecisionIntelBridge'
import { TIER_DISPLAY } from '@/lib/stripe/tierDisplay'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
import { CultivarPassportModal } from '@/components/dashboard/CultivarPassportModal'
import { MyBriefingsPanel } from '@/components/dashboard/MyBriefingsPanel'
import { WantedDetailModal } from '../WantedDetailModal'
import { GeneticsRequestModal } from '../GeneticsRequestModal'
import { GeneticsProgramModal } from '../GeneticsProgramModal'
import { QuoteModal } from '../QuoteModal'
import { MySubmissionsPanel } from '../MySubmissionsPanel'
import { ConsumablesRequestModal } from '../ConsumablesRequestModal'
import { DealRoomsPanel as DealRoomsSidebarWidget } from '../DealRoomsPanel'
import { AssistantPage } from '../pages/AssistantPage'
import ClinicalPage from '../pages/ClinicalPage'
import ClinicalEvidenceCommandPage from '../pages/ClinicalEvidenceCommandPage'
import ClinicalCommandCase from '../ClinicalCommandCase'
import type { CommandPage, MarketView, MarketRow, DashboardMarketplaceRows } from './types'
import { NAV_SECTIONS, NAV_ITEMS_FLAT, BRIEFING_ROLE_MODULES } from './navConfig'
import { CORRIDOR_BANKING, CORRIDOR_AUTHORITY, CORRIDOR_COSTS } from '../data/corridorIntel'
import { INDUSTRY_EVENTS, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, type CannabisEvent } from '../data/industryEvents'
import { BANKING_PROVIDERS, PROVIDER_TYPE_LABELS, PROVIDER_TYPE_COLORS, STANCE_LABELS, STANCE_COLORS, type BankingProvider } from '../data/bankingProviders'
import { PRICE_BENCHMARKS, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_ICONS, TIER_LABELS, TIER_COLORS, type PriceBenchmark } from '../data/priceIntelligence'
import { LOGISTICS_PROVIDERS, LOGISTICS_TYPE_LABELS, LOGISTICS_TYPE_COLORS, type LogisticsType } from '../data/logisticsProviders'
import { JOB_LISTINGS, JOB_TYPE_LABELS, JOB_TYPE_COLORS, JOB_SECTOR_LABELS, type JobType, type JobSector } from '../data/jobsBoard'
import { INSURANCE_PROVIDERS, INSURANCE_LINE_LABELS, INSURANCE_ROLE_LABELS, INSURANCE_ROLE_COLORS, type InsuranceProviderRole, type InsuranceLineType, type InsuranceProvider } from '../data/insuranceProviders'
import { EXPORTER_ORIGINS, DESTINATION_MARKETS, FREIGHT_CORRIDORS, LANDED_PRODUCT_LABELS, calcLandedCost, type LandedProductType } from '../data/landedCostData'
import { WatchlistPage } from '../pages/WatchlistPage'

import {
  BriefingRoom, SignalsPage, MarketplacePage, EducationPage, RegulatoryWatchPage,
  OrganizationPage, SettingsPage,
} from './pages/bundleA'
import {
  LocalIntelPage, AccessPathwayPage, EvidenceSourcesPage, CommandPalette, GeneticsPage,
} from './pages/bundleB'
import {
  CompliancePage, CountriesDirectoryPage, DocumentsPage, ExpertDirectoryPage,
  BankingDirectoryPage, NotificationCentrePage, KybVerificationPage, PriceIntelligencePage,
  LogisticsDirectoryPage, JobsBoardPage, InsuranceDirectoryPage, LicenceTrackerPage,
  LandedCostPage, EventsPage,
} from './pages/bundleC'

const DigestPageLazy = dynamic(() => import('../pages/DigestPage').then(m => m.DigestPage))

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

const FORMAT_STATUS_COLOR: Record<string, string> = {
  permitted: '#5fb87a',
  restricted: '#d4a84b',
  prohibited: '#e05555',
  unclear: 'rgba(245,240,232,.4)',
}

export default function CommandCentreRoot({
  signals: ssrSignals,
  digestSignals,
  digestWindow,
  eduCategories,
  countryEducationOverlays,
  initialCountryIso2,
  initialRoleId,
  initialPage,
  userTier = 'free',
  openSignalsSearch = false,
  decisionIntelAccess,
  wantedCount = 0,
  marketplaceRows,
  pipeline,
  wantedListings = [],
  countryIntel,
  pathwayData,
  watchlistData,
  watchlistAccess,
  evidenceData,
  liveTiles,
  recentEduModules,
  sourceCoverage,
  registryCoverageSummary,
  jurisdictionPlaybook,
  pathwayMatrix,
  educationTracks,
  marketMetrics,
  tradeFlows,
  professionals,
  cannabisOperators,
  operatorLicenceMatrix,
  userEmail,
  cultivarPassports,
  serviceProviders,
  collaborationProjects,
  mySubmissions,
  hasOrg,
  localIntel,
}: any) {
  const router = useRouter()
  const [activePage, setActivePage] = useState<CommandPage>((initialPage as CommandPage) || 'briefing')
  const [country, setCountry] = useState(() => {
    const iso = (initialCountryIso2 || 'US').toUpperCase()
    return COUNTRIES.find(c => c.iso2 === iso) || COUNTRIES[0]
  })
  const [role, setRole] = useState(initialRoleId || 'Operator')
  const [region, setRegion] = useState('')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const roleLabel = role
  const signals = ssrSignals || []
  const liveCountryIntel = countryIntel

  const handlePageChange = useCallback((page: CommandPage) => {
    setActivePage(page)
  }, [])
  const handleCountryChange = useCallback((iso2: string) => {
    const next = COUNTRIES.find(c => c.iso2 === iso2)
    if (next) setCountry(next)
  }, [])
  const handleRoleChange = useCallback((r: string) => setRole(r), [])

  const countryOptions = useMemo(() => COUNTRIES.map(c => ({ value: c.iso2, label: c.label })), [])
  const roleOptions = useMemo(() => Object.keys(ROLE_PROFILES || {}).map(k => ({ value: k, label: k })), [])

  const orderedNavFlat = useMemo(() => {
    const rank = getRoleNavRank?.(role) || {}
    return [...NAV_ITEMS_FLAT].sort((a, b) => (rank[a.id] ?? 99) - (rank[b.id] ?? 99))
  }, [role])

  const renderPage = () => {
    switch (activePage) {
      case 'briefing':
        return <BriefingRoom country={country} region={region} role={roleLabel} countryIntel={liveCountryIntel} signals={signals} onPageChange={handlePageChange} />
      case 'digest':
        return <DigestPageLazy country={country} region={region} role={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
      case 'access-pathway':
        return <AccessPathwayPage country={country} region={region} role={roleLabel} pathwayData={pathwayData} pathwayMatrix={pathwayMatrix} onPageChange={handlePageChange} />
      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} pipeline={pipeline} onPageChange={handlePageChange} />
      case 'evidence':
        return <EvidenceSourcesPage country={country} region={region} role={roleLabel} evidenceData={evidenceData} sourceCoverage={sourceCoverage} registryCoverageSummary={registryCoverageSummary} onPageChange={handlePageChange} />
      case 'education':
        return <EducationPage country={country} region={region} role={roleLabel} eduCategories={eduCategories} liveTiles={liveTiles} recentEduModules={recentEduModules} educationTracks={educationTracks} countryEducationOverlays={countryEducationOverlays} signals={signals} onPageChange={handlePageChange} />
      case 'regulatory':
        return <RegulatoryWatchPage country={country} region={region} role={roleLabel} signals={signals} onPageChange={handlePageChange} />
      case 'local-intel':
        return <LocalIntelPage country={country} region={region} role={roleLabel} signals={signals} countryIntel={liveCountryIntel} localIntel={localIntel} onPageChange={handlePageChange} />
      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} digestSignals={digestSignals} watchlistData={watchlistData} onPageChange={handlePageChange} initialShowSearch={openSignalsSearch} decisionIntelAccess={decisionIntelAccess} />
      case 'watchlist':
        return <WatchlistPage country={country} region={region} role={roleLabel} watchlistData={watchlistData} />
      case 'settings':
        return <SettingsPage country={country} region={region} role={role} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={handleCountryChange} onRoleChange={handleRoleChange} onPageChange={handlePageChange} userTier={userTier} />
      case 'genetics':
        return <GeneticsPage country={country} cultivarPassports={cultivarPassports} serviceProviders={serviceProviders} collaborationProjects={collaborationProjects} onPageChange={handlePageChange} />
      case 'clinical':
        return <ClinicalCommandCase countryIso2={country.iso2} roleLabel={roleLabel} />
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
      case 'talent':
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

  return (
    <div className="cc-app">
      <header className="cc-header">
        <div className="cc-header-left">
          <div className="cc-wordmark">
            <span className="cc-wordmark-main">HARBOURVIEW</span>
            <span className="cc-wordmark-sub">Command Centre</span>
          </div>
        </div>
        <div className="cc-header-right">
          <button type="button" className="cc-palette-btn" onClick={() => setPaletteOpen(true)} aria-label="Command palette">⌘K</button>
          <span className="cc-header-country">{flagEmoji?.(country.iso2)} {country.label}</span>
          <span className="cc-header-role">{roleLabel}</span>
        </div>
      </header>
      <div className="cc-body">
        <nav className="cc-sidebar" aria-label="Command Centre navigation">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="cc-nav-section">
              {section.label && <div className="cc-nav-section-label">{section.label}</div>}
              {section.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`cc-nav-item${activePage === item.id ? ' active' : ''}`}
                  onClick={() => handlePageChange(item.id)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <main className="cc-main">{renderPage()}</main>
      </div>
      <nav className="cc-mob-nav" aria-label="Mobile navigation">
        {orderedNavFlat.slice(0, 5).map(item => (
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
