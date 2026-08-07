-- Fix auth_rls_initplan: wrap auth.uid()/auth.role() in scalar subquery
-- Source: live pg_policies query 2026-07-08

DROP POLICY IF EXISTS "admin_operator_select" ON public."audit_events";
CREATE POLICY "admin_operator_select" ON public."audit_events"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_canonical_admin_operator_all" ON public."canadian_operator_canonical";
CREATE POLICY "canadian_operator_canonical_admin_operator_all" ON public."canadian_operator_canonical"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_conflicts_admin_operator_all" ON public."canadian_operator_conflicts";
CREATE POLICY "canadian_operator_conflicts_admin_operator_all" ON public."canadian_operator_conflicts"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_duplicate_clusters_admin_operator_all" ON public."canadian_operator_duplicate_clusters";
CREATE POLICY "canadian_operator_duplicate_clusters_admin_operator_all" ON public."canadian_operator_duplicate_clusters"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_exclusions_admin_operator_all" ON public."canadian_operator_exclusions";
CREATE POLICY "canadian_operator_exclusions_admin_operator_all" ON public."canadian_operator_exclusions"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_individual_holds_admin_operator_all" ON public."canadian_operator_individual_holds";
CREATE POLICY "canadian_operator_individual_holds_admin_operator_all" ON public."canadian_operator_individual_holds"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_licence_sites_admin_operator_all" ON public."canadian_operator_licence_sites";
CREATE POLICY "canadian_operator_licence_sites_admin_operator_all" ON public."canadian_operator_licence_sites"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_outreach_queue_admin_operator_all" ON public."canadian_operator_outreach_queue";
CREATE POLICY "canadian_operator_outreach_queue_admin_operator_all" ON public."canadian_operator_outreach_queue"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."candidate_review_events";
CREATE POLICY "admin_operator_select" ON public."candidate_review_events"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "cc_org_pathway_progress_member_insert" ON public."cc_org_pathway_progress";
CREATE POLICY "cc_org_pathway_progress_member_insert" ON public."cc_org_pathway_progress"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_pathway_progress_member_read" ON public."cc_org_pathway_progress";
CREATE POLICY "cc_org_pathway_progress_member_read" ON public."cc_org_pathway_progress"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_pathway_progress_member_update" ON public."cc_org_pathway_progress";
CREATE POLICY "cc_org_pathway_progress_member_update" ON public."cc_org_pathway_progress"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_req_status_member_insert" ON public."cc_org_requirement_status";
CREATE POLICY "cc_org_req_status_member_insert" ON public."cc_org_requirement_status"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_req_status_member_read" ON public."cc_org_requirement_status";
CREATE POLICY "cc_org_req_status_member_read" ON public."cc_org_requirement_status"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_req_status_member_update" ON public."cc_org_requirement_status";
CREATE POLICY "cc_org_req_status_member_update" ON public."cc_org_requirement_status"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watch_rules_member_delete" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_delete" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watch_rules_member_insert" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_insert" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((created_by = (SELECT auth.uid())) AND (org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "cc_watch_rules_member_read" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_read" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watch_rules_member_update" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_update" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_delete" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_delete" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_insert" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_insert" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((added_by = (SELECT auth.uid())) AND (org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_read" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_read" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_update" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_update" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_notifs_user_read" ON public."cc_watchlist_notifications";
CREATE POLICY "cc_watchlist_notifs_user_read" ON public."cc_watchlist_notifications"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "cc_watchlist_notifs_user_update" ON public."cc_watchlist_notifications";
CREATE POLICY "cc_watchlist_notifs_user_update" ON public."cc_watchlist_notifications"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_all_counterparty_stubs" ON public."counterparty_stubs";
CREATE POLICY "admin_all_counterparty_stubs" ON public."counterparty_stubs"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.role()) = 'admin'::text)))
  WITH CHECK ((((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.role()) = 'admin'::text)));

DROP POLICY IF EXISTS "country_intel_admin_select" ON public."country_intel";
CREATE POLICY "country_intel_admin_select" ON public."country_intel"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "country_intel_intel_tier_read" ON public."country_intel";
CREATE POLICY "country_intel_intel_tier_read" ON public."country_intel"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((review_status = 'active'::text) AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = (SELECT auth.uid())) AND (up.tier = ANY (ARRAY['intel'::text, 'operator'::text])))))));

DROP POLICY IF EXISTS "cultivar_aliases_owner_all" ON public."cultivar_aliases";
CREATE POLICY "cultivar_aliases_owner_all" ON public."cultivar_aliases"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_aliases.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_aliases.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "cultivar_country_opportunities_owner_all" ON public."cultivar_country_opportunities";
CREATE POLICY "cultivar_country_opportunities_owner_all" ON public."cultivar_country_opportunities"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_country_opportunities.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_country_opportunities.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "cultivar_passports_owner_all" ON public."cultivar_passports";
CREATE POLICY "cultivar_passports_owner_all" ON public."cultivar_passports"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()))
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()));

DROP POLICY IF EXISTS "deal_room_messages_participants_insert" ON public."deal_room_messages";
CREATE POLICY "deal_room_messages_participants_insert" ON public."deal_room_messages"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((SELECT auth.uid()) = sender_id) AND (EXISTS ( SELECT 1
   FROM deal_rooms dr
  WHERE ((dr.id = deal_room_messages.room_id) AND ((dr.initiator_id = (SELECT auth.uid())) OR (dr.counterparty_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "deal_room_messages_participants_select" ON public."deal_room_messages";
CREATE POLICY "deal_room_messages_participants_select" ON public."deal_room_messages"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM deal_rooms dr
  WHERE ((dr.id = deal_room_messages.room_id) AND ((dr.initiator_id = (SELECT auth.uid())) OR (dr.counterparty_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "deal_room_initiator_insert" ON public."deal_rooms";
CREATE POLICY "deal_room_initiator_insert" ON public."deal_rooms"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((SELECT auth.uid()) = initiator_id);

DROP POLICY IF EXISTS "deal_room_participants_select" ON public."deal_rooms";
CREATE POLICY "deal_room_participants_select" ON public."deal_rooms"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((((SELECT auth.uid()) = initiator_id) OR ((SELECT auth.uid()) = counterparty_id)));

DROP POLICY IF EXISTS "deal_room_participants_update" ON public."deal_rooms";
CREATE POLICY "deal_room_participants_update" ON public."deal_rooms"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((((SELECT auth.uid()) = initiator_id) OR ((SELECT auth.uid()) = counterparty_id)));

DROP POLICY IF EXISTS "admin_operator_select" ON public."disclosure_requests";
CREATE POLICY "admin_operator_select" ON public."disclosure_requests"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."dossiers";
CREATE POLICY "admin_operator_select" ON public."dossiers"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "education_modules_admin_select" ON public."education_modules";
CREATE POLICY "education_modules_admin_select" ON public."education_modules"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "external_sync_inbox_admin_operator_insert" ON public."external_sync_inbox";
CREATE POLICY "external_sync_inbox_admin_operator_insert" ON public."external_sync_inbox"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "external_sync_inbox_admin_operator_select" ON public."external_sync_inbox";
CREATE POLICY "external_sync_inbox_admin_operator_select" ON public."external_sync_inbox"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "external_sync_inbox_admin_operator_update" ON public."external_sync_inbox";
CREATE POLICY "external_sync_inbox_admin_operator_update" ON public."external_sync_inbox"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "genetics_access_grants_admin_owner_all" ON public."genetics_access_grants";
CREATE POLICY "genetics_access_grants_admin_owner_all" ON public."genetics_access_grants"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (grantor_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_grants.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (grantor_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_grants.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_access_grants_grantee_read" ON public."genetics_access_grants";
CREATE POLICY "genetics_access_grants_grantee_read" ON public."genetics_access_grants"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_access_grants.grantee_profile_id) AND (gp.owner_user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "genetics_access_requests_owner_all" ON public."genetics_access_requests";
CREATE POLICY "genetics_access_requests_owner_all" ON public."genetics_access_requests"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_access_requests.requester_profile_id) AND (gp.owner_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_requests.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_access_requests.requester_profile_id) AND (gp.owner_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_requests.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_claim_reviews_owner_read" ON public."genetics_claim_reviews";
CREATE POLICY "genetics_claim_reviews_owner_read" ON public."genetics_claim_reviews"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_claim_reviews.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "genetics_claims_owner_admin_all" ON public."genetics_claims";
CREATE POLICY "genetics_claims_owner_admin_all" ON public."genetics_claims"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_claims.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_claims.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_collaboration_projects_owner_all" ON public."genetics_collaboration_projects";
CREATE POLICY "genetics_collaboration_projects_owner_all" ON public."genetics_collaboration_projects"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_collaboration_projects.owner_profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_collaboration_projects.owner_profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_evidence_items_grant_read" ON public."genetics_evidence_items";
CREATE POLICY "genetics_evidence_items_grant_read" ON public."genetics_evidence_items"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (genetics_access_grants gag
     JOIN genetics_profiles gp ON ((gp.id = gag.grantee_profile_id)))
  WHERE ((gag.cultivar_id = genetics_evidence_items.cultivar_id) AND (gp.owner_user_id = (SELECT auth.uid())) AND (gag.status = 'active'::access_grant_status) AND (gag.starts_at <= now()) AND ((gag.expires_at IS NULL) OR (gag.expires_at > now())) AND (gag.revoked_at IS NULL) AND ((genetics_evidence_items.id = ANY (gag.allowed_evidence_item_ids)) OR (genetics_evidence_items.evidence_type = ANY (gag.allowed_evidence_types)))))));

DROP POLICY IF EXISTS "genetics_evidence_items_owner_all" ON public."genetics_evidence_items";
CREATE POLICY "genetics_evidence_items_owner_all" ON public."genetics_evidence_items"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((created_by = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_evidence_items.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_evidence_items.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_profile_roles_owner_all" ON public."genetics_profile_roles";
CREATE POLICY "genetics_profile_roles_owner_all" ON public."genetics_profile_roles"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_profile_roles.profile_id) AND ((gp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_profile_roles.profile_id) AND ((gp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "genetics_profile_roles_owner_read" ON public."genetics_profile_roles";
CREATE POLICY "genetics_profile_roles_owner_read" ON public."genetics_profile_roles"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_profile_roles.profile_id) AND ((gp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "genetics_profiles_owner_all" ON public."genetics_profiles";
CREATE POLICY "genetics_profiles_owner_all" ON public."genetics_profiles"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()))
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()));

DROP POLICY IF EXISTS "genetics_project_members_member_read" ON public."genetics_project_members";
CREATE POLICY "genetics_project_members_member_read" ON public."genetics_project_members"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_project_members.profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_routing_events_admin_operator_all" ON public."genetics_routing_events";
CREATE POLICY "genetics_routing_events_admin_operator_all" ON public."genetics_routing_events"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "genetics_routing_events_analyst_read" ON public."genetics_routing_events";
CREATE POLICY "genetics_routing_events_analyst_read" ON public."genetics_routing_events"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "genetics_routing_records_admin_operator_all" ON public."genetics_routing_records";
CREATE POLICY "genetics_routing_records_admin_operator_all" ON public."genetics_routing_records"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "genetics_routing_records_analyst_read" ON public."genetics_routing_records";
CREATE POLICY "genetics_routing_records_analyst_read" ON public."genetics_routing_records"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "genetics_service_providers_owner_all" ON public."genetics_service_providers";
CREATE POLICY "genetics_service_providers_owner_all" ON public."genetics_service_providers"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_service_providers.profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_service_providers.profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "health_canada_raw_source_rows_admin_operator_all" ON public."health_canada_raw_source_rows";
CREATE POLICY "health_canada_raw_source_rows_admin_operator_all" ON public."health_canada_raw_source_rows"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "health_canada_source_snapshots_admin_operator_all" ON public."health_canada_source_snapshots";
CREATE POLICY "health_canada_source_snapshots_admin_operator_all" ON public."health_canada_source_snapshots"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "hv_artifacts_workspace_isolation" ON public."hv_artifacts";
CREATE POLICY "hv_artifacts_workspace_isolation" ON public."hv_artifacts"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_embeddings_workspace_isolation" ON public."hv_embeddings";
CREATE POLICY "hv_embeddings_workspace_isolation" ON public."hv_embeddings"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_evidence_workspace_isolation" ON public."hv_evidence";
CREATE POLICY "hv_evidence_workspace_isolation" ON public."hv_evidence"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_import_staging_admin" ON public."hv_import_staging";
CREATE POLICY "hv_import_staging_admin" ON public."hv_import_staging"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "hv_job_attempts_admin_only" ON public."hv_job_attempts";
CREATE POLICY "hv_job_attempts_admin_only" ON public."hv_job_attempts"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "hv_jobs_admin_only" ON public."hv_processing_jobs";
CREATE POLICY "hv_jobs_admin_only" ON public."hv_processing_jobs"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "hv_public_feed_admin_write" ON public."hv_public_feed";
CREATE POLICY "hv_public_feed_admin_write" ON public."hv_public_feed"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "hv_relations_workspace_isolation" ON public."hv_relations";
CREATE POLICY "hv_relations_workspace_isolation" ON public."hv_relations"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_review_decisions_workspace_isolation" ON public."hv_review_decisions";
CREATE POLICY "hv_review_decisions_workspace_isolation" ON public."hv_review_decisions"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "ia_agent_tasks_admin_operator_all" ON public."ia_agent_tasks";
CREATE POLICY "ia_agent_tasks_admin_operator_all" ON public."ia_agent_tasks"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_counterparties_admin_operator_all" ON public."ia_counterparties";
CREATE POLICY "ia_counterparties_admin_operator_all" ON public."ia_counterparties"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_evidence_admin_operator_all" ON public."ia_evidence_vault";
CREATE POLICY "ia_evidence_admin_operator_all" ON public."ia_evidence_vault"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_feedback_admin_operator_all" ON public."ia_feedback_events";
CREATE POLICY "ia_feedback_admin_operator_all" ON public."ia_feedback_events"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_graph_edges_admin_operator_all" ON public."ia_graph_edges";
CREATE POLICY "ia_graph_edges_admin_operator_all" ON public."ia_graph_edges"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_graph_entities_admin_operator_all" ON public."ia_graph_entities";
CREATE POLICY "ia_graph_entities_admin_operator_all" ON public."ia_graph_entities"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_scoring_admin_operator_all" ON public."ia_scoring_records";
CREATE POLICY "ia_scoring_admin_operator_all" ON public."ia_scoring_records"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signal_embeddings_admin_operator_all" ON public."ia_signal_embeddings";
CREATE POLICY "ia_signal_embeddings_admin_operator_all" ON public."ia_signal_embeddings"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signal_embeddings_intel_tier_read" ON public."ia_signal_embeddings";
CREATE POLICY "ia_signal_embeddings_intel_tier_read" ON public."ia_signal_embeddings"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = (SELECT auth.uid())) AND (up.tier = ANY (ARRAY['intel'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signals_admin_operator_all" ON public."ia_signals";
CREATE POLICY "ia_signals_admin_operator_all" ON public."ia_signals"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signals_intel_tier_read" ON public."ia_signals";
CREATE POLICY "ia_signals_intel_tier_read" ON public."ia_signals"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = (SELECT auth.uid())) AND (up.tier = ANY (ARRAY['intel'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_source_embeddings_admin_operator_all" ON public."ia_source_embeddings";
CREATE POLICY "ia_source_embeddings_admin_operator_all" ON public."ia_source_embeddings"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_sources_admin_operator_all" ON public."ia_sources";
CREATE POLICY "ia_sources_admin_operator_all" ON public."ia_sources"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "intelligence_jobs_admin_read" ON public."intelligence_jobs";
CREATE POLICY "intelligence_jobs_admin_read" ON public."intelligence_jobs"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."internal_admin_notes";
CREATE POLICY "admin_operator_select" ON public."internal_admin_notes"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."listings";
CREATE POLICY "admin_operator_select" ON public."listings"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "Authenticated sellers can insert own candidates" ON public."marketplace_candidates";
CREATE POLICY "Authenticated sellers can insert own candidates" ON public."marketplace_candidates"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((submitted_by = (SELECT auth.uid())) AND (submission_source = 'self_serve'::text)));

DROP POLICY IF EXISTS "Authenticated sellers can view own submissions" ON public."marketplace_candidates";
CREATE POLICY "Authenticated sellers can view own submissions" ON public."marketplace_candidates"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((submitted_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_operator_select" ON public."marketplace_candidates";
CREATE POLICY "admin_operator_select" ON public."marketplace_candidates"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."matches";
CREATE POLICY "admin_operator_select" ON public."matches"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_only" ON public."network_public_projections";
CREATE POLICY "admin_operator_only" ON public."network_public_projections"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_only" ON public."network_review_items";
CREATE POLICY "admin_operator_only" ON public."network_review_items"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "opportunities_admin_operator_read" ON public."opportunities";
CREATE POLICY "opportunities_admin_operator_read" ON public."opportunities"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "project_control_refs_admin_operator_analyst_select" ON public."project_control_refs";
CREATE POLICY "project_control_refs_admin_operator_analyst_select" ON public."project_control_refs"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "project_control_refs_admin_operator_insert" ON public."project_control_refs";
CREATE POLICY "project_control_refs_admin_operator_insert" ON public."project_control_refs"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "project_control_refs_admin_operator_update" ON public."project_control_refs";
CREATE POLICY "project_control_refs_admin_operator_update" ON public."project_control_refs"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "project_vault_admin_delete" ON public."project_vault";
CREATE POLICY "project_vault_admin_delete" ON public."project_vault"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "project_vault_admin_insert" ON public."project_vault";
CREATE POLICY "project_vault_admin_insert" ON public."project_vault"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "project_vault_admin_select" ON public."project_vault";
CREATE POLICY "project_vault_admin_select" ON public."project_vault"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "project_vault_admin_update" ON public."project_vault";
CREATE POLICY "project_vault_admin_update" ON public."project_vault"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DO $guard_schema_drift_alerts_policy$
BEGIN
  IF to_regclass('public.schema_drift_alerts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "schema_drift_alerts_admin_only" ON public."schema_drift_alerts"';
    EXECUTE $policy$
      CREATE POLICY "schema_drift_alerts_admin_only" ON public."schema_drift_alerts"
        AS PERMISSIVE
        FOR ALL
        TO PUBLIC
        USING ((EXISTS ( SELECT 1
         FROM user_roles
        WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))))
    $policy$;
  END IF;
END
$guard_schema_drift_alerts_policy$;

DROP POLICY IF EXISTS "signal_digest_log_user_read" ON public."signal_digest_log";
CREATE POLICY "signal_digest_log_user_read" ON public."signal_digest_log"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM signal_subscriptions s
  WHERE ((s.id = signal_digest_log.subscription_id) AND (s.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "signal_subscriptions_user_self" ON public."signal_subscriptions";
CREATE POLICY "signal_subscriptions_user_self" ON public."signal_subscriptions"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "signals_admin_operator_analyst_select" ON public."signals";
CREATE POLICY "signals_admin_operator_analyst_select" ON public."signals"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."source_documents";
CREATE POLICY "admin_operator_select" ON public."source_documents"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."source_registry";
CREATE POLICY "admin_operator_select" ON public."source_registry"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."source_snapshots";
CREATE POLICY "admin_operator_select" ON public."source_snapshots"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."sources";
CREATE POLICY "admin_operator_select" ON public."sources"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."status_history";
CREATE POLICY "admin_operator_select" ON public."status_history"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public."subscriptions";
CREATE POLICY "Users can view own subscriptions" ON public."subscriptions"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can delete their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can insert their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can read their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can read their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can update their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own profile" ON public."user_profiles";
CREATE POLICY "Users can update own profile" ON public."user_profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own profile" ON public."user_profiles";
CREATE POLICY "Users can view own profile" ON public."user_profiles"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "user_profiles_service_insert" ON public."user_profiles";
CREATE POLICY "user_profiles_service_insert" ON public."user_profiles"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((SELECT auth.role()) = 'service_role'::text) OR ((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "user_roles_self_read" ON public."user_roles";
CREATE POLICY "user_roles_self_read" ON public."user_roles"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "workspace_members_admin_delete" ON public."workspace_members";
CREATE POLICY "workspace_members_admin_delete" ON public."workspace_members"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "workspace_members_admin_insert" ON public."workspace_members";
CREATE POLICY "workspace_members_admin_insert" ON public."workspace_members"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "workspace_members_admin_update" ON public."workspace_members";
CREATE POLICY "workspace_members_admin_update" ON public."workspace_members"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "workspace_members_read" ON public."workspace_members";
CREATE POLICY "workspace_members_read" ON public."workspace_members"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((((SELECT auth.uid()) = user_id) OR ((SELECT auth.role()) = 'admin'::text)));

DROP POLICY IF EXISTS "admin_operator_select" ON public."workspaces";
CREATE POLICY "admin_operator_select" ON public."workspaces"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."evidence";
CREATE POLICY "admin_all" ON "regulatory_signals"."evidence"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."publication_events";
CREATE POLICY "admin_all" ON "regulatory_signals"."publication_events"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."review_events";
CREATE POLICY "admin_all" ON "regulatory_signals"."review_events"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."signal_evidence_links";
CREATE POLICY "admin_all" ON "regulatory_signals"."signal_evidence_links"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."signals";
CREATE POLICY "admin_all" ON "regulatory_signals"."signals"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "regulatory_source_check_runs_admin_operator_only" ON "regulatory_signals"."source_check_runs";
CREATE POLICY "regulatory_source_check_runs_admin_operator_only" ON "regulatory_signals"."source_check_runs"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "regulatory_source_snapshots_admin_operator_only" ON "regulatory_signals"."source_snapshots";
CREATE POLICY "regulatory_source_snapshots_admin_operator_only" ON "regulatory_signals"."source_snapshots"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."sources";
CREATE POLICY "admin_all" ON "regulatory_signals"."sources"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));