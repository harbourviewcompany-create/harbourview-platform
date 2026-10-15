-- Reconstructed from production.
--
-- This is a repository-only replay-fidelity repair. Production already records
-- version 20260715085610, so changing this file cannot re-apply it to production.
--
-- The production-era statement exposed reviewed_by/reviewed_at. The repository's
-- earlier reconstructed view already carries the later editorial/country columns;
-- preserving those columns here is required because CREATE OR REPLACE VIEW cannot
-- remove existing view columns during a clean replay.

create or replace view api.signals
  with (security_invoker = on)
  as
select
  id,
  date,
  cat,
  pri,
  score,
  headline,
  summary,
  source,
  url,
  verification,
  tier,
  lang,
  company,
  country,
  in_network,
  lane_r,
  lane_e,
  lane_t,
  top_lane,
  query_pack,
  commercial_impact,
  reviewed,
  action,
  created_at,
  embedding_1024,
  embedding_model,
  embedded_at,
  reviewed_by,
  reviewed_at,
  editorial_title,
  editorial_blurb,
  country_iso2
from public.signals;