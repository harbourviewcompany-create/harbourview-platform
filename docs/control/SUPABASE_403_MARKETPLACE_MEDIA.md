# Supabase 403 / empty marketplace media — diagnosis

## 1. Storage image transforms (`/storage/v1/render/image/...`)

**Response:** `403 FeatureNotEnabled` — `feature not enabled for this tenant`

**Meaning:** Supabase Image Transformation is not enabled on project `zvxdgdkukjrrwamdpqrg`.

**Do not use** render URLs for card assets. Use:

- `https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/...` (works, HTTP 200)
- Next.js `<Image>` remote optimization (`next.config.mjs` already allows this host + WebP/AVIF)

## 2. REST enrichment against wrong schema

`marketplace_item_images` and `marketplace_item_card_media_v1` are in **`public`**.

App-wide `SUPABASE_DB_SCHEMA = 'api'` is correct for most app tables, but **must not** be sent as `Accept-Profile: api` for these image objects. That yields empty/failed enrichment and cards fall back to representative images.

**Fix:** `lib/marketplace/images/public-query.ts` uses `Accept-Profile: public` (same idea as `listingsQuery` for `marketplace_public_listings_v1`).

## 3. Card media view not applied

Migration: `supabase/migrations/20260822150000_marketplace_item_card_media_v1.sql`

Until applied:

```bash
npm run db:push
```

the card-media fast path returns non-OK and the code falls back to full `marketplace_item_images` rows (still works if public schema headers are correct).

## Quick checks

```bash
# Public object — should be 200
curl -sI "https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/representative/v6/dried-flower.png" | head -1

# Transform — expected 403 FeatureNotEnabled on this plan
curl -s "https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/render/image/public/marketplace-item-public/representative/v6/dried-flower.png?width=400"
```
