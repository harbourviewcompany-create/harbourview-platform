-- Harbourview native transaction system: Stage 1 identity foundation.
-- Additive only. Existing workspaces remain tenancy/security boundaries.
-- The Signal Engine already owns public.entities; this migration upgrades that table in place.

create type public.hv_entity_kind as enum (
  'company','government','regulator','laboratory','university','farm','cooperative','investor','association','person','other'
);
create type public.hv_alias_type as enum (
  'legal_name','trade_name','brand_name','former_name','regulatory_name','abbreviation','registry_name','other'
);
create type public.hv_facility_status as enum (
  'unknown','active','inactive','suspended','closed','proposed'
);

create or replace function public.hv_transaction_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Repository replay already creates this table in 20260430000001_signal_engine_schema.sql.
-- CREATE IF NOT EXISTS keeps this migration safe for drifted environments where that historical
-- migration is absent while preserving the existing Signal Engine PK and signal_entity_mentions FKs.
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'other',
  name text not null,
  website text,
  domain text,
  country text,
  region text,
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entities
  add column if not exists entity_kind public.hv_entity_kind,
  add column if not exists legal_name text,
  add column if not exists display_name text,
  add column if not exists normalized_name text,
  add column if not exists country_iso2 text,
  add column if not exists registry_identifier text,
  add column if not exists registry_authority text,
  add column if not exists linkedin_url text,
  add column if not exists classification public.hv_classification not null default 'internal',
  add column if not exists public_eligible boolean not null default false,
  add column if not exists valid_from date,
  add column if not exists valid_to date,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists superseded_by uuid references public.entities(id) on delete set null;

update public.entities
set
  entity_kind = coalesce(
    entity_kind,
    case lower(coalesce(entity_type,''))
      when 'company' then 'company'::public.hv_entity_kind
      when 'operator' then 'company'::public.hv_entity_kind
      when 'organization' then 'company'::public.hv_entity_kind
      when 'organisation' then 'company'::public.hv_entity_kind
      when 'government' then 'government'::public.hv_entity_kind
      when 'regulator' then 'regulator'::public.hv_entity_kind
      when 'laboratory' then 'laboratory'::public.hv_entity_kind
      when 'lab' then 'laboratory'::public.hv_entity_kind
      when 'university' then 'university'::public.hv_entity_kind
      when 'farm' then 'farm'::public.hv_entity_kind
      when 'cooperative' then 'cooperative'::public.hv_entity_kind
      when 'investor' then 'investor'::public.hv_entity_kind
      when 'association' then 'association'::public.hv_entity_kind
      when 'person' then 'person'::public.hv_entity_kind
      else 'other'::public.hv_entity_kind
    end
  ),
  legal_name = coalesce(legal_name, name),
  display_name = coalesce(display_name, name),
  normalized_name = coalesce(normalized_name, lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))),
  country_iso2 = coalesce(
    country_iso2,
    case when country ~ '^[A-Za-z]{2}$' then upper(country) else null end
  );

alter table public.entities
  alter column entity_kind set not null,
  alter column display_name set not null,
  alter column normalized_name set not null;

alter table public.entities
  add constraint entities_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  add constraint entities_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  add constraint entities_superseded_chk check (superseded_by is null or superseded_by <> id),
  add constraint entities_normalized_name_chk check (length(btrim(normalized_name)) > 0);

create unique index entities_registry_identity_uidx
  on public.entities (registry_authority, registry_identifier)
  where registry_authority is not null and registry_identifier is not null and superseded_by is null;
create index if not exists entities_normalized_name_idx on public.entities (normalized_name);
create index if not exists entities_country_kind_idx on public.entities (country_iso2, entity_kind);
create index if not exists entities_transaction_verification_idx on public.entities (verification_status, public_eligible);

create trigger entities_transaction_set_updated_at
before update on public.entities
for each row execute function public.hv_transaction_set_updated_at();

create table public.entity_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  alias_type public.hv_alias_type not null,
  country_iso2 text,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  valid_from date,
  valid_to date,
  classification public.hv_classification not null default 'internal',
  created_at timestamptz not null default now(),
  constraint entity_aliases_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  constraint entity_aliases_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint entity_aliases_normalized_chk check (length(btrim(normalized_alias)) > 0),
  unique (entity_id, normalized_alias, alias_type)
);
create index entity_aliases_normalized_idx on public.entity_aliases (normalized_alias);
create index entity_aliases_evidence_idx on public.entity_aliases (source_evidence_id) where source_evidence_id is not null;

create table public.entity_facilities (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  facility_type text not null,
  country_iso2 text not null,
  region text,
  city text,
  address_text text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status public.hv_facility_status not null default 'unknown',
  classification public.hv_classification not null default 'internal',
  public_eligible boolean not null default false,
  valid_from date,
  valid_to date,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  superseded_by uuid references public.entity_facilities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_facilities_country_iso2_chk check (country_iso2 ~ '^[A-Z]{2}$'),
  constraint entity_facilities_coordinates_chk check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  ),
  constraint entity_facilities_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint entity_facilities_superseded_chk check (superseded_by is null or superseded_by <> id)
);
create index entity_facilities_entity_idx on public.entity_facilities (entity_id);
create index entity_facilities_geo_idx on public.entity_facilities (country_iso2, region, city);
create unique index entity_facilities_identity_uidx
  on public.entity_facilities (entity_id, normalized_name, country_iso2, coalesce(region,''))
  where superseded_by is null;

create trigger entity_facilities_set_updated_at
before update on public.entity_facilities
for each row execute function public.hv_transaction_set_updated_at();

-- Nullable bridges only: no existing consumer changes.
alter table public.cannabis_operators
  add column if not exists entity_id uuid references public.entities(id) on delete set null;
alter table public.ia_counterparties
  add column if not exists entity_id uuid references public.entities(id) on delete set null;
alter table public.operator_licences
  add column if not exists entity_id uuid references public.entities(id) on delete set null,
  add column if not exists facility_id uuid references public.entity_facilities(id) on delete set null;

create index if not exists cannabis_operators_entity_idx on public.cannabis_operators (entity_id) where entity_id is not null;
create index if not exists ia_counterparties_entity_idx on public.ia_counterparties (entity_id) where entity_id is not null;
create index if not exists operator_licences_entity_idx on public.operator_licences (entity_id) where entity_id is not null;
create index if not exists operator_licences_facility_idx on public.operator_licences (facility_id) where facility_id is not null;

comment on table public.entities is 'Signal Engine entity registry upgraded as Harbourview canonical neutral identity root. Never substitutes for workspaces tenancy/security.';
comment on table public.entity_aliases is 'Source-backed historical, legal, trade, brand and registry names for canonical entities.';
comment on table public.entity_facilities is 'Canonical external facility identity. Workspace-private hv_facilities remains a separate member dossier.';
