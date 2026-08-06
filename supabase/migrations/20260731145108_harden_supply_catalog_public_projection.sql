-- Harden Harbourview Supply after the original live-first catalog migration.
-- This migration is intentionally additive and safe on environments where the
-- three PR #1222 migrations were already applied.

-- Remove duplicate Harbourview-direct rows before enforcing natural keys.
with ranked as (
  select id,
         row_number() over (
           partition by slug
           order by updated_at desc nulls last, created_at desc nulls last, id
         ) as rn
  from public.listings
  where sold_by_harbourview = true and slug is not null
)
delete from public.listings l
using ranked r
where l.id = r.id and r.rn > 1;

with ranked as (
  select id,
         row_number() over (
           partition by sku
           order by updated_at desc nulls last, created_at desc nulls last, id
         ) as rn
  from public.listings
  where sold_by_harbourview = true and sku is not null
)
delete from public.listings l
using ranked r
where l.id = r.id and r.rn > 1;

create unique index if not exists listings_supply_slug_unique_idx
  on public.listings (slug)
  where sold_by_harbourview = true and slug is not null;

create unique index if not exists listings_supply_sku_unique_idx
  on public.listings (sku)
  where sold_by_harbourview = true and sku is not null;

alter table public.listings
  drop constraint if exists listings_supply_stock_nonnegative,
  add constraint listings_supply_stock_nonnegative
    check (not sold_by_harbourview or stock_qty is null or stock_qty >= 0) not valid,
  drop constraint if exists listings_supply_lead_time_nonnegative,
  add constraint listings_supply_lead_time_nonnegative
    check (not sold_by_harbourview or lead_time_days is null or lead_time_days >= 0) not valid,
  drop constraint if exists listings_supply_moq_positive,
  add constraint listings_supply_moq_positive
    check (not sold_by_harbourview or moq is null or moq > 0) not valid,
  drop constraint if exists listings_supply_target_country_codes,
  add constraint listings_supply_target_country_codes
    check (
      not sold_by_harbourview
      or target_countries <@ array[
        'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
        'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ',
        'CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ',
        'DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR',
        'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY',
        'HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP',
        'KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
        'MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
        'NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY',
        'QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ',
        'TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ',
        'VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'
      ]::text[]
    ) not valid;

-- Remove internal third-party reference naming from public-facing seed data.
update public.listings
set title = case slug
    when 'twister-t2-pre-roll-machine' then 'Compact Automated Pre-Roll Machine'
    when 'twister-t4-pre-roll-machine' then 'Mid-Volume Automated Pre-Roll Machine'
    when 'twister-t6-pre-roll-machine' then 'Commercial Automated Pre-Roll Machine'
    else title
  end,
  brand = null,
  model = null,
  updated_at = now()
where sold_by_harbourview = true
  and slug in (
    'twister-t2-pre-roll-machine',
    'twister-t4-pre-roll-machine',
    'twister-t6-pre-roll-machine'
  );

-- Dedicated allowlisted public DTO. It does not expose raw descriptions,
-- exact stock, supplier identity, internal quantity, raw compliance JSON,
-- brand/model, exact lead times, or unverified compliance conclusions.
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
          'key', attribute_key,
          'label', attribute_label,
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
          where coalesce((country_entry.value ->> attribute_key)::boolean, false) = true
        )
      ) attributes
    ),
    '[]'::jsonb
  ) as public_attributes,
  'Attributes, availability, pricing, lead time and jurisdiction fit require Harbourview review before reliance or purchase.'::text as review_note
from public.listings l
where l.sold_by_harbourview = true
  -- Replay deviation from the recorded body, added 2026-08-05. This file IS
  -- ledger-recorded and its recorded statement casts the literal:
  --   and l.status = 'approved'::listing_status
  -- That works in production, whose public.listings.status is the
  -- listing_status enum. The repository's listings.status is text, so zero-state
  -- replay fails:
  --   ERROR: operator does not exist: text = listing_status (SQLSTATE 42883)
  --
  -- Casting the column instead of the literal keeps the predicate identical in
  -- both worlds -- it selects exactly the same rows against a text column and
  -- against production's enum -- without changing which rows this view exposes.
  --
  -- Converting the column to the enum was implemented and then rejected as the
  -- riskier fix. Production's listings was created entirely outside the ledger
  -- and is a different table from the repository's, which carries columns
  -- production does not have (listing_type, visibility, subcategory), so this
  -- one column is not meaningfully "behind" production. Converting requires
  -- dropping and recreating every dependent view, and four view-creating
  -- migrations compare status to a literal -- pg_get_viewdef bakes the resolved
  -- 'x'::text cast into the stored definition, so replaying those definitions
  -- against a converted column fails. That is four views put at risk to satisfy
  -- one predicate; this migration is the only remaining consumer of the cast.
  and l.status::text = 'approved'
  and l.public_visibility = true
  and l.archived_at is null
  and l.slug is not null
  and l.sku is not null;

comment on view api.supply_catalog_public_v1 is
  'Allowlisted public Harbourview Supply DTO. Excludes exact stock, raw compliance metadata, supplier identity, brand/model and internal review data.';

grant select on api.supply_catalog_public_v1 to anon, authenticated;
