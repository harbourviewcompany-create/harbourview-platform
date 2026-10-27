-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260922231319
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set source_url='https://www.salute.gov.it/new/it/tema/medicinali-stupefacenti-e-precursori-di-droghe/uso-medico-della-cannabis/',source_name='Italy Ministry of Health — Medical cannabis',regulator_class='drug_control_authority',tier=1,adapter='html_snapshot',relevance_status='active',is_active=true,crawl_allowed=true,next_crawl_at=now(),updated_at=now() where jurisdiction_code='IT' and source_name='Gazzetta Ufficiale Italy';
