-- Schedule the quality pipeline (idempotent: cron.schedule updates an existing job by name).
select cron.schedule('hv-quality-pipeline', '*/2 * * * *', $$select public.hv_pipeline_tick()$$);
select cron.schedule('hv-quality-promote', '*/10 * * * *', $$select public.hv_quality_promote_tick()$$);