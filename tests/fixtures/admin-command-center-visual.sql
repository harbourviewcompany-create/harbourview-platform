create schema if not exists api;
grant usage on schema api to anon, authenticated, service_role;

create table public.user_roles (
  user_id uuid not null,
  role text not null,
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
create policy user_roles_self_read on public.user_roles for select to authenticated using (user_id = auth.uid());
grant select on public.user_roles to authenticated, service_role;
grant insert, update, delete on public.user_roles to service_role;

create table public.hv_admin_review_queue (
  id uuid primary key default gen_random_uuid(),
  queue_type text not null,
  target_entity_type text not null,
  target_entity_id text not null,
  assigned_to text,
  priority integer not null default 50,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  resolved_at timestamptz
);

create table public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inquiry_type text,
  contact_company text,
  contact_name text,
  message text,
  review_status text,
  priority text,
  next_follow_up_at timestamptz
);

create table public.marketplace_candidates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  discovered_at timestamptz,
  candidate_type text,
  status text,
  title_internal text,
  title_public_draft text,
  country text,
  region text,
  jurisdiction text
);

create table public.scraper_source_state (
  source_id text primary key,
  consecutive_failures integer not null default 0,
  last_error text,
  last_success_at timestamptz,
  last_run_at timestamptz
);

create table public.pipeline_tasks (
  id uuid primary key default gen_random_uuid(),
  queue_name text,
  task_type text,
  status text,
  priority integer,
  attempts integer,
  max_attempts integer,
  last_error text,
  created_at timestamptz not null default now(),
  available_at timestamptz
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  actor_user_id uuid
);

create table public.signals (
  id text primary key,
  date timestamptz,
  cat text,
  headline text not null,
  summary text,
  source text,
  url text,
  verification text,
  tier text,
  lang text,
  country text,
  score integer,
  reviewed boolean not null default false,
  action text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  pri text,
  top_lane text
);

grant select, insert, update, delete on public.hv_admin_review_queue, public.marketplace_inquiries,
  public.marketplace_candidates, public.scraper_source_state, public.pipeline_tasks, public.audit_events,
  public.signals to service_role;

-- Harbourview's application clients are locked to the exposed api schema. The
-- isolated visual fixture mirrors the production proxy-view architecture rather
-- than allowing tests to succeed through direct public-schema access.
create view api.hv_admin_review_queue with (security_invoker = true) as select * from public.hv_admin_review_queue;
create view api.marketplace_inquiries with (security_invoker = true) as select * from public.marketplace_inquiries;
create view api.marketplace_candidates with (security_invoker = true) as select * from public.marketplace_candidates;
create view api.scraper_source_state with (security_invoker = true) as select * from public.scraper_source_state;
create view api.pipeline_tasks with (security_invoker = true) as select * from public.pipeline_tasks;
create view api.audit_events with (security_invoker = true) as select * from public.audit_events;
grant select on api.hv_admin_review_queue, api.marketplace_inquiries, api.marketplace_candidates,
  api.scraper_source_state, api.pipeline_tasks, api.audit_events to service_role;
grant insert on api.audit_events to service_role;

create or replace function api.list_engine_review_queue(
  p_country text default null,
  p_min_score int default 0,
  p_limit int default 50
) returns table(
  id text, date timestamptz, cat text, headline text, summary text, source text, url text,
  verification text, tier text, lang text, country text, score int, reviewed boolean, action text,
  reviewed_by text, reviewed_at timestamptz, created_at timestamptz
) language sql security definer set search_path = public as $$
  select s.id,s.date,s.cat,s.headline,s.summary,s.source,s.url,s.verification,s.tier,s.lang,s.country,s.score,
    s.reviewed,s.action,s.reviewed_by,s.reviewed_at,s.created_at
  from public.signals s
  where s.cat='SOURCE_ENGINE' and s.reviewed is not true
    and (s.action is null or s.action <> 'rejected')
    and coalesce(s.score,0) >= p_min_score
    and (p_country is null or s.country=p_country)
  order by s.score desc nulls last, s.date desc nulls last
  limit p_limit;
$$;

create or replace function api.count_engine_review_queue(p_country text default null, p_min_score int default 0)
returns int language sql security definer set search_path = public as $$
  select count(*)::int from public.signals s where s.cat='SOURCE_ENGINE' and s.reviewed is not true
    and (s.action is null or s.action <> 'rejected') and coalesce(s.score,0)>=p_min_score
    and (p_country is null or s.country=p_country);
$$;

create or replace function api.list_engine_review_countries()
returns table(country text) language sql security definer set search_path = public as $$
  select distinct s.country from public.signals s where s.cat='SOURCE_ENGINE' and s.reviewed is not true and s.country is not null order by s.country;
$$;

create or replace function api.approve_engine_signal(p_id text, p_user_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin update public.signals set reviewed=true,action='approved',reviewed_by=p_user_id,reviewed_at=now() where id=p_id; return found; end $$;

create or replace function api.reject_engine_signal(p_id text, p_user_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin update public.signals set reviewed=false,action='rejected',reviewed_by=p_user_id,reviewed_at=now() where id=p_id; return found; end $$;

create or replace function api.bulk_approve_engine_queue(p_country text default null,p_min_score int default 0,p_user_id text default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int; begin
  update public.signals s set reviewed=true,action='approved',reviewed_by=p_user_id,reviewed_at=now()
  where s.cat='SOURCE_ENGINE' and s.reviewed is not true and coalesce(s.score,0)>=p_min_score and (p_country is null or s.country=p_country);
  get diagnostics v_count=row_count; return v_count;
end $$;

grant execute on function api.list_engine_review_queue to service_role;
grant execute on function api.count_engine_review_queue to service_role;
grant execute on function api.list_engine_review_countries to service_role;
grant execute on function api.approve_engine_signal to service_role;
grant execute on function api.reject_engine_signal to service_role;
grant execute on function api.bulk_approve_engine_queue to service_role;

insert into public.signals(id,date,cat,headline,summary,source,country,score,pri,top_lane)
values
  ('00000000-0000-4000-8000-000000000101', now()-interval '1 hour','SOURCE_ENGINE','Germany medical-cannabis import pathway changed','Engine fixture for responsive operator review.','Federal Gazette','DE',91,'URGENT','Regulatory'),
  ('00000000-0000-4000-8000-000000000102', now()-interval '3 hours','SOURCE_ENGINE','EU-GMP supply signal requires review','Second engine fixture with a long headline to verify mobile wrapping and queue density.','Official source','EU',74,'HIGH','Trade'),
  ('00000000-0000-4000-8000-000000000103', now()-interval '1 day','SOURCE_ENGINE','Routine monitored market update','Normal-priority fixture.','Official source','GB',52,'MONITOR','Economic');

insert into public.hv_admin_review_queue(queue_type,target_entity_type,target_entity_id,priority,status,notes,created_at)
values ('signal_review','engine_signal','00000000-0000-4000-8000-000000000101',5,'pending','Urgent persistent signal review assignment',now()-interval '2 hours');

insert into public.marketplace_inquiries(inquiry_type,contact_company,contact_name,message,review_status,priority,created_at)
values ('quote_request','EU Importer GmbH','Visual Operator','Qualified inbound request requires operator follow-up.','received','high',now()-interval '5 hours');

insert into public.marketplace_candidates(candidate_type,status,title_internal,country,created_at)
values
  ('source_supported','needs_review','EU-GMP flower supply candidate','DE',now()-interval '6 hours'),
  ('intake_form','needs_review','New marketplace intake submission','GB',now()-interval '4 hours');

insert into public.scraper_source_state(source_id,consecutive_failures,last_error,last_run_at)
values ('visual-source-degraded',2,'HTTP 503 during last collection attempt',now()-interval '30 minutes');

insert into public.pipeline_tasks(queue_name,task_type,status,priority,attempts,max_attempts,last_error,created_at)
values ('intelligence','extract','failed',20,2,5,'Fixture extraction failure',now()-interval '45 minutes');
