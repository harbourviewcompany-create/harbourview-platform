-- Harbourview Marketplace deal follow-up control layer
-- Purpose: make stale or ownerless deals visible before they are lost.

alter table public.matches
  add column if not exists priority text not null default 'normal',
  add column if not exists next_action text,
  add column if not exists next_action_due_at timestamptz,
  add column if not exists owner_name text,
  add column if not exists last_touch_at timestamptz,
  add column if not exists stalled_reason text;

alter table public.matches
  drop constraint if exists matches_priority_check,
  add constraint matches_priority_check
    check (priority in ('low','normal','high','urgent'));

create index if not exists matches_followup_due_idx
  on public.matches (next_action_due_at asc)
  where status not in ('closed_won','closed_lost');

create index if not exists matches_priority_status_idx
  on public.matches (priority, status, updated_at desc);

drop view if exists public.marketplace_deal_attention_view;
create view public.marketplace_deal_attention_view as
select
  id,
  status,
  priority,
  owner_name,
  next_action,
  next_action_due_at,
  last_touch_at,
  success_fee_amount,
  success_fee_currency,
  monetization_path,
  listing_id,
  buyer_request_id,
  inquiry_id,
  created_at,
  updated_at,
  case
    when status in ('closed_won','closed_lost') then false
    when next_action_due_at is null then true
    when next_action_due_at <= now() then true
    when last_touch_at is null and created_at < now() - interval '2 days' then true
    when updated_at < now() - interval '7 days' then true
    else false
  end as needs_attention,
  case
    when status in ('closed_won','closed_lost') then 'closed'
    when next_action_due_at is null then 'missing_next_action'
    when next_action_due_at <= now() then 'overdue_next_action'
    when last_touch_at is null and created_at < now() - interval '2 days' then 'never_touched'
    when updated_at < now() - interval '7 days' then 'stale'
    else 'current'
  end as attention_reason
from public.matches;

grant select on public.marketplace_deal_attention_view to authenticated;
