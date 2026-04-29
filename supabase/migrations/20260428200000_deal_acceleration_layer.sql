-- Harbourview Marketplace deal acceleration layer
-- Purpose: make matches operationally useful for consistent revenue.
-- Adds next action, due dates, priority, confidence and stale tracking.

alter table public.matches
  add column if not exists next_action text,
  add column if not exists next_action_due_at timestamptz,
  add column if not exists priority_score integer not null default 50,
  add column if not exists close_probability integer,
  add column if not exists last_touch_at timestamptz,
  add column if not exists deal_owner text default 'Tyler Campbell',
  add column if not exists blockers text,
  add column if not exists buyer_status text,
  add column if not exists seller_status text;

alter table public.matches
  drop constraint if exists matches_priority_score_check,
  add constraint matches_priority_score_check check (priority_score between 0 and 100);

alter table public.matches
  drop constraint if exists matches_close_probability_check,
  add constraint matches_close_probability_check check (close_probability is null or close_probability between 0 and 100);

create index if not exists matches_acceleration_idx
  on public.matches (status, priority_score desc, next_action_due_at asc nulls last, updated_at desc);

create index if not exists matches_due_today_idx
  on public.matches (next_action_due_at)
  where status not in ('closed_won', 'closed_lost');

-- Dashboard view for the close desk. Admin-only by convention because it includes internal deal data.
drop view if exists public.deal_close_desk_view;
create view public.deal_close_desk_view as
select
  m.id,
  m.status,
  m.listing_id,
  l.title as listing_title,
  m.buyer_request_id,
  br.title as buyer_request_title,
  m.inquiry_id,
  m.success_fee_amount,
  m.success_fee_currency,
  m.monetization_path,
  m.next_action,
  m.next_action_due_at,
  m.priority_score,
  m.close_probability,
  m.last_touch_at,
  m.deal_owner,
  m.blockers,
  m.buyer_status,
  m.seller_status,
  m.intro_summary,
  m.created_at,
  m.updated_at,
  case
    when m.status in ('closed_won', 'closed_lost') then false
    when m.next_action_due_at is null then true
    when m.next_action_due_at <= now() then true
    else false
  end as needs_attention,
  case
    when m.status in ('closed_won', 'closed_lost') then false
    when coalesce(m.last_touch_at, m.created_at) < now() - interval '3 days' then true
    else false
  end as is_stale
from public.matches m
left join public.listings l on l.id = m.listing_id
left join public.buyer_requests br on br.id = m.buyer_request_id;
