-- Supabase production uses pg_cron for source, alert, digest and housekeeping
-- schedules. Restore that extension before the first scheduler migration so a
-- zero-state repository replay matches the managed production environment.

create extension if not exists pg_cron;

revoke all on schema cron from public, anon, authenticated;
grant usage on schema cron to service_role;
