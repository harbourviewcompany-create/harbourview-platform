import 'server-only'
import type {
  ClinicalClaimProvenanceDTO,
  ClinicalConceptMatchDTO,
  ClinicalCorpusProfileDTO,
  ClinicalEvidenceChangeEventDTO,
  ClinicalEvidenceRecordDTO,
  ClinicalQueryResolutionDTO,
  ClinicalStudyFamilyDTO,
} from '@/lib/clinical/evidence'
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

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return 0
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 'true'
}

function normalizeQuery(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
    claims: [],
    studyFamilies: [],
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

function mapConcept(row: Row): ClinicalConceptMatchDTO {
  return {
    conceptId: requiredText(row, 'concept_id'),
    conceptType: requiredText(row, 'concept_type') as ClinicalConceptMatchDTO['conceptType'],
    canonicalLabel: requiredText(row, 'canonical_label'),
    matchedLabel: requiredText(row, 'matched_label'),
    matchKind: requiredText(row, 'match_kind') as ClinicalConceptMatchDTO['matchKind'],
    matchRank: numberValue(row.match_rank),
    aliases: strings(row.aliases),
  }
}

function mapClaim(row: Row): ClinicalClaimProvenanceDTO {
  return {
    id: requiredText(row, 'id'),
    evidenceRecordId: requiredText(row, 'evidence_record_id'),
    claimKey: requiredText(row, 'claim_key'),
    claimKind: requiredText(row, 'claim_kind') as ClinicalClaimProvenanceDTO['claimKind'],
    claimOrigin: requiredText(row, 'claim_origin') as ClinicalClaimProvenanceDTO['claimOrigin'],
    statement: requiredText(row, 'statement'),
    sourceSnapshotId: requiredText(row, 'source_snapshot_id'),
    sourceLocator: requiredText(row, 'source_locator'),
    verifiedAt: requiredText(row, 'verified_at'),
  }
}

function mapStudyFamily(row: Row): ClinicalStudyFamilyDTO {
  return {
    evidenceRecordId: requiredText(row, 'evidence_record_id'),
    familyKey: requiredText(row, 'family_key'),
    familyKind: requiredText(row, 'family_kind') as ClinicalStudyFamilyDTO['familyKind'],
    title: requiredText(row, 'title'),
    trialRegistryId: text(row.trial_registry_id),
    protocolId: text(row.protocol_id),
    countsAsIndependentStudy: booleanValue(row.counts_as_independent_study),
    publicationRole: requiredText(row, 'publication_role') as ClinicalStudyFamilyDTO['publicationRole'],
    isPrimaryReport: booleanValue(row.is_primary_report),
    overlapNote: text(row.overlap_note),
    verifiedAt: requiredText(row, 'verified_at'),
  }
}

function mapCorpus(row: Row): ClinicalCorpusProfileDTO {
  return {
    recordCount: numberValue(row.record_count),
    currentRecordCount: numberValue(row.current_record_count),
    gradedRecordCount: numberValue(row.graded_record_count),
    conditionCount: numberValue(row.condition_count),
    conceptCount: numberValue(row.concept_count),
    sourceCount: numberValue(row.source_count),
    independentStudyCount: numberValue(row.independent_study_count),
    studyFamilyCount: numberValue(row.study_family_count),
    claimCount: numberValue(row.claim_count),
    claimAnchoredRecordCount: numberValue(row.claim_anchored_record_count),
    lastVerifiedAt: text(row.last_verified_at),
    gradingMethodKey: text(row.grading_method_key),
    gradingMethodVersion: text(row.grading_method_version),
    gradingMethodTitle: text(row.grading_method_title),
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

async function optionalOperatingRpc(name: string, body: Record<string, unknown>): Promise<Row[] | null> {
  try {
    const value = await rpc<unknown>(name, body)
    if (!Array.isArray(value)) throw new ClinicalEvidenceQueryError(`clinical_evidence_schema_invalid_${name}`, 'schema')
    return value as Row[]
  } catch (error) {
    if (error instanceof ClinicalEvidenceQueryError && error.category === 'migration-drift') return null
    throw error
  }
}

function buildResolution(query: string, rows: Row[] | null): ClinicalQueryResolutionDTO | undefined {
  if (!query || rows === null) return undefined
  const conceptMatches = rows.map(mapConcept)
  const expandedTerms: string[] = []
  for (const match of conceptMatches) {
    for (const value of [match.canonicalLabel, match.matchedLabel, ...match.aliases]) {
      if (value && !expandedTerms.some(existing => existing.toLocaleLowerCase() === value.toLocaleLowerCase())) {
        expandedTerms.push(value)
      }
    }
  }
  return {
    normalizedQuery: normalizeQuery(query),
    recognized: conceptMatches.length > 0,
    canonicalLabel: conceptMatches[0]?.canonicalLabel ?? null,
    conceptMatches,
    expandedTerms,
  }
}

function attachOperatingMetadata(
  records: ClinicalEvidenceRecordDTO[],
  claimRows: Row[] | null,
  familyRows: Row[] | null,
): ClinicalEvidenceRecordDTO[] {
  const claims = claimRows?.map(mapClaim) ?? []
  const families = familyRows?.map(mapStudyFamily) ?? []
  return records.map(record => ({
    ...record,
    claims: claims.filter(claim => claim.evidenceRecordId === record.id),
    studyFamilies: families.filter(family => family.evidenceRecordId === record.id),
  }))
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
    let records = (evidenceRows as Row[]).map(mapEvidence)

    const resolutionRows = query
      ? await optionalOperatingRpc('resolve_clinical_query', { p_query: query, p_limit: 12 })
      : []
    const resolution = buildResolution(query, resolutionRows)

    let knownConditionMatch = resolution?.conceptMatches.some(match => match.conceptType === 'condition') ?? false
    if (query && resolutionRows === null) {
      const conditionResult = await rpc<unknown>('clinical_condition_term_known', { p_query: query })
      if (typeof conditionResult !== 'boolean') throw new ClinicalEvidenceQueryError('clinical_evidence_schema_invalid_condition_result', 'schema')
      knownConditionMatch = conditionResult
    }

    const recordIds = records.map(record => record.id)
    if (recordIds.length > 0) {
      const [claimRows, familyRows] = await Promise.all([
        optionalOperatingRpc('clinical_evidence_claims_for_records', { p_record_ids: recordIds }),
        optionalOperatingRpc('clinical_evidence_study_families_for_records', { p_record_ids: recordIds }),
      ])
      records = attachOperatingMetadata(records, claimRows, familyRows)
    }

    const profileRows = await optionalOperatingRpc('clinical_evidence_corpus_profile', { p_jurisdiction: jurisdiction })
    const corpus = profileRows?.[0] ? mapCorpus(profileRows[0]) : undefined

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
      resolution,
      corpus,
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
