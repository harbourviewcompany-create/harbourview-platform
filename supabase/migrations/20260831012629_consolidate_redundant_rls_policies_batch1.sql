-- Reconstructed from production. Verbatim statements for version 20260831012629.
begin;

-- ============ Pure duplicates: byte-identical qual/with_check/cmd/roles ============
-- countries: 3 SELECT policies, all `using (true)` for anon/authenticated in some combo.
-- countries_public_read alone already covers {anon,authenticated}.
drop policy if exists countries_anon_select on public.countries;
drop policy if exists countries_authenticated_select on public.countries;

-- clinical_evidence_reviews: two ALL policies, identical qual/with_check (rename artifact).
drop policy if exists clinical_reviews_review_access on public.clinical_evidence_reviews;

-- clinical_reviewer_credentials: two ALL policies, identical qual/with_check (rename artifact).
drop policy if exists clinical_reviewer_credentials_admin_write on public.clinical_reviewer_credentials;

-- clinical_evidence_publication_versions: two SELECT policies, identical qual.
drop policy if exists clinical_publication_versions_review_read on public.clinical_evidence_publication_versions;

-- clinical_evidence_source_snapshots: two SELECT policies, identical qual.
drop policy if exists clinical_source_snapshots_review_read on public.clinical_evidence_source_snapshots;

-- ============ Safe OR-merges: same command scope, different-but-provable-equivalent logic ============

-- education_modules
drop policy if exists education_modules_admin_select on public.education_modules;
drop policy if exists education_modules_public_select on public.education_modules;
create policy education_modules_select on public.education_modules
  for select to anon, authenticated
  using (
    (publication_state = 'published' and (requires_clinical_signoff = false or reviewed_by is not null))
    or exists (
      select 1 from user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = any (array['admin','operator','analyst'])
    )
  );

-- listings
drop policy if exists admin_operator_select on public.listings;
drop policy if exists listings_anon_select_public on public.listings;
drop policy if exists listings_authenticated_select_public on public.listings;
create policy listings_select on public.listings
  for select to anon, authenticated
  using (
    (public_visibility = true and status = 'approved'::listing_status)
    or exists (
      select 1 from user_roles
      where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])
    )
  );

-- marketplace_candidates
drop policy if exists admin_operator_select on public.marketplace_candidates;
drop policy if exists "Authenticated sellers can view own submissions" on public.marketplace_candidates;
create policy marketplace_candidates_select on public.marketplace_candidates
  for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or exists (
      select 1 from user_roles
      where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])
    )
  );

-- marketplace_item_images
drop policy if exists "Admins can read all marketplace images" on public.marketplace_item_images;
drop policy if exists "Public can read approved public marketplace images" on public.marketplace_item_images;
create policy marketplace_item_images_select on public.marketplace_item_images
  for select to anon, authenticated
  using (
    is_harbourview_admin()
    or (
      review_status = 'APPROVED_PUBLIC'
      and rights_status::text <> 'UNKNOWN'
      and image_class::text <> 'ADMIN_PRIVATE_EVIDENCE'
      and item_id is not null
      and public_url is not null
    )
  );

-- talent_candidates (both source policies were FOR ALL, same role -> clean merge)
drop policy if exists talent_candidates_admin_manage on public.talent_candidates;
drop policy if exists talent_candidates_workspace_manage on public.talent_candidates;
create policy talent_candidates_manage on public.talent_candidates
  for all to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or job_id in (
      select tj.id from talent_jobs tj
      where tj.workspace_id in (
        select workspace_members.workspace_id from workspace_members
        where workspace_members.user_id = (select auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or job_id in (
      select tj.id from talent_jobs tj
      where tj.workspace_id in (
        select workspace_members.workspace_id from workspace_members
        where workspace_members.user_id = (select auth.uid())
      )
    )
  );
-- talent_candidates_public_apply (INSERT, anon+authenticated) left untouched.

-- talent_jobs (same shape as talent_candidates)
drop policy if exists talent_jobs_admin_manage on public.talent_jobs;
drop policy if exists talent_jobs_workspace_manage on public.talent_jobs;
create policy talent_jobs_manage on public.talent_jobs
  for all to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (
      select workspace_members.workspace_id from workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (
      select workspace_members.workspace_id from workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  );
-- talent_jobs_public_read_open (SELECT, anon+authenticated, status='open') left untouched.

-- workspaces
drop policy if exists admin_operator_select on public.workspaces;
drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to public
  using (
    hv_is_org_member(id)
    or hv_is_platform_staff()
    or exists (
      select 1 from user_roles
      where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])
    )
  );

commit;
