-- Replay-only fail-closed reconstruction of policy identities that existed in production
-- before 20260719083306. The next migration immediately replaces both USING clauses
-- with the exact production-recorded predicates. This file exists only in the temporary
-- production-faithful replay workspace and is never a production migration.

do $replay_policy_identity$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'education_modules'
      and policyname = 'education_modules_public_select'
  ) then
    create policy "education_modules_public_select"
      on public.education_modules
      for select
      using (false);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'education_module_sections'
      and policyname = 'public read sections of published modules'
  ) then
    create policy "public read sections of published modules"
      on public.education_module_sections
      for select
      using (false);
  end if;
end
$replay_policy_identity$;
