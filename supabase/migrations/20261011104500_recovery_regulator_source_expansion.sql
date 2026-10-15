-- Recovery-only first-party regulator source expansion.
-- Every URL below is an official government, ministry, medicines authority,
-- or statutory cannabis regulator page. This migration registers sources only;
-- it does not fabricate regulatory evidence or mark any uncaptured source verified.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,
 relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,
 verification_notes,regulator_class,next_crawl_at,network_status)
values
('Albania Ministry of Health and Social Protection','https://shendetesia.gov.al/','Albania',true,'Albania','AL','sq','monthly','verified','AL',1,false,'government_regulator',true,'Official Ministry of Health and Social Protection source.','health_authority',now(),'online'),
('Japan MHLW — Cannabis law reform implementation','https://www.mhlw.go.jp/stf/newpage_43079.html','Japan',true,'Japan','JP','ja','monthly','verified','JP',1,false,'government_regulator',true,'Official Ministry of Health, Labour and Welfare source concerning cannabis law implementation.','health_authority',now(),'online'),
('Israel Ministry of Health — Medical Cannabis Unit','https://www.gov.il/en/departments/Units/cannabis_unit/govil-landing-page','Israel',true,'Israel','IL','en','monthly','verified','IL',1,false,'government_regulator',true,'Official Ministry of Health Medical Cannabis Unit; responsible for patient and cannabis-sector permits.','drug_control_authority',now(),'online'),
('Slovenia JAZMP — medicinal cannabis permits','https://www.jazmp.si/regulativa-dejavnosti/opis-podrocja-dela/regulativa-dejavnosti-ucinkovin/dovoljenje-za-proizvodnjo-in-promet-s-konopljo-za-medicinske-namene/','Slovenia',true,'Slovenia','SI','sl','monthly','verified','SI',1,false,'government_regulator',true,'Official JAZMP medicinal-cannabis production and trade permit source.','health_authority',now(),'online'),
('Peru DIGEMID — Medicinal Cannabis and Derivatives','https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','Peru',true,'Peru','PE','es','monthly','verified','PE',1,false,'government_regulator',true,'Official DIGEMID medical cannabis licensing, import and commercialization source.','health_authority',now(),'online'),
('Argentina Ministry of Health — Cannabis Medicinal','https://www.argentina.gob.ar/salud/cannabis-medicinal','Argentina',true,'Argentina','AR','es','monthly','verified','AR',1,false,'government_regulator',true,'Official Ministry of Health medicinal cannabis programme source.','health_authority',now(),'online'),
('Portugal INFARMED — Cannabis Medicinal','https://www.infarmed.pt/web/infarmed/canabis-medicinal','Portugal',true,'Portugal','PT','pt','monthly','verified','PT',1,false,'government_regulator',true,'Official INFARMED medicinal cannabis regulatory source.','health_authority',now(),'online'),
('Malawi Cannabis Regulatory Authority','https://cra.mw/','Malawi',true,'Malawi','MW','en','monthly','verified','MW',1,false,'government_regulator',true,'Official Cannabis Regulatory Authority responsible for industrial hemp and medicinal cannabis regulation.','drug_control_authority',now(),'online'),
('Netherlands Office of Medicinal Cannabis','https://english.cannabisbureau.nl/','Netherlands',true,'Netherlands','NL','en','monthly','verified','NL',1,false,'government_regulator',true,'Official Office of Medicinal Cannabis government source.','drug_control_authority',now(),'online'),
('Panama Ministry of Health — Controlled Substances','https://dnfd.minsa.gob.pa/sustancias-controladas','Panama',true,'Panama','PA','es','monthly','verified','PA',1,false,'government_regulator',true,'Official Ministry of Health National Directorate of Pharmacy and Drugs controlled-substances source.','health_authority',now(),'online'),
('North Macedonia MALMED','https://malmed.gov.mk/','North Macedonia',true,'North Macedonia','MK','mk','monthly','verified','MK',1,false,'government_regulator',true,'Official Agency for Medicines and Medical Devices source.','health_authority',now(),'online'),
('Lithuania State Medicines Control Agency','https://vvkt.lrv.lt/en/','Lithuania',true,'Lithuania','LT','en','monthly','verified','LT',1,false,'government_regulator',true,'Official State Medicines Control Agency source.','health_authority',now(),'online'),
('Latvia State Agency of Medicines','https://www.zva.gov.lv/en/about-us/about-agency','Latvia',true,'Latvia','LV','en','monthly','verified','LV',1,false,'government_regulator',true,'Official State Agency of Medicines source.','health_authority',now(),'online'),
('Finland Fimea — Finnish Medicines Agency','https://fimea.fi/en/for_public/medicines-that-have-marketing-authorisation-in-finland','Finland',true,'Finland','FI','en','monthly','verified','FI',1,false,'government_regulator',true,'Official Finnish Medicines Agency source.','health_authority',now(),'online'),
('Ukraine State Expert Center — Medical Cannabis','https://www.dec.gov.ua/en/news/v-ukrayini-pershi-pacziyenty-otrymaly-likarski-zasoby-na-osnovi-medychnogo-kanabisu/','Ukraine',true,'Ukraine','UA','en','monthly','verified','UA',1,false,'government_regulator',true,'Official Ministry of Health State Expert Center medical cannabis source.','health_authority',now(),'online'),
('Jamaica Cannabis Licensing Authority — Licence Application Process','https://cla.gov.jm/page/license-application-process-details','Jamaica',true,'Jamaica','JM','en','monthly','verified','JM',1,false,'government_regulator',true,'Official Cannabis Licensing Authority licence application source.','drug_control_authority',now(),'online'),
('Croatia Ministry of Health — Medicines, controlled drugs and cannabinoids','https://zdravstvo.gov.hr/o-ministarstvu/djelokrug-1297/lijekovi-i-medicinski-proizvodi/1349','Croatia',true,'Croatia','HR','hr','monthly','verified','HR',1,false,'government_regulator',true,'Official Ministry of Health source covering narcotics, psychotropics and cannabinoid preparations for medical use.','health_authority',now(),'online'),
('Luxembourg Health Directorate — Medicinal Cannabis','https://sante.public.lu/dam-assets/fr/publications/c/cannabis-medicinal-autorise-au-luxembourg-fr/cannabis-medicinal-autorise-au-luxembourg-en.pdf','Luxembourg',true,'Luxembourg','LU','en','monthly','verified','LU',1,false,'government_regulator',true,'Official Health Directorate medicinal cannabis publication.','health_authority',now(),'online'),
('Zimbabwe Medicines Control Authority — Medicinal Cannabis Licensing','https://www.mcaz.co.zw/?download_id=8014&sdm_process_download=1','Zimbabwe',true,'Zimbabwe','ZW','en','monthly','verified','ZW',1,false,'government_regulator',true,'Official Medicines Control Authority medicinal cannabis licence renewal circular.','health_authority',now(),'online'),
('Cyprus Ministry of Health Pharmaceutical Services — Office of Medicinal Cannabis','https://www.moh.gov.cy/moh/phs/phs.nsf/cannabis_en/cannabis_en','Cyprus',true,'Cyprus','CY','en','monthly','verified','CY',1,false,'government_regulator',true,'Official Pharmaceutical Services Office of Medicinal Cannabis.','drug_control_authority',now(),'online'),
('Chile ISP — cannabis import authorization procedure','https://www.ispch.cl/pregunta-frecuente/p-20/','Chile',true,'Chile','CL','es','monthly','verified','CL',1,false,'government_regulator',true,'Official Instituto de Salud Pública cannabis import authorization procedure.','health_authority',now(),'online')
on conflict (source_url) do update set
  source_name=excluded.source_name,
  jurisdiction=excluded.jurisdiction,
  is_active=true,
  country=excluded.country,
  iso=excluded.iso,
  language=excluded.language,
  crawl_cadence=excluded.crawl_cadence,
  relevance_status='verified',
  jurisdiction_code=excluded.jurisdiction_code,
  tier=1,
  requires_auth=false,
  source_type='government_regulator',
  crawl_allowed=true,
  verification_notes=excluded.verification_notes,
  regulator_class=excluded.regulator_class,
  next_crawl_at=least(coalesce(public.source_registry.next_crawl_at,now()),now()),
  network_status=case when public.source_registry.network_status='quarantined' then 'degraded' else coalesce(public.source_registry.network_status,'online') end,
  updated_at=now();