-- PR #1690 production activation postflight. READ ONLY.
with expected(iso,tier) as (values ('AR','medical_limited_trade'),('AT','medical_limited_trade'),('AU','medical_limited_trade'),('BE','medical_limited_trade'),('BG','medical_limited_trade'),('BR','medical_limited_trade'),('CA','legal_commercial_access'),('CH','medical_limited_trade'),('CL','medical_limited_trade'),('CN','cbd_hemp_only'),('CO','legal_commercial_access'),('CZ','medical_limited_trade'),('DE','medical_limited_trade'),('DK','medical_limited_trade'),('ES','domestic_only'),('FI','medical_limited_trade'),('FR','medical_limited_trade'),('GB','medical_limited_trade'),('GR','medical_limited_trade'),('HR','medical_limited_trade'),('HU','medical_limited_trade'),('IE','medical_limited_trade'),('IL','legal_commercial_access'),('IT','medical_limited_trade'),('JP','medical_limited_trade'),('LU','domestic_only'),('MT','domestic_only'),('MX','medical_limited_trade'),('NL','domestic_only'),('NO','medical_limited_trade'),('NZ','medical_limited_trade'),('PE','medical_limited_trade'),('PL','medical_limited_trade'),('PT','legal_commercial_access'),('RO','cbd_hemp_only'),('RS','medical_limited_trade'),('SE','medical_limited_trade'),('SI','medical_limited_trade'),('SK','medical_limited_trade'),('TH','medical_limited_trade'),('TR','cbd_hemp_only'),('UA','cbd_hemp_only'),('UY','legal_commercial_access')),
country_state as (
  select e.iso,e.tier expected_tier,c.regulatory_tier,c.regulatory_tier_origin,c.regulatory_tier_needs_review
  from expected e left join public.countries c on c.iso_alpha2=e.iso
),
ca(iso) as (values ('CA-AB'),('CA-BC'),('CA-MB'),('CA-NB'),('CA-NL'),('CA-NS'),('CA-NT'),('CA-NU'),('CA-ON'),('CA-PE'),('CA-QC'),('CA-SK'),('CA-YT')),
ca_state as (
  select ca.iso,c.regulatory_tier,c.regulatory_tier_origin,c.regulatory_tier_needs_review
  from ca left join public.countries c on c.iso_alpha2=ca.iso
),
eu(iso,tier,note) as (values ('NL','domestic_only','NL coffee-shop domestic'),('ES','domestic_only','ES clubs/medical limited export'),('MT','domestic_only','MT association model'),('LU','domestic_only','LU limited domestic'),('DE','medical_limited_trade','DE medical + limited clubs'),('FR','medical_limited_trade','FR medical'),('IT','medical_limited_trade','IT medical'),('GB','medical_limited_trade','UK Schedule 2 medical'),('IE','medical_limited_trade','IE medical'),('AT','medical_limited_trade','AT medical'),('BE','medical_limited_trade','BE medical'),('CH','medical_limited_trade','CH medical'),('DK','medical_limited_trade','DK medical'),('SE','medical_limited_trade','SE medical'),('NO','medical_limited_trade','NO medical'),('FI','medical_limited_trade','FI medical'),('PL','medical_limited_trade','PL medical'),('CZ','medical_limited_trade','CZ medical'),('GR','medical_limited_trade','GR medical'),('HR','medical_limited_trade','HR medical'),('SI','medical_limited_trade','SI medical'),('SK','medical_limited_trade','SK medical'),('HU','medical_limited_trade','HU medical'),('BG','medical_limited_trade','BG medical'),('RS','medical_limited_trade','RS medical'),('PT','legal_commercial_access','PT EU medical trade'),('IL','legal_commercial_access','IL medical export'),('TR','cbd_hemp_only','TR hemp'),('UA','cbd_hemp_only','UA hemp'),('RO','cbd_hemp_only','RO hemp')),
eu_state as (
  select e.*,c.regulatory_tier,c.regulatory_tier_origin,c.regulatory_tier_needs_review,c.regulatory_tier_rationale
  from eu e left join public.countries c on c.iso_alpha2=e.iso
),
audit as (
  select id,country_iso2,actor from public.regulatory_tier_audit where id between 76 and 105
),
checks as (
  select
    (select count(*) from supabase_migrations.schema_migrations
      where (version,name,idempotency_key) in (
        ('20260829120000','live_tier_pipeline_hardening','gitblob:8a791744e923596ddc9cd6b1d9848bcb60dc7081'),
        ('20260829130000','tier_optimization_batch2','gitblob:cd9c7b9b96bcbb52a0dd551684de488afa18feda'),
        ('20260829160000','fix_europe_regulatory_tiers','gitblob:6d8e29d67b3f9458e9926d1525bfc5dd3fe7c9dc')
      )) ledger_exact,
    (select count(*) from country_state where regulatory_tier is not distinct from expected_tier) country_exact,
    (select count(*) from country_state) country_expected,
    (select count(*) from ca_state where regulatory_tier='legal_commercial_access' and regulatory_tier_origin='override' and regulatory_tier_needs_review=false) ca_exact,
    (select count(*) from eu_state where regulatory_tier is not distinct from tier and regulatory_tier_origin='override' and regulatory_tier_needs_review=false and regulatory_tier_rationale is not distinct from note) eu_exact,
    (select count(*) from audit) audit_count,
    (select count(distinct country_iso2) from audit) audit_isos,
    (select count(*) from audit where actor='ops-eu') ops_eu_count,
    has_function_privilege('postgres','api.set_regulatory_tier(text,text,text,text)','EXECUTE') set_postgres,
    not has_function_privilege('anon','api.set_regulatory_tier(text,text,text,text)','EXECUTE') set_anon_denied,
    not has_function_privilege('authenticated','api.set_regulatory_tier(text,text,text,text)','EXECUTE') set_auth_denied,
    not has_function_privilege('service_role','api.set_regulatory_tier(text,text,text,text)','EXECUTE') set_service_denied,
    has_function_privilege('service_role','api.reclassify_auto_tiers(text)','EXECUTE') reclassify_service,
    not has_function_privilege('anon','api.reclassify_auto_tiers(text)','EXECUTE') reclassify_anon_denied,
    not has_function_privilege('authenticated','api.reclassify_auto_tiers(text)','EXECUTE') reclassify_auth_denied,
    has_function_privilege('authenticated','api.briefing_text_for_iso(text)','EXECUTE') briefing_auth,
    has_function_privilege('service_role','api.briefing_text_for_iso(text)','EXECUTE') briefing_service,
    not has_function_privilege('anon','api.briefing_text_for_iso(text)','EXECUTE') briefing_anon_denied,
    has_table_privilege('authenticated','api.regulatory_tier_review_queue','SELECT') queue_auth,
    has_table_privilege('service_role','api.regulatory_tier_review_queue','SELECT') queue_service,
    position('public.is_regulatory_tier_admin()' in pg_get_functiondef('api.set_regulatory_tier(text,text,text,text)'::regprocedure)) > 0 admin_guard,
    position('session_user <> ''postgres''' in pg_get_functiondef('api.set_regulatory_tier(text,text,text,text)'::regprocedure)) > 0 postgres_migration_guard,
    (select count(*) from public.countries where iso_alpha2 in ('ET','GR','KE','UG','ZW') and regulatory_tier='legal_commercial_access' and regulatory_tier_needs_review=false) unsafe_suspicious_green
)
select 'POSTFLIGHT|' ||
 case when ledger_exact=3 and country_exact=country_expected and country_expected=43
   and ca_exact=13 and eu_exact=30
   and audit_count=30 and audit_isos=30 and ops_eu_count=30
   and set_postgres and set_anon_denied and set_auth_denied and set_service_denied
   and reclassify_service and reclassify_anon_denied and reclassify_auth_denied
   and briefing_auth and briefing_service and briefing_anon_denied
   and queue_auth and queue_service and admin_guard and postgres_migration_guard
   and unsafe_suspicious_green=0
 then 'PASS' else 'FAIL' end
from checks
union all select 'LEDGER|'||ledger_exact from checks
union all select 'COUNTRIES|'||country_exact||'|'||country_expected from checks
union all select 'CANADA|'||ca_exact||'|13' from checks
union all select 'EU|'||eu_exact||'|30' from checks
union all select 'AUDIT|'||audit_count||'|'||audit_isos||'|'||ops_eu_count from checks
union all select 'ACL|'||(set_postgres and set_anon_denied and set_auth_denied and set_service_denied and reclassify_service and reclassify_anon_denied and reclassify_auth_denied and briefing_auth and briefing_service and briefing_anon_denied and queue_auth and queue_service and admin_guard and postgres_migration_guard)::text from checks
union all select 'SUSPICIOUS_GREEN_UNREVIEWED|'||unsafe_suspicious_green from checks;
