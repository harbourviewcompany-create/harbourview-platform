import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { JurisdictionBriefing, ProfessionalPathway } from '@/lib/clinical/types'

export type ClinicalJurisdictionDTO = JurisdictionBriefing & {
  pathway: ProfessionalPathway | null
}

export async function getClinicalJurisdictionProfile(
  iso2: string,
): Promise<{ state: 'loaded' | 'empty' | 'error'; profile: ClinicalJurisdictionDTO | null; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clinical_jurisdiction_profiles')
      .select('*')
      .eq('country_iso2', iso2.toUpperCase())
      .eq('review_status', 'published')
      .maybeSingle()

    if (error) return { state: 'error', profile: null, error: error.message }
    if (!data) return { state: 'empty', profile: null }

    const row = data as Record<string, unknown>
    const profile: ClinicalJurisdictionDTO = {
      country: String(row.country_name),
      iso2: String(row.country_iso2),
      flag: String(row.flag ?? ''),
      status: row.status as JurisdictionBriefing['status'],
      legalPathway: String(row.legal_pathway),
      adultUse: Boolean(row.adult_use),
      summary: String(row.summary),
      primaryAuthority: {
        name: String(row.primary_authority_name),
        role: String(row.primary_authority_role),
        url: row.primary_authority_url ? String(row.primary_authority_url) : undefined,
      },
      professionalRegulator: row.professional_regulator_name
        ? {
            name: String(row.professional_regulator_name),
            role: String(row.professional_regulator_role ?? ''),
            url: row.professional_regulator_url ? String(row.professional_regulator_url) : undefined,
          }
        : undefined,
      keyRules: Array.isArray(row.key_rules) ? (row.key_rules as string[]) : [],
      accessNotes: String(row.access_notes ?? ''),
      lastReviewed: String(row.last_reviewed),
      pathway:
        row.who_may_prescribe || row.pathway_roles
          ? {
              country: String(row.country_name),
              iso2: String(row.country_iso2),
              roles: String(row.pathway_roles ?? 'All roles'),
              whoMayPrescribe: String(row.who_may_prescribe ?? ''),
              conditionsMentioned: [],
              restrictions: Array.isArray(row.pathway_restrictions)
                ? (row.pathway_restrictions as string[])
                : [],
              notes: String(row.pathway_notes ?? ''),
              lastReviewed: String(row.last_reviewed),
            }
          : null,
    }

    return { state: 'loaded', profile }
  } catch (e) {
    return {
      state: 'error',
      profile: null,
      error: e instanceof Error ? e.message : 'Jurisdiction query failed',
    }
  }
}
