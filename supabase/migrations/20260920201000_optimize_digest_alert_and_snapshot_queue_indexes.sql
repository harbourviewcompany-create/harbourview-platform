-- Optimize digest routing, alert delivery reconciliation, and snapshot extraction queues.
create index if not exists idx_editorial_items_source_url
  on public.editorial_items (source_url)
  where source_url is not null;

create index if not exists idx_hv_alert_log_delivery_request
  on public.hv_alert_log (delivery_request_id)
  where delivery_status = 'queued' and delivery_request_id is not null;

create index if not exists idx_source_snapshots_signal_extract_queue
  on public.source_snapshots (captured_at asc)
  where processing_status = 'pending'
    and signal_candidates is null
    and fetch_status = 'success'
    and captured_text is not null;
