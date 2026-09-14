-- Security hardening repair — 2026-09-14.
--
-- The release-closure hardening migration correctly revoked SECURITY DEFINER
-- execution from browser roles, but its audited authenticated allowlist did not
-- include every SECURITY DEFINER helper referenced by RLS policies present in
-- the current schema. That leaves policy evaluation unable to execute for
-- authenticated callers. This migration restores only those policy dependencies.
--
-- It also re-applies the explicit public-read contract for the marketplace view
-- when that view exists. This is necessary because the view can be created by a
-- later migration after the original hardening inventory ran.
--
-- No business rows are changed.

do $$
declare
  signature text;
  rls_allowlist constant text[] := array[
    'public.clinical_evidence_has_review_role(text[])',
    'public.clinical_has_active_consent(uuid,text)',
    'public.education_can_manage()',
    'public.education_has_review_role(text[])',
    'public.harbourview_is_admin_or_operator()',
    'public.hv_has_transaction_role(text[])',
    'public.hv_is_specific_transaction_party(uuid)',
    'public.hv_is_transaction_participant(uuid)',
    'public.hv_network_active_workspace_member(uuid)',
    'public.is_verified_clinician(uuid)'
  ];
begin
  foreach signature in array rls_allowlist
  loop
    if to_regprocedure(signature) is not null then
      execute format('grant execute on function %s to authenticated', signature);
    end if;
  end loop;
end
$$;

-- Keep the intended public read contract explicit for a view that may have been
-- created after the original security-hardening migration.
do $$
begin
  if to_regclass('public.marketplace_public_listings_v1') is not null then
    alter view public.marketplace_public_listings_v1 set (security_invoker = true);
    revoke all privileges on table public.marketplace_public_listings_v1 from public, anon, authenticated;
    grant select on table public.marketplace_public_listings_v1 to anon, authenticated, service_role;
  end if;
end
$$;
