import type { ProductClass } from '@/lib/intelligence/tradeCorridors'

export type MarketEntryStatus =
  | 'draft'
  | 'blocked'
  | 'orientation'
  | 'ready'
  | 'in_progress'
  | 'completed'

export type GateState = 'pass' | 'warn' | 'fail'

export type EvidenceStatus = 'verified' | 'partial' | 'unverified' | 'stale' | 'conflicted'

export type CorridorDecision = 'permitted' | 'conditional' | 'prohibited' | 'unknown'

export type EvidenceRef = {
  id: string
  jurisdictionIso2: string
  claim: string
  status: EvidenceStatus
  sourceName: string
  sourceUrl: string | null
  effectiveAt: string | null
  verifiedAt: string | null
  expiresAt: string | null
  retrievedAt: string
  hash: string | null
}

export type EvidenceSnapshot = {
  snapshotId: string
  generatedAt: string
  freshnessDays: number
  references: EvidenceRef[]
  sourceCount: number
}

export type ReadinessGate = {
  id: string
  label: string
  state: GateState
  reason: string
  evidenceIds: string[]
}

export type CorridorDecisionRecord = {
  decision: CorridorDecision
  executable: boolean
  gates: ReadinessGate[]
  blockers: string[]
  warnings: string[]
}

export type ExecutionTaskStatus = 'pending' | 'blocked' | 'in_progress' | 'complete'

export type ExecutionTask = {
  id: string
  title: string
  description: string
  side: 'export' | 'import' | 'shared'
  status: ExecutionTaskStatus
  prerequisiteIds: string[]
  estimatedWeeks: number | null
  evidenceIds: string[]
}

export type ExecutionGraph = {
  tasks: ExecutionTask[]
  criticalPathTaskIds: string[]
  sequentialWeeks: number
  criticalPathWeeks: number
  cycleDetected: boolean
}

export type CostComponent = {
  id: string
  category:
    | 'licensing'
    | 'testing'
    | 'certification'
    | 'customs'
    | 'duties'
    | 'brokerage'
    | 'logistics'
    | 'insurance'
    | 'professional_services'
    | 'facility_handling'
    | 'taxes'
    | 'unknown'
  side: 'export' | 'import' | 'shared'
  amountLow: number | null
  amountHigh: number | null
  currency: string | null
  basis: string
  evidenceIds: string[]
  confidence: EvidenceStatus
}

export type CostEstimate = {
  currency: string
  components: CostComponent[]
  knownLow: number | null
  knownHigh: number | null
  unknownCount: number
  disclaimer: string
}

export type MarketEntryInput = {
  originIso2: string
  destinationIso2: string
  productClass: ProductClass | 'any'
  requestedAt?: string
}

export type MarketEntryPlan = {
  planVersion: 2
  planId: string
  input: MarketEntryInput
  status: MarketEntryStatus
  generatedAt: string
  decision: CorridorDecisionRecord
  evidence: EvidenceSnapshot
  execution: ExecutionGraph
  documentation: {
    required: string[]
    optional: string[]
    orientationOnly: boolean
  }
  costs: CostEstimate
  notes: string[]
  sourceTrust: 'orientation' | 'partial' | 'reviewed'
  reproducibilityKey: string
}
