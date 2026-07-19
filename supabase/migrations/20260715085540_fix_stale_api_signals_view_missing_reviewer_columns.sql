-- The SOURCE_ENGINE review queue (app/admin/(protected)/signals/queue/page.tsx,
-- lib/signals-engine/admin.ts, merged this morning in eb293d0) is completely
-- non-functional in production: api.signals (the PostgREST-exposed view that
-- fetchAdminSupabaseJson/adminRequest hit via bare /rest/v1/signals) was never
-- refreshed after 20260713090000_signals_reviewer_tracking_stub.sql added
-- reviewed_by/reviewed_at to the base public.signals table. Every call the
-- new queue makes -- listEngineReviewQueue, countEngineReviewQueue,
-- listDistinctEngineCountries (all SELECT reviewed_by,reviewed_at),
-- approveEngineSignal/rejectEngineSignal/bulkApproveEngineQueue (all PATCH
-- reviewed_by/reviewed_at) -- 400s with "column does not exist". Confirmed
-- live: `select id, reviewed_by, reviewed_at from api.signals` errors with
-- exactly that message pre-fix.
--
-- Same bug class, same fix pattern as
-- 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql earlier
-- this week: the view just needs the new columns added to its SELECT list.
-- No RLS/security posture change -- api.signals is already read/write for
-- authenticated + service_role (this is an admin-only surface gated by
-- requireAdminAuth() at the route level, not by this view).
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
  reviewed_at
from public.signals;
