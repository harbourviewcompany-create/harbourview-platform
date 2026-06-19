import 'server-only'
import type { AdminDataResult } from '@/lib/supabase/adminDataClient'
import type {
  MonetizationAccessProduct,
  PartnerEcosystemRecord,
  RevenueIntelligenceItem,
  InstitutionalReport,
  GlobalExpansionCoverage,
  GovernanceQualityItem,
  SuccessFeeOpportunity,
  SubscriptionTier,
} from './types'
import {
  accessProducts,
  partnerEcosystemRecords,
  revenueIntelligenceItems,
  institutionalReports,
  executiveDashboardMetrics,
  governanceQualityItems,
  globalExpansionCoverage,
  successFeeOpportunities,
  subscriptionTiers,
} from './fixtures'

export type ExecutiveDashboardMetric = {
  id: string
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  target: number
}

export async function listAccessProducts(): Promise<AdminDataResult<MonetizationAccessProduct[]>> {
  return { ok: true, data: accessProducts, source: 'fixture' }
}

export async function listPartnerEcosystemRecords(): Promise<AdminDataResult<PartnerEcosystemRecord[]>> {
  return { ok: true, data: partnerEcosystemRecords, source: 'fixture' }
}

export async function listRevenueIntelligenceItems(): Promise<AdminDataResult<RevenueIntelligenceItem[]>> {
  return { ok: true, data: revenueIntelligenceItems, source: 'fixture' }
}

export async function listInstitutionalReports(): Promise<AdminDataResult<InstitutionalReport[]>> {
  return { ok: true, data: institutionalReports, source: 'fixture' }
}

export async function listExecutiveDashboardMetrics(): Promise<AdminDataResult<ExecutiveDashboardMetric[]>> {
  return { ok: true, data: executiveDashboardMetrics, source: 'fixture' }
}

export async function listGovernanceQualityItems(): Promise<AdminDataResult<GovernanceQualityItem[]>> {
  return { ok: true, data: governanceQualityItems, source: 'fixture' }
}

export async function listGlobalExpansionCoverage(): Promise<AdminDataResult<GlobalExpansionCoverage[]>> {
  return { ok: true, data: globalExpansionCoverage, source: 'fixture' }
}

export async function listSuccessFeeOpportunities(): Promise<AdminDataResult<SuccessFeeOpportunity[]>> {
  return { ok: true, data: successFeeOpportunities, source: 'fixture' }
}

export async function listSubscriptionTiers(): Promise<AdminDataResult<SubscriptionTier[]>> {
  return { ok: true, data: subscriptionTiers, source: 'fixture' }
}
