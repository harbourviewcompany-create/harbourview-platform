import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import { APPLICABLE_TRADE_JURISDICTIONS, type ProductClass } from '@/lib/intelligence/tradeCorridors'
import { buildEvidenceSnapshot } from './evidence'
import { buildExecutionGraph } from './executionGraph'
import type { CostComponent, CostEstimate, CorridorDecisionRecord, ExecutionGraph, MarketEntryInput, MarketEntryPlan, ReadinessGate } from './types'

const SUPPORTED_PRODUCTS: Array<ProductClass | 'any'> = ['any', 'flower', 'extract', 'finished_product', 'starting_material']

function normaliseIso2(value: string): string | null { const code = value.trim().toUpperCase(); return /^[A-Z]{2}$/.test(code) ? code : null }
function jurisdictionRoleAllows(code: string, side: 'origin' | 'destination'): boolean { const jurisdiction = APPLICABLE_TRADE_JURISDICTIONS.find((item) => item.iso2 === code); return Boolean(jurisdiction && (jurisdiction.role === 'both' || jurisdiction.role === side)) }
function parseNumericRange(range: string | null): { low: number; high: number; currency: string } | null {
  if (!range) return null
  const currency = (range.match(/(?:^|\s)(USD|EUR|CAD|GBP|AUD|NZD|CHF|JPY)(?:\s|$)/i)?.[1] ?? 'USD').toUpperCase()
  const values = [...range.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((match) => Number(match[0].replace(/,/g, ''))).filter(Number.isFinite)
  if (!values.length) return null
  const low = values[0]; const high = values[1] ?? low
  return low >= 0 && high >= low ? { low, high, currency } : null
}
function buildCosts(plan: Awaited<ReturnType<typeof deriveCorridorPlan>>): CostEstimate {
  if (!plan) return { currency: 'USD', components: [], knownLow: null, knownHigh: null, unknownCount: 1, disclaimer: 'No cost estimate is available without a valid corridor plan.' }
  const components: CostComponent[] = plan.estimatedCostRanges.map((entry) => { const parsed = parseNumericRange(entry.range); return { id: `jurisdiction-${entry.country_iso2}`, category: 'unknown', side: entry.country_iso2 === plan.origin.iso2 ? 'export' : 'import', amountLow: parsed?.low ?? null, amountHigh: parsed?.high ?? null, currency: parsed?.currency ?? null, basis: entry.range ? 'Editorial jurisdiction playbook range; not a landed-cost quotation.' : 'No structured cost range published.', evidenceIds: [], confidence: 'partial' } })
  const currencies = [...new Set(components.map((c) => c.currency).filter(Boolean))]
  const known = components.filter((c) => c.amountLow !== null && c.amountHigh !== null && c.currency === currencies[0])
  return { currency: currencies.length === 1 ? currencies[0]! : 'USD', components, knownLow: known.length ? known.reduce((s, c) => s + c.amountLow!, 0) : null, knownHigh: known.length ? known.reduce((s, c) => s + c.amountHigh!, 0) : null, unknownCount: components.filter((c) => c.amountLow === null || c.currency === null).length, disclaimer: 'Planning estimate only. It excludes unstructured or unverified licensing, testing, customs, duties, brokerage, logistics, insurance, tax, facility, and professional-service costs.' }
}
function buildDecision(input: MarketEntryInput, plan: NonNullable<Awaited<ReturnType<typeof deriveCorridorPlan>>>, evidence: Awaited<ReturnType<typeof buildEvidenceSnapshot>>, execution: ExecutionGraph): CorridorDecisionRecord {
  const originAllowed = jurisdictionRoleAllows(input.originIso2, 'origin'); const destinationAllowed = jurisdictionRoleAllows(input.destinationIso2, 'destination')
  const gates: ReadinessGate[] = [
    { id: 'origin-role', label: 'Origin trade role', state: originAllowed ? 'pass' : 'fail', reason: originAllowed ? 'Jurisdiction is configured as an origin or both.' : 'Jurisdiction is not configured as an eligible origin in the current trade matrix.', evidenceIds: [] },
    { id: 'destination-role', label: 'Destination trade role', state: destinationAllowed ? 'pass' : 'fail', reason: destinationAllowed ? 'Jurisdiction is configured as a destination or both.' : 'Jurisdiction is not configured as an eligible destination in the current trade matrix.', evidenceIds: [] },
    { id: 'product-compatibility', label: 'Product compatibility', state: Boolean(plan.corridorRef) || input.productClass === 'any' ? 'pass' : 'fail', reason: Boolean(plan.corridorRef) || input.productClass === 'any' ? 'The selected product is represented by the corridor model.' : 'The selected product is not represented by the tracked corridor product matrix.', evidenceIds: [] },
  ]
  const evidenceIds = evidence.references.map((r) => r.id)
  const allVerified = evidence.references.length > 0 && evidence.references.every((r) => r.status === 'verified')
  gates.push({ id: 'primary-source-evidence', label: 'Claim-level primary-source evidence', state: allVerified ? 'pass' : 'fail', reason: allVerified ? 'Both corridor jurisdictions have current claim-level primary-source evidence with immutable source hashes.' : 'The corridor does not have complete current claim-level primary-source evidence with immutable source hashes; it cannot be treated as executable.', evidenceIds })
  gates.push({ id: 'execution-graph', label: 'Execution dependency graph', state: execution.cycleDetected ? 'fail' : 'pass', reason: execution.cycleDetected ? 'A dependency cycle was detected.' : 'Execution tasks form an acyclic dependency graph.', evidenceIds: [] })
  const blockers = gates.filter((g) => g.state === 'fail').map((g) => g.reason); const warnings = gates.filter((g) => g.state === 'warn').map((g) => g.reason)
  const executable = blockers.length === 0 && warnings.length === 0
  return { decision: executable ? 'permitted' : blockers.some((r) => r.includes('not represented')) ? 'unknown' : 'conditional', executable, gates, blockers, warnings }
}
export async function buildMarketEntryPlan(rawInput: MarketEntryInput, options: { now?: Date; freshnessDays?: number } = {}): Promise<MarketEntryPlan | null> {
  const originIso2 = normaliseIso2(rawInput.originIso2); const destinationIso2 = normaliseIso2(rawInput.destinationIso2); const productClass = SUPPORTED_PRODUCTS.includes(rawInput.productClass) ? rawInput.productClass : null
  if (!originIso2 || !destinationIso2 || originIso2 === destinationIso2 || !productClass) return null
  const input = { originIso2, destinationIso2, productClass, requestedAt: rawInput.requestedAt } as MarketEntryInput
  const plan = await deriveCorridorPlan(originIso2, destinationIso2, { productClass }); if (!plan) return null
  const evidence = await buildEvidenceSnapshot(plan, { ...options, productClass }); const execution = buildExecutionGraph(plan); const decision = buildDecision(input, plan, evidence, execution); const costs = buildCosts(plan)
  const generatedAt = (options.now ?? new Date()).toISOString(); const reproducibilityKey = createHash('sha256').update(JSON.stringify({ input, evidence: evidence.snapshotId, planTrust: plan.trust, execution })).digest('hex')
  return { planVersion: 2, planId: randomUUID(), input, status: decision.executable ? 'ready' : decision.blockers.length ? 'blocked' : 'orientation', generatedAt, decision, evidence, execution, documentation: { required: plan.documentationChecklist.filter((i) => i.required).map((i) => i.label), optional: plan.documentationChecklist.filter((i) => !i.required).map((i) => i.label), orientationOnly: !decision.executable }, costs, notes: plan.notes, sourceTrust: plan.trust.confidenceLabel, reproducibilityKey }
}
export function listAllApplicableJurisdictions() { return [...APPLICABLE_TRADE_JURISDICTIONS].sort((a, b) => a.name.localeCompare(b.name)) }
export function getCoverageStats() { const origins = APPLICABLE_TRADE_JURISDICTIONS.filter((i) => i.role === 'origin' || i.role === 'both'); const destinations = APPLICABLE_TRADE_JURISDICTIONS.filter((i) => i.role === 'destination' || i.role === 'both'); return { jurisdictions: APPLICABLE_TRADE_JURISDICTIONS.length, origins: origins.length, destinations: destinations.length, directedPairs: origins.reduce((n, o) => n + destinations.filter((d) => d.iso2 !== o.iso2).length, 0), products: SUPPORTED_PRODUCTS } }
