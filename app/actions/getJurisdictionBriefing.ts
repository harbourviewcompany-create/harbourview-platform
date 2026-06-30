'use server'

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabasePublicClientKey, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { BRIEFING_SELECT } from '@/lib/globe/jurisdictionBriefingTypes'

export type { JurisdictionBriefing } from '@/lib/globe/jurisdictionBriefingTypes'

export async function getJurisdictionBriefing(
  countryIso2: string,
): Promise<import('@/lib/globe/jurisdictionBriefingTypes').JurisdictionBriefing | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient<any, 'api'>(getSupabaseUrl(), getSupabasePublicClientKey(), {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })

  const { data, error } = await supabase
    .from('cc_jurisdiction_briefings')
    .select(BRIEFING_SELECT)
    .eq('country_iso2', countryIso2.toUpperCase())
    .eq('jurisdiction_type', 'country')
    .order('last_reviewed_date', { ascending: false })
    .limit(1)
    .returns<import('@/lib/globe/jurisdictionBriefingTypes').JurisdictionBriefing>()
    .maybeSingle()

  if (error) console.error('[getJurisdictionBriefing]', error)
  return (data as unknown as import('@/lib/globe/jurisdictionBriefingTypes').JurisdictionBriefing | null) ?? null
}
