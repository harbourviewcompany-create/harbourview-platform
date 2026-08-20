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

    if (error) {
      console.error('getApprovedProviders failed:', error.message)
      return []
    }
    return (data ?? []) as ProfessionalServiceProvider[]
  } catch (err) {
    // Degrade to an empty directory rather than failing the render. This page
    // is prerendered at build time, where an unconfigured or unreachable
    // Supabase would otherwise fail the whole build.
    console.error('getApprovedProviders failed:', err instanceof Error ? err.message : err)
    return []
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
