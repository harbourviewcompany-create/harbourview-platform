\set ON_ERROR_STOP on

-- Canonical network keys are derived from persisted buyer/seller/object/jurisdiction/period inputs.
do $$
declare
  buyer_id uuid;
  seller_id uuid;
  network_id uuid;
  stored_key text;
  expected_key text;
begin
  insert into public.economic_accounts(name, normalized_name) values ('Final Gate Buyer','final gate buyer') returning id into buyer_id;
  insert into public.economic_accounts(name, normalized_name) values ('Final Gate Seller','final gate seller') returning id into seller_id;

  insert into public.transaction_networks(
    name, jurisdiction_code, buyer_economic_account_id, seller_economic_account_id,
    commercial_period, transaction_object_type, double_count_key
  ) values (
    'Derived key proof','US-ME',buyer_id,seller_id,'2026-Q3','compliance testing','NETWORK|forged'
  ) returning id, double_count_key into network_id, stored_key;

  expected_key := public.hv_transaction_network_key('US-ME',buyer_id,seller_id,'compliance testing','2026-Q3');
  if stored_key is distinct from expected_key then
    raise exception 'network key was not derived from persisted canonical inputs: % <> %', stored_key, expected_key;
  end if;
end $$;

-- Economics may not attribute a transaction to a different network.
do $$
declare
  buyer_a uuid; seller_a uuid; buyer_b uuid; seller_b uuid;
  network_a uuid; network_b uuid; tx_id uuid;
  failed boolean := false;
begin
  insert into public.economic_accounts(name, normalized_name) values ('Network A Buyer','network a buyer') returning id into buyer_a;
  insert into public.economic_accounts(name, normalized_name) values ('Network A Seller','network a seller') returning id into seller_a;
  insert into public.economic_accounts(name, normalized_name) values ('Network B Buyer','network b buyer') returning id into buyer_b;
  insert into public.economic_accounts(name, normalized_name) values ('Network B Seller','network b seller') returning id into seller_b;

  insert into public.transaction_networks(name,jurisdiction_code,buyer_economic_account_id,seller_economic_account_id,commercial_period,transaction_object_type,double_count_key)
  values ('Network A','US-ME',buyer_a,seller_a,'2026-Q3','testing','NETWORK|placeholder-a') returning id into network_a;
  insert into public.transaction_networks(name,jurisdiction_code,buyer_economic_account_id,seller_economic_account_id,commercial_period,transaction_object_type,double_count_key)
  values ('Network B','US-ME',buyer_b,seller_b,'2026-Q3','testing','NETWORK|placeholder-b') returning id into network_b;

  insert into public.transactions(network_id,transaction_type,title,currency)
  values (network_a,'testing_service','Network mismatch proof','USD') returning id into tx_id;

  begin
    insert into public.transaction_economics_entries(transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key)
    values (tx_id,network_b,'estimated_gtv','modeled','draft',100,'USD',concat('ECON|TX|',tx_id::text,'|estimated_gtv|mismatch|USD'));
  exception when others then
    if position('economics network must match the canonical transaction network' in sqlerrm) > 0 then failed := true; else raise; end if;
  end;
  if not failed then raise exception 'cross-network economics unexpectedly inserted'; end if;
end $$;

-- Validated transacted GTV invoice/settlement rows require actual supporting evidence/assertion.
do $$
declare
  tx_id uuid;
  violated text;
begin
  insert into public.transactions(transaction_type,title,currency) values ('sale','Transacted evidence proof','USD') returning id into tx_id;
  begin
    insert into public.transaction_economics_entries(transaction_id,metric_type,basis,status,amount,currency,recognition_key)
    values (tx_id,'transacted_gtv','invoice','validated',250,'USD',concat('ECON|TX|',tx_id::text,'|transacted_gtv|invoice-1|USD'));
    raise exception 'unsupported transacted_gtv unexpectedly inserted';
  exception when check_violation then
    get stacked diagnostics violated = constraint_name;
    if violated is distinct from 'transaction_economics_authoritative_basis_chk' then
      raise exception 'expected transaction_economics_authoritative_basis_chk, received %', violated;
    end if;
  end;
end $$;

-- Support-scope serialization must occur before the duplicate-support lookup.
do $$
declare
  fn text;
  lock_pos integer;
  query_pos integer;
begin
  fn := pg_get_functiondef('public.hv_validate_economics_recognition_chain()'::regprocedure);
  lock_pos := position('pg_advisory_xact_lock(hashtextextended(support_scope' in fn);
  query_pos := position('select e.id into duplicate_support' in fn);
  if lock_pos = 0 or query_pos = 0 or lock_pos > query_pos then
    raise exception 'support-scope lock is not acquired before duplicate-support lookup';
  end if;
end $$;

-- The same supporting assertion cannot book two current validated events under different recognition keys.
do $$
declare
  tx_id uuid;
  assertion_id uuid;
  failed boolean := false;
begin
  insert into public.transactions(transaction_type,title,currency) values ('sale','Duplicate support proof','USD') returning id into tx_id;
  insert into public.assertions(subject_type,subject_id,predicate,value_type,value_numeric,status)
  values ('transaction',tx_id,'verified_amount','numeric',100,'verified') returning id into assertion_id;

  insert into public.transaction_economics_entries(transaction_id,metric_type,basis,status,amount,currency,assertion_id,recognition_key)
  values (tx_id,'evidenced_gtv','primary_evidence','validated',100,'USD',assertion_id,concat('ECON|TX|',tx_id::text,'|evidenced_gtv|support-a|USD'));

  begin
    insert into public.transaction_economics_entries(transaction_id,metric_type,basis,status,amount,currency,assertion_id,recognition_key)
    values (tx_id,'evidenced_gtv','primary_evidence','validated',100,'USD',assertion_id,concat('ECON|TX|',tx_id::text,'|evidenced_gtv|support-b|USD'));
  exception when others then
    if position('supporting evidence is already represented by current economics entry' in sqlerrm) > 0 then failed := true; else raise; end if;
  end;
  if not failed then raise exception 'duplicate support was booked under a second recognition key'; end if;
end $$;

-- A terminal void cannot be resurrected by branching behind it.
do $$
declare
  tx_id uuid;
  first_id uuid;
  key text;
  failed boolean := false;
begin
  insert into public.transactions(transaction_type,title,currency) values ('sale','Void resurrection proof','USD') returning id into tx_id;
  key := concat('ECON|TX|',tx_id::text,'|estimated_gtv|void-terminal|USD');
  insert into public.transaction_economics_entries(transaction_id,metric_type,basis,status,amount,currency,recognition_key)
  values (tx_id,'estimated_gtv','modeled','validated',100,'USD',key) returning id into first_id;
  insert into public.transaction_economics_entries(transaction_id,metric_type,basis,status,currency,recognition_key,supersedes_entry_id)
  values (tx_id,'estimated_gtv','modeled','void','USD',key,first_id);

  begin
    insert into public.transaction_economics_entries(transaction_id,metric_type,basis,status,amount,currency,recognition_key,supersedes_entry_id)
    values (tx_id,'estimated_gtv','modeled','validated',120,'USD',key,first_id);
  exception when others then
    if position('terminated by void entry' in sqlerrm) > 0 or position('cannot branch behind' in sqlerrm) > 0 then failed := true; else raise; end if;
  end;
  if not failed then raise exception 'validated economics resurrected a terminal void'; end if;
end $$;

-- Transaction decisions cannot supersede a decision from another transaction.
do $$
declare
  user_id uuid; tx_a uuid; tx_b uuid; decision_a uuid;
  failed boolean := false;
begin
  insert into auth.users default values returning id into user_id;
  insert into public.transactions(transaction_type,title) values ('sale','Decision chain A') returning id into tx_a;
  insert into public.transactions(transaction_type,title) values ('sale','Decision chain B') returning id into tx_b;
  insert into public.transaction_decisions(transaction_id,decision_type,status,decided_by)
  values (tx_a,'qualify','approved',user_id) returning id into decision_a;
  begin
    insert into public.transaction_decisions(transaction_id,decision_type,status,decided_by,supersedes_decision_id)
    values (tx_b,'advance','approved',user_id,decision_a);
  exception when foreign_key_violation then failed := true;
  end;
  if not failed then raise exception 'cross-transaction decision supersession unexpectedly inserted'; end if;
end $$;

-- Final assertions are immutable/deletion-retained; correction is an audited superseding assertion.
do $$
declare
  subject_id uuid := gen_random_uuid();
  parent_id uuid; child_id uuid;
  update_failed boolean := false; delete_failed boolean := false;
begin
  insert into public.assertions(subject_type,subject_id,predicate,value_type,value_text,status)
  values ('entity',subject_id,'licence_status','text','active','verified') returning id into parent_id;

  begin update public.assertions set value_text='inactive' where id=parent_id;
  exception when others then if position('finalized assertions are immutable' in sqlerrm)>0 then update_failed:=true; else raise; end if; end;
  begin delete from public.assertions where id=parent_id;
  exception when others then if position('append-retained and cannot be deleted' in sqlerrm)>0 then delete_failed:=true; else raise; end if; end;
  if not update_failed or not delete_failed then raise exception 'final assertion mutation guard incomplete'; end if;

  insert into public.assertions(subject_type,subject_id,predicate,value_type,value_text,status,supersedes_assertion_id)
  values ('entity',subject_id,'licence_status','text','inactive','verified',parent_id) returning id into child_id;
  if child_id is null then raise exception 'valid assertion supersession was not inserted'; end if;
end $$;

-- Transaction parties may rejoin after a closed period, but overlapping periods remain forbidden.
do $$
declare
  tx_id uuid; account_id uuid;
  failed boolean := false;
begin
  insert into public.transactions(transaction_type,title) values ('sale','Party temporal proof') returning id into tx_id;
  insert into public.economic_accounts(name,normalized_name) values ('Temporal Party','temporal party') returning id into account_id;
  insert into public.transaction_parties(transaction_id,economic_account_id,party_role,valid_from,valid_to)
  values (tx_id,account_id,'buyer','2026-01-01','2026-02-01');
  insert into public.transaction_parties(transaction_id,economic_account_id,party_role,valid_from,valid_to)
  values (tx_id,account_id,'buyer','2026-03-01','2026-04-01');
  begin
    insert into public.transaction_parties(transaction_id,economic_account_id,party_role,valid_from,valid_to)
    values (tx_id,account_id,'buyer','2026-01-15','2026-03-15');
  exception when others then
    if position('participation periods cannot overlap' in sqlerrm)>0 then failed:=true; else raise; end if;
  end;
  if not failed then raise exception 'overlapping transaction party period unexpectedly inserted'; end if;
end $$;

-- Participant economics projection omits internal network/recognition identifiers.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='transaction_participant_economics_v1'
      and column_name in ('network_id','recognition_key')
  ) then
    raise exception 'participant economics projection leaks network_id or recognition_key';
  end if;
end $$;

-- Assertion-backed economics lineage must traverse evidence_links.
do $$
declare
  viewdef text;
begin
  select pg_get_viewdef('public.transaction_lineage_v1'::regclass, true) into viewdef;
  if position('evidence_links' in viewdef)=0 or position('subject_type' in viewdef)=0 then
    raise exception 'transaction_lineage_v1 does not traverse assertion evidence_links';
  end if;
end $$;

select 'transaction final gate verification: PASS' as result;
