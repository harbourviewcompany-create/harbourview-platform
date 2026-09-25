update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2 in ('KW','LY') and active=true;

insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Kuwait Government Online — Amiri Decree-Law No. 59 of 2025 on combating drugs and psychotropic substances','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','Kuwait',true,'Kuwait','KW','en','monthly','verified','KW',1,false,'statute',true,'Official Kuwait Government Online notice describing the 2025 unified drug-control decree-law and licensing controls.','official_gazette'),
('Libya Ministry of Justice — Law No. 7 of 1990 on narcotic drugs and psychotropic substances','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','Libya',true,'Libya','LY','ar','monthly','verified','LY',1,false,'statute',true,'Official Ministry of Justice text. Prohibits dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases.','legislature')
on conflict (source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-kw-decree59-2025','KW','prohibited','Kuwait''s 2025 unified drug-control decree-law prohibits production, manufacture, import, export, transport, possession, purchase, sale and trafficking of narcotic/psychotropic substances except within statutory licensing conditions; cultivation of prohibited plants is restricted to authorized institutions.','Kuwait Government Online','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','2025-11-26',now(),now()+interval '180 days',true),
('primary-evidence-ly-law7-1990','LY','prohibited','Libya Law No. 7 of 1990 prohibits cultivation, import, export, possession, sale and related dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases.','Libya Ministry of Justice','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','1990-06-10',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-kw-decree59-2025','KW','primary-evidence-claim:kw-decree59-2025','Kuwait''s 2025 unified drug-control framework prohibits unauthorized cultivation and commercial dealings in narcotic/psychotropic substances; controlled cultivation and handling require statutory authorization.','any','national','Kuwait Government Online','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','2025-11-26',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-ly-law7-1990','LY','primary-evidence-claim:ly-law7-1990','Libya''s Law No. 7 of 1990 prohibits dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases; it does not establish general commercial cannabis retail.','any','national','Libya Ministry of Justice','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','1990-06-10',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
values
('KW','effective','Amiri Decree-Law No. 59 of 2025 — unified drug-control framework','2025-11-26','confirmed','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','Kuwait Government Online','effective'),
('LY','effective','Law No. 7 of 1990 — narcotic drugs and psychotropic substances','1990-06-10','confirmed','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','Libya Ministry of Justice','effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government legal source registered and verified.',last_evaluated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary law establishes prohibition/licensing controls but no general commercial cannabis pathway or product-format framework.',last_evaluated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');
