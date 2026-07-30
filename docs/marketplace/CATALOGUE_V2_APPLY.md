# Marketplace Catalogue V2 — Apply Guide

## Goal

Make the public marketplace look active with illustrative cannabis-format SKUs and consumables, without fabricating licensed suppliers.

## 1. Apply listing seed

In Supabase SQL editor (production project), run:

```text
supabase/seeds/marketplace_catalogue_v2.sql
```

This upserts 26 rows on `listings.slug` with:

- `status = published`
- `public_visibility = true`
- `seller_type = catalogue_slot`
- `verification_status = unverified`

### Verify

```sql
select category, count(*)
from public.marketplace_public_listings_v1
group by 1
order by 2 desc;

select slug, title, product_type, price_display
from public.marketplace_public_listings_v1
where slug like 'sku-%'
order by category, slug;
```

## 2. Product images (static public paths)

Commit WebP files under:

| Asset | Path |
|-------|------|
| Pre-roll cones | `public/images/consumables/pre-roll-cones-king-size.webp` |
| Matte CR pouches | `public/images/consumables/matte-child-resistant-pouches.webp` |
| Premium glass jars | `public/images/consumables/premium-glass-jars.webp` |
| Opaque jars | `public/images/consumables/opaque-flower-jars.webp` |
| CR tubes | `public/images/consumables/cr-preroll-tubes.webp` |
| Labels / seals | `public/images/consumables/roll-labels-tamper-seals.webp` |
| Retail cartons | `public/images/consumables/custom-retail-cartons.webp` |
| Shipping cartons | `public/images/consumables/shipping-cartons.webp` |
| Dried flower lot | `public/marketplace/images/skus/dried-flower-lot.webp` |
| Oil / distillate | `public/marketplace/images/skus/oil-distillate.webp` |
| Isolate | `public/marketplace/images/skus/isolate-jar.webp` |
| Softgels | `public/marketplace/images/skus/softgels.webp` |
| Oral tincture | `public/marketplace/images/skus/oral-tincture.webp` |
| Empty vape hardware | `public/marketplace/images/skus/vape-hardware-empty.webp` |

After files exist, set matching keys in `app/marketplace/consumables/image-manifest.ts` to `status: 'ready'`.

Rules for imagery:

- Class: illustrative only (`HARBOURVIEW_ILLUSTRATIVE`)
- Rights: `HARBOURVIEW_CREATED`
- No logos, fake certs, or seller identity
- Empty packaging preferred for consumables; no consumer medical claims

## 3. Optional: link images in `marketplace_item_images`

After listings exist and public URLs are live (CDN or site origin), run the template in:

```text
supabase/seeds/marketplace_catalogue_v2_images.sql
```

Replace `https://harbourview.vercel.app` if the production asset host differs.

## 4. Production check

1. https://harbourview.vercel.app/dashboard?page=marketplace
2. Confirm cards show titles/prices from catalogue SKUs
3. Confirm no private fields (seller contact, source_url, scores) on public surfaces

## Policy notes

- Do **not** mark these rows `verification_status = verified` or claim a licensed producer.
- Do **not** seed `supplier_profiles` with fabricated verified businesses.
- Cannabis format rows are catalogue slots for market-fit screening; commercial docs stay behind qualification.
