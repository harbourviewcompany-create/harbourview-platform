-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260922230647
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set relevance_status='active', is_active=true, crawl_allowed=true, next_crawl_at=now(), updated_at=now() where jurisdiction_code in ('AU','CA-AB','CA-BC','CA-NS','CA-NU','CA-YT') and tier=1 and regulator_class='drug_control_authority';
