-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924140209
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.acquire_full_depth_crawl_targets(
  p_limit integer default 8,
  p_worker_id text default 'full-depth'
)
returns setof public.source_registry
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := now();
  v_lease_end timestamptz := now() + interval '2 minutes';
  v_ids uuid[];
begin
  if p_limit is null or p_limit < 1 or p_limit > 8 then
    raise exception 'p_limit must be between 1 and 8';
  end if;

  select array_agg(id) into v_ids
  from (
    select sr.id
    from public.source_registry sr
    where sr.is_active
      and sr.crawl_allowed
      and sr.source_url is not null
      and sr.source_url ~ '^https://'
      and (sr.next_crawl_at is null or sr.next_crawl_at <= v_now)
      and (sr.locked_until is null or sr.locked_until < v_now)
      and exists (
        select 1
        from public.jurisdiction_data_depth_capture_jobs j
        where j.status = 'queued'
          and (
            j.jurisdiction_key = sr.jurisdiction_code
            or j.jurisdiction_key = sr.iso
          )
      )
    order by
      case
        when sr.regulator_class in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export') then 0
        when sr.source_type in ('government','regulator','government_legal') then 1
        else 2
      end,
      sr.tier asc nulls last,
      sr.next_crawl_at asc nulls first,
      sr.id
    limit p_limit
    for update skip locked
  ) q;

  if v_ids is null or array_length(v_ids,1) is null then
    return;
  end if;

  update public.source_registry
  set locked_by = p_worker_id,
      locked_until = v_lease_end,
      updated_at = v_now
  where id = any(v_ids);

  return query
    select *
    from public.source_registry
    where id = any(v_ids);
end;
$$;

revoke all on function public.acquire_full_depth_crawl_targets(integer,text) from public;
grant execute on function public.acquire_full_depth_crawl_targets(integer,text) to service_role;
