-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922101831
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,sub_region,region,language,jurisdiction_code,tier,source_type,regulator_class,notes,verification_notes,verification_checked_at)
select * from (values
('California Department of Cannabis Control — Laws & Regulations','https://www.cannabis.ca.gov/cannabis-laws/','California','United States','US','California','North America','en','US-CA',1,'government_regulator','other','Primary California cannabis laws and regulatory materials.','Verified against DCC official site on 2026-09-22.',now()),
('Bayerisches Landesamt für Gesundheit und Lebensmittelsicherheit — Konsumcannabisgesetz','https://www.lgl.bayern.de/produkte/ueberwachung/konsumcannabisgesetz.htm','Bayern','Germany','DE','Bayern','Europe','de','DE-BY',1,'government_regulator','other','Primary Bavarian enforcement and permit information for KCanG cultivation associations.','Verified against LGL Bayern official site on 2026-09-22.',now())
) v(source_name,source_url,jurisdiction,country,iso,sub_region,region,language,jurisdiction_code,tier,source_type,regulator_class,notes,verification_notes,verification_checked_at)
where not exists (select 1 from public.source_registry s where s.jurisdiction_code=v.jurisdiction_code and s.source_url=v.source_url);
