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
-- version 20260720185717.
--
-- Rewriting this file cannot affect production: 20260720185717 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fix: promoted/reviewed signals were still filtered out by signals_quality's pre-classifier score band,
-- hiding ~70% of what the quality brain approved. Quality-approved rows now bypass the score band.
create or replace view public.signals_quality as
 SELECT id, date, cat, pri, score, headline, summary, source, url, verification, tier, lang,
    company, country, in_network, lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
    reviewed, action, created_at, embedding_1024, embedding_model, embedded_at,
    analysis, analysis_generated_at, analysis_backend
   FROM signals
  WHERE (action IS NULL OR action <> 'rejected'::text)
    AND (
         reviewed = true
      OR (cat <> ALL (ARRAY['SOURCE_ENGINE'::text, 'GAZETTE'::text]))
      OR (cat = 'SOURCE_ENGINE'::text AND score >= 50 AND score < 90)
      OR (cat = 'GAZETTE'::text AND score >= 70)
    );
