-- create_hv_quarantine_repeated_source_failures: auto-blocks sources with repeated fetch errors
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

create or replace function public.hv_quarantine_repeated_source_failures(
  min_failures integer default 3,
  lookback     interval default '7 days'
)
returns table(source_id uuid, failure_count bigint)
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  return query
  with repeated_failures as (
    select ss.source_id, count(*)::bigint as failure_count
    from public.source_snapshots ss
    join public.source_registry sr on sr.id = ss.source_id
    where ss.source_id is not null
      and ss.fetch_status = 'error'
      and ss.created_at >= now() - lookback
      and sr.relevance_status = 'active'
    group by ss.source_id
    having count(*) >= min_failures
  ), updated as (
    update public.source_registry sr
    set relevance_status = 'blocked',
        updated_at       = now(),
        notes            = concat_ws(E'\n', nullif(sr.notes, ''),
          'Auto-quarantined after repeated source pull failures. Review URL or adapter before reactivation.')
    from repeated_failures rf
    where sr.id = rf.source_id
    returning sr.id, rf.failure_count
  )
  select updated.id, updated.failure_count from updated;
end;
$$;
