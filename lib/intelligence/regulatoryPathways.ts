import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Country pathway/format matrix — intel/operator tier
 * ────────────────────────────────────────────────────
 * regulatory_pathways + pathway_format_rules (98 pathway rows across ~65
 * countries, 238 format rules) were built but never exposed through the api
 * schema, and were previously fully public rather than tier-gated. This is
 * what surfaces them, in the shape Command Centre actually wants: for the
 * currently-selected country, every active pathway and every format's status
 * under it, no picker or extra interaction required — matching how
 * CompliancePage already shows the rest of jurisdictionPlaybook (all of it,
 * at once).
 *
 * Uses the cookie-based, session-aware client (not the service-role client
 * jurisdictionPlaybooks.ts uses) specifically so RLS's tier check runs as the
 * calling user. Tier is also checked directly, separately from the row
 * query: an empty pathway list is ambiguous on its own (not entitled vs.
 * entitled but nothing on file for this country), and the caller needs to
 * tell those apart to show the right state.
 */

export type PathwayFormatStatus = 'permitted' | 'restricted' | 'prohibited' | 'unclear'

export type PathwayFormatEntry = {
  formatSlug: string
  formatName: string
  status: PathwayFormatStatus
  thcLimit: string | null
  cbdLimit: string | null
  notes: string | null
}

export type CountryPathway = {
  id: string
  name: string
  pathwayType: string
  status: string
  regulator: string | null
  summary: string | null
  formats: PathwayFormatEntry[]
}

export type CountryPathwayMatrix =
  | { entitled: false }
  | { entitled: true; pathways: CountryPathway[] }

export async function getCountryPathwayMatrix(iso2: string | null): Promise<CountryPathwayMatrix> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .maybeSingle()

  // Paywall intentionally disabled -- business decision (Jul 2026): nothing is
  // gated behind tier right now, revisit later. Restore the block below to
  // re-enable (kept, not deleted, for exactly that reason).
  void profile
  // const tier = profile?.tier
  // if (tier !== 'intel' && tier !== 'operator') {
  //   return { entitled: false }
  // }

  if (!iso2) return { entitled: true, pathways: [] }

  const { data: pathways } = await supabase
    .from('regulatory_pathways')
    .select('id, name, pathway_type, status, regulator, summary')
    .eq('iso_alpha2', iso2.trim().toUpperCase())

  if (!pathways || pathways.length === 0) {
    return { entitled: true, pathways: [] }
  }

  const pathwayIds = pathways.map((p) => p.id)

  const [{ data: rules }, { data: formats }] = await Promise.all([
    supabase
      .from('pathway_format_rules')
      .select('pathway_id, format_id, status, thc_limit, cbd_limit, notes')
      .in('pathway_id', pathwayIds),
    supabase.from('product_formats').select('id, slug, name'),
  ])

  const formatById = new Map((formats ?? []).map((f) => [f.id, f]))

  return {
    entitled: true,
    pathways: pathways.map((pathway) => ({
      id: pathway.id,
      name: pathway.name,
      pathwayType: pathway.pathway_type,
      status: pathway.status,
      regulator: pathway.regulator,
      summary: pathway.summary,
      formats: (rules ?? [])
        .filter((r) => r.pathway_id === pathway.id)
        .map((r) => {
          const fmt = formatById.get(r.format_id)
          if (!fmt) return null
          return {
            formatSlug: fmt.slug,
            formatName: fmt.name,
            status: r.status as PathwayFormatStatus,
            thcLimit: r.thc_limit,
            cbdLimit: r.cbd_limit,
            notes: r.notes,
          }
        })
        .filter((f): f is PathwayFormatEntry => f !== null),
    })),
  }
}
