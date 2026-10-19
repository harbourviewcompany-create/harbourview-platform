-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260923093347
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set source_url='https://mca.gov.ag/',updated_at=now() where id='096a4f8c-0204-47cb-868a-64cebcc10568'; update public.source_registry set source_url='https://opm.gov.bs/cannabis-bahamas/',updated_at=now() where id='ac909ea0-8d88-4ef8-adc2-5dc5d5b7a89c'; update public.source_registry set source_url='https://cannabis.maryland.gov/Pages/Medical_Cannabis_Rescheduling.aspx',updated_at=now() where id='5b211cc7-0f92-46f6-ad26-ed3b265a6af0'; update public.regulatory_market_access_primary_sources set authority_url='https://mca.gov.ag/' where jurisdiction_iso2='AG'; update public.regulatory_market_access_primary_sources set authority_url='https://opm.gov.bs/cannabis-bahamas/' where jurisdiction_iso2='BS'; update public.regulatory_market_access_primary_sources set authority_url='https://cannabis.maryland.gov/Pages/Medical_Cannabis_Rescheduling.aspx' where jurisdiction_iso2='US-MD';
