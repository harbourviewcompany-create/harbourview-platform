-- Performance fixes from Supabase's own advisor (964 findings reviewed;
-- this addresses the low-risk, well-documented subset). See
-- docs/control/EVIDENCE_LOG.md for the full triage.
--
-- NOT addressed here, deliberately: multiple_permissive_policies (391) and
-- unused_index (478). Both carry real risk if fixed in bulk without
-- per-case review -- overlapping permissive RLS policies are often
-- intentional layered logic (e.g. "owns row" OR "is admin"), and dropping
-- an index on stats alone risks removing one that's actually load-bearing
-- for a query pattern the stats window didn't capture. Flagged for a
-- separate, slower pass rather than rushed here.
-- no_primary_key (2): both are one-off dated backup tables
-- (education_module_sections_backup_20260705, country_intel_backup_20260630)
-- -- expected to lack a PK, not a defect.

-- 1. auth_rls_initplan (11): RLS policies re-evaluating auth.uid() per row
-- instead of once per query. Wrapping in (select ...) lets Postgres hoist
-- it into an initplan. Purely a performance change -- verified each
-- USING/WITH CHECK clause against the live policy before editing, so the
-- access-control semantics are byte-identical, just faster to evaluate.

ALTER POLICY clinical_admin_audit_admin_read ON public.clinical_admin_audit_log
  USING (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text])))));

ALTER POLICY clinical_decision_records_member_access ON public.clinical_decision_records
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_decision_records.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND (clinician_user_id = (select auth.uid())) AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text));

ALTER POLICY clinical_patient_contexts_member_access ON public.clinical_patient_contexts
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_patient_contexts.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND (recorded_by = (select auth.uid())) AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_patient_contexts.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))));

ALTER POLICY clinical_patient_impact_reviews_member_access ON public.clinical_patient_impact_reviews
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_patient_impact_reviews.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text));

ALTER POLICY clinical_therapeutic_objectives_member_access ON public.clinical_therapeutic_objectives
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_therapeutic_objectives.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND (recorded_by = (select auth.uid())) AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text));

ALTER POLICY talent_alerts_own ON public.talent_alerts
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY talent_applications_select_own ON public.talent_applications
  USING (user_id = (select auth.uid()));

ALTER POLICY talent_applications_update_own ON public.talent_applications
  USING (user_id = (select auth.uid()));

ALTER POLICY talent_opportunities_select_published ON public.talent_opportunities
  USING ((status = 'published'::text) OR (created_by = (select auth.uid())));

ALTER POLICY talent_opportunities_update_own ON public.talent_opportunities
  USING ((created_by = (select auth.uid())) AND (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'closed'::text])))
  WITH CHECK ((created_by = (select auth.uid())) AND (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'closed'::text, 'archived'::text])));

ALTER POLICY talent_saved_jobs_own ON public.talent_saved_jobs
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 2. duplicate_index (1): source_registry had two byte-identical unique
-- indexes on source_url. Confirmed both indexdefs matched exactly and
-- neither name is referenced anywhere in the repo before dropping.
DROP INDEX IF EXISTS public.source_registry_source_url_unique_idx2;

-- 3. unindexed_foreign_keys (81): every FK in public/job_search/
-- regulatory_signals the advisor flagged as lacking a covering index.
-- Adding an index is close to risk-free (write-path cost only, no
-- behavior change), unlike dropping one -- so applied in full rather
-- than triaged. Verified afterward: 0 FKs in these three schemas remain
-- without a covering index.

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON job_search.contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON job_search.jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_application_id ON job_search.outreach_messages (application_id);
CREATE INDEX IF NOT EXISTS idx_prospects_company_id ON job_search.prospects (company_id);
CREATE INDEX IF NOT EXISTS idx_client_error_reports_user_id ON public.client_error_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_encounter_id ON public.clinical_adverse_events (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_formulary_product_id ON public.clinical_adverse_events (formulary_product_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_formulary_sku_id ON public.clinical_adverse_events (formulary_sku_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_professional_id ON public.clinical_adverse_events (professional_id);
CREATE INDEX IF NOT EXISTS idx_clinical_calculations_encounter_id ON public.clinical_calculations (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_care_team_professional_id ON public.clinical_care_team (professional_id);
CREATE INDEX IF NOT EXISTS idx_clinical_concepts_superseded_by_id ON public.clinical_concepts (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_condition_evidence_links_evidence_record_id ON public.clinical_condition_evidence_links (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_condition_terms_superseded_by_condition_id ON public.clinical_condition_terms (superseded_by_condition_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decision_records_encounter_id ON public.clinical_decision_records (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_claims_superseded_by_id ON public.clinical_evidence_claims (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_condition_term_id ON public.clinical_evidence_conflicts (condition_term_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_evidence_record_a_id ON public.clinical_evidence_conflicts (evidence_record_a_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_evidence_record_b_id ON public.clinical_evidence_conflicts (evidence_record_b_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_resolution_review_id ON public.clinical_evidence_conflicts (resolution_review_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_extractions_source_id ON public.clinical_evidence_extractions (source_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_extractions_source_snapshot_id ON public.clinical_evidence_extractions (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_grade_assessments_grading_method_key ON public.clinical_evidence_grade_assessments (grading_method_key);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_grade_assessments_review_id ON public.clinical_evidence_grade_assessments (review_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_outcome_links_source_snapshot_id ON public.clinical_evidence_outcome_links (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_condition_term_id ON public.clinical_evidence_records (condition_term_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_primary_source_registry_id ON public.clinical_evidence_records (primary_source_registry_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_superseded_by_id ON public.clinical_evidence_records (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_reviews_reviewer_credential_id ON public.clinical_evidence_reviews (reviewer_credential_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_source_snapshots_source_id ON public.clinical_evidence_source_snapshots (source_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_sources_latest_snapshot_id ON public.clinical_evidence_sources (latest_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_sources_superseded_by_source_id ON public.clinical_evidence_sources (superseded_by_source_id);
CREATE INDEX IF NOT EXISTS idx_clinical_formulary_skus_feed_run_id ON public.clinical_formulary_skus (feed_run_id);
CREATE INDEX IF NOT EXISTS idx_clinical_guideline_recommendations_concept_id ON public.clinical_guideline_recommendations (concept_id);
CREATE INDEX IF NOT EXISTS idx_clinical_guideline_recommendations_superseded_by_id ON public.clinical_guideline_recommendations (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_intake_queue_latest_snapshot_id ON public.clinical_intake_queue (latest_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_monitoring_protocols_concept_id ON public.clinical_monitoring_protocols (concept_id);
CREATE INDEX IF NOT EXISTS idx_clinical_monitoring_protocols_formulary_product_id ON public.clinical_monitoring_protocols (formulary_product_id);
CREATE INDEX IF NOT EXISTS idx_clinical_outcome_evidence_evidence_record_id ON public.clinical_outcome_evidence (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_outcome_evidence_source_snapshot_id ON public.clinical_outcome_evidence (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_patient_contexts_encounter_id ON public.clinical_patient_contexts (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_patient_impact_reviews_change_event_id ON public.clinical_patient_impact_reviews (change_event_id);
CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_encounter_id ON public.clinical_prescriptions (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_recommendation_id ON public.clinical_prescriptions (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_recommendations_calculation_id ON public.clinical_recommendations (calculation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_recommendations_encounter_id ON public.clinical_recommendations (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_reviewer_credentials_verified_by ON public.clinical_reviewer_credentials (verified_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_safety_rules_evidence_record_id ON public.clinical_safety_rules (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_safety_rules_interaction_id ON public.clinical_safety_rules (interaction_id);
CREATE INDEX IF NOT EXISTS idx_clinical_structured_extractions_evidence_record_id ON public.clinical_structured_extractions (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_structured_extractions_source_snapshot_id ON public.clinical_structured_extractions (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_therapeutic_objectives_concept_id ON public.clinical_therapeutic_objectives (concept_id);
CREATE INDEX IF NOT EXISTS idx_clinical_therapeutic_objectives_encounter_id ON public.clinical_therapeutic_objectives (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_view_audit_evidence_record_id ON public.clinical_view_audit (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_deal_capital_raises_company_operator_id ON public.deal_capital_raises (company_operator_id);
CREATE INDEX IF NOT EXISTS idx_deal_ma_transactions_acquirer_operator_id ON public.deal_ma_transactions (acquirer_operator_id);
CREATE INDEX IF NOT EXISTS idx_deal_ma_transactions_target_operator_id ON public.deal_ma_transactions (target_operator_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_country_id ON public.dossiers (country_id);
CREATE INDEX IF NOT EXISTS idx_editorial_items_snapshot_id ON public.editorial_items (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_editorial_items_source_id ON public.editorial_items (source_id);
CREATE INDEX IF NOT EXISTS idx_education_content_citations_module_id ON public.education_content_citations (module_id);
CREATE INDEX IF NOT EXISTS idx_education_content_citations_section_id ON public.education_content_citations (section_id);
CREATE INDEX IF NOT EXISTS idx_education_modules_reviewed_by ON public.education_modules (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_ia_extraction_failures_resolved_by ON public.ia_extraction_failures (resolved_by);
CREATE INDEX IF NOT EXISTS idx_ia_extraction_failures_staging_id ON public.ia_extraction_failures (staging_id);
CREATE INDEX IF NOT EXISTS idx_intel_eval_predictions_signal_id ON public.intel_eval_predictions (signal_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_playbooks_source_id ON public.jurisdiction_playbooks (source_id);
CREATE INDEX IF NOT EXISTS idx_professional_service_provider_listings_professional_service ON public.professional_service_provider_listings (submitted_by);
CREATE INDEX IF NOT EXISTS idx_signal_relevance_feedback_user_id ON public.signal_relevance_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_talent_candidates_created_by ON public.talent_candidates (created_by);
CREATE INDEX IF NOT EXISTS idx_talent_jobs_created_by ON public.talent_jobs (created_by);
CREATE INDEX IF NOT EXISTS idx_talent_jobs_workspace_id ON public.talent_jobs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_talent_opportunities_created_by ON public.talent_opportunities (created_by);
CREATE INDEX IF NOT EXISTS idx_talent_opportunities_reviewed_by ON public.talent_opportunities (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_talent_saved_jobs_opportunity_id ON public.talent_saved_jobs (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_clinical_encounters_professional_id ON public.clinical_encounters (professional_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_extractions_evidence_record_id ON public.clinical_evidence_extractions (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_outcome_links_evidence_record_id ON public.clinical_evidence_outcome_links (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_grade_assessments_review_id ON public.clinical_grade_assessments (review_id);
CREATE INDEX IF NOT EXISTS idx_clinical_therapeutic_objectives_patient_id ON public.clinical_therapeutic_objectives (patient_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_collection_signals_signal_id ON regulatory_signals.watchlist_collection_signals (signal_id);
