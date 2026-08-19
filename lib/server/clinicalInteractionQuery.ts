import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { searchInteractionFixtures } from '@/lib/fixtures/clinical/interactions'

export type ClinicalInteractionDTO = {
  id: string
  medicationIngredient: string
  cannabinoid: string
  mechanism: string | null
  clinicalSignificance: 'minor' | 'moderate' | 'major' | 'unknown'
  evidenceCertainty: string
  uncertainty: string | null
  monitoringConsideration: string | null
  primarySourceTitle: string
  primarySourceUrl: string | null
  verifiedAt: string
}

function fromFixtures(opts: { q?: string; limit?: number }): ClinicalInteractionDTO[] {
  return searchInteractionFixtures(opts).map((r) => ({
    id: r.id,
    medicationIngredient: r.medicationIngredient,
    cannabinoid: r.cannabinoid,
    mechanism: r.mechanism,
    clinicalSignificance: r.clinicalSignificance,
    evidenceCertainty: r.evidenceCertainty,
    uncertainty: r.uncertainty,
    monitoringConsideration: r.monitoringConsideration,
    primarySourceTitle: r.primarySourceTitle,
    primarySourceUrl: r.primarySourceUrl,
    verifiedAt: r.verifiedAt,
  }))
}

export async function searchClinicalInteractions(opts: {
  q?: string
  limit?: number
}): Promise<{ state: 'loaded' | 'empty' | 'error'; interactions: ClinicalInteractionDTO[]; error?: string }> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('clinical_medication_interactions')
      .select(
        'id,medication_ingredient,cannabinoid,mechanism,clinical_significance,evidence_certainty,uncertainty,monitoring_consideration,primary_source_title,primary_source_url,verified_at,review_status',
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
      return fixtures.length
        ? { state: 'loaded', interactions: fixtures }
        : { state: 'error', interactions: [], error: error.message }
    }

    const interactions: ClinicalInteractionDTO[] = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        medicationIngredient: String(r.medication_ingredient),
        cannabinoid: String(r.cannabinoid),
        mechanism: r.mechanism ? String(r.mechanism) : null,
        clinicalSignificance: r.clinical_significance as ClinicalInteractionDTO['clinicalSignificance'],
        evidenceCertainty: String(r.evidence_certainty),
        uncertainty: r.uncertainty ? String(r.uncertainty) : null,
        monitoringConsideration: r.monitoring_consideration ? String(r.monitoring_consideration) : null,
        primarySourceTitle: String(r.primary_source_title),
        primarySourceUrl: r.primary_source_url ? String(r.primary_source_url) : null,
        verifiedAt: String(r.verified_at),
      }
    })

    if (!interactions.length) {
      const fixtures = fromFixtures(opts)
      return { state: fixtures.length ? 'loaded' : 'empty', interactions: fixtures }
    }

    return { state: 'loaded', interactions }
  } catch (e) {
    const fixtures = fromFixtures(opts)
    if (fixtures.length) return { state: 'loaded', interactions: fixtures }
    return {
      state: 'error',
      interactions: [],
      error: e instanceof Error ? e.message : 'Interaction query failed',
    }
  }
}
