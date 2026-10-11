-- Recovery regulator-source fallback batch.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,
 relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,
 verification_notes,regulator_class,next_crawl_at,network_status)
values
('France Ministry of Health — Medical Cannabis Framework','https://sante.gouv.fr/actualites/presse/communiques-de-presse/article/notification-des-textes-encadrant-l-usage-du-cannabis-medical-a-la-commission?lang=en','France',true,'France','FR','fr','monthly','verified','FR',1,false,'government_regulator',true,'Official Ministry of Health source describing the medical-cannabis authorization framework and ANSM role.','health_authority',now(),'online'),
('Bosnia and Herzegovina Agency for Medicinal Products — Cannabis Statement','https://almbih.gov.ba/saopa-tenje-za-javnost-vezano-za-kanabis/','Bosnia and Herzegovina',true,'Bosnia and Herzegovina','BA','bs','monthly','verified','BA',1,false,'government_regulator',true,'Official Agency for Medicinal Products and Medical Devices cannabis regulatory statement.','health_authority',now(),'online'),
('Cyprus Pharmaceutical Services — medicinal products service','https://www.gov.cy/en/service/search-for-medicinal-products-for-human-use/','Cyprus',true,'Cyprus','CY','en','monthly','verified','CY',1,false,'government_regulator',true,'Official Cyprus government service identifying Pharmaceutical Services, Ministry of Health, as responsible department.','health_authority',now(),'online'),
('Zimbabwe MCAZ — Online Regulatory Registers','https://onlineservices.mcaz.co.zw/onlineregister/','Zimbabwe',true,'Zimbabwe','ZW','en','monthly','verified','ZW',1,false,'government_regulator',true,'Official Medicines Control Authority regulatory register.','health_authority',now(),'online'),
('Peru DIGEMID — Cannabis Patient Information','https://serviciosweb-digemid.minsa.gob.pe/ControlCannabis/archivos/InfoParaElPacienteCannabis.pdf','Peru',true,'Peru','PE','es','monthly','verified','PE',1,false,'government_regulator',true,'Official DIGEMID medicinal-cannabis patient and regulatory information.','health_authority',now(),'online')
on conflict (source_url) do update set
  source_name=excluded.source_name,jurisdiction=excluded.jurisdiction,is_active=true,
  country=excluded.country,iso=excluded.iso,language=excluded.language,
  crawl_cadence=excluded.crawl_cadence,relevance_status='verified',
  jurisdiction_code=excluded.jurisdiction_code,tier=1,requires_auth=false,
  source_type='government_regulator',crawl_allowed=true,
  verification_notes=excluded.verification_notes,regulator_class=excluded.regulator_class,
  next_crawl_at=least(coalesce(public.source_registry.next_crawl_at,now()),now()),
  network_status=case when public.source_registry.network_status='quarantined' then 'degraded'
                      else coalesce(public.source_registry.network_status,'online') end,
  updated_at=now();