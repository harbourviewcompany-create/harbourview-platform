-- Elite Digest forward hardening: least-privilege execution and RPC-only feedback writes.
--
-- Forward-only and data-preserving:
-- - changes grants only;
-- - does not delete, rewrite, or backfill operator feedback;
-- - keeps RLS enabled as defense in depth;
-- - preserves service-role aggregate access required by ranking and health checks.

alter table public.signal_relevance_feedback enable row level security;

-- The feedback table is not a client Data API surface. Authenticated clients write
-- through api.submit_signal_relevance_feedback(), and ranking reads through the
-- service-role-only api.signal_relevance_feedback_for_ranking() projection.
revoke all privileges on table public.signal_relevance_feedback
  from PUBLIC, anon, authenticated;

grant select, insert on table public.signal_relevance_feedback
  to service_role;

-- Internal intelligence functions must not be directly callable by public API roles.
revoke all privileges
  on function public.hv_dedup_assign(double precision, integer)
  from PUBLIC, anon, authenticated;

grant execute
  on function public.hv_dedup_assign(double precision, integer)
  to service_role;

revoke all privileges
  on function public._digest_cluster_size(text)
  from PUBLIC, anon, authenticated;

grant execute
  on function public._digest_cluster_size(text)
  to service_role;

-- Reassert the narrow RPC contract in case a prior environment drifted.
grant usage on schema api to authenticated, service_role;

revoke all privileges
  on function api.submit_signal_relevance_feedback(text, text, text, text)
  from PUBLIC, anon, service_role;

grant execute
  on function api.submit_signal_relevance_feedback(text, text, text, text)
  to authenticated;

revoke all privileges
  on function api.signal_relevance_feedback_for_ranking(text[], timestamptz)
  from PUBLIC, anon, authenticated;

grant execute
  on function api.signal_relevance_feedback_for_ranking(text[], timestamptz)
  to service_role;

comment on table public.signal_relevance_feedback is
  'Operator judgments retained in public storage but client writes are RPC-only through api.submit_signal_relevance_feedback; ranking uses the service-role-only projection.';

comment on function public.hv_dedup_assign(double precision, integer) is
  'Service-role-only HNSW dedup assignment. Public API roles have no EXECUTE privilege.';

comment on function public._digest_cluster_size(text) is
  'Service-role-only internal Digest corroboration helper. Public API roles have no EXECUTE privilege.';
