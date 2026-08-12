\set ON_ERROR_STOP on

-- Canonical/staging table presence.
do $$
declare
  expected text[] := array[
    'entities','entity_aliases','entity_facilities','products','product_batches','economic_accounts','economic_account_members',
    'transaction_networks','transactions','transaction_parties','assertions','evidence_links','diligence_requirements',
    'transaction_economics_entries','transaction_decisions','transaction_import_staging'
  ];
  name text;
begin
  foreach name in array expected loop
    if to_regclass('public.' || name) is null then
      raise exception 'missing transaction table %', name;
    end if;
  end loop;
end $$;

-- RLS enabled on every transaction-domain table, including the reconciled legacy entities root.
do $$
declare
  missing_count integer;
begin
  select count(*) into missing_count
  from unnest(array[
    'entities','entity_aliases','entity_facilities','products','product_batches','economic_accounts','economic_account_members',
    'transaction_networks','transactions','transaction_parties','assertions','evidence_links','diligence_requirements',
    'transaction_economics_entries','transaction_decisions','transaction_import_staging'
  ]) t(name)
  left join pg_class c on c.oid = to_regclass('public.' || t.name)
  where not coalesce(c.relrowsecurity,false);

  if missing_count <> 0 then
    raise exception '% transaction tables are missing RLS', missing_count;
  end if;
end $$;

-- Signal Engine entity identity is upgraded in place: existing rows and existing FKs survive.
do $$
declare
  upgraded_kind public.hv_entity_kind;
  upgraded_display text;
  upgraded_normalized text;
  upgraded_country text;
  mention_count integer;
begin
  select entity_kind, display_name, normalized_name, country_iso2
    into upgraded_kind, upgraded_display, upgraded_normalized, upgraded_country
    from public.entities
   where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  if upgraded_kind <> 'company'
     or upgraded_display <> 'Legacy Signal Engine Entity'
     or upgraded_normalized <> 'legacy signal engine entity'
     or upgraded_country <> 'CA' then
    raise exception 'legacy entity was not upgraded in place: %, %, %, %',
      upgraded_kind, upgraded_display, upgraded_normalized, upgraded_country;
  end if;

  select count(*) into mention_count
    from public.signal_entity_mentions
   where entity_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if mention_count <> 1 then
    raise exception 'existing signal_entity_mentions FK relationship was not preserved';
  end if;
end $$;

-- Nullable compatibility bridges are present when their pre-existing target table exists.
do $$
declare
  expected text[][] := array[
    array['cannabis_operators','entity_id'],
    array['ia_counterparties','entity_id'],
    array['operator_licences','entity_id'],
    array['operator_licences','facility_id'],
    array['opportunities','economic_account_id'],
    array['opportunities','transaction_network_id'],
    array['listings','product_id'],
    array['listings','economic_account_id'],
    array['buyer_requests','product_id'],
    array['buyer_requests','economic_account_id'],
    array['buyer_requests','opportunity_id'],
    array['matches','transaction_network_id'],
    array['deal_rooms','transaction_id'],
    array['engagements','transaction_id'],
    array['commissions','economics_entry_id']
  ];
  pair text[];
begin
  foreach pair slice 1 in array expected loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=pair[1] and column_name=pair[2]
    ) then
      raise exception 'missing bridge %.%', pair[1], pair[2];
    end if;
  end loop;
end $$;

-- Anonymous cannot select canonical transaction surfaces.
do $$
declare
  name text;
begin
  foreach name in array array[
    'entities','economic_accounts','transaction_networks','transactions','assertions','diligence_requirements','transaction_economics_entries'
  ] loop
    if has_table_privilege('anon', format('public.%I',name), 'select') then
      raise exception 'anon unexpectedly has SELECT on %', name;
    end if;
  end loop;
end $$;

-- Legacy marketplace grants remain usable only for legacy columns; transaction bridge IDs are hidden/unwritable.
do $$
begin
  if not has_column_privilege('anon','public.listings','title','select')
     or not has_column_privilege('anon','public.listings','title','insert')
     or not has_column_privilege('anon','public.listings','title','update') then
    raise exception 'legacy listings public-column privileges were not preserved';
  end if;
  if has_column_privilege('anon','public.listings','product_id','select')
     or has_column_privilege('anon','public.listings','product_id','insert')
     or has_column_privilege('anon','public.listings','product_id','update')
     or has_column_privilege('anon','public.listings','economic_account_id','select')
     or has_column_privilege('anon','public.listings','economic_account_id','insert')
     or has_column_privilege('anon','public.listings','economic_account_id','update') then
    raise exception 'internal listing bridge column leaked through anon privileges';
  end if;

  if not has_column_privilege('anon','public.buyer_requests','request_text','select')
     or not has_column_privilege('anon','public.buyer_requests','request_text','insert')
     or not has_column_privilege('anon','public.buyer_requests','request_text','update') then
    raise exception 'legacy buyer_requests public-column privileges were not preserved';
  end if;
  if has_column_privilege('anon','public.buyer_requests','product_id','select')
     or has_column_privilege('anon','public.buyer_requests','product_id','insert')
     or has_column_privilege('anon','public.buyer_requests','economic_account_id','select')
     or has_column_privilege('anon','public.buyer_requests','economic_account_id','insert')
     or has_column_privilege('anon','public.buyer_requests','opportunity_id','select')
     or has_column_privilege('anon','public.buyer_requests','opportunity_id','insert') then
    raise exception 'internal buyer-request bridge column leaked through anon privileges';
  end if;
end $$;

-- Deterministic key shape and separator fail-closed behavior.
do $$
declare
  buyer uuid := '11111111-1111-4111-8111-111111111111';
  seller uuid := '22222222-2222-4222-8222-222222222222';
  tx uuid := '33333333-3333-4333-8333-333333333333';
  network_key text;
  econ_key text;
  failed_as_expected boolean := false;
begin
  network_key := public.hv_transaction_network_key(' us-me ', buyer, seller, ' Compliance  Testing ', ' 2026 q3 ');
  if network_key <> 'NETWORK|US-ME|11111111-1111-4111-8111-111111111111|22222222-2222-4222-8222-222222222222|compliance-testing|2026-Q3' then
    raise exception 'unexpected network key %', network_key;
  end if;

  econ_key := public.hv_transaction_economics_key(network_key, tx, 'transacted_gtv', 'Invoice 23984', 'usd');
  if econ_key not like 'ECON|NETWORK|US-ME|%|transacted_gtv|invoice-23984|USD' then
    raise exception 'unexpected economics key %', econ_key;
  end if;

  begin
    perform public.hv_transaction_network_key('US|ME', buyer, seller, 'compliance testing', '2026-Q3');
  exception when others then
    if position('pipe separators' in sqlerrm) > 0 then failed_as_expected := true; else raise; end if;
  end;
  if not failed_as_expected then
    raise exception 'network recognition key accepted ambiguous separator input';
  end if;

  failed_as_expected := false;
  begin
    perform public.hv_transaction_economics_key(network_key, tx, 'transacted_gtv', 'invoice|23984', 'USD');
  exception when others then
    if position('pipe separators' in sqlerrm) > 0 then failed_as_expected := true; else raise; end if;
  end;
  if not failed_as_expected then
    raise exception 'economics recognition key accepted ambiguous separator input';
  end if;
end $$;

-- Append-only recognition chain, evidence basis rules, signed margin, and portfolio de-duplication.
do $$
declare
  buyer_entity uuid;
  seller_entity uuid;
  buyer_account uuid;
  seller_account uuid;
  network_id uuid;
  tx_id uuid;
  assertion_support uuid;
  first_entry uuid;
  replacement_entry uuid;
  recognition text;
  current_amount numeric;
  failed_as_expected boolean := false;
begin
  insert into public.entities(entity_type,name,entity_kind,display_name,normalized_name)
  values ('company','Buyer','company','Buyer','buyer') returning id into buyer_entity;
  insert into public.entities(entity_type,name,entity_kind,display_name,normalized_name)
  values ('laboratory','Seller Lab','laboratory','Seller Lab','seller lab') returning id into seller_entity;
  insert into public.economic_accounts(name,normalized_name,primary_entity_id)
  values ('Buyer Account','buyer account',buyer_entity) returning id into buyer_account;
  insert into public.economic_accounts(name,normalized_name,primary_entity_id)
  values ('Seller Account','seller account',seller_entity) returning id into seller_account;

  insert into public.transaction_networks(
    name,jurisdiction_code,buyer_economic_account_id,seller_economic_account_id,
    commercial_period,transaction_object_type,double_count_key
  ) values (
    'Testing Network','US-ME',buyer_account,seller_account,'2026-Q3','compliance testing','NETWORK|placeholder'
  ) returning id into network_id;

  insert into public.transactions(network_id,economic_account_id,transaction_type,title,currency)
  values (network_id,buyer_account,'testing_service','Buyer testing programme','USD') returning id into tx_id;

  insert into public.assertions(subject_type,subject_id,predicate,value_type,value_numeric,status)
  values ('transaction',tx_id,'invoice_total','numeric',50000,'verified') returning id into assertion_support;

  recognition := public.hv_transaction_economics_key(
    (select double_count_key from public.transaction_networks where id=network_id),
    tx_id,
    'transacted_gtv',
    'invoice-1',
    'USD'
  );

  insert into public.transaction_economics_entries(
    transaction_id,network_id,metric_type,basis,status,amount,currency,assertion_id,recognition_key
  ) values (
    tx_id,network_id,'transacted_gtv','invoice','validated',50000,'USD',assertion_support,recognition
  ) returning id into first_entry;

  begin
    insert into public.transaction_economics_entries(
      transaction_id,network_id,metric_type,basis,status,amount,currency,assertion_id,recognition_key
    ) values (
      tx_id,network_id,'transacted_gtv','invoice','validated',47500,'USD',assertion_support,recognition
    );
  exception when others then
    if position('already has current entry' in sqlerrm) > 0 then
      failed_as_expected := true;
    else
      raise;
    end if;
  end;
  if not failed_as_expected then
    raise exception 'duplicate validated recognition leaf did not fail closed';
  end if;

  insert into public.transaction_economics_entries(
    transaction_id,network_id,metric_type,basis,status,amount,currency,assertion_id,recognition_key,supersedes_entry_id
  ) values (
    tx_id,network_id,'transacted_gtv','invoice','validated',47500,'USD',assertion_support,recognition,first_entry
  ) returning id into replacement_entry;

  select amount into current_amount
    from public.transaction_current_economics_v1
   where recognition_key=recognition;
  if current_amount <> 47500 then
    raise exception 'current economics did not select replacement leaf: %', current_amount;
  end if;

  failed_as_expected := false;
  begin
    update public.transaction_economics_entries set amount=1 where id=replacement_entry;
  exception when others then
    if position('append-only' in sqlerrm) > 0 then
      failed_as_expected := true;
    else
      raise;
    end if;
  end;
  if not failed_as_expected then
    raise exception 'append-only economics mutation did not fail closed';
  end if;

  -- Scenario basis must remain scenario-only.
  failed_as_expected := false;
  begin
    insert into public.transaction_economics_entries(
      transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key,scenario_only
    ) values (
      tx_id,network_id,'estimated_gtv','scenario','validated',60000,'USD',
      public.hv_transaction_economics_key((select double_count_key from public.transaction_networks where id=network_id),tx_id,'estimated_gtv','bad-scenario','USD'),
      false
    );
  exception when check_violation then
    failed_as_expected := true;
  end;
  if not failed_as_expected then
    raise exception 'scenario basis was accepted as authoritative non-scenario economics';
  end if;

  -- Contract evidence alone cannot book transacted GTV.
  failed_as_expected := false;
  begin
    insert into public.transaction_economics_entries(
      transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key,contract_document_id
    ) values (
      tx_id,network_id,'transacted_gtv','contract','validated',48000,'USD',
      public.hv_transaction_economics_key((select double_count_key from public.transaction_networks where id=network_id),tx_id,'transacted_gtv','contract-only','USD'),
      gen_random_uuid()
    );
  exception when others then
    if sqlstate in ('23503','23514') then failed_as_expected := true; else raise; end if;
  end;
  if not failed_as_expected then
    raise exception 'contract-only basis was accepted as transacted GTV';
  end if;

  -- Loss-making gross margin remains representable.
  insert into public.transaction_economics_entries(
    transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key
  ) values (
    tx_id,network_id,'gross_margin','invoice','validated',-1250,'USD',
    public.hv_transaction_economics_key((select double_count_key from public.transaction_networks where id=network_id),tx_id,'gross_margin','negative-margin','USD')
  );

  insert into public.transaction_economics_entries(
    transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key,scenario_only
  ) values (
    tx_id,network_id,'harbourview_addressable_revenue','scenario','validated',2375,'USD',
    public.hv_transaction_economics_key((select double_count_key from public.transaction_networks where id=network_id),tx_id,'harbourview_addressable_revenue','1-percent-scenario','USD'),
    true
  );

  if exists (
    select 1 from public.transaction_current_economics_v1
    where transaction_id=tx_id and scenario_only
  ) then
    raise exception 'scenario row leaked into current recognized economics';
  end if;
end $$;

-- Specific-party diligence/economics cannot point to a party on another transaction.
do $$
declare
  account_id uuid;
  other_account_id uuid;
  tx_a uuid;
  tx_b uuid;
  party_b uuid;
  failed_as_expected boolean := false;
begin
  insert into public.economic_accounts(name,normalized_name) values ('A','a') returning id into account_id;
  insert into public.economic_accounts(name,normalized_name) values ('B','b') returning id into other_account_id;
  insert into public.transactions(transaction_type,title) values ('sale','A') returning id into tx_a;
  insert into public.transactions(transaction_type,title) values ('sale','B') returning id into tx_b;
  insert into public.transaction_parties(transaction_id,economic_account_id,party_role)
  values (tx_b,other_account_id,'buyer') returning id into party_b;

  begin
    insert into public.diligence_requirements(transaction_id,party_id,requirement_type,name,visibility_scope)
    values (tx_a,party_b,'identity','Wrong transaction party','specific_party');
  exception when foreign_key_violation then
    failed_as_expected := true;
  end;
  if not failed_as_expected then
    raise exception 'diligence accepted specific party from another transaction';
  end if;
end $$;

select 'transaction migration execution verification: PASS' as result;