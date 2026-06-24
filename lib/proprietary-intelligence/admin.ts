import 'server-only'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'
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
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    name: string
    category: string
    record_count: number
    freshness_days: number
    coverage_markets: string[]
    coverage_categories: string[]
    last_updated: string
    completeness_pct: number
    status: string
  }>>('/rest/v1/rpc/get_proprietary_datasets')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureDatasets, source: 'fixture' }
  }

  const datasets: ProprietaryDataset[] = result.data.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category as ProprietaryDataset['category'],
    record_count: Number(d.record_count),
    freshness_days: Number(d.freshness_days ?? 0),
    coverage_markets: d.coverage_markets ?? [],
    coverage_categories: d.coverage_categories ?? [],
    last_updated: d.last_updated ?? new Date().toISOString(),
    completeness_pct: Number(d.completeness_pct),
    status: (d.status as ProprietaryDataset['status']) ?? 'building',
  }))

  return { ok: true, data: datasets, source: 'db' }
}

export async function listReinforcementEvents(): Promise<AdminDataResult<ReinforcementEvent[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    outcome_type: string
    counterparty_name: string
    market: string | null
    category: string | null
    score_impact: string | null
    notes: string | null
    logged_at: string | null
    created_at: string
  }>>('/rest/v1/ia_feedback_events?select=id,outcome_type,counterparty_name,market,category,score_impact,notes,logged_at,created_at&order=created_at.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureReinforcementEvents, source: 'fixture' }
  }

  const outcomeToEventType: Record<string, ReinforcementEvent['event_type']> = {
    responded: 'buyer_responded',
    buyer_responded: 'buyer_responded',
    ignored: 'buyer_ignored',
    buyer_ignored: 'buyer_ignored',
    seller_responded: 'seller_responded',
    seller_ignored: 'seller_ignored',
    docs_received: 'docs_received',
    docs_incomplete: 'docs_incomplete',
    docs_requested: 'docs_requested',
    intro_accepted: 'intro_accepted',
    intro_rejected: 'intro_rejected',
    intro_proposed: 'intro_proposed',
    intro_sent: 'intro_sent',
    deal_won: 'deal_won',
    deal_lost: 'deal_lost',
    deal_stalled: 'deal_stalled',
    deal_moved: 'deal_moved_forward',
    pathway_validated: 'market_pathway_validated',
    pathway_blocked: 'market_pathway_blocked',
    relationship_upgraded: 'relationship_upgraded',
    relationship_downgraded: 'relationship_downgraded',
  }

  const events: ReinforcementEvent[] = result.data.map(fe => ({
    id: fe.id,
    event_type: outcomeToEventType[fe.outcome_type] ?? 'buyer_responded',
    entity_type: 'counterparty',
    entity_label: fe.counterparty_name,
    market: fe.market ?? 'Global',
    category: fe.category ?? 'cannabis-inventory',
    score_impact: parseFloat(fe.score_impact ?? '0') || 0,
    created_at: fe.logged_at ?? fe.created_at,
    operator: 'Harbourview',
  }))

  return { ok: true, data: events, source: 'db' }
}

export async function listPredictions(): Promise<AdminDataResult<CommercialPrediction[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    counterparty_name: string
    counterparty_role: string
    fit_score: number
    readiness_score: number
    trust_score: number
    market_access_relevance: string[] | null
    score_drivers: string[] | null
    scored_at: string | null
    created_at: string
  }>>('/rest/v1/ia_scoring_records?select=id,counterparty_name,counterparty_role,fit_score,readiness_score,trust_score,market_access_relevance,score_drivers,scored_at,created_at&order=fit_score.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureCommercialPredictions, source: 'fixture' }
  }

  const roleToPredictionType: Record<string, CommercialPrediction['prediction_type']> = {
    buyer: 'buyer_seller_fit',
    seller: 'buyer_seller_fit',
    importer: 'importer_fit',
    distributor: 'distributor_fit',
    service_provider: 'deal_probability',
    advisor: 'deal_probability',
  }

  const predictions: CommercialPrediction[] = result.data.map(r => ({
    id: r.id,
    prediction_type: roleToPredictionType[r.counterparty_role] ?? 'buyer_seller_fit',
    entity_label: r.counterparty_name,
    market: r.market_access_relevance?.[0] ?? 'Global',
    category: 'cannabis-inventory',
    confidence_score: r.fit_score / 100,
    predicted_value: `Fit: ${r.fit_score} · Readiness: ${r.readiness_score} · Trust: ${r.trust_score}`,
    supporting_factors: r.score_drivers ?? [],
    created_at: r.scored_at ?? r.created_at,
    status: 'active' as CommercialPrediction['status'],
  }))

  return { ok: true, data: predictions, source: 'db' }
}

export async function listTrustScores(): Promise<AdminDataResult<RelationshipTrustScore[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    counterparty_name: string
    counterparty_role: string
    trust_score: number
    fit_score: number
    readiness_score: number
    routing_priority: string | null
    market_access_relevance: string[] | null
    scored_at: string | null
    created_at: string
  }>>('/rest/v1/ia_scoring_records?select=id,counterparty_name,counterparty_role,trust_score,fit_score,readiness_score,routing_priority,market_access_relevance,scored_at,created_at&order=trust_score.desc')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureTrustScores, source: 'fixture' }
  }

  const priorityToStatus: Record<string, RelationshipTrustScore['status']> = {
    high: 'priority',
    medium: 'standard',
    low: 'reengage',
    watch: 'watch',
  }

  const scores: RelationshipTrustScore[] = result.data.map(r => ({
    id: r.id,
    entity_label: r.counterparty_name,
    entity_type: (r.counterparty_role as RelationshipTrustScore['entity_type']) ?? 'buyer',
    market: r.market_access_relevance?.[0] ?? 'Global',
    category: 'cannabis-inventory',
    trust_score: r.trust_score,
    responsiveness: r.readiness_score,
    document_quality: r.readiness_score,
    intro_success: r.fit_score,
    commercial_reliability: r.trust_score,
    relationship_strength: Math.round((r.fit_score + r.trust_score) / 2),
    status: priorityToStatus[r.routing_priority ?? 'medium'] ?? 'standard',
    last_interaction: r.scored_at ?? r.created_at,
  }))

  return { ok: true, data: scores, source: 'db' }
}

export async function listCopilotTasks(): Promise<AdminDataResult<AICopilotTask[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    queue: string
    title: string
    object_type: string | null
    object_label: string | null
    priority: string
    rationale: string | null
    status: string
    created_at: string
  }>>('/rest/v1/ia_agent_tasks?select=id,queue,title,object_type,object_label,priority,rationale,status,created_at&order=created_at.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureCopilotTasks, source: 'fixture' }
  }

  const queueToCopilot: Record<string, AICopilotTask['copilot']> = {
    sourcing: 'sourcing',
    market_access: 'market_access',
    deal_flow: 'deal_flow',
    document: 'document_readiness',
    document_readiness: 'document_readiness',
    counterparty: 'counterparty_research',
    intro: 'intro_packet',
    intro_packet: 'intro_packet',
    follow_up: 'follow_up',
    listing: 'public_listing',
    public_listing: 'public_listing',
    prediction: 'prediction',
    command: 'operator_command',
    operator_command: 'operator_command',
  }

  const statusMap: Record<string, AICopilotTask['status']> = {
    pending: 'ready',
    in_progress: 'in_progress',
    review: 'pending_review',
    pending_review: 'pending_review',
    complete: 'complete',
    done: 'complete',
  }

  const tasks: AICopilotTask[] = result.data.map(t => ({
    id: t.id,
    copilot: queueToCopilot[t.queue] ?? 'sourcing',
    title: t.title,
    summary: t.rationale ?? t.object_label ?? '',
    market: 'Global',
    category: t.object_type ?? 'general',
    priority: (t.priority as AICopilotTask['priority']) ?? 'medium',
    status: statusMap[t.status] ?? 'ready',
    created_at: t.created_at,
  }))

  return { ok: true, data: tasks, source: 'db' }
}

export async function listExecutionQueue(): Promise<AdminDataResult<AutonomousExecutionQueueItem[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    queue: string
    title: string
    object_label: string | null
    object_type: string | null
    priority: string
    status: string
    created_at: string
  }>>('/rest/v1/ia_agent_tasks?select=id,queue,title,object_label,object_type,priority,status,created_at&status=in.(pending,in_progress,review)&order=priority.asc.nullslast,created_at.desc&limit=50')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureExecutionQueue, source: 'fixture' }
  }

  const queueToType: Record<string, AutonomousExecutionQueueItem['queue_type']> = {
    document: 'document_request_draft',
    document_readiness: 'document_request_draft',
    intro: 'intro_brief_draft',
    intro_packet: 'intro_brief_draft',
    buyer_seller: 'buyer_seller_summary',
    listing: 'public_listing_draft',
    public_listing: 'public_listing_draft',
    follow_up: 'follow_up_task',
    deal_flow: 'deal_stage_update',
    stale: 'stale_opportunity_reactivation',
    market_access: 'market_access_review_packet',
    evidence: 'evidence_enrichment',
    counterparty: 'relationship_reactivation',
  }

  const statusMap: Record<string, AutonomousExecutionQueueItem['status']> = {
    pending: 'ready_to_execute',
    in_progress: 'draft_pending_review',
    review: 'draft_pending_review',
    pending_review: 'draft_pending_review',
    follow_up: 'follow_up_due',
    complete: 'complete',
    done: 'complete',
  }

  const items: AutonomousExecutionQueueItem[] = result.data.map(t => ({
    id: t.id,
    queue_type: queueToType[t.queue] ?? 'follow_up_task',
    title: t.title,
    entity_label: t.object_label ?? 'Unknown',
    market: 'Global',
    category: t.object_type ?? 'general',
    priority: (t.priority as AutonomousExecutionQueueItem['priority']) ?? 'medium',
    status: statusMap[t.status] ?? 'ready_to_execute',
    due_date: null,
    created_at: t.created_at,
  }))

  return { ok: true, data: items, source: 'db' }
}

export async function listOperatorCommands(): Promise<AdminDataResult<OperatorCommandItem[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    queue: string
    title: string
    rationale: string | null
    object_label: string | null
    object_type: string | null
    priority: string
    suggested_action: string | null
    created_at: string
  }>>('/rest/v1/ia_agent_tasks?select=id,queue,title,rationale,object_label,object_type,priority,suggested_action,created_at&status=neq.complete&order=priority.asc.nullslast,created_at.desc&limit=20')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureOperatorCommands, source: 'fixture' }
  }

  const queueToCommandType: Record<string, OperatorCommandItem['command_type']> = {
    deal_flow: 'deal_likely_to_move',
    document: 'missing_document',
    document_readiness: 'missing_document',
    follow_up: 'counterparty_to_contact',
    signal: 'new_signal',
    listing: 'public_card_to_publish',
    public_listing: 'public_card_to_publish',
    market_access: 'market_access_review',
    prediction: 'prediction_change',
    stale: 'stale_deal_reactivation',
    intro: 'best_buyer_seller_match',
    intro_packet: 'best_buyer_seller_match',
    sourcing: 'highest_value_action',
  }

  const priorityToUrgency: Record<string, OperatorCommandItem['urgency']> = {
    high: 'today',
    medium: 'this_week',
    low: 'when_possible',
  }

  const commands: OperatorCommandItem[] = result.data.map(t => ({
    id: t.id,
    command_type: queueToCommandType[t.queue] ?? 'highest_value_action',
    title: t.title,
    description: t.rationale ?? '',
    market: 'Global',
    category: t.object_type ?? 'general',
    urgency: priorityToUrgency[t.priority] ?? 'this_week',
    entity_label: t.object_label ?? 'Unknown',
    action_label: t.suggested_action ?? 'Review',
    created_at: t.created_at,
  }))

  return { ok: true, data: commands, source: 'db' }
}

export async function listInstitutionalWorkflows(): Promise<AdminDataResult<InstitutionalWorkflowRecord[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    market: string | null
    region: string | null
    status: string | null
    priority: string | null
    notes: string | null
    created_at: string
  }>>('/rest/v1/dossier_status?select=id,market,region,status,priority,notes,created_at&order=created_at.desc')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureInstitutionalWorkflows, source: 'fixture' }
  }

  const statusMap: Record<string, InstitutionalWorkflowRecord['status']> = {
    active: 'review_ready',
    in_progress: 'review_ready',
    pending: 'incomplete',
    complete: 'approved',
    approved: 'approved',
    flagged: 'flagged',
    stalled: 'flagged',
  }

  const records: InstitutionalWorkflowRecord[] = result.data.map(ds => {
    const status = statusMap[ds.status ?? ''] ?? 'incomplete'
    const completeness =
      status === 'approved' ? 100
      : status === 'review_ready' ? 75
      : status === 'flagged' ? 40
      : 50
    return {
      id: ds.id,
      title: `${ds.market ?? 'Global'} Market Dossier`,
      workflow_steps: [
        { key: 'market_research',      label: 'Market Research',      completed: completeness >= 50 },
        { key: 'regulatory_review',    label: 'Regulatory Review',    completed: completeness >= 75 },
        { key: 'counterparty_mapping', label: 'Counterparty Mapping', completed: completeness >= 75 },
        { key: 'approval',             label: 'Approval',             completed: status === 'approved' },
      ],
      completeness_pct: completeness,
      market: ds.market ?? 'Global',
      category: ds.region ?? 'Global',
      status,
      analyst_notes: ds.notes ?? '',
      created_at: ds.created_at,
    }
  })

  return { ok: true, data: records, source: 'db' }
}

export async function listStrategicMetrics(): Promise<AdminDataResult<StrategicDashboardMetric[]>> {
  const result = await fetchAdminSupabaseJson<Array<{
    id: string
    metric_type: string
    label: string
    value: number
    unit: string
    trend: string
    target: number
    market: string | null
  }>>('/rest/v1/rpc/get_proprietary_strategic_metrics')

  if (!result.ok || !result.data || result.data.length === 0) {
    return { ok: true, data: fixtureStrategicMetrics, source: 'fixture' }
  }

  const metrics: StrategicDashboardMetric[] = result.data.map(m => ({
    id: m.id,
    metric_type: m.metric_type as StrategicDashboardMetric['metric_type'],
    label: m.label,
    value: Number(m.value),
    unit: m.unit,
    trend: m.trend as StrategicDashboardMetric['trend'],
    target: Number(m.target),
    market: m.market ?? null,
  }))

  return { ok: true, data: metrics, source: 'db' }
}
