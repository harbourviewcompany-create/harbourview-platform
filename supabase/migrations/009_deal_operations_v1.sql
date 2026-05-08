-- Deal Operations V1
-- Adds operator assignment, next-action tracking, stale escalation and communication timeline support.

alter table genetics_routing_records
add column if not exists assigned_operator text;

alter table genetics_routing_records
add column if not exists next_action_due_at timestamptz;

alter table genetics_routing_records
add column if not exists follow_up_reminder_at timestamptz;

alter table genetics_routing_records
add column if not exists urgency_score integer not null default 0 check (urgency_score between 0 and 100);

alter table genetics_routing_records
add column if not exists stale_escalated boolean not null default false;

alter table genetics_routing_records
add column if not exists internal_notes text;

alter table genetics_routing_events
add column if not exists communication_channel text;

alter table genetics_routing_events
add column if not exists direction text;

alter table genetics_routing_events
add column if not exists next_action_due_at timestamptz;

create index if not exists idx_genetics_routing_records_assigned_operator
on genetics_routing_records(assigned_operator);

create index if not exists idx_genetics_routing_records_next_action_due_at
on genetics_routing_records(next_action_due_at);

create index if not exists idx_genetics_routing_records_urgency_score
on genetics_routing_records(urgency_score desc);

create index if not exists idx_genetics_routing_records_stale_escalated
on genetics_routing_records(stale_escalated);
