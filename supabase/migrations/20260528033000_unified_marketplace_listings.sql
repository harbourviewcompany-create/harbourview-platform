begin;

create extension if not exists pgcrypto;

-- MP-SCHEMA-001: one canonical marketplace listing record with typed detail tables.
-- Additive only: this migration creates missing objects and constraints without dropping,
-- renaming, rewriting, or backfilling existing marketplace data.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  listing_type text not null,
  category text,
  subcategory text,
  status text not null default 'draft',
  visibility text not null default 'private',
  summary text,
  description text,
  location_country text,
  location_region text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists listing_type text,
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists status text not null default 'draft',
  add column if not exists visibility text not null default 'private',
  add column if not exists summary text,
  add column if not exists description text,
  add column if not exists location_country text,
  add column if not exists location_region text,
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Existing databases with a pre-existing listings table must explicitly backfill listing_type
-- before this constraint can be validated. NOT VALID avoids an implicit table rewrite/scan,
-- but still enforces the canonical discriminator for new or updated rows.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_listing_type_check'
  ) then
    alter table public.listings
      add constraint listings_listing_type_check
      check (listing_type is not null and listing_type in ('supply', 'equipment')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_status_check'
  ) then
    alter table public.listings
      add constraint listings_status_check
      check (status in ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_visibility_check'
  ) then
    alter table public.listings
      add constraint listings_visibility_check
      check (visibility in ('private', 'public')) not valid;
  end if;
end $$;

create table if not exists public.listing_supply_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  product_form text,
  material text,
  minimum_order_quantity text,
  pack_size text,
  origin_country text,
  certifications text[],
  lead_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_equipment_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  manufacturer text,
  model text,
  year integer,
  condition text,
  hours_used integer,
  capacity text,
  voltage text,
  dimensions text,
  asset_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_type_status
  on public.listings (listing_type, status);

create index if not exists idx_listings_public
  on public.listings (visibility, status, published_at desc);

create index if not exists idx_listings_category
  on public.listings (category, subcategory);

create index if not exists idx_supply_details_listing
  on public.listing_supply_details (listing_id);

create index if not exists idx_equipment_details_listing
  on public.listing_equipment_details (listing_id);

commit;
