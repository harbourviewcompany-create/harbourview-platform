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
import {
  automationSources,
  automationSignals,
  relationshipMemory,
  scoringRecords,
  agentQueue,
  evidenceVault,
  graphEntities,
  graphEdges,
  feedbackEvents,
} from './fixtures'

// ── Type mappings: Supabase row → typed domain object ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSource(r: any): AutomationSource {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    markets: r.markets ?? [],
    reliability: r.reliability,
    lastChecked: r.last_checked ?? '',
    nextCheck: r.next_check ?? '',
    signalYield: r.signal_yield ?? 0,
    status: r.status,
    notes: r.notes ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSignal(r: any): AutomationSignal {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    stage: r.stage,
    sourceId: r.source_id ?? '',
    sourceName: r.source_name,
    market: r.market,
    category: r.category,
    confidence: r.confidence,
    commercialImpact: r.commercial_impact,
    summary: r.summary,
    detectedAt: r.detected_at ?? '',
    reviewedAt: r.reviewed_at ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCounterparty(r: any): RelationshipMemoryRecord {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    markets: r.markets ?? [],
    categories: r.categories ?? [],
    needsProfile: r.needs_profile ?? undefined,
    supplyProfile: r.supply_profile ?? undefined,
    interactionCount: r.interaction_count ?? 0,
    lastInteraction: r.last_interaction ?? '',
    introductionCount: r.introduction_count ?? 0,
    documentationStatus: r.documentation_status,
    notes: r.notes ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToScoring(r: any): ScoringRecord {
  return {
    id: r.id,
    counterpartyId: r.counterparty_id ?? '',
    counterpartyName: r.counterparty_name,
    counterpartyRole: r.counterparty_role,
    fitScore: r.fit_score,
    readinessScore: r.readiness_score,
    trustScore: r.trust_score,
    routingPriority: r.routing_priority,
    followUpPriority: r.follow_up_priority,
    introductionPriority: r.introduction_priority,
    marketAccessRelevance: r.market_access_relevance ?? [],
    scoredAt: r.scored_at ?? '',
    scoreDrivers: r.score_drivers ?? [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAgentTask(r: any): AgentWorkItem {
  return {
    id: r.id,
    queue: r.queue,
    title: r.title,
    objectType: r.object_type,
    objectLabel: r.object_label,
    priority: r.priority,
    suggestedAction: r.suggested_action,
    rationale: r.rationale,
    status: r.status,
    agentLabel: r.agent_label,
    nextAction: r.next_action,
    createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvidence(r: any): EvidenceVaultEntry {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    linkedCounterpartyName: r.linked_counterparty_name ?? undefined,
    linkedMarket: r.linked_market ?? undefined,
    reviewStatus: r.review_status,
    addedAt: r.added_at ?? '',
    tags: r.tags ?? [],
    notes: r.notes ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGraphEntity(r: any): GraphEntity {
  return {
    id: r.id,
    type: r.type,
    label: r.label,
    market: r.market ?? undefined,
    category: r.category ?? undefined,
    connectionCount: r.connection_count ?? 0,
    signalCount: r.signal_count ?? 0,
    lastActivity: r.last_activity ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGraphEdge(r: any): GraphEdge {
  return {
    id: r.id,
    type: r.type,
    fromLabel: r.from_label,
    toLabel: r.to_label,
    strength: r.strength,
    evidenced: r.evidenced ?? false,
    createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFeedback(r: any): FeedbackEvent {
  return {
    id: r.id,
    outcomeType: r.outcome_type,
    counterpartyName: r.counterparty_name ?? undefined,
    market: r.market,
    category: r.category,
    scoreImpact: r.score_impact,
    routingImpact: r.routing_impact,
    notes: r.notes ?? undefined,
    loggedAt: r.logged_at ?? '',
  }
}

// ── Admin mutation helper ──────────────────────────────────────────────────────

async function adminPatch(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<AdminDataResult<unknown>> {
  const client = getAdminDataClient()
  if (!client.ok) return client
  const response = await fetch(
    `${client.data.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
      cache: 'no-store',
    },
  )
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

async function adminInsert<T>(
  table: string,
  row: Record<string, unknown>,
): Promise<AdminDataResult<T>> {
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

// ── READ: Sources ─────────────────────────────────────────────────────────────

export async function listIaSources(): Promise<AdminDataResult<AutomationSource[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_sources?select=*&order=name.asc',
  )
  if (!result.ok) return { ok: true, data: automationSources } // fixture fallback
  if (!result.data.length) return { ok: true, data: automationSources }
  return { ok: true, data: result.data.map(rowToSource) }
}

// ── READ: Signals ─────────────────────────────────────────────────────────────

export async function listIaSignals(): Promise<AdminDataResult<AutomationSignal[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_signals?select=*&order=detected_at.desc',
  )
  if (!result.ok) return { ok: true, data: automationSignals }
  if (!result.data.length) return { ok: true, data: automationSignals }
  return { ok: true, data: result.data.map(rowToSignal) }
}

// ── READ: Signals by market (for country dashboard) ───────────────────────────

export async function listIaSignalsByMarket(
  market: string,
  limit = 12,
): Promise<AdminDataResult<AutomationSignal[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    `/rest/v1/ia_signals?market=eq.${encodeURIComponent(market)}&select=*&order=detected_at.desc&limit=${limit}`,
  )
  if (!result.ok) {
    const fallback = automationSignals.filter(
      (s) => s.market.toLowerCase() === market.toLowerCase(),
    )
    return { ok: true, data: fallback }
  }
  return { ok: true, data: result.data.map(rowToSignal) }
}

export async function countIaSignalsByMarket(market: string): Promise<number> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    `/rest/v1/ia_signals?market=eq.${encodeURIComponent(market)}&select=id&stage=neq.archived`,
  )
  if (!result.ok) {
    return automationSignals.filter(
      (s) => s.market.toLowerCase() === market.toLowerCase() && s.stage !== 'archived',
    ).length
  }
  return result.data.length
}

export async function getIaSignal(id: string): Promise<AdminDataResult<AutomationSignal | null>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    `/rest/v1/ia_signals?id=eq.${encodeURIComponent(id)}&select=*`,
  )
  if (!result.ok) {
    const fixture = automationSignals.find((s) => s.id === id) ?? null
    return { ok: true, data: fixture }
  }
  return { ok: true, data: result.data[0] ? rowToSignal(result.data[0]) : null }
}

// ── WRITE: Signals ────────────────────────────────────────────────────────────

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

// ── READ: Counterparties ──────────────────────────────────────────────────────

export async function listIaCounterparties(): Promise<AdminDataResult<RelationshipMemoryRecord[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_counterparties?select=*&order=name.asc',
  )
  if (!result.ok) return { ok: true, data: relationshipMemory }
  if (!result.data.length) return { ok: true, data: relationshipMemory }
  return { ok: true, data: result.data.map(rowToCounterparty) }
}

// ── READ: Scoring ─────────────────────────────────────────────────────────────

export async function listIaScoringRecords(): Promise<AdminDataResult<ScoringRecord[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_scoring_records?select=*&order=fit_score.desc',
  )
  if (!result.ok) return { ok: true, data: scoringRecords }
  if (!result.data.length) return { ok: true, data: scoringRecords }
  return { ok: true, data: result.data.map(rowToScoring) }
}

// ── READ: Agent Tasks ─────────────────────────────────────────────────────────

export async function listIaAgentTasks(): Promise<AdminDataResult<AgentWorkItem[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_agent_tasks?select=*&order=created_at.desc',
  )
  if (!result.ok) return { ok: true, data: agentQueue }
  if (!result.data.length) return { ok: true, data: agentQueue }
  return { ok: true, data: result.data.map(rowToAgentTask) }
}

// ── WRITE: Agent Tasks ────────────────────────────────────────────────────────

export async function updateIaAgentTaskStatus(
  id: string,
  status: AgentTaskStatus,
  notes?: string,
  completedBy?: string,
): Promise<AdminDataResult<unknown>> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (notes !== undefined) patch.notes = notes
  if (status === 'completed') {
    patch.completed_at = new Date().toISOString()
    patch.completed_by = completedBy ?? null
  }
  return adminPatch('ia_agent_tasks', id, patch)
}

// ── READ: Evidence Vault ──────────────────────────────────────────────────────

export async function listIaEvidence(): Promise<AdminDataResult<EvidenceVaultEntry[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_evidence_vault?select=*&order=added_at.desc',
  )
  if (!result.ok) return { ok: true, data: evidenceVault }
  if (!result.data.length) return { ok: true, data: evidenceVault }
  return { ok: true, data: result.data.map(rowToEvidence) }
}

// ── WRITE: Evidence Vault ─────────────────────────────────────────────────────

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

// ── READ: Graph ───────────────────────────────────────────────────────────────

export async function listIaGraphEntities(): Promise<AdminDataResult<GraphEntity[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_graph_entities?select=*&order=connection_count.desc',
  )
  if (!result.ok) return { ok: true, data: graphEntities }
  if (!result.data.length) return { ok: true, data: graphEntities }
  return { ok: true, data: result.data.map(rowToGraphEntity) }
}

export async function listIaGraphEdges(): Promise<AdminDataResult<GraphEdge[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_graph_edges?select=*&order=created_at.desc',
  )
  if (!result.ok) return { ok: true, data: graphEdges }
  if (!result.data.length) return { ok: true, data: graphEdges }
  return { ok: true, data: result.data.map(rowToGraphEdge) }
}

// ── READ: Feedback ────────────────────────────────────────────────────────────

export async function listIaFeedbackEvents(): Promise<AdminDataResult<FeedbackEvent[]>> {
  const result = await fetchAdminSupabaseJson<Record<string, unknown>[]>(
    '/rest/v1/ia_feedback_events?select=*&order=logged_at.desc',
  )
  if (!result.ok) return { ok: true, data: feedbackEvents }
  if (!result.data.length) return { ok: true, data: feedbackEvents }
  return { ok: true, data: result.data.map(rowToFeedback) }
}

// ── WRITE: Feedback ───────────────────────────────────────────────────────────

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

// ── READ: Signal Candidates (signal engine schema) ────────────────────────────
// These are from the 20260430000001 signal engine migration — separate schema.

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

export async function listSignalCandidates(
  status?: string,
): Promise<AdminDataResult<SignalCandidateRow[]>> {
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
