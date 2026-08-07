-- Enforce the jurisdiction briefing publication boundary.
-- Published rows remain guest-readable; writes remain service-role only.

alter table public.jurisdiction_briefings enable row level security;

revoke all on table public.jurisdiction_briefings from public, anon, authenticated;
grant select on table public.jurisdiction_briefings to anon, authenticated;
grant all on table public.jurisdiction_briefings to service_role;

drop policy if exists public_read_published on public.jurisdiction_briefings;
create policy public_read_published
  on public.jurisdiction_briefings
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists service_write on public.jurisdiction_briefings;
create policy service_write
  on public.jurisdiction_briefings
  for all
  to service_role
  using (true)
  with check (true);

do $jurisdiction_briefing_policy_assertion$
declare
  unsafe_write_policy_count integer;
  service_policy_count integer;
begin
  select count(*)
  into unsafe_write_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'jurisdiction_briefings'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    and (roles && array['public','anon','authenticated']::name[]);

  select count(*)
  into service_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'jurisdiction_briefings'
    and policyname = 'service_write'
    and cmd = 'ALL'
    and roles = array['service_role']::name[];

  if unsafe_write_policy_count <> 0 or service_policy_count <> 1 then
    raise exception 'jurisdiction_briefings policy boundary invalid: unsafe=%, service=%',
      unsafe_write_policy_count,
      service_policy_count;
  end if;
end
$jurisdiction_briefing_policy_assertion$;
