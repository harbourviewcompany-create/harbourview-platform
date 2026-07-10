-- Batch 10: jurisdiction_playbooks for UA, GH, PK, SI
-- market_metrics for UA, PK, SI (GH omitted -- no sourced quantitative figure found)
-- country_education_overlay: DEFERRED -- see chat response for rationale

WITH src_ua AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('CMS Expert Guides -- Cannabis Law and Legislation in Ukraine',
          'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine',
          'legal_analysis', 2, 'Ukraine', 'UA', 'html_snapshot', 'active', true, true)
  RETURNING id
),
src_gh AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('Ghana Ministry of the Interior -- Cannabis Regulatory Programme Launch',
          'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/',
          'government_official', 1, 'Ghana', 'GH', 'html_snapshot', 'active', true, true)
  RETURNING id
),
src_pk AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('LegalClarity -- Is Weed Legal in Pakistan? A Look at Current Laws',
          'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/',
          'legal_analysis', 2, 'Pakistan', 'PK', 'html_snapshot', 'active', true, true)
  RETURNING id
),
src_si AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('CMS Expert Guides -- Cannabis Law and Legislation in Slovenia',
          'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/slovenia',
          'legal_analysis', 2, 'Slovenia', 'SI', 'html_snapshot', 'active', true, true)
  RETURNING id
),
pb AS (
  INSERT INTO jurisdiction_playbooks
    (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
     legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed)
  VALUES
  ('UA', 'Ukraine', 'high', 18,
   'No standardized public fee schedule identified; costs are dominated by mandatory facility security (24-hour police-accessible video surveillance), GACP compliance, and annual quota allocation rather than a fixed licence fee',
   'Ukraine legalized medical, industrial, and research cannabis under Law No. 3528-IX, signed February 15 2024 and effective August 16 2024, which removed cannabis resin, extracts, and tinctures from the list of dangerous substances. All activity (cultivation, processing, compounding, import/export) requires a narcotics-handling licence plus an annual government quota; until 2028 the import quota for cannabis plants/substances is zero except for scientific and specific medicinal uses, and domestic cultivation licensing conditions were still being finalized through 2025-2026, so the market currently runs on imported finished product. The Ministry of Health published a list of roughly 20 qualifying conditions (multiple sclerosis, neuropathy, chemotherapy complications, PTSD-adjacent indications, childhood epilepsy, among others) in September 2024, and the first legal prescriptions were dispensed on June 11 2026 in Vinnytsia -- nearly two years after the law took effect -- to a multiple sclerosis patient and a war-injury amputee, via electronic prescription only. For 2026, the Cabinet of Ministers approved the first-ever production/storage quota for THC-based medical cannabis substances (592,068 grams storage), a Resolution No. 1772 milestone. Only three products (all Curaleaf full-spectrum oils) were on the State Register as of January 2025. Every plant, batch, and package must carry a unique electronic identifier, and national police must have free facility access. Recreational cultivation/possession/sale remains criminal; administrative liability attaches to cultivation of up to 10 plants without intent to sell, and possession without intent to sell is decriminalized only up to 5 grams. Industrial hemp cultivation was also substantially eased under the same law but remains quota- and licence-gated, with reclassification of industrial hemp into medical cannabis prohibited.',
   '[{"step":"Confirm licensing prerequisite","detail":"Any medical-cannabis-related activity (cultivation, processing, compounding, import/export, R&D) requires a narcotics-handling licence before any quota application can be filed"},{"step":"Apply for annual quota allocation","detail":"Quotas are set annually by the Cabinet of Ministers based on Ministry of Health proposals; the import quota for cannabis plants/substances is zero until 2028 except for defined scientific/medicinal exceptions, so new entrants should plan around import-only supply in the near term"},{"step":"Meet facility and traceability requirements","detail":"Cultivation facilities must operate in closed-soil conditions with round-the-clock, police-accessible video surveillance; every plant, batch, and package requires a unique electronic identifier logged same-day in the national traceability system"},{"step":"Register products before dispensing","detail":"Finished products must be registered in the State Register of Medicinal Products (only 3 products registered as of Jan 2025, all Curaleaf); pharmacy-compounded (magistral) product is a separate authorised pathway using registered APIs"},{"step":"Monitor domestic cultivation timeline","detail":"Domestic production is not expected before 2028 per industry sources; near-term commercial entry is realistically import/distribution-focused, not cultivation-focused"}]'::jsonb,
   '["Ministry of Health of Ukraine -- programme policy and qualifying-conditions list","State Service of Ukraine on Medicines and Drugs Control -- licensing and quota enforcement","Ministry of Agrarian Policy -- cultivation-side coordination","National Police -- mandatory facility access and security compliance"]'::jsonb,
   ARRAY[
     'Assuming legalization in 2024 means an open market today -- it took until June 2026 for the first patient prescriptions to be dispensed, and domestic cultivation is not expected before 2028',
     'Treating this as a cultivation opportunity in the near term -- the zero import-quota exception structure and absence of finalized domestic cultivation licensing conditions mean the realistic near-term entry point is import/distribution of registered finished product, not growing',
     'Ignoring the traceability and security capital requirements (24-hour police-accessible surveillance, per-plant electronic identifiers) when estimating cost -- these are mandatory, not optional, and are not captured in any published flat fee'
   ],
   'published',
   'high -- corroborated across CMS Expert Guides, Ukraine''s Ministry of Health official releases (moz.gov.ua), multiple June 2026 industry-press reports on the first dispensed prescriptions, and the January 2026 CMS coverage of the 2026 THC quota resolution; timeline-to-first-patient (June 2026) is a hard confirmed data point, not an estimate',
   (SELECT id FROM src_ua), CURRENT_DATE),

  ('GH', 'Ghana', 'moderate', 9,
   'No standardized public fee schedule identified for NACOC''s 11 licence categories in available sources; budget for licensing, compliance, and security infrastructure typical of a regulated agricultural/pharmaceutical hybrid programme',
   'Ghana operates a licensed, low-THC-only cannabis framework -- not recreational legalization. The legal foundation is the Narcotics Control Commission (Amendment) Act, 2023 (Act 1100) and the Narcotics Control Commission (Cultivation and Management of Cannabis) Regulations, 2023 (L.I. 2475), which followed a 2023 parliamentary amendment after an earlier version of the law was struck down by Ghana''s Supreme Court for lacking full parliamentary debate. The Cannabis Regulatory Programme was formally launched by the Minister for the Interior in February 2026 in Accra, opening licensing for cultivation, processing, distribution, and export of cannabis varieties containing no more than 0.3% THC on a dry-weight basis, for medicinal and industrial purposes only. NACOC (Narcotics Control Commission) administers 11 licence categories; applicants must generally be 18+ and Ghanaian citizens or permanent residents (corporate applicants have equivalent local-ownership requirements), though by April 2026 the Ghana Investment Promotion Centre was actively courting diaspora Ghanaians to invest given the licence-holder citizenship/residency requirement. Recreational cannabis remains fully illegal; officials and NACOC have been explicit and repeated in messaging that this is not adult-use legalization. Simple possession for personal use was changed from a prison sentence to a fine under the underlying 2023 reform, but cultivation, sale, and distribution outside the licensed low-THC framework remain criminal.',
   '[{"step":"Confirm eligibility","detail":"Licence applicants must generally be 18+ and Ghanaian citizens or permanent residents (or meet equivalent corporate ownership tests); diaspora Ghanaians are an explicit target investor group per Ghana Investment Promotion Centre outreach"},{"step":"Select the correct licence category","detail":"NACOC lists 11 distinct licence categories spanning cultivation, processing, distribution, and export -- confirm which category matches the intended activity before applying"},{"step":"Verify THC compliance capability","detail":"All licensed cultivation must stay at or below 0.3% THC dry-weight; this is a hard regulatory ceiling enforced under L.I. 2475"},{"step":"Apply through NACOC","detail":"Licensing is administered by the Narcotics Control Commission under Act 1100 and L.I. 2475; the programme formally opened for applications in February 2026"}]'::jsonb,
   '["Narcotics Control Commission (NACOC) -- primary licensing and compliance authority","Ministry of the Interior -- programme policy owner and public-facing launch authority"]'::jsonb,
   ARRAY[
     'Confusing this with recreational/adult-use legalization -- NACOC and the Ministry of the Interior have repeatedly and explicitly stated this is not a recreational programme',
     'Assuming CBD, hemp-labelled, or wellness products can be freely imported or carried -- Ghana''s framework is licensing-based for domestic cultivation/processing, and travelers/importers should get explicit confirmation before assuming any hemp-derived product is exempt at the border',
     'Treating the February 2026 launch as proof of a mature, liquid market -- this is a newly opened licensing window; operational track record and approval-timeline data are not yet established'
   ],
   'published',
   'medium-high -- the legal framework (Act 1100, L.I. 2475) and February 2026 launch are consistently confirmed across the Ministry of the Interior''s own release, NACOC''s official site, and multiple trade-press sources; specific fee schedules and real-world approval timelines were not found and should be confirmed directly with NACOC before any commercial commitment',
   (SELECT id FROM src_gh), CURRENT_DATE),

  ('PK', 'Pakistan', 'very_high', 24,
   'No standardized public fee schedule identified; sources conflict on whether a functioning licensing authority is even operational (see confidence note), which is itself a material cost/timeline risk for market-entry planning',
   'Pakistan''s cannabis framework is a legal patchwork with materially conflicting reporting on its current operational status. The Control of Narcotic Substances Act 1997 makes cultivation, possession, sale, and distribution of cannabis illegal, punishable by up to 7 years imprisonment and fines; a September 1 2020 federal Cabinet decision approved industrial hemp cultivation and cannabis extracts for industrial and medical use under permit, with a 0.3% THC dry-weight ceiling. Some sources (LegalClarity, cannabisregulations.ai) report that a Cannabis Control and Regulatory Authority (CCRA) was established in February 2024 under a Cannabis Control and Regulatory Authority Act 2024, issuing 5-year licences with regular inspections, and that DRAP (Drug Regulatory Authority of Pakistan) separately governs any cannabis-derived product carrying therapeutic claims. Other sources (Cannigma) state industrial hemp cultivation remains illegal in practice because no implementing regulatory framework was ever finalized, and a 2021-approved Rs. 1.95 billion government development-fund allocation for medical cannabis/hemp infrastructure (greenhouses, an analytical lab, a central oversight authority) reflects planning rather than an operating industry. This is a genuine, unresolved source conflict, not a reporting error on either side -- it likely reflects a regulatory body that exists on paper with limited real-world licensing throughput. Recreational and medical cannabis for personal use remain illegal regardless of which account is accurate; CBD products are explicitly treated as illegal outside the DRAP-registered pharmaceutical channel.',
   '[{"step":"Resolve the CCRA operational-status question directly with counsel","detail":"Before any capital commitment, confirm directly with Pakistani legal counsel and DRAP/CCRA whether the Cannabis Control and Regulatory Authority is actively issuing licences -- public secondary sources conflict on this point as of this review"},{"step":"If operational, apply through CCRA","detail":"Per sources reporting an active authority, CCRA licences cover cultivation, extraction, refining, manufacturing, and sale of cannabis derivatives for medical/industrial use, issued for 5-year terms with a 0.3% THC dry-weight ceiling"},{"step":"Route any therapeutic-claim product through DRAP","detail":"Cannabis-derived products marketed with medical/therapeutic claims require DRAP Act 2012 registration regardless of CCRA cultivation licensing status"},{"step":"Do not assume personal-use or import allowances","detail":"No published personal-import exemption exists for CBD or cannabis products; Pakistan Customs and the Anti-Narcotics Force treat undocumented cannabinoid shipments as controlled-substance matters"}]'::jsonb,
   '["Cannabis Control and Regulatory Authority (CCRA) -- cultivation/processing/manufacturing licensing per some sources; operational status disputed","Drug Regulatory Authority of Pakistan (DRAP) -- pharmaceutical/therapeutic-claim product registration","Ministry of National Health Services, Regulations and Coordination -- DRAP''s parent ministry","Anti-Narcotics Force (ANF) and Pakistan Customs -- import/border enforcement"]'::jsonb,
   ARRAY[
     'Treating any single source as authoritative on whether Pakistan''s licensing authority is functionally operational -- 2025-2026 sources directly conflict on this, and this entry should be re-verified with local counsel before use in a GO decision',
     'Assuming the 2020 Cabinet decision or a 2024 CCRA Act translates into an accessible commercial pathway today -- multiple sources describe multi-year regulatory delays and an unfinished implementing framework as of the most recent available reporting',
     'Assuming CBD or hemp-labelled products are personal-use-exempt for import -- no such exemption is published; DRAP registration is required for any therapeutic claim'
   ],
   'published',
   'low-medium -- this entry is a conflicting-sources case: reputable secondary sources materially disagree on whether Pakistan''s cannabis regulatory authority is operationally issuing licences; treat all market-entry conclusions here as provisional pending direct confirmation with Pakistani counsel',
   (SELECT id FROM src_pk), CURRENT_DATE),

  ('SI', 'Slovenia', 'moderate', 12,
   'No standardized public fee schedule identified for the new open licensing system; Slovenia''s model is explicitly designed so any commercial operator meeting JAZMP/Ministry of Health criteria can obtain a licence, but published per-licence cost figures were not found',
   'Slovenia first legalized medical cannabis in a limited form in March 2017 by reclassifying cannabinoids from Schedule I to Schedule II, but in practice access via magistral prescription/import exemption through JAZMP (the Public Agency of the Republic of Slovenia for Medicinal Products and Medical Devices) was rarely used. On July 15 2025, Slovenia''s National Assembly passed a substantially more progressive Medical Cannabis Measure (50-29, with 2 abstentions), described by industry commentary as one of the most progressive medical cannabis frameworks in Europe on both commercial-operator and patient-access dimensions; it introduces an open licensing system in which any commercial operator meeting JAZMP/Ministry of Health criteria can obtain a licence, removes cannabis (plant, resin, extracts) and THC from the prohibited-substances list within a regulated medical/scientific framework, and allows prescription via ordinary MD/DMD/veterinary scripts rather than special narcotic prescription protocols, with patients issued a "cannabis card" at the pharmacy. Slovenia''s medical cannabis market was projected (per a mid-2025 industry estimate) to grow roughly 4% annually and exceed EUR 55 million by 2029. Separately, recreational personal possession remains decriminalized rather than legal: it is a misdemeanor (not a criminal offence) carrying a fine, with sources giving somewhat different fine ranges (EUR 36-179 per Wikipedia''s citation of the underlying statute; up to approximately EUR 200 per a secondary consumer-facing source) -- treat the statutory EUR 36-179 range as more authoritative pending direct verification. Industrial hemp is separately permitted for food/industrial use, but sources disagree on the THC ceiling: CMS Expert Guides cites 0.2%, while a Slovenian pharmaceutical-compliance source (Farmakem) cites 0.3% -- this discrepancy is unresolved in available sources and should be confirmed against the current Regulation on the Classification of Illicit Drugs before relying on either figure.',
   '[{"step":"Confirm licensing criteria with JAZMP","detail":"The July 2025 Medical Cannabis Measure created an open licensing system administered with JAZMP and Ministry of Health oversight; any commercial operator meeting the published criteria can apply -- confirm current criteria directly, as implementing detail was still developing at time of review"},{"step":"Distinguish medical from industrial-hemp pathways","detail":"Medical cannabis (flower, extracts, magistral preparations) is licensed under the 2025 Measure; industrial hemp (Cannabis sativa L., low-THC) is a separate Ministry of Agriculture, Forestry and Food permit track for food/industrial use -- do not conflate the two application pathways"},{"step":"Plan for pharmacy-based distribution","detail":"Patient access runs through pharmacies via ordinary medical/veterinary prescription (no special narcotic protocol required post-reform), with a patient cannabis card issued at dispensing"},{"step":"Verify the current industrial-hemp THC ceiling before cultivation planning","detail":"Available sources conflict (0.2% vs 0.3% dry-weight) -- confirm against the current Regulation on the Classification of Illicit Drugs (Official Gazette RS No. 45/14, 14/17, 64/19) before finalizing any cultivation compliance plan"}]'::jsonb,
   '["JAZMP (Javna agencija Republike Slovenije za zdravila in medicinske pripomocke) -- medical cannabis licensing and pharmaceutical oversight","Ministry of Health -- medical cannabis policy and prescription framework","Ministry of Agriculture, Forestry and Food -- industrial hemp cultivation permits"]'::jsonb,
   ARRAY[
     'Treating Slovenia as a full adult-use/recreational market -- recreational cannabis remains illegal, only decriminalized to a misdemeanor fine for personal possession; the 2025 reform is specifically a medical-cannabis and open-licensing-for-commercial-operators measure',
     'Citing a single industrial-hemp THC ceiling as settled -- available sources give both 0.2% and 0.3% dry-weight figures; confirm against the current regulation text before any cultivation compliance decision',
     'Assuming the EUR 55M-by-2029 market-size figure is a verified market-research forecast -- it traces to a single industry-press estimate published around the law''s passage, not an independently published market-research methodology'
   ],
   'published',
   'medium-high -- the 2025 Medical Cannabis Measure passage, its open-licensing structure, and the decriminalization status are corroborated across Wikipedia, CMS Expert Guides, Prohibition Partners, and multiple 2025-2026 industry-press reports; two specific numeric details (industrial hemp THC ceiling, decriminalization fine range) show unresolved source conflicts and are flagged rather than silently resolved',
   (SELECT id FROM src_si), CURRENT_DATE)
  ON CONFLICT (country_iso2) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    difficulty = EXCLUDED.difficulty,
    typical_timeline_months = EXCLUDED.typical_timeline_months,
    estimated_cost_range = EXCLUDED.estimated_cost_range,
    legal_framework_summary = EXCLUDED.legal_framework_summary,
    steps = EXCLUDED.steps,
    key_regulators = EXCLUDED.key_regulators,
    common_pitfalls = EXCLUDED.common_pitfalls,
    status = EXCLUDED.status,
    confidence_label = EXCLUDED.confidence_label,
    source_id = EXCLUDED.source_id,
    last_reviewed = EXCLUDED.last_reviewed,
    updated_at = now()
  RETURNING country_iso2
),
mm AS (
  INSERT INTO market_metrics
    (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
  VALUES
  ('UA', 'estimated_eligible_patient_population', 6000000, 'people', '2026-01-01', '2026-12-31', 'point_in_time', 'estimated', 'medium',
   'Ukraine Ministry of Health (via Prohibition Partners European Medical Cannabis Legislation Map)',
   'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/ukraine/', '2026-02-27',
   'Ministry of Health estimate of patients who could benefit from medical cannabis given war-related PTSD, chronic pain, and palliative-care needs; not a count of enrolled/prescribed patients -- only 3 patients had received legal prescriptions as of the June 2026 first-dispensing milestone'),
  ('UA', 'annual_thc_production_storage_quota_2026', 592068, 'grams', '2026-01-01', '2026-12-31', 'annual', 'observed', 'high',
   'CMS Law Now -- Ukraine Approves 2026 Quotas for Controlled Substances',
   'https://cms-lawnow.com/en/ealerts/2026/01/ukraine-approves-2026-quotas-for-controlled-substances-including-medical-cannabis-thc', '2026-01-14',
   'First-ever government-set storage quota for THC-based medical cannabis substances under Cabinet of Ministers Resolution No. 1772; covers storage only, not a production or sales volume figure'),
  ('PK', 'government_capital_allocation_medical_hemp_infrastructure', 1950000000, 'PKR', '2021-12-01', '2021-12-31', 'point_in_time', 'observed', 'medium',
   'InternationalCBC (via Propakistani reporting) -- Pakistan Is Allocating Funds For Medical Cannabis And Hemp Production',
   'https://internationalcbc.com/pakistan-is-allocating-funds-for-medical-cannabis-and-hemp-production/', '2025-06-11',
   'Departmental Development Working Party approval (Dec 2021) for greenhouses, a national analytical lab, and a central regulatory authority; this is a capital-planning allocation, not evidence of an operating commercial market, and predates the disputed 2024 CCRA establishment referenced in the jurisdiction playbook'),
  ('SI', 'projected_medical_cannabis_market_value_2029', 55000000, 'EUR', '2025-01-01', '2029-12-31', 'annual', 'forecast', 'low',
   'International Cannabis Business Conference (via internationalcbc.com) -- Slovenia''s National Assembly Approves Historic Medical Cannabis Measure',
   'https://internationalcbc.com/slovenias-national-assembly-approves-historic-medical-cannabis-measure/', '2025-07-15',
   'Single industry-press forecast figure published at the time of the law''s passage; no independently verifiable market-research methodology was found, so treat as directional rather than authoritative'),
  ('SI', 'projected_medical_cannabis_market_cagr', 4, 'percent', '2025-01-01', '2029-12-31', 'annual', 'forecast', 'low',
   'International Cannabis Business Conference (via internationalcbc.com) -- Slovenia''s National Assembly Approves Historic Medical Cannabis Measure',
   'https://internationalcbc.com/slovenias-national-assembly-approves-historic-medical-cannabis-measure/', '2025-07-15',
   'Same single-source forecast as projected_medical_cannabis_market_value_2029; provided together, not independently corroborated')
  RETURNING country_iso2
)
SELECT (SELECT count(*) FROM pb) AS playbooks_inserted, (SELECT count(*) FROM mm) AS metrics_inserted;
