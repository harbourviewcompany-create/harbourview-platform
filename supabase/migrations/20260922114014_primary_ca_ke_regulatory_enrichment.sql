-- Primary-source regulatory enrichment for Canada and Kenya.
-- Replaces non-primary evidence with current government/legal sources and adds verified pathways/claims.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Health Canada — Regulations under the Cannabis Act','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','Canada','Canada','CA','CA','regulatory','health_authority','Primary Government of Canada source covering production, distribution, sale, import and export licensing under the Cannabis Act and Regulations.',true,true,'Primary federal cannabis regulatory source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html');

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Kenya Law — Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','Kenya','Kenya','KE','KE','legal','legislature','Primary Kenya Law publication of the national narcotics statute; cannabis is expressly defined and controlled, with limited licensed/medical exemptions.',true,true,'Primary legal source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf');

update public.regulatory_market_access_evidence set active=false where evidence_key in ('incb-2023-trade-ca','hv-mkt-ke-20260907');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ca-cannabis-act-20260922','CA','legal_commercial_access','Health Canada states that the Cannabis Act and Cannabis Regulations establish the federal legal framework for production, distribution, sale, import and export; provinces and territories authorize non-medical retail sale through their own systems.','Health Canada — Regulations under the Cannabis Act','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2018-10-17',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ca-cannabis-act-20260922');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ke-narcotics-act-20260922','KE','prohibited','Kenya Law publishes the Narcotic Drugs and Psychotropic Substances (Control) Act, which defines cannabis and criminalizes possession and trafficking, while providing narrow statutory exemptions for licensed or medical possession. No general commercial cannabis retail pathway is established by the cited Act.','Kenya Law — Narcotic Drugs and Psychotropic Substances (Control) Act','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','2022-12-31',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ke-narcotics-act-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-ca-cannabis-act-20260922','CA','primary-evidence-claim:primary-evidence-ca-cannabis-act-20260922','Canada has a federal legal framework for commercial cannabis production and sale; provincial and territorial governments authorize non-medical retail sale within their jurisdictions.','any','CA','Health Canada — Regulations under the Cannabis Act','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2018-10-17',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-ca-cannabis-act-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-ke-narcotics-act-20260922','KE','primary-evidence-claim:primary-evidence-ke-narcotics-act-20260922','Kenya’s Narcotic Drugs and Psychotropic Substances (Control) Act defines and controls cannabis and criminalizes possession and trafficking, subject to narrow statutory exemptions; the cited Act does not establish general commercial cannabis retail.','any','KE','Kenya Law — Narcotic Drugs and Psychotropic Substances (Control) Act','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','2022-12-31',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-ke-narcotics-act-20260922');

do $$
declare pid uuid;
begin
 if not exists(select 1 from public.regulatory_pathways where slug='depth-v1-ca') then
  insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
  values('a2c3726a-12a5-40c6-a640-65a735c579ac','CA','depth-v1-ca','Canada federal commercial cannabis framework','adult_use_commercial','Cannabis Act and Cannabis Regulations','Health Canada plus provincial/territorial regulators','active','2018-10-17','Federal licensing governs production and sale; provinces and territories authorize non-medical retail distribution within their jurisdictions.',array['https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html'],'needs_review',now(),array[]::text[])
  returning id into pid;
 else select id into pid from public.regulatory_pathways where slug='depth-v1-ca';
 end if;
 if not exists(select 1 from public.regulatory_citations where entity_type='pathway' and entity_id=pid and citation_url='https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html') then
  insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
  values('pathway',pid,'Cannabis Act and Cannabis Regulations','Federal licensing and provincial/territorial retail authorization','regulator','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2018-10-17',current_date,'Regulations set rules for production, distribution, sale, import and export; provinces and territories authorize non-medical retail sale.');
 end if;
 update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where id=pid;
 if not exists(select 1 from public.regulatory_pathways where slug='depth-v1-ke') then
  insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
  values('8ff64be8-1f33-42b5-9ba7-7cdd13c6fe6a','KE','depth-v1-ke','Kenya controlled cannabis possession and medical exemption framework','medical_access_program','Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245','Kenya national narcotics control / medical authorization framework','active','2022-12-31','The Act prohibits possession and trafficking of cannabis except within specified licensed or medical exemptions; it does not establish a general commercial retail pathway.',array['https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf'],'needs_review',now(),array[]::text[])
  returning id into pid;
 else select id into pid from public.regulatory_pathways where slug='depth-v1-ke';
 end if;
 if not exists(select 1 from public.regulatory_citations where entity_type='pathway' and entity_id=pid and citation_url='https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf') then
  insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
  values('pathway',pid,'Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245','Sections 3 and 6','regulator','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','2022-12-31',current_date,'The Act controls cannabis possession and trafficking and prohibits cultivation of cannabis plants, subject to statutory exemptions.');
 end if;
 update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where id=pid;
end $$;