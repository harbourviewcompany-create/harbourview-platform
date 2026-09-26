-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925115841
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

-- Record the already-applied production RLS hardening in migration history.
alter table public.jurisdiction_data_depth_extraction_candidates enable row level security;
alter table public.jurisdiction_data_depth_adjudications enable row level security;

drop policy if exists "service_role_full_access_extraction_candidates" on public.jurisdiction_data_depth_extraction_candidates;
drop policy if exists "service_role_full_access_adjudications" on public.jurisdiction_data_depth_adjudications;

create policy "service_role_full_access_extraction_candidates"
on public.jurisdiction_data_depth_extraction_candidates
for all to service_role using (true) with check (true);

create policy "service_role_full_access_adjudications"
on public.jurisdiction_data_depth_adjudications
for all to service_role using (true) with check (true);

revoke all on public.jurisdiction_data_depth_extraction_candidates from anon, authenticated;
revoke all on public.jurisdiction_data_depth_adjudications from anon, authenticated;
