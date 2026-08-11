-- Harbourview native transaction system: Stage 6 authorization, safe views, audit hooks and controlled fixture staging.
-- No canonical transaction table is anonymously readable. Public exposure remains DTO/projection based.

create or replace function public.hv_has_transaction_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.user_roles ur
     where ur.user_id = auth.uid()
       and ur.role = any(allowed_roles)
  );
$$;

create or replace function public.hv_is_transaction_participant(target_transaction uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.transaction_parties tp
      join public.workspace_members wm on wm.workspace_id = tp.workspace_id
     where tp.transaction_id = target_transaction
       and tp.workspace_id is not null
       and wm.user_id = auth.uid()
       and wm.status = 'active'
       and (tp.valid_from is null or tp.valid_from <= now())
       and (tp.valid_to is null or tp.valid_to > now())
  );
$$;

create or replace function public.hv_is_specific_transaction_party(target_party uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.transaction_parties tp
      join public.workspace_members wm on wm.workspace_id = tp.workspace_id
     where tp.id = target_party
       and tp.workspace_id is not null
       and wm.user_id = auth.uid()
       and wm.status = 'active'
       and (tp.valid_from is null or tp.valid_from <= now())
       and (tp.valid_to is null or tp.valid_to > now())
  );
$$;

create or replace function public.hv_transaction_economics_key(
  network_key text,
  target_transaction uuid,
  target_metric public.hv_economics_metric_type,
  economic_event text,
  target_currency text
)
returns text
language sql
immutable
set search_path = public
as $$
  select concat_ws('|',
    'ECON',
    coalesce(nullif(btrim(network_key), ''), concat('TX|', target_transaction::text)),
    target_metric::text,
    lower(regexp_replace(btrim(economic_event), '\s+', '-', 'g')),
    upper(btrim(target_currency))
  );
$$;

alter table public.transaction_economics_entries
  add constraint transaction_economics_recognition_prefix_chk check (recognition_key like 'ECON|%');

revoke all on function public.hv_has_transaction_role(text[]) from public, anon;
revoke all on function public.hv_is_transaction_participant(uuid) from public, anon;
revoke all on function public.hv_is_specific_transaction_party(uuid) from public, anon;
revoke all on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) from public, anon;
grant execute on function public.hv_has_transaction_role(text[]) to authenticated, service_role;
grant execute on function public.hv_is_transaction_participant(uuid) to authenticated, service_role;
grant execute on function public.hv_is_specific_transaction_party(uuid) to authenticated, service_role;
grant execute on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) to authenticated, service_role;

-- Controlled workbook fixture staging. It stores source rows before reviewed canonical resolution.
create table public.transaction_import_staging (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null,
  record_kind text not null,
  source_workbook_hash text not null,
  source_sheet text not null,
  source_row_key text not null,
  payload jsonb not null,
  fixture_expected_counts jsonb not null default '{"master_records":165,"execution_packages":69,"economic_accounts":64,"transaction_networks":10}'::jsonb,
  validation_status text not null default 'pending',
  resolved_entity_id uuid references public.entities(id) on delete set null,
  resolved_account_id uuid references public.economic_accounts(id) on delete set null,
  resolved_network_id uuid references public.transaction_networks(id) on delete set null,
  resolved_transaction_id uuid references public.transactions(id) on delete set null,
  validation_errors jsonb not null default '[]'::jsonb,
  classification public.hv_classification not null default 'restricted',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint transaction_import_record_kind_chk check (
    record_kind in ('master_record','execution_package','economic_account','transaction_network')
  ),
  constraint transaction_import_validation_status_chk check (
    validation_status in ('pending','resolved','unresolved','conflicted','rejected')
  ),
  constraint transaction_import_hash_chk check (length(btrim(source_workbook_hash)) >= 32),
  unique (import_batch_id, record_kind, source_sheet, source_row_key)
);
create index transaction_import_staging_batch_idx on public.transaction_import_staging (import_batch_id, record_kind, validation_status);
create index transaction_import_staging_entity_idx on public.transaction_import_staging (resolved_entity_id) where resolved_entity_id is not null;
create index transaction_import_staging_account_idx on public.transaction_import_staging (resolved_account_id) where resolved_account_id is not null;

-- RLS is enabled before authenticated privileges are granted.
alter table public.entities enable row level security;
alter table public.entity_aliases enable row level security;
alter table public.entity_facilities enable row level security;
alter table public.products enable row level security;
alter table public.product_batches enable row level security;
alter table public.economic_accounts enable row level security;
alter table public.economic_account_members enable row level security;
alter table public.transaction_networks enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_parties enable row level security;
alter table public.assertions enable row level security;
alter table public.evidence_links enable row level security;
alter table public.diligence_requirements enable row level security;
alter table public.transaction_economics_entries enable row level security;
alter table public.transaction_decisions enable row level security;
alter table public.transaction_import_staging enable row level security;

-- Anonymous access to canonical transaction data is explicitly denied at the grant layer.
revoke all on table
  public.entities, public.entity_aliases, public.entity_facilities, public.products, public.product_batches,
  public.economic_accounts, public.economic_account_members, public.transaction_networks, public.transactions,
  public.transaction_parties, public.assertions, public.evidence_links, public.diligence_requirements,
  public.transaction_economics_entries, public.transaction_decisions, public.transaction_import_staging
from anon;

grant select, insert, update, delete on table
  public.entities, public.entity_aliases, public.entity_facilities, public.products, public.product_batches,
  public.economic_accounts, public.economic_account_members, public.transaction_networks, public.transactions,
  public.transaction_parties, public.assertions, public.evidence_links, public.diligence_requirements,
  public.transaction_decisions, public.transaction_import_staging
to authenticated;
grant select, insert on table public.transaction_economics_entries to authenticated;

grant all on table
  public.entities, public.entity_aliases, public.entity_facilities, public.products, public.product_batches,
  public.economic_accounts, public.economic_account_members, public.transaction_networks, public.transactions,
  public.transaction_parties, public.assertions, public.evidence_links, public.diligence_requirements,
  public.transaction_economics_entries, public.transaction_decisions, public.transaction_import_staging
to service_role;

-- Internal canonical tables: analysts/reviewers read, operators/admins write.
create policy entities_internal_read on public.entities for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy entities_internal_write on public.entities for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy entity_aliases_internal_read on public.entity_aliases for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy entity_aliases_internal_write on public.entity_aliases for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy entity_facilities_internal_read on public.entity_facilities for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy entity_facilities_internal_write on public.entity_facilities for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy products_internal_read on public.products for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy products_internal_write on public.products for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy product_batches_internal_read on public.product_batches for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy product_batches_internal_write on public.product_batches for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy economic_accounts_internal_read on public.economic_accounts for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy economic_accounts_internal_write on public.economic_accounts for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy economic_account_members_internal_read on public.economic_account_members for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy economic_account_members_internal_write on public.economic_account_members for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy transaction_networks_internal_read on public.transaction_networks for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy transaction_networks_internal_write on public.transaction_networks for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy assertions_internal_read on public.assertions for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy assertions_internal_write on public.assertions for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy evidence_links_internal_read on public.evidence_links for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy evidence_links_internal_write on public.evidence_links for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy transaction_decisions_internal_read on public.transaction_decisions for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy transaction_decisions_internal_write on public.transaction_decisions for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy transaction_import_internal_read on public.transaction_import_staging for select to authenticated
using (public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']));
create policy transaction_import_internal_write on public.transaction_import_staging for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

-- Transaction participants may only read transactions in which an active workspace membership is explicitly a party.
create policy transactions_internal_or_party_read on public.transactions for select to authenticated
using (
  public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])
  or public.hv_is_transaction_participant(id)
);
create policy transactions_internal_write on public.transactions for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy transaction_parties_internal_or_party_read on public.transaction_parties for select to authenticated
using (
  public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])
  or public.hv_is_transaction_participant(transaction_id)
);
create policy transaction_parties_internal_write on public.transaction_parties for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

create policy diligence_internal_or_shared_read on public.diligence_requirements for select to authenticated
using (
  public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])
  or (
    public.hv_is_transaction_participant(transaction_id)
    and (
      visibility_scope = 'transaction_parties'
      or (visibility_scope = 'specific_party' and party_id is not null and public.hv_is_specific_transaction_party(party_id))
    )
  )
);
create policy diligence_internal_write on public.diligence_requirements for all to authenticated
using (public.hv_has_transaction_role(array['admin','operator','super_admin']))
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

-- Harbourview fee, margin and revenue-recognition metrics are never participant-readable by default.
create policy transaction_economics_internal_or_shared_read on public.transaction_economics_entries for select to authenticated
using (
  public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])
  or (
    public.hv_is_transaction_participant(transaction_id)
    and metric_type not in (
      'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue','gross_margin'
    )
    and (
      visibility_scope = 'transaction_parties'
      or (visibility_scope = 'specific_party' and specific_party_id is not null and public.hv_is_specific_transaction_party(specific_party_id))
    )
  )
);
create policy transaction_economics_internal_insert on public.transaction_economics_entries for insert to authenticated
with check (public.hv_has_transaction_role(array['admin','operator','super_admin']));

-- Current authoritative economics are leaf entries in the immutable supersession chain.
create view public.transaction_current_economics_v1
with (security_invoker = true)
as
select e.*
from public.transaction_economics_entries e
where e.status = 'validated'
  and not e.scenario_only
  and not exists (
    select 1
    from public.transaction_economics_entries child
    where child.supersedes_entry_id = e.id
      and child.status = 'validated'
      and not child.scenario_only
  );

create view public.transaction_portfolio_economics_v1
with (security_invoker = true)
as
select metric_type, currency, count(*) as recognized_events, sum(amount) as amount
from public.transaction_current_economics_v1
where amount is not null
group by metric_type, currency;

create view public.transaction_diligence_readiness_v1
with (security_invoker = true)
as
select
  transaction_id,
  count(*) filter (where required) as required_count,
  count(*) filter (where required and status in ('received','validating','passed')) as received_count,
  count(*) filter (where required and status = 'passed') as passed_count,
  bool_and((not required) or status in ('passed','waived')) as minimum_gate_satisfied
from public.diligence_requirements
group by transaction_id;

create view public.transaction_party_safe_v1
with (security_invoker = true)
as
select
  t.id as transaction_id,
  t.title,
  t.transaction_type,
  t.stage,
  t.jurisdiction_code,
  t.target_decision_date,
  t.expected_close_date,
  p.id as party_id,
  p.party_role,
  p.entity_id,
  p.economic_account_id,
  p.workspace_id,
  p.contracting_entity,
  p.signatory_required,
  p.signatory_status
from public.transactions t
join public.transaction_parties p on p.transaction_id = t.id;

create view public.transaction_participant_economics_v1
with (security_invoker = true)
as
select
  id,
  transaction_id,
  network_id,
  metric_type,
  basis,
  amount,
  currency,
  quantity,
  quantity_unit,
  unit_rate,
  effective_at,
  recognized_at,
  recognition_key
from public.transaction_current_economics_v1
where metric_type not in (
  'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue','gross_margin'
);

create view public.transaction_lineage_v1
with (security_invoker = true)
as
select
  e.id as economics_entry_id,
  e.transaction_id,
  e.metric_type,
  e.basis,
  e.amount,
  e.currency,
  e.recognition_key,
  a.id as assertion_id,
  a.subject_type,
  a.subject_id,
  a.predicate,
  a.status as assertion_status,
  ev.id as evidence_id,
  ev.content_hash,
  ev.captured_at as evidence_captured_at,
  ev.classification as evidence_classification
from public.transaction_current_economics_v1 e
left join public.assertions a on a.id = e.assertion_id
left join public.hv_evidence ev on ev.id = e.evidence_id;

revoke all on public.transaction_current_economics_v1 from anon;
revoke all on public.transaction_portfolio_economics_v1 from anon;
revoke all on public.transaction_diligence_readiness_v1 from anon;
revoke all on public.transaction_party_safe_v1 from anon;
revoke all on public.transaction_participant_economics_v1 from anon;
revoke all on public.transaction_lineage_v1 from anon;
grant select on public.transaction_current_economics_v1 to authenticated, service_role;
grant select on public.transaction_portfolio_economics_v1 to authenticated, service_role;
grant select on public.transaction_diligence_readiness_v1 to authenticated, service_role;
grant select on public.transaction_party_safe_v1 to authenticated, service_role;
grant select on public.transaction_participant_economics_v1 to authenticated, service_role;
grant select on public.transaction_lineage_v1 to authenticated, service_role;

-- Existing audit tables remain canonical. New commercial state transitions append to them.
create or replace function public.hv_audit_transaction_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values ('transaction', new.id, 'transaction_created', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object('stage', new.stage::text, 'transaction_type', new.transaction_type::text));
    insert into public.status_history(entity_type, entity_id, from_status, to_status, changed_by, reason)
    values ('transaction', new.id, null, new.stage::text, coalesce(auth.uid()::text,'system'), 'transaction created');
  elsif new.stage is distinct from old.stage then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values ('transaction', new.id, 'transaction_stage_changed', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object('from_stage', old.stage::text, 'to_stage', new.stage::text));
    insert into public.status_history(entity_type, entity_id, from_status, to_status, changed_by, reason)
    values ('transaction', new.id, old.stage::text, new.stage::text, coalesce(auth.uid()::text,'system'), 'transaction stage changed');
  end if;
  return new;
end;
$$;

create trigger transactions_audit_state
after insert or update of stage on public.transactions
for each row execute function public.hv_audit_transaction_state();

create or replace function public.hv_audit_economics_insert()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
  values ('transaction', new.transaction_id, 'transaction_economics_appended', coalesce(auth.uid()::text,'system'), auth.uid(),
    jsonb_build_object(
      'economics_entry_id', new.id,
      'metric_type', new.metric_type::text,
      'basis', new.basis::text,
      'status', new.status::text,
      'recognition_key', new.recognition_key,
      'scenario_only', new.scenario_only
    ));
  return new;
end;
$$;
create trigger transaction_economics_audit_insert
after insert on public.transaction_economics_entries
for each row execute function public.hv_audit_economics_insert();

create or replace function public.hv_audit_diligence_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values ('transaction', new.transaction_id, 'diligence_status_changed', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object(
        'diligence_requirement_id', new.id,
        'requirement_type', new.requirement_type::text,
        'status', new.status::text,
        'previous_status', case when tg_op = 'UPDATE' then old.status::text else null end
      ));
  end if;
  return new;
end;
$$;
create trigger diligence_requirements_audit_state
after insert or update of status on public.diligence_requirements
for each row execute function public.hv_audit_diligence_state();

create or replace function public.hv_audit_transaction_decision()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
  values ('transaction', new.transaction_id, 'transaction_decision_recorded', coalesce(auth.uid()::text,'system'), auth.uid(),
    jsonb_build_object(
      'transaction_decision_id', new.id,
      'decision_type', new.decision_type::text,
      'decision_status', new.status::text,
      'new_stage', new.new_stage::text
    ));
  return new;
end;
$$;
create trigger transaction_decisions_audit_insert
after insert on public.transaction_decisions
for each row execute function public.hv_audit_transaction_decision();

revoke all on function public.hv_audit_transaction_state() from public, anon, authenticated;
revoke all on function public.hv_audit_economics_insert() from public, anon, authenticated;
revoke all on function public.hv_audit_diligence_state() from public, anon, authenticated;
revoke all on function public.hv_audit_transaction_decision() from public, anon, authenticated;

comment on table public.transaction_import_staging is 'Controlled workbook fixture staging only. No automatic canonical or production import.';
comment on view public.transaction_portfolio_economics_v1 is 'Deduplicated current validated economics by immutable recognition chain; scenario rows are excluded.';
comment on view public.transaction_participant_economics_v1 is 'Participant-safe economics projection excluding Harbourview fee, margin and revenue-recognition metrics.';
