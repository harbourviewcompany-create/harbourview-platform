-- Harbourview native transaction system: review hardening.
-- Additive/replacement controls only; no production application is authorized by this branch.

-- Facility coordinates must be absent together or present together and in range.
alter table public.entity_facilities
  drop constraint entity_facilities_coordinates_chk;
alter table public.entity_facilities
  add constraint entity_facilities_coordinates_chk check (
    (latitude is null and longitude is null)
    or (
      latitude is not null
      and longitude is not null
      and latitude between -90 and 90
      and longitude between -180 and 180
    )
  );

-- Persist the canonical economic participants and period used to derive each network key.
alter table public.transaction_networks
  add column buyer_economic_account_id uuid references public.economic_accounts(id) on delete restrict,
  add column seller_economic_account_id uuid references public.economic_accounts(id) on delete restrict,
  add column commercial_period text;

alter table public.transaction_networks
  alter column jurisdiction_code set not null,
  alter column buyer_economic_account_id set not null,
  alter column seller_economic_account_id set not null,
  alter column commercial_period set not null,
  add constraint transaction_networks_distinct_accounts_chk check (buyer_economic_account_id <> seller_economic_account_id),
  add constraint transaction_networks_commercial_period_chk check (length(btrim(commercial_period)) > 0);

create index transaction_networks_buyer_account_idx on public.transaction_networks (buyer_economic_account_id);
create index transaction_networks_seller_account_idx on public.transaction_networks (seller_economic_account_id);

create or replace function public.hv_derive_transaction_network_key()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.double_count_key := public.hv_transaction_network_key(
    new.jurisdiction_code,
    new.buyer_economic_account_id,
    new.seller_economic_account_id,
    new.transaction_object_type,
    new.commercial_period
  );
  return new;
end;
$$;

create trigger transaction_networks_derive_double_count_key
before insert or update of jurisdiction_code, buyer_economic_account_id, seller_economic_account_id, transaction_object_type, commercial_period, double_count_key
on public.transaction_networks
for each row execute function public.hv_derive_transaction_network_key();

-- Transaction-party identity is temporal: closed participation periods may be followed by later re-entry,
-- but overlapping periods for the same role/target are rejected.
drop index public.transaction_parties_identity_uidx;
create index transaction_parties_identity_idx
  on public.transaction_parties (
    transaction_id,
    party_role,
    coalesce(entity_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(economic_account_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create or replace function public.hv_guard_transaction_party_period_overlap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.transaction_parties p
    where p.id <> new.id
      and p.transaction_id = new.transaction_id
      and p.party_role = new.party_role
      and p.entity_id is not distinct from new.entity_id
      and p.economic_account_id is not distinct from new.economic_account_id
      and p.workspace_id is not distinct from new.workspace_id
      and tstzrange(
        coalesce(p.valid_from, '-infinity'::timestamptz),
        coalesce(p.valid_to, 'infinity'::timestamptz),
        '[)'
      ) && tstzrange(
        coalesce(new.valid_from, '-infinity'::timestamptz),
        coalesce(new.valid_to, 'infinity'::timestamptz),
        '[)'
      )
  ) then
    raise exception 'transaction party participation periods cannot overlap for the same transaction, role and target';
  end if;
  return new;
end;
$$;

create trigger transaction_parties_guard_period_overlap
before insert or update of transaction_id, party_role, entity_id, economic_account_id, workspace_id, valid_from, valid_to
on public.transaction_parties
for each row execute function public.hv_guard_transaction_party_period_overlap();

-- Financial amounts require an ISO currency and authoritative result rungs require
-- the evidence basis that their metric name claims.
alter table public.transaction_economics_entries
  add constraint transaction_economics_amount_currency_chk check (
    amount is null or currency is not null
  ),
  add constraint transaction_economics_authoritative_basis_chk check (
    case metric_type
      when 'evidenced_gtv' then
        basis = 'primary_evidence' and (evidence_id is not null or assertion_id is not null)
      when 'contracted_gtv' then
        basis = 'contract' and contract_document_id is not null
      when 'transacted_gtv' then
        basis in ('primary_evidence','invoice','settlement')
        and (evidence_id is not null or assertion_id is not null)
      when 'harbourview_accrued_revenue' then
        basis in ('primary_evidence','contract','invoice')
        and (evidence_id is not null or assertion_id is not null or contract_document_id is not null)
      when 'harbourview_invoiced_revenue' then
        basis = 'invoice' and (evidence_id is not null or assertion_id is not null)
      when 'harbourview_collected_revenue' then
        basis = 'settlement' and (evidence_id is not null or assertion_id is not null)
      else true
    end
  );

-- Replace the recognition-chain validator. Network attribution is bound to the transaction,
-- network keys are canonical, duplicate support is serialized before lookup, and terminal voids
-- cannot be bypassed or resurrected.
create or replace function public.hv_validate_economics_recognition_chain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  terminal_entry uuid;
  terminal_status public.hv_economics_status;
  parent_tx uuid;
  parent_key text;
  parent_status public.hv_economics_status;
  parent_has_terminal_child boolean;
  transaction_network_id uuid;
  network_key text;
  expected_parent text;
  expected_prefix text;
  expected_suffix text;
  support_id uuid;
  support_scope text;
  duplicate_support uuid;
begin
  select t.network_id into transaction_network_id
  from public.transactions t
  where t.id = new.transaction_id;

  if new.network_id is distinct from transaction_network_id then
    raise exception 'economics network must match the canonical transaction network';
  end if;

  if new.status in ('validated','void') and not new.scenario_only then
    if new.currency is null then
      raise exception 'recognized economics requires currency for recognition-key validation';
    end if;

    if new.network_id is not null then
      select double_count_key into network_key
      from public.transaction_networks
      where id = new.network_id;
    end if;

    expected_parent := coalesce(network_key, concat('TX|', new.transaction_id::text));
    expected_prefix := concat('ECON|', expected_parent, '|', new.metric_type::text, '|');
    expected_suffix := concat('|', upper(new.currency));

    if new.recognition_key not like replace(expected_prefix, '%', '\\%') || '%'
       or right(new.recognition_key, length(expected_suffix)) <> expected_suffix then
      raise exception 'recognition_key does not match transaction/network, metric and currency fields';
    end if;

    support_id := coalesce(new.evidence_id, new.assertion_id, new.contract_document_id);
    if support_id is not null and new.status = 'validated' and new.supersedes_entry_id is null then
      support_scope := concat(
        'ECON_SUPPORT|', new.transaction_id::text, '|', new.metric_type::text, '|', upper(new.currency), '|', support_id::text
      );
      perform pg_advisory_xact_lock(hashtextextended(support_scope, 0));
    end if;

    perform pg_advisory_xact_lock(hashtextextended(new.recognition_key, 0));

    if support_id is not null and new.status = 'validated' and new.supersedes_entry_id is null then
      select e.id into duplicate_support
      from public.transaction_economics_entries e
      where e.transaction_id = new.transaction_id
        and e.metric_type = new.metric_type
        and e.currency = new.currency
        and e.status = 'validated'
        and not e.scenario_only
        and coalesce(e.evidence_id, e.assertion_id, e.contract_document_id) = support_id
        and not exists (
          select 1
          from public.transaction_economics_entries child
          where child.supersedes_entry_id = e.id
            and child.status in ('validated','void')
            and not child.scenario_only
        )
      order by e.created_at desc, e.id desc
      limit 1;

      if duplicate_support is not null and new.recognition_key is distinct from (
        select recognition_key from public.transaction_economics_entries where id = duplicate_support
      ) then
        raise exception 'supporting evidence is already represented by current economics entry %', duplicate_support;
      end if;
    end if;

    select e.id, e.status
      into terminal_entry, terminal_status
      from public.transaction_economics_entries e
     where e.recognition_key = new.recognition_key
       and e.status in ('validated','void')
       and not e.scenario_only
       and not exists (
         select 1
         from public.transaction_economics_entries child
         where child.supersedes_entry_id = e.id
           and child.status in ('validated','void')
           and not child.scenario_only
       )
     order by e.created_at desc, e.id desc
     limit 1;

    if terminal_entry is not null then
      if terminal_status = 'void' then
        raise exception 'recognition chain is terminated by void entry % and cannot be resurrected', terminal_entry;
      end if;
      if new.supersedes_entry_id is distinct from terminal_entry then
        raise exception 'recognition_key % already has current entry %; replacement must explicitly supersede it',
          new.recognition_key, terminal_entry;
      end if;
    elsif new.status = 'void' then
      raise exception 'void economics must supersede a current validated entry';
    end if;
  end if;

  if new.supersedes_entry_id is not null then
    select transaction_id, recognition_key, status
      into parent_tx, parent_key, parent_status
      from public.transaction_economics_entries
     where id = new.supersedes_entry_id;

    if parent_tx is null then
      raise exception 'supersedes_entry_id % does not exist', new.supersedes_entry_id;
    end if;
    if parent_tx <> new.transaction_id or parent_key <> new.recognition_key then
      raise exception 'economics supersession must remain in the same transaction and recognition_key';
    end if;
    if parent_status = 'void' then
      raise exception 'void economics entries are terminal and cannot be superseded';
    end if;

    select exists (
      select 1
      from public.transaction_economics_entries child
      where child.supersedes_entry_id = new.supersedes_entry_id
        and child.status in ('validated','void')
        and not child.scenario_only
    ) into parent_has_terminal_child;

    if parent_has_terminal_child then
      raise exception 'economics supersession cannot branch behind an existing validated or void successor';
    end if;
  end if;

  return new;
end;
$$;

-- Final assertion truth is append-retained. Draft assertions may be completed once;
-- corrections to finalized assertions are new rows linked by supersedes_assertion_id.
create unique index assertions_supersedes_once_uidx
  on public.assertions (supersedes_assertion_id)
  where supersedes_assertion_id is not null;

create or replace function public.hv_validate_assertion_supersession()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_subject_type text;
  parent_subject_id uuid;
  parent_predicate text;
  parent_status public.hv_assertion_status;
begin
  if new.supersedes_assertion_id is null then
    return new;
  end if;

  select subject_type, subject_id, predicate, status
    into parent_subject_type, parent_subject_id, parent_predicate, parent_status
    from public.assertions
   where id = new.supersedes_assertion_id
   for update;

  if parent_subject_type is null then
    raise exception 'supersedes_assertion_id % does not exist', new.supersedes_assertion_id;
  end if;
  if parent_status = 'unverified' then
    raise exception 'draft assertions must be completed or rejected before supersession';
  end if;
  if parent_subject_type <> new.subject_type
     or parent_subject_id <> new.subject_id
     or parent_predicate <> new.predicate then
    raise exception 'assertion supersession must preserve subject and predicate';
  end if;
  return new;
end;
$$;

create trigger assertions_validate_supersession
before insert on public.assertions
for each row execute function public.hv_validate_assertion_supersession();

create or replace function public.hv_guard_assertion_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'assertions are append-retained and cannot be deleted';
  end if;
  if old.status <> 'unverified' then
    raise exception 'finalized assertions are immutable; append a superseding assertion instead';
  end if;
  if new.supersedes_assertion_id is distinct from old.supersedes_assertion_id then
    raise exception 'assertion supersession linkage cannot be rewritten';
  end if;
  return new;
end;
$$;

create trigger assertions_guard_mutation
before update or delete on public.assertions
for each row execute function public.hv_guard_assertion_mutation();

create or replace function public.hv_audit_assertion_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values (
      'assertion', new.id, 'assertion_recorded', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object(
        'subject_type', new.subject_type,
        'subject_id', new.subject_id,
        'predicate', new.predicate,
        'status', new.status::text,
        'supersedes_assertion_id', new.supersedes_assertion_id
      )
    );
  elsif new.status is distinct from old.status then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values (
      'assertion', new.id, 'assertion_status_changed', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object('from_status', old.status::text, 'to_status', new.status::text)
    );
  end if;
  return new;
end;
$$;

create trigger assertions_audit_change
after insert or update on public.assertions
for each row execute function public.hv_audit_assertion_change();

-- Superseding transaction decisions must remain within the same transaction.
alter table public.transaction_decisions
  add constraint transaction_decisions_id_transaction_unique unique (id, transaction_id),
  drop constraint transaction_decisions_supersedes_decision_id_fkey,
  add constraint transaction_decisions_supersedes_transaction_fk
    foreign key (supersedes_decision_id, transaction_id)
    references public.transaction_decisions(id, transaction_id)
    on delete restrict;

-- Use only roles representable by the repository's canonical user_roles constraint.
alter policy entities_internal_read on public.entities
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy entities_internal_write on public.entities
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy entity_aliases_internal_read on public.entity_aliases
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy entity_aliases_internal_write on public.entity_aliases
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy entity_facilities_internal_read on public.entity_facilities
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy entity_facilities_internal_write on public.entity_facilities
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy products_internal_read on public.products
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy products_internal_write on public.products
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy product_batches_internal_read on public.product_batches
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy product_batches_internal_write on public.product_batches
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy economic_accounts_internal_read on public.economic_accounts
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy economic_accounts_internal_write on public.economic_accounts
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy economic_account_members_internal_read on public.economic_account_members
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy economic_account_members_internal_write on public.economic_account_members
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy transaction_networks_internal_read on public.transaction_networks
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy transaction_networks_internal_write on public.transaction_networks
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy assertions_internal_read on public.assertions
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy assertions_internal_write on public.assertions
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy evidence_links_internal_read on public.evidence_links
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy evidence_links_internal_write on public.evidence_links
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy transaction_decisions_internal_read on public.transaction_decisions
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy transaction_decisions_internal_write on public.transaction_decisions
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy transaction_import_internal_read on public.transaction_import_staging
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy transaction_import_internal_write on public.transaction_import_staging
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy transactions_internal_or_party_read on public.transactions
  using (
    public.hv_has_transaction_role(array['admin','operator','analyst'])
    or public.hv_is_transaction_participant(id)
  );
alter policy transactions_internal_write on public.transactions
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy transaction_parties_internal_or_party_read on public.transaction_parties
  using (
    public.hv_has_transaction_role(array['admin','operator','analyst'])
    or (public.hv_is_transaction_participant(transaction_id) and visibility_scope = 'transaction_parties')
  );
alter policy transaction_parties_internal_write on public.transaction_parties
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy diligence_internal_or_shared_read on public.diligence_requirements
  using (
    public.hv_has_transaction_role(array['admin','operator','analyst'])
    or (
      public.hv_is_transaction_participant(transaction_id)
      and (
        visibility_scope = 'transaction_parties'
        or (visibility_scope = 'specific_party' and party_id is not null and public.hv_is_specific_transaction_party(party_id))
      )
    )
  );
alter policy diligence_internal_write on public.diligence_requirements
  using (public.hv_has_transaction_role(array['admin','operator']))
  with check (public.hv_has_transaction_role(array['admin','operator']));
alter policy transaction_economics_internal_or_shared_read on public.transaction_economics_entries
  using (public.hv_has_transaction_role(array['admin','operator','analyst']));
alter policy transaction_economics_internal_insert on public.transaction_economics_entries
  with check (public.hv_has_transaction_role(array['admin','operator']));

-- Void successors terminate previously recognized leaves.
create or replace view public.transaction_current_economics_v1
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
      and child.status in ('validated','void')
      and not child.scenario_only
  );

-- Participants receive only transaction economics required to understand their deal.
-- Internal network identifiers, recognition keys, evidence lineage and Harbourview economics stay internal.
drop view public.transaction_participant_economics_v1;
create view public.transaction_participant_economics_v1
with (security_invoker = false, security_barrier = true)
as
select
  e.id,
  e.transaction_id,
  e.metric_type,
  e.basis,
  e.amount,
  e.currency,
  e.quantity,
  e.quantity_unit,
  e.unit_rate,
  e.effective_at,
  e.recognized_at
from public.transaction_economics_entries e
where e.status = 'validated'
  and not e.scenario_only
  and public.hv_is_transaction_participant(e.transaction_id)
  and e.metric_type not in (
    'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue','gross_margin'
  )
  and (
    e.visibility_scope = 'transaction_parties'
    or (
      e.visibility_scope = 'specific_party'
      and e.specific_party_id is not null
      and public.hv_is_specific_transaction_party(e.specific_party_id)
    )
  )
  and not exists (
    select 1
    from public.transaction_economics_entries child
    where child.supersedes_entry_id = e.id
      and child.status in ('validated','void')
      and not child.scenario_only
  );
alter view public.transaction_participant_economics_v1 set (security_invoker = false, security_barrier = true);
revoke all on public.transaction_participant_economics_v1 from anon;
grant select on public.transaction_participant_economics_v1 to authenticated, service_role;

-- Assertion-backed economics traverses evidence_links when no direct evidence_id is stored on the economics row.
create or replace view public.transaction_lineage_v1
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
left join public.evidence_links el
  on e.evidence_id is null
 and a.id is not null
 and el.subject_type = 'assertion'
 and el.subject_id = a.id
 and el.supports
left join public.hv_evidence ev on ev.id = coalesce(e.evidence_id, el.evidence_id);

-- Finalized decisions are immutable; pending decisions may transition once, and every
-- transition is appended to the canonical audit stream. Deletes are never permitted.
create or replace function public.hv_guard_transaction_decision_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'transaction_decisions are append-retained and cannot be deleted';
  end if;
  if old.status <> 'pending' then
    raise exception 'finalized transaction_decisions are immutable; append a superseding decision instead';
  end if;
  return new;
end;
$$;

create trigger transaction_decisions_guard_mutation
before update or delete on public.transaction_decisions
for each row execute function public.hv_guard_transaction_decision_mutation();

create or replace function public.hv_audit_transaction_decision_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.status is distinct from old.status
     or new.decision_type is distinct from old.decision_type
     or new.new_stage is distinct from old.new_stage then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values (
      'transaction',
      new.transaction_id,
      'transaction_decision_changed',
      coalesce(auth.uid()::text,'system'),
      auth.uid(),
      jsonb_build_object(
        'transaction_decision_id', new.id,
        'from_status', old.status::text,
        'to_status', new.status::text,
        'decision_type', new.decision_type::text,
        'new_stage', new.new_stage::text
      )
    );
  end if;
  return new;
end;
$$;

create trigger transaction_decisions_audit_update
after update on public.transaction_decisions
for each row execute function public.hv_audit_transaction_decision_update();

revoke all on function public.hv_derive_transaction_network_key() from public, anon, authenticated;
revoke all on function public.hv_guard_transaction_party_period_overlap() from public, anon, authenticated;
revoke all on function public.hv_validate_assertion_supersession() from public, anon, authenticated;
revoke all on function public.hv_guard_assertion_mutation() from public, anon, authenticated;
revoke all on function public.hv_audit_assertion_change() from public, anon, authenticated;
revoke all on function public.hv_guard_transaction_decision_mutation() from public, anon, authenticated;
revoke all on function public.hv_audit_transaction_decision_update() from public, anon, authenticated;

comment on view public.transaction_participant_economics_v1 is 'Participant-only explicit economics projection; internal network IDs, recognition keys, evidence lineage and Harbourview revenue remain internal.';
comment on view public.transaction_lineage_v1 is 'Internal evidence-to-assertion-to-economics lineage; assertion-backed entries traverse supporting evidence_links.';
