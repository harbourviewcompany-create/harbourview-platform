-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922101839
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,sub_region,region,language,jurisdiction_code,tier,source_type,regulator_class,notes,verification_notes,verification_checked_at)
values
('Alcohol and Gaming Commission of Ontario — Cannabis Regulatory Reporting Requirements','https://www.agco.ca/sites/default/files/2025-06/Cannabis%20Reporting%20Requirements%20June%202025%20final.pdf','Ontario','Canada','CA','Ontario','North America','en','CA-ON',1,'government_regulator','other','Primary AGCO cannabis regulatory reporting requirements.','Verified against AGCO official publication retrieved 2026-09-22.',now())
on conflict do nothing;
