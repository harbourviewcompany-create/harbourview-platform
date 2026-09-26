-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922230955
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set relevance_status='active',is_active=true,crawl_allowed=true,next_crawl_at=now(),updated_at=now() where jurisdiction_code in ('CA-AB','CA-BC','CA-MB','CA-NB','CA-NS','CA-NU','CA-ON','CA-PE','CA-QC','CA-YT') and tier=1 and regulator_class in ('drug_control_authority','health_authority','official_gazette','other');
