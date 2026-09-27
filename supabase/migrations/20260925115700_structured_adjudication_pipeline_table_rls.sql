-- Harden structured adjudication staging tables with RLS.
-- These tables are pipeline-internal and are intentionally service-role only.

alter table public.jurisdiction_data_depth_extraction_candidates enable row level security;
alter table public.jurisdiction_data_depth_adjudications enable row level security;

drop policy if exists "service_role_full_access_extraction_candidates"
  on public.jurisdiction_data_depth_extraction_candidates;
drop policy if exists "service_role_full_access_adjudications"
  on public.jurisdiction_data_depth_adjudications;

create policy "service_role_full_access_extraction_candidates"
  on public.jurisdiction_data_depth_extraction_candidates
  for all to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_adjudications"
  on public.jurisdiction_data_depth_adjudications
  for all to service_role
  using (true)
  with check (true);

revoke all on public.jurisdiction_data_depth_extraction_candidates from anon, authenticated;
revoke all on public.jurisdiction_data_depth_adjudications from anon, authenticated;
