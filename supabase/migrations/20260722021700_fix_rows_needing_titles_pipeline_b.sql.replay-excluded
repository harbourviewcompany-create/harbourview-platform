-- api.rows_needing_titles still joined against public.signal_classifications
-- (Pipeline A's staging table, just deprecated in
-- 20260722021600_deprecate_unused_stage3_pipeline_a.sql) to find rows needing an
-- editorial title. Pipeline B (the canonical, actually-live pipeline) writes
-- quality_label directly onto public.signals and never touches
-- signal_classifications, so this RPC could only ever reach rows classified by
-- the deprecated path. Verified live before this fix: of the 919 promoted rows
-- missing editorial_title, only 9 were reachable via the old join.
--
-- Fix: match on s.quality_label='signal' directly, dropping the dependency on
-- signal_classifications entirely. Same authorization check preserved unchanged
-- (service_role or admin/operator/analyst).
--
-- Rollback: restore the join on public.signal_classifications (see git history of
-- 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql for the prior
-- body) -- not recommended, restores the near-total miss rate.

create or replace function api.rows_needing_titles(p_limit integer default 25)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.quality_label = 'signal'
    and s.editorial_title is null
    and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;
