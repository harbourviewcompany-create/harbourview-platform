import type {
  AutomationSource,
  AutomationSignal,
  RelationshipMemoryRecord,
  ScoringRecord,
  AgentWorkItem,
  EvidenceVaultEntry,
  GraphEntity,
  GraphEdge,
  FeedbackEvent,
} from './types'

export const automationSources: AutomationSource[] = [];

export const automationSignals: AutomationSignal[] = [];

export const relationshipMemory: RelationshipMemoryRecord[] = [];

export const scoringRecords: ScoringRecord[] = [];

export const agentQueue: AgentWorkItem[] = [];

export const evidenceVault: EvidenceVaultEntry[] = [];

export const graphEntities: GraphEntity[] = [];

export const graphEdges: GraphEdge[] = [];

export const feedbackEvents: FeedbackEvent[] = [];
