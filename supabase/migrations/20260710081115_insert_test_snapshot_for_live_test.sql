-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710081115.
--
-- Rewriting this file cannot affect production: 20260710081115 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


INSERT INTO source_snapshots (source_id, captured_url, captured_title, captured_text, fetch_status, language_detected, processing_status, signal_candidates)
VALUES (
  '431f3158-b037-471c-8ae7-af55efc8ea35',
  'https://www.theguardian.com/world/2026/jul/09/thailand-cannabis-crackdown-test-simulated',
  'TEST: Thailand tightens cannabis farm inspections amid smuggling concerns',
  'Thailand''s Ministry of Public Health on Tuesday ordered provincial health offices to conduct stricter joint inspections of licensed cannabis cultivation sites alongside police, threatening immediate suspension or revocation of licences for violations. The move follows a string of seizures traced back to Thai-grown cannabis surfacing in the United Kingdom, Germany, Indonesia and Hong Kong in recent weeks, prompting renewed political pressure on the four-year-old decriminalisation framework. Prime Minister Anutin Charnvirakul warned that the entire system could face re-criminalisation if parliament does not move stalled control legislation forward. Growers and industry analysts have pointed to a straightforward economic driver: a domestic supply glut, caused by too many licensed cultivators chasing a shrinking and price-collapsed local market, has made bulk sales to illegal export buyers increasingly attractive relative to the legal retail channel the country originally built after its landmark 2022 reform.',
  'success',
  'en',
  'pending',
  NULL
)
RETURNING id;
