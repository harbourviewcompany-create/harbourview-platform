-- Genetics Dealflow V1
-- Adds controlled deal lifecycle tracking on top of genetics routing operations.

alter table genetics_routing_records
add column if not exists deal_status text not null default 'not_started';

alter table genetics_routing_records
add column if not exists deal_value_estimate text;

alter table genetics_routing_records
add column if not exists last_deal_event_at timestamptz;

alter table genetics_routing_records
add column if not exists intro_email_subject text;

alter table genetics_routing_records
add column if not exists intro_email_body text;

create index if not exists idx_genetics_routing_records_deal_status
on genetics_routing_records(deal_status);

alter table genetics_routing_records
add constraint genetics_routing_records_deal_status_check
check (deal_status in (
  'not_started',
  'introduced',
  'engaged',
  'negotiating',
  'closed_won',
  'closed_lost',
  'archived'
));
