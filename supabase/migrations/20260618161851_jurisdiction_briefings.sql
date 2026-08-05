-- Replay-safe jurisdiction briefing publishing foundation recovered from the
-- production schema. This is separate from cc_jurisdiction_briefings, which
-- stores the public country-profile briefing contract.

create table if not exists public.jurisdiction_briefings (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text not null,
  country_name text,
  generated_at timestamptz not null default now(),
  week_ending date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  signal_count integer not null default 0,
  headline text not null default '',
  legal_status text not null default 'unknown',
  market_maturity text not null default 'unknown',
  summary text not null default '',
  what_changed text,
  operator_implications text,
  whats_coming text,
  key_signals jsonb not null default '[]'::jsonb,
  model_used text,
  prompt_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_iso2, week_ending)
);

create index if not exists jurisdiction_briefings_country_week
  on public.jurisdiction_briefings(country_iso2, week_ending desc);
create index if not exists jurisdiction_briefings_published
  on public.jurisdiction_briefings(status, generated_at desc)
  where status = 'published';
create index if not exists idx_jb_country_status
  on public.jurisdiction_briefings(country_iso2, status, week_ending desc);

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

do $jurisdiction_briefing_updated_at$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'drop trigger if exists set_jurisdiction_briefings_updated_at on public.jurisdiction_briefings';
    execute 'create trigger set_jurisdiction_briefings_updated_at before update on public.jurisdiction_briefings for each row execute function public.set_updated_at()';
  end if;
end
$jurisdiction_briefing_updated_at$;
