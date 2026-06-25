'use server'

import { createClient } from '@/lib/supabase/server'

export interface JurisdictionBriefing {
  jurisdiction_slug: string
  program_status: string | null
  public_summary: string | null
  patient_access: string | null
  physician_access: string | null
  market_dynamics: string | null
  regulatory_outlook: string | null
  regulatory_body: string | null
}

export async function getJurisdictionBriefing(countryIso2: string): Promise<JurisdictionBriefing | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cc_jurisdiction_briefings')
    .select('jurisdiction_slug, program_status, public_summary, patient_access, physician_access, market_dynamics, regulatory_outlook, regulatory_body')
    .eq('country_iso2', countryIso2.toUpperCase())
    .eq('jurisdiction_type', 'country')
    .maybeSingle()

  return data ?? null
}
