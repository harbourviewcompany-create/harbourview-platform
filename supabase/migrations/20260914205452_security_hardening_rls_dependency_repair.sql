-- Restored from production migration ledger on 2026-09-16.
do $$
declare signature text;
  rls_allowlist constant text[] := array[
    'public.clinical_evidence_has_review_role(text[])','public.clinical_has_active_consent(uuid,text)','public.education_can_manage()','public.education_has_review_role(text[])','public.harbourview_is_admin_or_operator()','public.hv_has_transaction_role(text[])','public.hv_is_specific_transaction_party(uuid)','public.hv_is_transaction_participant(uuid)','public.hv_network_active_workspace_member(uuid)','public.is_verified_clinician(uuid)'
  ];
begin
  foreach signature in array rls_allowlist loop
    if to_regprocedure(signature) is not null then execute format('grant execute on function %s to authenticated', signature); end if;
  end loop;
end $$;
do $$
begin
  if to_regclass('public.marketplace_public_listings_v1') is not null then
    alter view public.marketplace_public_listings_v1 set (security_invoker = true);
    revoke all privileges on table public.marketplace_public_listings_v1 from public, anon, authenticated;
    grant select on table public.marketplace_public_listings_v1 to anon, authenticated, service_role;
  end if;
end $$;
