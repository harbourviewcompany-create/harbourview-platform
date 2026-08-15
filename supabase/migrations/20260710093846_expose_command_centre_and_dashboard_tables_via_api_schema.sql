-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710093846.
--
-- Rewriting this file cannot affect production: 20260710093846 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create view api.cc_org_pathway_progress as
select id, org_id, template_id, current_step, status, started_at, completed_at, last_action_at, created_at, updated_at
from public.cc_org_pathway_progress;
grant select on api.cc_org_pathway_progress to anon, authenticated;

create view api.cc_org_requirement_status as
select id, org_id, requirement_id, status, evidence_document_id, licence_id, notes, submitted_at, reviewed_at, reviewed_by, created_at, updated_at
from public.cc_org_requirement_status;
grant select on api.cc_org_requirement_status to anon, authenticated;

create view api.cc_pathway_step_requirements as
select id, step_id, title, description, evidence_type, is_required, sort_order, created_at
from public.cc_pathway_step_requirements;
grant select on api.cc_pathway_step_requirements to anon, authenticated;

create view api.cc_pathway_steps as
select id, template_id, step_number, title, description, unlock_condition, created_at
from public.cc_pathway_steps;
grant select on api.cc_pathway_steps to anon, authenticated;

create view api.cc_watch_rules as
select id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at
from public.cc_watch_rules;
grant select on api.cc_watch_rules to anon, authenticated;

create view api.cc_watchlist_items as
select id, org_id, added_by, item_type, ref_id, title, subtitle, tags, jurisdiction, confidence_pct, latest_change_at, latest_change_note, next_action, watch_status, snoozed_until, created_at, updated_at
from public.cc_watchlist_items;
grant select on api.cc_watchlist_items to anon, authenticated;

create view api.cc_watchlist_notifications as
select id, user_id, org_id, watchlist_item_id, notification_type, title, body, is_read, is_snoozed, snoozed_until, created_at
from public.cc_watchlist_notifications;
grant select on api.cc_watchlist_notifications to anon, authenticated;

create view api.country_education_overlay as
select id, country_iso2, module_key, role_id, topics, action_label, source_ids, review_status, reviewer, last_verified_at, updated_at
from public.country_education_overlay;
grant select on api.country_education_overlay to anon, authenticated;

create view api.education_tracks as
select id, slug, title, description, publication_state, created_at, updated_at
from public.education_tracks;
grant select on api.education_tracks to anon, authenticated;

create view api.hv_evidence_documents as
select id, org_id, document_type, display_name, storage_path, file_hash, file_size_bytes, mime_type, uploaded_by, verification_status, verified_by, verified_at, expiry_date, is_public, created_at
from public.hv_evidence_documents;
grant select on api.hv_evidence_documents to anon, authenticated;

create view api.market_metrics as
select id, country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes, created_at, updated_at
from public.market_metrics;
grant select on api.market_metrics to anon, authenticated;

create view api.trade_flows as
select id, origin_iso2, destination_iso2, flow_direction, product_category, legal_status, permit_required, permit_authority, purpose, gmp_required, gacp_required, key_requirements, notes, source_name, source_url, last_verified, confidence, created_at, updated_at
from public.trade_flows;
grant select on api.trade_flows to anon, authenticated;
