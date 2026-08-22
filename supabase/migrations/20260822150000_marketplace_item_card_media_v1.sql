-- One approved public card image per marketplace item.
-- Prefer REAL_ITEM_EVIDENCE, then MANUFACTURER_CATALOGUE, then HARBOURVIEW_ILLUSTRATIVE.
-- Used by dashboard projection to avoid multi-row enrichment when only a card hero is needed.

create or replace view public.marketplace_item_card_media_v1
with (security_invoker = true)
as
select distinct on (m.item_id)
  m.item_id,
  m.id as image_id,
  m.image_class,
  m.image_role,
  m.public_url,
  m.thumbnail_url,
  m.hero_url,
  m.gallery_url,
  m.alt_text,
  m.caption,
  m.is_illustrative,
  m.source_name
from public.marketplace_item_images m
where m.review_status = 'APPROVED_PUBLIC'
  and m.rights_status <> 'UNKNOWN'
  and m.image_class <> 'ADMIN_PRIVATE_EVIDENCE'
  and (
    m.public_url is not null
    or m.thumbnail_url is not null
    or m.hero_url is not null
    or m.gallery_url is not null
  )
order by
  m.item_id,
  case m.image_class
    when 'REAL_ITEM_EVIDENCE' then 0
    when 'MANUFACTURER_CATALOGUE' then 1
    when 'HARBOURVIEW_ILLUSTRATIVE' then 2
    else 3
  end,
  case m.image_role
    when 'CARD' then 0
    when 'HERO' then 1
    when 'GALLERY' then 2
    when 'DETAIL' then 3
    else 4
  end,
  m.id;

comment on view public.marketplace_item_card_media_v1 is
  'Best single public card image per marketplace item_id. Prefer real-item evidence over catalogue over illustrative.';

grant select on public.marketplace_item_card_media_v1 to anon, authenticated;
