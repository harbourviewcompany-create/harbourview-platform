-- Harbourview Talent Job Board production integration repair
-- Scope: Talent tables/functions only.
-- Repairs Data API grants, closes policy gaps exposed by those grants,
-- and makes application counting atomic for both guest and authenticated applies.

-- ---------------------------------------------------------------------------
-- 1. Least-privilege Data API grants
-- ---------------------------------------------------------------------------
revoke all privileges on table public.talent_opportunities from anon, authenticated;
revoke all privileges on table public.talent_applications from anon, authenticated;
revoke all privileges on table public.talent_saved_jobs from anon, authenticated;
revoke all privileges on table public.talent_alerts from anon, authenticated;

grant select on table public.talent_opportunities to anon, authenticated;
grant insert, update on table public.talent_opportunities to authenticated;

grant insert on table public.talent_applications to anon;
grant select, insert on table public.talent_applications to authenticated;

grant select, insert, update, delete on table public.talent_saved_jobs to authenticated;
grant select, insert on table public.talent_alerts to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Close RLS gaps before exposing the new grants
-- ---------------------------------------------------------------------------
-- Owners may create drafts only. Publication remains a service/admin action.
drop policy if exists "talent_opportunities_insert_own" on public.talent_opportunities;
create policy "talent_opportunities_insert_own"
  on public.talent_opportunities
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'draft'
  );

-- Guest applications must remain guest-owned (user_id null) and every client
-- application starts in submitted state. Authenticated users may only insert
-- their own application rows.
drop policy if exists "talent_applications_insert_own" on public.talent_applications;
create policy "talent_applications_insert_own"
  on public.talent_applications
  for insert
  to anon, authenticated
  with check (
    status = 'submitted'
    and (
      ((select auth.uid()) is null and user_id is null)
      or
      ((select auth.uid()) is not null and user_id = (select auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. SECURITY DEFINER RPC execution boundary
-- ---------------------------------------------------------------------------
-- New functions receive EXECUTE for PUBLIC by default in PostgreSQL unless
-- explicitly revoked. Restore the roles intended by the original migration.
revoke execute on function public.increment_talent_view_count(uuid)
  from public, anon, authenticated;
revoke execute on function public.increment_talent_application_count(uuid)
  from public, anon, authenticated;

grant execute on function public.increment_talent_view_count(uuid)
  to anon, authenticated;
grant execute on function public.increment_talent_application_count(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Count successful applications atomically, including guest applications
-- ---------------------------------------------------------------------------
-- The application-count RPC is intentionally not callable by anon. A trigger
-- increments the count after a successful application insert so guest applies
-- are counted without exposing a client-callable anonymous counter mutation.
create or replace function public.talent_application_count_after_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.talent_opportunities
  set application_count = application_count + 1
  where id = new.opportunity_id;

  return new;
end;
$$;

revoke execute on function public.talent_application_count_after_insert()
  from public, anon, authenticated;

drop trigger if exists talent_applications_increment_count
  on public.talent_applications;
create trigger talent_applications_increment_count
  after insert on public.talent_applications
  for each row
  execute function public.talent_application_count_after_insert();
