import 'server-only'
import {
  fetchAdminSupabaseJson,
  fetchAdminSupabaseJsonMutation,
  getAdminDataClient,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient'
import type {
  AutomationSource,
  AutomationSignal,
  RelationshipMemoryRecord,
  CounterpartyRole,
  ScoringRecord,
  AgentWorkItem,
  EvidenceVaultEntry,
  GraphEntity,
  GraphEdge,
  FeedbackEvent,
  SignalStage,
  AgentTaskStatus,
} from './types'
import type { SignalCandidate } from '@/lib/signals/types'
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
    createdAt: str(r.created_at),
  }
}

function rowToFeedback(r: Row): FeedbackEvent {
  return {
    id: str(r.id),
    outcomeType: str(r.outcome_type, 'ignored') as FeedbackEvent['outcomeType'],
    counterpartyName: typeof r.counterparty_name === 'string' ? r.counterparty_name : undefined,
    market: str(r.market),
    category: str(r.category),
    scoreImpact: str(r.score_impact, 'neutral') as FeedbackEvent['scoreImpact'],
    routingImpact: str(r.routing_impact),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    loggedAt: str(r.logged_at),
  }
}

// ── DB paths (Supabase REST via service-role) ─────────────────────────────────
const SOURCES_PATH      = '/rest/v1/ia_sources_live?select=*&order=name.asc&limit=200'
const SIGNALS_PATH      = '/rest/v1/ia_signals?select=*&order=detected_at.desc&limit=200'
const COUNTERPARTY_PATH = '/rest/v1/ia_counterparties?select=*&order=name.asc&limit=200'
const SCORING_PATH      = '/rest/v1/ia_scoring_records?select=*&order=routing_priority.desc&limit=200'
const TASKS_PATH        = '/rest/v1/ia_agent_tasks?select=*&order=created_at.desc&limit=200'
const EVIDENCE_PATH     = '/rest/v1/ia_evidence_vault?select=*&order=added_at.desc&limit=200'
const GRAPH_ENTITY_PATH = '/rest/v1/ia_graph_entities?select=*&order=label.asc&limit=500'
const GRAPH_EDGE_PATH   = '/rest/v1/ia_graph_edges?select=*&limit=1000'
const FEEDBACK_PATH     = '/rest/v1/ia_feedback_events?select=*&order=logged_at.desc&limit=200'

// ── Typed fixture result helpers ──────────────────────────────────────────────
function fixtureResult<T>(data: T): AdminDataResult<T> {
  console.warn('[harbourview:ia] falling back to fixture data — DB empty or unreachable')
  return { ok: true, data, source: 'fixture' as const }
}

// ── Public DB accessors ───────────────────────────────────────────────────────

export async function listIaSources(): Promise<AdminDataResult<AutomationSource[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(SOURCES_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(automationSources)
  return { ok: true, data: result.data.map(rowToSource), source: 'db' as const }
}

export async function listIaSignals(): Promise<AdminDataResult<AutomationSignal[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(SIGNALS_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(automationSignals)
  return { ok: true, data: result.data.map(rowToSignal), source: 'db' as const }
}

export async function getIaSignalById(id: string): Promise<AdminDataResult<AutomationSignal | null>> {
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signals?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  )
  if (!result.ok) return result
  return { ok: true, data: result.data[0] ? rowToSignal(result.data[0]) : null, source: 'db' as const }
}

export async function listIaCounterparties(): Promise<AdminDataResult<RelationshipMemoryRecord[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(COUNTERPARTY_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureCounterparties)
  return { ok: true, data: result.data.map(rowToCounterparty), source: 'db' as const }
}

export async function listIaScoringRecords(): Promise<AdminDataResult<ScoringRecord[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(SCORING_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureScoringRecords)
  return { ok: true, data: result.data.map(rowToScoring), source: 'db' as const }
}

export async function listIaAgentTasks(): Promise<AdminDataResult<AgentWorkItem[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(TASKS_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureAgentWorkItems)
  return { ok: true, data: result.data.map(rowToAgentTask), source: 'db' as const }
}

export async function listIaEvidence(): Promise<AdminDataResult<EvidenceVaultEntry[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(EVIDENCE_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureEvidenceEntries)
  return { ok: true, data: result.data.map(rowToEvidence), source: 'db' as const }
}

export async function listIaGraphEntities(): Promise<AdminDataResult<GraphEntity[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(GRAPH_ENTITY_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureGraphEntities)
  return { ok: true, data: result.data.map(rowToGraphEntity), source: 'db' as const }
}

export async function listIaGraphEdges(): Promise<AdminDataResult<GraphEdge[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(GRAPH_EDGE_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureGraphEdges)
  return { ok: true, data: result.data.map(rowToGraphEdge), source: 'db' as const }
}

export async function listIaFeedbackEvents(): Promise<AdminDataResult<FeedbackEvent[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(FEEDBACK_PATH)
  if (!result.ok || !result.data?.length) return fixtureResult(fixtureFeedbackEvents)
  return { ok: true, data: result.data.map(rowToFeedback), source: 'db' as const }
}

// ── Market-scoped signal queries ──────────────────────────────────────────────

export async function listIaSignalsByMarket(
  market: string,
): Promise<AdminDataResult<AutomationSignal[]>> {
  const encoded = encodeURIComponent(market)
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signals?market=eq.${encoded}&select=*&order=detected_at.desc&limit=100`,
  )
  if (!result.ok || !result.data?.length) return fixtureResult([])
  return { ok: true, data: result.data.map(rowToSignal), source: 'db' as const }
}

export async function countIaSignalsByMarket(market: string): Promise<number> {
  const encoded = encodeURIComponent(market)
  const result = await fetchAdminSupabaseJson<Row[]>(
    `/rest/v1/ia_signals?market=eq.${encoded}&select=id&limit=500`,
  )
  if (!result.ok || !result.data) return 0
  return result.data.length
}

// ── Signal candidates ─────────────────────────────────────────────────────────

function rowToSignalCandidate(r: Row): SignalCandidate {
  return r as unknown as SignalCandidate
}

export async function listSignalCandidates(): Promise<AdminDataResult<SignalCandidate[]>> {
  const result = await fetchAdminSupabaseJson<Row[]>(
    '/rest/v1/signal_candidates?select=*&order=created_at.desc&limit=200',
  )
  if (!result.ok) return fixtureResult([])
  if (!result.data?.length) return { ok: true, data: [], source: 'db' as const }
  return { ok: true, data: result.data.map(rowToSignalCandidate), source: 'db' as const }
}

export async function advanceSignalCandidateStatus(
  candidateId: string,
  status: string,
  reviewNotes?: string,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client

  const body: Record<string, unknown> = { status, reviewed_at: new Date().toISOString() }
  if (reviewNotes) body.review_notes = reviewNotes

  const response = await fetch(
    `${client.data.url}/rest/v1/signal_candidates?id=eq.${encodeURIComponent(candidateId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Signal candidate update returned ${response.status}` },
    }
  }
  return { ok: true, data: null, source: 'db' as const }
}

// ── Agent task mutations ──────────────────────────────────────────────────────

export async function updateIaAgentTaskStatus(
  taskId: string,
  status: AgentTaskStatus,
  notes?: string,
  _updatedBy?: string,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client

  const body: Record<string, unknown> = { status }
  if (notes) body.notes = notes

  const response = await fetch(
    `${client.data.url}/rest/v1/ia_agent_tasks?id=eq.${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Agent task update returned ${response.status}` },
    }
  }
  return { ok: true, data: null, source: 'db' as const }
}

// ── Evidence mutations ────────────────────────────────────────────────────────

export async function updateIaEvidenceReviewStatus(
  evidenceId: string,
  reviewStatus: EvidenceVaultEntry['reviewStatus'],
  _reviewedBy?: string,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client

  const response = await fetch(
    `${client.data.url}/rest/v1/ia_evidence_vault?id=eq.${encodeURIComponent(evidenceId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ review_status: reviewStatus, reviewed_at: new Date().toISOString() }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Evidence review update returned ${response.status}` },
    }
  }
  return { ok: true, data: null, source: 'db' as const }
}

// ── Feedback mutations ────────────────────────────────────────────────────────

interface LogFeedbackInput {
  outcomeType: string
  counterpartyName?: string
  market: string
  category: string
  scoreImpact: 'positive' | 'negative' | 'neutral'
  routingImpact: string
  notes?: string
  loggedBy: string
}

export async function logIaFeedbackEvent(
  input: LogFeedbackInput,
): Promise<AdminDataResult<null>> {
  const client = getAdminDataClient()
  if (!client.ok) return client

  const response = await fetch(
    `${client.data.url}/rest/v1/ia_feedback_events`,
    {
      method: 'POST',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        outcome_type: input.outcomeType,
        counterparty_name: input.counterpartyName ?? null,
        market: input.market,
        category: input.category,
        score_impact: input.scoreImpact,
        routing_impact: input.routingImpact,
        notes: input.notes ?? null,
        logged_by: input.loggedBy,
        logged_at: new Date().toISOString(),
      }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'request_failed', message: `Feedback log returned ${response.status}` },
    }
  }
  return { ok: true, data: null, source: 'db' as const }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function advanceIaSignalStage(
  signalId: string,
  stage: SignalStage,
  _updatedBy?: string,
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

  return { ok: true, data: null, source: 'db' as const }
}

// ── Counterparty mutations ──────────────────────────────────────────────────

export type CreateCounterpartyInput = {
  name: string
  role: CounterpartyRole
  markets: string[]
  categories: string[]
  needsProfile?: string
  supplyProfile?: string
  notes?: string
}

export async function createIaCounterparty(
  input: CreateCounterpartyInput,
): Promise<AdminDataResult<null>> {
  const id = `rm-${Date.now()}`
  return fetchAdminSupabaseJsonMutation('/rest/v1/ia_counterparties', 'POST', {
    id,
    name: input.name,
    role: input.role,
    markets: input.markets,
    categories: input.categories,
    needs_profile: input.needsProfile ?? null,
    supply_profile: input.supplyProfile ?? null,
    interaction_count: 0,
    introduction_count: 0,
    documentation_status: 'missing',
    last_interaction: null,
    notes: input.notes ?? null,
  })
}

export async function logIaCounterpartyInteraction(
  counterpartyId: string,
  currentInteractionCount: number,
): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation(
    `/rest/v1/ia_counterparties?id=eq.${encodeURIComponent(counterpartyId)}`,
    'PATCH',
    {
      interaction_count: currentInteractionCount + 1,
      last_interaction: new Date().toISOString().slice(0, 10),
    },
  )
}

export async function updateIaCounterpartyDocumentationStatus(
  counterpartyId: string,
  documentationStatus: RelationshipMemoryRecord['documentationStatus'],
): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation(
    `/rest/v1/ia_counterparties?id=eq.${encodeURIComponent(counterpartyId)}`,
    'PATCH',
    { documentation_status: documentationStatus },
  )
}

export async function deleteIaCounterparty(
  counterpartyId: string,
): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation(
    `/rest/v1/ia_counterparties?id=eq.${encodeURIComponent(counterpartyId)}`,
    'DELETE',
    undefined,
  )
}

export type UpdateCounterpartyInput = {
  name: string
  role: CounterpartyRole
  markets: string[]
  categories: string[]
  needsProfile?: string
  supplyProfile?: string
  notes?: string
}

export async function updateIaCounterparty(
  counterpartyId: string,
  input: UpdateCounterpartyInput,
): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation(
    `/rest/v1/ia_counterparties?id=eq.${encodeURIComponent(counterpartyId)}`,
    'PATCH',
    {
      name: input.name,
      role: input.role,
      markets: input.markets,
      categories: input.categories,
      needs_profile: input.needsProfile ?? null,
      supply_profile: input.supplyProfile ?? null,
      notes: input.notes ?? null,
    },
  )
}

