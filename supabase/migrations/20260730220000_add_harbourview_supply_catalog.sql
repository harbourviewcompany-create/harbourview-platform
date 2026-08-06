-- Harbourview Supply catalog schema.
-- The supply surface uses a dedicated public DTO and does not replace or
-- expand the canonical marketplace_public_listings_v1 contract.

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

-- These partial natural keys make the two seed migrations deterministic.
-- Their existing ON CONFLICT DO NOTHING clauses now prevent duplicate rows
-- when a migration is replayed against an environment containing the catalog.
create unique index if not exists listings_supply_slug_unique_idx
  on public.listings (slug)
  where sold_by_harbourview = true and slug is not null;

create unique index if not exists listings_supply_sku_unique_idx
  on public.listings (sku)
  where sold_by_harbourview = true and sku is not null;

comment on column public.listings.sold_by_harbourview is
  'Internal catalog discriminator. Public supply access is provided only through api.supply_catalog_public_v1.';
comment on column public.listings.compliance_flags is
  'Internal structured attributes requiring review. Raw values are not exposed by the public supply DTO.';
comment on column public.listings.target_countries is
  'ISO country codes proposed for jurisdiction review; not a public compliance conclusion.';

create or replace view api.supply_catalog_public_v1 as
select
  l.id,
  l.slug,
  l.title,
  case l.category::text
    when 'packaging' then 'Unbranded packaging format available for commercial review and quotation.'
    when 'consumables' then 'Commercial consumable available for specification review and quotation.'
    when 'cultivation_equipment' then 'Generic cultivation equipment available for configuration review and quotation.'
    when 'processing_equipment' then 'Generic processing equipment available for configuration review and quotation.'
    when 'labs_testing' then 'Laboratory or testing equipment available for specification review and quotation.'
    else 'Supply catalog item available for specification review and quotation.'
  end::text as description,
  l.category::text as category,
  coalesce(l.marketplace_section, l.category::text)::text as marketplace_section,
  l.product_type,
  l.region::text as region,
  coalesce(l.price_currency, 'CAD')::text as price_currency,
  'Quote required'::text as price_display,
  coalesce(l.is_featured, false) as is_featured,
  l.created_at,
  l.sku,
  l.unit,
  null::text as moq_display,
  null::text as lead_time_display,
  'Subject to confirmation'::text as availability_status,
  coalesce(l.target_countries, '{}'::text[]) as target_countries,
  coalesce(
    (
      select jsonb_agg(attribute order by attribute->>'label')
      from (
        select jsonb_build_object(
          'key', allowed.attribute_key,
          'label', allowed.attribute_label,
          'value', 'Review required'
        ) as attribute
        from (values
          ('child_resistant', 'Child-resistant format'),
          ('tamper_evident', 'Tamper-evident format'),
          ('opaque', 'Opaque format')
        ) allowed(attribute_key, attribute_label)
        where exists (
          select 1
          from jsonb_each(coalesce(l.compliance_flags, '{}'::jsonb)) country_entry
          where coalesce((country_entry.value ->> allowed.attribute_key)::boolean, false) = true
        )
      ) attributes
    ),
    '[]'::jsonb
  ) as public_attributes,
  'Attributes, availability, pricing, lead time and jurisdiction fit require Harbourview review before reliance or purchase.'::text as review_note
from public.listings l
where l.sold_by_harbourview = true
  -- Cast dropped 2026-08-05. This file is repository-only -- the live ledger has
  -- no row at 20260730220000 -- and production built the same surface as
  -- 20260730211141 + 20260730211147, whose recorded view writes this predicate
  -- with a bare literal and no cast:
  --   where l.sold_by_harbourview = true
  --     and l.status = 'approved'
  --     and l.public_visibility = true;
  -- The ::listing_status cast was therefore never production's contract, and it
  -- fails zero-state replay because the repository builds public.listings with
  -- `status text` (20260528033000) while production's column is the enum:
  --   ERROR: operator does not exist: text = listing_status (SQLSTATE 42883)
  -- A bare unknown-typed literal resolves against either type, so this matches
  -- production today and stays correct if the column is ever made the enum.
  and l.status = 'approved'
  and l.public_visibility = true
  and l.archived_at is null
  and l.slug is not null
  and l.sku is not null;

comment on view api.supply_catalog_public_v1 is
  'Allowlisted public supply DTO excluding exact stock, raw compliance metadata, supplier identity, brand/model and internal review data.';

grant select on api.supply_catalog_public_v1 to anon, authenticated;
