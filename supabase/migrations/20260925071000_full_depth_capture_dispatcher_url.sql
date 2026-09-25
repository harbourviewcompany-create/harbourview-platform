-- Reconcile the production pg_cron dispatcher URL with the deployed Edge Function.
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