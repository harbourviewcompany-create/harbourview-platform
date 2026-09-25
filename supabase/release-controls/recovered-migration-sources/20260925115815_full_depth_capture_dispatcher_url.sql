-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260925115815
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

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
