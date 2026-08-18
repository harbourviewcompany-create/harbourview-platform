-- Admin Command Center Phase 0-4
--
-- Production currently has public.hv_admin_review_queue but no api-schema
-- exposure, while Harbourview's Data API is intentionally pinned to `api`.
-- Existing callers therefore cannot read the queue through PostgREST.
--
-- These RPCs are deliberately service-role-only and use dynamic SQL so
-- zero-state migration replay does not invent or replace production-owned
-- public tables. If an underlying table is absent at runtime, the call fails
-- explicitly and the Admin Command Center reports that operation as degraded.

create or replace function api.list_admin_review_queue(
  p_include_resolved boolean default false,
  p_limit integer default 250
)
returns table (
  id text,
  queue_type text,
  target_entity_type text,
  target_entity_id text,
  assigned_to text,
  priority text,
  status text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  return query execute $sql$
    select
      id::text,
      queue_type::text,
      target_entity_type::text,
      target_entity_id::text,
      assigned_to::text,
      priority::text,
      status::text,
      notes::text,
      created_at,
      updated_at,
      resolved_at
    from public.hv_admin_review_queue
    where ($1 or status::text <> 'resolved')
    order by created_at asc
    limit $2
  $sql$
  using p_include_resolved, greatest(1, least(coalesce(p_limit, 250), 500));
end
$function$;

revoke all on function api.list_admin_review_queue(boolean, integer) from public, anon, authenticated;
grant execute on function api.list_admin_review_queue(boolean, integer) to service_role;

comment on function api.list_admin_review_queue(boolean, integer) is
  'Service-role-only Admin Command Center read bridge to public.hv_admin_review_queue. Does not expose the queue to browser roles.';

create or replace function api.append_admin_signal_audit(
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_actor_user_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  execute $sql$
    insert into public.audit_events (
      entity_type,
      entity_id,
      action,
      actor,
      actor_user_id,
      metadata
    ) values (
      $1,
      $2::uuid,
      $3,
      $4,
      $4::uuid,
      coalesce($5, '{}'::jsonb)
    )
  $sql$
  using p_entity_type, p_entity_id, p_action, p_actor_user_id, p_metadata;

  return true;
end
$function$;

revoke all on function api.append_admin_signal_audit(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function api.append_admin_signal_audit(text, text, text, text, jsonb) to service_role;

comment on function api.append_admin_signal_audit(text, text, text, text, jsonb) is
  'Service-role-only Admin Command Center audit append bridge. Browser roles cannot execute it.';

notify pgrst, 'reload schema';
