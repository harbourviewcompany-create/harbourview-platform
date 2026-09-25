-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260925130901
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.


update public.jurisdiction_data_depth_capture_jobs
set status='queued', last_error=null, updated_at=now()
where status='needs_review'
  and (
    last_error ilike 'openai_429:%'
    or last_error ilike '%insufficient_quota%'
    or last_error ilike '%credit_balance_exhausted%'
  );

select cron.unschedule('source_discovery_engine_4x_daily');
select cron.schedule(
  'source_discovery_engine_10min',
  '*/10 * * * *',
  $job$select net.http_post(
    url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/source-discovery-engine',
    headers:=jsonb_build_object(
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key'),
      'Content-Type','application/json'
    ),
    body:=jsonb_build_object('batchSize', 15)
  );$job$
);

