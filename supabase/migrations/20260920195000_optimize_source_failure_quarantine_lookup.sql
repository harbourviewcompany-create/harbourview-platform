create index if not exists idx_source_snapshots_error_source_created
on public.source_snapshots (source_id, created_at desc)
where fetch_status = 'error' and source_id is not null;
