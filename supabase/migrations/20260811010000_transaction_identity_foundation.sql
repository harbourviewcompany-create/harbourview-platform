-- Harbourview native transaction system: Stage 1 identity foundation.
-- Additive only. Existing workspaces remain tenancy/security boundaries.

create type public.hv_entity_kind as enum (
  'company','government','regulator','laboratory','university','farm','cooperative','investor','association','person','other'
);
create type public.hv_entity_verification_status as enum (
  'unverified','partially_verified','verified','conflicted','inactive','superseded'
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

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_kind public.hv_entity_kind not null,
  legal_name text,
  display_name text not null,
  normalized_name text not null,
  country_iso2 text,
  region text,
  registry_identifier text,
  registry_authority text,
  website text,
  linkedin_url text,
  verification_status public.hv_entity_verification_status not null default 'unverified',
  classification public.hv_classification not null default 'internal',
  public_eligible boolean not null default false,
  valid_from date,
  valid_to date,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  superseded_by uuid references public.entities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  constraint entities_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint entities_superseded_chk check (superseded_by is null or superseded_by <> id),
  constraint entities_normalized_name_chk check (length(btrim(normalized_name)) > 0)
);

create unique index entities_registry_identity_uidx
  on public.entities (registry_authority, registry_identifier)
  where registry_authority is not null and registry_identifier is not null and superseded_by is null;
create index entities_normalized_name_idx on public.entities (normalized_name);
create index entities_country_kind_idx on public.entities (country_iso2, entity_kind);
create index entities_verification_idx on public.entities (verification_status, public_eligible);

create trigger entities_set_updated_at
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

comment on table public.entities is 'Canonical neutral identity root. Never substitutes for workspaces tenancy/security.';
comment on table public.entity_aliases is 'Source-backed historical, legal, trade, brand and registry names for canonical entities.';
comment on table public.entity_facilities is 'Canonical external facility identity. Workspace-private hv_facilities remains a separate member dossier.';
