-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260923090443
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set source_url='https://laws.gov.ag/wp-content/uploads/2022/01/No.-6-of-2021-Cannabis-Amendment-Act-2021.pdf',updated_at=now() where id='096a4f8c-0204-47cb-868a-64cebcc10568';
update public.source_registry set source_url='https://laws.bahamas.gov.bs/cms/images/LEGISLATION/BILLS/2024/2024-0033/2024-0033.pdf',updated_at=now() where source_name='Bahamas Office of the Prime Minister — Cannabis Bahamas';
update public.source_registry set source_url='https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/besondere-arzneimittelgruppen--ham-/authorised-narcotics/cannabis-agency.html',updated_at=now() where source_name='Swissmedic Switzerland';
update public.source_registry set source_url='https://laegemiddelstyrelsen.dk/en/licensing/company-authorisations-and-registrations/medicinal-cannabis-programme/',updated_at=now() where source_name='Denmark Medicines Agency';
update public.source_registry set source_url='https://cannabis.maryland.gov/Pages/contactus.aspx',updated_at=now() where source_name='Maryland MCA – Cannabis Administration';
update public.regulatory_market_access_primary_sources set authority_url='https://laws.gov.ag/wp-content/uploads/2022/01/No.-6-of-2021-Cannabis-Amendment-Act-2021.pdf',verified_at=now(),expires_at=now()+interval '30 days' where jurisdiction_iso2='AG';
update public.regulatory_market_access_primary_sources set authority_url='https://laws.bahamas.gov.bs/cms/images/LEGISLATION/BILLS/2024/2024-0033/2024-0033.pdf',verified_at=now(),expires_at=now()+interval '30 days' where jurisdiction_iso2='BS';
update public.regulatory_market_access_primary_sources set authority_url='https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/besondere-arzneimittelgruppen--ham-/authorised-narcotics/cannabis-agency.html',verified_at=now(),expires_at=now()+interval '30 days' where jurisdiction_iso2='CH';
update public.regulatory_market_access_primary_sources set authority_url='https://laegemiddelstyrelsen.dk/en/licensing/company-authorisations-and-registrations/medicinal-cannabis-programme/',verified_at=now(),expires_at=now()+interval '30 days' where jurisdiction_iso2='DK';
update public.regulatory_market_access_primary_sources set authority_url='https://cannabis.maryland.gov/Pages/contactus.aspx',verified_at=now(),expires_at=now()+interval '30 days' where jurisdiction_iso2='US-MD';
