import 'server-only'
import type { ClinicalEvidenceChangeEventDTO, ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'
import { clinicalEvidenceStateMessage, deriveClinicalEvidenceState, synthesizeClinicalEvidence } from '@/lib/clinical/evidence'
import {
  classifyClinicalFailure,
  diagnosticForFailure,
  type ClinicalEvidenceApiResult,
  type ClinicalFailureCategory,
} from '@/lib/clinical/runtime'
import { getExpectedSupabaseHost, isExplicitLocalSupabaseUrl } from '@/lib/supabase/env'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CHANGE_SELECT = [
  'id','evidence_record_id','event_type','title','summary','materiality','jurisdictions','profession_relevance',
  'occurred_at','verified_at','primary_source_title','primary_source_publisher','primary_source_url','primary_source_id',
].join(',')

type Row = Record<string, unknown>
type ErrorPayload = { code?: unknown; message?: unknown; details?: unknown; hint?: unknown }

type ClinicalSupabaseConfig = {
  url: string
  headers: {
    apikey: string
    Authorization: string
    Accept: string
    'Content-Type': string
  }
}

class ClinicalEvidenceQueryError extends Error {
  readonly category: ClinicalFailureCategory
  readonly status: number | null
  readonly code: string | null

  constructor(message: string, category: ClinicalFailureCategory, status?: number | null, code?: string | null) {
    super(message)
    this.name = 'ClinicalEvidenceQueryError'
    this.category = category
    this.status = status ?? null
    this.code = code ?? null
  }
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function requiredText(row: Row, key: string): string {
  const value = text(row[key])
  if (!value) throw new ClinicalEvidenceQueryError(`clinical_evidence_schema_invalid_${key}`, 'schema')
  return value
}

function mapEvidence(row: Row): ClinicalEvidenceRecordDTO {
  const publicationScope = text(row.publication_scope)
  const freshnessStatus = text(row.freshness_status)
  return {
    id: requiredText(row, 'id'),
    slug: requiredText(row, 'slug'),
    title: requiredText(row, 'title'),
    summary: requiredText(row, 'summary'),
    condition: text(row.condition_label),
    conditionAliases: strings(row.condition_aliases),
    population: text(row.population),
    intervention: text(row.intervention),
    formulation: text(row.formulation),
    cannabinoid: strings(row.cannabinoids),
    interventionClass: requiredText(row, 'intervention_class') as ClinicalEvidenceRecordDTO['interventionClass'],
    comparator: text(row.comparator),
    outcome: text(row.outcome),
    evidenceType: requiredText(row, 'evidence_type') as ClinicalEvidenceRecordDTO['evidenceType'],
    evidenceStrength: requiredText(row, 'evidence_strength') as ClinicalEvidenceRecordDTO['evidenceStrength'],
    evidenceStrengthMethod: text(row.evidence_strength_method),
    uncertainty: text(row.uncertainty),
    conflictStatus: requiredText(row, 'conflict_status') as ClinicalEvidenceRecordDTO['conflictStatus'],
    jurisdiction: strings(row.jurisdictions),
    professionRelevance: strings(row.profession_relevance),
    primarySource: {
      title: requiredText(row, 'primary_source_title'),
      publisher: requiredText(row, 'primary_source_publisher'),
      url: requiredText(row, 'primary_source_url'),
      sourceId: text(row.primary_source_id),
    },
    publicationDate: text(row.publication_date),
    effectiveDate: text(row.effective_date),
    verifiedAt: requiredText(row, 'verified_at'),
    supersessionState: requiredText(row, 'supersession_state') as ClinicalEvidenceRecordDTO['supersessionState'],
    supersededById: text(row.superseded_by_id),
    reviewStatus: requiredText(row, 'review_status') as ClinicalEvidenceRecordDTO['reviewStatus'],
    sourceRegistryId: text(row.primary_source_registry_id),
    gradingMethodKey: text(row.grading_method_key),
    publicationScope: publicationScope === 'clinical-synthesis' ? 'clinical-synthesis' : 'source-metadata',
    freshnessStatus: freshnessStatus === 'stale' || freshnessStatus === 'review-required' || freshnessStatus === 'source-degraded' ? freshnessStatus : 'current',
    reviewDueAt: text(row.review_due_at),
    sourceCurrentnessCheckedAt: text(row.source_currentness_checked_at),
    freshnessReason: text(row.freshness_reason),
  }
}

function mapChange(row: Row): ClinicalEvidenceChangeEventDTO {
  return {
    id: requiredText(row, 'id'),
    evidenceRecordId: text(row.evidence_record_id),
    eventType: requiredText(row, 'event_type') as ClinicalEvidenceChangeEventDTO['eventType'],
    title: requiredText(row, 'title'),
    summary: requiredText(row, 'summary'),
    materiality: requiredText(row, 'materiality') as ClinicalEvidenceChangeEventDTO['materiality'],
    jurisdiction: strings(row.jurisdictions),
    professionRelevance: strings(row.profession_relevance),
    occurredAt: requiredText(row, 'occurred_at'),
    verifiedAt: requiredText(row, 'verified_at'),
    primarySource: {
      title: requiredText(row, 'primary_source_title'),
      publisher: requiredText(row, 'primary_source_publisher'),
      url: requiredText(row, 'primary_source_url'),
      sourceId: text(row.primary_source_id),
    },
  }
}

function clinicalSupabaseConfig(): ClinicalSupabaseConfig {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new ClinicalEvidenceQueryError('clinical_evidence_not_configured', 'configuration')
  }

  let hostname = ''
  try {
    hostname = new URL(SUPABASE_URL).hostname
  } catch {
    throw new ClinicalEvidenceQueryError('clinical_evidence_not_configured_invalid_supabase_url', 'configuration')
  }

  if (hostname !== getExpectedSupabaseHost() && !isExplicitLocalSupabaseUrl(SUPABASE_URL)) {
    throw new ClinicalEvidenceQueryError('clinical_evidence_environment_mismatch', 'environment-mismatch')
  }

  return {
    url: SUPABASE_URL,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }
}

async function responseError(response: Response, operation: string): Promise<ClinicalEvidenceQueryError> {
  let payload: ErrorPayload = {}
  try {
    payload = await response.clone().json() as ErrorPayload
  } catch {
    payload = { message: await response.text().catch(() => '') }
  }
  const code = typeof payload.code === 'string' ? payload.code : null
  const sourceMessage = [payload.message, payload.details, payload.hint]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
  const message = `${operation}_${response.status}${sourceMessage ? ` ${sourceMessage}` : ''}`
  return new ClinicalEvidenceQueryError(
    message,
    classifyClinicalFailure({ status: response.status, code, message: sourceMessage }),
    response.status,
    code,
  )
}

async function rest(path: string): Promise<Row[]> {
  const config = clinicalSupabaseConfig()
  const response = await fetch(`${config.url}/rest/v1/${path}`, { next: { revalidate: 300 }, headers: config.headers })
  if (!response.ok) throw await responseError(response, 'clinical_evidence_query')
  const body = await response.json()
  if (!Array.isArray(body)) throw new ClinicalEvidenceQueryError('clinical_evidence_schema_invalid_rest_result', 'schema')
  return body as Row[]
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const config = clinicalSupabaseConfig()
  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    cache: 'no-store',
    headers: config.headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await responseError(response, `clinical_evidence_rpc_${name}`)
  return response.json() as Promise<T>
}

export async function searchClinicalEvidence(input: { query?: string; jurisdiction?: string; limit?: number }): Promise<ClinicalEvidenceApiResult> {
  const query = input.query?.trim() ?? ''
  const limit = Math.max(1, Math.min(input.limit ?? 20, 50))
  const jurisdiction = input.jurisdiction?.trim() || null

  try {
    // Profession relevance remains evidence metadata only until the Command role taxonomy
    // is explicitly reconciled with a sourced clinical-profession vocabulary. This query
    // therefore does not accept or apply profession filtering.
    const evidenceRows = await rpc<unknown>('search_clinical_evidence_records', {
      p_query: query,
      p_jurisdiction: jurisdiction,
      p_limit: limit,
    })
    if (!Array.isArray(evidenceRows)) throw new ClinicalEvidenceQueryError('clinical_evidence_schema_invalid_rpc_result', 'schema')
    const records = (evidenceRows as Row[]).map(mapEvidence)

    const conditionResult = query ? await rpc<unknown>('clinical_condition_term_known', { p_query: query }) : false
    if (query && typeof conditionResult !== 'boolean') throw new ClinicalEvidenceQueryError('clinical_evidence_schema_invalid_condition_result', 'schema')
    const knownConditionMatch = query ? conditionResult as boolean : false

    const changeParams = new URLSearchParams({
      select: CHANGE_SELECT,
      review_status: 'eq.published',
      order: 'occurred_at.desc',
      limit: '10',
    })
    if (jurisdiction) changeParams.set('jurisdictions', `cs.{${jurisdiction}}`)
    const changes = (await rest(`clinical_evidence_change_events?${changeParams}`)).map(mapChange)
    const state = deriveClinicalEvidenceState({ query, records, knownConditionMatch })

    return {
      state,
      query,
      records,
      changes,
      message: clinicalEvidenceStateMessage(state),
      synthesis: synthesizeClinicalEvidence(records),
    }
  } catch (error) {
    const typed = error instanceof ClinicalEvidenceQueryError ? error : null
    const message = error instanceof Error ? error.message : ''
    const category = typed?.category ?? classifyClinicalFailure({ message })
    const permission = category === 'permission'
    const state = deriveClinicalEvidenceState({ query, records: [], permission, error: !permission })

    return {
      state,
      query,
      records: [],
      changes: [],
      message: clinicalEvidenceStateMessage(state),
      synthesis: synthesizeClinicalEvidence([]),
      diagnostic: diagnosticForFailure(category, typed?.status),
    }
  }
}
