-- New Products equipment intake extension.
-- Extends the private source_registry -> source_snapshots -> marketplace_candidates pipeline.
-- No autonomous scraping. No automatic public publication.

alter table public.marketplace_candidates
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists image_status text,
  add column if not exists image_attribution text,
  add column if not exists image_allowed_use text,
  add column if not exists image_reviewed_at timestamptz;

alter table public.marketplace_candidates
  drop constraint if exists marketplace_candidates_type_check,
  drop constraint if exists marketplace_candidates_category_check,
  drop constraint if exists marketplace_candidates_subcategory_check,
  drop constraint if exists marketplace_candidates_listing_type_check,
  drop constraint if exists marketplace_candidates_image_status_check,
  drop constraint if exists marketplace_candidates_reviewed_image_check;

alter table public.marketplace_candidates
  add constraint marketplace_candidates_type_check check (
    candidate_type in (
      'source_candidate',
      'consumables_supply',
      'supplier_directory',
      'wanted_consumables_request',
      'equipment_supply',
      'equipment_supplier_listing'
    )
  ),
  add constraint marketplace_candidates_category_check check (
    marketplace_category in ('Consumables & Operating Supplies', 'New Products')
  ),
  add constraint marketplace_candidates_subcategory_check check (
    subcategory is null
    or subcategory in (
      'Packaging',
      'Lab & QA Supplies',
      'Cultivation Supplies',
      'Processing Supplies',
      'Sanitation & PPE',
      'Logistics & Warehouse Supplies',
      'Retail Supplies',
      'Maintenance Consumables',
      'Extraction Equipment',
      'Cultivation Equipment',
      'Packaging Equipment',
      'Post-Harvest Equipment',
      'Climate Control Equipment',
      'Processing Equipment',
      'Facility Infrastructure',
      'Lab Equipment'
    )
  ),
  add constraint marketplace_candidates_listing_type_check check (
    listing_type is null
    or listing_type in (
      'Supply Listing',
      'Supplier Directory Entry',
      'Wanted Consumables Request',
      'Equipment Listing',
      'Supplier Equipment Listing',
      'Equipment Inquiry Candidate'
    )
  ),
  add constraint marketplace_candidates_image_status_check check (
    image_status is null
    or image_status in ('supplier_provided', 'licensed_stock', 'public_source_reviewed', 'verified')
  ),
  add constraint marketplace_candidates_reviewed_image_check check (
    image_url is null
    or (
      length(trim(image_url)) > 0
      and length(trim(coalesce(image_alt, ''))) > 0
      and image_status in ('supplier_provided', 'licensed_stock', 'public_source_reviewed', 'verified')
      and length(trim(coalesce(image_attribution, ''))) > 0
      and length(trim(coalesce(image_allowed_use, ''))) > 0
      and image_reviewed_at is not null
    )
  );

comment on column public.marketplace_candidates.image_url is 'Private reviewed candidate image URL. Projected publicly only after validation.';
comment on column public.marketplace_candidates.image_alt is 'Private reviewed candidate image alt text used for safe public projection.';
comment on column public.marketplace_candidates.image_status is 'Private candidate image review status.';
comment on column public.marketplace_candidates.image_attribution is 'Private image attribution and rights note. Not rendered publicly in V1.';
comment on column public.marketplace_candidates.image_allowed_use is 'Private image allowed-use review note. Not rendered publicly in V1.';
comment on column public.marketplace_candidates.image_reviewed_at is 'Private timestamp proving image review occurred before public projection.';
