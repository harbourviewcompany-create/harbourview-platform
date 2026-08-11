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

-- RLS enabled on every new table.
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

-- Nullable compatibility bridges are present.
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
    array['buyer_requests','economic_account_id'],
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

-- Deterministic key shape.
do $$
declare
  buyer uuid := '11111111-1111-4111-8111-111111111111';
  seller uuid := '22222222-2222-4222-8222-222222222222';
  tx uuid := '33333333-3333-4333-8333-333333333333';
  network_key text;
  econ_key text;
begin
  network_key := public.hv_transaction_network_key(' us-me ', buyer, seller, ' Compliance  Testing ', ' 2026 q3 ');
  if network_key <> 'NETWORK|US-ME|11111111-1111-4111-8111-111111111111|22222222-2222-4222-8222-222222222222|compliance-testing|2026-Q3' then
    raise exception 'unexpected network key %', network_key;
  end if;

  econ_key := public.hv_transaction_economics_key(network_key, tx, 'transacted_gtv', 'Invoice 23984', 'usd');
  if econ_key <> network_key::text::text then
    -- deliberate no-op branch: actual assertion below keeps readable expected prefix/event checks.
    null;
  end if;
  if econ_key not like 'ECON|NETWORK|US-ME|%|transacted_gtv|invoice-23984|USD' then
    raise exception 'unexpected economics key %', econ_key;
  end if;
end $$;

-- Append-only recognition chain and portfolio de-duplication.
do $$
declare
  buyer_entity uuid;
  seller_entity uuid;
  buyer_account uuid;
  seller_account uuid;
  network_id uuid;
  tx_id uuid;
  first_entry uuid;
  replacement_entry uuid;
  recognition text;
  current_amount numeric;
  failed_as_expected boolean := false;
begin
  insert into public.entities(entity_kind,display_name,normalized_name)
  values ('company','Buyer','buyer') returning id into buyer_entity;
  insert into public.entities(entity_kind,display_name,normalized_name)
  values ('laboratory','Seller Lab','seller lab') returning id into seller_entity;
  insert into public.economic_accounts(name,normalized_name,primary_entity_id)
  values ('Buyer Account','buyer account',buyer_entity) returning id into buyer_account;
  insert into public.economic_accounts(name,normalized_name,primary_entity_id)
  values ('Seller Account','seller account',seller_entity) returning id into seller_account;

  insert into public.transaction_networks(name,transaction_object_type,double_count_key)
  values (
    'Testing Network',
    'compliance-testing',
    public.hv_transaction_network_key('US-ME',buyer_account,seller_account,'compliance testing','2026-Q3')
  ) returning id into network_id;

  insert into public.transactions(network_id,economic_account_id,transaction_type,title,currency)
  values (network_id,buyer_account,'testing_service','Buyer testing programme','USD') returning id into tx_id;

  recognition := public.hv_transaction_economics_key(
    (select double_count_key from public.transaction_networks where id=network_id),
    tx_id,
    'transacted_gtv',
    'invoice-1',
    'USD'
  );

  insert into public.transaction_economics_entries(
    transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key
  ) values (
    tx_id,network_id,'transacted_gtv','invoice','validated',50000,'USD',recognition
  ) returning id into first_entry;

  begin
    insert into public.transaction_economics_entries(
      transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key
    ) values (
      tx_id,network_id,'transacted_gtv','invoice','validated',47500,'USD',recognition
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
    transaction_id,network_id,metric_type,basis,status,amount,currency,recognition_key,supersedes_entry_id
  ) values (
    tx_id,network_id,'transacted_gtv','invoice','validated',47500,'USD',recognition,first_entry
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

select 'transaction migration execution verification: PASS' as result;
