-- ============================================================
-- Same bug class as the two prior fixes (expose_enqueue_regulatory_
-- enrichment, expose_claim_intelligence_job): PostgREST on this
-- project only exposes the `api` schema (lib/supabase/env.ts), so
-- any function living only in `public` is unreachable from every
-- code path that calls it via supabase-js .rpc() or a raw
-- /rest/v1/rpc/<fn> POST with no Accept-Profile/Content-Profile
-- override — which is every call path in this codebase.
--
-- Full-codebase audit of `.rpc(` / `supabase.rpc(` call sites found
-- five more real instances (parameter names below match each call
-- site exactly, verified against the calling code, so PostgREST's
-- named-argument dispatch still resolves correctly):
--
--   1. check_and_increment_llm_rate_limit  <- lib/llm/rateLimit.ts
--      Silent-degrade bug: on RPC error this falls back to
--      per-instance in-memory rate limiting, defeating the whole
--      point of the DB-backed atomic upsert (cross-instance
--      correctness) without ever surfacing an error.
--   2. acquire_crawl_targets  <- lib/intelligence-engine/queue/task-queue.ts
--      Silent-degrade bug: on RPC error this falls back to a
--      manual select-then-update, which is not atomic (race-prone
--      under concurrent crawl workers) unlike the real RPC's
--      FOR UPDATE SKIP LOCKED claim.
--   3. promote_all_extracted_snapshots        <- app/admin/(protected)/hub/HubPanel.tsx
--   4. hv_ingest_snapshot_to_staging          <- app/admin/(protected)/hub/HubPanel.tsx
--   5. hv_extract_signals_from_captured_text  <- app/admin/(protected)/hub/HubPanel.tsx
--      These three are admin "Hub" control-surface actions, routed
--      through app/api/admin/hub-proxy (service_role, no schema
--      override) — same unreachable-function issue, but these
--      would have hard-failed visibly (button click -> 404) rather
--      than silently degrading.
--
-- Not touched: get_command_centre_stats (called from
-- lib/dashboard/commandCentreLiveData.ts) does not exist in ANY
-- schema, not just api — but that call is already wrapped in
-- .catch(() => ({ data: null, error: null })), its result is never
-- read, and the function's own comment says "avoids needing an RPC
-- if it doesn't exist yet". Dead/defensive code, not this bug class;
-- leaving as-is.
-- ============================================================

create or replace function api.check_and_increment_llm_rate_limit(
  p_user_id uuid, p_window_start timestamptz, p_limit integer
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.check_and_increment_llm_rate_limit(p_user_id, p_window_start, p_limit);
$$;

comment on function api.check_and_increment_llm_rate_limit(uuid, timestamptz, integer) is
  'PostgREST-exposed wrapper for public.check_and_increment_llm_rate_limit(). '
  'Called by lib/llm/rateLimit.ts checkRateLimitDB(). Without this, the '
  'RPC 404s and rate limiting silently falls back to per-instance '
  'in-memory counting.';
revoke all on function api.check_and_increment_llm_rate_limit(uuid, timestamptz, integer) from public;
grant execute on function api.check_and_increment_llm_rate_limit(uuid, timestamptz, integer) to service_role;


create or replace function api.acquire_crawl_targets(p_limit integer, p_worker_id text)
returns setof public.source_registry
language sql
security definer
set search_path = ''
as $$
  select * from public.acquire_crawl_targets(p_limit, p_worker_id);
$$;

comment on function api.acquire_crawl_targets(integer, text) is
  'PostgREST-exposed wrapper for public.acquire_crawl_targets(). Called by '
  'lib/intelligence-engine/queue/task-queue.ts DistributedTaskQueue.acquireTargets(). '
  'Without this, the RPC 404s and target acquisition silently falls back to '
  'a non-atomic select-then-update, which is race-prone under concurrent workers.';
revoke all on function api.acquire_crawl_targets(integer, text) from public;
grant execute on function api.acquire_crawl_targets(integer, text) to service_role;


create or replace function api.promote_all_extracted_snapshots()
returns table(snapshot_id uuid, signals_promoted integer)
language sql
security definer
set search_path = ''
as $$
  select * from public.promote_all_extracted_snapshots();
$$;

comment on function api.promote_all_extracted_snapshots() is
  'PostgREST-exposed wrapper for public.promote_all_extracted_snapshots(). '
  'Called by the admin Hub panel (app/admin/(protected)/hub) via '
  'app/api/admin/hub-proxy.';
revoke all on function api.promote_all_extracted_snapshots() from public;
grant execute on function api.promote_all_extracted_snapshots() to service_role;


create or replace function api.hv_ingest_snapshot_to_staging(p_batch_size integer, p_workspace_id uuid)
returns table(snapshot_id uuid, staging_ids uuid[], candidates_count integer, skipped boolean, skip_reason text)
language sql
security definer
set search_path = ''
as $$
  select * from public.hv_ingest_snapshot_to_staging(p_batch_size, p_workspace_id);
$$;

comment on function api.hv_ingest_snapshot_to_staging(integer, uuid) is
  'PostgREST-exposed wrapper for public.hv_ingest_snapshot_to_staging(). '
  'Called by the admin Hub panel (app/admin/(protected)/hub) via '
  'app/api/admin/hub-proxy.';
revoke all on function api.hv_ingest_snapshot_to_staging(integer, uuid) from public;
grant execute on function api.hv_ingest_snapshot_to_staging(integer, uuid) to service_role;


create or replace function api.hv_extract_signals_from_captured_text(p_batch_size integer)
returns table(snapshot_id uuid, source_name text, country text, candidates_found integer, status_set text)
language sql
security definer
set search_path = ''
as $$
  select * from public.hv_extract_signals_from_captured_text(p_batch_size);
$$;

comment on function api.hv_extract_signals_from_captured_text(integer) is
  'PostgREST-exposed wrapper for public.hv_extract_signals_from_captured_text(). '
  'Called by the admin Hub panel (app/admin/(protected)/hub) via '
  'app/api/admin/hub-proxy.';
revoke all on function api.hv_extract_signals_from_captured_text(integer) from public;
grant execute on function api.hv_extract_signals_from_captured_text(integer) to service_role;
