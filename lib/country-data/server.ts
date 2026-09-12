import 'server-only'

import { getPublicCountryProfileBySlug, getPublicCountryProfiles } from './public-country-dto'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { COUNTRIES } from '@/data/globe/geography-registry'
import { CountryBriefing } from './types'

// --- Identity-only public country/area profiles (app/countries/*) ---
export async function listPublicCountryProfiles() {
  return getPublicCountryProfiles()
}

export async function getPublicCountryProfile(slug: string) {
  return getPublicCountryProfileBySlug(slug)
}

// --- Evidence-backed Briefing Room local intel ---
// Identity coverage is never treated as regulatory evidence. A country can
// exist in the geography registry while its market-access brief remains
// unresolved. No placeholder score, legal claim, or invented summary is
// returned for an unresolved country.
export async function getCountryBriefing(iso2: string): Promise<CountryBriefing | null> {
  const normalizedIso2 = iso2.trim().toUpperCase()
  const supabase = await createSupabaseServiceClient()
  const { data: dbData, error } = await supabase
    .from('country_intel')
    .select('country_code, country_name, commercial_pathway_summary, review_status, last_reviewed_at')
    .eq('country_code', normalizedIso2)
    .eq('review_status', 'active')
    .maybeSingle()

  if (error) {
    throw new Error(`getCountryBriefing: country_intel query failed: ${error.message}`)
  }

  const geo = COUNTRIES.find((country) => country.iso2 === normalizedIso2)
  if (!dbData && !geo) return null

  return {
    iso2: normalizedIso2,
    overview: dbData?.commercial_pathway_summary ?? 'Market-access briefing requires verified primary-source evidence before publication.',
    regulatory: {
      status: null,
      lastUpdated: dbData?.last_reviewed_at ?? null,
      keyLaws: [],
    },
    marketIntel: {
      opportunityScore: null,
      risks: [],
    },
    localSignals: [],
  }
}

// Retained as an operator-only identity seeding helper. It writes identity
// fields only; it never assigns regulatory tiers or summaries.
export async function seedAllCountries() {
  const supabase = await createSupabaseServiceClient()
  const seedData = COUNTRIES.map((country) => ({
    country_code: country.iso2,
    country_name: country.name,
    review_status: 'active',
  }))

  const { error } = await supabase.from('country_intel').upsert(seedData, { onConflict: 'country_code' })
  if (error) console.error(error)
  return !error
}
