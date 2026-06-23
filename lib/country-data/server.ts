import { supabase } from '@/lib/supabase';
import { COUNTRIES } from '@/data/globe/geography-registry';
import { CountryBriefing } from './types';

export async function getCountryBriefing(iso2: string): Promise<CountryBriefing | null> {
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

  const { error } = await supabase.from('country_intel').upsert(seedData);
  if (error) console.error(error);
  return !error;
}
