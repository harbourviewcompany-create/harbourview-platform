-- ============================================================================
-- Enriched content for verified priority markets: structured pathway detail,
-- format-level quantity/packaging detail, primary-source citations, and
-- scheduled-change records. Enrichment does not alter verification status.
-- ============================================================================

-- ---- Pathway-level structured detail ----
update public.regulatory_pathways set
  qualifying_conditions = v.conds, prescriber_scope = v.presc, min_age = v.age, reimbursement = v.reimb
from (values
  ('br-rdc-1015', array[]::text[], 'any legally qualified prescriber; high-THC historically palliative/terminal', null::int, 'none'),
  ('br-rdc-660', array[]::text[], 'any legally qualified prescriber (import authorisation)', null, 'none'),
  ('gb-cbpm-specials', array['chronic pain','treatment-resistant epilepsy','MS spasticity','chemotherapy-induced nausea'], 'specialist on the GMC Specialist Register may initiate', null, 'conditional'),
  ('de-medcang', array[]::text[], 'any physician (narcotic-free e-prescription)', null, 'full'),
  ('de-cang-pillar1', array[]::text[], 'n/a (non-medical)', 18, 'n/a'),
  ('au-sas-ap', array[]::text[], 'any registered doctor or NP via SAS-B or Authorised Prescriber', null, 'none'),
  ('pl-raw-material', array['chronic pain','MS','drug-resistant epilepsy','chemotherapy nausea'], 'any licensed physician; narcotic (pink) prescription', null, 'none'),
  ('za-sahpra-s21', array['cancer','epilepsy','multiple sclerosis','palliative care'], 'doctor applies per patient via SAHPRA Section 21', null, 'none'),
  ('za-cbd-exemption', array[]::text[], 'OTC below exemption thresholds', null, 'n/a'),
  ('za-private-use', array[]::text[], 'n/a (private adult use)', 18, 'n/a'),
  ('th-controlled-herb', array['insomnia','chronic pain','migraine','Parkinson disease','appetite loss'], 'licensed Thai practitioner issues PT33 (max 30 days)', 20, 'none'),
  ('fr-permanent', array['neuropathic pain','treatment-resistant epilepsy','MS spasticity','oncology supportive care','palliative care'], 'hospital/specialist-initiated', null, 'full'),
  ('es-rd903', array['MS spasticity','chemotherapy-induced nausea','treatment-resistant epilepsy','oncologic/chronic pain','palliative care'], 'hospital specialist prescribing', null, 'full'),
  ('cz-adult-use', array[]::text[], 'n/a (non-medical)', 21, 'n/a'),
  ('cz-medical', array['chronic pain','MS','oncology','neurological indications'], 'specialist prescriber; e-prescription', null, 'partial')
) as v(slug, conds, presc, age, reimb)
where regulatory_pathways.slug = v.slug;

-- ---- Rule-level (format-specific) quantity / packaging detail ----
update public.pathway_format_rules as r set
  possession_limit = v.poss, unit_dose_limit = v.udl, packaging_labelling = v.pkg
from (values
  ('de-cang-pillar1','dried_flower','25g in public / 50g at home', null, null),
  ('de-cang-pillar1','seeds_plants','3 live plants per adult', null, null),
  ('cz-adult-use','dried_flower','25g in public / 100g at home', null, null),
  ('cz-adult-use','seeds_plants','3 live plants per adult', null, null),
  ('za-private-use','dried_flower','private personal amounts per CfPPA schedules', null, null),
  ('za-private-use','seeds_plants','private cultivation per CfPPA schedules', null, null),
  ('th-controlled-herb','dried_flower','30g supply with valid PT33', null, 'neutral packaging; ID + e-prescription verification; no public smoking'),
  ('ca-adult-use','edibles', null, '10 mg THC per package', 'plain child-resistant packaging; excise stamp; standardised cannabis symbol'),
  ('ca-adult-use','beverages', null, '10 mg THC per package', 'plain child-resistant packaging; excise stamp'),
  ('ca-adult-use','extracts_concentrates', null, '1000 mg THC per package', 'plain child-resistant packaging; excise stamp'),
  ('ca-adult-use','dried_flower','30g public possession equivalent', null, 'plain child-resistant packaging; excise stamp'),
  ('de-medcang','dried_flower', null, null, 'pharmacy dispensing label; narcotic documentation'),
  ('au-sas-ap','edibles', null, null, 'TGO 93 labelling; child-resistant packaging')
) as v(pslug, fslug, poss, udl, pkg)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug
where r.pathway_id = p.id and r.format_id = f.id;

-- ---- Primary-source citations (pathway-level) ----
insert into public.regulatory_citations (entity_type, entity_id, instrument, article, source_type, citation_url, published_date, excerpt)
select 'pathway', p.id, v.instrument, v.article, v.stype::public.reg_source_type, v.url, v.pub::date, v.excerpt
from (values
  ('br-rdc-1015','RDC 1.015/2026 (Anvisa)','full instrument','gazette',null,'2026-01-28','new framework replacing RDC 327; effective 4 May 2026'),
  ('br-rdc-1015','RDC 1.013/2026 (Anvisa)','domestic cultivation <=0.3% THC','regulator',null,'2026-01-28','permits domestic medical cultivation for manufacture'),
  ('br-rdc-660','RDC 660/2022 (Anvisa)','individual patient import','gazette',null,'2022-03-30','import of cannabis-derived products by patients on prescription'),
  ('br-rdc-1014-sandbox','RDC 1.014/2026 (Anvisa)','patient-association sandbox','regulator',null,'2026-01-28','sandbox for non-profit patient-association cultivation/distribution'),
  ('gb-cbpm-specials','Misuse of Drugs (Amendment) (No.2) Regulations 2018 (SI 2018/1055)','Schedule 2','statute',null,'2018-11-01','rescheduled cannabis-based products for medicinal use'),
  ('gb-licensed','MHRA marketing authorisations','Sativex / Epidyolex / Nabilone','regulator',null,null,'licensed cannabinoid medicines'),
  ('de-medcang','Medizinal-Cannabisgesetz (MedCanG)','full act','statute',null,'2024-04-01','medical cannabis removed from narcotics list; prescription medicine'),
  ('de-cang-pillar1','Konsumcannabisgesetz (KCanG / CanG)','Pillar 1','statute',null,'2024-04-01','possession, home cultivation and cultivation associations'),
  ('au-sas-ap','Therapeutic Goods Act 1989 s19 + TGO 93','SAS-B / Authorised Prescriber','statute','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub',null,'unapproved medicinal cannabis access and quality standard'),
  ('pl-raw-material','Act on Counteracting Drug Addiction (2017 amendment)','pharmaceutical raw material','statute',null,'2017-11-01','herbal cannabis as pharmacy raw material on prescription'),
  ('za-sahpra-s21','Medicines and Related Substances Act','Section 21','statute',null,null,'named-patient access to unregistered medicines'),
  ('za-cbd-exemption','Government Notice 586, GG 43347','CBD Schedule exclusion','gazette','https://www.sahpra.org.za/thc-and-cbd-information-page/','2020-05-22','low-dose CBD exclusion and processed-product thresholds'),
  ('za-private-use','Minister of Justice v Prince (CCT 108/17) + Cannabis for Private Purposes Act 7 of 2024','private use','court',null,'2024-05-29','private adult possession and cultivation decriminalised'),
  ('za-sahpra-22c','Medicines Act s22C(1)(b) + Plant Improvement Act 2018','cultivation/manufacture licence','statute',null,'2025-12-01','licensed medicinal cultivation and hemp <=2% THC'),
  ('th-controlled-herb','Notification on Controlled Herbs (Cannabis) B.E. 2568','controlled herb','gazette',null,'2025-06-25','cannabis flower reclassified as controlled herb; prescription required'),
  ('th-narcotic-extracts','Ministerial Regulation on Category 5 Narcotics (Cannabis/Hemp Extracts) B.E. 2569','extracts >0.2% THC','gazette',null,'2026-03-26','high-THC extracts remain Category 5 narcotics'),
  ('fr-permanent','LFSS 2024 generalisation + ANSM framework','permanent framework','statute',null,'2026-04-01','experiment to permanent medical framework; oil/extract formats'),
  ('es-rd903','Real Decreto 903/2025','hospital magistral','gazette',null,'2025-10-01','standardised cannabis magistral preparations via hospital pharmacies'),
  ('cz-adult-use','Adult-use amendment (2025)','personal framework','statute',null,'2026-01-01','home cultivation and personal possession for adults 21+'),
  ('cz-medical','Act 50/2013 + SUKL/SAKL regime','medical programme','statute',null,'2013-04-01','flower and magistral preparations on e-prescription')
) as v(slug, instrument, article, stype, url, pub, excerpt)
join public.regulatory_pathways p on p.slug = v.slug;

-- ---- Primary-source citations (rule-level, key format rules) ----
insert into public.regulatory_citations (entity_type, entity_id, instrument, article, source_type, citation_url, published_date, excerpt)
select 'rule', r.id, v.instrument, v.article, v.stype::public.reg_source_type, v.url, v.pub::date, v.excerpt
from (values
  ('th-controlled-herb','dried_flower','Notification on Controlled Herbs (Cannabis) B.E. 2568','flower supply conditions','gazette',null,'2025-06-25','flower only via licensed dispensary against PT33'),
  ('fr-permanent','dried_flower','ANSM permanent framework','flower exclusion','regulator',null,'2026-04-01','framework launches without flower'),
  ('es-rd903','dried_flower','Real Decreto 903/2025','no flower dispensing','gazette',null,'2025-10-01','extract-based magistral only; no flower'),
  ('de-medcang','dried_flower','Medizinal-Cannabisgesetz (MedCanG)','flower prescribing','statute',null,'2024-04-01','flower prescribable as standard medicine'),
  ('za-cbd-exemption','oral_oil','Government Notice 586, GG 43347','low-dose CBD','gazette','https://www.sahpra.org.za/thc-and-cbd-information-page/','2020-05-22','<=20 mg/day CBD OTC below scheduling')
) as v(pslug, fslug, instrument, article, stype, url, pub, excerpt)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug
join public.pathway_format_rules r on r.pathway_id = p.id and r.format_id = f.id;

-- ---- Scheduled / pending regulatory changes ----
insert into public.regulatory_pending_changes
  (entity_type, entity_id, change_type, current_value, expected_value, expected_effective_date, expected_note, confidence, source_url)
select 'pathway', p.id, v.ctype, v.cur, v.exp, v.eff::date, v.note, v.conf::public.reg_change_confidence, v.url
from (values
  ('de-medcang','prescriber','telemedicine follow-ups broadly available; pharmacy mail-order permitted','in-person first prescription; telemed follow-ups limited; mail-order dispensing ban (courier exempt)',null::text,'Bundestag first reading 18 Dec 2025; final vote expected H1 2026','draft',null::text),
  ('br-rdc-660','status','individual patient import broadly available','revised/restricted import framework',null,'Anvisa flagged Jan 2026 as needing urgent revision; separate normative act expected','announced',null),
  ('za-private-use','new_format','private use only; no commercial retail','commercial framework (Commercialisation Policy + consolidating Cannabis Bill)',null,'Cabinet submission Apr 2026; Bill to Parliament ~mid-2027','announced',null),
  ('th-controlled-herb','status','cannabis flower as controlled herb (lighter penalties)','possible return to Category 5 narcotic',null,'government stated intent; timeline unannounced','announced',null),
  ('au-sas-ap','prescriber','telehealth prescribing and advertising widely available','tightened telehealth prescribing, advertising and product-quality controls',null,'TGA 2026-27 top compliance priority','announced',null),
  ('it-cannabis-light','status','hemp inflorescence trade historically tolerated (<=0.5% THC)','criminalised under Apr 2025 security decree',null,'decree in force Apr 2025; under legal challenge','enacted_pending_force',null)
) as v(slug, ctype, cur, exp, eff, note, conf, url)
join public.regulatory_pathways p on p.slug = v.slug;