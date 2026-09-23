-- Refresh stale authoritative source endpoints used by the 291-jurisdiction evidence acquisition layer.
-- Idempotent by jurisdiction_code/source identity; no generated IDs are embedded.

update public.source_registry
set source_url='https://www.odc.gov.au/medicinal-cannabis/grow-produce-or-manufacture-cannabis-australia',
    source_name='ODC — Grow, produce or manufacture cannabis in Australia',
    regulator_class='drug_control_authority',
    tier=1,
    updated_at=now()
where jurisdiction_code='AU' and source_name='ODC – Office of Drug Control (federal)';

update public.source_registry
set source_url='https://aglc.ca/cannabis/retail-cannabis/apply-retail-cannabis-store-licence',
    source_name='AGLC — Apply for a retail cannabis store licence',
    regulator_class='drug_control_authority',
    tier=1,
    updated_at=now()
where jurisdiction_code='CA-AB';

update public.source_registry
set source_url='https://www2.gov.bc.ca/gov/content/employment-business/business/liquor-regulation-licensing/cannabis-licences/apply-cannabis-licence/apply-for-a-cannabis-retail-store-licence',
    source_name='British Columbia LCRB — Cannabis Retail Store licence',
    regulator_class='drug_control_authority',
    tier=1,
    updated_at=now()
where jurisdiction_code='CA-BC';

update public.source_registry
set source_url='https://novascotia.ca/cannabis/laws/',
    source_name='Nova Scotia Government — Cannabis laws',
    regulator_class='drug_control_authority',
    tier=1,
    updated_at=now()
where jurisdiction_code='CA-NS';

update public.source_registry
set source_url='https://www.gov.nu.ca/en/liquor-and-cannabis/cannabis-retail',
    source_name='Government of Nunavut — Cannabis Retail',
    regulator_class='drug_control_authority',
    tier=1,
    updated_at=now()
where jurisdiction_code='CA-NU';

update public.source_registry
set source_url='https://yukon.ca/en/doing-business/permits-and-licensing/find-out-about-cannabis-licence-applications-and-licence-holders',
    source_name='Yukon Government — Cannabis licence applications and licence holders',
    regulator_class='drug_control_authority',
    tier=1,
    updated_at=now()
where jurisdiction_code='CA-YT';
