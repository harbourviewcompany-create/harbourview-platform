-- Exposes public.pipeline_manual_review_queue (added in
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql) to
-- PostgREST via the api schema, mirroring api.daily_digest
-- (security_invoker view, service_role only -- this is internal ops data,
-- not a public/authenticated surface). Used by
-- app/api/cron/pipeline-manual-review-notify.

alter table public.pipeline_manual_review_queue enable row level security;

create view api.pipeline_manual_review_queue
  with (security_invoker = on)
  as select
    id,
    pipeline,
    reference_date,
    reason,
    detail,
    created_at,
    notified_at,
    resolved_at,
    resolved_by
  from public.pipeline_manual_review_queue;

grant select, update on api.pipeline_manual_review_queue to service_role;
grant select, update on public.pipeline_manual_review_queue to service_role;
