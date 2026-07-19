-- Signals arrive with a free-text `country` (display name, regional aggregate, or 'Global').
-- This resolves that into a joinable ISO code + an explicit geographic scope, so the
-- signals feed can finally join public.countries (globe, country pages, tier filters).

alter table public.signals add column if not exists country_iso2 text;
alter table public.signals add column if not exists geo_scope   text;
alter table public.signals add column if not exists geo_region  text;

comment on column public.signals.country_iso2 is 'Resolved ISO alpha-2. NULL for region/global/unresolved signals. Set by trg_signals_resolve_geo.';
comment on column public.signals.geo_scope   is 'country | region | global | unknown. Explicit scope so supra-national signals are not silently dropped from country views.';
comment on column public.signals.geo_region  is 'For scope=region (and denormalised for scope=country): matches public.countries.region taxonomy.';

create table if not exists public.signal_geo_labels (
  label      text primary key,
  scope      text not null check (scope in ('region','global')),
  region     text,
  created_at timestamptz not null default now()
);
comment on table public.signal_geo_labels is 'Maps supra-national signal `country` labels (Europe, LATAM, Global...) to a scope and, where applicable, a public.countries.region value.';

insert into public.signal_geo_labels (label, scope, region) values
  ('Global','global',null),
  ('Europe','region','Europe'),
  ('European Union','region','Europe'),
  ('Eastern Europe/Central Asia','region','Europe'),
  ('LATAM','region','Americas'),
  ('Caribbean','region','Americas'),
  ('Africa','region','Africa'),
  ('Asia','region','Asia'),
  ('Middle East','region','Asia'),
  ('Pacific','region','Oceania')
on conflict (label) do nothing;

create or replace function public.resolve_signal_geo(p_country text)
returns table (iso text, scope text, region text)
language sql
stable
security definer
set search_path to ''
as $$
  with input as (select nullif(btrim(coalesce(p_country,'')), '') as raw),
  direct as (
    select c.iso_alpha2 as iso, 'country'::text as scope, c.region
    from public.countries c, input i
    where lower(c.country_name) = lower(i.raw)
    limit 1
  ),
  via_alias as (
    select c.iso_alpha2 as iso, 'country'::text as scope, c.region
    from public.country_name_aliases a
    join public.countries c on lower(c.country_name) = lower(a.canonical_name)
    , input i
    where lower(a.alias) = lower(i.raw)
    limit 1
  ),
  supra as (
    select null::text as iso, g.scope, g.region
    from public.signal_geo_labels g, input i
    where lower(g.label) = lower(i.raw)
    limit 1
  )
  select * from direct
  union all select * from via_alias where not exists (select 1 from direct)
  union all select * from supra
    where not exists (select 1 from direct) and not exists (select 1 from via_alias)
  union all select null::text, 'unknown'::text, null::text
    where not exists (select 1 from direct)
      and not exists (select 1 from via_alias)
      and not exists (select 1 from supra)
      and exists (select 1 from input where raw is not null);
$$;

comment on function public.resolve_signal_geo(text) is
  'Resolves a free-text signal country label to {iso, scope, region}. Returns no row for NULL/blank input.';

create or replace function public.signals_resolve_geo()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_iso text; v_scope text; v_region text;
begin
  if new.country is null or btrim(new.country) = '' then
    new.country_iso2 := null;
    new.geo_scope    := 'unknown';
    new.geo_region   := null;
    return new;
  end if;

  select r.iso, r.scope, r.region into v_iso, v_scope, v_region
  from public.resolve_signal_geo(new.country) r limit 1;

  new.country_iso2 := v_iso;
  new.geo_scope    := coalesce(v_scope, 'unknown');
  new.geo_region   := v_region;
  return new;
end;
$$;

drop trigger if exists trg_signals_resolve_geo on public.signals;
create trigger trg_signals_resolve_geo
before insert or update of country on public.signals
for each row execute function public.signals_resolve_geo();

-- Backfill existing rows (correlated subquery: UPDATE..FROM LATERAL cannot see the target table).
update public.signals s
set (country_iso2, geo_scope, geo_region) = (
  select r.iso, coalesce(r.scope,'unknown'), r.region
  from public.resolve_signal_geo(s.country) r limit 1
)
where s.country is not null and btrim(s.country) <> '';

update public.signals
set country_iso2 = null, geo_scope = 'unknown', geo_region = null
where country is null or btrim(country) = '';

create index if not exists idx_signals_iso_date    on public.signals (country_iso2, date desc) where country_iso2 is not null;
create index if not exists idx_signals_scope_date  on public.signals (geo_scope, date desc);
create index if not exists idx_signals_region_date on public.signals (geo_region, date desc) where geo_region is not null;