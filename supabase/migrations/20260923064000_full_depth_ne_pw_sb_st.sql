-- Primary-source depth expansion for Niger, Palau, Solomon Islands, and Sao Tome and Principe.
-- Regulatory cells are evidence-backed; unsupported market/pathway dimensions remain explicitly empty.
-- Snapshot capture is operational and not fabricated in migration data.

insert into public.source_registry(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Niger — Recueil thématique des textes législatifs et réglementaires on narcotics','https://justice.gouv.ne/images/lois/pdfs/recueil_thematique_de_textes_legislatifs_et_reglementaires.pdf','Niger',true,'Niger','NE','fr','monthly','verified','NE',1,false,'statute',true,'Official Niger Justice Ministry compilation; cannabis cultivation is prohibited and controlled-substance dealings are regulated under the narcotics framework.','legislature'),
('Palau — Bureau of Customs and Border Protection — Prohibited Goods','https://bcbp.pw/?page_id=159','Palau',true,'Palau','PW','en','monthly','verified','PW',1,false,'customs',true,'Official Palau customs source identifies narcotic drugs, stimulants and marijuana as prohibited goods.','customs_import_export'),
('Solomon Islands — Attorney-General Dangerous Drugs Act (Cap. 98)','https://attorneygenerals.gov.sb/legislation-dashboard/download-info/dangerous-drugs-act-cap-98v2_as-at-011009/','Solomon Islands',true,'Solomon Islands','SB','en','monthly','verified','SB',1,false,'statute',true,'Official Attorney-General legislation portal identifies Dangerous Drugs Act (Cap. 98) as current legislation.','legislature'),
('São Tomé and Príncipe — UIF controlled-substances schedule','https://uif.gov.st/Portal/Material.do?act=downloadFotoMaterial&id=1','São Tomé and Príncipe',true,'São Tomé and Príncipe','ST','pt','monthly','verified','ST',1,false,'statute',true,'Official government material lists Cannabis, cannabis resin and cannabis oil in controlled schedules.','official_gazette')
on conflict(source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,updated_at=now();

insert into public.regulatory_market_access_evidence(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-ne-cannabis-law','NE','prohibited','Niger prohibits cannabis cultivation nationally and prohibits production, commerce, distribution, possession, acquisition, import, export and transit for Table I controlled plants/substances except statutory licensed cases.','Niger Ministry of Justice','https://justice.gouv.ne/images/lois/pdfs/recueil_thematique_de_textes_legislatifs_et_reglementaires.pdf',now(),now()+interval '180 days',true),
('primary-evidence-pw-marijuana-enforcement','PW','prohibited','Palau government customs and justice sources identify marijuana as prohibited and illegal cultivation as an offense; no general commercial cannabis pathway is established by the cited official sources.','Republic of Palau — Ministry of Justice / Bureau of Customs','https://bcbp.pw/?page_id=159',now(),now()+interval '180 days',true),
('primary-evidence-sb-dangerous-drugs-act','SB','prohibited','The Solomon Islands Attorney-General identifies the Dangerous Drugs Act (Cap. 98) as current legislation. Government review material records the Act as under modernization review; no commercial cannabis pathway is established by the cited sources.','Solomon Islands Attorney-General''s Chambers','https://attorneygenerals.gov.sb/legislation-dashboard/download-info/dangerous-drugs-act-cap-98v2_as-at-011009/',now(),now()+interval '180 days',true),
('primary-evidence-st-cannabis-schedule','ST','prohibited','São Tomé and Príncipe government material lists Cannabis, cannabis resin and cannabis oil in controlled narcotics schedules; no commercial cannabis pathway is established by the cited source.','São Tomé and Príncipe — UIF','https://uif.gov.st/Portal/Material.do?act=downloadFotoMaterial&id=1',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set active=true,verified_at=excluded.verified_at,expires_at=excluded.expires_at,rationale=excluded.rationale;

insert into public.regulatory_market_access_claims(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-ne-cannabis-law','NE','primary-evidence-claim:ne-cannabis-law','Niger prohibits cultivation of cannabis nationally and prohibits commercial dealings in Table I controlled plants and substances except statutory licensed cases.','any','national','Niger Ministry of Justice','https://justice.gouv.ne/images/lois/pdfs/recueil_thematique_de_textes_legislatifs_et_reglementaires.pdf',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-pw-marijuana-enforcement','PW','primary-evidence-claim:pw-marijuana-enforcement','Palau government sources identify marijuana cultivation as illegal and marijuana/narcotic drugs as prohibited goods.','any','national','Republic of Palau — Ministry of Justice / Bureau of Customs','https://bcbp.pw/?page_id=159',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-sb-dangerous-drugs-act','SB','primary-evidence-claim:sb-dangerous-drugs-act','Solomon Islands maintains the Dangerous Drugs Act (Cap. 98) as current legislation; no commercial cannabis pathway is established by the cited official sources.','any','national','Solomon Islands Attorney-General''s Chambers','https://attorneygenerals.gov.sb/legislation-dashboard/download-info/dangerous-drugs-act-cap-98v2_as-at-011009/',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-st-cannabis-schedule','ST','primary-evidence-claim:st-cannabis-schedule','São Tomé and Príncipe government material lists Cannabis, cannabis resin and cannabis oil in controlled narcotics schedules; no commercial cannabis pathway is established by the cited source.','any','national','São Tomé and Príncipe — UIF','https://uif.gov.st/Portal/Material.do?act=downloadFotoMaterial&id=1',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=excluded.verified_at,expires_at=excluded.expires_at;

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary/current government regulatory source verified.',last_evaluated_at=now()
where jurisdiction_key in ('NE','PW','SB','ST') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary/current government evidence does not establish a general commercial cannabis pathway, commercial product-format framework, legal-market metrics, legal cannabis trade-flow series, market signals, or scheduled regulatory event for this jurisdiction.',last_evaluated_at=now()
where jurisdiction_key in ('NE','PW','SB','ST') and dimension_key in ('verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('NE','PW','SB','ST')
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals')
and status in ('open','in_progress','blocked');

-- Synchronous raw-source capture helper. It stores the SHA-256 of the returned raw response.
create or replace function public.capture_one_source_sync(p_source_id uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare s record; r record; h text; prev text; sid uuid;
begin
 select id,source_name,source_url into s from public.source_registry where id=p_source_id and is_active=true and crawl_allowed=true;
 if not found then return jsonb_build_object('ok',false,'error','source_not_found_or_not_crawlable'); end if;
 select * into r from extensions.http_get(s.source_url);
 h := encode(digest(coalesce(r.content,''),'sha256'),'hex');
 select raw_html_hash into prev from public.source_snapshots where source_id=s.id and fetch_status='success' order by captured_at desc limit 1;
 insert into public.source_snapshots(source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,fetch_status,error_message,language_detected,word_count,requires_translation,previous_hash,changed,processing_status)
 values(s.id,s.source_url,s.source_name,case when lower(coalesce(r.content_type,'')) like 'text/html%' then regexp_replace(coalesce(r.content,''),'<[^>]+>',' ','g') else null end,h,now(),case when r.status between 200 and 299 then 'success' else 'http_error' end,case when r.status between 200 and 299 then null else 'HTTP '||r.status end,'unknown',case when lower(coalesce(r.content_type,'')) like 'text/html%' then array_length(regexp_split_to_array(trim(regexp_replace(coalesce(r.content,''),'<[^>]+>',' ','g')),'\s+'),1) else null end,false,prev,coalesce(prev,'')<>h,'pending')
 returning id into sid;
 update public.source_registry set last_checked_at=now(),network_status=case when r.status between 200 and 299 then 'online' else 'http_error' end,consecutive_failures=case when r.status between 200 and 299 then 0 else consecutive_failures+1 end,updated_at=now() where id=s.id;
 return jsonb_build_object('ok',r.status between 200 and 299,'status',r.status,'content_type',r.content_type,'snapshot_id',sid,'hash',h);
exception when others then return jsonb_build_object('ok',false,'error',sqlerrm);
end $$;
