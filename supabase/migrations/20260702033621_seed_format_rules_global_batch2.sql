insert into public.pathway_format_rules
  (pathway_id, format_id, status, thc_limit, cbd_limit, conditions, notes, verification, last_verified_at)
select p.id, f.id, v.status::public.reg_rule_status, v.thc, v.cbd, v.cond::jsonb, v.notes, v.ver::public.reg_verification_status,
       case when v.ver='verified' then now() else null end
from (values
-- CANADA
('ca-adult-use','dried_flower','permitted',null,null,'{"possession":"30g public equivalent"}',null,'needs_review'),
('ca-adult-use','extracts_concentrates','permitted','1000 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','edibles','permitted','10 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','beverages','permitted','10 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','vape_products','permitted',null,null,'{"note":"some provinces restrict"}',null,'needs_review'),
('ca-adult-use','topicals','permitted','1000 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','capsules','permitted','10 mg THC per unit (ingested extract)',null,'{}',null,'needs_review'),
('ca-adult-use','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('ca-adult-use','seeds_plants','permitted',null,null,'{"home_grow":"4 plants/household; MB/QC restrict"}',null,'needs_review'),
('ca-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('ca-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('ca-medical','seeds_plants','permitted',null,null,'{"personal_designated_production":true}',null,'needs_review'),
('ca-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','needs_review'),
-- UNITED STATES
('us-state-programs','dried_flower','restricted',null,null,'{"varies_by_state":true}','Permitted in most program states; subnational matrix pending','needs_review'),
('us-state-programs','vape_products','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','edibles','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','beverages','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','extracts_concentrates','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','topicals','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-hemp','dried_flower','permitted','<=0.3% delta-9 THC dry weight',null,'{}','Hemp flower; state restrictions vary','needs_review'),
('us-hemp','oral_oil','unregulated',null,null,'{}','FDA has not authorized CBD in foods/supplements; enforcement discretion','needs_review'),
('us-hemp','edibles','unregulated',null,null,'{"intoxicating_hemp":"contested state-by-state"}',null,'needs_review'),
('us-hemp','vape_products','unregulated',null,null,'{}',null,'needs_review'),
('us-fda-registered','oral_oil','permitted',null,null,'{}','Epidiolex (CBD oral solution)','needs_review'),
('us-fda-registered','capsules','permitted',null,null,'{}','Marinol/Syndros (dronabinol), Cesamet (nabilone)','needs_review'),
-- NETHERLANDS
('nl-omc','dried_flower','permitted',null,null,'{"varieties":"standardized Bedrocan range"}',null,'needs_review'),
('nl-omc','oral_oil','permitted',null,null,'{"prepared_by":"pharmacy (e.g. Transvaal)"}',null,'needs_review'),
('nl-omc','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('nl-omc','bulk_api_raw','permitted',null,null,'{"role":"major pharmaceutical flower exporter"}',null,'needs_review'),
('nl-experiment','dried_flower','permitted',null,null,'{"scope":"regulated-chain product only in 10 participating municipalities since Apr 2025"}',null,'verified'),
('nl-experiment','extracts_concentrates','permitted',null,null,'{"product":"hash within regulated chain"}',null,'needs_review'),
('nl-experiment','edibles','restricted',null,null,'{}','Traditional edibles tolerance narrow; not part of regulated-chain assortment','needs_review'),
-- SWITZERLAND
('ch-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','oromucosal_spray','permitted',null,null,'{}','Sativex registered','needs_review'),
('ch-pilot-trials','dried_flower','permitted',null,null,'{"scope":"enrolled participants"}',null,'verified'),
('ch-pilot-trials','extracts_concentrates','restricted',null,null,'{"scope":"pilot assortment varies"}',null,'needs_review'),
('ch-pilot-trials','edibles','restricted',null,null,'{"scope":"pilot assortment varies"}',null,'needs_review'),
('ch-low-thc','dried_flower','permitted','<1% THC',null,'{"smokables":"tobacco-substitute rules"}',null,'needs_review'),
('ch-low-thc','oral_oil','permitted','<1% THC',null,'{}',null,'needs_review'),
('ch-low-thc','topicals','permitted',null,null,'{}',null,'needs_review'),
-- THAILAND
('th-controlled-herb','dried_flower','permitted',null,null,'{"prescription":"PT33, max 30 days","supply":"licensed dispensaries with on-site practitioner (Jan 2026 rules)","import":"prohibited","public_smoking":"prohibited"}','Domestic supply only; ~7,300 of 18,400 shops closed under stricter licensing by Feb 2026','verified'),
('th-narcotic-extracts','extracts_concentrates','restricted','>0.2% THC = Category 5 narcotic',null,'{"licensees":"registered medical facilities, pharmacies, herbal shops"}','Ministerial Regulation B.E. 2569 effective 26 Apr 2026','verified'),
('th-narcotic-extracts','oral_oil','restricted','>0.2% THC formulations narcotics-licensed',null,'{}','Hospital/clinic formulations','verified'),
('th-cbd-consumer','oral_oil','permitted','<0.2% THC',null,'{}','Sold without prescription at licensed retailers','verified'),
('th-cbd-consumer','topicals','permitted','<0.2% THC',null,'{}',null,'verified'),
('th-cbd-consumer','edibles','restricted',null,null,'{}','Infused products face tightened scrutiny post-2025 reforms','needs_review'),
-- FRANCE
('fr-permanent','oral_oil','permitted',null,null,'{}','Extract/oil-based launch','verified'),
('fr-permanent','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('fr-permanent','capsules','permitted',null,null,'{}',null,'needs_review'),
('fr-permanent','dried_flower','prohibited',null,null,'{}','Framework launching without flower (experiment-era vaporized flower not carried over)','verified'),
('fr-registered','oral_oil','permitted',null,null,'{}','Epidyolex','needs_review'),
-- SPAIN
('es-rd903','magistral_preparations','permitted',null,null,'{"dispensing":"hospital pharmacies only"}',null,'verified'),
('es-rd903','extracts_concentrates','permitted',null,null,'{"form":"standardized extracts as compounding base"}',null,'verified'),
('es-rd903','oral_oil','permitted',null,null,'{}','Formulated magistral preparations','needs_review'),
('es-rd903','dried_flower','prohibited',null,null,'{}','No flower dispensing under RD 903/2025','verified'),
('es-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','needs_review'),
('es-registered','oral_oil','permitted',null,null,'{}','Epidyolex','needs_review'),
('es-social-clubs','dried_flower','unregulated',null,null,'{}','Club model without national statute','verified'),
('es-social-clubs','extracts_concentrates','unregulated',null,null,'{}',null,'needs_review'),
-- CZECHIA
('cz-medical','dried_flower','permitted',null,null,'{"reimbursement":"90% up to monthly cap"}',null,'needs_review'),
('cz-medical','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('cz-medical','oral_oil','permitted',null,null,'{}','Compounded preparations','needs_review'),
('cz-adult-use','seeds_plants','permitted',null,null,'{"limit":"3 plants per adult 21+"}',null,'verified'),
('cz-adult-use','dried_flower','permitted',null,null,'{"possession":"100g home / 25g public"}','No commercial retail; sales deferred','verified'),
('cz-adult-use','extracts_concentrates','prohibited',null,null,'{}','Home concentrate production outside personal framework','needs_review'),
-- ISRAEL
('il-imca','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('il-imca','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('il-imca','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('il-imca','vape_products','restricted',null,null,'{}',null,'needs_review'),
-- PORTUGAL
('pt-infarmed','dried_flower','permitted',null,null,'{}','Authorized flower preparations (e.g. Tilray)','needs_review'),
('pt-infarmed','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('pt-infarmed','bulk_api_raw','permitted',null,null,'{"role":"major EU-GMP cultivation/export hub supplying DE and FR"}',null,'needs_review'),
-- ITALY
('it-magistral','dried_flower','permitted',null,null,'{"dispensing":"magistral"}','FM-2 state production + imports','needs_review'),
('it-magistral','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('it-magistral','oral_oil','permitted',null,null,'{"form":"galenic preparations"}',null,'needs_review'),
('it-magistral','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('it-cannabis-light','dried_flower','suspended','<=0.5% THC historically',null,'{}','Apr 2025 security decree criminalises hemp-inflorescence trade; litigation ongoing','needs_review'),
-- DENMARK
('dk-scheme','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('dk-scheme','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('dk-scheme','capsules','permitted',null,null,'{}',null,'needs_review'),
('dk-scheme','bulk_api_raw','permitted',null,null,'{"role":"significant EU-GMP producer/exporter"}',null,'needs_review'),
-- NEW ZEALAND
('nz-scheme','dried_flower','permitted',null,null,'{"standard":"verified against minimum quality standard"}',null,'needs_review'),
('nz-scheme','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('nz-scheme','capsules','permitted',null,null,'{}',null,'needs_review'),
-- IRELAND
('ie-mcap','oral_oil','permitted',null,null,'{"products":"MCAP named list"}',null,'needs_review'),
('ie-mcap','dried_flower','restricted',null,null,'{"route":"ministerial licence only"}',null,'needs_review'),
-- ARGENTINA
('ar-reprocann','seeds_plants','permitted',null,null,'{"registry":"REPROCANN self/network cultivation"}',null,'needs_review'),
('ar-reprocann','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('ar-reprocann','oral_oil','permitted',null,null,'{}','Pharmacy magistral and registered products','needs_review'),
('ar-reprocann','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
-- COLOMBIA
('co-framework','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
('co-framework','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('co-framework','oral_oil','permitted',null,null,'{"domestic":"magistral dispensing"}',null,'needs_review'),
('co-framework','dried_flower','permitted',null,null,'{"export":"permitted since Decree 811/2021"}',null,'needs_review'),
-- URUGUAY
('uy-adult-use','dried_flower','permitted',null,null,'{"retail":"pharmacies, registered residents"}',null,'needs_review'),
('uy-adult-use','seeds_plants','permitted',null,null,'{"home_grow":"6 plants; clubs 45 members"}',null,'needs_review'),
('uy-adult-use','edibles','prohibited',null,null,'{}',null,'needs_review'),
('uy-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
-- MEXICO
('mx-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('mx-medical','capsules','permitted',null,null,'{}',null,'needs_review'),
('mx-medical','topicals','permitted',null,null,'{}',null,'needs_review'),
('mx-medical','dried_flower','prohibited',null,null,'{}','Pharmaceutical-derivative regime; herbal dispensing not established','needs_review'),
-- JAPAN
('jp-pharma','oral_oil','proposed',null,null,'{}','Approval pathway open post-Dec 2024; Epidiolex-type products in registration track','needs_review'),
('jp-cbd','oral_oil','permitted','Residual THC ppm caps by product class',null,'{}',null,'needs_review'),
('jp-cbd','edibles','restricted','Residual THC ppm caps',null,'{}',null,'needs_review'),
-- UKRAINE
('ua-medical','oral_oil','permitted',null,null,'{}','Registered-medicine emphasis in initial rollout','needs_review'),
('ua-medical','dried_flower','unknown',null,null,'{}','Format scope of implementing acts to be confirmed','needs_review'),
-- MALTA
('mt-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('mt-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('mt-chra','seeds_plants','permitted',null,null,'{"home_grow":"4 plants"}',null,'needs_review'),
('mt-chra','dried_flower','permitted',null,null,'{"possession":"7g","supply":"CHRAs to members"}',null,'needs_review'),
-- LUXEMBOURG
('lu-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('lu-medical','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('lu-home-grow','seeds_plants','permitted',null,null,'{"home_grow":"4 plants per household"}',null,'needs_review'),
-- GREECE
('gr-medical','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
('gr-medical','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('gr-medical','dried_flower','permitted',null,null,'{"orientation":"export-focused"}',null,'needs_review'),
('gr-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
-- NORTH MACEDONIA
('mk-framework','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('mk-framework','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('mk-framework','dried_flower','permitted',null,null,'{"scope":"export (2023 amendments)"}',null,'needs_review'),
('mk-framework','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
-- MOROCCO
('ma-anrac','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
('ma-anrac','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('ma-anrac','topicals','permitted',null,null,'{"sector":"cosmetics"}',null,'needs_review'),
('ma-anrac','dried_flower','restricted',null,null,'{}',null,'needs_review')
) as v(pslug, fslug, status, thc, cbd, cond, notes, ver)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug;