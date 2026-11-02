-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925115815
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

select cron.unschedule('harbourview-full-depth-authority-capture');

select cron.schedule(
  'harbourview-full-depth-authority-capture',
  '*/2 * * * *',
  $cron$
  select net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/full-depth-authority-capture?limit=25',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-harbourview-dispatch-token', public.get_full_depth_capture_dispatch_token()
    ),
    body := '{}'::jsonb
  );
  $cron$
);
