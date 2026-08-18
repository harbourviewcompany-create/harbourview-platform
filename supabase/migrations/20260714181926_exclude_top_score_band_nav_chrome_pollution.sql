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
-- version 20260714181926.
--
-- Rewriting this file cannot affect production: 20260714181926 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Refines the score>=50 relaxation applied moments ago. Spot-checking the
-- newly-surfaced content found the score band 90-99 is dominated by site
-- navigation/footer chrome, not real content -- confirmed by comparing
-- multiple articles on the same source (e.g. Business of Cannabis): the
-- exact same nav-menu boilerplate ("BofC Awards 2026 Cannabis Europa...
-- Recent Searches Popular Searches") scored 99 on two unrelated articles,
-- while the genuine substantive prose from those same articles (Albania's
-- cultivation law text, Slovenia's JAZMP licensing detail) scored 30-70.
-- Likely cause: nav menus densely repeat topic-taxonomy keywords
-- ("cannabis regulation", "medical cannabis", etc) in a way that games a
-- keyword-density-based score, while natural prose doesn't.
--
-- The existing v_boilerplate filter in hv_extract_signals_from_captured_text
-- catches generic site-chrome phrases (cookie policy, sign in, etc) but not
-- a site's own internal topic-navigation menu -- a different, source-
-- specific pattern that a generic list can't anticipate.
--
-- Excluding score >= 90 drops only 64 of the 1,085 newly-surfaced signals
-- (keeping 1,021) and removes essentially all of the nav-chrome pollution
-- observed in spot checks.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE cat <> 'SOURCE_ENGINE' OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90);
