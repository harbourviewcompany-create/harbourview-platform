import 'server-only'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'
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

function orFixture<T>(result: AdminDataResult<T[]>, fixture: T[]): AdminDataResult<T[]> {
  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixture, source: 'fixture' }
  }
  return result
}

export async function listEcosystemVerticals(): Promise<AdminDataResult<EcosystemVertical[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    operator_type: string
    verification_status: string
    primary_country_iso2: string | null
  }>>('/rest/v1/cannabis_operators?select=id,operator_type,verification_status,primary_country_iso2')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: ecosystemVerticals, source: 'fixture' }
  }

  const groups = new Map<string, typeof result.data>()
  for (const op of result.data) {
    if (!groups.has(op.operator_type)) groups.set(op.operator_type, [])
    groups.get(op.operator_type)!.push(op)
  }

  const verticals: EcosystemVertical[] = Array.from(groups.entries()).map(([type, ops]) => {
    const markets = [...new Set(ops.map(o => o.primary_country_iso2).filter(Boolean))] as string[]
    const highValue = ops.filter(o => o.verification_status === 'verified').length
    return {
      id: type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      vertical_type: type as EcosystemVertical['vertical_type'],
      record_count: ops.length,
      markets_covered: markets,
      categories_covered: [],
      high_value_count: highValue,
      status: ops.length >= 5 ? 'active' : 'building',
    }
  })

  return { ok: true, data: verticals, source: 'db' }
}

export async function listOperatorWorkflowItems(): Promise<AdminDataResult<OperatorWorkflowItem[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    name: string
    type: string
    stage: string
    priority: string
    next_action: string | null
    next_action_date: string | null
    market: string | null
    notes: string | null
    entity: string | null
    created_at: string
  }>>('/rest/v1/opportunities?select=id,name,type,stage,priority,next_action,next_action_date,market,notes,entity,created_at&order=created_at.desc')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: operatorWorkflowItems, source: 'fixture' }
  }

  const stageToStatus: Record<string, OperatorWorkflowItem['status']> = {
    prospect: 'my_queue',
    qualified: 'team_queue',
    proposal: 'review',
    negotiation: 'approval',
    closed_won: 'handoff',
    closed_lost: 'follow_up',
  }

  const items: OperatorWorkflowItem[] = result.data.map(op => ({
    id: op.id,
    title: op.name,
    owner: op.entity ?? 'Harbourview',
    status: stageToStatus[op.stage] ?? 'my_queue',
    priority: (op.priority as OperatorWorkflowItem['priority']) ?? 'medium',
    market: op.market ?? 'Global',
    category: op.type ?? 'opportunity',
    due_date: op.next_action_date ?? null,
    created_at: op.created_at,
    notes: op.notes ?? op.next_action ?? '',
  }))

  return { ok: true, data: items, source: 'db' }
}

export async function listEnterpriseDealRooms(): Promise<AdminDataResult<EnterpriseDealRoom[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    title: string
    status: string
    notes: string | null
    created_at: string
  }>>('/rest/v1/deal_rooms?select=id,title,status,notes,created_at&order=created_at.desc')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: enterpriseDealRooms, source: 'fixture' }
  }

  const rooms: EnterpriseDealRoom[] = result.data.map(dr => ({
    id: dr.id,
    room_type: 'buyer_seller' as EnterpriseDealRoom['room_type'],
    title: dr.title,
    participants: [],
    market: 'Global',
    category: 'cannabis-inventory',
    status: (dr.status as EnterpriseDealRoom['status']) ?? 'active',
    next_action: dr.notes ?? 'Awaiting updates',
    created_at: dr.created_at,
  }))

  return { ok: true, data: rooms, source: 'db' }
}

export async function listIntroPackets(): Promise<AdminDataResult<IntroPacket[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    marketplace_category: string | null
    title_internal: string | null
    country: string | null
    status: string | null
    created_at: string
    confidence: number | null
  }>>('/rest/v1/marketplace_candidates?select=id,marketplace_category,title_internal,country,status,created_at,confidence&order=created_at.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: introPackets, source: 'fixture' }
  }

  const statusMap: Record<string, IntroPacket['status']> = {
    pending_review: 'ready_for_review',
    under_review: 'ready_for_review',
    approved: 'sent',
    rejected: 'outcome_captured',
    promoted: 'sent',
    new: 'draft',
  }

  const packets: IntroPacket[] = result.data.map(mc => ({
    id: mc.id,
    packet_type: 'buyer_seller' as IntroPacket['packet_type'],
    title: mc.title_internal ?? 'Unnamed Candidate',
    counterparties: [],
    market: mc.country ?? 'Global',
    category: mc.marketplace_category ?? 'cannabis-inventory',
    fit_score: Math.round((mc.confidence ?? 0.7) * 100),
    trust_score: 70,
    documentation_status: 'partial' as IntroPacket['documentation_status'],
    status: statusMap[mc.status ?? ''] ?? 'draft',
    owner: 'Harbourview',
    created_at: mc.created_at,
  }))

  return { ok: true, data: packets, source: 'db' }
}

export async function listDocumentReadinessPackets(): Promise<AdminDataResult<DocumentReadinessPacket[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    title: string
    type: string | null
    linked_counterparty_name: string | null
    linked_market: string | null
    review_status: string | null
    tags: string[] | null
    added_at: string | null
    created_at: string
  }>>('/rest/v1/ia_evidence_vault?select=id,title,type,linked_counterparty_name,linked_market,review_status,tags,added_at,created_at&order=created_at.desc')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: documentReadinessPackets, source: 'fixture' }
  }

  const reviewToStatus: Record<string, DocumentReadinessPacket['status']> = {
    pending: 'in_review',
    reviewed: 'approved',
    approved: 'approved',
    flagged: 'missing_documents',
    incomplete: 'missing_documents',
    complete: 'ready',
  }

  const typeToCategory: Record<string, DocumentReadinessPacket['packet_category']> = {
    coa: 'coa',
    licence: 'licence',
    license: 'licence',
    gmp: 'eu_gmp',
    export: 'export_docs',
    import: 'import_docs',
    supply: 'seller_supply_package',
    gacp: 'gacp',
    spec: 'spec_sheet',
  }

  const packets: DocumentReadinessPacket[] = result.data.map(ev => {
    const status = reviewToStatus[ev.review_status ?? ''] ?? 'in_review'
    const completeness =
      status === 'approved' ? 100
      : status === 'ready' ? 95
      : status === 'in_review' ? 60
      : 30
    const typeKey = Object.keys(typeToCategory).find(k => ev.type?.toLowerCase().includes(k)) ?? ''
    return {
      id: ev.id,
      packet_category: typeToCategory[typeKey] ?? 'coa',
      title: ev.title,
      entity_label: ev.linked_counterparty_name ?? 'Unknown',
      market: ev.linked_market ?? 'Global',
      status,
      completeness_pct: completeness,
      missing_items: status === 'missing_documents' ? (ev.tags ?? []) : [],
      created_at: ev.added_at ?? ev.created_at,
    }
  })

  return { ok: true, data: packets, source: 'db' }
}

export async function listEnterpriseDashboardMetrics(): Promise<AdminDataResult<EnterpriseDashboardMetric[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    category: string
    label: string
    value: number
    unit: string
    trend: string
    target: number
  }>>('/rest/v1/rpc/get_enterprise_dashboard_metrics')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: enterpriseDashboardMetrics, source: 'fixture' }
  }

  const metrics: EnterpriseDashboardMetric[] = result.data.map(m => ({
    id: m.id,
    category: m.category as EnterpriseDashboardMetric['category'],
    label: m.label,
    value: Number(m.value),
    unit: m.unit,
    trend: m.trend as EnterpriseDashboardMetric['trend'],
    target: Number(m.target),
  }))

  return { ok: true, data: metrics, source: 'db' }
}

// No backing table — integrations list is configuration, not data.
export async function listStrategicIntegrations(): Promise<AdminDataResult<StrategicIntegrationPlaceholder[]>> {
  return { ok: true, data: strategicIntegrations, source: 'fixture' }
}

export async function listReputationRecords(): Promise<AdminDataResult<ReputationRecord[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    counterparty_name: string
    counterparty_role: string
    trust_score: number
    fit_score: number
    readiness_score: number
    routing_priority: string | null
    market_access_relevance: string[] | null
  }>>('/rest/v1/ia_scoring_records?select=id,counterparty_name,counterparty_role,trust_score,fit_score,readiness_score,routing_priority,market_access_relevance&order=trust_score.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: reputationRecords, source: 'fixture' }
  }

  const priorityToStatus: Record<string, ReputationRecord['status']> = {
    high: 'priority',
    medium: 'standard',
    low: 'reengage_later',
    watch: 'watch_carefully',
  }

  const records: ReputationRecord[] = result.data.map(r => ({
    id: r.id,
    entity_label: r.counterparty_name,
    entity_type: 'counterparty' as ReputationRecord['entity_type'],
    market: r.market_access_relevance?.[0] ?? 'Global',
    category: 'cannabis-inventory',
    trust_score: r.trust_score,
    responsiveness: r.readiness_score,
    document_quality: r.readiness_score,
    intro_quality: r.fit_score,
    reliability: r.trust_score,
    relationship_value: Math.round((r.fit_score + r.trust_score) / 2),
    status: priorityToStatus[r.routing_priority ?? 'medium'] ?? 'standard',
  }))

  return { ok: true, data: records, source: 'db' }
}

export async function listDataFlywheelEvents(): Promise<AdminDataResult<DataFlywheelEvent[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    date: string
    cat: string
    headline: string
    country: string | null
    commercial_impact: string | null
    created_at: string
    pri: string | null
  }>>('/rest/v1/signals?select=id,date,cat,headline,country,commercial_impact,created_at,pri&order=created_at.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: dataFlywheelEvents, source: 'fixture' }
  }

  const catToEventType: Record<string, DataFlywheelEvent['event_type']> = {
    regulatory_change: 'new_signal',
    market_access: 'new_signal',
    supply: 'new_supply',
    demand: 'new_buyer_demand',
    document: 'new_document',
    introduction: 'new_intro',
    deal: 'new_deal_movement',
    pathway: 'new_pathway_review',
    relationship: 'new_relationship_note',
  }

  const priToImpact: Record<string, DataFlywheelEvent['impact']> = {
    URGENT: 'high',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  }

  const events: DataFlywheelEvent[] = result.data.map(s => ({
    id: s.id,
    event_type: catToEventType[s.cat] ?? 'new_signal',
    description: s.headline,
    impact: priToImpact[s.pri ?? ''] ?? (s.commercial_impact as DataFlywheelEvent['impact']) ?? 'medium',
    market: s.country ?? 'Global',
    category: s.cat ?? 'regulatory',
    dataset_enriched: s.cat ?? 'signals',
    created_at: s.date ?? s.created_at,
  }))

  return { ok: true, data: events, source: 'db' }
}

export async function listCommercialCoordinationWorkflows(): Promise<AdminDataResult<CommercialCoordinationWorkflow[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    name: string
    type: string
    stage: string
    priority: string
    next_action: string | null
    market: string | null
    entity: string | null
    created_at: string
  }>>('/rest/v1/opportunities?select=id,name,type,stage,priority,next_action,market,entity,created_at&order=priority_order.asc.nullslast,created_at.desc')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: commercialCoordinationWorkflows, source: 'fixture' }
  }

  const stageToStatus: Record<string, CommercialCoordinationWorkflow['status']> = {
    prospect: 'ready_for_action',
    qualified: 'ready_for_intro',
    proposal: 'waiting_counterparty',
    negotiation: 'waiting_documents',
    closed_won: 'complete',
    closed_lost: 'stalled',
  }

  const typeToWorkflow: Record<string, CommercialCoordinationWorkflow['workflow_type']> = {
    supply: 'supply_to_buyer',
    demand: 'buyer_demand_to_supplier',
    signal: 'source_signal_to_opportunity',
    introduction: 'opportunity_to_intro_packet',
    market_access: 'document_packet_to_market_access',
  }

  const workflows: CommercialCoordinationWorkflow[] = result.data.map(op => ({
    id: op.id,
    workflow_type: typeToWorkflow[op.type] ?? 'supply_to_buyer',
    title: op.name,
    market: op.market ?? 'Global',
    category: op.type ?? 'supply',
    status: stageToStatus[op.stage] ?? 'ready_for_action',
    next_action: op.next_action ?? 'Review opportunity',
    owner: op.entity ?? 'Harbourview',
    created_at: op.created_at,
  }))

  return { ok: true, data: workflows, source: 'db' }
}
