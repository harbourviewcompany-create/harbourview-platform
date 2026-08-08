-- Expose the Pipeline B quality columns and the admin review counters on the
-- `api` schema, which is the only schema PostgREST serves for this project.
--
-- WHY
-- ---
-- `SIGNAL_QUALITY_SELECT` (lib/signals/quality.ts) names nine columns plus
-- `analysis`. All ten exist on `public.signals`. None are exposed on
-- `api.signals`, and none have ever existed on `signals_quality` in either
-- schema. Every reader that asked for them got a PostgREST 400, a null data
-- payload, and -- because the calling code cannot tell a malformed query from
-- an empty table -- silently fell through to a lower tier or returned nothing.
-- 3,745 reviewed rows are unreachable this way.
--
-- `admin_dashboard_counts` exists only in `public`, so the Command Centre stats
-- read fails and a `?? {zeros}` default hides it. Production currently holds
-- pending_listings 1, pending_buyer_requests 1, new_inquiries 8 -- eight
-- unactioned inquiries that are invisible in the product.
--
-- WHY A NEW VIEW RATHER THAN WIDENING api.signals
-- ------------------------------------------------
-- `api.signals` is granted to `anon`. Adding the quality columns to it would
-- publish internal classifier verdicts (`quality_label`, `quality_confidence`,
-- `impact`, `is_representative`, `cluster_rep_id`) and the generated `analysis`
-- payload to anonymous callers. That is a data-exposure change, not a bug fix,
-- so it is not made here.
--
-- Every consumer of these columns runs as `authenticated` (auth-gated dashboard
-- routes via the session client) or `service_role` (cron and synthesis paths).
-- None runs as `anon`. So the columns go on a separate view granted to exactly
-- those two roles, and `api.signals` is left byte-for-byte as it was.
--
-- SECURITY POSTURE
-- ----------------
-- `security_invoker = true`, matching every other view in `api`. RLS is enabled
-- on `public.signals`, so row visibility is still resolved against the calling
-- role -- this view widens which *columns* two already-privileged roles can
-- read, never which *rows*.
--
-- This migration creates read-only views and grants. It does not delete
-- application data, rewrite business records, or alter any existing object.

-- ── Signals with the Pipeline B quality columns ──────────────────────────────

create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  -- Exactly the columns api.signals already exposes, in its order.
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at, embedding_1024,
  embedding_model, embedded_at, reviewed_by, reviewed_at, editorial_title,
  editorial_blurb, country_iso2,
  -- The quality family this view exists to carry.
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on view api.signals_with_quality is
  'public.signals plus the Pipeline B quality columns. Deliberately NOT granted to anon: it carries internal classifier verdicts and the generated analysis payload. api.signals remains the anon-readable projection.';

-- ── Admin review counters ────────────────────────────────────────────────────

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
