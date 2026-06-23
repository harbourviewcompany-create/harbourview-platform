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
// reads/writes elsewhere in the codebase. Nothing currently calls either
// function below (confirmed via repo-wide search), so this is a type-fix
// only — no behavior to preserve or regress.
export async function getCountryBriefing(iso2: string): Promise<CountryBriefing | null> {
  const supabase = await createSupabaseServiceClient();
  const { data: dbData } = await supabase
    .from('country_intel')
    .select('*')
    .eq('iso2', iso2.toUpperCase())
    .maybeSingle();

  const geo = COUNTRIES.find(c => c.iso2 === iso2.toUpperCase());

  if (!dbData && !geo) return null;

  return {
    iso2: iso2.toUpperCase(),
    overview: geo?.localIntelSummary || 'Baseline data available. Enrich via intelligence agents.',
    regulatory: {
      status: 'Research ongoing',
      lastUpdated: new Date().toISOString(),
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
  // Example bulk upsert - adapt to full data
  const seedData = COUNTRIES.map(c => ({
    iso2: c.iso2,
    name: c.name,
    // ... map other fields
  }));

  const { error } = await supabase.from('country_intel').upsert(seedData);
  if (error) console.error(error);
  return !error;
}
