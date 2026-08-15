-- Operator-only pipeline functions were left with Postgres' default PUBLIC EXECUTE.
--
-- All three are SECURITY DEFINER, so PUBLIC EXECUTE meant an unauthenticated
-- PostgREST caller could:
--   hv_alert_tick()               -- read vault.decrypted_secrets and send email via Resend
--   hv_pipeline_alerts()          -- enumerate internal pipeline state
--   hv_route_signals_to_digest()  -- insert up to 300 rows into editorial_items
--
-- No application code calls any of them (verified by repo grep); their only
-- callers are pg_cron jobs, which run as the job owner and are unaffected by
-- these grants. Reversible: re-granting restores the prior state exactly.

revoke execute on function public.hv_alert_tick()               from public, anon;
revoke execute on function public.hv_pipeline_alerts()          from public, anon;
revoke execute on function public.hv_route_signals_to_digest(integer) from public, anon;

grant execute on function public.hv_pipeline_alerts()           to service_role;
grant execute on function public.hv_alert_tick()                to service_role;
grant execute on function public.hv_route_signals_to_digest(integer) to service_role;