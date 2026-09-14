import 'server-only'
import type { ProductClass } from '@/lib/intelligence/tradeCorridors'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import type { CostEstimate } from './types'

const COST_DISCLAIMER =
  'Orientation-level cost ranges only. Not a landed-cost quote. Verify tariffs, fees, and commercial terms with competent authorities and service providers.'

/**
 * Cost Calculator — orientation ranges from jurisdiction playbooks.
 */
export async function buildCostEstimate(
  originIso2: string,
  destinationIso2: string,
  productClass: ProductClass | 'any' = 'any',
): Promise<CostEstimate | null> {
  const plan = await deriveCorridorPlan(originIso2, destinationIso2, { productClass })
  if (!plan) return null

  return {
    originIso2: plan.origin.iso2,
    destinationIso2: plan.destination.iso2,
    currency: 'USD',
    ranges: plan.estimatedCostRanges,
    confidence: plan.trust.confidenceLabel,
    disclaimer: COST_DISCLAIMER,
  }
}
