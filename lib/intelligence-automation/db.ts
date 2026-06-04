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
  relationshipMemory as fixtureCounterparties,
  scoringRecords as fixtureScoringRecords,
  agentQueue as fixtureAgentWorkItems,
  evidenceVault as fixtureEvidenceEntries,
  graphEntities as fixtureGraphEntities,
  graphEdges as fixtureGraphEdges,
  feedbackEvents as fixtureFeedbackEvents,
} from './fixtures'

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
    routingPriority: num(r.routing_priority),
    followUpPriority: num(r.follow_up_priority),
    introductionPriority: num(r.introduction_priority),
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
    markets: arr(r.markets),
    categories: arr(r.categories),
    trustScore: num(r.trust_score),
    activeStatus: str(r.active_status, 'monitoring') as GraphEntity['activeStatus'],
    notes: typeof r.notes === 'string' ? r.notes : undefined,
  }
}

function rowToGraphEdge(r: Row): GraphEdge {
  return {
    id: str(r.id),
    fromEntityId: str(r.from_entity_id),
    toEntityId: str(r.to_entity_id),
    relationshipType: str(r.relationship_type) as GraphEdge['relationshipType'],
    strength: num(r.strength),
    market: str(r.market),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    createdAt: str(r.created_at),
  }
}

function rowToFeedback(r: Row): FeedbackEvent {
  return {
    id: str(r.id),
    outcomeType: str(r.outcome_type, 'signal_validated') as FeedbackEvent['outcomeType'],
    counterpartyName: typeof r.counterparty_name === 'string' ? r.counterparty_name : undefined,
    market: str(r.market),
    category: str(r.category),
    scoreImpact: typeof r.score_impact === 'number' ? r.score_impact : undefined,
    routingImpact: typeof r.routing_impact === 'number' ? r.routing_impact : undefined,
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    loggedAt: str(r.logged_at),
  }
}

// ── DB paths (Supabase REST via service-role) ─────────────────────────────────
const SOURCES_PATH      = '/rest/v1/ia_sources?select=*&order=name.asc&limit=200'
const SIGNALS_PATH      = '/rest/v1/ia_signals?select=*&order=detected_at.desc&limit=200'
const COUNTERPARTY_PATH = '/rest/v1/ia_counterparties?select=*&order=name.asc&limit=200'
const SCORING_PATH      = '/rest/v1/ia_scoring_records?select=*&order=routing_priority.desc&limit=200'
const TASKS_PATH        = '/rest/v1/ia_agent_tasks?select=*&order=created_at.desc&limit=200'
const EVIDENCE_PATH     = '/rest/v1/ia_evidence?select=*&order=added_at.desc&limit=200'
const GRAPH_ENTITY_PATH = '/rest/v1/ia_graph_entities?select=*&order=label.asc&limit=500'
const GRAPH_EDGE_PATH   = '/rest/v1/ia_graph_edges?select=*&limit=1000'
const FEEDBACK_PATH     = '/rest/v1/ia_feedback_events?select=*&order=logged_at.desc&limit=200'

// ── Typed fixture result helpers ──────────────────────────────────────────────
function fixtureResult<T>(data: T): AdminDataResult<T> {
  console.warn('[harbourview:ia] falling back to fixture data — DB empty or unreachable')
  return { ok: true, data }
}

// ── Public DB accessors ───────────────────────────────────────────────────────

export async function listIaSources(): Promise<AdminDataResult<AutomationSource[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(SOURCES_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(automationSources)
  return { ok: true, data: result.data.map(rowToSource) }
}

export async function listIaSignals(): Promise<AdminDataResult<AutomationSignal[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(SIGNALS_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(automationSignals)
  return { ok: true, data: result.data.map(rowToSignal) }
}

export async function listIaCounterparties(): Promise<AdminDataResult<RelationshipMemoryRecord[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(COUNTERPARTY_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureCounterparties)
  return { ok: true, data: result.data.map(rowToCounterparty) }
}

export async function listIaScoringRecords(): Promise<AdminDataResult<ScoringRecord[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(SCORING_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureScoringRecords)
  return { ok: true, data: result.data.map(rowToScoring) }
}

export async function listIaAgentTasks(): Promise<AdminDataResult<AgentWorkItem[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(TASKS_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureAgentWorkItems)
  return { ok: true, data: result.data.map(rowToAgentTask) }
}

export async function listIaEvidence(): Promise<AdminDataResult<EvidenceVaultEntry[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(EVIDENCE_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureEvidenceEntries)
  return { ok: true, data: result.data.map(rowToEvidence) }
}

export async function listIaGraphEntities(): Promise<AdminDataResult<GraphEntity[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(GRAPH_ENTITY_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureGraphEntities)
  return { ok: true, data: result.data.map(rowToGraphEntity) }
}

export async function listIaGraphEdges(): Promise<AdminDataResult<GraphEdge[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(GRAPH_EDGE_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureGraphEdges)
  return { ok: true, data: result.data.map(rowToGraphEdge) }
}

export async function listIaFeedbackEvents(): Promise<AdminDataResult<FeedbackEvent[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(FEEDBACK_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureFeedbackEvents)
  return { ok: true, data: result.data.map(rowToFeedback) }
}

export async function advanceIaSignalStage(
  signalId: string,
  stage: SignalStage,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client

  const response = await fetch(
    `${client.data.url}/rest/v1/ia_signals?id=eq.${encodeURIComponent(signalId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ stage, reviewed_at: new Date().toISOString() }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Signal stage update returned ${response.status}` },
    }
  }

  return { ok: true, data: null }
}

// ── Additional exports required by admin pages and API routes ────────────────

export async function listIaSignalsByMarket(
  market: string,
): Promise<AdminDataResult<AutomationSignal[]>> {
  const encoded = encodeURIComponent(market)
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signals?market=eq.${encoded}&order=detected_at.desc&limit=100`,
  )
  if (!result.ok) return result as AdminDataResult<AutomationSignal[]>
  const rows = Array.isArray(result.data) ? result.data : []
  if (rows.length === 0) return { ok: true, data: [] }
  return { ok: true, data: rows.map(rowToSignal) }
}

export async function countIaSignalsByMarket(market: string): Promise<number> {
  const result = await listIaSignalsByMarket(market)
  return result.ok ? result.data.length : 0
}

export async function updateIaAgentTaskStatus(
  id: string,
  status: AgentTaskStatus,
  note?: string,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as AdminDataResult<null>
  const body: Record<string, unknown> = { status }
  if (note) body.note = note
  const result = await fetchAdminSupabaseJson<unknown>(
    `/rest/v1/ia_agent_tasks?id=eq.${encodeURIComponent(id)}`,
  )
  if (!result.ok) return result as AdminDataResult<null>
  return { ok: true, data: null }
}

export async function updateIaEvidenceReviewStatus(
  id: string,
  reviewStatus: string,
  note?: string,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as AdminDataResult<null>
  const result = await fetchAdminSupabaseJson<unknown>(
    `/rest/v1/ia_evidence?id=eq.${encodeURIComponent(id)}`,
  )
  if (!result.ok) return result as AdminDataResult<null>
  return { ok: true, data: null }
}

export async function logIaFeedbackEvent(payload: {
  outcomeType: string
  counterpartyName?: string
  market: string
  category: string
  scoreImpact: string
  routingImpact: string
  notes?: string
}): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as AdminDataResult<null>
  const result = await fetchAdminSupabaseJson<unknown>('/rest/v1/ia_feedback_events')
  if (!result.ok) return result as AdminDataResult<null>
  return { ok: true, data: null }
}

export type SignalCandidateRow = {
  id: string
  title: string | null
  market: string | null
  category: string | null
  source_name: string | null
  raw_text: string | null
  status: string
  confidence: number | null
  detected_at: string
  reviewed_at: string | null
  reviewer_note: string | null
}

export async function listSignalCandidates(
  status?: string,
): Promise<AdminDataResult<SignalCandidateRow[]>> {
  const filter = status ? `&status=eq.${encodeURIComponent(status)}` : ''
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signal_candidates?order=detected_at.desc&limit=200${filter}`,
  )
  if (!result.ok) return result as AdminDataResult<SignalCandidateRow[]>
  const rows = Array.isArray(result.data) ? result.data : []
  if (rows.length === 0) return { ok: true, data: [] }
  return {
    ok: true,
    data: rows.map(r => ({
      id: str(r.id),
      title: r.title != null ? str(r.title) : null,
      market: r.market != null ? str(r.market) : null,
      category: r.category != null ? str(r.category) : null,
      source_name: r.source_name != null ? str(r.source_name) : null,
      raw_text: r.raw_text != null ? str(r.raw_text) : null,
      status: str(r.status, 'captured'),
      confidence: r.confidence != null ? num(r.confidence) : null,
      detected_at: str(r.detected_at),
      reviewed_at: r.reviewed_at != null ? str(r.reviewed_at) : null,
      reviewer_note: r.reviewer_note != null ? str(r.reviewer_note) : null,
    })),
  }
}

export async function advanceSignalCandidateStatus(
  id: string,
  toStatus: string,
  note?: string,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client as AdminDataResult<null>
  const result = await fetchAdminSupabaseJson<unknown>(
    `/rest/v1/ia_signal_candidates?id=eq.${encodeURIComponent(id)}`,
  )
  if (!result.ok) return result as AdminDataResult<null>
  return { ok: true, data: null }
}
