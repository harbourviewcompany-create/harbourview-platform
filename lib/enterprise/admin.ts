import 'server-only'
import type { AdminDataResult } from '@/lib/supabase/adminDataClient'
import type {
  EcosystemVertical,
  OperatorWorkflowItem,
  EnterpriseDealRoom,
  IntroPacket,
  DocumentReadinessPacket,
  EnterpriseDashboardMetric,
  StrategicIntegrationPlaceholder,
  ReputationRecord,
  DataFlywheelEvent,
  CommercialCoordinationWorkflow,
} from './types'
import {
  ecosystemVerticals,
  operatorWorkflowItems,
  enterpriseDealRooms,
  introPackets,
  documentReadinessPackets,
  enterpriseDashboardMetrics,
  strategicIntegrations,
  reputationRecords,
  dataFlywheelEvents,
  commercialCoordinationWorkflows,
} from './fixtures'

export async function listEcosystemVerticals(): Promise<AdminDataResult<EcosystemVertical[]>> {
  return { ok: true, data: ecosystemVerticals, source: 'fixture' }
}

export async function listOperatorWorkflowItems(): Promise<AdminDataResult<OperatorWorkflowItem[]>> {
  return { ok: true, data: operatorWorkflowItems, source: 'fixture' }
}

export async function listEnterpriseDealRooms(): Promise<AdminDataResult<EnterpriseDealRoom[]>> {
  return { ok: true, data: enterpriseDealRooms, source: 'fixture' }
}

export async function listIntroPackets(): Promise<AdminDataResult<IntroPacket[]>> {
  return { ok: true, data: introPackets, source: 'fixture' }
}

export async function listDocumentReadinessPackets(): Promise<AdminDataResult<DocumentReadinessPacket[]>> {
  return { ok: true, data: documentReadinessPackets, source: 'fixture' }
}

export async function listEnterpriseDashboardMetrics(): Promise<AdminDataResult<EnterpriseDashboardMetric[]>> {
  return { ok: true, data: enterpriseDashboardMetrics, source: 'fixture' }
}

export async function listStrategicIntegrations(): Promise<AdminDataResult<StrategicIntegrationPlaceholder[]>> {
  return { ok: true, data: strategicIntegrations, source: 'fixture' }
}

export async function listReputationRecords(): Promise<AdminDataResult<ReputationRecord[]>> {
  return { ok: true, data: reputationRecords, source: 'fixture' }
}

export async function listDataFlywheelEvents(): Promise<AdminDataResult<DataFlywheelEvent[]>> {
  return { ok: true, data: dataFlywheelEvents, source: 'fixture' }
}

export async function listCommercialCoordinationWorkflows(): Promise<AdminDataResult<CommercialCoordinationWorkflow[]>> {
  return { ok: true, data: commercialCoordinationWorkflows, source: 'fixture' }
}
