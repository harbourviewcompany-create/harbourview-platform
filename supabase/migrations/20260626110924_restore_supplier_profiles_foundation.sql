-- Replay-safe restoration of the production supplier_profiles foundation.
--
-- public.supplier_profiles exists in production but no registered migration
-- creates it. Its first recorded ledger reference is 20260626110925, the
-- api-schema admin views migration that proxies it, so it is restored in the
-- slot immediately before that one.
--
-- The table depends on four enum types that zero-state replay does not have
-- here yet: seller_type and listing_status have no creator anywhere in the
-- repository, and region and marketplace_category are only created later, by
-- 20260630233905. They are created below using the same guarded
-- to_regtype pattern that 20260630233905 already uses, with labels taken from
-- production. The region and marketplace_category label sets match that
-- migration's expected_labels arrays exactly, so its contract assertion still
-- passes and its own creation becomes a no-op.
--
-- Ownership left with later migrations: 20260707185511 owns the anon INSERT
-- grant, which is why it is absent below even though production has it.

do $restore_supplier_profile_enums$
begin
  if to_regtype('public.seller_type') is null then
    create type public.seller_type as enum (
      'licensed_producer',
      'distributor',
      'wholesaler',
      'retailer',
      'investor',
      'other'
    );
  end if;

  if to_regtype('public.listing_status') is null then
    create type public.listing_status as enum (
      'pending_review',
      'approved',
      'rejected',
      'archived'
    );
  end if;

  if to_regtype('public.region') is null then
    create type public.region as enum (
      'north_america',
      'europe',
      'asia_pacific',
      'latin_america',
      'middle_east_africa',
      'global'
    );
  end if;

  if to_regtype('public.marketplace_category') is null then
    create type public.marketplace_category as enum (
      'new_products',
      'used_surplus',
      'cannabis_inventory',
      'wanted_requests',
      'services',
      'business_opportunities',
      'supplier_directory',
      'cultivation_equipment',
      'export_ready',
      'import_demand',
      'consumables',
      'distressed_inventory',
      'distressed_businesses',
      'genetics',
      'professional_services',
      'labs_testing',
      'logistics',
      'packaging',
      'processing_equipment'
    );
  end if;
end
$restore_supplier_profile_enums$;

create table if not exists public.supplier_profiles (
  id uuid primary key default uuid_generate_v4(),
  seller_type public.seller_type not null,
  region public.region not null,
  categories public.marketplace_category[] not null default '{}'::public.marketplace_category[],
  description text not null,
  capabilities jsonb not null default '{}'::jsonb,
  status public.listing_status not null default 'pending_review'::public.listing_status,
  company_name text,
  internal_notes text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_supplier_profiles_region
  on public.supplier_profiles (region);

create index if not exists idx_supplier_profiles_status
  on public.supplier_profiles (status);

alter table public.supplier_profiles enable row level security;

-- anon INSERT is deliberately omitted: 20260707185511 owns that grant.
grant select, update, delete
  on table public.supplier_profiles
  to anon;
grant select, insert, update, delete
  on table public.supplier_profiles
  to authenticated;
grant all privileges
  on table public.supplier_profiles
  to service_role;

do $restore_supplier_profile_policies$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.supplier_profiles'::regclass
      and polname = 'supplier_profiles_public_read'
  ) then
    execute $policy$
      create policy supplier_profiles_public_read
        on public.supplier_profiles
        as permissive
        for select
        to anon, authenticated
        using (status = 'approved'::public.listing_status)
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.supplier_profiles'::regclass
      and polname = 'supplier_profiles_anon_insert'
  ) then
    execute $policy$
      create policy supplier_profiles_anon_insert
        on public.supplier_profiles
        as permissive
        for insert
        to anon
        with check (
          status = 'pending_review'::public.listing_status
          and length(trim(both from description)) > 0
          and length(description) <= 5000
          and (
            contact_email is null
            or (
              length(trim(both from contact_email)) > 0
              and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
              and length(contact_email) <= 254
            )
          )
          and (contact_name is null or length(trim(both from contact_name)) > 0)
          and (company_name is null or length(trim(both from company_name)) > 0)
          and internal_notes is null
          and archived_at is null
        )
    $policy$;
  end if;
end
$restore_supplier_profile_policies$;
