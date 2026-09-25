select cron.schedule(
  'harbourview-full-depth-source-capture',
  '*/2 * * * *',
  $job$
    select net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/source-snapshot-capture?limit=8',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-harbourview-operator-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='harbourview_source_engine_cron_secret' limit 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 15000
    );
  $job$
);
