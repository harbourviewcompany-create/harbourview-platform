-- Primary-source source-registry enrichment for Wisconsin, Wyoming and Greenland.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,sub_region,requires_translation,notes,region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,next_crawl_at,consecutive_failures,network_status,content_change_rate,verification_notes,verification_checked_at,content_type,metadata,regulator_class)
values
('Wisconsin Department of Health Services — Youth Substance Use Facts','https://www.dhs.wisconsin.gov/small-talks/facts.htm','Wisconsin',true,'United States','US','Wisconsin',false,
 'Official Wisconsin DHS source states possession of illegal substances including cannabis is against Wisconsin law.','north_america','en','html_snapshot','daily','active','US-WI',1,false,
 'government_regulator',true,now(),0,'online',0.2,'Official Wisconsin government source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Wisconsin Department of Health Services'),'other'),
('Wyoming Division of Criminal Investigation — Controlled Substances','https://wyomingdci.wyo.gov/dci-homepage/controlled-substances','Wyoming',true,'United States','US','Wyoming',false,
 'Official Wyoming source describing controlled-substance scheduling under Wyoming law and the Commissioner of Drugs and Substance Control.','north_america','en','html_snapshot','daily','active','US-WY',1,false,
 'government_regulator',true,now(),0,'online',0.2,'Official Wyoming government source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Wyoming Division of Criminal Investigation'),'other'),
('Greenland Government / Naalakkersuisut — WHO Cannabis Policy Memorandum','https://naalakkersuisut.gl/-/media/nyheder/2024/07/greenland-who-mou.pdf','Greenland',true,'Greenland','GL','Greenland',false,
 'Official Naalakkersuisut document records Greenland parliamentary consideration of cannabis legalization and possible sale, supporting jurisdiction-specific policy monitoring.','americas','en','html_snapshot','daily','active','GL',1,false,
 'government_legal',true,now(),0,'online',0.2,'Official Greenland government source verified 2026-09-22.',now(),
 array['policy','law','market_regulation']::text[],jsonb_build_object('authority','Naalakkersuisut'),'other')
on conflict (source_url) do update set is_active=true,relevance_status='active',jurisdiction_code=excluded.jurisdiction_code,
verification_notes=excluded.verification_notes,verification_checked_at=excluded.verification_checked_at,updated_at=now();

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where dimension_key='source_registry' and jurisdiction_key in ('US-WI','US-WY','GL');
