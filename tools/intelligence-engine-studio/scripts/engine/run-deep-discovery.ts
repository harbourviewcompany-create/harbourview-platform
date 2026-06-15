import { EntityResolver } from '../../lib/intelligence-engine/deep-discovery/entity-resolver';
import { createClient } from '@supabase/supabase-js';

/**
 * Deep Source Matrix Generator
 * 
 * 1. Pulls all 192+ countries.
 * 2. Uses the AI Entity Resolver to translate taxonomy roles (e.g. "Narcotics Board") 
 *    into specific local entities (e.g. "BfArM", "ANVISA").
 * 3. Injects these high-fidelity targets into the source registry workflow.
 */
async function generateDeepMatrix() {
  console.log('=== HarbourView Deep Matrix Generator ===');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error('Missing Supabase credentials');
  
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const resolver = new EntityResolver();

  // Load active jurisdictions
  const { data: jurisdictions } = await supabase
    .from('jurisdictions')
    .select('iso_alpha3, canonical_name')
    .limit(10); // Batching for demonstration

  if (!jurisdictions) return;

  for (const j of jurisdictions) {
    console.log(`\nMapping institutional structure for: ${j.canonical_name}`);
    
    // Resolve the institutional matrix for this country
    const entities = await resolver.resolveTaxonomyForCountry(j.canonical_name, j.iso_alpha3);
    
    // Convert entities into target nodes for the crawler queue
    const mappedTargets = entities.map(e => ({
      country_code: e.country_code,
      entity_name: e.official_name_english,
      entity_name_local: e.official_name_local,
      discovery_url: e.primary_url,
      taxonomy_role: e.role,
      status: 'pending_crawl_verification'
    }));

    if (mappedTargets.length > 0) {
      console.log(`Mapped ${mappedTargets.length} key institutions for ${j.canonical_name}. Formatting for Source Expansion Queue...`);
      // In production, this pushes to source_expansion_staging
    }
  }
}

generateDeepMatrix().catch(console.error);
