-- ============================================================
-- Harbourview Marketplace — Migration 003
-- Admin helper views
-- ============================================================

-- Pending review counts (for admin dashboard)
create or replace view admin_pending_counts as
select
  (select count(*) from listings where status = 'pending_review') as pending_listings,
  (select count(*) from buyer_requests where status = 'pending_review') as pending_buyer_requests,
  (select count(*) from marketplace_inquiries where status = 'new') as new_inquiries,
  (select count(*) from matches where status = 'proposed') as proposed_matches,
  (select count(*) from disclosure_requests where status = 'requested') as pending_disclosures;

-- Grant view to service role
grant select on admin_pending_counts to service_role;

-- Full audit trail for an entity (status history + audit events)
create or replace function entity_full_trail(p_entity_type entity_type, p_entity_id uuid)
returns table (
  occurred_at  timestamptz,
  source       text,
  action       text,
  actor        text,
  notes        text
)
language sql stable as $$
  select
    sh.created_at,
    'status_history',
    sh.from_status || ' → ' || sh.to_status,
    sh.changed_by,
    sh.reason
  from status_history sh
  where sh.entity_type = p_entity_type
    and sh.entity_id = p_entity_id
  union all
  select
    ae.created_at,
    'audit_event',
    ae.action,
    ae.actor,
    ae.metadata::text
  from audit_events ae
  where ae.entity_type = p_entity_type
    and ae.entity_id = p_entity_id
  order by 1 desc
$$;

grant execute on function entity_full_trail to service_role;
