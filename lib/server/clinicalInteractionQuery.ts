import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { isInspectableClinicalSource } from '@/lib/clinical/prescriber'
import { searchInteractionFixtures } from '@/lib/fixtures/clinical/interactions'
import type {
  ClinicalInteractionDTO,
  ClinicalInteractionQueryResult,
} from '@/lib/clinical/interactions'

export type { ClinicalInteractionDTO, ClinicalInteractionQueryResult } from '@/lib/clinical/interactions'

type InteractionDbRow = {
  id: string
  medication_ingredient: string
  cannabinoid: string
  mechanism: string | null
  clinical_significance: ClinicalInteractionDTO['clinicalSignificance']
  evidence_certainty: ClinicalInteractionDTO['evidenceCertainty']
  uncertainty: string | null
  monitoring_consideration: string | null
  primary_source_title: string
  primary_source_url: string | null
  source_locator?: string | null
  verified_at: string
  review_status: string
}

function fixtureModeEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.HARBOURVIEW_CLINICAL_FIXTURES === '1'
}

function fromFixtures(opts: { q?: string; limit?: number }): ClinicalInteractionDTO[] {
  if (!fixtureModeEnabled()) return []
  return searchInteractionFixtures(opts)
    .filter((row) => isInspectableClinicalSource(row.primarySourceUrl))
    .map((row) => ({
      id: row.id,
      medicationIngredient: row.medicationIngredient,
      cannabinoid: row.cannabinoid,
      mechanism: row.mechanism,
      clinicalSignificance: row.clinicalSignificance,
      evidenceCertainty: row.evidenceCertainty as ClinicalInteractionDTO['evidenceCertainty'],
      uncertainty: row.uncertainty,
      monitoringConsideration: row.monitoringConsideration,
      primarySourceTitle: row.primarySourceTitle,
      primarySourceUrl: row.primarySourceUrl as string,
      sourceLocator: null,
      verifiedAt: row.verifiedAt,
      provenanceState: 'inspectable' as const,
    }))
}

function mapInspectableRows(rows: InteractionDbRow[]): {
  interactions: ClinicalInteractionDTO[]
  rejectedForProvenance: number
} {
  const interactions: ClinicalInteractionDTO[] = []
  let rejectedForProvenance = 0

  for (const row of rows) {
    if (!isInspectableClinicalSource(row.primary_source_url) || !row.source_locator?.trim()) {
      rejectedForProvenance += 1
      continue
    }
    interactions.push({
      id: row.id,
      medicationIngredient: row.medication_ingredient,
      cannabinoid: row.cannabinoid,
      mechanism: row.mechanism,
      clinicalSignificance: row.clinical_significance,
      evidenceCertainty: row.evidence_certainty,
      uncertainty: row.uncertainty,
      monitoringConsideration: row.monitoring_consideration,
      primarySourceTitle: row.primary_source_title,
      primarySourceUrl: row.primary_source_url as string,
      sourceLocator: row.source_locator,
      verifiedAt: row.verified_at,
      provenanceState: 'inspectable',
    })
  }

  return { interactions, rejectedForProvenance }
}

export async function searchClinicalInteractions(opts: {
  q?: string
  limit?: number
}): Promise<ClinicalInteractionQueryResult> {
  try {
    // Service role: api.clinical_medication_interactions is not granted to anon.
    // Application still filters to published + inspectable provenance only.
    const supabase = await createSupabaseServiceClient()
    let query = supabase
      .from('clinical_medication_interactions')
      .select(
        'id,medication_ingredient,cannabinoid,mechanism,clinical_significance,evidence_certainty,uncertainty,monitoring_consideration,primary_source_title,primary_source_url,source_locator,verified_at,review_status',
      )
      .eq('review_status', 'published')
      .order('clinical_significance', { ascending: true })
      .limit(opts.limit ?? 30)

    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`
      query = query.or(
        `medication_ingredient.ilike.${q},cannabinoid.ilike.${q},mechanism.ilike.${q}`,
      )
    }

    const { data, error } = await query
    if (error) {
      const fixtures = fromFixtures(opts)
      if (fixtures.length) {
        return { state: 'fixture', interactions: fixtures, rejectedForProvenance: 0, error: error.message }
      }
      return { state: 'error', interactions: [], rejectedForProvenance: 0, error: error.message }
    }

    const rows = (data ?? []) as InteractionDbRow[]
    const mapped = mapInspectableRows(rows)
    if (mapped.interactions.length > 0) return { state: 'loaded', ...mapped }
    if (rows.length > 0 && mapped.rejectedForProvenance > 0) {
      return { state: 'review-required', ...mapped }
    }

    const fixtures = fromFixtures(opts)
    if (fixtures.length) return { state: 'fixture', interactions: fixtures, rejectedForProvenance: 0 }
    return { state: 'empty', interactions: [], rejectedForProvenance: 0 }
  } catch (error) {
    const fixtures = fromFixtures(opts)
    if (fixtures.length) {
      return {
        state: 'fixture',
        interactions: fixtures,
        rejectedForProvenance: 0,
        error: error instanceof Error ? error.message : 'Interaction query failed',
      }
    }
    return {
      state: 'error',
      interactions: [],
      rejectedForProvenance: 0,
      error: error instanceof Error ? error.message : 'Interaction query failed',
    }
  }
}
