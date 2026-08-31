-- Resolves a real conflict between two independent agent sessions that
-- both modified the same schema area without coordination:
--
--   1. This session originally extended public/api.marketplace_public_listings_v1
--      (the shared canonical view backing every /marketplace/* public page)
--      with supply-catalog-specific columns (sold_by_harbourview, sku,
--      brand, model, stock_qty, moq, lead_time_days, compliance_flags,
--      target_countries).
--   2. A separate session later rewrote the migration file documenting that
--      view to explicitly exclude the supply extension ("does not replace
--      or expand the canonical marketplace_public_listings_v1 contract"),
--      and instead built a dedicated -- but redacted -- api.supply_catalog_public_v1
--      (hides exact stock/MOQ/lead-time/compliance/brand behind "Quote
--      required" / "Subject to confirmation" placeholders).
--
-- Both changes were applied live independently, so production briefly had
-- both designs simultaneously, and the repo's migration history stopped
-- matching either one.
--
-- Resolution (explicit product direction: "the one that's built the best
-- and optimized... make the repo platform ready"):
--
--   - The shared marketplace_public_listings_v1 contract goes back to
--     exactly its pre-supply-catalog column set (average_rating/review_count
--     kept -- that's a genuine independent fix, unrelated to supply, that
--     predates this whole conflict). Supply catalog changes can never again
--     silently affect the rest of the marketplace, or vice versa.
--   - Supply gets its OWN dedicated, isolated view: api.supply_catalog_detail_v1.
--     Unlike api.supply_catalog_public_v1, it shows FULL real data -- per
--     explicit instruction that everything should be public -- rather than
--     redacting to placeholders. api.supply_catalog_public_v1 is left in
--     place (not dropped) since it may be used elsewhere; it's simply not
--     what /supply queries.
--
-- Already applied directly to the live project this session; this file is
-- the historical record.

drop view if exists api.marketplace_public_listings_v1;
drop view if exists public.marketplace_public_listings_v1;

create view public.marketplace_public_listings_v1 as
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
  review_count
from listings l
where status = 'approved'::listing_status and public_visibility = true and archived_at is null;

create view api.marketplace_public_listings_v1
with (security_invoker = on) as
select
  id, slug, title, description, category, subcategory, marketplace_section, product_type,
  region, condition, location_country, location_region, price_amount, price_currency,
  price_display, seller_type, is_featured, high_level_specs, created_at, average_rating,
  review_count
from public.marketplace_public_listings_v1;

grant select on api.marketplace_public_listings_v1 to anon, authenticated;

create or replace view api.supply_catalog_detail_v1
with (security_invoker = on) as
select
  l.id,
  l.slug,
  l.title,
  l.description,
  l.category::text as category,
  coalesce(l.marketplace_section, l.category::text) as marketplace_section,
  l.product_type,
  l.region::text as region,
  l.condition,
  l.sku,
  l.brand,
  l.model,
  l.quantity,
  l.unit,
  l.price_amount,
  coalesce(l.price_currency, 'CAD') as price_currency,
  case
    when l.price_amount is not null then concat(coalesce(l.price_currency, 'CAD'), ' ', l.price_amount::text)
    else null::text
  end as price_display,
  l.is_featured,
  l.stock_qty,
  l.lead_time_days,
  l.moq,
  l.compliance_flags,
  coalesce(l.target_countries, '{}'::text[]) as target_countries,
  l.high_level_specs,
  l.created_at
from public.listings l
where l.sold_by_harbourview = true
  and l.status = 'approved'
  and l.public_visibility = true
  and l.archived_at is null
  and l.slug is not null;

comment on view api.supply_catalog_detail_v1 is
  'Full-detail public supply catalog DTO -- deliberately shows real stock/MOQ/lead-time/compliance/brand data per explicit product decision. Contrast with api.supply_catalog_public_v1, which redacts the same fields and predates that decision. Isolated from marketplace_public_listings_v1 so changes to either surface cannot silently break the other.';

grant select on api.supply_catalog_detail_v1 to anon, authenticated;
