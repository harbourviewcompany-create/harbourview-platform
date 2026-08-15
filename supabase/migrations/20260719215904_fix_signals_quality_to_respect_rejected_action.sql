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
-- version 20260719215904.
--
-- Rewriting this file cannot affect production: 20260719215904 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Found via live testing: signals_quality's SOURCE_ENGINE/GAZETTE branches
-- only checked score, never action/reviewed. This meant the review
-- queue's reject button (built earlier this session) had zero actual
-- effect on visibility for any signal whose score already fell in the
-- passing range -- rejecting it set action='rejected' but the view kept
-- showing it anyway. Real gap between two features that looked complete
-- independently but didn't compose. Fixed by adding the rejected-action
-- exclusion to every branch, not just the manually-curated categories
-- that already had it implicitly (via reviewed=true always being set for
-- those, with no reject path to begin with).

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at,
       analysis, analysis_generated_at, analysis_backend
FROM public.signals
WHERE (action IS NULL OR action <> 'rejected')
  AND (
    (cat NOT IN ('SOURCE_ENGINE','GAZETTE'))
    OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90)
    OR (cat = 'GAZETTE' AND score >= 70)
  );
