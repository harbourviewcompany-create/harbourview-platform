-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924140303
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

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
