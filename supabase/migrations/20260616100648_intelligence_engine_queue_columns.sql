-- Restore the production-owned intelligence-engine queue contract at its
-- canonical migration version. The repository previously kept only a ledger
-- stub, which left zero-state replay without the atomic crawl-target claim RPC.

alter table public.source_registry
  add column if not exists crawl_allowed boolean not null default true,
  add column if not exists next_crawl_at timestamptz default now(),
  add column if not exists locked_until timestamptz,
  add column if not exists locked_by text,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_error_log text,
  add column if not exists network_status text not null default 'online';

create index if not exists idx_source_registry_crawl_queue
  on public.source_registry (next_crawl_at, locked_until)
  where is_active = true and crawl_allowed = true;

create or replace function public.acquire_crawl_targets(
  p_limit integer default 25,
  p_worker_id text default 'default'
)
returns setof public.source_registry
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_now timestamptz := now();
  v_lease_end timestamptz := now() + interval '5 minutes';
  v_ids uuid[];
begin
  select array_agg(id)
  into v_ids
  from (
    select id
    from public.source_registry
    where is_active = true
      and crawl_allowed = true
      and (next_crawl_at is null or next_crawl_at <= v_now)
      and (locked_until is null or locked_until < v_now)
    order by next_crawl_at asc nulls first
    limit p_limit
    for update skip locked
  ) as targets;

  if v_ids is null or array_length(v_ids, 1) = 0 then
    return;
  end if;

  update public.source_registry
  set locked_by = p_worker_id,
      locked_until = v_lease_end
  where id = any(v_ids);

  return query
    select *
    from public.source_registry
    where id = any(v_ids);
end;
$function$;

revoke all on function public.acquire_crawl_targets(integer, text)
  from public, anon, authenticated;
grant execute on function public.acquire_crawl_targets(integer, text)
  to service_role;
