import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Format viability check — intel/operator tier
 * ─────────────────────────────────────────────
 * regulatory_pathways + pathway_format_rules were built (98 pathway rows
 * across ~65 countries, 238 format rules) but never exposed through the api
 * schema at all, and were previously fully public rather than tier-gated.
 * This is the first thing to consume them: for a destination country and a
 * product format, is there an active legal pathway that actually permits it.
 *
 * Uses the cookie-based, session-aware client (not the service-role client
 * jurisdictionPlaybooks.ts uses) specifically so RLS's tier check runs as the
 * calling user, not as a privileged bypass. Tier is also checked directly
 * and separately from the row query itself: an empty result set is
 * ambiguous on its own (not entitled vs. entitled but no pathway covers this
 * format), and the caller needs to tell those two apart to show the right
 * UI state.
 */

export type PathwayFormatStatus = 'permitted' | 'restricted' | 'prohibited' | 'unclear'

export type FormatViabilityEntry = {
  pathwayId: string
  pathwayName: string
  pathwayType: string
  pathwayStatus: string
  formatStatus: PathwayFormatStatus
  thcLimit: string | null
  cbdLimit: string | null
  notes: string | null
  lastVerifiedAt: string | null
}

export type FormatViabilityResult =
  | { entitled: false }
  | { entitled: true; formatName: string; entries: FormatViabilityEntry[] }

export async function getFormatViability(
  destinationIso2: string,
  formatSlug: string,
): Promise<FormatViabilityResult> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .maybeSingle()

  const tier = profile?.tier
  if (tier !== 'intel' && tier !== 'operator') {
    return { entitled: false }
  }

  const { data: format } = await supabase
    .from('product_formats')
    .select('id, name')
    .eq('slug', formatSlug)
    .maybeSingle()

  if (!format) return { entitled: true, formatName: formatSlug, entries: [] }

  const { data: pathways } = await supabase
    .from('regulatory_pathways')
    .select('id, name, pathway_type, status')
    .eq('iso_alpha2', destinationIso2.trim().toUpperCase())

  if (!pathways || pathways.length === 0) {
    return { entitled: true, formatName: format.name, entries: [] }
  }

  const pathwayIds = pathways.map((p) => p.id)

  const { data: rules } = await supabase
    .from('pathway_format_rules')
    .select('pathway_id, status, thc_limit, cbd_limit, notes, last_verified_at')
    .in('pathway_id', pathwayIds)
    .eq('format_id', format.id)

  const entries: FormatViabilityEntry[] = (rules ?? [])
    .map((rule) => {
      const pathway = pathways.find((p) => p.id === rule.pathway_id)
      if (!pathway) return null
      return {
        pathwayId: pathway.id,
        pathwayName: pathway.name,
        pathwayType: pathway.pathway_type,
        pathwayStatus: pathway.status,
        formatStatus: rule.status as PathwayFormatStatus,
        thcLimit: rule.thc_limit,
        cbdLimit: rule.cbd_limit,
        notes: rule.notes,
        lastVerifiedAt: rule.last_verified_at,
      }
    })
    .filter((e): e is FormatViabilityEntry => e !== null)

  return { entitled: true, formatName: format.name, entries }
}

export type ProductFormatOption = {
  slug: string
  name: string
  category: string
}

/** Public reference list — not tier-gated, just the 17-row taxonomy. */
export async function listProductFormats(): Promise<ProductFormatOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_formats')
    .select('slug, name, category')
    .order('sort_order')
  return data ?? []
}
