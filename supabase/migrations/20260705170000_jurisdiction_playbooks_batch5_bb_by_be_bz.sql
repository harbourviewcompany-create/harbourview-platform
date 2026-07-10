-- Research batch 5 of jurisdiction_playbooks: Barbados, Belarus, Belgium, Belize.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('BMCLA — Barbados Medicinal Cannabis Licensing Authority (official)', 'https://www.bmcla.bb/', 'Barbados', 'BB', 'Caribbean', 1, 'html_snapshot', 'monthly', 'regulator_official', 'Official regulator: licensing structure, dispensing rules, National Drug Formulary'),
  ('MJBizDaily — Barbados medical cannabis law clears final hurdle', 'https://mjbizdaily.com/barbados-medical-cannabis-law-clears-final-hurdle-in-parliament/', 'Barbados', 'BB', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', '2019 Act passage detail, ownership/residency requirements, tier structure'),
  ('Wikipedia — Cannabis in Belarus', 'https://en.wikipedia.org/wiki/Cannabis_in_Belarus', 'Belarus', 'BY', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', '2016 industrial hemp ban, prohibition scope'),
  ('Leafwell — Is Marijuana Legal in Belarus', 'https://leafwell.com/blog/is-marijuana-legal-in-belarus', 'Belarus', 'BY', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Documented 2021 foreign-cardholder arrest case, penalty structure'),
  ('FAMHP — Medicines and products based on cannabis or CBD (official)', 'https://www.famhp.be/en/human_use/particular_products/specially_reglemented_substances/narcotics_psychotropics/frequently', 'Belgium', 'BE', 'Europe', 1, 'html_snapshot', 'monthly', 'regulator_official', 'Official regulator: Sativex/Epidyolex status, CBD compounding rules'),
  ('CMS Expert Guides — Cannabis law and legislation in Belgium', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/belgium', 'Belgium', 'BE', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law firm guide: magistral preparation THC exposure limits'),
  ('Cannabis Europa — Is cannabis legal in Belgium 2026 business guide', 'https://cannabis-europa.com/insights/is-cannabis-legal-in-belgium-a-2026-guide-for-businesses/', 'Belgium', 'BE', 'Europe', 2, 'html_snapshot', 'quarterly', 'trade_press', 'Social clubs grey zone, hemp permit regional authority structure'),
  ('Wikipedia — Cannabis in Belize', 'https://en.wikipedia.org/wiki/Cannabis_in_Belize', 'Belize', 'BZ', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', '2017 decriminalization amendment, 2022 legalization bill history'),
  ('DrugLawReform.info — Belize country profile', 'https://druglawreform.info/en/country-information/caribbean/belize.html', 'Belize', 'BZ', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'ngo_policy_tracker', 'Original 2017 Senate/Governor General assent detail')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'License categories tiered by scale: Tier 1 cultivation under 1 acre up to Tier 3 over 5 acres; application/renewal fees and compliance costs vary by tier and category (cultivation, processing, import/export, laboratory, retail distributor). Sacramental Rastafarian cultivation/use is exempt from commercial licensing fees.',
  legal_framework_summary = 'Recreational cannabis remains illegal, though small possession (up to 14 grams) is treated as a $200 fixed fine payable within 30 days rather than criminal prosecution. Medical use was legalized in November 2019 through the Medicinal Cannabis Industry Act (regulations following in 2020), establishing the Barbados Medicinal Cannabis Licensing Authority (BMCLA) to regulate cultivation, processing, dispensing, and export under an eight-category licensing structure covering microgrowers, importers, exporters, laboratories, and retail "therapeutic facility" distributors. A companion Sacramental Cannabis Act permits registered Rastafarians to cultivate and use cannabis as a religious sacrament. Five cannabis-based medicines are approved on the National Drug Formulary, dispensable only via prescription through a pharmacy or licensed therapeutic facility, capped at a 30-day supply per fill. The first licensed dispensary, Island Therapeutics Inc., opened in June 2025.',
  steps = '[{"step":"Apply online via BMCLA portal","detail":"Submit application through the official BMCLA portal selecting a license category (cultivation Tier 1-3, processing, import/export, laboratory, retail distributor, etc.)"},{"step":"Meet ownership/residency requirements","detail":"License holders must be Barbadian citizens, permanent residents, hold immigrant/investor status, or be a CARICOM member-state citizen"},{"step":"Comply with tiered cultivation limits","detail":"Tier 1 cultivation licenses are capped under 1 acre, Tier 2 covers 1-5 acres, Tier 3 allows over 5 acres"},{"step":"Retail via therapeutic facility license","detail":"A Retail Distributor License permits establishing a therapeutic facility where patients receive and consume prescribed medicinal cannabis on-site under professional supervision"}]'::jsonb,
  key_regulators = '["Barbados Medicinal Cannabis Licensing Authority (BMCLA)","Medicinal Cannabis Licensing Board","Ministry of Health and Wellness","Barbados Drug Service"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming recreational use is legal because a medical licensing regime exists — recreational cannabis remains illegal, with only small possession decriminalized to a fixed fine',
    'Assuming any foreign entity can hold a license — ownership is restricted to Barbadian citizens/residents/investors or CARICOM nationals',
    'Confusing the Sacramental Cannabis Act''s religious exemption with general legalization — it applies specifically to registered Rastafarian practitioners'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the official BMCLA regulator site plus independent trade press and Wikipedia',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.bmcla.bb/')
WHERE country_iso2 = 'BB';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'All cannabis use, possession, cultivation, and sale — for recreational or medical purposes — are illegal in Belarus, among the strictest drug regimes in Europe, with no distinction made between cannabis, hemp, and other narcotics under the Criminal Code. On December 31, 2016, Belarus extended its ban to cover cultivation of industrial hemp with THC content below 0.2%, closing off even the low-THC pathway available in most of Europe. Penalties are severe and draw little distinction between simple possession and trafficking, ranging from 5 to 25 years imprisonment; even small personal-use amounts have led to multi-year sentences, including a documented case of a foreign medical-cannabis-card holder arrested for carrying 2.5 grams. CBD is equally illegal, and as a non-EU state Belarus is not bound by the 2020 EU Court ruling that CBD is not a narcotic.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Internal Affairs of Belarus","State Border Committee"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming industrial hemp is a viable low-THC entry point — Belarus banned even sub-0.2% THC hemp cultivation in 2016, closing a pathway open in most of Europe',
    'Assuming a foreign medical cannabis card provides any protection — a documented 2021 case saw a foreign cardholder arrested and facing years in prison for a small personal quantity',
    'Assuming EU CBD rulings apply — Belarus is not an EU member and is not bound by the 2020 EU Court of Justice decision on CBD'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and legal-analysis sources, including a specific documented enforcement case',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Belarus')
WHERE country_iso2 = 'BY';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Hemp cultivation requires a permit from the competent regional authority (Flanders/Wallonia/Brussels), modest cost. CBD magistral-preparation supply is restricted to a single FAMHP-authorized domestic supplier of pharmaceutical-grade CBD powder — a high barrier for that specific channel. Full pharmaceutical marketing authorization (as for Sativex/Epidyolex) is a major EMA/FAMHP undertaking.',
  legal_framework_summary = 'Recreational cannabis remains illegal under the 1921 Narcotics Act and a 2017 Royal Decree, but since a 2005 prosecutorial directive (revised 2015), adult possession of up to 3 grams or one cultivated plant without aggravating circumstances (public use, minors present, disturbance) is treated as the lowest police/prosecution priority — an administrative tolerance policy, not formal decriminalization or legalization; a police report is still filed and forwarded to the prosecutor. Medical cannabis access is tightly restricted to two EU-authorized pharmaceutical products — Sativex (a THC:CBD spray for MS spasticity) and Epidyolex (CBD, for severe epilepsy, though not currently marketed in Belgium) — dispensed only via hospital/public pharmacy on specialist prescription; whole-plant flower is not a dispensable medical format. Industrial hemp cultivation is legal under regional permit for EU Common Catalogue varieties at or below 0.3% THC, and CBD for external/cosmetic use is legal, but ingestible CBD (oils, edibles, food supplements) falls under EU Novel Food rules and remains commercially restricted; only one company is FAMHP-authorized to supply pharmaceutical-grade CBD powder for pharmacist compounding. Cannabis social clubs operate in a long-standing legal grey area — never formally recognized, occasionally subject to police closure, but often tolerated in practice.',
  steps = '[{"step":"Hemp/CBD cultivation route","detail":"Obtain a cultivation permit from the competent regional authority (Flanders, Wallonia, or Brussels) for EU Common Catalogue varieties at or below 0.3% THC"},{"step":"Medical/pharma route","detail":"Engage FAMHP for marketing authorization of any new cannabis-based medicine, or partner with the single FAMHP-authorized domestic CBD powder supplier for magistral pharmacy compounding"},{"step":"CBD retail route","detail":"Market CBD strictly for external/cosmetic use, or navigate EU Novel Food authorization for any ingestible CBD product"}]'::jsonb,
  key_regulators = '["Federal Agency for Medicines and Health Products (FAMHP/AFMPS/FAGG)","Federal Public Service Economy","Federal Agency for the Safety of the Food Chain (AFSCA/FAVV)","Regional authorities (Flanders/Wallonia/Brussels) for hemp cultivation permits","Police / College of Prosecutors General (tolerance-policy enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Mistaking the prosecution-priority tolerance policy for formal decriminalization or legalization — it is administrative discretion only, varies by district/officer, and a police report is still filed',
    'Assuming dried cannabis flower can be prescribed or imported for medical use — a 2015 Royal Decree makes flower non-dispensable in Belgium, so even valid foreign prescriptions for flower are not recognized for import',
    'Assuming any CBD product can be sold as a food/supplement — ingestible CBD falls under strict EU Novel Food authorization, distinct from the more permissive external-use/cosmetic category'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across the official FAMHP site, a law firm expert guide (CMS), trade-press business analysis, and multiple independent legal/travel guides',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.famhp.be/en/human_use/particular_products/specially_reglemented_substances/narcotics_psychotropics/frequently')
WHERE country_iso2 = 'BE';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'No cost for personal decriminalized possession. The stalled 2022 Cannabis and Industrial Hemp Control and Licensing Bill would have created an eight-category commercial license structure, but there is no operative commercial licensing regime as of 2026.',
  legal_framework_summary = 'The Misuse of Drugs (Amendment) Act, 2017 decriminalized possession of up to 10 grams of cannabis for adults on private premises with the property owner''s consent, and separately decriminalized smoking on private premises, but buying, selling, cultivating, importing, exporting, and public use all remain illegal, with importation treated as trafficking regardless of quantity. A more ambitious Cannabis and Industrial Hemp Control and Licensing Bill passed both houses of the National Assembly in 2022, proposing eight license types for a full commercial supply chain, but a planned public referendum was cancelled over cost concerns and the bill has stalled in the legislature since, with no further progress as of 2026. A local October 2025 referendum on Caye Caulker specifically rejected supporting cannabis legalization (roughly 79% "No"), though this vote has no effect on national law. There is no medical cannabis program, and Belize does not recognize foreign medical cannabis cards or prescriptions for import purposes.',
  steps = '[{"step":"Personal-use route","detail":"Adults may possess up to 10g and consume on private premises with the property owner''s consent; no license required"},{"step":"Await commercial framework","detail":"The 2022 Cannabis and Industrial Hemp Control and Licensing Bill remains stalled with no operative licensing pathway; monitor Ministry of New Growth Industries statements for revival"}]'::jsonb,
  key_regulators = '["Ministry of New Growth Industries (assessing legalization prospects)","Belize Police Department","Belize Customs and Excise Department"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalized private possession extends to commercial activity — buying, selling, cultivating, importing, and exporting all remain illegal with no operative license regime',
    'Assuming the stalled 2022 legalization bill is close to passage — it has been stalled since a 2022 referendum cancellation with no confirmed new timeline as of 2026',
    'Bringing any cannabis product, including CBD, across the border — Belize Customs treats importation as a trafficking offense regardless of amount or product type'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across Wikipedia, multiple independent 2026 travel-law guides, and a specialized drug-policy reform tracker citing the original 2017 legislative assent',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Belize')
WHERE country_iso2 = 'BZ';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BB','BY','BE','BZ');
