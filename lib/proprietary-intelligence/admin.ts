import 'server-only'
import type { AdminDataResult } from '@/lib/supabase/adminDataClient'
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
import {
  fixtureDatasets,
  fixtureReinforcementEvents,
  fixtureCommercialPredictions,
  fixtureTrustScores,
  fixtureCopilotTasks,
  fixtureExecutionQueue,
  fixtureOperatorCommands,
  fixtureInstitutionalWorkflows,
  fixtureStrategicMetrics,
} from './fixtures'

export async function listDatasets(): Promise<AdminDataResult<ProprietaryDataset[]>> {
  return { ok: true, data: fixtureDatasets, source: 'fixture' }
}

export async function listReinforcementEvents(): Promise<AdminDataResult<ReinforcementEvent[]>> {
  return { ok: true, data: fixtureReinforcementEvents, source: 'fixture' }
}

export async function listPredictions(): Promise<AdminDataResult<CommercialPrediction[]>> {
  return { ok: true, data: fixtureCommercialPredictions, source: 'fixture' }
}

export async function listTrustScores(): Promise<AdminDataResult<RelationshipTrustScore[]>> {
  return { ok: true, data: fixtureTrustScores, source: 'fixture' }
}

export async function listCopilotTasks(): Promise<AdminDataResult<AICopilotTask[]>> {
  return { ok: true, data: fixtureCopilotTasks, source: 'fixture' }
}

export async function listExecutionQueue(): Promise<AdminDataResult<AutonomousExecutionQueueItem[]>> {
  return { ok: true, data: fixtureExecutionQueue, source: 'fixture' }
}

export async function listOperatorCommands(): Promise<AdminDataResult<OperatorCommandItem[]>> {
  return { ok: true, data: fixtureOperatorCommands, source: 'fixture' }
}

export async function listInstitutionalWorkflows(): Promise<AdminDataResult<InstitutionalWorkflowRecord[]>> {
  return { ok: true, data: fixtureInstitutionalWorkflows, source: 'fixture' }
}

export async function listStrategicMetrics(): Promise<AdminDataResult<StrategicDashboardMetric[]>> {
  return { ok: true, data: fixtureStrategicMetrics, source: 'fixture' }
}
