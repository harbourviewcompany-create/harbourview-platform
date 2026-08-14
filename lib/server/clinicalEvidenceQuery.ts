import 'server-only'
import type { ClinicalEvidenceChangeEventDTO, ClinicalEvidenceRecordDTO, ClinicalEvidenceSearchResult } from '@/lib/clinical/evidence'
import { clinicalEvidenceStateMessage, deriveClinicalEvidenceState, synthesizeClinicalEvidence } from '@/lib/clinical/evidence'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CHANGE_SELECT = [
  'id','evidence_record_id','event_type','title','summary','materiality','jurisdictions','profession_relevance',
  'occurred_at','verified_at','primary_source_title','primary_source_publisher','primary_source_url','primary_source_id',
].join(',')

type Row = Record<string, unknown>
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] }
function text(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null }

function mapEvidence(row: Row): ClinicalEvidenceRecordDTO {
  const publicationScope = text(row.publication_scope)
  const freshnessStatus = text(row.freshness_status)
  return {
    id: String(row.id), slug: String(row.slug), title: String(row.title), summary: String(row.summary),
    condition: text(row.condition_label), conditionAliases: strings(row.condition_aliases), population: text(row.population),
    intervention: text(row.intervention), formulation: text(row.formulation), cannabinoid: strings(row.cannabinoids),
    interventionClass: row.intervention_class as ClinicalEvidenceRecordDTO['interventionClass'], comparator: text(row.comparator),
    outcome: text(row.outcome), evidenceType: row.evidence_type as ClinicalEvidenceRecordDTO['evidenceType'],
    evidenceStrength: row.evidence_strength as ClinicalEvidenceRecordDTO['evidenceStrength'], evidenceStrengthMethod: text(row.evidence_strength_method),
    uncertainty: text(row.uncertainty), conflictStatus: row.conflict_status as ClinicalEvidenceRecordDTO['conflictStatus'],
    jurisdiction: strings(row.jurisdictions), professionRelevance: strings(row.profession_relevance),
    primarySource: { title: String(row.primary_source_title), publisher: String(row.primary_source_publisher), url: String(row.primary_source_url), sourceId: text(row.primary_source_id) },
    publicationDate: text(row.publication_date), effectiveDate: text(row.effective_date), verifiedAt: String(row.verified_at),
    supersessionState: row.supersession_state as ClinicalEvidenceRecordDTO['supersessionState'], supersededById: text(row.superseded_by_id),
    reviewStatus: row.review_status as ClinicalEvidenceRecordDTO['reviewStatus'], sourceRegistryId: text(row.primary_source_registry_id),
    gradingMethodKey: text(row.grading_method_key), publicationScope: publicationScope === 'clinical-synthesis' ? 'clinical-synthesis' : 'source-metadata',
    freshnessStatus: freshnessStatus === 'stale' || freshnessStatus === 'review-required' || freshnessStatus === 'source-degraded' ? freshnessStatus : 'current',
    reviewDueAt: text(row.review_due_at), sourceCurrentnessCheckedAt: text(row.source_currentness_checked_at), freshnessReason: text(row.freshness_reason),
  }
}

function mapChange(row: Row): ClinicalEvidenceChangeEventDTO {
  return {
    id: String(row.id), evidenceRecordId: text(row.evidence_record_id), eventType: row.event_type as ClinicalEvidenceChangeEventDTO['eventType'],
    title: String(row.title), summary: String(row.summary), materiality: row.materiality as ClinicalEvidenceChangeEventDTO['materiality'],
    jurisdiction: strings(row.jurisdictions), professionRelevance: strings(row.profession_relevance), occurredAt: String(row.occurred_at),
    verifiedAt: String(row.verified_at), primarySource: { title: String(row.primary_source_title), publisher: String(row.primary_source_publisher), url: String(row.primary_source_url), sourceId: text(row.primary_source_id) },
  }
}

function headers() {
  if (!SUPABASE_ANON_KEY) return null
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' }
}
async function rest(path: string): Promise<Row[]> {
  const authHeaders = headers(); if (!SUPABASE_URL || !authHeaders) throw new Error('clinical_evidence_not_configured')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { next: { revalidate: 300 }, headers: authHeaders })
  if (!response.ok) throw new Error(`clinical_evidence_query_${response.status}`)
  return response.json()
}
async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const authHeaders = headers(); if (!SUPABASE_URL || !authHeaders) throw new Error('clinical_evidence_not_configured')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', cache: 'no-store', headers: authHeaders, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`clinical_evidence_rpc_${name}_${response.status}`)
  return response.json()
}

export async function searchClinicalEvidence(input: { query?: string; jurisdiction?: string; limit?: number }): Promise<ClinicalEvidenceSearchResult> {
  const query = input.query?.trim() ?? ''
  const limit = Math.max(1, Math.min(input.limit ?? 20, 50))
  const jurisdiction = input.jurisdiction?.trim() || null
  try {
    const evidenceRows = await rpc<Row[]>('search_clinical_evidence_records', { p_query: query, p_jurisdiction: jurisdiction, p_limit: limit })
    const records = evidenceRows.map(mapEvidence)
    const knownConditionMatch = query ? await rpc<boolean>('clinical_condition_term_known', { p_query: query }) : false
    const changeParams = new URLSearchParams({ select: CHANGE_SELECT, review_status: 'eq.published', order: 'occurred_at.desc', limit: '10' })
    if (jurisdiction) changeParams.set('jurisdictions', `cs.{${jurisdiction}}`)
    const changes = (await rest(`clinical_evidence_change_events?${changeParams}`)).map(mapChange)
    const state = deriveClinicalEvidenceState({ query, records, knownConditionMatch })
    return { state, query, records, changes, message: clinicalEvidenceStateMessage(state), synthesis: synthesizeClinicalEvidence(records) }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const permission = /_(401|403)$/.test(message)
    const state = deriveClinicalEvidenceState({ query, records: [], permission, error: !permission })
    return { state, query, records: [], changes: [], message: clinicalEvidenceStateMessage(state), synthesis: synthesizeClinicalEvidence([]) }
  }
}
