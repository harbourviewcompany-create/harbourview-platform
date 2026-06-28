'use server'

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabasePublicClientKey } from '@/lib/supabase/env'
import { BRIEFING_SELECT } from '@/lib/globe/jurisdictionBriefingTypes'

export type { JurisdictionBriefing } from '@/lib/globe/jurisdictionBriefingTypes'

export async function getJurisdictionBriefing(
  countryIso2: string,
): Promise<import('@/lib/globe/jurisdictionBriefingTypes').JurisdictionBriefing | null> {
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
