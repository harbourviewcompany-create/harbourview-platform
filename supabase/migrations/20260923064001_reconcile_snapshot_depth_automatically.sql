create or replace function public.reconcile_source_snapshot_depth()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare jk text;
begin
  if new.fetch_status <> 'success' then return new; end if;
  select coalesce(sr.jurisdiction_code,sr.iso) into jk
  from public.source_registry sr where sr.id=new.source_id;
  if jk is null then return new; end if;
  update public.jurisdiction_dimension_coverage
  set status='verified_populated',applicability='applicable',
      evidence_basis='Successful source snapshot exists for an active jurisdiction-scoped source registry entry.',
      last_evaluated_at=now()
  where jurisdiction_key=jk and dimension_key='source_snapshots';
  update public.jurisdiction_data_depth_tasks
  set status='verified',updated_at=now()
  where jurisdiction_key=jk and dimension_key='source_snapshots'
    and status in ('open','in_progress');
  return new;
end;
$$;

drop trigger if exists trg_reconcile_source_snapshot_depth on public.source_snapshots;
create trigger trg_reconcile_source_snapshot_depth
after insert on public.source_snapshots
for each row execute function public.reconcile_source_snapshot_depth();

update public.jurisdiction_dimension_coverage c
set status='verified_populated',applicability='applicable',
    evidence_basis='Successful source snapshot exists for an active jurisdiction-scoped source registry entry.',
    last_evaluated_at=now()
where c.dimension_key='source_snapshots' and c.status='open'
and exists (
  select 1 from public.source_registry sr
  join public.source_snapshots ss on ss.source_id=sr.id
  where sr.is_active and ss.fetch_status='success'
    and (sr.jurisdiction_code=c.jurisdiction_key or (sr.jurisdiction_code is null and sr.iso=c.jurisdiction_key))
);
