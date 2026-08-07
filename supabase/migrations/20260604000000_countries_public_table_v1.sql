-- Deterministic replay-safe countries foundation. Data seeding remains in 20260609000000.
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  country_name text not null,
  country_slug text not null,
  iso_alpha2 text not null,
  iso_alpha3 text,
  region text,
  subregion text,
  market_access_status text not null default 'unknown',
  medical_status text not null default 'unknown',
  adult_use_status text not null default 'unknown',
  import_status text not null default 'unknown',
  export_status text not null default 'unknown',
  signals_status text not null default 'unknown',
  opportunity_status text not null default 'unknown',
  opportunity_score integer not null default 0,
  regulator_label text,
  lat double precision,
  lng double precision,
  public_summary text,
  data_completeness text not null default 'stub',
  last_updated_label text,
  opportunity_categories text[],
  trade_roles text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.countries
  add column if not exists opportunity_score integer not null default 0;

update public.countries set opportunity_score = case market_access_status::text
  when 'open' then 95
  when 'active' then 82
  when 'regulated' then 64
  when 'emerging' then 52
  when 'limited' then 36
  when 'restricted' then 22
  when 'unknown' then 10
  else 10
end
where opportunity_score = 0;

create or replace function public.sync_opportunity_score()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.opportunity_score := case new.market_access_status::text
    when 'open' then 95
    when 'active' then 82
    when 'regulated' then 64
    when 'emerging' then 52
    when 'limited' then 36
    when 'restricted' then 22
    when 'unknown' then 10
    else 10
  end;
  return new;
end;
$$;

drop trigger if exists sync_opportunity_score_trigger on public.countries;
create trigger sync_opportunity_score_trigger
  before insert or update of market_access_status
  on public.countries
  for each row execute function public.sync_opportunity_score();
