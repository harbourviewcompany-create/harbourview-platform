import type { GlobeLayerId, GlobeRouterMode } from '@/types/globe-router'

export type DashboardRouteSection =
  | 'overview'
  | 'market-access'
  | 'medical'
  | 'education'
  | 'sources'
  | 'opportunities'
  | 'route-review'

export type DashboardContentStatus =
  | 'public-orientation'
  | 'source-backed'
  | 'review-required'
  | 'admin-private'
  | 'request-only'

export type DashboardAudience =
  | 'operator'
  | 'importer'
  | 'exporter'
  | 'clinician'
  | 'pharmacist'
  | 'quality'
  | 'investor'
  | 'regulator'
  | 'researcher'
  | 'general'

export type DashboardPanelId =
  | 'market_overview'
  | 'regulatory_pathway'
  | 'medical_channel'
  | 'education_library'
  | 'source_methodology'
  | 'commercial_opportunities'
  | 'route_review'

export type DashboardReviewLevel = 'none' | 'editorial' | 'clinical' | 'regulatory' | 'source-review' | 'admin'

export interface DashboardSourceSummary {
  label: string
  status: 'official-source-required' | 'static-orientation' | 'admin-reviewed' | 'source-backed' | 'request-only'
  publicExplanation: string
}

export interface DashboardCountry {
  iso2: string
  slug: string
  name: string
  region: string
  marketModel: 'medical' | 'adult_use' | 'mixed' | 'export' | 'restricted' | 'unknown'
  summary: string
  primaryAudiences: DashboardAudience[]
  layerHighlights: Partial<Record<GlobeLayerId, string>>
  routeReadiness: DashboardContentStatus
  sourceSummary: DashboardSourceSummary
  updatedAt: string
}

export interface DashboardSectionLink {
  section: DashboardRouteSection
  label: string
  href: string
  status: DashboardContentStatus
  description: string
}

export interface DashboardPanel {
  id: DashboardPanelId
  title: string
  eyebrow: string
  status: DashboardContentStatus
  reviewLevel: DashboardReviewLevel
  summary: string
  bullets: string[]
  primaryHref: string
  primaryLabel: string
}

export interface PublicCountryDashboardDTO {
  country: Pick<DashboardCountry, 'iso2' | 'slug' | 'name' | 'region' | 'marketModel' | 'summary' | 'primaryAudiences' | 'routeReadiness' | 'updatedAt'>
  sections: DashboardSectionLink[]
  panels: DashboardPanel[]
  sourceSummary: DashboardSourceSummary
  boundaryNotice: string
}

export interface GlobeDashboardRouteContext {
  countryIso2?: string
  countrySlug?: string
  mode?: GlobeRouterMode
  source?: 'globe' | 'directory' | 'dashboard'
  layerId?: GlobeLayerId
}
