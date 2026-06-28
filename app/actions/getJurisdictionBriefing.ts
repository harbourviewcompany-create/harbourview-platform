'use server'

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabasePublicClientKey } from '@/lib/supabase/env'

export interface JurisdictionBriefing {
  jurisdiction_slug: string
  program_status: string | null
  public_summary: string | null
  patient_access: string | null
  physician_access: string | null
  market_dynamics: string | null
  regulatory_outlook: string | null
  regulatory_body: string | null
  last_reviewed_date: string | null
}

const BRIEFING_SELECT =
  'jurisdiction_slug,program_status,public_summary,patient_access,' +
  'physician_access,market_dynamics,regulatory_outlook,regulatory_body,last_reviewed_date'

export async function getJurisdictionBriefing(
  countryIso2: string,
): Promise<JurisdictionBriefing | null> {
  const supabase = createClient(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('cc_jurisdiction_briefings')
    .select(BRIEFING_SELECT)
    .eq('country_iso2', countryIso2.toUpperCase())
    .eq('jurisdiction_type', 'country')
    .order('last_reviewed_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) console.error('[getJurisdictionBriefing]', error)
  return data ?? null
}
