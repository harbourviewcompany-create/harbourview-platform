import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import { APPLICABLE_TRADE_JURISDICTIONS, type ProductClass } from '@/lib/intelligence/tradeCorridors'
import { buildEvidenceSnapshot } from './evidence'
import { buildExecutionGraph } from './executionGraph'
import type {
  CostComponent,
  CostEstimate,
  CorridorDecisionRecord,
  ExecutionGraph,
  MarketEntryInput,
  MarketEntryPlan,
  ReadinessGate,
} from './types'

const SUPPORTED_PRODUCTS: Array<ProductClass | 'any'> = [
  'any',
  'flower',
  'extract',
  'finished_product',
  'starting_material',
]

function normaliseIso2(value: string): string | null {
  const code = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

function jurisdictionRoleAllows(code: string, side: 'origin' | 'destination'): boolean {
  const jurisdiction = APPLICABLE_TRADE_JURISDICTIONS.find((item) => item.iso2 === code)
  if (!jurisdiction) return false
  return jurisdiction.role === 'both' || jurisdiction.role === side
}

function parseNumericRange(range: string | null): { low: number; high: number; currency: string } | null {
  if (!range) return null
  const currencyMatch = range.match(/(?:^|\s)(USD|EUR|CAD|GBP|AUD|NZD|CHF|JPY)(?:\s|$)/i)
  const currency = currencyMatch?.[1]?.toUpperCase() ?? 'USD'
  const values = [...range.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((match) => Number(match[0].replace(/,/g, ''))).filter(Number.isFinite)
  if (values.length < 1) return null
  const low = values[0]
  const high = values[1] ?? low
  if (low < 0 || high < low) return null
  return { low, high, currency }
}

function buildCosts(plan: Awaited<ReturnType<typeof deriveCorridorPlan>>): CostEstimate {
  if (!plan) {
    return {
      currency: 'USD',
      components: [],
      knownLow: null,
      knownHigh: null,
      unknownCount: 1,
      disclaimer: 'No cost estimate is available without a valid corridor plan.',
    }
  }

  const components: CostComponent[] = plan.estimatedCostRanges.map((entry) => {
    const parsed = parseNumericRange(entry.range)
    return {
      id: `jurisdiction-${entry.country_iso2}`,
      category: 'unknown',
      side: entry.country_iso2 === plan.origin.iso2 ? 'export' : 'import',
      amountLow: parsed?.low ?? null,
      amountHigh: parsed?.high ?? null,
      currency: parsed?.currency ?? null,
      basis: entry.range
        ? 'Editorial jurisdiction playbook range; not a landed-cost quotation.'
        : 'No structured cost range published.',
      evidenceIds: [],
      confidence: 'partial',
    }
  })

  const currencies = [...new Set(components.map((component) => component.currency).filter(Boolean))]
  const known = components.filter((component) => component.amountLow !== null && component.amountHigh !== null && component.currency === currencies[0])
  return {
    currency: currencies.length === 1 ? currencies[0]! : 'USD',
    components,
    knownLow: known.length ? known.reduce((sum, component) => sum + component.amountLow!, 0) : null,
    knownHigh: known.length ? known.reduce((sum, component) => sum + component.amountHigh!, 0) : null,
    unknownCount: components.filter((component) => component.amountLow === null || component.currency === null).length,
    disclaimer: 'Planning estimate only. It excludes any unstructured or unverified licensing, testing, customs, duties, brokerage, logistics, insurance, tax, facility, and professional-service costs.',
  }
}

function buildDecision(
  input: MarketEntryInput,
  plan: NonNullable<Awaited<ReturnType<typeof deriveCorridorPlan>>>,
  evidence: ReturnType<typeof buildEvidenceSnapshot>,
  execution: ExecutionGraph,
): CorridorDecisionRecord {
  const gates: ReadinessGate[] = []
  const originEvidence = evidence.references.find((ref) => ref.jurisdictionIso2 === input.originIso2)
  const destinationEvidence = evidence.references.find((ref) => ref.jurisdictionIso2 === input.destinationIso2)
  const evidenceIds = [originEvidence?.id, destinationEvidence?.id].filter(Boolean) as string[]

  const originGate: ReadinessGate = {
    id: 'origin-role',
    label: 'Origin trade role',
    state: jurisdictionRoleAllows(input.originIso2, 'origin') ? 'pass' : 'fail',
    reason: jurisdictionRoleAllows(input.originIso2, 'origin') ? 'Jurisdiction is configured as an origin or both.' : 'Jurisdiction is not configured as an eligible origin in the current trade matrix.',
    evidenceIds: [],
  }
  const destinationGate: ReadinessGate = {
    id: 'destination-role',
    label: 'Destination trade role',
    state: jurisdictionRoleAllows(input.destinationIso2, 'destination') ? 'pass' : 'fail',
    reason: jurisdictionRoleAllows(input.destinationIso2, 'destination') ? 'Jurisdiction is configured as a destination or both.' : 'Jurisdiction is not configured as an eligible destination in the current trade matrix.',
    evidenceIds: [],
  }
  const productGate: ReadinessGate = {
    id: 'product-compatibility',
    label: 'Product compatibility',
    state: plan.corridorRef || input.productClass === 'any' ? 'pass' : 'fail',
    reason: plan.corridorRef || input.productClass === 'any' ? 'The selected product is represented by the corridor model.' : 'The selected product is not represented by the tracked corridor product matrix.',
    evidenceIds: [],
  }
  const evidenceGate: ReadinessGate = {
    id: 'primary-source-evidence',
    label: 'Primary-source evidence',
    state: evidence.references.every((ref) => ref.status === 'verified') ? 'pass' : evidence.references.some((ref) => ref.status === 'stale' || ref.status === 'unverified') ? 'fail' : 'warn',
    reason: evidence.references.every((ref) => ref.status === 'verified')
      ? 'All jurisdiction claims have verified source-level evidence.'
      : 'The current playbook contract exposes verification timestamps but no attached primary-source claim URLs/effective dates; this plan is not executable.',
    evidenceIds,
  }
  const cycleGate: ReadinessGate = {
    id: 'execution-graph',
    label: 'Execution dependency graph',
    state: execution.cycleDetected ? 'fail' : 'pass',
    reason: execution.cycleDetected ? 'A dependency cycle was detected.' : 'Execution tasks form an acyclic dependency graph.',
    evidenceIds: [],
  }
  gates.push(originGate, destinationGate, productGate, evidenceGate, cycleGate)

  const blockers = gates.filter((gate) => gate.state === 'fail').map((gate) => gate.reason)
  const warnings = gates.filter((gate) => gate.state === 'warn').map((gate) => gate.reason)
  const executable = blockers.length === 0 && warnings.length === 0

  return {
    decision: executable ? 'permitted' : blockers.some((reason) => reason.includes('not represented')) ? 'unknown' : 'conditional',
    executable,
    gates,
    blockers,
    warnings,
  }
}

export async function buildMarketEntryPlan(
  rawInput: MarketEntryInput,
  options: { now?: Date; freshnessDays?: number } = {},
): Promise<MarketEntryPlan | null> {
  const originIso2 = normaliseIso2(rawInput.originIso2)
  const destinationIso2 = normaliseIso2(rawInput.destinationIso2)
  const productClass = SUPPORTED_PRODUCTS.includes(rawInput.productClass) ? rawInput.productClass : null
  if (!originIso2 || !destinationIso2 || originIso2 === destinationIso2 || !productClass) return null

  const input: MarketEntryInput = {
    originIso2,
    destinationIso2,
    productClass,
    requestedAt: rawInput.requestedAt,
  }
  const plan = await deriveCorridorPlan(originIso2, destinationIso2, { productClass })
  if (!plan) return null

  const evidence = buildEvidenceSnapshot(plan, options)
  const execution = buildExecutionGraph(plan)
  const decision = buildDecision(input, plan, evidence, execution)
  const costs = buildCosts(plan)
  const generatedAt = (options.now ?? new Date()).toISOString()
  const reproducibilityKey = createHash('sha256')
    .update(JSON.stringify({ input, evidence: evidence.snapshotId, planTrust: plan.trust, execution }))
    .digest('hex')

  return {
    planVersion: 2,
    planId: randomUUID(),
    input,
    status: decision.executable ? 'ready' : decision.blockers.length ? 'blocked' : 'orientation',
    generatedAt,
    decision,
    evidence,
    execution,
    documentation: {
      required: plan.documentationChecklist.filter((item) => item.required).map((item) => item.label),
      optional: plan.documentationChecklist.filter((item) => !item.required).map((item) => item.label),
      orientationOnly: !decision.executable,
    },
    costs,
    notes: plan.notes,
    sourceTrust: plan.trust.confidenceLabel,
    reproducibilityKey,
  }
}

export function listAllApplicableJurisdictions() {
  return [...APPLICABLE_TRADE_JURISDICTIONS].sort((a, b) => a.name.localeCompare(b.name))
}

export function getCoverageStats() {
  const origins = APPLICABLE_TRADE_JURISDICTIONS.filter((item) => item.role === 'origin' || item.role === 'both')
  const destinations = APPLICABLE_TRADE_JURISDICTIONS.filter((item) => item.role === 'destination' || item.role === 'both')
  return {
    jurisdictions: APPLICABLE_TRADE_JURISDICTIONS.length,
    origins: origins.length,
    destinations: destinations.length,
    directedPairs: origins.reduce((count, origin) => count + destinations.filter((destination) => destination.iso2 !== origin.iso2).length, 0),
    products: SUPPORTED_PRODUCTS,
  }
}
