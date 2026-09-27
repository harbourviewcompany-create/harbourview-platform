-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260923090925
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set source_url='https://laws.gov.ag/wp-content/uploads/2022/12/No.-26-of-2022-Cannabis-Amendment-Act-2022.pdf',updated_at=now() where id='096a4f8c-0204-47cb-868a-64cebcc10568'; update public.regulatory_market_access_primary_sources set authority_url='https://laws.gov.ag/wp-content/uploads/2022/12/No.-26-of-2022-Cannabis-Amendment-Act-2022.pdf',verified_at=now(),expires_at=now()+interval '30 days' where jurisdiction_iso2='AG';
