create index if not exists idx_signals_public_feed_date
on public.signals (date desc)
where reviewed = true
  and quality_label <> all (array['spam','boilerplate','nav','duplicate'])
  and (content_type is null or content_type <> all (array['story','research']));