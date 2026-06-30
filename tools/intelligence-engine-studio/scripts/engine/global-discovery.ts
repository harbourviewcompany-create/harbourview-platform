/**
 * Global Discovery Script
 * Seeds new sources across all 192+ countries to feed the Intelligence Engine.
 * This looks for specific regulatory and market structure domains based on 
 * public jurisdiction data in Harbourview.
 */
import { createClient } from '@supabase/supabase-js';

// PostgREST on this Supabase project only exposes the `api` schema, not
// `public` -- see lib/intelligence-engine/orchestrator.ts for the full
// explanation; kept in sync with the main app's lib/supabase/env.ts.
const SUPABASE_DB_SCHEMA = 'api' as const;

const SEED_SOURCES = [
  // Examples of expansion templates that would be dynamically generated
  { suffix: 'gov', name: 'Ministry of Health' },
  { suffix: 'health.gov', name: 'Health Department' },
  { suffix: 'customs.gov', name: 'Customs & Border Control' },
  { suffix: 'police.gov', name: 'National Police' }
];

async function runDiscovery() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials in env.');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } });

  console.log('--- HarbourView Global Target Discovery ---');
  console.log('Fetching active jurisdictions...');
  
  // Pull all countries from the existing table
  const { data: jurisdictions, error } = await supabase
    .from('jurisdictions')
    .select('jurisdiction_id, iso_alpha3, canonical_name');

  if (error) {
    console.error('Failed to load jurisdictions:', error);
    process.exit(1);
  }

  console.log(`Loaded ${jurisdictions?.length || 0} global jurisdictions.`);
  console.log('Generating target lists for source expansion queue...');

  const queueInserts = [];

  for (const j of jurisdictions || []) {
    // Stage some high-value searches for the expansion queue
    const countryCode = j.iso_alpha3 || (j.jurisdiction_id as string).replace('country_area:', '');
    
    // In a real crawl, this would query Google/Bing Custom Search APIs to find the exact URLs
    // For HarbourView's architecture, we push placeholders to the expansion queue for validation.
    queueInserts.push({
      country_code: countryCode,
      status: 'pending_discovery',
      search_queries: [
         `${j.canonical_name} medical cannabis regulations department of health`,
         `${j.canonical_name} import export narcotic drugs control board`,
         `${j.canonical_name} official gazette cannabis legislation`
      ],
      created_at: new Date().toISOString()
    });
  }

  console.log(`Pushing ${queueInserts.length} discovery nodes to source_expansion_coverage_queue...`);
  
  // They have a 'source_expansion_coverage_queue' table, let's upsert to it
  const { error: insertError } = await supabase
    .from('source_expansion_coverage_queue')
    .upsert(queueInserts, { onConflict: 'country_code' });

  if (insertError) {
    console.error('Failed to populate coverage queue:', insertError.message);
  } else {
    console.log('Success! Target expansion queued for all 192+ markets.');
  }
}

runDiscovery().catch(console.error);
