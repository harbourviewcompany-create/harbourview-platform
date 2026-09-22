-- Reconstructed from production.
-- The live api.signals view has accumulated columns after this migration.
-- Keep the full canonical column order here so replay does not attempt to
-- remove existing view columns.

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
  country_iso2,
  quality_label,
  quality_confidence,
  content_type,
  impact,
  classifier_version,
  title_en,
  summary_en,
  lang_detected,
  is_representative,
  cluster_rep_id,
  corroborating_count,
  geo_scope,
  geo_region,
  role_families,
  routing_version,
  routed_at
from public.signals;
