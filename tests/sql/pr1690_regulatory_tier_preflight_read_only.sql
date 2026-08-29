-- PR #1690 production activation preflight. READ ONLY.
with approved(iso,tier,note) as (values ('NL','domestic_only','NL coffee-shop domestic'),('ES','domestic_only','ES clubs/medical limited export'),('MT','domestic_only','MT association model'),('LU','domestic_only','LU limited domestic'),('DE','medical_limited_trade','DE medical + limited clubs'),('FR','medical_limited_trade','FR medical'),('IT','medical_limited_trade','IT medical'),('GB','medical_limited_trade','UK Schedule 2 medical'),('IE','medical_limited_trade','IE medical'),('AT','medical_limited_trade','AT medical'),('BE','medical_limited_trade','BE medical'),('CH','medical_limited_trade','CH medical'),('DK','medical_limited_trade','DK medical'),('SE','medical_limited_trade','SE medical'),('NO','medical_limited_trade','NO medical'),('FI','medical_limited_trade','FI medical'),('PL','medical_limited_trade','PL medical'),('CZ','medical_limited_trade','CZ medical'),('GR','medical_limited_trade','GR medical'),('HR','medical_limited_trade','HR medical'),('SI','medical_limited_trade','SI medical'),('SK','medical_limited_trade','SK medical'),('HU','medical_limited_trade','HU medical'),('BG','medical_limited_trade','BG medical'),('RS','medical_limited_trade','RS medical'),('PT','legal_commercial_access','PT EU medical trade'),('IL','legal_commercial_access','IL medical export'),('TR','cbd_hemp_only','TR hemp'),('UA','cbd_hemp_only','UA hemp'),('RO','cbd_hemp_only','RO hemp')),
state as (
  select a.*, c.regulatory_tier, c.regulatory_tier_origin, c.regulatory_tier_needs_review, c.regulatory_tier_rationale,
    (c.regulatory_tier is not distinct from a.tier
     and c.regulatory_tier_origin = 'override'
     and c.regulatory_tier_needs_review = false
     and c.regulatory_tier_rationale is not distinct from a.note) exact_skip
  from approved a left join public.countries c on c.iso_alpha2=a.iso
),
audit as (
  select id,country_iso2,actor from public.regulatory_tier_audit where id between 76 and 105
),
checks as (
  select
    (select count(*) from supabase_migrations.schema_migrations where version in ('20260829120000','20260829130000','20260829160000')) ledger_count,
    (select count(*) from state) approved_count,
    (select count(*) from state where exact_skip) exact_skip_count,
    (select count(*) from audit) audit_count,
    (select count(distinct country_iso2) from audit) audit_isos,
    (select min(id) from audit) audit_min,
    (select max(id) from audit) audit_max,
    (select count(*) from audit where actor='ops-eu') ops_eu_count,
    to_regprocedure('api.set_regulatory_tier(text,text,text,text)') is not null set_fn,
    to_regprocedure('api.reclassify_auto_tiers(text)') is not null reclassify_fn,
    to_regprocedure('api.briefing_text_for_iso(text)') is not null briefing_fn,
    to_regclass('api.regulatory_tier_review_queue') is not null review_queue
)
select 'STRUCTURAL|' ||
  case when ledger_count=0 and approved_count=30 and exact_skip_count=30
    and audit_count=30 and audit_isos=30 and audit_min=76 and audit_max=105 and ops_eu_count=30
    and set_fn and reclassify_fn and briefing_fn and review_queue
  then 'PASS' else 'FAIL' end
from checks
union all select 'LEDGER|'||ledger_count from checks
union all select 'EU|'||approved_count||'|'||exact_skip_count from checks
union all select 'AUDIT|'||audit_count||'|'||audit_isos||'|'||audit_min||'|'||audit_max||'|'||ops_eu_count from checks;
