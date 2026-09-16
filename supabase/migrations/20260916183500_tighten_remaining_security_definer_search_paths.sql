-- Normalize SECURITY DEFINER helper search paths to an explicit minimal allowlist.
-- This removes unnecessary schemas from privileged function resolution and keeps
-- auth.uid()/auth.role() explicitly resolvable alongside public application tables.

alter function public.is_regulatory_tier_admin() set search_path = pg_catalog, public, auth;
alter function public.is_harbourview_admin() set search_path = pg_catalog, public, auth;
alter function public.hv_is_platform_staff() set search_path = pg_catalog, public, auth;
alter function public.clinical_evidence_has_review_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_org_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_genetics_admin_or_reviewer() set search_path = pg_catalog, public, auth;
alter function public.is_hv_staff() set search_path = pg_catalog, public, auth;
alter function public.current_user_tier() set search_path = pg_catalog, public, auth;
alter function api.get_source_registry_coverage(text) set search_path = pg_catalog, public, auth;
alter function api.regulatory_pending_changes_feed() set search_path = pg_catalog, public, auth;
alter function api.clinical_request_verification(text,text,text,uuid) set search_path = pg_catalog, public, auth;
alter function api.submit_signal_relevance_feedback(text,text,text,text) set search_path = pg_catalog, public, auth;
alter function api.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function api.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;
alter function public.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function public.hv_has_transaction_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_specific_transaction_party(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_is_transaction_participant(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_network_active_workspace_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;
