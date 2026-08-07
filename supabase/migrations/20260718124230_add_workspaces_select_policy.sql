-- ADR follow-up to #21: workspaces had RLS enabled with zero SELECT policies —
-- meaning even an org's own owner/members could never read their own workspace
-- row client-side (only service_role could). Uses the same hv_is_org_member /
-- hv_is_platform_staff helpers already used for hv_passports, for consistency.

-- Replay guard. In production this policy did not exist when this migration
-- ran, so the CREATE was unconditional. Zero-state replay differs:
-- 20260611103000_workspace_foundation_replay.sql, a repository-only
-- reconciliation migration with no ledger entry, already creates a policy of
-- the same name on the same table five weeks earlier in replay order, so the
-- unguarded CREATE fails with:
--   policy "workspaces_member_select" for table "workspaces"
--   already exists (SQLSTATE 42710)
-- The definition below still wins, and it is identical to the earlier one.
drop policy if exists workspaces_member_select on public.workspaces;

create policy workspaces_member_select on public.workspaces
  for select
  using (hv_is_org_member(id) or hv_is_platform_staff());
