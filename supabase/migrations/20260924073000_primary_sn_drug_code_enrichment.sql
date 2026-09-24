-- Primary Senegal cannabis prohibition provenance.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='SN' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Senegal — Code des Drogues / government cannabis prohibition record','https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien','Senegal',true,'Senegal','SN','fr','monthly','verified','SN',1,false,'statute',true,
'Government institutional documentation identifies Law No. 1963/16 of 5 February 1963 repressing cultivation, possession, commerce and use of Indian hemp. Current drug-code provisions prohibit cannabis cultivation nationally and prohibit production, commerce, distribution, transport, possession, import/export and related dealings for controlled substances.','legislature');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-sn-code-drogues','SN','prohibited',
'Senegal government institutional documentation identifies Law No. 1963/16 of 5 February 1963 repressing cultivation, possession, commerce and use of Indian hemp. Current Code des Drogues provisions state that cannabis cultivation is prohibited nationally and prohibit production, commerce, wholesale/retail distribution, transport, possession, acquisition, use, import, export and transit for substances in Table I. No general commercial cannabis pathway is established by the cited framework.',
'Republic of Senegal — Centre d''Informations et de Documentation sur les Institutions et la Gouvernance',
'https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-sn-code-drogues','SN','primary-evidence-claim:sn-code-drogues',
'Senegal''s drug-control framework prohibits cannabis cultivation nationally and prohibits commercial production, trade, wholesale/retail distribution, possession, transport, import and export of controlled cannabis-related substances; the cited framework does not establish general commercial cannabis retail.',
'any','national','Republic of Senegal — government institutional documentation',
'https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien',now(),now(),now()+interval '180 days','verified');

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',
evidence_basis='Primary/current government institutional cannabis prohibition record and current Code des Drogues provisions.',last_evaluated_at=now()
where jurisdiction_key='SN' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',
evidence_basis='Cited Senegal drug-control framework establishes prohibition rather than a commercial cannabis pathway or commercial product-format framework.',last_evaluated_at=now()
where jurisdiction_key='SN' and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='SN' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');
