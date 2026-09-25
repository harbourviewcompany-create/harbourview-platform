-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922230647
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set relevance_status='active', is_active=true, crawl_allowed=true, next_crawl_at=now(), updated_at=now() where jurisdiction_code in ('AU','CA-AB','CA-BC','CA-NS','CA-NU','CA-YT') and tier=1 and regulator_class='drug_control_authority';
