-- CONCURRENTLY removed 2026-08-05 for zero-state replay. The Supabase CLI sends
-- a migration's statements as one pipeline, and Postgres refuses CREATE INDEX
-- CONCURRENTLY there:
--   ERROR: CREATE INDEX CONCURRENTLY cannot be executed within a pipeline
--   (SQLSTATE 25001)
-- Only the keyword is dropped; every index name, table and column list below is
-- unchanged, so the resulting schema is identical. CONCURRENTLY exists to avoid
-- locking a populated table, which is meaningless against the empty database a
-- replay builds, and production already carries these indexes -- this version is
-- recorded in supabase_migrations.schema_migrations, applied there as a single
-- statement, which is why the pipeline rule never bit in production.

-- Migration: add_missing_fk_indexes_jun22
-- Purpose: Add missing indexes on foreign key columns flagged by Supabase performance advisor (Jun 22 2026)
-- All indexes created with to avoid table locks.
-- Do NOT wrap in BEGIN/COMMIT — cannot run inside a transaction block.

-- canadian_operator_conflicts
CREATE INDEX IF NOT EXISTS idx_canadian_operator_conflicts_canonical_operator_id ON public.canadian_operator_conflicts (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_conflicts_site_id ON public.canadian_operator_conflicts (site_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_conflicts_source_row_id ON public.canadian_operator_conflicts (source_row_id);

-- canadian_operator_duplicate_clusters
CREATE INDEX IF NOT EXISTS idx_canadian_operator_duplicate_clusters_canonical_operator_id ON public.canadian_operator_duplicate_clusters (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_duplicate_clusters_site_id ON public.canadian_operator_duplicate_clusters (site_id);

-- canadian_operator_exclusions
CREATE INDEX IF NOT EXISTS idx_canadian_operator_exclusions_canonical_operator_id ON public.canadian_operator_exclusions (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_exclusions_source_row_id ON public.canadian_operator_exclusions (source_row_id);

-- canadian_operator_individual_holds
CREATE INDEX IF NOT EXISTS idx_canadian_operator_individual_holds_canonical_operator_id ON public.canadian_operator_individual_holds (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_individual_holds_source_row_id ON public.canadian_operator_individual_holds (source_row_id);

-- canadian_operator_licence_sites
CREATE INDEX IF NOT EXISTS idx_canadian_operator_licence_sites_source_row_id ON public.canadian_operator_licence_sites (source_row_id);

-- canadian_operator_outreach_queue
CREATE INDEX IF NOT EXISTS idx_canadian_operator_outreach_queue_canonical_operator_id ON public.canadian_operator_outreach_queue (canonical_operator_id);
CREATE INDEX IF NOT EXISTS idx_canadian_operator_outreach_queue_site_id ON public.canadian_operator_outreach_queue (site_id);

-- cc_org_requirement_status
CREATE INDEX IF NOT EXISTS idx_cc_org_requirement_status_evidence_document_id ON public.cc_org_requirement_status (evidence_document_id);
CREATE INDEX IF NOT EXISTS idx_cc_org_requirement_status_licence_id ON public.cc_org_requirement_status (licence_id);
CREATE INDEX IF NOT EXISTS idx_cc_org_requirement_status_reviewed_by ON public.cc_org_requirement_status (reviewed_by);

-- cc_watch_rules
CREATE INDEX IF NOT EXISTS idx_cc_watch_rules_created_by ON public.cc_watch_rules (created_by);

-- cc_watchlist_items
CREATE INDEX IF NOT EXISTS idx_cc_watchlist_items_added_by ON public.cc_watchlist_items (added_by);

-- cc_watchlist_notifications
CREATE INDEX IF NOT EXISTS idx_cc_watchlist_notifications_org_id ON public.cc_watchlist_notifications (org_id);

-- country_coverage_matrix
CREATE INDEX IF NOT EXISTS idx_country_coverage_matrix_jurisdiction_id ON public.country_coverage_matrix (jurisdiction_id);

-- country_profiles_public
CREATE INDEX IF NOT EXISTS idx_country_profiles_public_jurisdiction_id ON public.country_profiles_public (jurisdiction_id);

-- country_regulatory_profiles_admin
CREATE INDEX IF NOT EXISTS idx_country_regulatory_profiles_admin_jurisdiction_id ON public.country_regulatory_profiles_admin (jurisdiction_id);

-- cultivar_aliases
CREATE INDEX IF NOT EXISTS idx_cultivar_aliases_cultivar_id ON public.cultivar_aliases (cultivar_id);

-- cultivar_passports
CREATE INDEX IF NOT EXISTS idx_cultivar_passports_breeder_profile_id ON public.cultivar_passports (breeder_profile_id);
CREATE INDEX IF NOT EXISTS idx_cultivar_passports_owner_user_id ON public.cultivar_passports (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cultivar_passports_rights_holder_profile_id ON public.cultivar_passports (rights_holder_profile_id);

-- deal_room_messages
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_sender_id ON public.deal_room_messages (sender_id);

-- genetics_access_grants
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_access_request_id ON public.genetics_access_grants (access_request_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_grantee_profile_id ON public.genetics_access_grants (grantee_profile_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_grantor_profile_id ON public.genetics_access_grants (grantor_profile_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_grantor_user_id ON public.genetics_access_grants (grantor_user_id);
CREATE INDEX IF NOT EXISTS idx_genetics_access_grants_revoked_by ON public.genetics_access_grants (revoked_by);

-- genetics_access_requests
CREATE INDEX IF NOT EXISTS idx_genetics_access_requests_requester_profile_id ON public.genetics_access_requests (requester_profile_id);
