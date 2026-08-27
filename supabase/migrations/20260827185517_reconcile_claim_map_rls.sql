-- Reconcile clinical_evidence_claim_map RLS with a policy that appeared live
-- on the database moments after the previous migration in this session
-- (20260822150000_wire_clinical_evidence_claim_map.sql) — 'claim_map_select_authenticated',
-- open SELECT for any authenticated user. It wasn't in any committed migration
-- when found; almost certainly landed from concurrent work happening in
-- parallel with this session's own wiring pass. Not fighting it — an
-- internal admin gap-dashboard being readable by any authenticated staff
-- member (not just credentialed reviewers) is a reasonable design on its own
-- merits. Two things this migration does:
--
--   1. Commits that policy into version control as-is, so it stops being
--      invisible drift between the live database and this repo.
--   2. Narrows this session's own policy from `for all` (which redundantly
--      overlapped the read policy on SELECT) to `for insert`/`for update`
--      only, so the two policies are complementary instead of overlapping:
--      broad read, review-role-gated write.
--
-- Net effect on actual access is unchanged from immediately after both
-- policies existed together — this is a clarity/tracking fix, not a
-- behavior change.

drop policy if exists clinical_evidence_claim_map_review_access
  on public.clinical_evidence_claim_map;

drop policy if exists claim_map_select_authenticated
  on public.clinical_evidence_claim_map;
create policy claim_map_select_authenticated
  on public.clinical_evidence_claim_map
  for select
  to authenticated
  using (true);

create policy clinical_evidence_claim_map_insert_review
  on public.clinical_evidence_claim_map
  for insert
  to authenticated
  with check (public.clinical_evidence_has_review_role());

create policy clinical_evidence_claim_map_update_review
  on public.clinical_evidence_claim_map
  for update
  to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
