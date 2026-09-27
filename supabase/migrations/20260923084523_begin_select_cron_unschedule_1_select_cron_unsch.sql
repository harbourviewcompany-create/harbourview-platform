-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260923084523
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

begin;
select cron.unschedule(1);
select cron.unschedule(2);
select cron.unschedule(3);
select cron.unschedule(4);
select cron.schedule(
  'source-engine-evidence-worker',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/source-engine-fetch?limit=3&pass=continuous',
    headers := jsonb_build_object(
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'hv_edge_anon_key' limit 1),
      'Content-Type','application/json',
      'x-harbourview-cron-caller','pg_cron_source_engine_fetch'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
commit;
