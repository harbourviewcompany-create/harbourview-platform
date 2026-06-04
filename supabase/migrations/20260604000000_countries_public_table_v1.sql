-- =============================================================================
-- public.countries — primary country intelligence table
-- Queried by: hooks/useAllCountries.ts, hooks/useCountryBrief.ts,
--             lib/server/countriesQuery.ts (intelligence pages + globe)
-- Previously missing: intelligence.country_intelligence_profiles was created
-- but never exposed under the expected public.countries name/schema.
-- =============================================================================

create table if not exists public.countries (
  id                    uuid        primary key default gen_random_uuid(),
  country_name          text        not null,
  country_slug          text        not null unique,
  iso_alpha2            text        not null unique,
  iso_alpha3            text,
  region                text,
  subregion             text,
  market_access_status  text        not null default 'unknown',
  medical_status        text        not null default 'unknown',
  adult_use_status      text        not null default 'unknown',
  import_status         text        not null default 'unknown',
  export_status         text        not null default 'unknown',
  signals_status        text        not null default 'unknown',
  opportunity_status    text        not null default 'unknown',
  public_summary        text,
  data_completeness     text        not null default 'seed',
  last_updated_label    text,
  lat                   double precision,
  lng                   double precision,
  opportunity_categories text[],
  trade_roles            text[],
  regulator_label        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS: public read, no public write
alter table public.countries enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'countries'
      and policyname = 'countries_public_read'
  ) then
    create policy countries_public_read
      on public.countries
      for select
      using (true);
  end if;
end $$;

-- Trigger: keep updated_at current
create or replace function public.countries_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists countries_updated_at on public.countries;
create trigger countries_updated_at
  before update on public.countries
  for each row execute function public.countries_set_updated_at();

-- =============================================================================
-- Seed: 6 priority alpha-coverage countries from lib/intelligence/country-fixtures.json
-- Status values: open | active | regulated | emerging | limited | restricted | unknown
-- data_completeness: full | seed | fixture
-- =============================================================================

insert into public.countries (
  country_name, country_slug, iso_alpha2, iso_alpha3,
  region, subregion,
  market_access_status, medical_status, adult_use_status,
  import_status, export_status, signals_status, opportunity_status,
  public_summary, data_completeness, last_updated_label,
  lat, lng, opportunity_categories, trade_roles, regulator_label
) values
(
  'Germany', 'germany', 'DE', 'DEU',
  'Europe', 'Western Europe',
  'active', 'active', 'emerging',
  'active', 'unknown', 'active', 'active',
  'Priority European access market. Alpha source material indicates a large medical channel, import relevance and controlled adult-use evolution. Public use requires analyst review before presenting country-specific route claims.',
  'seed', 'June 2026',
  51.0, 10.0,
  ARRAY['medical import pathway','pharmacy channel intelligence','EU-GMP supply qualification','pilot-program monitoring'],
  ARRAY['import market','buyer demand signal'],
  'BfArM / regional authorities'
),
(
  'United Kingdom', 'united-kingdom', 'GB', 'GBR',
  'Europe', 'Northern Europe',
  'active', 'active', 'restricted',
  'active', 'unknown', 'emerging', 'emerging',
  'Medical access market with import and specialist-prescribing relevance. Alpha source content should be treated as directional until regulator and market-pathway fields are revalidated.',
  'seed', 'June 2026',
  54.0, -2.0,
  ARRAY['medical access monitoring','import pathway review','clinic and pharmacy channel mapping'],
  ARRAY['import market'],
  'Home Office / MHRA'
),
(
  'Canada', 'canada', 'CA', 'CAN',
  'North America', 'Northern America',
  'open', 'open', 'open',
  'unknown', 'active', 'active', 'active',
  'Established regulated producer and export-origin market. Public fixture keeps only high-level market role and excludes non-public commercial counterparties, commercial terms, direct contact details and evidence records.',
  'full', 'June 2026',
  56.0, -106.0,
  ARRAY['export-origin qualification','licensed producer screening','bulk supply discovery','regulatory export documentation review'],
  ARRAY['export market','supply origin'],
  'Health Canada'
),
(
  'Colombia', 'colombia', 'CO', 'COL',
  'South America', 'South America',
  'emerging', 'emerging', 'restricted',
  'unknown', 'emerging', 'emerging', 'emerging',
  'Regional cultivation and export-origin candidate. Alpha signal material is quarantined from public output pending evidence review and date-stamped policy validation.',
  'seed', 'June 2026',
  4.6, -74.1,
  ARRAY['cultivation pathway review','export-origin screening','Latin America policy monitoring'],
  ARRAY['export market','supply origin'],
  'Ministry of Health / INVIMA'
),
(
  'Brazil', 'brazil', 'BR', 'BRA',
  'South America', 'South America',
  'emerging', 'limited', 'restricted',
  'active', 'unknown', 'emerging', 'emerging',
  'Large medical-access market with evolving policy and import relevance. Keep public presentation conservative until current regulator and product-access rules are rechecked.',
  'seed', 'June 2026',
  -14.2, -51.9,
  ARRAY['medical access monitoring','import pathway review','policy change tracking'],
  ARRAY['import market','buyer demand signal'],
  'ANVISA'
),
(
  'Australia', 'australia', 'AU', 'AUS',
  'Oceania', 'Australia and New Zealand',
  'active', 'active', 'emerging',
  'active', 'unknown', 'active', 'active',
  'Established TGA-regulated medical market with active import pathway. Specialist prescribing channel and growing patient population. Export pathway limited; primary role as import destination and clinical-use market.',
  'seed', 'June 2026',
  -25.3, 133.8,
  ARRAY['medical import pathway','TGA regulatory monitoring','prescriber and clinic channel mapping','pharmacy access review'],
  ARRAY['import market','buyer demand signal'],
  'TGA / ODC'
)
on conflict (iso_alpha2) do update set
  country_name          = excluded.country_name,
  country_slug          = excluded.country_slug,
  region                = excluded.region,
  subregion             = excluded.subregion,
  market_access_status  = excluded.market_access_status,
  medical_status        = excluded.medical_status,
  adult_use_status      = excluded.adult_use_status,
  import_status         = excluded.import_status,
  export_status         = excluded.export_status,
  signals_status        = excluded.signals_status,
  opportunity_status    = excluded.opportunity_status,
  public_summary        = excluded.public_summary,
  data_completeness     = excluded.data_completeness,
  last_updated_label    = excluded.last_updated_label,
  lat                   = excluded.lat,
  lng                   = excluded.lng,
  opportunity_categories = excluded.opportunity_categories,
  trade_roles           = excluded.trade_roles,
  regulator_label       = excluded.regulator_label,
  updated_at            = now();

-- Grant read access to anon and authenticated roles
grant select on public.countries to anon, authenticated;
