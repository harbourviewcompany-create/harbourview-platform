-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260923093511
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set source_url='https://laws.gov.ag/wp-content/uploads/2022/12/No.-26-of-2022-Cannabis-Amendment-Act-2022.pdf',updated_at=now() where id='096a4f8c-0204-47cb-868a-64cebcc10568'; update public.regulatory_market_access_primary_sources set authority_url='https://laws.gov.ag/wp-content/uploads/2022/12/No.-26-of-2022-Cannabis-Amendment-Act-2022.pdf' where jurisdiction_iso2='AG';
