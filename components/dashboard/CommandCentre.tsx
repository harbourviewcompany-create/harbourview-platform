'use client'
import './CommandCentre.css'
import './market/Market.css'
import './market/DashboardMetallicGold.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, WatchlistData, PathwayData, SourceCoverageRow, RegistryCoverageSummary, LocalIntelData, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator, CountryEducationOverlay, MySubmission } from '@/lib/dashboard/dashboardLiveData'
import { buildConfidenceLanes, overallConfidence as computeOverallConfidence, type ConfidenceLane } from '@/lib/dashboard/confidenceScoring'
import { useDashboardSignalsRealtime } from '@/components/dashboard/useDashboardSignalsRealtime'
import type { DashboardSignal, DigestWindow } from '@/lib/dashboard/dashboardShared'
import type { DashboardMarketplaceProjection } from '@/lib/dashboard/marketplaceMediaProjection'
import MarketplaceMediaStatus from './MarketplaceMediaStatus'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import { complianceRegions } from '@/lib/compliance/regions'
import { formatOpportunityScore } from '@/lib/dashboard/opportunityScore'
import { getModuleContent } from '@/lib/dashboard/educationModuleContent'
import { getRoleNavRank } from '@/lib/dashboard/roleNavPriority'
const ListingDetailModal = dynamic(() => import('./ListingDetailModal').then(m => ({ default: m.ListingDetailModal })))
const SignalSemanticSearch = dynamic(() => import('@/components/dashboard/SignalSemanticSearch'))
import type { UserTier } from '@/lib/stripe/tier'
const DesktopDecisionIntelBridge = dynamic(() => import('@/components/dashboard/DesktopDecisionIntelBridge').then(m => ({ default: m.DesktopDecisionIntelBridge })))
import { TIER_DISPLAY } from '@/lib/stripe/tierDisplay'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
const CultivarPassportModal = dynamic(() => import('@/components/dashboard/CultivarPassportModal').then(m => ({ default: m.CultivarPassportModal })))
const MyBriefingsPanel = dynamic(() => import('@/components/dashboard/MyBriefingsPanel').then(m => ({ default: m.MyBriefingsPanel })))
const WantedDetailModal = dynamic(() => import('./WantedDetailModal').then(m => ({ default: m.WantedDetailModal })))
const GeneticsRequestModal = dynamic(() => import('./GeneticsRequestModal').then(m => ({ default: m.GeneticsRequestModal })))
const GeneticsProgramModal = dynamic(() => import('./GeneticsProgramModal').then(m => ({ default: m.GeneticsProgramModal })))
const QuoteModal = dynamic(() => import('./QuoteModal').then(m => ({ default: m.QuoteModal })))
const MySubmissionsPanel = dynamic(() => import('./MySubmissionsPanel').then(m => ({ default: m.MySubmissionsPanel })))
const ConsumablesRequestModal = dynamic(() => import('./ConsumablesRequestModal').then(m => ({ default: m.ConsumablesRequestModal })))
const DealRoomsSidebarWidget = dynamic(() => import('./DealRoomsPanel').then(m => ({ default: m.DealRoomsPanel })))
const AssistantPage = dynamic(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })))
const ClinicalEvidenceCommandPage = dynamic(() => import('./pages/ClinicalEvidenceCommandPage'))
const CorridorEvidenceFlagsFromFixtures = dynamic(
  () => import('@/components/clinical/CorridorEvidenceFlagsPanel').then(m => ({ default: m.CorridorEvidenceFlagsFromFixtures })),
  { ssr: false, loading: () => null },
)
import { CORRIDOR_BANKING, CORRIDOR_AUTHORITY, CORRIDOR_COSTS } from './data/corridorIntel'
import { INDUSTRY_EVENTS, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, type CannabisEvent } from './data/industryEvents'
import { BANKING_PROVIDERS, PROVIDER_TYPE_LABELS, PROVIDER_TYPE_COLORS, STANCE_LABELS, STANCE_COLORS, type BankingProvider } from './data/bankingProviders'
import { PRICE_BENCHMARKS, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_ICONS, TIER_LABELS, TIER_COLORS, type PriceBenchmark } from './data/priceIntelligence'
import { LOGISTICS_PROVIDERS, LOGISTICS_TYPE_LABELS, LOGISTICS_TYPE_COLORS, type LogisticsType } from './data/logisticsProviders'
import { JOB_LISTINGS, JOB_TYPE_LABELS, JOB_TYPE_COLORS, JOB_SECTOR_LABELS, type JobType, type JobSector } from './data/jobsBoard'
import { INSURANCE_PROVIDERS, INSURANCE_LINE_LABELS, INSURANCE_ROLE_LABELS, INSURANCE_ROLE_COLORS, type InsuranceProviderRole, type InsuranceLineType, type InsuranceProvider } from './data/insuranceProviders'
import { EXPORTER_ORIGINS, DESTINATION_MARKETS, FREIGHT_CORRIDORS, LANDED_PRODUCT_LABELS, calcLandedCost, type LandedProductType } from './data/landedCostData'
const WatchlistPage = dynamic(() => import('./pages/WatchlistPage').then(m => ({ default: m.WatchlistPage })))
import { WatchlistUpgradeGate } from './WatchlistUpgradeGate'
import type { FeatureAccess } from '@/lib/billing/entitlements'
const DigestPageLazy = dynamic(() => import('./pages/DigestPage').then(m => m.DigestPage))
import { GlobeProvider } from '@/components/globe/GlobeProvider'
const DealRoomsPanel = dynamic(() => import('./pages/DealRoomsPanel').then(m => ({ default: m.DealRoomsPanel })))
const DynamicMarketplaceIntakeForm = dynamic(() => import('@/components/marketplace/DynamicMarketplaceIntakeForm').then(m => ({ default: m.DynamicMarketplaceIntakeForm })))
const QuoteRequestForm = dynamic(() => import('@/app/marketplace/quote/QuoteRequestForm'))
const MyListingsClient = dynamic(() => import('@/app/marketplace/my-listings/MyListingsClient').then(m => ({ default: m.MyListingsClient })))

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
