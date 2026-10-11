-- Primary Kyrgyz Republic regulatory provenance.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='KG' and active=true;
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values ('Kyrgyz Republic — Law No. 69 on Narcotic Drugs, Psychotropic Substances, Analogues and Precursors','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','Kyrgyzstan',true,'Kyrgyzstan','KG','ru','monthly','verified','KG',1,false,'statute',true,'Primary Ministry of Justice legal information bank. Law No. 69 dated 2024-03-06 establishes the national controlled-substances framework; Cabinet Resolution No. 152 of 2025 establishes controlled substances subject to that law.','official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='KG',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values ('primary-evidence-kg-law69-2024','KG','prohibited','Kyrgyzstan''s 2024 narcotics law establishes the national controlled-substances regime, with the 2025 Cabinet control list identifying substances subject to control. The primary legal sources reviewed do not establish a general commercial cannabis market.','Kyrgyz Republic Ministry of Justice','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','2024-03-06',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values ('primary-evidence-kg-law69-2024','KG','primary-evidence-claim:kg-law69-2024','Kyrgyzstan''s 2024 controlled-substances law and 2025 control list establish a national narcotics-control framework; the cited primary sources do not establish general commercial cannabis retail.','any','national','Kyrgyz Republic Ministry of Justice','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','2024-03-06',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=now(),expires_at=now()+interval '180 days';
insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'KG','effective','Law No. 69 on Narcotic Drugs, Psychotropic Substances, Analogues and Precursors','2024-03-06','confirmed','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','Kyrgyz Republic Ministry of Justice','effective'
where not exists (select 1 from public.regulatory_calendar where iso2='KG' and title='Law No. 69 on Narcotic Drugs, Psychotropic Substances, Analogues and Precursors');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Kyrgyz Republic Ministry of Justice legal source.',last_evaluated_at=now()
where jurisdiction_key='KG' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary legal framework does not establish a general commercial cannabis pathway or commercial cannabis product-format rules.',last_evaluated_at=now()
where jurisdiction_key='KG' and dimension_key in ('verified_pathways','verified_format_rules');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='KG' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules') and status in ('open','in_progress','blocked');