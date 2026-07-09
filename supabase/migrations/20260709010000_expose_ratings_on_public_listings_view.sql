-- Surface the ratings columns added in 20260709000000_add_ratings_to_listings.sql
-- through the actual public read path: app/marketplace/listings/page.tsx (via
-- lib/server/listingsQuery.ts) queries public.marketplace_public_listings_v1
-- directly over the Supabase REST API, not hv_public.marketplace_listings_public
-- (a separate, unrelated view over hv_marketplace.listings). Appending the two
-- new columns at the end keeps this an additive, backward-compatible change
-- for any other consumer of this view.

create or replace view public.marketplace_public_listings_v1
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  coalesce(public_summary, summary, description) as description,
  category,
  subcategory,
  coalesce(marketplace_section, category) as marketplace_section,
  product_type,
  coalesce(region, location_region, location_country, 'global') as region,
  condition,
  location_country,
  location_region,
  price_amount,
  price_currency,
  price_display,
  coalesce(seller_type, 'controlled_review') as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count
from public.listings
where status in ('approved', 'published')
  and public_visibility = true
  and archived_at is null
  and (expires_at is null or expires_at > now());

revoke all on public.marketplace_public_listings_v1 from anon, authenticated;
grant select on public.marketplace_public_listings_v1 to anon, authenticated;
