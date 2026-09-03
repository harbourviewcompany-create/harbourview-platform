import type {
  ProprietaryDataset,
  ReinforcementEvent,
  CommercialPrediction,
  RelationshipTrustScore,
  AICopilotTask,
  AutonomousExecutionQueueItem,
  OperatorCommandItem,
  InstitutionalWorkflowRecord,
  StrategicDashboardMetric,
} from './types'

/** Restored after #1724 deleted this module while imports remained.
 * Empty arrays keep admin fallbacks type-safe; live Supabase data is preferred.
 */
export const fixtureDatasets: ProprietaryDataset[] = []
export const fixtureReinforcementEvents: ReinforcementEvent[] = []
export const fixtureCommercialPredictions: CommercialPrediction[] = []
export const fixtureTrustScores: RelationshipTrustScore[] = []
export const fixtureCopilotTasks: AICopilotTask[] = []
export const fixtureExecutionQueue: AutonomousExecutionQueueItem[] = []
export const fixtureOperatorCommands: OperatorCommandItem[] = []
export const fixtureInstitutionalWorkflows: InstitutionalWorkflowRecord[] = []
export const fixtureStrategicMetrics: StrategicDashboardMetric[] = []
