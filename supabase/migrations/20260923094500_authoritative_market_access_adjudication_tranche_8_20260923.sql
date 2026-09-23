-- Authoritative adjudication tranche 8: Mexico, Colombia and Thailand.
-- Current first-party sources establish controlled medical/scientific pathways;
-- no general adult-use commercial retail pathway is promoted by these records.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-mx-20260923','MX','medical_limited_trade',
 'Mexico''s federal health regulator COFEPRIS states in its July 2026 communication that the Supreme Court''s cannabis autoconsumo ruling concerns personal recreational self-consumption and does not recognize a right to commercialize, supply, sell or distribute cannabis. COFEPRIS also maintains the federal medicinal-cannabis regulatory framework and sanitary permits for controlled substances. The current record therefore supports controlled medical access and regulated handling, but not a general adult-use commercial market.',
 'Comisión Federal para la Protección contra Riesgos Sanitarios (COFEPRIS)',
 'https://www.gob.mx/cofepris/es/articulos/cofepris-acata-declaratoria-de-inconstitucionalidad-emitida-por-la-scjn-en-materia-de-autoconsumo-ludico-de-cannabis-y-tetrahidrocannabinol',
 '2026-07-07',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-mx-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-co-20260923','CO','medical_limited_trade',
 'Colombia''s medicines regulator INVIMA maintains a current cannabis medicinal framework covering licensing for manufacture of cannabis derivatives for medicinal and scientific purposes, sanitary commercialization authorization, and controls over import, export, processing, manufacturing, distribution and sale. Its current regulatory materials cite Law 1787 of 2016, Decree 613 of 2017 and subsequent implementing rules. The framework supports regulated medical/scientific trade rather than general adult-use retail.',
 'Instituto Nacional de Vigilancia de Medicamentos y Alimentos (INVIMA)',
 'https://observatorios.invima.gov.co/productos-vigilados/medicamentos-y-productos-biologicos/cannabis-medicinal',
 '2026-09-23',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-co-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-th-20260923','TH','medical_limited_trade',
 'Thailand''s Department of Thai Traditional and Alternative Medicine records the 2026 controlled-herb framework for cannabis, limiting commercial sale and processing to licensed establishment types and requiring medical prescriptions for cannabis flower used in treatment. The 2026 framework is explicitly directed toward medical use and excludes recreational use. It also provides regulated channels for cultivation, manufacture, import and other licensed commercial activities. This supports controlled medical trade, not general adult-use retail.',
 'Department of Thai Traditional and Alternative Medicine — Division of Medical Cannabis',
 'https://med-cannabis.dtam.moph.go.th/law/2658/',
 '2026-05-01',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-th-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-mx-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-co-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-th-20260923');

update public.jurisdiction_data_depth_dimension_state
set applicability='applicable',status='complete',evidence_count=1,primary_source_count=1,
 latest_verified_at=now(),freshness_deadline=now()+interval '180 days',confidence='high',
 evidence_basis='COFEPRIS current 2026 medicinal-cannabis and sanitary-control framework',
 last_evaluated_at=now(),updated_at=now()
where jurisdiction_key='MX' and dimension_key in ('pathways','commercial_activity','import','export','access_rules')
  and contract_version='2026-09-23.v2';

update public.jurisdiction_data_depth_dimension_state
set applicability='applicable',status='complete',evidence_count=1,primary_source_count=1,
 latest_verified_at=now(),freshness_deadline=now()+interval '180 days',confidence='high',
 evidence_basis='INVIMA current cannabis medicinal licensing and commercialization framework',
 last_evaluated_at=now(),updated_at=now()
where jurisdiction_key='CO' and dimension_key in ('pathways','commercial_activity','import','export','distribution','access_rules')
  and contract_version='2026-09-23.v2';

update public.jurisdiction_data_depth_dimension_state
set applicability='applicable',status='complete',evidence_count=1,primary_source_count=1,
 latest_verified_at=now(),freshness_deadline=now()+interval '180 days',confidence='high',
 evidence_basis='Thailand DTAM 2026 controlled-herb commercial and medical framework',
 last_evaluated_at=now(),updated_at=now()
where jurisdiction_key='TH' and dimension_key in ('pathways','commercial_activity','import','export','access_rules','calendar')
  and contract_version='2026-09-23.v2';
