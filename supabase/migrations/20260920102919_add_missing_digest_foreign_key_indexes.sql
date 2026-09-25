begin;

create index if not exists idx_digest_event_lineage_latest_signal
  on public.digest_event_lineage (latest_signal_id);

create index if not exists idx_digest_presentation_history_signal
  on public.digest_presentation_history (signal_id);

commit;