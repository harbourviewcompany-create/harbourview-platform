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
-- version 20260710230603.
--
-- Rewriting this file cannot affect production: 20260710230603 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


INSERT INTO source_snapshots (source_id, captured_url, captured_title, captured_text, fetch_status, language_detected, processing_status, signal_candidates)
VALUES (
  '431f3158-b037-471c-8ae7-af55efc8ea35',
  'https://www.theguardian.com/world/2026/jul/10/thailand-cannabis-fallback-test',
  'TEST: Thailand health ministry cannabis inspection order',
  'Thailand''s Ministry of Public Health ordered stricter joint inspections of licensed cannabis cultivation sites this week, threatening suspension or revocation of licences for violations, following a string of cannabis seizures traced to Thai growers surfacing in the UK, Germany, Indonesia and Hong Kong.',
  'success',
  'en',
  'pending',
  NULL
)
RETURNING id;
