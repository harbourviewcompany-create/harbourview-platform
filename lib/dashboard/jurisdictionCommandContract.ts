export type JurisdictionAccessState =
  | 'available'
  | 'conditional'
  | 'restricted'
  | 'unavailable'
  | 'unknown'

export type JurisdictionDependencyState =
  | 'satisfied'
  | 'missing'
  | 'blocked'
  | 'unknown'
  | 'not_applicable'

export type JurisdictionDataState = 'loaded' | 'stale' | 'incomplete'

export type JurisdictionActivity = 'market-entry' | 'import' | 'export' | 'medical' | 'adult-use'

export type JurisdictionAccessLane = {
  id: JurisdictionActivity
  label: string
  rawStatus: string | null
  state: JurisdictionAccessState
  detail: string
}

export type JurisdictionRequirementDTO = {
  id: string
  title: string
  description: string | null
  evidenceType: string | null
  required: boolean
  state: JurisdictionDependencyState
  statusLabel: string
}

export type JurisdictionPathwayStepDTO = {
  id: string
  number: number
  title: string
  description: string | null
  state: JurisdictionDependencyState
  requirements: JurisdictionRequirementDTO[]
}

export type JurisdictionChangeDTO = {
  id: string
  title: string
  detail: string
  changedAt: string | null
  sourceLabel: string | null
  kind: 'regulatory' | 'commercial' | 'access' | 'other'
}

export type JurisdictionCalendarDTO = {
  id: string
  title: string
  summary: string | null
  expectedDate: string | null
  confidence: string | null
  status: string | null
  sourceLabel: string | null
  sourceUrl: string | null
}

export type JurisdictionEvidenceSourceDTO = {
  id: string
  name: string
  category: string
  reliability: string
  lastChecked: string | null
}

export type JurisdictionMarketMetricDTO = {
  name: string
  value: number
  unit: string | null
  period: string | null
  dataType: string | null
  sourceName: string | null
}

export type JurisdictionTradeFlowDTO = {
  originIso2: string
  destinationIso2: string
  productCategory: string | null
  legalStatus: string | null
  permitRequired: boolean | null
  permitAuthority: string | null
}

export type JurisdictionCounterpartyDTO = {
  id: string
  kind: 'operator' | 'professional'
  name: string
  detail: string
  verificationStatus: 'verified'
}

export type JurisdictionComparisonDTO = {
  iso2: string
  name: string
  opportunityScore: number
  marketAccessStatus: string | null
  dataCompleteness: string | null
}

export type JurisdictionRouteResolutionDTO = {
  activity: JurisdictionActivity
  counterpartyMarket: string | null
  product: string | null
  state: JurisdictionAccessState
  coverage: 'trade-flow-match' | 'jurisdiction-baseline' | 'unsupported'
  detail: string
  permitRequired: boolean | null
  permitAuthority: string | null
}

export type JurisdictionCommandDTO = {
  country: {
    iso2: string
    name: string
    region: string | null
    regulator: string | null
    reviewStatus: string
    lastReviewedAt: string | null
    publicSummary: string | null
    regulatoryOutlook: string | null
    marketDynamics: string | null
  }
  operatingContext: {
    roleId: string | null
    workspaceId: string | null
    workspaceState: 'personal' | 'active' | 'stale'
  }
  dataQuality: {
    state: JurisdictionDataState
    lastVerifiedAt: string | null
    evidenceVerified: boolean
    evidenceLabel: string | null
    registeredSourceCount: number
    officialSourceCount: number
    conflictAssessment: 'not-modeled'
    gaps: string[]
  }
  access: {
    lanes: JurisdictionAccessLane[]
    route: JurisdictionRouteResolutionDTO
    routeOptions: {
      counterpartMarkets: string[]
      products: string[]
    }
  }
  pathway: {
    state: 'curated' | 'generic' | 'role-required' | 'unavailable'
    name: string | null
    roleId: string | null
    availableRoleIds: string[]
    progressStatus: string | null
    steps: JurisdictionPathwayStepDTO[]
  }
  changes: JurisdictionChangeDTO[]
  calendar: JurisdictionCalendarDTO[]
  evidenceSources: JurisdictionEvidenceSourceDTO[]
  marketMetrics: JurisdictionMarketMetricDTO[]
  tradeFlows: JurisdictionTradeFlowDTO[]
  counterparties: JurisdictionCounterpartyDTO[]
  comparisons: JurisdictionComparisonDTO[]
}

const AVAILABLE = ['permitted', 'available', 'active', 'open', 'legal', 'allowed']
const CONDITIONAL = ['regulated', 'licensed', 'conditional', 'medical only', 'medical_only', 'scientific']
const RESTRICTED = ['limited', 'restricted', 'controlled']
const UNAVAILABLE = ['prohibited', 'illegal', 'banned', 'closed', 'not permitted', 'not_permitted']

export function normalizeJurisdictionAccessState(value: string | null | undefined): JurisdictionAccessState {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return 'unknown'
  if (UNAVAILABLE.some(token => normalized.includes(token))) return 'unavailable'
  if (RESTRICTED.some(token => normalized.includes(token))) return 'restricted'
  if (CONDITIONAL.some(token => normalized.includes(token))) return 'conditional'
  if (AVAILABLE.some(token => normalized.includes(token))) return 'available'
  return 'unknown'
}

export function requirementStatusToDependencyState(
  status: string | null | undefined,
  required = true,
): JurisdictionDependencyState {
  if (!required) return status === 'verified' || status === 'waived' ? 'satisfied' : 'not_applicable'
  if (status === 'verified' || status === 'waived') return 'satisfied'
  if (status === 'rejected') return 'blocked'
  if (status === 'pending') return 'missing'
  return 'unknown'
}

export function aggregateDependencyState(
  states: JurisdictionDependencyState[],
): JurisdictionDependencyState {
  const relevant = states.filter(state => state !== 'not_applicable')
  if (relevant.length === 0) return 'unknown'
  if (relevant.includes('blocked')) return 'blocked'
  if (relevant.includes('missing')) return 'missing'
  if (relevant.every(state => state === 'satisfied')) return 'satisfied'
  return 'unknown'
}

export function humanizeJurisdictionStatus(value: string | null | undefined, fallback = 'Under review'): string {
  if (!value?.trim()) return fallback
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}
