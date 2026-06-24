import { createClient } from '@/lib/supabase/client';
import { COUNTRIES } from '@/data/globe/geography-registry';
import { CountryBriefing } from './types';

export async function getCountryBriefing(iso2: string): Promise<CountryBriefing | null> {
  const supabase = createClient()
  const { data: dbData } = await supabase
    .from('country_intel')
    .select('*')
    .eq('iso2', iso2.toUpperCase())
    .single();

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
  // Example bulk upsert - adapt to full data
  const seedData = COUNTRIES.map(c => ({
    iso2: c.iso2,
    name: c.name,
    // ... map other fields
  }));

  const supabase = createClient()
  const { error } = await supabase.from('country_intel').upsert(seedData);
  if (error) console.error(error);
  return !error;
}

// Re-export DTO functions expected by /app/countries pages
export { getPublicCountryProfiles as listPublicCountryProfiles } from './public-country-dto'

export function getPublicCountryProfile(slug: string) {
  const { getPublicCountryProfiles } = require('./public-country-dto')
  const profiles: ReturnType<typeof getPublicCountryProfiles> = getPublicCountryProfiles()
  return profiles.find((p: { slug: string }) => p.slug === slug) ?? null
}
