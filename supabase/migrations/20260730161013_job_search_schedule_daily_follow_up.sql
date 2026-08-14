SELECT cron.unschedule('daily-follow-up-scheduler')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-follow-up-scheduler'
);

SELECT cron.schedule(
  'daily-follow-up-scheduler',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/follow-up-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_pull_auth_key')
    ),
    body := jsonb_build_object('source', 'cron', 'triggered_at', now())
  ) AS request_id;
  $$
);