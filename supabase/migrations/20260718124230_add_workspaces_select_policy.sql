-- ADR follow-up to #21: workspaces had RLS enabled with zero SELECT policies —
-- meaning even an org's own owner/members could never read their own workspace
-- row client-side (only service_role could). Uses the same hv_is_org_member /
-- hv_is_platform_staff helpers already used for hv_passports, for consistency.

create policy workspaces_member_select on public.workspaces
  for select
  using (hv_is_org_member(id) or hv_is_platform_staff());
