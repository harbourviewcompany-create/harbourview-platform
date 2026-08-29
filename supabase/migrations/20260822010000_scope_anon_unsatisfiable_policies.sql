-- Performance fix, part 2 of the multiple_permissive_policies pass started
-- in 20260822000000_service_role_policy_scoping.sql. Narrows 131 policies
-- from `TO public` to `TO authenticated` where the policy's USING/WITH
-- CHECK is built entirely from auth.uid()-based conditions (direct
-- comparisons, EXISTS subqueries against user_roles/workspace_members, or
-- calls to helper functions -- is_genetics_admin_or_reviewer(),
-- hv_is_platform_staff(), hv_is_org_member(), hv_has_transaction_role(),
-- clinical_evidence_has_review_role(), is_harbourview_admin(), is_hv_staff()
-- -- each independently confirmed by reading pg_proc.prosrc to internally
-- require user_id = auth.uid(), which is always null/false for anon).
--
-- anon's auth.uid() is always null, so every one of these already denies
-- anon today; TO authenticated changes nothing about who gets access, it
-- just lets Postgres skip evaluating the policy for anon entirely instead
-- of evaluating it and getting false every time.
--
-- Explicitly NOT included: talent_opportunities_select_published, whose
-- condition is `status = 'published' OR created_by = auth.uid()` -- the
-- first branch is genuinely anon-satisfiable (published listings are meant
-- to be publicly visible), so it must stay `TO public`. Checked every
-- other matching policy by hand for the same shape before running this;
-- this was the only one found.
--
-- Applied and verified live before writing this file: exactly 1 policy
-- matching the original pattern remains -- the excluded one above.

do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and roles = '{public}'
      and (qual ilike '%auth.uid()%' or with_check ilike '%auth.uid()%')
      and not (tablename = 'talent_opportunities' and policyname = 'talent_opportunities_select_published')
  loop
    execute format('alter policy %I on %I.%I to authenticated', r.policyname, r.schemaname, r.tablename);
    n := n + 1;
  end loop;
  raise notice 'altered % policies', n;
end $$;
