-- Replay-safe Command Centre jurisdiction briefing foundation recovered from
-- production. This public country/profile contract is distinct from the later
-- jurisdiction_briefings publication workflow.

create table if not exists public.cc_jurisdiction_briefings (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_slug text not null,
  jurisdiction_type text not null,
  country_iso2 text not null,
  state_iso2 text,
  program_status text,
  public_summary text,
  patient_access text,
  physician_access text,
  market_dynamics text,
  regulatory_outlook text,
  regulatory_body text,
  data_source_summary text,
  verification_summary text,
  update_cadence text,
  coverage_summary text,
  last_reviewed_date date,
  watch_regions jsonb default '[]'::jsonb,
  change_notes jsonb default '[]'::jsonb,
  review_state text not null default 'reviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confidence_score numeric,
  confidence_categories jsonb default '[]'::jsonb,
  full_profile_href text,
  change_activity_href text,
  constraint cc_jurisdiction_briefings_confidence_score_check
    check (confidence_score is null or confidence_score between 0 and 100)
);

create unique index if not exists cc_jurisdiction_briefings_slug_country_idx
  on public.cc_jurisdiction_briefings(jurisdiction_slug, country_iso2);
create index if not exists cc_jurisdiction_briefings_country_idx
  on public.cc_jurisdiction_briefings(country_iso2);
create index if not exists idx_cc_jb_country_status
  on public.cc_jurisdiction_briefings(country_iso2, review_state)
  where country_iso2 is not null;

create or replace function public.set_cc_briefings_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists cc_briefings_updated_at on public.cc_jurisdiction_briefings;
create trigger cc_briefings_updated_at
  before update on public.cc_jurisdiction_briefings
  for each row execute function public.set_cc_briefings_updated_at();

alter table public.cc_jurisdiction_briefings enable row level security;
revoke all on table public.cc_jurisdiction_briefings from public, anon, authenticated;
grant select on table public.cc_jurisdiction_briefings to anon, authenticated;
grant all on table public.cc_jurisdiction_briefings to service_role;

drop policy if exists public_read_cc_briefings on public.cc_jurisdiction_briefings;
create policy public_read_cc_briefings
  on public.cc_jurisdiction_briefings
  for select
  to anon, authenticated
  using (true);
