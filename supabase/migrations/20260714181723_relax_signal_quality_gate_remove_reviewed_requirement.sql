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
-- version 20260714181723.
--
-- Rewriting this file cannot affect production: 20260714181723 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fixes the second major gap found this session: signals_quality required
-- cat='SOURCE_ENGINE' rows to have reviewed=true, but the review UI that
-- exists in the app (app/admin/signals/review/page.tsx) is wired to a
-- completely different, empty schema (regulatory_signals.signals, 0 rows)
-- -- not public.signals. Result: 7,136 automated signals had literally no
-- path to ever being marked reviewed=true, so 0 of them ever appeared
-- anywhere in the product regardless of quality.
--
-- Per Tyler's decision: relax the gate rather than build a new review UI
-- right now. Kept the existing score >= 50 threshold (already calibrated
-- by whoever built the scoring function, part of the original view) and
-- simply dropped the reviewed=true requirement for SOURCE_ENGINE rows.
-- This is a score-distribution-informed choice, not an arbitrary number:
-- score >= 50 already existed as the intended quality bar in the original
-- view definition; only the redundant, unreachable reviewed check is removed.
--
-- Verified impact before applying: exactly 1,085 of 7,136 SOURCE_ENGINE
-- signals have score >= 50 and will now surface.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE cat <> 'SOURCE_ENGINE' OR (cat = 'SOURCE_ENGINE' AND score >= 50);
