-- Operator functions are cron/service-plane only. `authenticated` still allowed
-- any logged-in user to trigger alert email sends or bulk-insert editorial_items.
-- Narrow to service_role; pg_cron is unaffected (jobs run as their owner).
--
-- api.add_signal_to_eval_set deliberately keeps `authenticated` — that one is the
-- human labelling affordance and is meant to be called from the signed-in UI.

revoke execute on function public.hv_alert_tick()                     from authenticated;
revoke execute on function public.hv_pipeline_alerts()                from authenticated;
revoke execute on function public.hv_route_signals_to_digest(integer) from authenticated;