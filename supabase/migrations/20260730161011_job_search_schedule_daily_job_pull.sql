SELECT cron.unschedule('daily-job-pull')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-job-pull'
);

SELECT cron.schedule(
  'daily-job-pull',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/daily-job-pull',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer '
        || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_pull_auth_key')
    ),
    body := jsonb_build_object('source', 'pg_cron', 'triggered_at', now()::text)
  ) AS request_id;
  $$
);