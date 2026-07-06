-- ============================================================
-- Same class of bug as enqueue_regulatory_enrichment (see prior
-- migration): PostgREST on this project only exposes the `api`
-- schema (lib/supabase/env.ts), but public.claim_intelligence_job()
-- lives in public. lib/intelligence/queue-connector.ts's
-- claimNextJob() calls supabase.rpc('claim_intelligence_job', ...)
-- on a client scoped to db.schema='api', so it would 404/PGRST202
-- the moment anything actually calls it. This adds the same kind
-- of minimal api-schema wrapper, preserving the exact parameter
-- names (p_job_type, p_worker_id) so PostgREST's named-argument
-- dispatch still matches what queue-connector.ts sends.
-- ============================================================

create or replace function api.claim_intelligence_job(p_job_type text, p_worker_id text)
returns setof public.intelligence_jobs
language sql
security definer
set search_path = ''
as $$
  select * from public.claim_intelligence_job(p_job_type, p_worker_id);
$$;

comment on function api.claim_intelligence_job(text, text) is
  'PostgREST-exposed wrapper for public.claim_intelligence_job(). '
  'Called by lib/intelligence/queue-connector.ts claimNextJob(). '
  'Atomically claims the next pending intelligence_jobs row of the '
  'given job_type via FOR UPDATE SKIP LOCKED.';

-- service_role only: job claiming is an internal worker operation,
-- not something anon or authenticated end users should trigger.
revoke all on function api.claim_intelligence_job(text, text) from public;
grant execute on function api.claim_intelligence_job(text, text) to service_role;
