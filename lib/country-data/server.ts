import 'server-only'

import { getPublicCountryProfileBySlug, getPublicCountryProfiles } from './public-country-dto'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { COUNTRIES } from '@/data/globe/geography-registry'
import { CountryBriefing } from './types'

// --- Identity-only public country/area profiles (app/countries/*) ---
// Restored after a concurrent edit (62f28cb) replaced this file's contents
// with the unrelated Briefing Room functions below, breaking both
// app/countries/page.tsx and app/countries/[slug]/page.tsx.
export async function listPublicCountryProfiles() {
  return getPublicCountryProfiles()
}

export async function getPublicCountryProfile(slug: string) {
  return getPublicCountryProfileBySlug(slug)
}

// --- Briefing Room local intel (added in 62f28cb) ---
// Fixed: previously imported a non-existent '@/lib/supabase' module (no
// such path exists in this repo — confirmed via tsc). Using the existing
// service-role helper instead, consistent with other admin/seed-style
// reads/writes elsewhere in the codebase.
//
// Also fixed: country_intel did not exist when this was first written
// (confirmed via information_schema — phantom table, scaffold only). A
// concurrent session has since created it, but with a different schema
// than this code assumed (country_code, not iso2; country_name, not
// name; plus commercial_pathway_summary/review_status/regulatory_tier).
// Query/seed below now match the real table — see
// lib/dashboard/dashboardLiveData.ts for the other live consumer this was
// cross-checked against.
export async function getCountryBriefing(iso2: string): Promise<CountryBriefing | null> {
  const supabase = await createSupabaseServiceClient();
  const { data: dbData } = await supabase
    .from('country_intel')
    .select('country_code, country_name, commercial_pathway_summary, review_status, regulatory_tier, last_reviewed_at')
    .eq('country_code', iso2.toUpperCase())
    .eq('review_status', 'active')
    .maybeSingle();

  const geo = COUNTRIES.find(c => c.iso2 === iso2.toUpperCase());

  if (!dbData && !geo) return null;

  return {
    iso2: iso2.toUpperCase(),
    overview: dbData?.commercial_pathway_summary || geo?.localIntelSummary || 'Baseline data available. Enrich via intelligence agents.',
    regulatory: {
      status: dbData?.regulatory_tier || 'Research ongoing',
      lastUpdated: dbData?.last_reviewed_at || new Date().toISOString(),
      keyLaws: []
    },
    marketIntel: {
      opportunityScore: 50,
      risks: []
    },
    localSignals: []
  };
}

export async function seedAllCountries() {
  const supabase = await createSupabaseServiceClient();
  const seedData = COUNTRIES.map(c => ({
    country_code: c.iso2,
    country_name: c.name,
    review_status: 'active',
  }));

  const { error } = await supabase.from('country_intel').upsert(seedData, { onConflict: 'country_code' });
  if (error) console.error(error);
  return !error;
}
