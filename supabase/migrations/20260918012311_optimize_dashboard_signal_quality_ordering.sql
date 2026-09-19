create index if not exists idx_signals_dashboard_quality_date
  on public.signals (quality_confidence desc nulls last, date desc nulls last)
  where reviewed = true
    and (action is null or action <> 'rejected')
    and quality_label <> all (array['spam','boilerplate','nav','duplicate']);