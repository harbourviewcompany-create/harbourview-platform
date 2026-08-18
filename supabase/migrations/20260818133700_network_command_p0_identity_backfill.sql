begin;

-- Reuse reviewed/canonical links that already exist. No name-based or inferred
-- merges are performed here; unresolved source records remain unresolved.
insert into public.network_source_entity_links (
  source_kind, source_id, entity_id, resolution_status, resolution_method, confidence
)
select
  'cannabis_operator', co.id::text, co.entity_id, 'resolved', 'existing_bridge', 1.0
from public.cannabis_operators co
where co.entity_id is not null
on conflict (source_kind, source_id) do update
set entity_id = excluded.entity_id,
    resolution_status = 'resolved',
    resolution_method = 'existing_bridge',
    confidence = 1.0,
    updated_at = now();

insert into public.network_source_entity_links (
  source_kind, source_id, entity_id, resolution_status, resolution_method, confidence
)
select
  'ia_counterparty', c.id::text, c.entity_id, 'resolved', 'existing_bridge', 1.0
from public.ia_counterparties c
where c.entity_id is not null
on conflict (source_kind, source_id) do update
set entity_id = excluded.entity_id,
    resolution_status = 'resolved',
    resolution_method = 'existing_bridge',
    confidence = 1.0,
    updated_at = now();

insert into public.network_source_entity_links (
  source_kind, source_id, entity_id, resolution_status, resolution_method, confidence
)
select
  'operator_licence', ol.id::text, ol.entity_id, 'resolved', 'existing_bridge', 1.0
from public.operator_licences ol
where ol.entity_id is not null
on conflict (source_kind, source_id) do update
set entity_id = excluded.entity_id,
    resolution_status = 'resolved',
    resolution_method = 'existing_bridge',
    confidence = 1.0,
    updated_at = now();

commit;
