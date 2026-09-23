-- Primary Monaco cannabis-control enrichment from current Legimonaco Article 32.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Monaco Legimonaco — Ministerial Order No. 91-368, Article 32 cannabis controls',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'Monaco',true,'Monaco','MC','fr','monthly','verified','MC',1,false,'regulation',true,
'Current Article 32 regime prohibits cannabis and cannabis-derived products, with narrow research/control, pharmaceutical, and non-narcotic-variety exceptions.',
'drug_control_authority')
on conflict(source_url) do update set is_active=true,jurisdiction_code='MC',verification_notes=excluded.verification_notes,updated_at=now();

update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='MC' and active=true;
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-mc-cannabis-order-2019','MC','medical_limited_trade',
'Monaco''s current Article 32 regime prohibits ordinary commercial cannabis activity, subject to narrow derogations for research/control, authorized derivatives, non-narcotic cannabis varieties authorized by ministerial order, and authorized pharmaceutical specialties.',
'Legimonaco — Principality of Monaco','https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'2019-08-07',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-mc-cannabis-order-2019','MC','primary-evidence-claim:mc-cannabis-order-2019',
'Monaco prohibits ordinary commercial cannabis activity; narrow exceptions cover research/control, authorized derivatives, non-narcotic cannabis varieties authorized by ministerial order, and authorized pharmaceutical specialties.',
'any','national','Legimonaco — Principality of Monaco',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'2019-08-07',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=excluded.verified_at,expires_at=excluded.expires_at,updated_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select '1a237176-7a4f-43ba-9d94-ea63b9ad3382','MC','depth-v1-mc-authorized-non-narcotic-cannabis',
'Authorized non-narcotic cannabis varieties','domestic_authorization','Ministerial Order No. 91-368, Article 32 II','Monaco Minister of State','active','2019-08-07',
'Cultivation, import, export and industrial/commercial use of cannabis varieties without narcotic properties may be authorized by ministerial order. This is not a general adult-use cannabis pathway.',
array['https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf'],'needs_review',now()
where not exists(select 1 from public.regulatory_pathways where iso_alpha2='MC' and slug='depth-v1-mc-authorized-non-narcotic-cannabis');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Ministerial Order No. 91-368','Article 32 II','statute',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'2019-08-07',current_date,'Industrial and commercial use of cannabis varieties without narcotic properties may be authorized by ministerial order.'
from public.regulatory_pathways p
where p.iso_alpha2='MC' and p.slug='depth-v1-mc-authorized-non-narcotic-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='MC' and slug='depth-v1-mc-authorized-non-narcotic-cannabis';

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'MC','effective','Article 32 cannabis control regime in current Ministerial Order No. 91-368','2019-08-07','confirmed',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'Legimonaco — Principality of Monaco','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='MC' and title='Article 32 cannabis control regime in current Ministerial Order No. 91-368');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Monaco Legimonaco source establishes current Article 32 cannabis controls and an authorized non-narcotic variety pathway.',
last_evaluated_at=now()
where jurisdiction_key='MC' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Monaco Article 32 source does not establish general commercial cannabis product-format rules.',
last_evaluated_at=now()
where jurisdiction_key='MC' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='MC' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar','verified_format_rules')
and status in ('open','in_progress','blocked');
