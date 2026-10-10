-- Recovery-only fail-closed security hardening.
-- These tables were flagged by the Supabase security advisor as public-schema
-- tables with RLS disabled. Access for anon/authenticated must be audited and
-- scoped with explicit policies BEFORE any production cutover.
-- Service-role operations continue to bypass RLS.
-- Keep this migration on the recovery branch until policy contracts are verified.
alter table public."education_article_sections" enable row level security;
alter table public."education_sources" enable row level security;
alter table public."education_reviews" enable row level security;
alter table public."education_glossary_terms" enable row level security;
alter table public."education_country_briefs" enable row level security;
alter table public."education_requests" enable row level security;
alter table public."education_audit_events" enable row level security;
alter table public."education_content_relationships" enable row level security;
alter table public."education_publication_history" enable row level security;
alter table public."listing_supply_details" enable row level security;
alter table public."listing_equipment_details" enable row level security;
alter table public."_hv_migration_test_probe" enable row level security;
alter table public."regulatory_field_changes" enable row level security;
alter table public."regulatory_calendar" enable row level security;
alter table public."source_groups" enable row level security;
alter table public."source_watchlist_links" enable row level security;
alter table public."watchlists" enable row level security;
alter table public."discovery_sources" enable row level security;
alter table public."link_observations" enable row level security;
alter table public."source_candidates" enable row level security;
alter table public."source_fetch_jobs" enable row level security;
alter table public."coverage_gaps" enable row level security;
alter table public."source_fetch_runs" enable row level security;
alter table public."discovery_documents" enable row level security;
alter table public."extracted_citations" enable row level security;
alter table public."extracted_entities" enable row level security;
alter table public."extracted_events" enable row level security;
alter table public."extraction_contradictions" enable row level security;
