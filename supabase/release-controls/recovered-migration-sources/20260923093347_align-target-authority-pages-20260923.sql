-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260923093347
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set source_url='https://mca.gov.ag/',updated_at=now() where id='096a4f8c-0204-47cb-868a-64cebcc10568'; update public.source_registry set source_url='https://opm.gov.bs/cannabis-bahamas/',updated_at=now() where id='ac909ea0-8d88-4ef8-adc2-5dc5d5b7a89c'; update public.source_registry set source_url='https://cannabis.maryland.gov/Pages/Medical_Cannabis_Rescheduling.aspx',updated_at=now() where id='5b211cc7-0f92-46f6-ad26-ed3b265a6af0'; update public.regulatory_market_access_primary_sources set authority_url='https://mca.gov.ag/' where jurisdiction_iso2='AG'; update public.regulatory_market_access_primary_sources set authority_url='https://opm.gov.bs/cannabis-bahamas/' where jurisdiction_iso2='BS'; update public.regulatory_market_access_primary_sources set authority_url='https://cannabis.maryland.gov/Pages/Medical_Cannabis_Rescheduling.aspx' where jurisdiction_iso2='US-MD';
