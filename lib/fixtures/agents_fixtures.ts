import type {
  IntelligenceWatcher,
  SourceAdapterDefinition,
  ExtractedCommercialSignal,
  AgentQueueItem,
  ScoringUpdateSuggestion,
  RelationshipMemoryUpdate,
  PredictiveRoutingSuggestion,
  ExecutionAutomationTask,
  EvidenceActionTrigger,
  AgentRunRecord,
} from '@/types/agents'

export const watchers: IntelligenceWatcher[] = [];

export const adapters: SourceAdapterDefinition[] = [];

export const extractedSignals: ExtractedCommercialSignal[] = [];

export const agentQueueItems: AgentQueueItem[] = [];

export const scoringUpdates: ScoringUpdateSuggestion[] = [];

export const memoryUpdates: RelationshipMemoryUpdate[] = [];

export const predictiveRouting: PredictiveRoutingSuggestion[] = [];

export const executionTasks: ExecutionAutomationTask[] = [];

export const evidenceTriggers: EvidenceActionTrigger[] = [];

export const agentRuns: AgentRunRecord[] = [];
