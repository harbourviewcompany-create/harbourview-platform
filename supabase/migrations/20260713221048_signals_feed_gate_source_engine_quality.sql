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
-- version 20260713221048.
--
-- Rewriting this file cannot affect production: 20260713221048 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- The signals side of the feed gated only on reviewed=true AND score>=6, which let 528 raw
-- SOURCE_ENGINE scraper rows (median score 30) flood the feed and bury ~75 curated signals
-- (median score 70). reviewed=true is set by ingest, not a real review, so it isn't a real gate.
--
-- Fix: keep curated categories at the low bar, but require SOURCE_ENGINE (the raw scraper tier)
-- to clear score>=60 — the point where its distribution separates from noise (14 of 528 survive,
-- vs 48 of 75 curated). Also hard-exclude literal raw-text dumps (unprocessed page scrapes whose
-- headline still contains the scraper's "--> STATUS AS AT"/"CHAPTER" boilerplate or has no
-- lowercase letters at all). ia_signals side unchanged (already gated by stage).
CREATE OR REPLACE VIEW public.signals_intelligence_feed AS
 SELECT s.id AS signal_id,
    s.headline AS title,
    s.summary,
    s.cat AS category,
    s.country,
    s.date AS signal_date,
    s.score,
    s.pri AS priority,
    s.commercial_impact,
    s.url,
    s.source,
    s.reviewed,
    s.created_at,
    'signals'::text AS source_table
   FROM signals s
  WHERE s.reviewed = true
    AND (
      (s.cat = 'SOURCE_ENGINE' AND s.score >= 60)
      OR (s.cat <> 'SOURCE_ENGINE' AND s.score >= 6)
    )
    -- belt-and-suspenders: never surface an unprocessed raw-text dump
    AND s.headline !~~ '-->%'
    AND s.headline !~~ '%STATUS AS AT%'
    AND s.headline ~ '[a-z]'
UNION ALL
 SELECT ia.id AS signal_id,
    ia.title,
    ia.summary,
    ia.category,
    ia.market AS country,
    ia.detected_at AS signal_date,
    (ia.confidence / 10)::numeric AS score,
    ia.commercial_impact AS priority,
    ia.commercial_impact,
    NULL::text AS url,
    ia.source_name AS source,
    true AS reviewed,
    ia.created_at,
    'ia_signals'::text AS source_table
   FROM ia_signals ia
  WHERE (ia.stage = ANY (ARRAY['qualified'::text, 'converted_to_opportunity'::text])) AND ia.id !~~ 's-%'::text;
