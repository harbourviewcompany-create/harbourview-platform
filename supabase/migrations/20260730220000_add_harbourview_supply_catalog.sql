-- Harbourview-direct supply catalog: schema additions.
-- NOTE: these statements were already applied directly against the live
-- project this session via Supabase migration tooling (see PR description
-- for disclosure). This file exists so repo history matches production
-- schema and future environments can be provisioned from migration history.
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE) and are
-- safe to re-run.

alter table public.listings
  add column if not exists sold_by_harbourview boolean not null default false,
  add column if not exists sku text,
  add column if not exists stock_qty integer,
  add column if not exists lead_time_days integer,
  add column if not exists moq integer,
  add column if not exists compliance_flags jsonb not null default '{}'::jsonb,
  add column if not exists target_countries text[] not null default '{}';

create index if not exists listings_sold_by_harbourview_idx
  on public.listings (sold_by_harbourview)
  where sold_by_harbourview = true;

comment on column public.listings.sold_by_harbourview is 'True for Harbourview''s own direct-sale supply catalog (consumables/equipment), false for third-party P2P marketplace listings.';
comment on column public.listings.compliance_flags is 'Per-jurisdiction compliance metadata, e.g. {"CA": {"child_resistant": true, "csa_z76_1": true, "plain_packaging": true}}';
comment on column public.listings.target_countries is 'ISO country codes this SKU is compliant/available for (e.g. {CA,DE,AU}).';

-- Extend the canonical public listings view (used by every /marketplace/*
-- public page via lib/server/listingsQuery.ts) with the new supply-catalog
-- columns, and fix pre-existing schema drift: api.marketplace_public_listings_v1
-- was missing average_rating/review_count that the frontend's SELECT_COLS
-- already requests (silent PostgREST failure -> queryListings() catches and
-- returns [], so this was already quietly breaking ratings on every public
-- marketplace page before this PR).
create or replace view public.marketplace_public_listings_v1 as
select
  id,
  slug,
  title,
  description,
  category::text as category,
  null::text as subcategory,
  coalesce(marketplace_section, category::text) as marketplace_section,
  product_type,
  region::text as region,
  condition,
  location_country,
  null::text as location_region,
  price_amount,
  coalesce(price_currency, 'USD'::text) as price_currency,
  case
    when price_amount is not null then concat(coalesce(price_currency, 'USD'::text), ' ', price_amount::text)
    else null::text
  end as price_display,
  coalesce(seller_type::text, 'controlled_review'::text) as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count,
  sold_by_harbourview,
  sku,
  brand,
  model,
  quantity,
  unit,
  stock_qty,
  lead_time_days,
  moq,
  compliance_flags,
  target_countries
from listings l
where status = 'approved'::listing_status and public_visibility = true and archived_at is null;

create or replace view api.marketplace_public_listings_v1
with (security_invoker = on) as
select
  id, slug, title, description, category, subcategory, marketplace_section, product_type,
  region, condition, location_country, location_region, price_amount, price_currency,
  price_display, seller_type, is_featured, high_level_specs, created_at, average_rating,
  review_count, sold_by_harbourview, sku, brand, model, quantity, unit, stock_qty,
  lead_time_days, moq, compliance_flags, target_countries
from public.marketplace_public_listings_v1;

grant select on api.marketplace_public_listings_v1 to anon, authenticated;
