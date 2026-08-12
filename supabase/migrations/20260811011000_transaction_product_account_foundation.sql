-- Harbourview native transaction system: Stage 2 product/batch + economic-account foundation.

create type public.hv_product_status as enum (
  'unknown','active','discontinued','reformulated','withdrawn','recalled','superseded'
);
create type public.hv_batch_status as enum (
  'unknown','manufactured','released','held','recalled','expired','depleted','destroyed'
);
create type public.hv_account_status as enum (
  'candidate','qualified','active','inactive','superseded'
);
create type public.hv_account_member_role as enum (
  'contracting_entity','budget_owner','procurement_entity','operating_entity','subsidiary','parent','licence_holder','facility','other'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id) on delete set null,
  brand_entity_id uuid references public.entities(id) on delete set null,
  facility_id uuid references public.entity_facilities(id) on delete set null,
  product_format_id uuid references public.product_formats(id) on delete set null,
  name text not null,
  brand_name text,
  sku text,
  variant text,
  product_category text not null,
  description text,
  formulation jsonb not null default '{}'::jsonb,
  package_size numeric,
  package_unit text,
  status public.hv_product_status not null default 'unknown',
  classification public.hv_classification not null default 'internal',
  public_eligible boolean not null default false,
  valid_from date,
  valid_to date,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  superseded_by uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_package_size_chk check (package_size is null or package_size >= 0),
  constraint products_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint products_superseded_chk check (superseded_by is null or superseded_by <> id)
);
create unique index products_entity_sku_uidx
  on public.products (entity_id, sku)
  where entity_id is not null and sku is not null and superseded_by is null;
create unique index products_entity_name_variant_uidx
  on public.products (entity_id, lower(name), coalesce(lower(variant),''))
  where entity_id is not null and sku is null and superseded_by is null;
create index products_format_idx on public.products (product_format_id) where product_format_id is not null;
create index products_entity_idx on public.products (entity_id) where entity_id is not null;
create index products_status_idx on public.products (status, public_eligible);
create trigger products_set_updated_at
before update on public.products
for each row execute function public.hv_transaction_set_updated_at();

create table public.product_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  batch_code text not null,
  facility_id uuid references public.entity_facilities(id) on delete set null,
  licence_id uuid references public.operator_licences(id) on delete set null,
  manufactured_at date,
  released_at date,
  expires_at date,
  quantity numeric,
  quantity_unit text,
  status public.hv_batch_status not null default 'unknown',
  classification public.hv_classification not null default 'internal',
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_batches_quantity_chk check (quantity is null or quantity >= 0),
  constraint product_batches_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint product_batches_release_after_manufacture_chk check (
    released_at is null or manufactured_at is null or released_at >= manufactured_at
  ),
  constraint product_batches_expiry_after_manufacture_chk check (
    expires_at is null or manufactured_at is null or expires_at >= manufactured_at
  ),
  constraint product_batches_expiry_after_release_chk check (
    expires_at is null or released_at is null or expires_at >= released_at
  ),
  unique (product_id, batch_code)
);
create index product_batches_batch_code_idx on public.product_batches (batch_code);
create index product_batches_facility_idx on public.product_batches (facility_id) where facility_id is not null;
create index product_batches_licence_idx on public.product_batches (licence_id) where licence_id is not null;
create index product_batches_manufactured_idx on public.product_batches (manufactured_at desc) where manufactured_at is not null;
create trigger product_batches_set_updated_at
before update on public.product_batches
for each row execute function public.hv_transaction_set_updated_at();

create table public.economic_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  primary_entity_id uuid references public.entities(id) on delete set null,
  country_iso2 text,
  region text,
  status public.hv_account_status not null default 'candidate',
  budget_owner_entity_id uuid references public.entities(id) on delete set null,
  procurement_owner_entity_id uuid references public.entities(id) on delete set null,
  classification public.hv_classification not null default 'confidential',
  valid_from date,
  valid_to date,
  superseded_by uuid references public.economic_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint economic_accounts_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  constraint economic_accounts_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint economic_accounts_superseded_chk check (superseded_by is null or superseded_by <> id)
);
create index economic_accounts_normalized_name_idx on public.economic_accounts (normalized_name);
create index economic_accounts_primary_entity_idx on public.economic_accounts (primary_entity_id) where primary_entity_id is not null;
create index economic_accounts_status_idx on public.economic_accounts (status);
create trigger economic_accounts_set_updated_at
before update on public.economic_accounts
for each row execute function public.hv_transaction_set_updated_at();

create table public.economic_account_members (
  id uuid primary key default gen_random_uuid(),
  economic_account_id uuid not null references public.economic_accounts(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  operator_licence_id uuid references public.operator_licences(id) on delete cascade,
  facility_id uuid references public.entity_facilities(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  member_role public.hv_account_member_role not null,
  is_primary boolean not null default false,
  valid_from date,
  valid_to date,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  classification public.hv_classification not null default 'confidential',
  created_at timestamptz not null default now(),
  constraint economic_account_members_one_target_chk check (
    num_nonnulls(entity_id, operator_licence_id, facility_id, workspace_id) = 1
  ),
  constraint economic_account_members_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index economic_account_members_account_idx on public.economic_account_members (economic_account_id);
create index economic_account_members_entity_idx on public.economic_account_members (entity_id) where entity_id is not null;
create index economic_account_members_licence_idx on public.economic_account_members (operator_licence_id) where operator_licence_id is not null;
create index economic_account_members_facility_idx on public.economic_account_members (facility_id) where facility_id is not null;
create index economic_account_members_workspace_idx on public.economic_account_members (workspace_id) where workspace_id is not null;

create or replace function public.hv_validate_economic_account_membership_period()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_key text;
  new_period daterange;
begin
  target_key := case
    when new.entity_id is not null then 'entity:' || new.entity_id::text
    when new.operator_licence_id is not null then 'licence:' || new.operator_licence_id::text
    when new.facility_id is not null then 'facility:' || new.facility_id::text
    when new.workspace_id is not null then 'workspace:' || new.workspace_id::text
    else null
  end;

  if target_key is null then
    raise exception 'economic account membership target is required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.economic_account_id::text || '|' || new.member_role::text || '|' || target_key, 0)
  );

  new_period := daterange(
    coalesce(new.valid_from, '-infinity'::date),
    coalesce(new.valid_to, 'infinity'::date),
    '[)'
  );

  if exists (
    select 1
    from public.economic_account_members existing
    where existing.economic_account_id = new.economic_account_id
      and existing.member_role = new.member_role
      and existing.id is distinct from new.id
      and existing.entity_id is not distinct from new.entity_id
      and existing.operator_licence_id is not distinct from new.operator_licence_id
      and existing.facility_id is not distinct from new.facility_id
      and existing.workspace_id is not distinct from new.workspace_id
      and daterange(
        coalesce(existing.valid_from, '-infinity'::date),
        coalesce(existing.valid_to, 'infinity'::date),
        '[)'
      ) && new_period
  ) then
    raise exception 'economic account membership period overlaps an existing membership for %', target_key;
  end if;

  return new;
end;
$$;

create trigger economic_account_members_validate_period
before insert or update of economic_account_id, entity_id, operator_licence_id, facility_id, workspace_id, member_role, valid_from, valid_to
on public.economic_account_members
for each row execute function public.hv_validate_economic_account_membership_period();

-- Existing marketplace records remain snapshots/offers; these are nullable canonical bridges only.
-- Stage 6 converts the current public table-wide SELECT/INSERT/UPDATE grants to legacy-column allowlists
-- so these internal bridge identifiers are neither publicly readable nor publicly writable.
alter table public.listings
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null;
alter table public.buyer_requests
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null,
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;

create index if not exists listings_product_idx on public.listings (product_id) where product_id is not null;
create index if not exists listings_economic_account_idx on public.listings (economic_account_id) where economic_account_id is not null;
create index if not exists buyer_requests_product_idx on public.buyer_requests (product_id) where product_id is not null;
create index if not exists buyer_requests_economic_account_idx on public.buyer_requests (economic_account_id) where economic_account_id is not null;
create index if not exists buyer_requests_opportunity_idx on public.buyer_requests (opportunity_id) where opportunity_id is not null;

comment on table public.products is 'Canonical product/SKU identity; marketplace listings remain commercial offer snapshots.';
comment on table public.product_batches is 'Batch-level identity for COA, inventory, testing and compliance evidence.';
comment on table public.economic_accounts is 'Commercial buying/contracting unit. Never substitutes for workspaces tenancy/security.';
comment on table public.economic_account_members is 'Temporal consolidation of entities, licences, facilities or workspaces into one economic buying/contracting account; non-overlapping periods may rejoin later.';
