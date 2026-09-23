-- Replace generic landing pages with current, claim-bearing first-party authority endpoints.
-- Existing snapshot hashes are intentionally retained until a successful fresh capture is available;
-- the resolver remains fail-closed during the transition.
update public.source_registry
set source_url='https://laws.gov.ag/wp-content/uploads/2022/12/No.-26-of-2022-Cannabis-Amendment-Act-2022.pdf', updated_at=now()
where id='096a4f8c-0204-47cb-868a-64cebcc10568';

update public.source_registry
set source_url='https://laws.bahamas.gov.bs/cms/images/LEGISLATION/BILLS/2024/2024-0033/2024-0033.pdf', updated_at=now()
where source_name='Bahamas Office of the Prime Minister — Cannabis Bahamas';

update public.source_registry
set source_url='https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/besondere-arzneimittelgruppen--ham-/authorised-narcotics/cannabis-agency.html', updated_at=now()
where source_name='Swissmedic Switzerland';

update public.source_registry
set source_url='https://laegemiddelstyrelsen.dk/en/licensing/company-authorisations-and-registrations/medicinal-cannabis-programme/', updated_at=now()
where source_name='Denmark Medicines Agency';

update public.source_registry
set source_url='https://cannabis.maryland.gov/Pages/contactus.aspx', updated_at=now()
where source_name='Maryland MCA – Cannabis Administration';

update public.regulatory_market_access_primary_sources
set authority_url='https://laws.gov.ag/wp-content/uploads/2022/12/No.-26-of-2022-Cannabis-Amendment-Act-2022.pdf', verified_at=now(), expires_at=now()+interval '30 days'
where jurisdiction_iso2='AG';

update public.regulatory_market_access_primary_sources
set authority_url='https://laws.bahamas.gov.bs/cms/images/LEGISLATION/BILLS/2024/2024-0033/2024-0033.pdf', verified_at=now(), expires_at=now()+interval '30 days'
where jurisdiction_iso2='BS';

update public.regulatory_market_access_primary_sources
set authority_url='https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/besondere-arzneimittelgruppen--ham-/authorised-narcotics/cannabis-agency.html', verified_at=now(), expires_at=now()+interval '30 days'
where jurisdiction_iso2='CH';

update public.regulatory_market_access_primary_sources
set authority_url='https://laegemiddelstyrelsen.dk/en/licensing/company-authorisations-and-registrations/medicinal-cannabis-programme/', verified_at=now(), expires_at=now()+interval '30 days'
where jurisdiction_iso2='DK';

update public.regulatory_market_access_primary_sources
set authority_url='https://cannabis.maryland.gov/Pages/contactus.aspx', verified_at=now(), expires_at=now()+interval '30 days'
where jurisdiction_iso2='US-MD';
