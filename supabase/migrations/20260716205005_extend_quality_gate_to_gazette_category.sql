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
-- version 20260716205005.
--
-- Rewriting this file cannot affect production: 20260716205005 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- GAZETTE has the identical profile to SOURCE_ENGINE (automated
-- government-portal extraction, same keyword-density-gaming failure mode)
-- but was never gated -- reviewed=true unconditionally on all 24 rows,
-- same as every non-SOURCE_ENGINE category, regardless of content quality.
-- Reviewed all 24 directly: score >= 70 is exclusively real headlines
-- (Jamaica hemp legislation, Mexico COFEPRIS); everything below is site
-- nav menus, portal homepage titles ("Frontpage | The Cannabis Licensing
-- Authority of Jamaica"), and in one case a fabricated date (2045),
-- confirming this is the same nav-chrome pollution pattern found in
-- SOURCE_ENGINE, just concentrated at a lower score range because
-- government portals are almost entirely nav-structured.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE (cat NOT IN ('SOURCE_ENGINE','GAZETTE'))
   OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90)
   OR (cat = 'GAZETTE' AND score >= 70);
