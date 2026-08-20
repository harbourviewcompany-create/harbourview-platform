import { createPublicAnonClient } from '@/lib/supabase/server'
import type { ProfessionalServiceCategory, ProfessionalServiceProvider } from './professionalServiceTypes'
import { CATEGORY_LABEL } from './professionalServiceTypes'

export type { ProfessionalServiceCategory, ProfessionalServiceProvider }
export { CATEGORY_LABEL }

/**
 * Approved providers only — the api.professional_service_providers view
 * already filters to status='approved' and excludes internal columns
 * (contact_email, submitted_by, status, review fields), so this is safe to
 * call from a public page with no additional filtering needed here.
 *
 * Server-only (imports @/lib/supabase/server, which uses next/headers).
 * Client components must import types/labels from ./professionalServiceTypes
 * instead — see components/marketplace/ProfessionalServiceApplicationForm.tsx,
 * which does exactly that after this file broke the client bundle by pulling
 * next/headers into a 'use client' component via a shared import.
 */
export async function getApprovedProviders(): Promise<ProfessionalServiceProvider[]> {
  try {
    // Anonymous client — the underlying listings table grants anon SELECT on
    // status='approved', so this returns exactly the public row set while
    // keeping the page statically renderable.
    const supabase = createPublicAnonClient()
    const { data, error } = await supabase
      .from('professional_service_providers')
      .select('id, category, name, description, markets_covered, website, created_at')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw new Error(`professional_service_providers query failed: ${error.message}`)

    // A successful query with no rows is a real empty directory, not a failure.
    return (data ?? []) as ProfessionalServiceProvider[]
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Swallow ONLY during the production build. `/marketplace/professional-services`
    // is prerendered, and an unconfigured or unreachable Supabase at build time
    // would otherwise fail the whole build — a failure mode `force-dynamic`
    // never had.
    //
    // At runtime the opposite is true, and this is the subtle half: Next.js
    // keeps the last successfully generated ISR page only when regeneration
    // THROWS. Returning [] here would look like a successful render and would
    // overwrite a good directory with an empty one for the length of the
    // revalidate window, turning a transient query blip into a 30-minute
    // outage of published content. So runtime failures propagate and the stale
    // page is served instead.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.error('getApprovedProviders failed during build, rendering empty:', message)
      return []
    }

    console.error('getApprovedProviders failed:', message)
    throw err instanceof Error ? err : new Error(message)
  }
}

export function groupByCategory(
  providers: ProfessionalServiceProvider[],
): Array<{ category: ProfessionalServiceCategory; label: string; providers: ProfessionalServiceProvider[] }> {
  const order: ProfessionalServiceCategory[] = [
    'legal',
    'accounting',
    'banking',
    'insurance',
    'compliance-consulting',
  ]
  return order
    .map((category) => ({
      category,
      label: CATEGORY_LABEL[category],
      providers: providers.filter((p) => p.category === category),
    }))
    .filter((group) => group.providers.length > 0)
}
