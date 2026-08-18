/**
 * Production clinical evidence query layer
 * Prefers live Supabase spine; falls back cleanly to fixtures.
 * Never surfaces under-review material to clinician surfaces.
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  type ClinicalEvidenceRecordDTO,
  type ClinicalEvidenceSearchResult,
  type ClinicalEvidenceState,
  deriveClinicalEvidenceState,
  clinicalEvidenceStateMessage,
  synthesizeClinicalEvidence,
} from '@/lib/clinical/evidence'
import { searchEvidence, EVIDENCE_FIXTURES } from '@/lib/fixtures/clinical/evidence'
import type { EvidenceRecord } from '@/lib/clinical/types'

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
    evidenceType: r.domain === 'efficacy' ? 'randomized-trial' : r.domain === 'safety' ? 'pharmacovigilance-signal' : 'other',
    evidenceStrength: (r.strength === 'very_low' ? 'very-low' : r.strength) as any,
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

export async function searchClinicalEvidence(opts: {
  query: string
  jurisdiction?: string | null
  limit?: number
}): Promise<ClinicalEvidenceSearchResult> {
  const { query, jurisdiction, limit = 30 } = opts
  const q = query.trim()

  // Attempt live spine first
  try {
    const supabase = await createClient()
    let dbQuery = supabase
      .from('clinical_evidence_records')
      .select('*')
      .eq('review_status', 'published')
      .order('verified_at', { ascending: false })
      .limit(limit)

    if (q) {
      dbQuery = dbQuery.or(
        `title.ilike.%${q}%,condition.ilike.%${q}%,summary.ilike.%${q}%`
      )
    }
    if (jurisdiction) {
      dbQuery = dbQuery.contains('jurisdiction', [jurisdiction.toUpperCase()])
    }

    const { data, error } = await dbQuery

    if (!error && data && data.length > 0) {
      const records: ClinicalEvidenceRecordDTO[] = data.map((row: any) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        condition: row.condition,
        conditionAliases: row.condition_aliases ?? [],
        population: row.population,
        intervention: row.intervention,
        formulation: row.formulation,
        cannabinoid: row.cannabinoid ?? [],
        interventionClass: row.intervention_class,
        comparator: row.comparator,
        outcome: row.outcome,
        evidenceType: row.evidence_type,
        evidenceStrength: row.evidence_strength,
        evidenceStrengthMethod: row.evidence_strength_method,
        uncertainty: row.uncertainty,
        conflictStatus: row.conflict_status,
        jurisdiction: row.jurisdiction ?? [],
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

      const state = deriveClinicalEvidenceState({ query: q, records })
      return {
        state,
        query: q,
        records,
        changes: [],
        message: clinicalEvidenceStateMessage(state),
        synthesis: synthesizeClinicalEvidence(records),
      }
    }
  } catch (err) {
    console.warn('[clinical] live spine unavailable, falling back to fixtures', err)
  }

  // Fixture fallback (still only “published” style records)
  const fixtureResults = q
    ? searchEvidence(q, { jurisdiction: jurisdiction ?? undefined })
    : EVIDENCE_FIXTURES.filter(
        (r) =>
          !jurisdiction ||
          r.jurisdictions.includes('global') ||
          r.jurisdictions.includes(jurisdiction.toUpperCase())
      )

  const records = fixtureResults.slice(0, limit).map(mapFixtureToDTO)
  const state = deriveClinicalEvidenceState({ query: q, records })
  return {
    state,
    query: q,
    records,
    changes: [],
    message: clinicalEvidenceStateMessage(state),
    synthesis: synthesizeClinicalEvidence(records),
  }
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
