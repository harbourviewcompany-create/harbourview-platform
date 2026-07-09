-- SEED: development only, not for production
-- =============================================================================
-- Harbourview Intelligence Pipeline — Development Seed Data (v2)
--
-- Replaces the previous supabase/seed.sql, which targeted a schema
-- (source_documents, entities, signal_candidates, model_prompt_versions,
-- signal_conversions, etc.) that no longer exists in this project -- 9 of
-- its 13 target tables were missing entirely and the other 4 had
-- drastically different columns. That file could never have run
-- successfully; this one is verified against the live schema.
--
-- Covers the real, currently-active ia_* intelligence pipeline: sources ->
-- signals -> embeddings -> counterparties -> evidence/scoring -> agent
-- tasks -> relationship graph -> feedback events. All names, IDs, and
-- content are fictional and for local dev only.
--
-- Idempotent: every INSERT uses ON CONFLICT (id) DO NOTHING against these
-- fixed dev IDs, so `supabase db reset` is safe to run repeatedly.
--
-- Intentionally NOT included: seeding auth.users directly via SQL. Supabase
-- Auth (GoTrue) requires a matching auth.identities row and a real password
-- hash per user; a raw INSERT INTO auth.users skips both, producing rows
-- that exist but can never actually log in. If dev auth users are needed,
-- create them with the Supabase Admin API (supabase.auth.admin.createUser())
-- in a separate script -- not as SQL in this file.
--
-- Embeddings: real dev/mock vectors (not zero-vectors) generated inline via
-- random() so similarity-search UI has something non-degenerate to show;
-- dimensions match the live columns exactly (ia_source_embeddings: 1536,
-- ia_signal_embeddings: 768/text-embedding-004 as of the
-- switch_embeddings_768_dim migration) -- confirmed via pg_attribute.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ia_sources (3 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_sources (
  id, name, category, markets, reliability, last_checked, next_check,
  signal_yield, status, notes
) VALUES
  ('dev-src-001', 'Dev: BfArM Import Bulletin (fictitious)', 'regulatory',
   ARRAY['Germany'], 'high', now() - interval '2 days', now() + interval '5 days',
   12, 'active', 'Dev seed source -- fictitious regulatory bulletin feed.'),
  ('dev-src-002', 'Dev: EU Cannabis Trade Digest (fictitious)', 'trade_press',
   ARRAY['Germany', 'Denmark', 'Netherlands'], 'medium', now() - interval '1 day', now() + interval '6 days',
   7, 'active', 'Dev seed source -- fictitious trade-press aggregator.'),
  ('dev-src-003', 'Dev: Manual Admin Entry (fictitious)', 'manual',
   ARRAY['United Kingdom'], 'medium', now() - interval '10 days', null,
   2, 'paused', 'Dev seed source -- manual entries, not actively polled.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_source_embeddings (2 rows) -- vector(1536), confirmed dimension
-- ---------------------------------------------------------------------------
INSERT INTO ia_source_embeddings (source_id, embedding, model)
VALUES
  ('dev-src-001', (SELECT array_agg(round((random() - 0.5)::numeric, 5)) FROM generate_series(1, 1536))::vector(1536), 'text-embedding-3-small'),
  ('dev-src-002', (SELECT array_agg(round((random() - 0.5)::numeric, 5)) FROM generate_series(1, 1536))::vector(1536), 'text-embedding-3-small')
ON CONFLICT (source_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_signals (4 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_signals (
  id, title, type, stage, source_id, source_name, market, category,
  confidence, commercial_impact, summary, detected_at
) VALUES
  ('dev-sig-001', 'Dev: BfArM raises medical cannabis import ceiling (fictitious)',
   'regulatory_change', 'qualified', 'dev-src-001', 'Dev: BfArM Import Bulletin (fictitious)',
   'Germany', 'regulatory', 88, 'high',
   'Fictitious dev signal: import quota raised in response to sustained demand growth.',
   now() - interval '3 days'),
  ('dev-sig-002', 'Dev: New EU-GMP cultivator licensed (fictitious)',
   'market_entry', 'new', 'dev-src-002', 'Dev: EU Cannabis Trade Digest (fictitious)',
   'Denmark', 'supply', 72, 'medium',
   'Fictitious dev signal: additional EU-GMP cultivation capacity coming online.',
   now() - interval '1 day'),
  ('dev-sig-003', 'Dev: Telemedicine prescribing under regulatory review (fictitious)',
   'regulatory_change', 'qualified', 'dev-src-001', 'Dev: BfArM Import Bulletin (fictitious)',
   'Germany', 'regulatory', 65, 'high',
   'Fictitious dev signal: proposed tightening of telemedicine prescribing pathway.',
   now() - interval '5 days'),
  ('dev-sig-004', 'Dev: Duplicate-flagged pricing update (fictitious)',
   'price_update', 'needs_review', 'dev-src-003', 'Dev: Manual Admin Entry (fictitious)',
   'United Kingdom', 'pricing', 41, 'low',
   'Fictitious dev signal: low-confidence manual entry pending dedup review.',
   now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_signal_embeddings (3 rows) -- vector(768), text-embedding-004.
-- Matches migration switch_embeddings_768_dim, applied live 2026-07-09.
-- ---------------------------------------------------------------------------
INSERT INTO ia_signal_embeddings (signal_id, embedding, model)
VALUES
  ('dev-sig-001', (SELECT array_agg(round((random() - 0.5)::numeric, 5)) FROM generate_series(1, 768))::vector(768), 'text-embedding-004'),
  ('dev-sig-002', (SELECT array_agg(round((random() - 0.5)::numeric, 5)) FROM generate_series(1, 768))::vector(768), 'text-embedding-004'),
  ('dev-sig-003', (SELECT array_agg(round((random() - 0.5)::numeric, 5)) FROM generate_series(1, 768))::vector(768), 'text-embedding-004')
ON CONFLICT (signal_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_counterparties (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_counterparties (
  id, name, role, markets, categories, needs_profile, supply_profile,
  interaction_count, last_interaction, introduction_count, documentation_status, notes
) VALUES
  ('dev-cp-001', 'Dev: Fictitious Pharma GmbH', 'supplier',
   ARRAY['Germany'], ARRAY['medical_cannabis', 'eu_gmp'],
   null, 'EU-GMP dried flower, 500kg/year capacity (fictitious dev entry)',
   4, now() - interval '7 days', 1, 'complete',
   'Dev seed counterparty -- fictitious EU-GMP licensed producer.'),
  ('dev-cp-002', 'Dev: Fictitious Nordic Buyers Ltd', 'buyer',
   ARRAY['Denmark', 'Sweden'], ARRAY['medical_cannabis'],
   'Seeking EU-GMP dried flower, ongoing monthly volume', null,
   2, now() - interval '20 days', 0, 'partial',
   'Dev seed counterparty -- fictitious Nordic buyer group.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_evidence_vault (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_evidence_vault (
  id, title, type, linked_counterparty_id, linked_counterparty_name,
  linked_market, review_status, tags, notes, added_at
) VALUES
  ('dev-ev-001', 'Dev: GMP certificate excerpt (fictitious)', 'document',
   'dev-cp-001', 'Dev: Fictitious Pharma GmbH', 'Germany', 'reviewed',
   ARRAY['gmp', 'certification'], 'Dev seed evidence -- fictitious certificate reference.',
   now() - interval '6 days'),
  ('dev-ev-002', 'Dev: Buyer intake call notes (fictitious)', 'note',
   'dev-cp-002', 'Dev: Fictitious Nordic Buyers Ltd', 'Denmark', 'pending',
   ARRAY['intake', 'buyer'], 'Dev seed evidence -- fictitious call summary.',
   now() - interval '18 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_scoring_records (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_scoring_records (
  id, counterparty_id, counterparty_name, counterparty_role,
  fit_score, readiness_score, trust_score,
  routing_priority, follow_up_priority, introduction_priority,
  market_access_relevance, scored_at, score_drivers
) VALUES
  ('dev-sc-001', 'dev-cp-001', 'Dev: Fictitious Pharma GmbH', 'supplier',
   88, 82, 75, 'high', 'soon', 'high',
   ARRAY['Germany', 'Denmark'], now() - interval '5 days',
   ARRAY['eu_gmp_certified', 'active_capacity', 'responsive']),
  ('dev-sc-002', 'dev-cp-002', 'Dev: Fictitious Nordic Buyers Ltd', 'buyer',
   64, 55, 60, 'medium', 'urgent', 'medium',
   ARRAY['Denmark', 'Sweden'], now() - interval '15 days',
   ARRAY['clear_demand_signal', 'documentation_incomplete'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_agent_tasks (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_agent_tasks (
  id, queue, title, object_type, object_label, priority,
  suggested_action, rationale, status, agent_label, next_action, notes
) VALUES
  ('dev-task-001', 'review', 'Dev: Review fictitious GMP evidence', 'evidence',
   'Dev: GMP certificate excerpt (fictitious)', 'high',
   'verify_document', 'Dev seed task -- new evidence pending review.',
   'pending', 'intake-agent', 'Route to compliance reviewer',
   'Dev seed agent task.'),
  ('dev-task-002', 'dedup', 'Dev: Resolve duplicate pricing signal', 'signal',
   'Dev: Duplicate-flagged pricing update (fictitious)', 'low',
   'merge_or_reject', 'Dev seed task -- low-confidence manual signal needs triage.',
   'pending', 'dedup-agent', 'Compare against existing UK pricing signals',
   'Dev seed agent task.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_graph_entities (3 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_graph_entities (
  id, type, label, market, category, connection_count, signal_count, last_activity
) VALUES
  ('dev-ent-001', 'counterparty', 'Dev: Fictitious Pharma GmbH', 'Germany', 'medical_cannabis', 2, 2, now() - interval '3 days'),
  ('dev-ent-002', 'counterparty', 'Dev: Fictitious Nordic Buyers Ltd', 'Denmark', 'medical_cannabis', 1, 1, now() - interval '15 days'),
  ('dev-ent-003', 'source', 'Dev: BfArM Import Bulletin (fictitious)', 'Germany', 'regulatory', 2, 2, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_graph_edges (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_graph_edges (id, type, from_label, to_label, strength, evidenced)
VALUES
  ('dev-edge-001', 'supplies_to', 'Dev: Fictitious Pharma GmbH', 'Dev: Fictitious Nordic Buyers Ltd', 'medium', false),
  ('dev-edge-002', 'sourced_from', 'Dev: BfArM Import Bulletin (fictitious)', 'Dev: Fictitious Pharma GmbH', 'strong', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ia_feedback_events (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ia_feedback_events (
  id, outcome_type, counterparty_name, market, category,
  score_impact, routing_impact, notes, logged_at
) VALUES
  ('dev-fb-001', 'introduction_accepted', 'Dev: Fictitious Pharma GmbH', 'Germany', 'medical_cannabis',
   'positive', 'increase_priority', 'Dev seed feedback -- fictitious accepted introduction.', now() - interval '4 days'),
  ('dev-fb-002', 'documentation_incomplete', 'Dev: Fictitious Nordic Buyers Ltd', 'Denmark', 'medical_cannabis',
   'negative', 'flag_for_followup', 'Dev seed feedback -- fictitious incomplete documentation flag.', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;
