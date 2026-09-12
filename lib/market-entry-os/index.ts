import 'server-only'
import {
  APPLICABLE_TRADE_JURISDICTIONS,
  type ProductClass,
  type ApplicableJurisdiction,
} from '@/lib/intelligence/tradeCorridors'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import { buildDocumentationPack } from './documentationEngine'
import { buildCostEstimate } from './costEngine'
import { buildTimelineEstimate } from './timelineEngine'
import type {
  MarketEntryPlan,
  MarketEntryRegion,
  RegionCoverageSummary,
} from './types'

export type { MarketEntryPlan, MarketEntryRegion, RegionCoverageSummary, DocumentationPack, CostEstimate, TimelineEstimate } from './types'
export { buildDocumentationPack } from './documentationEngine'
export { buildCostEstimate } from './costEngine'
export { buildTimelineEstimate } from './timelineEngine'

function regionOf(iso2: string): MarketEntryRegion {
  const j = APPLICABLE_TRADE_JURISDICTIONS.find((x) => x.iso2 === iso2.toUpperCase())
  return (j?.region as MarketEntryRegion) ?? 'global'
}

/**
 * Full Market Entry plan: workflow + docs + cost + timeline for a corridor.
 * Returns null if either jurisdiction lacks a playbook.
 */
export async function buildMarketEntryPlan(
  originIso2: string,
  destinationIso2: string,
  productClass: ProductClass | 'any' = 'any',
): Promise<MarketEntryPlan | null> {
  const [plan, documentation, cost, timeline] = await Promise.all([
    deriveCorridorPlan(originIso2, destinationIso2, { productClass }),
    buildDocumentationPack(originIso2, destinationIso2, productClass),
    buildCostEstimate(originIso2, destinationIso2, productClass),
    buildTimelineEstimate(originIso2, destinationIso2, productClass),
  ])

  if (!plan || !documentation || !cost || !timeline) return null

  return {
    plan,
    documentation,
    cost,
    timeline,
    region: {
      origin: regionOf(plan.origin.iso2),
      destination: regionOf(plan.destination.iso2),
    },
  }
}

/** Region-level coverage over applicable trade jurisdictions (not full UN list). */
export function getRegionCoverage(): RegionCoverageSummary[] {
  const regions: MarketEntryRegion[] = ['europe', 'americas', 'mena', 'africa', 'apac']
  return regions.map((region) => {
    const list = APPLICABLE_TRADE_JURISDICTIONS.filter((j) => j.region === region)
    return {
      region,
      jurisdictionCount: list.length,
      originCount: list.filter((j) => j.role === 'origin' || j.role === 'both').length,
      destinationCount: list.filter((j) => j.role === 'destination' || j.role === 'both').length,
      iso2List: list.map((j) => j.iso2).sort(),
    }
  })
}

export function listAllApplicableJurisdictions(): ApplicableJurisdiction[] {
  return [...APPLICABLE_TRADE_JURISDICTIONS].sort((a, b) => a.name.localeCompare(b.name))
}

export function getCoverageStats() {
  const jurisdictions = APPLICABLE_TRADE_JURISDICTIONS
  const origins = jurisdictions.filter((j) => j.role === 'origin' || j.role === 'both')
  const destinations = jurisdictions.filter((j) => j.role === 'destination' || j.role === 'both')
  const corridorPairs = origins.length * destinations.length - jurisdictions.filter((j) => j.role === 'both').length
  return {
    jurisdictionCount: jurisdictions.length,
    originCount: origins.length,
    destinationCount: destinations.length,
    approxCorridorPairs: corridorPairs,
    regions: getRegionCoverage(),
  }
}
