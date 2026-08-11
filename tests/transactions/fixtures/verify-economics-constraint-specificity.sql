\set ON_ERROR_STOP on

-- Prove contract-only evidence is rejected specifically by the transacted-GTV basis rule,
-- not merely by a missing contract document FK or another unrelated constraint.
do $$
declare
  tx_id uuid;
  doc_id uuid;
  recognition text;
  violated_constraint text;
begin
  insert into public.transactions(transaction_type,title,currency)
  values ('sale','Contract-only transacted GTV negative control','USD')
  returning id into tx_id;

  insert into public.hv_evidence_documents default values
  returning id into doc_id;

  recognition := public.hv_transaction_economics_key(
    null,
    tx_id,
    'transacted_gtv',
    'contract-only-specificity',
    'USD'
  );

  begin
    insert into public.transaction_economics_entries(
      transaction_id,
      metric_type,
      basis,
      status,
      amount,
      currency,
      recognition_key,
      contract_document_id
    ) values (
      tx_id,
      'transacted_gtv',
      'contract',
      'validated',
      1000,
      'USD',
      recognition,
      doc_id
    );
    raise exception 'contract-only transacted GTV unexpectedly inserted';
  exception
    when check_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint is distinct from 'transaction_economics_transacted_basis_chk' then
        raise exception 'expected transaction_economics_transacted_basis_chk, received %', violated_constraint;
      end if;
  end;
end $$;

-- Prove economics specific-party scoping is independently bound to the same transaction.
do $$
declare
  account_a uuid;
  account_b uuid;
  tx_a uuid;
  tx_b uuid;
  party_b uuid;
  recognition text;
  violated_constraint text;
begin
  insert into public.economic_accounts(name,normalized_name)
  values ('Constraint Account A','constraint account a')
  returning id into account_a;

  insert into public.economic_accounts(name,normalized_name)
  values ('Constraint Account B','constraint account b')
  returning id into account_b;

  insert into public.transactions(transaction_type,title,currency)
  values ('sale','Economics party scope A','USD')
  returning id into tx_a;

  insert into public.transactions(transaction_type,title,currency)
  values ('sale','Economics party scope B','USD')
  returning id into tx_b;

  insert into public.transaction_parties(
    transaction_id,
    economic_account_id,
    party_role,
    visibility_scope
  ) values (
    tx_b,
    account_b,
    'buyer',
    'platform_only'
  ) returning id into party_b;

  recognition := public.hv_transaction_economics_key(
    null,
    tx_a,
    'estimated_gtv',
    'cross-transaction-party-specificity',
    'USD'
  );

  begin
    insert into public.transaction_economics_entries(
      transaction_id,
      metric_type,
      basis,
      status,
      amount,
      currency,
      recognition_key,
      visibility_scope,
      specific_party_id
    ) values (
      tx_a,
      'estimated_gtv',
      'modeled',
      'draft',
      1000,
      'USD',
      recognition,
      'specific_party',
      party_b
    );
    raise exception 'cross-transaction economics specific_party_id unexpectedly inserted';
  exception
    when foreign_key_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint is distinct from 'transaction_economics_specific_party_transaction_fk' then
        raise exception 'expected transaction_economics_specific_party_transaction_fk, received %', violated_constraint;
      end if;
  end;
end $$;

select 'transaction economics constraint-specificity verification: PASS' as result;
