alter function api.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function api.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;
alter function public.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function public.hv_has_transaction_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_specific_transaction_party(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_is_transaction_participant(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_network_active_workspace_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;
