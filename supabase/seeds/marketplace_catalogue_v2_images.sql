-- Harbourview Marketplace Catalogue V2 — illustrative image links
-- Run AFTER marketplace_catalogue_v2.sql and AFTER WebP files are deployed to production.
--
-- Adjust base_url if assets are not served from the production site origin.
-- Requires public.marketplace_item_images (image trust layer).

with base as (
  select 'https://harbourview.vercel.app'::text as origin
),
map as (
  select * from (values
    ('sku-dried-flower-indoor-premium-001', '/marketplace/images/skus/dried-flower-lot.webp', 'Illustrative dried flower catalogue packaging'),
    ('sku-dried-flower-greenhouse-commercial-001', '/marketplace/images/skus/dried-flower-lot.webp', 'Illustrative greenhouse flower catalogue packaging'),
    ('sku-biomass-trim-extraction-001', '/marketplace/images/hemp-biomass.webp', 'Illustrative biomass feedstock imagery'),
    ('sku-oil-co2-crude-001', '/marketplace/images/skus/oil-distillate.webp', 'Illustrative CO2 oil sample bottles'),
    ('sku-distillate-thc-refined-001', '/marketplace/images/skus/oil-distillate.webp', 'Illustrative distillate sample bottles'),
    ('sku-cbd-isolate-98-001', '/marketplace/images/skus/isolate-jar.webp', 'Illustrative isolate laboratory jars'),
    ('sku-thc-isolate-formulation-001', '/marketplace/images/skus/isolate-jar.webp', 'Illustrative isolate laboratory jars'),
    ('sku-softgels-thc-cbd-001', '/marketplace/images/skus/softgels.webp', 'Illustrative softgel capsules'),
    ('sku-oral-tincture-dropper-001', '/marketplace/images/skus/oral-tincture.webp', 'Illustrative oral dropper bottles'),
    ('sku-topical-balm-001', '/marketplace/images/product-inventory.webp', 'Illustrative topical product packaging'),
    ('sku-preroll-finished-unbranded-001', '/images/consumables/pre-roll-cones-king-size.webp', 'Illustrative pre-roll packaging'),
    ('sku-vape-empty-cartridge-001', '/marketplace/images/skus/vape-hardware-empty.webp', 'Illustrative empty vape hardware'),
    ('sku-seeds-feminised-commercial-001', '/marketplace/images/product-inventory.webp', 'Illustrative genetics catalogue imagery'),
    ('sku-cuttings-tissue-culture-001', '/marketplace/images/product-inventory.webp', 'Illustrative tissue culture catalogue imagery'),
    ('sku-consumable-preroll-cones-king-001', '/images/consumables/pre-roll-cones-king-size.webp', 'Unbranded king-size pre-roll cones'),
    ('sku-consumable-cr-pouches-matte-001', '/images/consumables/matte-child-resistant-pouches.webp', 'Unbranded matte CR stand-up pouches'),
    ('sku-consumable-glass-jars-premium-001', '/images/consumables/premium-glass-jars.webp', 'Unbranded premium glass jars'),
    ('sku-consumable-opaque-jars-sizes-001', '/images/consumables/opaque-flower-jars.webp', 'Unbranded opaque retail jars'),
    ('sku-consumable-preroll-tubes-cr-001', '/images/consumables/cr-preroll-tubes.webp', 'Unbranded CR pre-roll tubes'),
    ('sku-consumable-labels-tamper-001', '/images/consumables/roll-labels-tamper-seals.webp', 'Unbranded roll labels and tamper seals'),
    ('sku-consumable-retail-cartons-001', '/images/consumables/custom-retail-cartons.webp', 'Unbranded retail cartons'),
    ('sku-consumable-shipping-cartons-001', '/images/consumables/shipping-cartons.webp', 'Unbranded shipping cartons'),
    ('sku-consumable-facility-gloves-wipes-001', '/marketplace/images/facility-supplies.webp', 'Facility consumables imagery'),
    ('sku-consumable-substrate-media-bulk-001', '/marketplace/images/cultivation-inputs.webp', 'Growth media consumables imagery'),
    ('sku-consumable-nutrients-commercial-001', '/marketplace/images/cultivation-inputs.webp', 'Nutrient concentrate imagery'),
    ('sku-consumable-softgel-shells-001', '/marketplace/images/skus/softgels.webp', 'Empty softgel component imagery')
  ) as t(slug, path, alt)
),
resolved as (
  select
    l.id as item_id,
    m.slug,
    m.alt,
    (select origin from base) || m.path as public_url
  from map m
  join public.listings l on l.slug = m.slug
)
insert into public.marketplace_item_images (
  item_id,
  image_class,
  image_role,
  review_status,
  rights_status,
  source_type,
  public_url,
  thumbnail_url,
  hero_url,
  gallery_url,
  alt_text,
  caption,
  is_evidence_image,
  is_illustrative,
  reviewed_at
)
select
  r.item_id,
  'HARBOURVIEW_ILLUSTRATIVE',
  'CARD',
  'APPROVED_PUBLIC',
  'HARBOURVIEW_CREATED',
  'HARBOURVIEW_CREATED',
  r.public_url,
  r.public_url,
  r.public_url,
  r.public_url,
  r.alt,
  'Illustrative catalogue image — not item evidence',
  false,
  true,
  now()
from resolved r
where not exists (
  select 1
  from public.marketplace_item_images i
  where i.item_id = r.item_id
    and i.image_role = 'CARD'
    and i.review_status = 'APPROVED_PUBLIC'
);
