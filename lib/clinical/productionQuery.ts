/**
 * Production clinical evidence query layer
 * Prefers live Supabase spine; falls back to fixtures only when the live spine is unreachable.
 * Never substitutes fixture claims for a successful live zero-result response.
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  type ClinicalEvidenceRecordDTO,
  type ClinicalEvidenceSearchResult,
  deriveClinicalEvidenceState,
  clinicalEvidenceStateMessage,
  synthesizeClinicalEvidence,
} from '@/lib/clinical/evidence'
import { searchEvidence, EVIDENCE_FIXTURES } from '@/lib/fixtures/clinical/evidence'
import type { EvidenceRecord, EvidenceStrength } from '@/lib/clinical/types'

/**
 * EvidenceStrength (fixture vocabulary) -> ClinicalEvidenceCertainty (DTO
 * vocabulary). These are two different unions and only four of the five values
 * line up, so the mapping has to be explicit.
 *
 * This previously read `(r.strength === 'very_low' ? 'very-low' : r.strength)
 * as any`, which handled the underscore but passed 'insufficient' straight
 * through — a value that is not in ClinicalEvidenceCertainty at all. Anything
 * reading the DTO then saw an out-of-union string; `evidence.ts` counts a
 * record as graded unless its strength is 'ungraded' or 'conflicted', so an
 * 'insufficient' record was being counted as graded. Typing as Record<> makes
 * the compiler require every EvidenceStrength key, so a new value cannot be
 * added upstream without a decision here.
 */
const CERTAINTY_BY_STRENGTH: Record<EvidenceStrength, ClinicalEvidenceRecordDTO['evidenceStrength']> = {
  high: 'high',
  moderate: 'moderate',
  low: 'low',
  very_low: 'very-low',
  insufficient: 'ungraded',
}

/**
 * The columns this module reads off clinical_evidence_records. Partial by
 * design — the select list is explicit and these are the fields the mapper
 * touches.
 */
interface ClinicalEvidenceRow {
  id: string
  slug: string
  title: string
  summary: string
  condition_label: string
  condition_aliases: string[] | null
  population: string
  intervention: string
  formulation: string
  cannabinoids: string[] | null
  intervention_class: ClinicalEvidenceRecordDTO['interventionClass']
  comparator: string | null
  outcome: string | null
  evidence_type: ClinicalEvidenceRecordDTO['evidenceType']
  evidence_strength: ClinicalEvidenceRecordDTO['evidenceStrength']
  evidence_strength_method: string | null
  uncertainty: string | null
  conflict_status: ClinicalEvidenceRecordDTO['conflictStatus']
  jurisdictions: string[] | null
  profession_relevance: ClinicalEvidenceRecordDTO['professionRelevance'] | null
  primary_source_title: string
  primary_source_publisher: string
  primary_source_url: string
  primary_source_id: string | null
  publication_date: string | null
  effective_date: string | null
  verified_at: string // NOT NULL in production
  supersession_state: ClinicalEvidenceRecordDTO['supersessionState']
  superseded_by_id: string | null
  review_status: ClinicalEvidenceRecordDTO['reviewStatus']
  source_registry_id: string | null
  grading_method_key: string | null
  publication_scope: ClinicalEvidenceRecordDTO['publicationScope']
  freshness_status: ClinicalEvidenceRecordDTO['freshnessStatus']
  review_due_at: string | null
  source_currentness_checked_at: string | null
  freshness_reason: string | null
}

function mapFixtureToDTO(r: EvidenceRecord): ClinicalEvidenceRecordDTO {
  return {
    id: r.id,
    slug: r.id,
    title: r.title,
    summary: r.summary,
    condition: r.condition,
    conditionAliases: [],
    population: r.population?.join(', ') ?? null,
    intervention: r.cannabinoidFocus?.join(', ') ?? null,
    formulation: r.route ?? null,
    cannabinoid: r.cannabinoidFocus ?? [],
    interventionClass: 'regulated-cannabinoid-drug',
    comparator: null,
    outcome: null,
    evidenceType:
      r.domain === 'efficacy'
        ? 'randomized-trial'
        : r.domain === 'safety'
          ? 'pharmacovigilance-signal'
          : 'other',
    evidenceStrength: CERTAINTY_BY_STRENGTH[r.strength],
    evidenceStrengthMethod: null,
    uncertainty: r.limitations?.join('; ') ?? null,
    conflictStatus: 'none',
    jurisdiction: r.jurisdictions ?? [],
    professionRelevance: ['clinician', 'pharmacist'],
    primarySource: {
      title: r.sourceCitation,
      publisher: 'Reviewed source',
      url: r.sourceUrl ?? '#',
      sourceId: null,
    },
    publicationDate: r.sourceDate,
    effectiveDate: null,
    verifiedAt: r.reviewedAt,
    supersessionState: 'current',
    supersededById: null,
    reviewStatus: 'published',
    freshnessStatus: 'current',
  }
}

function buildResult(query: string, records: ClinicalEvidenceRecordDTO[]): ClinicalEvidenceSearchResult {
  const state = deriveClinicalEvidenceState({ query, records })
  return {
    state,
    query,
    records,
    changes: [],
    message: clinicalEvidenceStateMessage(state),
    synthesis: synthesizeClinicalEvidence(records),
  }
}

export async function searchClinicalEvidence(opts: {
  query: string
  jurisdiction?: string | null
  limit?: number
}): Promise<ClinicalEvidenceSearchResult> {
  const { query, jurisdiction, limit = 30 } = opts
  const q = query.trim()

  try {
    const supabase = await createClient()
    let dbQuery = supabase
      .from('clinical_evidence_records')
      .select('*')
      .eq('review_status', 'published')
      .order('verified_at', { ascending: false })
      .limit(limit)

    if (q) {
      const escaped = q.replace(/[%_,()]/g, ' ')
      dbQuery = dbQuery.or(
        `title.ilike.%${escaped}%,condition_label.ilike.%${escaped}%,summary.ilike.%${escaped}%`
      )
    }
    if (jurisdiction) {
      dbQuery = dbQuery.contains('jurisdictions', [jurisdiction.toUpperCase()])
    }

    const { data, error } = await dbQuery
    if (error) throw error

    const records: ClinicalEvidenceRecordDTO[] = (data ?? []).map((row: ClinicalEvidenceRow) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      condition: row.condition_label,
      conditionAliases: row.condition_aliases ?? [],
      population: row.population,
      intervention: row.intervention,
      formulation: row.formulation,
      cannabinoid: row.cannabinoids ?? [],
      interventionClass: row.intervention_class,
      comparator: row.comparator,
      outcome: row.outcome,
      evidenceType: row.evidence_type,
      evidenceStrength: row.evidence_strength,
      evidenceStrengthMethod: row.evidence_strength_method,
      uncertainty: row.uncertainty,
      conflictStatus: row.conflict_status,
      jurisdiction: row.jurisdictions ?? [],
      professionRelevance: row.profession_relevance ?? [],
      primarySource: {
        title: row.primary_source_title,
        publisher: row.primary_source_publisher,
        url: row.primary_source_url,
        sourceId: row.primary_source_id,
      },
      publicationDate: row.publication_date,
      effectiveDate: row.effective_date,
      verifiedAt: row.verified_at,
      supersessionState: row.supersession_state,
      supersededById: row.superseded_by_id,
      reviewStatus: row.review_status,
      sourceRegistryId: row.source_registry_id,
      gradingMethodKey: row.grading_method_key,
      publicationScope: row.publication_scope,
      freshnessStatus: row.freshness_status,
      reviewDueAt: row.review_due_at,
      sourceCurrentnessCheckedAt: row.source_currentness_checked_at,
      freshnessReason: row.freshness_reason,
    }))

    // A successful live query is authoritative even when it returns zero rows.
    // Falling back here would bypass review_status/publication governance.
    return buildResult(q, records)
  } catch (err) {
    console.warn('[clinical] live spine unavailable, falling back to fixtures', err)
  }

  const fixtureResults = q
    ? searchEvidence(q, { jurisdiction: jurisdiction ?? undefined })
    : EVIDENCE_FIXTURES.filter(
        (r) =>
          !jurisdiction ||
          r.jurisdictions.includes('global') ||
          r.jurisdictions.includes(jurisdiction.toUpperCase())
      )

  return buildResult(q, fixtureResults.slice(0, limit).map(mapFixtureToDTO))
}

export async function recordClinicalView(opts: {
  userId: string
  evidenceRecordId: string
  recordVerifiedAt: string
  jurisdictionContext?: string
}) {
  try {
    const supabase = await createClient()
    await supabase.from('clinical_view_audit').insert({
      user_id: opts.userId,
      evidence_record_id: opts.evidenceRecordId,
      record_verified_at: opts.recordVerifiedAt,
      jurisdiction_context: opts.jurisdictionContext ?? null,
    })
  } catch (err) {
    console.error('[clinical] view audit write failed', err)
  }
}
