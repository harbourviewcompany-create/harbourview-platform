-- Align the public dashboard signal feed with its reviewed/content-type filters
-- and date-desc ordering so Postgres can stop after the first 300 rows.
create index if not exists idx_signals_public_feed_date
  on public.signals (date desc)
  where reviewed = true
    and quality_label <> all (array['spam','boilerplate','nav','duplicate'])
    and (content_type is null or content_type <> all (array['story','research']));
create index if not exists idx_signals_public_feed_date
on public.signals (date desc)
where reviewed = true
  and quality_label <> all (array['spam','boilerplate','nav','duplicate'])
  and (content_type is null or content_type <> all (array['story','research']));