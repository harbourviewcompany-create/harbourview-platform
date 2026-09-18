-- Align the dashboard's reviewed-signal ranking query with its WHERE and ORDER BY.
-- The partial index avoids scanning and sorting thousands of reviewed rows when
-- the dashboard only needs the top 200 quality-ranked signals.
create index if not exists idx_signals_dashboard_quality_date
  on public.signals (quality_confidence desc nulls last, date desc nulls last)
  where reviewed = true
    and (action is null or action <> 'rejected')
    and quality_label <> all (array['spam','boilerplate','nav','duplicate']);
