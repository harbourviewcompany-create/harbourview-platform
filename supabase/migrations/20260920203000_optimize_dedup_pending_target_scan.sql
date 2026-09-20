create index if not exists idx_signals_dedup_pending_created
on public.signals (created_at desc)
where embedding_1024 is not null and cluster_rep_id is null;
