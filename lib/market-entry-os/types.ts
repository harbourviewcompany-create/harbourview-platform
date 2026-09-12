/**
 * Market Entry OS — execution-layer types
 * Composes Workflow, Documentation, Cost, and Timeline engines.
 */

import type { ProductClass } from '@/lib/intelligence/tradeCorridors'
import type { CorridorPlan } from '@/lib/intelligence/workflowEngine'

export type MarketEntryRegion =
  | 'europe'
  | 'americas'
  | 'mena'
  | 'africa'
  | 'apac'
  | 'global'

export type DocumentationPack = {
  originIso2: string
  destinationIso2: string
  productClass: ProductClass | 'any'
  required: { id: string; side: 'export' | 'import'; label: string; notes?: string }[]
  optional: { id: string; side: 'export' | 'import'; label: string; notes?: string }[]
  orientationOnly: boolean
}

export type CostEstimate = {
  originIso2: string
  destinationIso2: string
  currency: 'USD'
  ranges: { country_iso2: string; range: string | null }[]
  confidence: 'orientation' | 'partial' | 'reviewed'
  disclaimer: string
}

export type TimelineEstimate = {
  originIso2: string
  destinationIso2: string
  sequentialWeeks: number
  criticalPathWeeks: number
  exportWeeks: number
  importWeeks: number
  confidence: 'orientation' | 'partial' | 'reviewed'
  disclaimer: string
}

export type MarketEntryPlan = {
  plan: CorridorPlan
  documentation: DocumentationPack
  cost: CostEstimate
  timeline: TimelineEstimate
  region: {
    origin: MarketEntryRegion
    destination: MarketEntryRegion
  }
}

export type RegionCoverageSummary = {
  region: MarketEntryRegion
  jurisdictionCount: number
  originCount: number
  destinationCount: number
  iso2List: string[]
}
