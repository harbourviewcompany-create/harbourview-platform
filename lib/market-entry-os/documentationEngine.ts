import 'server-only'
import type { ProductClass } from '@/lib/intelligence/tradeCorridors'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import type { DocumentationPack } from './types'

/**
 * Documentation Engine — per-corridor checklist from playbook + base docs.
 */
export async function buildDocumentationPack(
  originIso2: string,
  destinationIso2: string,
  productClass: ProductClass | 'any' = 'any',
): Promise<DocumentationPack | null> {
  const plan = await deriveCorridorPlan(originIso2, destinationIso2, { productClass })
  if (!plan) return null

  const required = plan.documentationChecklist
    .filter((d) => d.required)
    .map((d) => ({ id: d.id, side: d.side, label: d.label, notes: d.notes }))
  const optional = plan.documentationChecklist
    .filter((d) => !d.required)
    .map((d) => ({ id: d.id, side: d.side, label: d.label, notes: d.notes }))

  return {
    originIso2: plan.origin.iso2,
    destinationIso2: plan.destination.iso2,
    productClass: plan.productClass,
    required,
    optional,
    orientationOnly: plan.trust.confidenceLabel === 'orientation',
  }
}
