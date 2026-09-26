-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925205338
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

do $$
begin
 if exists(select 1 from cron.job where jobname='harbourview-full-depth-adjudication-promotion') then
   perform cron.unschedule('harbourview-full-depth-adjudication-promotion');
 end if;
 perform cron.schedule('harbourview-full-depth-adjudication-promotion','*/2 * * * *',$cmd$select public.promote_accepted_full_depth_candidates(10000);$cmd$);
end $$;
