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
