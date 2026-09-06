-- Reconstructed from production. Verbatim statements for version 20260831115343.
begin;

-- hv_claims: org_member had select+insert+update
drop policy if exists hv_claims_staff_all on public.hv_claims;
drop policy if exists hv_claims_org_member_insert on public.hv_claims;
drop policy if exists hv_claims_org_member_select on public.hv_claims;
drop policy if exists hv_claims_org_member_update on public.hv_claims;
create policy hv_claims_select on public.hv_claims for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_claims_insert on public.hv_claims for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_claims_update on public.hv_claims for update to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id))
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_claims_delete on public.hv_claims for delete to public
  using (hv_is_platform_staff());

-- hv_facilities: same shape as hv_claims
drop policy if exists hv_facilities_staff_all on public.hv_facilities;
drop policy if exists hv_facilities_org_member_insert on public.hv_facilities;
drop policy if exists hv_facilities_org_member_select on public.hv_facilities;
drop policy if exists hv_facilities_org_member_update on public.hv_facilities;
create policy hv_facilities_select on public.hv_facilities for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_facilities_insert on public.hv_facilities for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_facilities_update on public.hv_facilities for update to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id))
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_facilities_delete on public.hv_facilities for delete to public
  using (hv_is_platform_staff());

-- hv_licences: same shape
drop policy if exists hv_licences_staff_all on public.hv_licences;
drop policy if exists hv_licences_org_member_insert on public.hv_licences;
drop policy if exists hv_licences_org_member_select on public.hv_licences;
drop policy if exists hv_licences_org_member_update on public.hv_licences;
create policy hv_licences_select on public.hv_licences for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_licences_insert on public.hv_licences for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_licences_update on public.hv_licences for update to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id))
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_licences_delete on public.hv_licences for delete to public
  using (hv_is_platform_staff());

-- hv_evidence_documents: org_member had select+insert only (no update policy pre-existing)
drop policy if exists hv_evidence_staff_all on public.hv_evidence_documents;
drop policy if exists hv_evidence_org_member_insert on public.hv_evidence_documents;
drop policy if exists hv_evidence_org_member_select on public.hv_evidence_documents;
create policy hv_evidence_select on public.hv_evidence_documents for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_evidence_insert on public.hv_evidence_documents for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_evidence_update on public.hv_evidence_documents for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_evidence_delete on public.hv_evidence_documents for delete to public
  using (hv_is_platform_staff());

-- hv_claim_reviews: org access was select-only, via join to hv_claims
drop policy if exists hv_claim_reviews_staff_all on public.hv_claim_reviews;
drop policy if exists hv_claim_reviews_org_read_verdict on public.hv_claim_reviews;
create policy hv_claim_reviews_select on public.hv_claim_reviews for select to public
  using (
    hv_is_platform_staff()
    or claim_id in (select hv_claims.id from hv_claims where hv_is_org_member(hv_claims.org_id))
  );
create policy hv_claim_reviews_insert on public.hv_claim_reviews for insert to public
  with check (hv_is_platform_staff());
create policy hv_claim_reviews_update on public.hv_claim_reviews for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_claim_reviews_delete on public.hv_claim_reviews for delete to public
  using (hv_is_platform_staff());

-- hv_passport_scores: org access was select-only, via join to hv_passports
drop policy if exists hv_passport_scores_staff_all on public.hv_passport_scores;
drop policy if exists hv_passport_scores_org_member_select on public.hv_passport_scores;
create policy hv_passport_scores_select on public.hv_passport_scores for select to public
  using (
    hv_is_platform_staff()
    or passport_id in (select hv_passports.id from hv_passports where hv_is_org_member(hv_passports.org_id))
  );
create policy hv_passport_scores_insert on public.hv_passport_scores for insert to public
  with check (hv_is_platform_staff());
create policy hv_passport_scores_update on public.hv_passport_scores for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_passport_scores_delete on public.hv_passport_scores for delete to public
  using (hv_is_platform_staff());

-- hv_passports: org access was select-only, direct org_id
drop policy if exists hv_passports_staff_all on public.hv_passports;
drop policy if exists hv_passports_org_member_select on public.hv_passports;
create policy hv_passports_select on public.hv_passports for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_passports_insert on public.hv_passports for insert to public
  with check (hv_is_platform_staff());
create policy hv_passports_update on public.hv_passports for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_passports_delete on public.hv_passports for delete to public
  using (hv_is_platform_staff());

-- hv_org_snapshots: role scope is {authenticated}, not {public} -- preserved as-is.
-- hv_org_snapshots_service_all (service_role) is untouched, separate policy.
drop policy if exists hv_org_snapshots_staff_all on public.hv_org_snapshots;
drop policy if exists hv_org_snapshots_org_member_select on public.hv_org_snapshots;
create policy hv_org_snapshots_select on public.hv_org_snapshots for select to authenticated
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_org_snapshots_insert on public.hv_org_snapshots for insert to authenticated
  with check (hv_is_platform_staff());
create policy hv_org_snapshots_update on public.hv_org_snapshots for update to authenticated
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_org_snapshots_delete on public.hv_org_snapshots for delete to authenticated
  using (hv_is_platform_staff());

commit;
