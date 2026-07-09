-- Surface the ratings columns added in 20260709000000_add_ratings_to_listings.sql
-- through the actual public read path: app/marketplace/listings/page.tsx (via
-- lib/server/listingsQuery.ts) queries public.marketplace_public_listings_v1
-- directly over the Supabase REST API, not hv_public.marketplace_listings_public
-- (a separate, unrelated view over hv_marketplace.listings).
--
-- NOTE: the live view (confirmed via pg_get_viewdef against project
-- zvxdgdkukjrrwamdpqrg) had already drifted from the definition checked in at
-- 20260601000000_marketplace_supply_engine.sql -- public.listings has no
-- subcategory, location_region, summary/public_summary or expires_at columns
-- in production, unlike what that migration file assumes. This migration
-- reproduces the *actual live* view definition verbatim, appending only the
-- two new rating columns at the end, rather than the stale one from that file.

create or replace view public.marketplace_public_listings_v1
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  description,
  category::text as category,
  NULL::text as subcategory,
  coalesce(marketplace_section, category::text) as marketplace_section,
  product_type,
  region::text as region,
  condition,
  location_country,
  NULL::text as location_region,
  price_amount,
  coalesce(price_currency, 'USD'::text) as price_currency,
  case
    when price_amount is not null then concat(coalesce(price_currency, 'USD'::text), ' ', price_amount::text)
    else NULL::text
  end as price_display,
  coalesce(seller_type::text, 'controlled_review'::text) as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count
from listings l
where status = 'approved'::listing_status and public_visibility = true and archived_at is null;
