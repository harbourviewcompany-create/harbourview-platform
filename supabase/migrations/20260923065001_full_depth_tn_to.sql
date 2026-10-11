-- Primary-source depth expansion for Tunisia and Tonga.
insert into public.source_registry(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Tunisia — Law No. 92-52 on Narcotics, current legal text','https://legislation-securite.tn/latest-laws/loi-n-92-52-du-18-mai-1992-relative-aux-stupefiants/','Tunisia',true,'Tunisia','TN','fr','monthly','verified','TN',1,false,'statute',true,'Current legal text: narcotic plants and related cultivation, possession, sale, distribution, import/export and other dealings are prohibited except legally permitted medical/research cases.','legislature'),
('Tonga — Attorney-General legislation index / Illicit Drugs Control Act','https://ago.gov.to/cms/legislation/index/alphabetical.html','Tonga',true,'Tonga','TO','en','monthly','verified','TO',1,false,'statute',true,'Official Tonga legislation index identifies the Illicit Drugs Control Act 2003 and subsequent amendments as current legislation.','legislature')
on conflict(source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,updated_at=now();

insert into public.regulatory_market_access_evidence(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-tn-narcotics-law','TN','prohibited','Tunisia Law No. 92-52 prohibits cultivation, consumption, production, possession, purchase, transport, circulation, sale, distribution, import and export of narcotic plants/substances, subject to legally permitted exceptions including medicine and scientific research.','Tunisia legal legislation database','https://legislation-securite.tn/latest-laws/loi-n-92-52-du-18-mai-1992-relative-aux-stupefiants/',now(),now()+interval '180 days',true),
('primary-evidence-to-illicit-drugs-act','TO','prohibited','Tonga maintains the Illicit Drugs Control Act 2003 and later amendments as current law governing illicit drugs; no commercial cannabis pathway is established by the cited sources.','Tonga Attorney-General''s Office','https://ago.gov.to/cms/legislation/index/alphabetical.html',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set active=true,verified_at=excluded.verified_at,expires_at=excluded.expires_at,rationale=excluded.rationale;

insert into public.regulatory_market_access_claims(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-tn-narcotics-law','TN','primary-evidence-claim:tn-narcotics-law','Tunisia prohibits cannabis/narcotic cultivation and commercial dealings except legally permitted medical or scientific cases under its narcotics law.','any','national','Tunisia legal legislation database','https://legislation-securite.tn/latest-laws/loi-n-92-52-du-18-mai-1992-relative-aux-stupefiants/',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-to-illicit-drugs-act','TO','primary-evidence-claim:to-illicit-drugs-act','Tonga maintains the Illicit Drugs Control Act 2003 and subsequent amendments; no commercial cannabis pathway is established by the cited sources.','any','national','Tonga Attorney-General''s Office','https://ago.gov.to/cms/legislation/index/alphabetical.html',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=excluded.verified_at,expires_at=excluded.expires_at;

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Current official/legal source verified.',last_evaluated_at=now()
where jurisdiction_key in ('TN','TO') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Current authoritative evidence does not establish a general commercial cannabis pathway, commercial product-format framework, legal-market metrics, legal cannabis trade-flow series, market signals, or scheduled regulatory event.',last_evaluated_at=now()
where jurisdiction_key in ('TN','TO') and dimension_key in ('verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('TN','TO') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals')
and status in ('open','in_progress','blocked');
