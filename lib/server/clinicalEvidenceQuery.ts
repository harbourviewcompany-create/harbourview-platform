import 'server-only'
import type {
  ClinicalEvidenceChangeEventDTO,
  ClinicalEvidenceRecordDTO,
  ClinicalEvidenceSearchResult,
} from '@/lib/clinical/evidence'
import { clinicalEvidenceStateMessage, deriveClinicalEvidenceState } from '@/lib/clinical/evidence'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const EVIDENCE_SELECT = [
  'id','slug','title','summary','condition_label','condition_aliases','population','intervention','formulation',
  'cannabinoids','intervention_class','comparator','outcome','evidence_type','evidence_strength',
  'evidence_strength_method','uncertainty','conflict_status','jurisdictions','profession_relevance',
  'primary_source_title','primary_source_publisher','primary_source_url','primary_source_id',
  'publication_date','effective_date','verified_at','supersession_state','superseded_by_id','review_status',
].join(',')

const CHANGE_SELECT = [
  'id','evidence_record_id','event_type','title','summary','materiality','jurisdictions','profession_relevance',
  'occurred_at','verified_at','primary_source_title','primary_source_publisher','primary_source_url','primary_source_id',
].join(',')

type Row = Record<string, unknown>

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function mapEvidence(row: Row): ClinicalEvidenceRecordDTO {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    condition: text(row.condition_label),
    conditionAliases: strings(row.condition_aliases),
    population: text(row.population),
    intervention: text(row.intervention),
    formulation: text(row.formulation),
    cannabinoid: strings(row.cannabinoids),
    interventionClass: row.intervention_class as ClinicalEvidenceRecordDTO['interventionClass'],
    comparator: text(row.comparator),
    outcome: text(row.outcome),
    evidenceType: row.evidence_type as ClinicalEvidenceRecordDTO['evidenceType'],
    evidenceStrength: row.evidence_strength as ClinicalEvidenceRecordDTO['evidenceStrength'],
    evidenceStrengthMethod: text(row.evidence_strength_method),
    uncertainty: text(row.uncertainty),
    conflictStatus: row.conflict_status as ClinicalEvidenceRecordDTO['conflictStatus'],
    jurisdiction: strings(row.jurisdictions),
    professionRelevance: strings(row.profession_relevance),
    primarySource: {
      title: String(row.primary_source_title),
      publisher: String(row.primary_source_publisher),
      url: String(row.primary_source_url),
      sourceId: text(row.primary_source_id),
    },
    publicationDate: text(row.publication_date),
    effectiveDate: text(row.effective_date),
    verifiedAt: String(row.verified_at),
    supersessionState: row.supersession_state as ClinicalEvidenceRecordDTO['supersessionState'],
    supersededById: text(row.superseded_by_id),
    reviewStatus: row.review_status as ClinicalEvidenceRecordDTO['reviewStatus'],
  }
}

function mapChange(row: Row): ClinicalEvidenceChangeEventDTO {
  return {
    id: String(row.id),
    evidenceRecordId: text(row.evidence_record_id),
    eventType: row.event_type as ClinicalEvidenceChangeEventDTO['eventType'],
    title: String(row.title),
    summary: String(row.summary),
    materiality: row.materiality as ClinicalEvidenceChangeEventDTO['materiality'],
    jurisdiction: strings(row.jurisdictions),
    professionRelevance: strings(row.profession_relevance),
    occurredAt: String(row.occurred_at),
    verifiedAt: String(row.verified_at),
    primarySource: {
      title: String(row.primary_source_title),
      publisher: String(row.primary_source_publisher),
      url: String(row.primary_source_url),
      sourceId: text(row.primary_source_id),
    },
  }
}

async function rest(path: string): Promise<Row[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    next: { revalidate: 300 },
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!response.ok) throw new Error(`clinical_evidence_query_${response.status}`)
  return response.json()
}

function normalized(value: string): string {
  return value.trim().toLowerCase()
}

export async function searchClinicalEvidence(input: {
  query?: string
  jurisdiction?: string
  profession?: string
  limit?: number
}): Promise<ClinicalEvidenceSearchResult> {
  const query = input.query?.trim() ?? ''
  const limit = Math.max(1, Math.min(input.limit ?? 20, 50))
  const jurisdiction = input.jurisdiction?.trim()
  const profession = input.profession?.trim()

  try {
    const base = new URLSearchParams({
      select: EVIDENCE_SELECT,
      review_status: 'eq.published',
      order: 'verified_at.desc',
      limit: String(limit),
    })
    if (jurisdiction) base.set('jurisdictions', `cs.{${jurisdiction}}`)
    if (profession && normalized(profession) !== 'all roles') base.set('profession_relevance', `cs.{${profession}}`)

    const allRows = await rest(`clinical_evidence_records?${base}`)
    const allRecords = allRows.map(mapEvidence)
    const needle = normalized(query)
    const records = !needle ? allRecords : allRecords.filter(record => {
      const haystack = [
        record.condition ?? '',
        ...record.conditionAliases,
        record.title,
        record.summary,
        record.population ?? '',
        record.intervention ?? '',
        record.formulation ?? '',
        ...record.cannabinoid,
        record.outcome ?? '',
      ].join(' ').toLowerCase()
      return haystack.includes(needle)
    })

    let knownConditionMatch = false
    if (needle) {
      const conditionParams = new URLSearchParams({
        select: 'canonical_name,aliases',
        review_status: 'eq.published',
        limit: '100',
      })
      const conditionRows = await rest(`clinical_condition_terms?${conditionParams}`)
      knownConditionMatch = conditionRows.some(row => {
        const terms = [text(row.canonical_name) ?? '', ...strings(row.aliases)].map(normalized)
        return terms.some(term => term === needle || term.includes(needle) || needle.includes(term))
      })
    }

    const changeParams = new URLSearchParams({
      select: CHANGE_SELECT,
      order: 'occurred_at.desc',
      limit: '10',
    })
    if (jurisdiction) changeParams.set('jurisdictions', `cs.{${jurisdiction}}`)
    if (profession && normalized(profession) !== 'all roles') changeParams.set('profession_relevance', `cs.{${profession}}`)
    const changes = (await rest(`clinical_evidence_change_events?${changeParams}`)).map(mapChange)

    const state = deriveClinicalEvidenceState({ query, records, knownConditionMatch })
    return { state, query, records, changes, message: clinicalEvidenceStateMessage(state) }
  } catch {
    const state = deriveClinicalEvidenceState({ query, records: [], error: true })
    return { state, query, records: [], changes: [], message: clinicalEvidenceStateMessage(state) }
  }
}
