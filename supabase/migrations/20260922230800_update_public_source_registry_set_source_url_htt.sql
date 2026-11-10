-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260922230800
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set source_url='https://www.odc.gov.au/medicinal-cannabis', source_name='ODC — Medicinal cannabis regulatory framework', adapter='html_snapshot', updated_at=now() where jurisdiction_code='AU' and source_name='ODC — Grow, produce or manufacture cannabis in Australia';
