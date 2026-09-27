-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925101244
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

alter table public.jurisdiction_data_depth_adjudication_runs enable row level security; alter table public.jurisdiction_data_depth_gate_results enable row level security; drop policy if exists "service role only" on public.jurisdiction_data_depth_adjudication_runs; drop policy if exists "service role only" on public.jurisdiction_data_depth_gate_results; create policy "service role only" on public.jurisdiction_data_depth_adjudication_runs for all to service_role using (true) with check (true); create policy "service role only" on public.jurisdiction_data_depth_gate_results for all to service_role using (true) with check (true); revoke all on public.jurisdiction_data_depth_adjudication_runs from anon,authenticated; revoke all on public.jurisdiction_data_depth_gate_results from anon,authenticated;
