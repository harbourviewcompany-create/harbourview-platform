create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at, embedding_1024,
  embedding_model, embedded_at, reviewed_by, reviewed_at, editorial_title,
  editorial_blurb, country_iso2,
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on view api.signals_with_quality is
  'public.signals plus the Pipeline B quality columns. Deliberately NOT granted to anon: it carries internal classifier verdicts and the generated analysis payload. api.signals remains the anon-readable projection.';

create or replace view api.admin_dashboard_counts
with (security_invoker = true)
as
select
  pending_listings,
  pending_buyer_requests,
  new_inquiries,
  pending_matches,
  pending_disclosures
from public.admin_dashboard_counts;

revoke all on api.admin_dashboard_counts from public, anon;
grant select on api.admin_dashboard_counts to authenticated, service_role;

comment on view api.admin_dashboard_counts is
  'Review-queue counters for the Command Centre. security_invoker, so the counts a caller sees are the rows their own role may read.';
