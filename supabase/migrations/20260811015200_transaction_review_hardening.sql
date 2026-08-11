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

-- Financial amounts require an ISO currency and authoritative result rungs require
-- the evidence basis that their metric name claims.
alter table public.transaction_economics_entries
  add constraint transaction_economics_amount_currency_chk check (
    amount is null or currency is not null
  ),
  add constraint transaction_economics_authoritative_basis_chk check (
    case metric_type
      when 'evidenced_gtv' then basis = 'primary_evidence' and (evidence_id is not null or assertion_id is not null)
      when 'contracted_gtv' then basis = 'contract' and contract_document_id is not null
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

-- Replace the recognition-chain validator so a validated key cannot disagree with
-- its transaction/network, metric or currency fields, repeated use of the same
-- supporting evidence cannot be hidden behind a different caller-supplied key,
-- and void successors terminate the previous recognized leaf.
create or replace function public.hv_validate_economics_recognition_chain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  current_leaf uuid;
  parent_tx uuid;
  parent_key text;
  network_key text;
  expected_parent text;
  expected_prefix text;
  expected_suffix text;
  support_id uuid;
  duplicate_support uuid;
begin
  if new.status = 'validated' and not new.scenario_only then
    if new.currency is null then
      raise exception 'validated economics requires currency for recognition-key validation';
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
    if support_id is not null and new.supersedes_entry_id is null then
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

    perform pg_advisory_xact_lock(hashtextextended(new.recognition_key, 0));
  end if;

  if new.supersedes_entry_id is not null then
    select transaction_id, recognition_key
      into parent_tx, parent_key
      from public.transaction_economics_entries
     where id = new.supersedes_entry_id;

    if parent_tx is null then
      raise exception 'supersedes_entry_id % does not exist', new.supersedes_entry_id;
    end if;
    if parent_tx <> new.transaction_id or parent_key <> new.recognition_key then
      raise exception 'economics supersession must remain in the same transaction and recognition_key';
    end if;
  end if;

  if new.status = 'validated' and not new.scenario_only then
    select e.id
      into current_leaf
      from public.transaction_economics_entries e
     where e.recognition_key = new.recognition_key
       and e.status = 'validated'
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

    if current_leaf is not null and new.supersedes_entry_id is distinct from current_leaf then
      raise exception 'validated recognition_key % already has current entry %; replacement must explicitly supersede it',
        new.recognition_key, current_leaf;
    end if;
  end if;

  return new;
end;
$$;

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

-- Void successors terminate a previously validated leaf.
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

-- Participant economics bypass the internal-only base-table RLS only through this
-- explicit, security-barrier projection and caller-bound transaction/scope predicates.
create or replace view public.transaction_participant_economics_v1
with (security_invoker = false, security_barrier = true)
as
select
  e.id,
  e.transaction_id,
  e.network_id,
  e.metric_type,
  e.basis,
  e.amount,
  e.currency,
  e.quantity,
  e.quantity_unit,
  e.unit_rate,
  e.effective_at,
  e.recognized_at,
  e.recognition_key
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

revoke all on function public.hv_guard_transaction_decision_mutation() from public, anon, authenticated;
revoke all on function public.hv_audit_transaction_decision_update() from public, anon, authenticated;

comment on view public.transaction_participant_economics_v1 is 'Participant-only explicit economics projection; full economics rows remain internal-role-only.';
