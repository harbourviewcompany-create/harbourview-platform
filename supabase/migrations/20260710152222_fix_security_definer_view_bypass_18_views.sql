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
-- version 20260710152222.
--
-- Rewriting this file cannot affect production: 20260710152222 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- This exact class of bug has regressed at least 3 times already:
-- 20260622151411_fix_security_definer_views_to_invoker,
-- 20260701001549_fix_api_schema_views_rls_bypass,
-- 20260709092127_fix_security_definer_views_api_schema. It keeps coming
-- back because api.* views are created with plain
-- `CREATE OR REPLACE VIEW api.x AS SELECT * FROM public.x` and
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to its
-- default (security_invoker = false) -- so a later, unrelated edit to a
-- view silently reopens every RLS policy on the underlying table. Found
-- via a live audit prompted by the same bug being caught and fixed on
-- client_error_reports in 20260709032305: the security advisor currently
-- flags 18 api.* views with this property, all simple SELECT * passthroughs
-- with no legitimate reason to run as the view owner instead of the caller.
--
-- Confirmed live (get_advisors + information_schema.role_table_grants +
-- pg_policies) that every one of these 18 views grants SELECT to
-- anon/authenticated. Eight have a genuinely restrictive underlying RLS
-- policy that this bug fully bypasses -- i.e. this was an active,
-- exploitable cross-tenant/cross-user data leak, not a theoretical one:
--   - deal_room_messages: policy restricts to the two parties in a deal
--     room; bypass exposed every private deal negotiation message on the
--     platform to any authenticated OR anonymous caller.
--   - subscriptions: policy restricts to auth.uid() = user_id; bypass
--     exposed every user's Stripe customer id, tier, and billing status.
--   - hv_evidence_documents: policy restricts to org members / platform
--     staff; bypass exposed every org's compliance evidence documents,
--     including ones with is_public = false.
--   - cc_org_pathway_progress, cc_org_requirement_status, cc_watch_rules,
--     cc_watchlist_items: policy restricts to workspace members of that
--     org; bypass exposed every org's internal Command Centre compliance
--     progress, requirement status, watch rules, and watchlist.
--   - cc_watchlist_notifications: policy restricts to auth.uid() =
--     user_id; bypass exposed every user's notifications to every other
--     user.
-- The remaining 10 either had a real but lower-severity content-exposure
-- gap (unpublished/unverified rows shown as if reviewed/live:
-- country_education_overlay, editorial_items, market_metrics,
-- stripe_webhook_events -- the last of which is meant to be
-- service_role-only end to end) or no behavioral change at all because the
-- underlying table policy was already `true` for anon/authenticated
-- (countries, trade_flows, education_tracks, hv_public_profile_snapshots,
-- cc_pathway_steps, cc_pathway_step_requirements) -- those are fixed here
-- too, for lint compliance and so this list doesn't need revisiting piecemeal.
--
-- Column lists below are copied verbatim from the live
-- information_schema.views.view_definition for each view -- this migration
-- changes ONLY the security_invoker option, not any exposed column.

create or replace view api.deal_room_messages with (security_invoker = true) as
select id, room_id, sender_id, message_type, body, attachments, read_at, created_at
from public.deal_room_messages;

create or replace view api.subscriptions with (security_invoker = true) as
select id, user_id, stripe_customer_id, status, tier, price_id, current_period_start,
  current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at
from public.subscriptions;

create or replace view api.hv_evidence_documents with (security_invoker = true) as
select id, org_id, document_type, display_name, storage_path, file_hash, file_size_bytes,
  mime_type, uploaded_by, verification_status, verified_by, verified_at, expiry_date,
  is_public, created_at
from public.hv_evidence_documents;

create or replace view api.cc_org_pathway_progress with (security_invoker = true) as
select id, org_id, template_id, current_step, status, started_at, completed_at,
  last_action_at, created_at, updated_at
from public.cc_org_pathway_progress;

create or replace view api.cc_org_requirement_status with (security_invoker = true) as
select id, org_id, requirement_id, status, evidence_document_id, licence_id, notes,
  submitted_at, reviewed_at, reviewed_by, created_at, updated_at
from public.cc_org_requirement_status;

create or replace view api.cc_watch_rules with (security_invoker = true) as
select id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at
from public.cc_watch_rules;

create or replace view api.cc_watchlist_items with (security_invoker = true) as
select id, org_id, added_by, item_type, ref_id, title, subtitle, tags, jurisdiction,
  confidence_pct, latest_change_at, latest_change_note, next_action, watch_status,
  snoozed_until, created_at, updated_at
from public.cc_watchlist_items;

create or replace view api.cc_watchlist_notifications with (security_invoker = true) as
select id, user_id, org_id, watchlist_item_id, notification_type, title, body, is_read,
  is_snoozed, snoozed_until, created_at
from public.cc_watchlist_notifications;

create or replace view api.country_education_overlay with (security_invoker = true) as
select id, country_iso2, module_key, role_id, topics, action_label, source_ids,
  review_status, reviewer, last_verified_at, updated_at
from public.country_education_overlay;

create or replace view api.editorial_items with (security_invoker = true) as
select id, source_id, snapshot_id, headline, summary, why_it_matters, outlet_name,
  source_url, country, region, language, tone, published_at, used_in_digest_at, stage,
  created_at, updated_at
from public.editorial_items;

create or replace view api.market_metrics with (security_invoker = true) as
select id, country_iso2, metric_name, metric_value, metric_unit, period_start, period_end,
  period_granularity, data_type, confidence_band, source_name, source_url, source_date,
  notes, created_at, updated_at
from public.market_metrics;

create or replace view api.stripe_webhook_events with (security_invoker = true) as
select id, type, processed_at
from public.stripe_webhook_events;

create or replace view api.countries with (security_invoker = true) as
select id, country_name, country_slug, iso_alpha2, iso_alpha3, region, subregion,
  map_region_key, market_access_status, medical_status, adult_use_status, import_status,
  export_status, signals_status, opportunity_status, compliance_risk_status,
  education_status, marketplace_availability_status, public_summary, data_completeness,
  last_updated_label, created_at, updated_at, lat, lng, opportunity_categories,
  trade_roles, regulator_label, opportunity_score, regulatory_tier
from public.countries;

create or replace view api.trade_flows with (security_invoker = true) as
select id, origin_iso2, destination_iso2, flow_direction, product_category, legal_status,
  permit_required, permit_authority, purpose, gmp_required, gacp_required,
  key_requirements, notes, source_name, source_url, last_verified, confidence, created_at,
  updated_at
from public.trade_flows;

create or replace view api.education_tracks with (security_invoker = true) as
select id, slug, title, description, publication_state, created_at, updated_at
from public.education_tracks;

create or replace view api.hv_public_profile_snapshots with (security_invoker = true) as
select id, org_id, snapshot_data, snapshot_version, generated_at
from public.hv_public_profile_snapshots;

create or replace view api.cc_pathway_steps with (security_invoker = true) as
select id, template_id, step_number, title, description, unlock_condition, created_at
from public.cc_pathway_steps;

create or replace view api.cc_pathway_step_requirements with (security_invoker = true) as
select id, step_id, title, description, evidence_type, is_required, sort_order, created_at
from public.cc_pathway_step_requirements;

notify pgrst, 'reload schema';
