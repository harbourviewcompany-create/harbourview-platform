import 'server-only'
import type { ProductClass } from '@/lib/intelligence/tradeCorridors'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import type { TimelineEstimate } from './types'

const TIMELINE_DISCLAIMER =
  'Orientation-level timeline only. Critical path is the max of parallel export/import workstreams. Actual approval times vary; verify with competent authorities.'

/**
 * Timeline Engine — sequential vs critical-path estimates from playbook steps.
 */
export async function buildTimelineEstimate(
  originIso2: string,
  destinationIso2: string,
  productClass: ProductClass | 'any' = 'any',
): Promise<TimelineEstimate | null> {
  const plan = await deriveCorridorPlan(originIso2, destinationIso2, { productClass })
  if (!plan) return null

  const exportWeeks = plan.steps
    .filter((s) => s.side === 'export')
    .reduce((acc, s) => acc + (s.estimated_weeks || 0), 0)
  const importWeeks = plan.steps
    .filter((s) => s.side === 'import')
    .reduce((acc, s) => acc + (s.estimated_weeks || 0), 0)

  return {
    originIso2: plan.origin.iso2,
    destinationIso2: plan.destination.iso2,
    sequentialWeeks: plan.totalSequentialWeeks,
    criticalPathWeeks: plan.criticalPathWeeksEstimate,
    exportWeeks,
    importWeeks,
    confidence: plan.trust.confidenceLabel,
    disclaimer: TIMELINE_DISCLAIMER,
  }
}
