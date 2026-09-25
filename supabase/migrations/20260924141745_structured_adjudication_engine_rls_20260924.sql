alter table public.jurisdiction_data_depth_adjudication_runs enable row level security;
alter table public.jurisdiction_data_depth_gate_results enable row level security;
drop policy if exists "service role only" on public.jurisdiction_data_depth_adjudication_runs;
drop policy if exists "service role only" on public.jurisdiction_data_depth_gate_results;
create policy "service role only" on public.jurisdiction_data_depth_adjudication_runs for all to service_role using (true) with check (true);
create policy "service role only" on public.jurisdiction_data_depth_gate_results for all to service_role using (true) with check (true);
revoke all on public.jurisdiction_data_depth_adjudication_runs from anon,authenticated;
revoke all on public.jurisdiction_data_depth_gate_results from anon,authenticated;
