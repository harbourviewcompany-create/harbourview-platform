-- Follow-up to 20260722021700_fix_rows_needing_titles_pipeline_b.sql (CodeRabbit
-- review on PR #1126). That migration correctly fixed api.rows_needing_titles to
-- match Pipeline B's `signals.quality_label` instead of the deprecated
-- signal_classifications join, but its WHERE clause has no `reviewed` filter --
-- it returns ANY quality_label='signal' row missing a title, including the
-- 3,519-row backlog of classified-but-not-yet-promoted rows that
-- docs/control/STAGE3_PROMOTION.md explicitly documents as outside the approved
-- title-backfill scope (only the ~919/904 already-*promoted* rows were approved).
--
-- Without this filter, any future caller of this RPC (including hv-classify's own
-- `mode=titles`, which spends paid LLM budget per row) has no structural barrier
-- stopping it from reaching into that unapproved backlog and generating titles for
-- rows that aren't even live on the public feed yet -- exactly the scope creep this
-- session was careful to avoid manually (by capping call count), but a manual cap
-- is not an enforced boundary. This migration makes it one.
--
-- Fix: add `s.reviewed = true` -- only rows actually live on the public feed are
-- eligible for title generation. Same authorization check, same signature/return
-- shape, same ordering/limit behavior -- only the WHERE clause changes.
--
-- Rollback: drop the `and s.reviewed = true` line (see git history of
-- 20260722021700_fix_rows_needing_titles_pipeline_b.sql) -- not recommended,
-- reopens the unapproved-backlog exposure.

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
    and s.reviewed = true
    and s.editorial_title is null
    and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;
