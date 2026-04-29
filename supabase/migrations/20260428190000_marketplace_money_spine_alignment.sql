-- Harbourview Marketplace v1 money-spine alignment
-- Purpose: align live marketplace tables with the revenue-first app surface:
-- equipment, surplus inventory, packaging, services, wanted requests and controlled introductions.
-- This migration is additive and non-destructive.

-- Listings: add public-safe fields expected by the Next.js marketplace UI and API.
alter table public.listings
  add column if not exists marketplace_section text not null default 'equipment',
  add column if not exists slug text,
  add column if not exists public_visibility boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists price_amount numeric,
  add column if not exists price_currency text not null default 'USD',
  add column if not exists location_country text,
  add column if not exists condition text,
  add column if not exists quantity numeric,
  add column if not exists unit text,
  add column if not exists monetization_path text,
  add column if not exists lead_quality text,
  add column if not exists estimated_deal_value numeric,
  add column if not exists admin_priority integer,
  add column if not exists item_notes text,
  add column if not exists reviewer_notes text,
  add column if not exists private_notes text,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

alter table public.listings
  drop constraint if exists listings_marketplace_section_check,
  add constraint listings_marketplace_section_check
    check (marketplace_section in ('equipment','surplus_inventory','packaging','services','wanted_requests','introductions'));

alter table public.listings
  drop constraint if exists listings_price_currency_check,
  add constraint listings_price_currency_check
    check (price_currency ~ '^[A-Z]{3}$');

create unique index if not exists listings_slug_unique_idx
  on public.listings (slug)
  where slug is not null;

create index if not exists listings_marketplace_public_idx
  on public.listings (marketplace_section, is_featured desc, created_at desc)
  where public_visibility = true and status = 'approved';

-- Wanted requests: keep buyer intent separate but expose safe public request cards.
alter table public.buyer_requests
  add column if not exists marketplace_section text not null default 'wanted_requests',
  add column if not exists slug text,
  add column if not exists public_visibility boolean not null default false,
  add column if not exists budget_range text,
  add column if not exists location_country text,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists lead_quality text,
  add column if not exists estimated_deal_value numeric,
  add column if not exists admin_priority integer,
  add column if not exists reviewer_notes text,
  add column if not exists private_notes text;

alter table public.buyer_requests
  drop constraint if exists buyer_requests_marketplace_section_check,
  add constraint buyer_requests_marketplace_section_check
    check (marketplace_section = 'wanted_requests');

create unique index if not exists buyer_requests_slug_unique_idx
  on public.buyer_requests (slug)
  where slug is not null;

create index if not exists buyer_requests_marketplace_public_idx
  on public.buyer_requests (created_at desc)
  where public_visibility = true and status = 'approved';

-- Supplier profiles: needed for packaging, service and equipment vendor discovery.
alter table public.supplier_profiles
  add column if not exists slug text,
  add column if not exists public_visibility boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists lead_quality text,
  add column if not exists estimated_deal_value numeric,
  add column if not exists admin_priority integer,
  add column if not exists reviewer_notes text,
  add column if not exists private_notes text;

alter table public.supplier_profiles
  drop constraint if exists supplier_profiles_verification_status_check,
  add constraint supplier_profiles_verification_status_check
    check (verification_status in ('unverified','pending_review','verified','suspended'));

create unique index if not exists supplier_profiles_slug_unique_idx
  on public.supplier_profiles (slug)
  where slug is not null;

-- Inquiries: connect buyer intent to listings/wanted requests without exposing contact data publicly.
alter table public.marketplace_inquiries
  add column if not exists created_by uuid,
  add column if not exists buyer_budget text,
  add column if not exists preferred_timeline text,
  add column if not exists intro_requested boolean not null default true,
  add column if not exists lead_quality text,
  add column if not exists estimated_deal_value numeric,
  add column if not exists admin_priority integer;

-- Matches are the controlled buyer/seller introduction spine.
alter table public.matches
  add column if not exists monetization_path text,
  add column if not exists fee_basis text,
  add column if not exists success_fee_amount numeric,
  add column if not exists success_fee_currency text default 'USD',
  add column if not exists buyer_approved_disclosure boolean not null default false,
  add column if not exists seller_approved_disclosure boolean not null default false,
  add column if not exists intro_summary text;

alter table public.matches
  drop constraint if exists matches_success_fee_currency_check,
  add constraint matches_success_fee_currency_check
    check (success_fee_currency is null or success_fee_currency ~ '^[A-Z]{3}$');

-- Public-safe views. These deliberately exclude private contact, notes, scoring and fee fields.
drop view if exists public.marketplace_listings_public_view;
create view public.marketplace_listings_public_view as
select
  id,
  marketplace_section as section,
  title,
  coalesce(slug, lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8)) as slug,
  description,
  price_amount,
  price_currency,
  location_country,
  is_featured,
  created_at
from public.listings
where status = 'approved'
  and public_visibility = true
  and archived_at is null;

drop view if exists public.marketplace_wanted_requests_public_view;
create view public.marketplace_wanted_requests_public_view as
select
  id,
  title,
  coalesce(slug, lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8)) as slug,
  description,
  product_type as category,
  budget_range,
  location_country,
  created_at
from public.buyer_requests
where status = 'approved'
  and public_visibility = true
  and archived_at is null;

drop view if exists public.marketplace_supplier_profiles_public_view;
create view public.marketplace_supplier_profiles_public_view as
select
  id,
  company_name,
  coalesce(slug, lower(regexp_replace(coalesce(company_name, 'supplier'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8)) as slug,
  description,
  region,
  categories,
  verification_status,
  is_featured,
  created_at
from public.supplier_profiles
where status = 'approved'
  and public_visibility = true
  and archived_at is null;

grant select on public.marketplace_listings_public_view to anon, authenticated;
grant select on public.marketplace_wanted_requests_public_view to anon, authenticated;
grant select on public.marketplace_supplier_profiles_public_view to anon, authenticated;

-- Ensure public users do not get direct table access through grants.
revoke all on table public.listings from anon;
revoke all on table public.buyer_requests from anon;
revoke all on table public.supplier_profiles from anon;
revoke all on table public.marketplace_inquiries from anon;
revoke all on table public.matches from anon;
revoke all on table public.disclosure_requests from anon;
revoke all on table public.internal_admin_notes from anon;
revoke all on table public.audit_events from anon;

-- Seed slugs for existing approved rows if any exist.
update public.listings
set slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8)
where slug is null;

update public.buyer_requests
set slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8)
where slug is null;

update public.supplier_profiles
set slug = lower(regexp_replace(coalesce(company_name, 'supplier'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8)
where slug is null;
