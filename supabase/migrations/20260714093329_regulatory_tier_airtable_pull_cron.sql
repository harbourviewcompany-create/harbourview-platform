-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714093329.
--
-- Rewriting this file cannot affect production: 20260714093329 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Cron wrapper: invoke the Airtable pull poller. SECURITY DEFINER so pg_cron can read the vault key.
create or replace function public.run_airtable_tier_pull()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_key  text;
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'hv_airtable_sync_key';
  perform net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-airtable-tier-poller',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'x-hv-sync-key', v_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
end;
$function$;

comment on function public.run_airtable_tier_pull() is
  'pg_cron entrypoint: pulls Airtable regulatory-tier edits into Supabase via hv-airtable-tier-poller.';

-- Every 2 minutes. Idempotent: unschedule any prior job of the same name first.
select cron.unschedule('airtable-tier-pull')
  where exists (select 1 from cron.job where jobname = 'airtable-tier-pull');
select cron.schedule('airtable-tier-pull', '*/2 * * * *', 'select public.run_airtable_tier_pull();');
