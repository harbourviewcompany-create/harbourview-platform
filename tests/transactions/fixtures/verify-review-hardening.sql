\set ON_ERROR_STOP on

-- Coordinate pairs fail closed when only one coordinate is supplied.
do $$
declare
  entity_id uuid;
  violated_constraint text;
begin
  insert into public.entities(entity_type,name,entity_kind,display_name,normalized_name)
  values ('company','Coordinate Test','company','Coordinate Test','coordinate test')
  returning id into entity_id;

  begin
    insert into public.entity_facilities(
      entity_id,name,normalized_name,facility_type,country_iso2,latitude,longitude
    ) values (
      entity_id,'Half coordinate','half coordinate','warehouse','CA',null,-75.69
    );
    raise exception 'half-coordinate facility unexpectedly inserted';
  exception
    when check_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint is distinct from 'entity_facilities_coordinates_chk' then
        raise exception 'expected entity_facilities_coordinates_chk, received %', violated_constraint;
      end if;
  end;
end $$;

-- Any monetary amount requires currency.
do $$
declare
  tx_id uuid;
  violated_constraint text;
begin
  insert into public.transactions(transaction_type,title)
  values ('sale','Missing currency negative control')
  returning id into tx_id;

  begin
    insert into public.transaction_economics_entries(
      transaction_id,metric_type,basis,status,amount,recognition_key
    ) values (
      tx_id,'estimated_gtv','modeled','draft',1000,
      concat('ECON|TX|',tx_id::text,'|estimated_gtv|missing-currency|USD')
    );
    raise exception 'amount without currency unexpectedly inserted';
  exception
    when check_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint is distinct from 'transaction_economics_amount_currency_chk' then
        raise exception 'expected transaction_economics_amount_currency_chk, received %', violated_constraint;
      end if;
  end;
end $$;

-- Authoritative evidenced GTV cannot be represented by modeled unsupported data.
do $$
declare
  tx_id uuid;
  violated_constraint text;
begin
  insert into public.transactions(transaction_type,title,currency)
  values ('sale','Unsupported authoritative metric negative control','USD')
  returning id into tx_id;

  begin
    insert into public.transaction_economics_entries(
      transaction_id,metric_type,basis,status,amount,currency,recognition_key
    ) values (
      tx_id,'evidenced_gtv','modeled','validated',1000,'USD',
      concat('ECON|TX|',tx_id::text,'|evidenced_gtv|unsupported|USD')
    );
    raise exception 'unsupported evidenced_gtv unexpectedly inserted';
  exception
    when check_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint is distinct from 'transaction_economics_authoritative_basis_chk' then
        raise exception 'expected transaction_economics_authoritative_basis_chk, received %', violated_constraint;
      end if;
  end;
end $$;

-- A validated recognition key must agree with its row parent, metric and currency.
do $$
declare
  tx_id uuid;
  failed_as_expected boolean := false;
begin
  insert into public.transactions(transaction_type,title,currency)
  values ('sale','Recognition mismatch negative control','USD')
  returning id into tx_id;

  begin
    insert into public.transaction_economics_entries(
      transaction_id,metric_type,basis,status,amount,currency,recognition_key
    ) values (
      tx_id,'estimated_gtv','modeled','validated',1000,'USD',
      concat('ECON|TX|',tx_id::text,'|gross_margin|wrong-fields|CAD')
    );
  exception when others then
    if position('recognition_key does not match transaction/network, metric and currency fields' in sqlerrm) > 0 then
      failed_as_expected := true;
    else
      raise;
    end if;
  end;

  if not failed_as_expected then
    raise exception 'mismatched recognition_key unexpectedly inserted';
  end if;
end $$;

-- A void successor terminates the prior validated leaf from current economics.
do $$
declare
  tx_id uuid;
  first_entry uuid;
  recognition text;
  current_count integer;
begin
  insert into public.transactions(transaction_type,title,currency)
  values ('sale','Void successor proof','USD')
  returning id into tx_id;

  recognition := concat('ECON|TX|',tx_id::text,'|estimated_gtv|void-proof|USD');

  insert into public.transaction_economics_entries(
    transaction_id,metric_type,basis,status,amount,currency,recognition_key
  ) values (
    tx_id,'estimated_gtv','modeled','validated',1000,'USD',recognition
  ) returning id into first_entry;

  insert into public.transaction_economics_entries(
    transaction_id,metric_type,basis,status,amount,currency,recognition_key,supersedes_entry_id
  ) values (
    tx_id,'estimated_gtv','modeled','void',null,'USD',recognition,first_entry
  );

  select count(*) into current_count
  from public.transaction_current_economics_v1
  where id = first_entry;

  if current_count <> 0 then
    raise exception 'void successor did not terminate current economics leaf';
  end if;
end $$;

-- Finalized decisions are immutable and retained.
do $$
declare
  tx_id uuid;
  user_id uuid;
  decision_id uuid;
  update_failed boolean := false;
  delete_failed boolean := false;
begin
  insert into auth.users default values returning id into user_id;
  insert into public.transactions(transaction_type,title)
  values ('sale','Decision retention proof')
  returning id into tx_id;

  insert into public.transaction_decisions(
    transaction_id,decision_type,status,decided_by
  ) values (
    tx_id,'qualify','approved',user_id
  ) returning id into decision_id;

  begin
    update public.transaction_decisions
    set decision_note = 'rewritten'
    where id = decision_id;
  exception when others then
    if position('finalized transaction_decisions are immutable' in sqlerrm) > 0 then
      update_failed := true;
    else
      raise;
    end if;
  end;

  begin
    delete from public.transaction_decisions where id = decision_id;
  exception when others then
    if position('append-retained and cannot be deleted' in sqlerrm) > 0 then
      delete_failed := true;
    else
      raise;
    end if;
  end;

  if not update_failed or not delete_failed then
    raise exception 'finalized decision mutation guard incomplete: update %, delete %', update_failed, delete_failed;
  end if;
end $$;

-- Final effective policies use canonical roles, hide platform-only parties from participants,
-- keep full economics internal-only, and expose participant economics through a security barrier.
do $$
declare
  party_policy text;
  economics_policy text;
  participant_view_options text[];
begin
  select qual into party_policy
  from pg_policies
  where schemaname = 'public'
    and tablename = 'transaction_parties'
    and policyname = 'transaction_parties_internal_or_party_read';

  if party_policy is null or position('transaction_parties' in party_policy) = 0 then
    raise exception 'transaction party policy does not enforce explicit participant visibility';
  end if;

  select qual into economics_policy
  from pg_policies
  where schemaname = 'public'
    and tablename = 'transaction_economics_entries'
    and policyname = 'transaction_economics_internal_or_shared_read';

  if economics_policy is null
     or position('hv_is_transaction_participant' in economics_policy) > 0
     or position('super_admin' in economics_policy) > 0
     or position('compliance_reviewer' in economics_policy) > 0 then
    raise exception 'full economics policy is not internal-role-only/canonical: %', economics_policy;
  end if;

  select reloptions into participant_view_options
  from pg_class
  where oid = 'public.transaction_participant_economics_v1'::regclass;

  if not coalesce(participant_view_options, '{}'::text[]) @> array['security_barrier=true']::text[]
     or coalesce(participant_view_options, '{}'::text[]) @> array['security_invoker=true']::text[] then
    raise exception 'participant economics view options are not safe: %', participant_view_options;
  end if;
end $$;

select 'transaction review hardening verification: PASS' as result;
