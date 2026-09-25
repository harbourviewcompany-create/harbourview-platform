-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922231124
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set source_url='https://www.gov.mb.ca/cannabis/knowthefacts/retailcannabis.html',source_name='Manitoba Government — Retail cannabis in Manitoba',regulator_class='drug_control_authority',tier=1,adapter='html_snapshot',updated_at=now() where jurisdiction_code='CA-MB';
update public.source_registry set source_url='https://www2.gnb.ca/content/gnb/en/corporate/promo/cannabis-in-new-brunswick/rules-and-laws.html',source_name='Government of New Brunswick — Cannabis rules and laws',regulator_class='drug_control_authority',tier=1,adapter='html_snapshot',updated_at=now() where jurisdiction_code='CA-NB';
update public.source_registry set source_url='https://www.agco.ca/en/cannabis/status-current-cannabis-retail-store-applications',source_name='Alcohol and Gaming Commission of Ontario — Cannabis retail store status',regulator_class='drug_control_authority',tier=1,adapter='html_snapshot',updated_at=now() where jurisdiction_code='CA-ON';
