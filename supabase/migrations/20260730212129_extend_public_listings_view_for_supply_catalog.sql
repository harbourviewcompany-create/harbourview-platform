
-- Drop the one-off view from this session; the app actually queries
-- marketplace_public_listings_v1 (public + api), so extend that instead.
drop view if exists api.supply_catalog_v1;

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
