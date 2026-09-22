-- Primary-source source-registry enrichment for Vanuatu and Nauru.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,sub_region,requires_translation,notes,region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,next_crawl_at,consecutive_failures,network_status,content_change_rate,verification_notes,verification_checked_at,content_type,metadata,regulator_class)
values
('Vanuatu Customs & Inland Revenue — Prohibitions & Restrictions','https://customs.vanuatu.gov.vu/customs/services/prohibitions-restrictions.html','Vanuatu',true,'Vanuatu','VU','Vanuatu',false,
 'Official Vanuatu Customs source identifying marijuana as an illicit drug under the Dangerous Drugs Act.','asia_pacific','en','html_snapshot','daily','active','VU',1,false,
 'government_regulator',true,now(),0,'online',0.2,'Official Vanuatu government source verified 2026-09-22.',now(),
 array['law','import_controls','controlled_substances']::text[],jsonb_build_object('authority','Vanuatu Customs & Inland Revenue'),'other'),
('Nauru Department of Justice & Border Control — Illicit Drugs Control','https://justice.gov.nr/office-of-the-legislative-drafter/','Nauru',true,'Nauru','NR','Nauru',false,
 'Official Nauru Justice source for illicit-drug legislation and enforcement; current court material confirms cannabis possession offences.','asia_pacific','en','html_snapshot','daily','active','NR',1,false,
 'government_legal',true,now(),0,'online',0.2,'Official Nauru government source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Department of Justice and Border Control'),'other')
on conflict (source_url) do update set is_active=true,relevance_status='active',jurisdiction_code=excluded.jurisdiction_code,
verification_notes=excluded.verification_notes,verification_checked_at=excluded.verification_checked_at,updated_at=now();

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes=coalesce(notes,'') || ' Official government source verified 2026-09-22.'
where dimension_key='source_registry' and jurisdiction_key in ('VU','NR');
