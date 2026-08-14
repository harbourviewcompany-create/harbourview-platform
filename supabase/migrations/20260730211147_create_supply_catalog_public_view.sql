
create or replace view api.supply_catalog_v1
with (security_invoker = on) as
select
  l.id,
  l.slug,
  l.title,
  l.description,
  l.category,
  l.marketplace_section,
  l.sku,
  l.brand,
  l.model,
  l.condition,
  l.quantity,
  l.unit,
  l.price_amount,
  l.price_currency,
  l.price_range,
  l.stock_qty,
  l.lead_time_days,
  l.moq,
  l.compliance_flags,
  l.target_countries,
  l.is_featured,
  l.average_rating,
  l.review_count,
  l.created_at,
  l.updated_at
from public.listings l
where l.sold_by_harbourview = true
  and l.status = 'approved'
  and l.public_visibility = true;

grant select on api.supply_catalog_v1 to anon, authenticated;
