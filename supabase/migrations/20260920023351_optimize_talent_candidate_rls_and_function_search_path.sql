begin;

drop policy if exists talent_candidates_public_apply on public.talent_candidates;
drop policy if exists talent_candidates_manage on public.talent_candidates;
drop policy if exists talent_candidates_manage_select on public.talent_candidates;
drop policy if exists talent_candidates_manage_update on public.talent_candidates;
drop policy if exists talent_candidates_manage_delete on public.talent_candidates;
drop policy if exists talent_candidates_insert on public.talent_candidates;

create policy talent_candidates_manage_select
  on public.talent_candidates
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  );

create policy talent_candidates_manage_update
  on public.talent_candidates
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  );

create policy talent_candidates_manage_delete
  on public.talent_candidates
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  );

create policy talent_candidates_insert
  on public.talent_candidates
  for insert
  to public
  with check (
    (
      stage = 'sourced'
      and job_id in (
        select tj.id from public.talent_jobs tj
        where tj.status = 'open'
      )
    )
    or (
      (select auth.uid()) is not null
      and (
        exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid()) and ur.role = 'admin'
        )
        or job_id in (
          select tj.id from public.talent_jobs tj
          where tj.workspace_id in (
            select wm.workspace_id from public.workspace_members wm
            where wm.user_id = (select auth.uid())
          )
        )
      )
    )
  );

alter function public._backfill_strip_site_suffix(text, text)
  set search_path = pg_catalog, public;
alter function public._digest_manual_why(text, text, text, text, text)
  set search_path = pg_catalog, public;
alter function public._digest_smart_truncate(text, integer)
  set search_path = pg_catalog, public;

commit;