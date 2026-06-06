-- Harbourview Supabase + Airtable integration foundation: RLS policies.
alter table hv_core.app_profiles enable row level security;
alter table hv_core.jurisdictions enable row level security;
alter table hv_core.source_types enable row level security;
alter table hv_core.source_organizations enable row level security;
alter table hv_core.sources enable row level security;
alter table hv_core.market_signals enable row level security;
alter table hv_private.verification_queue enable row level security;
alter table hv_private.rejected_records enable row level security;
alter table hv_private.evidence_items enable row level security;
alter table hv_commercial.companies enable row level security;
alter table hv_commercial.people enable row level security;
alter table hv_commercial.offers enable row level security;
alter table hv_commercial.opportunities enable row level security;
alter table hv_marketplace.listings enable row level security;
alter table hv_education.resources enable row level security;
alter table hv_sync.airtable_sync_log enable row level security;
alter table hv_audit.action_log enable row level security;
alter table hv_search.search_documents enable row level security;

create policy hv_core_operator_read_jurisdictions on hv_core.jurisdictions for select using (hv_core.is_operator_or_admin());
create policy hv_core_admin_manage_jurisdictions on hv_core.jurisdictions for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_core_operator_read_source_types on hv_core.source_types for select using (hv_core.is_operator_or_admin());
create policy hv_core_admin_manage_source_types on hv_core.source_types for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_core_operator_read_source_organizations on hv_core.source_organizations for select using (hv_core.is_operator_or_admin());
create policy hv_core_admin_manage_source_organizations on hv_core.source_organizations for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_core_operator_read_sources on hv_core.sources for select using (hv_core.is_operator_or_admin());
create policy hv_core_admin_manage_sources on hv_core.sources for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_core_operator_read_market_signals on hv_core.market_signals for select using (hv_core.is_operator_or_admin());
create policy hv_core_admin_manage_market_signals on hv_core.market_signals for all using (hv_core.is_admin()) with check (hv_core.is_admin());

create policy hv_profiles_self_or_operator_read on hv_core.app_profiles for select using (hv_core.is_operator_or_admin() or auth.uid() = auth_user_id);
create policy hv_profiles_admin_manage on hv_core.app_profiles for all using (hv_core.is_admin()) with check (hv_core.is_admin());

create policy hv_private_operator_read_verification_queue on hv_private.verification_queue for select using (hv_core.is_operator_or_admin());
create policy hv_private_admin_manage_verification_queue on hv_private.verification_queue for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_private_operator_read_rejected_records on hv_private.rejected_records for select using (hv_core.is_operator_or_admin());
create policy hv_private_admin_manage_rejected_records on hv_private.rejected_records for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_private_operator_read_evidence_items on hv_private.evidence_items for select using (hv_core.is_operator_or_admin());
create policy hv_private_admin_manage_evidence_items on hv_private.evidence_items for all using (hv_core.is_admin()) with check (hv_core.is_admin());

create policy hv_companies_account_or_operator_read on hv_commercial.companies for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
create policy hv_companies_admin_manage on hv_commercial.companies for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_people_account_or_operator_read on hv_commercial.people for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
create policy hv_people_admin_manage on hv_commercial.people for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_offers_account_or_operator_read on hv_commercial.offers for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
create policy hv_offers_admin_manage on hv_commercial.offers for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_opportunities_account_or_operator_read on hv_commercial.opportunities for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
create policy hv_opportunities_admin_manage on hv_commercial.opportunities for all using (hv_core.is_admin()) with check (hv_core.is_admin());

create policy hv_marketplace_account_or_operator_read on hv_marketplace.listings for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
create policy hv_marketplace_admin_manage on hv_marketplace.listings for all using (hv_core.is_admin()) with check (hv_core.is_admin());

create policy hv_education_operator_read on hv_education.resources for select using (hv_core.is_operator_or_admin());
create policy hv_education_admin_manage on hv_education.resources for all using (hv_core.is_admin()) with check (hv_core.is_admin());
create policy hv_sync_operator_read on hv_sync.airtable_sync_log for select using (hv_core.is_operator_or_admin());
create policy hv_sync_service_insert on hv_sync.airtable_sync_log for insert with check (hv_core.current_role() = 'service_role');
create policy hv_sync_service_update on hv_sync.airtable_sync_log for update using (hv_core.current_role() = 'service_role') with check (hv_core.current_role() = 'service_role');
create policy hv_audit_operator_read on hv_audit.action_log for select using (hv_core.is_operator_or_admin());
create policy hv_audit_service_insert on hv_audit.action_log for insert with check (hv_core.current_role() = 'service_role' or hv_core.is_admin());
create policy hv_search_public_or_operator_read on hv_search.search_documents for select using ((visibility = 'public' and verification_status = 'verified' and review_status = 'approved') or hv_core.is_operator_or_admin());
create policy hv_search_admin_manage on hv_search.search_documents for all using (hv_core.is_admin()) with check (hv_core.is_admin());

grant usage on schema hv_core, hv_private, hv_commercial, hv_marketplace, hv_education, hv_sync, hv_audit, hv_search to authenticated;
grant select, insert, update, delete on all tables in schema hv_core to authenticated;
grant select, insert, update, delete on all tables in schema hv_private to authenticated;
grant select, insert, update, delete on all tables in schema hv_commercial to authenticated;
grant select, insert, update, delete on all tables in schema hv_marketplace to authenticated;
grant select, insert, update, delete on all tables in schema hv_education to authenticated;
grant select, insert, update on all tables in schema hv_sync to authenticated;
grant select, insert on all tables in schema hv_audit to authenticated;
grant select, insert, update, delete on all tables in schema hv_search to authenticated;
