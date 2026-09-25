-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922230800
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set source_url='https://www.odc.gov.au/medicinal-cannabis', source_name='ODC — Medicinal cannabis regulatory framework', adapter='html_snapshot', updated_at=now() where jurisdiction_code='AU' and source_name='ODC — Grow, produce or manufacture cannabis in Australia';
