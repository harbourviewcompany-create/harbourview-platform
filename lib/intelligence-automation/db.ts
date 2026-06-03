import 'server-only'
import {
  fetchAdminSupabaseJson,
  getAdminDataClient,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient'
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
  SignalStage,
  AgentTaskStatus,
} from './types'

type Row = Record<string, unknown>

const EMPTY: never[] = []

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function isoDate(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

function rowToSource(r: Row): AutomationSource {
  return {
    id: str(r.id),
    name: str(r.name),
    category: str(r.category) as AutomationSource['category'],
    markets: arr(r.markets),
    reliability: str(r.reliability, 'unverified') as AutomationSource['reliability'],
    lastChecked: str(r.last_checked),
    nextCheck: str(r.next_check),
    signalYield: num(r.signal_yield),
    status: str(r.status, 'needs_review') as AutomationSource['status'],
    notes: typeof r.notes === 'string' ? r.notes : undefined,
  }
}

function rowToSignal(r: Row): AutomationSignal {
  return {
    id: str(r.id),
    title: str(r.title),
    type: str(r.type) as AutomationSignal['type'],
    stage: str(r.stage, 'new') as SignalStage,
    sourceId: str(r.source_id),
    sourceName: str(r.source_name),
    market: str(r.market),
    category: str(r.category),
    confidence: num(r.confidence),
    commercialImpact: str(r.commercial_impact, 'low') as AutomationSignal['commercialImpact'],
    summary: str(r.summary),
    detectedAt: str(r.detected_at),
    reviewedAt: typeof r.reviewed_at === 'string' ? r.reviewed_at : undefined,
  }
}

function rowToCounterparty(r: Row): RelationshipMemoryRecord {
  return {
    id: str(r.id),
    name: str(r.name),
    role: str(r.role, 'buyer') as RelationshipMemoryRecord['role'],
    markets: arr(r.markets),
    categories: arr(r.categories),
    needsProfile: typeof r.needs_profile === 'string' ? r.needs_profile : undefined,
    supplyProfile: typeof r.supply_profile === 'string' ? r.supply_profile : undefined,
    interactionCount: num(r.interaction_count),
    lastInteraction: str(r.last_interaction),
    introductionCount: num(r.introduction_count),
    documentationStatus: str(r.documentation_status, 'missing') as RelationshipMemoryRecord['documentationStatus'],
    notes: typeof r.notes === 'string' ? r.notes : undefined,
  }
}

function rowToScoring(r: Row): ScoringRecord {
  return {
    id: str(r.id),
    counterpartyId: str(r.counterparty_id),
    counterpartyName: str(r.counterparty_name),
    counterpartyRole: str(r.counterparty_role, 'buyer') as ScoringRecord['counterpartyRole'],
    fitScore: num(r.fit_score),
    readinessScore: num(r.readiness_score),
    trustScore: num(r.trust_score),
    routingPriority: str(r.routing_priority, 'low') as ScoringRecord['routingPriority'],
    followUpPriority: str(r.follow_up_priority, 'when_ready') as ScoringRecord['followUpPriority'],
    introductionPriority: str(r.introduction_priority, 'not_ready') as ScoringRecord['introductionPriority'],
    marketAccessRelevance: arr(r.market_access_relevance),
    scoredAt: str(r.scored_at),
    scoreDrivers: arr(r.score_drivers),
  }
}

function rowToAgentTask(r: Row): AgentWorkItem {
  return {
    id: str(r.id),
    queue: str(r.queue, 'source_watcher') as AgentWorkItem['queue'],
    title: str(r.title),
    objectType: str(r.object_type),
    objectLabel: str(r.object_label),
    priority: str(r.priority, 'low') as AgentWorkItem['priority'],
    suggestedAction: str(r.suggested_action),
    rationale: str(r.rationale),
    status: str(r.status, 'pending') as AgentTaskStatus,
    agentLabel: str(r.agent_label),
    nextAction: str(r.next_action),
    createdAt: isoDate(r.created_at),
  }
}

function rowToEvidence(r: Row): EvidenceVaultEntry {
  return {
    id: str(r.id),
    title: str(r.title),
    type: str(r.type, 'commercial_note') as EvidenceVaultEntry['type'],
    linkedCounterpartyName: typeof r.linked_counterparty_name === 'string' ? r.linked_counterparty_name : undefined,
    linkedMarket: typeof r.linked_market === 'string' ? r.linked_market : undefined,
    reviewStatus: str(r.review_status, 'pending') as EvidenceVaultEntry['reviewStatus'],
    addedAt: str(r.added_at),
    tags: arr(r.tags),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
  }
}

function rowToGraphEntity(r: Row): GraphEntity {
  return {
    id: str(r.id),
    type: str(r.type, 'source') as GraphEntity['type'],
    label: str(r.label),
    market: typeof r.market === 'string' ? r.market : undefined,
    category: typeof r.category === 'string' ? r.category : undefined,
    connectionCount: num(r.connection_count),
    signalCount: num(r.signal_count),
    lastActivity: typeof r.last_activity === 'string' ? r.last_activity : undefined,
  }
}

function rowToGraphEdge(r: Row): GraphEdge {
  return {
    id: str(r.id),
    type: str(r.type, 'generated_signal') as GraphEdge['type'],
    fromLabel: str(r.from_label),
    toLabel: str(r.to_label),
    strength: str(r.strength, 'weak') as GraphEdge['strength'],
    evidenced: bool(r.evidenced),
    createdAt: isoDate(r.created_at),
  }
}

function rowToFeedback(r: Row): FeedbackEvent {
  return {
    id: str(r.id),
    outcomeType: str(r.outcome_type, 'reviewed') as FeedbackEvent['outcomeType'],
    counterpartyName: typeof r.counterparty_name === 'string' ? r.counterparty_name : undefined,
    market: str(r.market),
    category: str(r.category),
    scoreImpact: str(r.score_impact, 'neutral') as FeedbackEvent['scoreImpact'],
    routingImpact: str(r.routing_impact),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    loggedAt: str(r.logged_at),
  }
}

async function adminPatch(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<AdminDataResult<unknown>> {
  const client = getAdminDataClient()
  if (!client.ok) return client
  const response = await fetch(`${client.data.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
    cache: 'no-store',
  })
  if (!response.ok) {
    const text = await response.text()
    return {
      ok: false,
      error: {
        code: 'request_failed',
        message: `Supabase PATCH ${table} returned ${response.status}: ${text.slice(0, 240)}`,
      },
    }
  }
  return { ok: true, data: null }
}

async function adminInsert<T>(table: string, row: Record<string, unknown>): Promise<AdminDataResult<T>> {
  const client = getAdminDataClient()
  if (!client.ok) return client
  const response = await fetch(`${client.data.url}/rest/v1/${table}?select=*`, {
    method: 'POST',
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
    cache: 'no-store',
  })
  const text = await response.text()
  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: 'request_failed',
        message: `Supabase POST ${table} returned ${response.status}: ${text.slice(0, 240)}`,
      },
    }
  }
  return { ok: true, data: (text ? JSON.parse(text) : null) as T }
}

export async function listIaSources(): Promise<AdminDataResult<AutomationSource[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_sources?select=*&order=name.asc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToSource) }
}

export async function listIaSignals(): Promise<AdminDataResult<AutomationSignal[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_signals?select=*&order=detected_at.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToSignal) }
}

export async function listIaSignalsByMarket(market: string, limit = 12): Promise<AdminDataResult<AutomationSignal[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signals?market=eq.${encodeURIComponent(market)}&select=*&order=detected_at.desc&limit=${limit}`,
  )
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToSignal) }
}

export async function countIaSignalsByMarket(market: string): Promise<number> {
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signals?market=eq.${encodeURIComponent(market)}&select=id&stage=neq.archived`,
  )
  return result.ok ? result.data.length : 0
}

export async function getIaSignal(id: string): Promise<AdminDataResult<AutomationSignal | null>> {
  const result = await fetchAdminSupabaseJson<Row[]>(`/rest/v1/ia_signals?id=eq.${encodeURIComponent(id)}&select=*`)
  if (!result.ok) return { ok: true, data: null }
  return { ok: true, data: result.data[0] ? rowToSignal(result.data[0]) : null }
}

export async function advanceIaSignalStage(
  id: string,
  stage: SignalStage,
  reviewedBy?: string,
): Promise<AdminDataResult<unknown>> {
  return adminPatch('ia_signals', id, {
    stage,
    reviewed_at: new Date().toISOString().slice(0, 10),
    reviewed_by: reviewedBy ?? null,
    updated_at: new Date().toISOString(),
  })
}

export async function listIaCounterparties(): Promise<AdminDataResult<RelationshipMemoryRecord[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_counterparties?select=*&order=name.asc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToCounterparty) }
}

export async function listIaScoringRecords(): Promise<AdminDataResult<ScoringRecord[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_scoring_records?select=*&order=fit_score.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToScoring) }
}

export async function listIaAgentTasks(): Promise<AdminDataResult<AgentWorkItem[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_agent_tasks?select=*&order=created_at.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToAgentTask) }
}

export async function updateIaAgentTaskStatus(
  id: string,
  status: AgentTaskStatus,
  notes?: string,
  completedBy?: string,
): Promise<AdminDataResult<unknown>> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (notes !== undefined) patch.notes = notes
  if (status === 'completed') {
    patch.completed_at = new Date().toISOString()
    patch.completed_by = completedBy ?? null
  }
  return adminPatch('ia_agent_tasks', id, patch)
}

export async function listIaEvidence(): Promise<AdminDataResult<EvidenceVaultEntry[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_evidence_vault?select=*&order=added_at.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToEvidence) }
}

export async function updateIaEvidenceReviewStatus(
  id: string,
  reviewStatus: 'pending' | 'reviewed' | 'needs_action' | 'archived',
  reviewedBy?: string,
): Promise<AdminDataResult<unknown>> {
  return adminPatch('ia_evidence_vault', id, {
    review_status: reviewStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewedBy ?? null,
    updated_at: new Date().toISOString(),
  })
}

export async function listIaGraphEntities(): Promise<AdminDataResult<GraphEntity[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_graph_entities?select=*&order=connection_count.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToGraphEntity) }
}

export async function listIaGraphEdges(): Promise<AdminDataResult<GraphEdge[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_graph_edges?select=*&order=created_at.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToGraphEdge) }
}

export async function listIaFeedbackEvents(): Promise<AdminDataResult<FeedbackEvent[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>('/rest/v1/ia_feedback_events?select=*&order=logged_at.desc')
  if (!result.ok || !result.data.length) return { ok: true, data: EMPTY }
  return { ok: true, data: result.data.map(rowToFeedback) }
}

export async function logIaFeedbackEvent(payload: {
  outcomeType: string
  counterpartyName?: string
  market: string
  category: string
  scoreImpact: 'positive' | 'negative' | 'neutral'
  routingImpact: string
  notes?: string
  loggedBy?: string
}): Promise<AdminDataResult<FeedbackEvent[]>> {
  return adminInsert<FeedbackEvent[]>('ia_feedback_events', {
    outcome_type: payload.outcomeType,
    counterparty_name: payload.counterpartyName ?? null,
    market: payload.market,
    category: payload.category,
    score_impact: payload.scoreImpact,
    routing_impact: payload.routingImpact,
    notes: payload.notes ?? null,
    logged_at: new Date().toISOString().slice(0, 10),
    logged_by: payload.loggedBy ?? null,
    created_at: new Date().toISOString(),
  })
}

export type SignalCandidateRow = {
  id: string
  title: string
  summary: string | null
  signal_type: string
  marketplace_category: string | null
  status: string
  model_confidence_score: number | null
  final_signal_score: number | null
  commercial_relevance_score: number | null
  inferred_company_name: string | null
  inferred_location: string | null
  inferred_product_type: string | null
  jurisdiction_country: string | null
  created_at: string
  updated_at: string
}

export async function listSignalCandidates(status?: string): Promise<AdminDataResult<SignalCandidateRow[]>> {
  const statusFilter = status ? `&status=eq.${encodeURIComponent(status)}` : ''
  return fetchAdminSupabaseJson<SignalCandidateRow[]>(
    `/rest/v1/signal_candidates?select=id,title,summary,signal_type,marketplace_category,status,model_confidence_score,final_signal_score,commercial_relevance_score,inferred_company_name,inferred_location,inferred_product_type,jurisdiction_country,created_at,updated_at&order=created_at.desc${statusFilter}&limit=100`,
  )
}

export async function advanceSignalCandidateStatus(
  id: string,
  status: string,
  reviewNotes?: string,
): Promise<AdminDataResult<unknown>> {
  return adminPatch('signal_candidates', id, {
    status,
    review_notes: reviewNotes ?? null,
    updated_at: new Date().toISOString(),
  })
}
