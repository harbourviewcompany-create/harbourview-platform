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
-- version 20260722103428.
--
-- Rewriting this file cannot affect production: 20260722103428 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- api.signals is the PostgREST-exposed view (schema `api` is the only schema PostgREST
-- serves on this project — see lib/supabase/client.ts). It predates the 2026-07-16
-- migration that added public.signals.country_iso2 (resolved server-side by
-- trg_signals_resolve_geo) and was never updated to expose it, so the globe's
-- client-side read of country_iso2 would 404/column-not-exist at runtime despite the
-- column existing on the base table. Additive only: appends one column to the view's
-- SELECT list, same security_invoker=true (RLS on public.signals still governs which
-- rows anon/authenticated can see; this does not change row-level access, only makes
-- an already-safe, non-sensitive derived column visible on rows already readable).
create or replace view api.signals
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification, tier, lang,
  company, country, in_network, lane_r, lane_e, lane_t, top_lane, query_pack,
  commercial_impact, reviewed, action, created_at, embedding_1024, embedding_model,
  embedded_at, reviewed_by, reviewed_at, editorial_title, editorial_blurb,
  country_iso2
from public.signals;
