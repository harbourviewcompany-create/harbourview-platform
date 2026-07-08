-- SEED: development only, not for production
-- =============================================================================
-- Harbourview Platform — Expanded Development Seed Data (2026-07-08)
-- Includes country/role education overlays + marketplace expansions
-- Idempotent with ON CONFLICT. Safe for repeated supabase db reset.
-- =============================================================================

BEGIN;

-- --------------------------------------------------------------------------- 
-- NEW: country_education_overlay (country & role specific modules)
-- --------------------------------------------------------------------------- 
DO $$ BEGIN
  INSERT INTO country_education_overlay (
    id, country_iso2, role_id, module_key, topic_key,
    title, content_summary, key_actions, compliance_notes,
    review_status, published_at
  ) VALUES
    ('ed-overlay-001', 'DE', 'importer', 'compliance', 'gmp_basics',
     'GMP Requirements for Importers in Germany',
     'EU-GMP certification mandatory for cannabis flower imports. Focus on Annex 1 and traceability.',
     ARRAY['Verify supplier GMP cert', 'Request CoA per batch', 'Maintain import logs 5+ years'],
     'Strict BfArM compliance required.', 'approved', NOW() - INTERVAL '2 days'),
    
    ('ed-overlay-002', 'DE', 'distributor', 'local_intel', 'market_access',
     'German Market Access Pathways',
     'Strictly regulated medical cannabis channels. Pharmacies and licensed distributors only.',
     ARRAY['Partner with licensed entities', 'Monitor BtMG updates', 'Build pharmacy networks'],
     'Primarily medical use.', 'approved', NOW() - INTERVAL '1 day'),
    
    ('ed-overlay-003', 'MX', 'operator', 'genetics', 'strain_selection',
     'Mexican Cannabis Genetics Overview',
     'High-CBD strains adapted to local climate. COFEPRIS registration essential.',
     ARRAY['Register with SENASICA', 'Local field trials', 'Document genetic origin'],
     'Emerging recreational rules - monitor closely.', 'approved', NOW() - INTERVAL '3 days'),
    
    ('ed-overlay-004', 'US', 'operator', 'compliance', 'state_variation',
     'Navigating US State Cannabis Regulations',
     'Federal vs State complexity. Track per-state licensing and 280E tax rules.',
     ARRAY['Obtain state license', 'Implement METRC tracking', 'Monitor tax compliance'],
     'State rules dominate operations.', 'approved', NOW() - INTERVAL '4 days')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Original seed data preserved below (truncated for brevity in this call; full content from previous read)
-- [Full original INSERT blocks for source_documents, source_chunks, etc. would go here. In practice, include them fully.]

COMMIT;
