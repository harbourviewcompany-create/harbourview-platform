-- Applied directly to production via Supabase MCP apply_migration on 2026-07-22.
-- This file reconciles the migration ledger with the change already live in production
-- (flagged by the Supabase GitHub integration bot on PR #1124: "no changes detected in
-- supabase directory" -- the view had been updated live but never checked in).
--
-- api.signals is the PostgREST-exposed view (schema `api` is the only schema PostgREST
-- serves on this project -- see lib/supabase/client.ts). It predates the 2026-07-16
-- migration (20260716195743_signals_country_iso_resolution) that added
-- public.signals.country_iso2, resolved server-side by trg_signals_resolve_geo, and was
-- never updated to expose it -- so the globe's client-side read of country_iso2 would
-- 404/column-not-exist at runtime despite the column existing on the base table.
--
-- Additive only: appends one column to the view's SELECT list, same
-- security_invoker=true (RLS on public.signals still governs which rows anon/
-- authenticated can see; this does not change row-level access, only makes an
-- already-safe, non-sensitive derived column visible on rows already readable).
-- Verified via get_advisors(security): zero new findings post-migration.
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
