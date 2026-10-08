
-- RECOVERY BEGIN 20260712130917_batch_13_playbooks_metrics_overlay_sm_vc_lb_ma.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260712130917.
--
-- Rewriting this file cannot affect production: 20260712130917 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Batch 13: jurisdiction_playbooks + market_metrics + country_education_overlay for SM, VC, LB, MA
-- Real, sourced content closing all three content_coverage_queue gaps for these four countries.
-- SM: near-total prohibition; only lawful pathway is a single pharmaceutical (Sativex) for 2 conditions;
--     cultivation illegal even for that purpose; 2019 recreational-regulation push reversed March 2020.
-- VC: unique "commercial export industry first" model -- genuinely operational 5-tier MCA licensing
--     since 2019, but essentially zero tourist/retail access; personal possession decrim is a side track.
-- LB: first Arab country to legalize (2020) but implementing Authority only stood up summer 2025 --
--     a 5-year gap -- and as of early 2026 still had no functioning legal harvest, let alone sales.
-- MA: most operationally mature of the four -- 2021 law, ANRAC-run cooperative licensing, 2,700+ ha
--     legally cultivated by 2024, 5,765 active 2025-season licenses, real EU exports, still a small
--     fraction of the ~50,000-70,000 ha illicit baseline.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('Wikipedia -- Cannabis in San Marino',
   'https://en.wikipedia.org/wiki/Cannabis_in_San_Marino',
   'reference', 1, 'San Marino', 'SM', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '1956 statute ambiguity, 2016 istanza d''Arengo and Sativex program, 2021 Italy research partnership'),
  ('Leafwell -- Is Marijuana Legal in San Marino?',
   'https://leafwell.com/blog/is-marijuana-legal-in-san-marino',
   'legal_analysis', 2, 'San Marino', 'SM', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '3-8 year narcotics penalty range; qualifying conditions detail for Sativex access'),
  ('Cannigma -- Cannabis laws in San Marino',
   'https://cannigma.com/cannabis-news/marijuana-laws-san-marino/',
   'legal_analysis', 2, 'San Marino', 'SM', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '2019 recreational-regulation proposal (30g/4 plants) and March 2020 Parliamentary reversal'),
  ('CannaConnection -- Legal status of cannabis in San Marino',
   'https://www.cannaconnection.com/blog/14717-legal-status-san-marino',
   'legal_analysis', 2, 'San Marino', 'SM', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Confirms no anticipated near-term law changes'),

  ('Medicinal Cannabis Authority -- Government of Saint Vincent and the Grenadines',
   'https://mca.vc/',
   'government_official', 1, 'Saint Vincent and the Grenadines', 'VC', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'Official regulator: licensing, cultivation, manufacturing, lab testing, pharmacies, patient access mandate'),
  ('CannaCarib -- Cannabis in St. Vincent and the Grenadines',
   'https://www.cannacarib.net/saint-vincent-and-the-grenadines/',
   'industry_press', 2, 'Saint Vincent and the Grenadines', 'VC', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'Last verified 17-May-2026: confirms no tourist-facing retail exists and foreign medical cards have no legal effect'),
  ('MJBizDaily -- First medicinal cannabis licenses awarded in Saint Vincent and the Grenadines',
   'https://mjbizdaily.com/first-medicinal-cannabis-licensces-granted-in-st-vincent-and-the-grenadines/',
   'news', 2, 'Saint Vincent and the Grenadines', 'VC', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   'First-licensee detail, Class A-E fee schedule, Acres Agricultural 300-acre license'),
  ('GrowerIQ -- How to Get a Cannabis License in St. Vincent & Grenadines',
   'https://groweriq.ca/how-to-get-a-cannabis-cultivation-licensing-in-st-vincent-grenadines/',
   'industry_press', 2, 'Saint Vincent and the Grenadines', 'VC', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   '224 licenses approved by MCA in 2021 alone; qualifying-conditions list'),
  ('Wikipedia -- Cannabis in Saint Vincent and the Grenadines',
   'https://en.wikipedia.org/wiki/Cannabis_in_Saint_Vincent_and_the_Grenadines',
   'reference', 2, 'Saint Vincent and the Grenadines', 'VC', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   'December 2018 dual-Act passage; July 2018 decriminalization amendment detail'),
  ('Leafwell -- Is Marijuana Legal in Saint Vincent and The Grenadines?',
   'https://leafwell.com/blog/is-marijuana-legal-in-saint-vincent-and-the-grenadines',
   'legal_analysis', 2, 'Saint Vincent and the Grenadines', 'VC', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   'Cannabis Cultivation (Amnesty) Act detail; regional decriminalization comparison'),

  ('CMS Expert Guides -- Cannabis law and legislation in Lebanon',
   'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/lebanon',
   'legal_analysis', 1, 'Lebanon', 'LB', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Article 3 licensing detail; transparency and tracking principle; IP/patent treatment'),
  ('Herb -- How to Buy Weed in Lebanon: The Bekaa Valley, Hash History & the 2026 Legal Status',
   'https://herb.co/city-guides/buy-weed-lebanon',
   'industry_press', 2, 'Lebanon', 'LB', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Early-2026 confirmation: Authority established summer 2025, no legal purchase channel, harvest timeline too tight for 2026'),
  ('The Beiruter -- The green revolution: Lebanon''s bid to legalize what it long outlawed',
   'https://www.thebeiruter.com/article/the-green-revolution-lebanon%E2%80%99s-bid-to-legalize-what-it-long-outlawed/380',
   'news', 2, 'Lebanon', 'LB', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Names Authority head Dani Fayyad; 450-hectare Hermel foothills illicit-cultivation figure'),
  ('Wikipedia -- Cannabis in Lebanon',
   'https://en.wikipedia.org/wiki/Cannabis_in_Lebanon',
   'reference', 2, 'Lebanon', 'LB', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Historical cultivation/prohibition cycle: 1926 ban, civil-war-era boom, 1992 re-ban, 2001-2002 resurgence'),
  ('CannaReporter -- Legalization of medicinal cannabis in Lebanon: between politics and reality',
   'https://cannareporter.eu/en/2026/01/26/Legalization-of-medicinal-cannabis-in-Lebanon:-between-politics-and-reality./',
   'industry_press', 2, 'Lebanon', 'LB', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Nine license-category detail; McKinsey USD 1 billion revenue projection; geographic zone designation'),

  ('Global Initiative Against Transnational Organized Crime -- Morocco''s cannabis policy aims high',
   'https://globalinitiative.net/analysis/moroccos-cannabis-policy-informal-economy-ocindex/',
   'legal_analysis', 1, 'Morocco', 'MA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   '2024 hectare/tonnage/license figures; royal pardon detail; illicit-vs-legal market scale comparison'),
  ('Moroccan Cannabis Alliance -- What Law 13-21 Really Means',
   'https://www.moroccancannabisalliance.com/2025/06/25/what-law-13-21-really-means/',
   'industry_press', 2, 'Morocco', 'MA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Cooperative-only licensing structure; three authorized Rif provinces; GACP/GMP compliance framing'),
  ('MJBizDaily -- Morocco''s medical cannabis industry continues development',
   'https://www.mmjdaily.com/article/9847103/morocco-s-medical-cannabis-industry-continues-development/',
   'news', 2, 'Morocco', 'MA', 'Africa', 'html_snapshot', 'monthly', 'active', true, true,
   '2025-season license count (5,765) and 2025 dried-cannabis production tonnage, per ANRAC Director General'),
  ('ScienceDirect -- Policy reform and the international future of Moroccan Cannabis production',
   'https://www.sciencedirect.com/science/article/pii/S0955395925001410',
   'legal_analysis', 1, 'Morocco', 'MA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Peer-reviewed: no national THC ceiling adopted; landrace/kif genetics and CBD-yield rationale')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.jurisdiction_playbooks
  (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
   legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed, last_verified_at)
VALUES
(
  'SM', 'San Marino', 'very_high', 0,
  'Not applicable -- no cultivation, processing, or retail sale of cannabis is permitted in any form; the only lawful medical access is a single pharmaceutical product (Sativex) provided at no cost to qualifying patients through the state health system',
  'San Marino''s cannabis law rests on a 1956 narcotics statute that predates modern cannabis-specific scheduling and does not explicitly name cannabis, though subsequent decrees are understood to bring it within the country''s narcotics-control regime; because the law does not clearly distinguish "soft" from "hard" drugs, penalties for illicit possession, use, import, export, or trafficking of narcotic substances generally -- three to eight years'' imprisonment plus a fine -- apply without a specific, lighter cannabis carve-out. Since 2016, following a citizen-initiated istanza d''Arengo calling for medical cannabis legalization that the government approved, San Marino has provided the pharmaceutical product Sativex (a cannabinoid mouth spray) free of charge through its health system to patients suffering pain from multiple sclerosis or spinal cord/bone-marrow conditions; this remains the country''s only clearly defined lawful cannabis pathway, and cultivation of cannabis is illegal even for this purpose -- Sativex is imported as a finished pharmaceutical product, not grown domestically. In 2021, San Marino entered a partnership with neighboring Italy to research, develop, and share information on medical cannabis products, devices, pharmaceutical raw materials, clinical trials, and continuing education, though this has not yet produced a broader domestic medical program. A more ambitious 2019 Parliamentary initiative would have regulated recreational use (permitting possession of up to 30 grams and four plants for home cultivation), but Parliament backtracked in March 2020, opting instead to wait and follow the lead of its sole neighbor, Italy, which has not itself legalized recreational cannabis. CBD has not been specifically legalized or regulated: because San Marino is not an EU member, it is not bound by the EU Court of Justice''s ruling that CBD is not a narcotic, and a specialized compliance guide cites Law No. 78 of 1994 and oversight by the Istituto per la Sicurezza Sociale (ISS, San Marino''s health/pharmaceutical authority, which models its practices closely on Italy''s AIFA) as controlling any cannabis-derived substance; no general retail authorization for CBD wellness products currently exists, notwithstanding informal availability. Despite the illegal status, cannabis use is reportedly not uncommon in San Marino, and the country''s small size and porous border with Italy make enforcement and product sourcing practically intertwined with its much larger neighbor.',
  '[]'::jsonb,
  '["Istituto per la Sicurezza Sociale (ISS) -- San Marino''s health and social security authority, oversees pharmaceutical dispensing including Sativex", "Consiglio Grande e Generale (Parliament) -- retains sole authority to legislate any expansion of the current framework", "Segreteria di Stato per la Sanita (State Secretariat for Health) -- health policy oversight"]'::jsonb,
  ARRAY[
    'Assuming the 2016 medical cannabis approval created a general medical cannabis program -- in practice it has produced access to a single pharmaceutical product (Sativex) for two narrow conditions, not a cultivation, dispensing, or prescribing framework comparable to larger medical cannabis markets',
    'Treating the 2019 recreational-regulation proposal as a live legislative process -- Parliament explicitly reversed course in March 2020 and tied any future move to following Italy''s lead, and Italy has not legalized recreational cannabis',
    'Assuming San Marino''s non-EU status and small size create a meaningful regulatory arbitrage opportunity -- the country''s cannabis policy is closely tethered to and dependent on Italy''s, including its 2021 formal research partnership, and it enforces its own narcotics law with real custodial penalties'
  ],
  'published',
  'medium-high -- the 1956 statute''s ambiguity, the 2016 Sativex program, and the 2019-2020 recreational reversal are consistently corroborated across Wikipedia, Leafwell, Cannigma and CannaConnection; the specific Law No. 78/1994 citation for CBD/narcotics control comes from a single specialized compliance-guide source and should be verified against San Marino''s official legal gazette directly; overall regulatory detail for this microstate is thin across all available sources',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_San_Marino'),
  CURRENT_DATE, now()
),
(
  'VC', 'Saint Vincent and the Grenadines', 'moderate', 9,
  'Cultivation license fees are tiered by class and cultivation acreage, ranging from EC$100,000 (roughly $37,000) for the smallest Class A license to EC$2.67 million (roughly $1 million) for the largest Class E license, plus separate non-refundable application fees and differing renewal periods; fee schedules differ for Vincentian vs. non-Vincentian applicants; no publicly quantified standard processing-time figure was identified, so applicants should confirm current timelines directly with the MCA',
  'Saint Vincent and the Grenadines (SVG) took a distinctive two-track approach to cannabis reform, prioritizing a commercial export industry over broad personal legalization. On December 11, 2018, Parliament unanimously passed two companion laws after eleven months of work led by then-Minister of Agriculture Saboto Caesar: the Medicinal Cannabis Industry Act, which established a full commercial licensing framework, and the Cannabis Cultivation (Amnesty) Act, which allows pre-existing "traditional cultivators" -- long-standing illicit growers -- to transition into the legal industry. A separate reform, the Drugs (Prevention of Misuse) Amendment Act (passed July 25, 2018), decriminalized personal possession of up to 56 grams (two ounces) of cannabis: rather than incarceration, it is now only a ticketable offense carrying a fine of up to $500 plus optional educational, counseling, or rehabilitative measures, and it separately permits home consumption and consumption at Rastafarian places of worship without punishment. The Medicinal Cannabis Authority (MCA) is the operational regulator, issuing five tiers of cultivation licenses (Class A through E, priced from EC$100,000 up to EC$2.67 million, differentiated by acreage and by Vincentian vs. non-Vincentian applicant status) as well as manufacturing, dispensing, laboratory testing, and import/export licenses; the enabling law was drafted with its implementing regulations built directly into the statute, which SVG officials say significantly shortened the path from passage to active licensing. The first commercial licenses were awarded within roughly three years of passage: ten licenses went to companies with board members from Canada, the Caribbean, Europe and Africa (including a 300-acre license to Acres Agricultural (SVG), a subsidiary of Canada''s Acres Agricultural), and 24 went to local individual farmers or farming cooperatives representing over 100 cultivators in aggregate; the MCA approved 224 licenses in 2021 alone, with further licenses granted in the years since. Product must meet recognized international standards including GMP, GACP, Fair Trade, GlobalGAP, EurepGAP, USDA/FDA, and organic certification depending on the target market, reflecting the program''s export orientation. Despite this genuinely operational commercial industry, SVG offers essentially no tourist- or general-consumer-facing legal cannabis access: there is no walk-in dispensary model, a foreign medical cannabis card carries no legal effect, and unlicensed possession above the 56-gram decriminalization threshold remains a criminal offense under the Drugs (Prevention of Misuse) Act. Medical patients require a qualifying condition (a list that includes multiple sclerosis, intractable spasticity from spinal cord damage, PTSD, anxiety, depression, sleep disorders, autism, and rheumatoid arthritis, among others) and a physician''s prescription, dispensed only through authorized pharmacies or caregivers, capped at a 30-day supply, with consumption barred in public spaces, vehicles, and licensed daycare residences. SVG is historically the Caribbean''s most prolific cannabis cultivator after Jamaica, and illicit cultivation -- long the country''s most economically significant agricultural product -- continues alongside the new legal industry.',
  '[
    {"step": "Identify the correct cultivation license class for your intended scale before applying", "detail": "Class A through E licenses are priced by acreage from EC$100,000 to EC$2.67 million, with separate fee schedules for Vincentian vs. non-Vincentian applicants"},
    {"step": "Apply through the Medicinal Cannabis Authority (MCA)", "detail": "The MCA centrally administers cultivation, manufacturing, laboratory testing, dispensing, and import/export licensing"},
    {"step": "Build for export-market compliance from the outset", "detail": "Product must meet standards such as GMP, GACP, GlobalGAP, EurepGAP, USDA/FDA, or organic certification depending on the destination market, since the industry is oriented toward pharmaceutical-grade export rather than domestic retail"},
    {"step": "Do not plan around domestic retail or tourist sales", "detail": "There is no walk-in dispensary model in SVG, and the industry''s economics run through licensed export and limited domestic pharmacy dispensing to prescription holders only"},
    {"step": "If already cultivating informally in SVG, evaluate the Cannabis Cultivation (Amnesty) Act pathway", "detail": "It is specifically designed to let traditional/informal cultivators transition into the licensed system"}
  ]'::jsonb,
  '["Medicinal Cannabis Authority (MCA) -- licenses cultivation, manufacturing, laboratory testing, dispensing, and import/export", "Ministry of Agriculture, Forestry, Fisheries and Rural Transformation -- original legislative sponsor and continued policy linkage", "Chief Medical Officer -- customs-level licensing authority for cannabis import/export"]'::jsonb,
  ARRAY[
    'Assuming SVG''s cannabis reform created any form of retail or tourist access -- the entire framework is oriented toward licensed commercial cultivation for pharmaceutical-grade export, and a foreign medical cannabis card has no legal effect on the islands, including in the Grenadines (Bequia, Mustique, Union Island)',
    'Treating the 56-gram personal decriminalization threshold as equivalent to legalization -- it removes incarceration for simple possession under that amount but does not authorize sale, unlicensed cultivation, or public consumption, all of which remain criminal matters',
    'Underestimating the capital requirements at the upper end of the licensing tiers -- the largest cultivation license class (Class E) carries a fee around EC$2.67 million (roughly $1 million), well beyond smallholder economics'
  ],
  'published',
  'high -- the dual 2018 Acts, the MCA''s five-tier licensing structure and fee range, and the 2018 decriminalization threshold are corroborated across the Medicinal Cannabis Authority''s own site, Wikipedia, Leafwell, a specialized Caribbean cannabis-travel guide last verified May 2026, and contemporaneous MJBizDaily reporting on the first licenses; exact current cumulative license counts vary slightly by reporting date given the program''s continued growth and are treated as approximate',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://mca.vc/'),
  CURRENT_DATE, now()
),
(
  'LB', 'Lebanon', 'very_high', 0,
  'Not applicable -- the National Authority for the Regulation of Cannabis Cultivation was only formally established in summer 2025, five years after the enabling law, and as of early 2026 had not enabled a first legal harvest, let alone a commercial sale; no public licensing fee schedule was identified in available sources',
  'Lebanon became the first Arab country to legalize cannabis cultivation for medical and industrial purposes when Parliament passed Law No. 178 on April 21, 2020 (published in the Official Gazette June 4, 2020), amid the country''s severe financial and currency crisis and the COVID-19 pandemic. The law was driven substantially by a McKinsey & Company economic report projecting that a regulated cannabis export industry could generate up to USD 1 billion per year in government revenue for a country then carrying one of the world''s highest sovereign debt burdens. Under Article 3, the law authorizes a Regulatory Authority for Cannabis Cultivation for Medical and Industrial Use to license the cultivation of cannabis seeds and seedlings for products including industrial fiber, cosmetics, oils, extracts, and pharmaceutical/medicinal compounds containing controlled THC and CBD, and establishes a "transparency and tracking principle" under which the Authority monitors the market and controls all import/export activity; industrial (non-psychoactive) hemp cultivation was legalized alongside the medical framework. However, the gap between legislation and functioning implementation has been extraordinary: the Authority was not formally constituted until summer 2025 -- a full five years after the law''s passage -- and only began issuing meaningful guidance and touring farming regions under newly appointed head Dani Fayyad from late 2025. As of early 2026, no legal consumer or patient purchase channel of any kind is operating in Lebanon, and the regulatory authority has itself indicated that the 2026 timeline is too tight to support even a first legal harvest. The Authority''s stated design -- once operational -- includes nine categories of licenses (seeds, cultivation, harvesting, manufacturing, export, among others), designated legal cultivation zones concentrated in the Bekaa Valley and Akkar, and a digital traceability platform intended to prevent diversion of licensed product into the illicit market. Recreational cannabis remains fully illegal for cultivation, trade, and personal use, and is prosecuted as such, notwithstanding widespread private consumption and continued large-scale illicit cultivation -- roughly 450 hectares were reported in the Hermel foothills alone in late 2025, within a Bekaa Valley cultivation tradition that has at times reached tens of thousands of acres and made Lebanon one of the world''s largest hashish sources historically. Cannabis cultivation was first banned in Lebanon in 1926 under the French Mandate, flourished amid the chaos of the 1975-1990 civil war, was re-banned in 1992 under U.S. pressure, and resurged after 2001 as poverty pushed farmers back to the crop -- a cycle of tolerance and crackdown that the 2020 law aimed to finally resolve through regulation rather than either extreme. A 2025 qualitative stakeholder study (political, medical, academic and civil-society representatives) identified the absence of effective, impartial law enforcement and a fully built-out regulatory framework as the central barriers to the law actually functioning as intended. Notably, Lebanon''s neighbor-in-precedent is Morocco, which passed comparable medical/industrial cannabis legislation in 2021 -- a year after Lebanon -- but had a fully licensed, exporting industry operating within three years, a contrast increasingly cited in Lebanese commentary on the slow pace of its own implementation.',
  '[
    {"step": "Confirm the National Authority for the Regulation of Cannabis Cultivation''s current operational status directly before assuming any license category is actually open", "detail": "As of early 2026, the Authority itself indicated the timeline was too tight for even a first legal harvest that year"},
    {"step": "Do not assume Law No. 178/2020''s five-year-old passage reflects current operational reality", "detail": "Track the Authority''s guidance under its current leadership (Dani Fayyad, in place since the Authority''s 2025 formation) for genuinely current status"},
    {"step": "If pursuing cultivation once licensing opens, plan for the designated legal zones", "detail": "The Bekaa Valley and Akkar are the geographic areas identified for authorized cultivation"},
    {"step": "Treat any current cannabis commerce in Lebanon, medical or otherwise, as unlicensed and outside the legal framework", "detail": "No functioning legal purchase channel exists for patients, consumers, or export buyers as of this review"},
    {"step": "Benchmark realistic implementation timelines against Morocco''s comparable 2021 law rather than against Lebanon''s own 2020 passage date", "detail": "Morocco reached a licensed, exporting industry within three years, while Lebanon had not reached first legal harvest five-plus years after passage"}
  ]'::jsonb,
  '["National Authority for the Regulation of Cannabis Cultivation (also referred to as the Cannabis Regulatory Authority) -- sole licensing and oversight body, only formally constituted in summer 2025", "Ministry of Agriculture -- geographic zone designation (Bekaa Valley, Akkar) and farmer engagement", "Ministry of Public Health -- oversight of medicinal/pharmaceutical cannabis products"]'::jsonb,
  ARRAY[
    'Treating Law No. 178/2020''s 2020 passage as evidence of a functioning legal cannabis market today -- the implementing Authority was not even formally established until summer 2025, and as of early 2026 had indicated it could not support a first legal harvest that year',
    'Assuming Lebanon''s cannabis reform trajectory resembles Morocco''s -- despite passing comparable legislation a year later, Morocco reached licensed commercial exports within three years, while Lebanon remains without any functioning legal purchase or harvest channel five-plus years after its law passed',
    'Underestimating the scale of the parallel illicit market the legal framework must eventually compete with or absorb -- large-scale illicit Bekaa Valley cultivation, including an estimated 450 hectares in the Hermel foothills alone in late 2025, continues essentially undisturbed by the still-dormant legal framework'
  ],
  'published',
  'high on the legislative history and the extraordinary implementation gap (corroborated across Herb''s early-2026 reporting, Wikipedia, CMS Expert Guides, a 2025 Lebanese academic stakeholder study, and The Beiruter''s on-the-ground 2026 reporting naming the Authority''s current head); estimates of total illicit cultivation scale vary by source and time period -- a national historical estimate of up to tens of thousands of hectares of Bekaa cultivation versus a specific late-2025 count of roughly 450 hectares in the Hermel foothills alone describe different scopes and are not directly comparable, and should not be conflated',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/lebanon'),
  CURRENT_DATE, now()
),
(
  'MA', 'Morocco', 'moderate', 9,
  'No standardized public application-fee schedule was identified; the primary cost driver is cooperative formation and compliance infrastructure -- land/plot documentation, GACP-compliant cultivation practices, and (for export-oriented operators) GMP-aligned processing and batch-testing capability -- rather than a fixed government licensing fee',
  'Morocco enacted Law 13-21 in June 2021, legalizing the cultivation, transformation, transport, export, and sale of cannabis for medical, pharmaceutical, cosmetic, and industrial purposes while explicitly maintaining prohibition on recreational use. The National Agency for the Regulation of Cannabis-Related Activities (ANRAC), created in 2022 to operationalize the law, functions as the sole gatekeeper across the full lifecycle: cultivation authorization, movement controls, processing approvals, and export permissions, with an increasing emphasis on documented quality systems and auditable chain-of-custody. Distinctively, and unlike most jurisdictions, Morocco chose not to set an overall national THC ceiling defining "hemp" versus "cannabis," a strategic choice that preserves compatibility with the country''s indigenous high-THC "Beldia"/kif landrace genetics and supports higher CBD yields, rather than forcing cultivation toward low-THC European-style hemp cultivars. Only registered farmers organized into ANRAC-licensed cooperatives may legally cultivate, and only within three authorized Rif-region provinces: Al Hoceima, Chefchaouen, and Taounate. Growth has been rapid by regional standards: the first 10 permits were issued in November 2022; by the end of 2024 ANRAC had issued more than 3,300 authorizations (spanning cultivation, processing, seed import, and transport) and certified 7.6 million imported seeds; authorized cultivation area grew from under 300 hectares in 2023 to roughly 2,700 hectares in 2024, producing more than 4,000 tonnes; and for the 2025 season, ANRAC registered 5,765 active licenses, including 5,492 cultivation permits benefiting more than 5,300 farmers, alongside licenses for processing, transport, marketing, export, and seed import -- with reported 2025 dried-cannabis production of nearly 2,000 tonnes, up 10% year-on-year. ANRAC''s Director General has stated that legal therapeutic cannabis products are now available in more than 600 authorized outlets nationwide, and Morocco has begun exporting: a notable 2024 shipment of low-THC cannabis resin to Switzerland fetched EUR 1,400-1,800 per kilogram, and industry compliance coverage describes 2025-2026 as Morocco''s "breakout year" for legal exports, citing 67 ANRAC-approved product authorizations. In a symbolically significant move, King Mohammed VI granted a royal pardon in August 2024 to more than 4,800 people convicted, prosecuted, or wanted in connection with illegal cannabis cultivation, widely read as a reconciliatory gesture toward long-marginalized Rif farming communities. Despite this progress, the legal industry remains a small fraction of Morocco''s total cannabis economy: authorized cultivation of roughly 2,700 hectares in 2024 compares to a total estimated national cannabis cultivation footprint of 50,000-70,000 hectares, and the roughly 3,300-5,765 licenses issued through 2024-2025 compare to an estimated 400,000 or more people directly or indirectly dependent on the illicit trade -- meaning the legal and illicit markets currently coexist rather than the legal market having displaced the informal one. Farmers report continuing friction engaging with licensed processing facilities, and analysts have flagged a genuine risk of regulatory capture, where illicitly grown cannabis is laundered through licensed cooperative channels or licenses are used as cover for continued trafficking. CBD is legal under the same Law 13-21/ANRAC framework for industrial and cosmetic use (food supplements capped under 0.3% THC, cosmetics required to be functionally THC-free), while pharmaceutical CBD products such as Epidiolex fall under separate Ministry of Health oversight; Morocco also restricts imports of seeds or plants from any cannabis variety ANRAC designates a protected "landrace," officially to protect national genetic heritage.',
  '[
    {"step": "Organize or join an ANRAC-recognized cooperative before pursuing cultivation", "detail": "Individual, non-cooperative cultivation is not a licensing pathway under Law 13-21"},
    {"step": "Confirm your intended cultivation site falls within one of the three currently authorized provinces", "detail": "Al Hoceima, Chefchaouen, and Taounate are the only authorized growing regions"},
    {"step": "Build GACP compliance into farm operations from day one, and GMP-aligned processing if targeting EU export", "detail": "Destination markets, especially the EU, increasingly expect GACP-to-GMP continuity with documented batch release and chain-of-custody records"},
    {"step": "Verify seed/planting material sourcing against ANRAC-approved lists", "detail": "Imports of seeds or plants from ANRAC-designated landrace varieties are prohibited to protect indigenous genetics, which affects sourcing strategy for cooperatives working with the native Beldia/kif variety"},
    {"step": "Budget for the gap between licensing and commercial traction", "detail": "Farmers have reported real friction engaging with licensed processing facilities even after obtaining cultivation authorization, so a license alone does not guarantee a buyer"}
  ]'::jsonb,
  '["Agence Nationale de Reglementation des Activites relatives au Cannabis (ANRAC) -- sole authority for licensing, monitoring, and regulating the full cannabis supply chain", "Ministry of Health -- pharmaceutical cannabis and CBD product oversight (e.g. Epidiolex)", "Ministry of Interior, Ministry of Health and Ministry of Agriculture (joint decree authority) -- set applicable THC-related regulatory thresholds by product category"]'::jsonb,
  ARRAY[
    'Assuming Morocco applies a standard low-THC "hemp" ceiling the way most jurisdictions do -- it deliberately declined to set one nationally, which affects how operators from other markets should think about product classification and compliance mapping',
    'Treating ANRAC''s growing licence counts (5,765 for the 2025 season) as evidence the legal market has captured most of Morocco''s cannabis economy -- authorized cultivation remains a small fraction (roughly 2,700-4,000+ hectares) of an estimated 50,000-70,000 hectares under cultivation nationally, with several hundred thousand people still tied to the informal trade',
    'Assuming cooperative licensing alone guarantees a functioning route to market -- farmers have reported real difficulty engaging with licensed processing facilities even after securing cultivation authorization, and export-market access depends on separate GACP/GMP and batch-testing readiness'
  ],
  'published',
  'high -- Law 13-21, ANRAC''s mandate, the three authorized Rif provinces, and the general growth trajectory are corroborated across the Global Initiative''s dedicated analysis, a peer-reviewed ScienceDirect/PubMed study, the Moroccan Cannabis Alliance, and MJBizDaily/industry reporting; specific-year production figures show minor cross-source variance (2025 dried-cannabis tonnage reported by MJBizDaily is notably lower than 2024 raw-cannabis tonnage reported by Global Initiative, likely reflecting different measurement bases -- dried vs. raw weight -- rather than an actual production decline) and are presented as reported rather than reconciled',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://globalinitiative.net/analysis/moroccos-cannabis-policy-informal-economy-ocindex/'),
  CURRENT_DATE, now()
)
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
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO public.market_metrics
  (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('SM', 'narcotics_max_prison_sentence', 8, 'years', '1956-01-01', '2026-12-31', 'point_in_time', 'observed', 'high',
   'Wikipedia -- Cannabis in San Marino', 'https://en.wikipedia.org/wiki/Cannabis_in_San_Marino', '2024-07-16',
   'Maximum term under the undifferentiated narcotics-possession/trafficking penalty range (3-8 years plus a fine); San Marino law does not set a lighter, cannabis-specific penalty'),
  ('SM', 'proposed_recreational_possession_threshold_2019', 30, 'grams', '2019-01-01', '2019-12-31', 'point_in_time', 'observed', 'medium',
   'Cannigma -- Cannabis laws in San Marino', 'https://cannigma.com/cannabis-news/marijuana-laws-san-marino/', '2022-10-14',
   'Threshold proposed in the 2019 citizen-initiative-derived Parliamentary measure; the measure was approved in 2019 but Parliament reversed course in March 2020, so this threshold was never enacted into law'),

  ('VC', 'personal_possession_threshold_2018', 56, 'grams', '2018-07-25', '2018-07-25', 'point_in_time', 'observed', 'high',
   'Wikipedia -- Cannabis in Saint Vincent and the Grenadines',
   'https://en.wikipedia.org/wiki/Cannabis_in_Saint_Vincent_and_the_Grenadines', '2026-04-09',
   'Decriminalized possession ceiling (2 ounces) under the Drugs (Prevention of Misuse) Amendment Act, 2018; above this remains a criminal offense'),
  ('VC', 'cultivation_license_fee_class_e_max', 2670000, 'XCD', '2021-12-01', '2021-12-31', 'point_in_time', 'observed', 'high',
   'MJBizDaily -- First medicinal cannabis licenses awarded in Saint Vincent and the Grenadines',
   'https://mjbizdaily.com/first-medicinal-cannabis-licensces-granted-in-st-vincent-and-the-grenadines/', '2021-12-18',
   'Top-tier (Class E) cultivation license fee, roughly USD 1 million; Class A fees run as low as EC$100,000'),
  ('VC', 'cultivation_licenses_approved_2021', 224, 'licenses', '2021-01-01', '2021-12-31', 'annual', 'observed', 'medium',
   'GrowerIQ -- How to Get a Cannabis License in St. Vincent & Grenadines',
   'https://groweriq.ca/how-to-get-a-cannabis-cultivation-licensing-in-st-vincent-grenadines/', '2025-09-22',
   'Cultivation licenses approved by the Medicinal Cannabis Authority in 2021 alone, per MCA statement'),

  ('LB', 'mckinsey_projected_annual_revenue', 1000000000, 'USD', '2018-01-01', '2018-12-31', 'point_in_time', 'estimated', 'medium',
   'CannaReporter -- Legalization of medicinal cannabis in Lebanon: between politics and reality',
   'https://cannareporter.eu/en/2026/01/26/Legalization-of-medicinal-cannabis-in-Lebanon:-between-politics-and-reality./', '2026-01-26',
   'McKinsey & Company projection underlying the case for Law No. 178/2020; a projection, not a realized figure -- no legal market has yet generated revenue'),
  ('LB', 'years_between_law_and_authority_formation', 5, 'years', '2020-04-21', '2025-06-30', 'point_in_time', 'observed', 'high',
   'Herb -- How to Buy Weed in Lebanon: The 2026 Legal Status', 'https://herb.co/city-guides/buy-weed-lebanon', '2026-03-25',
   'Gap between Law No. 178/2020''s passage and the formal establishment of its implementing Authority in summer 2025'),
  ('LB', 'illicit_cultivation_hermel_foothills_2025', 450, 'hectares', '2025-01-01', '2025-12-31', 'point_in_time', 'observed', 'medium',
   'The Beiruter -- The green revolution: Lebanon''s bid to legalize what it long outlawed',
   'https://www.thebeiruter.com/article/the-green-revolution-lebanon%E2%80%99s-bid-to-legalize-what-it-long-outlawed/380', '2026-01-01',
   'Illicit cultivation reported in the Hermel foothills specifically in late 2025, a subset of Lebanon''s total illicit Bekaa Valley cultivation footprint'),

  ('MA', 'legally_cultivated_hectares_2024', 2700, 'hectares', '2024-01-01', '2024-12-31', 'annual', 'observed', 'high',
   'Global Initiative Against Transnational Organized Crime -- Morocco''s cannabis policy aims high',
   'https://globalinitiative.net/analysis/moroccos-cannabis-policy-informal-economy-ocindex/', '2025-04-29',
   'Up from under 300 hectares in 2023; still a small fraction of the estimated 50,000-70,000 hectares under cultivation nationally, legal and illicit combined'),
  ('MA', 'active_cannabis_licenses_2025_season', 5765, 'licenses', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high',
   'MJBizDaily -- Morocco''s medical cannabis industry continues development',
   'https://www.mmjdaily.com/article/9847103/morocco-s-medical-cannabis-industry-continues-development/', '2026-06-01',
   'Includes 5,492 cultivation permits benefiting more than 5,300 farmers, plus processing, transport, marketing, export and seed-import licenses, per ANRAC Director General Mohamed El Guerrouj'),
  ('MA', 'export_price_low_thc_resin_switzerland_2024', 1600, 'EUR_per_kg', '2024-01-01', '2024-12-31', 'annual', 'observed', 'medium',
   'Global Initiative Against Transnational Organized Crime -- Morocco''s cannabis policy aims high',
   'https://globalinitiative.net/analysis/moroccos-cannabis-policy-informal-economy-ocindex/', '2025-04-29',
   'Midpoint of a reported EUR 1,400-1,800 per kilogram range for a 2024 low-THC cannabis resin shipment to Switzerland'),
  ('MA', 'royal_pardon_recipients_2024', 4800, 'people', '2024-08-01', '2024-08-31', 'point_in_time', 'observed', 'high',
   'Global Initiative Against Transnational Organized Crime -- Morocco''s cannabis policy aims high',
   'https://globalinitiative.net/analysis/moroccos-cannabis-policy-informal-economy-ocindex/', '2025-04-29',
   'People convicted, prosecuted, or wanted in illegal-cannabis-cultivation cases pardoned by King Mohammed VI in August 2024')
ON CONFLICT (country_iso2, metric_name, period_start, period_end) DO NOTHING;

INSERT INTO public.country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('SM', 'prohibition-risk-map', 'general',
   '["San Marino permits only one narrow lawful cannabis pathway: the pharmaceutical product Sativex, free of charge, for multiple sclerosis or spinal cord/bone-marrow pain -- there is no cultivation, dispensing, or broader medical framework", "The 1956 narcotics law does not clearly distinguish cannabis from harder drugs, so illicit possession or trafficking can draw 3-8 years'' imprisonment", "A 2019 proposal to regulate recreational use (30g/4 plants) was approved but then reversed by Parliament in March 2020, which chose to wait and follow Italy''s lead instead", "CBD has no clear legal status and no general retail authorization exists, notwithstanding informal availability"]'::jsonb,
   'Read the San Marino jurisdiction playbook -- effectively full prohibition with one narrow pharmaceutical exception',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_San_Marino')],
   'verified_secondary_source'),

  ('VC', 'licence-class-guide', 'cultivator_producer',
   '["Saint Vincent and the Grenadines built a commercial medical cannabis export industry (2018 Medicinal Cannabis Industry Act) rather than prioritizing personal legalization -- personal possession up to 56g was decriminalized separately", "The Medicinal Cannabis Authority issues five tiers of cultivation license (Class A-E) priced from EC$100,000 to EC$2.67 million by acreage, plus manufacturing, dispensing, and import/export licenses", "The industry is oriented toward pharmaceutical-grade export meeting GMP/GACP/GlobalGAP/organic standards, not domestic or tourist retail -- there is no walk-in dispensary model anywhere in SVG", "A Cannabis Cultivation (Amnesty) Act pathway exists specifically to let traditional/informal cultivators transition into the licensed system"]'::jsonb,
   'Read the Saint Vincent and the Grenadines jurisdiction playbook before selecting a cultivation license class',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://mca.vc/')],
   'verified_secondary_source'),

  ('LB', 'market-access-strategy', 'investor_operator',
   '["Lebanon was the first Arab country to legalize medical/industrial cannabis cultivation (Law No. 178/2020), but its implementing Authority was not formally established until summer 2025 -- a five-year gap between law and functioning regulator", "As of early 2026, no legal cannabis purchase channel of any kind operates in Lebanon, and the regulator itself has said the 2026 timeline is too tight for even a first legal harvest", "Once operational, the framework designates the Bekaa Valley and Akkar as authorized cultivation zones and plans nine license categories plus digital traceability", "Morocco, which passed comparable legislation a year later (2021), reached a licensed exporting industry within three years -- a benchmark increasingly cited against Lebanon''s much slower pace"]'::jsonb,
   'Read the Lebanon jurisdiction playbook -- track the Authority''s current operational status before assuming any pathway is open',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/lebanon')],
   'verified_secondary_source'),

  ('MA', 'licence-class-guide', 'cultivator_producer',
   '["Morocco''s Law 13-21 (2021) legalized medical/industrial/cosmetic cannabis cultivation through ANRAC-licensed farmer cooperatives in three authorized Rif provinces: Al Hoceima, Chefchaouen, and Taounate", "Morocco deliberately did not adopt a national THC ceiling, preserving compatibility with high-THC indigenous kif/Beldia genetics rather than forcing a shift to low-THC hemp cultivars", "By the 2025 season, ANRAC had registered 5,765 active licenses (5,492 of them cultivation permits) across roughly 2,700+ legally cultivated hectares -- still a small fraction of an estimated 50,000-70,000 hectares under cultivation nationally", "Real EU exports now occur (e.g. 2024 low-THC resin shipments to Switzerland at EUR 1,400-1,800/kg), but farmers report continuing friction accessing licensed processing capacity even after securing cultivation authorization"]'::jsonb,
   'Read the Morocco jurisdiction playbook before pursuing ANRAC cooperative licensing',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://globalinitiative.net/analysis/moroccos-cannabis-policy-informal-economy-ocindex/')],
   'verified_secondary_source')
ON CONFLICT (country_iso2, module_key, role_id) DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('SM','VC','LB','MA');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260712130917','batch_13_playbooks_metrics_overlay_sm_vc_lb_ma','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260712130917_batch_13_playbooks_metrics_overlay_sm_vc_lb_ma.sql

-- RECOVERY BEGIN 20260713055900_fix_regulatory_tier_rpc_missing_authz_reconcile.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713055900.
--
-- Rewriting this file cannot affect production: 20260713055900 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- No-op reconciliation marker: the actual fix (public.is_regulatory_tier_admin()
-- guard on api.set_regulatory_tier / api.accept_classifier_tier) was already
-- applied live as migration 20260712070059_fix_regulatory_tier_rpc_missing_authz.
-- PR #1032 committed the same SQL to git under a different filename
-- (20260711170000_...). This entry just records that reconciliation in the ledger.
select 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713055900','fix_regulatory_tier_rpc_missing_authz_reconcile','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713055900_fix_regulatory_tier_rpc_missing_authz_reconcile.sql

-- RECOVERY BEGIN 20260713070000_country_name_normalization_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session).
--
-- Fixes a major bug found during this session's URL remediation work:
-- fetchDashboardSignals() in lib/dashboard/dashboardServerData.ts filters
-- signals by country with a plain lowercase exact-string match against
-- countries.country_name -- no ISO2 fallback, no alias handling. A full
-- audit of every distinct signals.country value found 7 real mismatches
-- affecting 2,862 signals, dominated by USA (2,611 -- the single largest
-- signal-producing "country" in the entire table, silently invisible on
-- its own Intel tab this whole time):
--
--   USA -> United States (2,611)
--   UK -> United Kingdom (143)
--   Turkiye -> Türkiye (85, missing diacritic)
--   UAE -> United Arab Emirates (12)
--   Czech Republic -> Czechia (8)
--   Democratic Republic of Congo -> Democratic Republic of the Congo (2)
--   Turkey -> Türkiye (1)
--
-- Separately confirmed as NOT bugs, correctly non-matching by design:
-- Global/Europe/LATAM/Africa/Pacific/Asia/Middle East/European Union/
-- Eastern Europe-Central Asia/Caribbean (635 signals, genuinely regional
-- rather than single-country) and 335 signals with no country tag at all
-- (a completeness gap, different problem).
--
-- FIX: rather than patch every app-side call site doing the naive
-- comparison, normalized the DATA to match countries.country_name exactly
-- (so existing exact-match code just works), and added a trigger so this
-- can't recur -- the LLM-driven extraction/scoring pipeline will keep
-- naturally writing colloquial forms like "USA" going forward, so a
-- one-time data fix alone would have silently regressed within days.
--
-- - country_name_aliases table: alias -> canonical_name, seeded with the
--   7 confirmed mismatches plus ~35 other proactive common variants
--   (Russia/Russian Federation, Ivory Coast/Cote d'Ivoire, Swaziland/
--   Eswatini, Macedonia/North Macedonia, Burma/Myanmar, Holland/
--   Netherlands, DRC variants, Caribbean island "and X" contractions,
--   etc.) to pre-empt the same bug recurring for countries not yet
--   appearing in signals today.
-- - normalize_signal_country() trigger function + BEFORE INSERT OR UPDATE
--   OF country trigger on public.signals: looks up NEW.country in the
--   alias table (case-insensitive) and rewrites to canonical form if
--   found, otherwise leaves it untouched (so Global/Europe/etc pass
--   through correctly).
-- - Retroactive UPDATE fixing all 2,862 existing affected signals.
--
-- Verified live: re-ran the full mismatch audit post-fix, zero rows
-- returned. Tested the trigger directly with a throwaway insert
-- (country='USA' in, country='United States' back out), then deleted
-- the test row.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713070000','country_name_normalization_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713070000_country_name_normalization_stub.sql

-- RECOVERY BEGIN 20260713070355_enforce_api_view_security_invoker_trigger.sql
-- Structural fix for the security_invoker regression, not another one-off
-- patch. This bug class has now hit at least 6 times across 3+ weeks
-- (20260622151411, 20260701001549, 20260709092127, 20260710190000 fixed 18
-- views; this session alone found and fixed 16 more across 2 passes, plus
-- api.source_snapshots as a 3rd, found on a routine re-check). The root
-- cause is structural: `CREATE OR REPLACE VIEW api.x AS SELECT ...` resets
-- any omitted `WITH (...)` option back to its default, so ANY future edit
-- to a view -- by any session, human or agent, whether or not it goes
-- through a PR -- silently reopens RLS on the underlying table. Six
-- instances in three weeks is a pattern, not noise, and manually re-running
-- get_advisors after the fact can only ever catch it after it's already
-- live.
--
-- This makes it structurally impossible instead: an event trigger that
-- fires after any CREATE VIEW or ALTER VIEW completes, checks whether the
-- affected view is in the `api` schema, and force-sets
-- security_invoker = true if it isn't already. Tested directly before
-- committing this file (not just asserted):
--   1. A fresh view created in api schema with no WITH clause at all ->
--      security_invoker=true appears in reloptions automatically.
--   2. The same view re-created via CREATE OR REPLACE (the exact scenario
--      that caused every prior regression) -> self-heals back to
--      security_invoker=true instead of reverting to false.
--   3. A view created in the public schema (outside api) -> untouched,
--      confirming the schema scope actually holds.
--   4. No recursion: the function checks reloptions before altering, so
--      the ALTER VIEW it issues doesn't cause it to fire on itself again.
--   5. Wrapped in exception handling that logs a WARNING and continues
--      rather than failing -- this must never be the thing that breaks a
--      real migration; worst case on failure is back to today's status
--      quo of manual get_advisors checks, not a blocked deploy.
--
-- Does not retroactively fix anything -- it only prevents the *next*
-- regression on any view created or edited from this point forward.

create or replace function public.enforce_api_view_security_invoker()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  obj record;
  current_opts text;
begin
  for obj in select * from pg_event_trigger_ddl_commands()
  loop
    if obj.object_type = 'view' and obj.schema_name = 'api' then
      select array_to_string(c.reloptions, ',') into current_opts
      from pg_class c where c.oid = obj.objid;

      if current_opts is null or position('security_invoker=true' in current_opts) = 0 then
        execute format('alter view %s set (security_invoker = true)', obj.object_identity);
        raise notice 'enforce_api_view_security_invoker: set security_invoker=true on %', obj.object_identity;
      end if;
    end if;
  end loop;
exception when others then
  raise warning 'enforce_api_view_security_invoker failed: %', sqlerrm;
end;
$$;

drop event trigger if exists enforce_api_view_security_invoker_trigger;
create event trigger enforce_api_view_security_invoker_trigger
  on ddl_command_end
  when tag in ('CREATE VIEW', 'ALTER VIEW')
  execute function public.enforce_api_view_security_invoker();

-- Also closes the 3rd live instance found today, api.source_snapshots
-- (admin/operator-only per RLS; authenticated already had view-level
-- SELECT, so this was live, not theoretical -- crawler snapshot content,
-- lower sensitivity than the dossier/passport/matches batch fixed earlier
-- today but a real policy violation regardless). Base table already had
-- the matching authenticated grant, so no companion grant needed.
alter view api.source_snapshots set (security_invoker = true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713070355','enforce_api_view_security_invoker_trigger','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713070355_enforce_api_view_security_invoker_trigger.sql

-- RECOVERY BEGIN 20260713080000_signal_quality_gate_relax_and_nav_chrome_fix_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session).
--
-- THE FINDING: the admin review UI (app/admin/signals/review/page.tsx)
-- exists and looks complete, but traced listRegulatoryReviewQueue() to
-- lib/regulatory-signals/admin.ts -- it queries regulatory_signals.signals,
-- a completely separate schema confirmed empty (0 rows) earlier this
-- session. It is not reviewing the live pipeline at all.
--
-- Meanwhile signals_quality (what fetchDashboardSignals/the Intel tab
-- reads) required reviewed=true for any cat='SOURCE_ENGINE' row. 7,136
-- automated signals existed; reviewed=true on zero of them, ever, because
-- there is no interface anywhere in the app that can set that flag on the
-- correct table. Every URL fix this session had been feeding a bucket
-- with no path to daylight -- only 95 hand-entered signals across 10
-- small manual categories were visible in the entire product.
--
-- Per Tyler's decision (option 2 of 2 presented): relax the gate rather
-- than build a new review UI right now.
--
-- FIRST PASS: dropped the reviewed=true requirement, kept the existing
-- score>=50 threshold (already calibrated in the original view, not a new
-- arbitrary number). Surfaced 1,085 of 7,136.
--
-- REFINEMENT (this migration): spot-checking the newly-surfaced content
-- found score 90-99 dominated by site navigation/footer chrome, not real
-- content -- confirmed directly by comparing multiple articles on the same
-- source (Business of Cannabis): identical nav-menu text ("BofC Awards
-- 2026 Cannabis Europa... Recent Searches Popular Searches") scored 99 on
-- two unrelated articles, while the genuine substantive prose from those
-- same articles (Albania's cultivation law, Slovenia's JAZMP licensing
-- detail, specific fees/gazette numbers) scored 30-70. Likely cause: nav
-- menus densely repeat topic-taxonomy keywords in a way that games a
-- keyword-density-based score; natural prose doesn't. The existing
-- v_boilerplate filter in hv_extract_signals_from_captured_text catches
-- generic site-chrome (cookie policy, sign in, etc) but not a site's own
-- internal topic-navigation menu -- a source-specific pattern a generic
-- list can't anticipate.
--
-- Excluded score >= 90 (score < 90 AND >= 50 for SOURCE_ENGINE). Drops
-- only 64 of 1,085, keeps 1,021. Re-verified with a fresh random sample
-- post-fix: real, substantive, correctly-formed headlines across the
-- board, no nav-chrome pollution.
--
-- KNOWN RESIDUAL LIMITATION, smaller and different in kind, not fixed
-- here: a handful of signals have a country tag that reflects the
-- source's own registration rather than the specific article's actual
-- topic (e.g. a general "Cannabis Laws in Dubai and the UAE" article from
-- a source registered under Finland). Not fixable by a score threshold --
-- would need per-signal topic/entity extraction rather than inheriting
-- the source's registered country. Flagged for a future pass, much
-- smaller in scale than the reviewed-gate and nav-chrome issues.

-- Converted to a no-op stub on 2026-07-19: re-running the CREATE OR REPLACE
-- VIEW above fails ("cannot drop columns from view") because a later
-- migration added analysis/analysis_generated_at/analysis_backend columns
-- to the live view that this file's SELECT list predates -- confirmed live
-- that public.signals_quality already has all 29 columns including those
-- 3, and its WHERE clause already matches what's described above (score<90
-- exclusion for SOURCE_ENGINE), matching this file's own claim of already
-- being applied directly to production.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713080000','signal_quality_gate_relax_and_nav_chrome_fix_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713080000_signal_quality_gate_relax_and_nav_chrome_fix_stub.sql

-- RECOVERY BEGIN 20260713090000_signals_reviewer_tracking_stub.sql
-- Applied directly to production via Supabase MCP (Jul 13 2026 session).
-- Supports the new /admin/signals/queue engine review queue (see the app
-- code in the same commit): tracks who reviewed a SOURCE_ENGINE signal and
-- when, matching the accountability pattern already used in
-- regulatory_signals.signals (reviewed_by/last_reviewed_at). signals.action
-- (pre-existing, previously entirely unused) now stores the review
-- decision as plain text: 'approved' | 'rejected' | null.
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.signals.action IS
  'Review decision for SOURCE_ENGINE signals: approved | rejected | null (not yet reviewed). Set via the engine review queue at /admin/signals/queue.';
COMMENT ON COLUMN public.signals.reviewed_by IS 'Admin user id who last reviewed this signal.';
COMMENT ON COLUMN public.signals.reviewed_at IS 'When this signal was last reviewed (approved or rejected).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713090000','signals_reviewer_tracking_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713090000_signals_reviewer_tracking_stub.sql

-- RECOVERY BEGIN 20260713111807_regulatory_tier_airtable_sync_config_rpc.sql
create or replace function api.get_airtable_sync_config()
returns json
language sql
security definer
set search_path to ''
as $$
  select json_build_object(
    'sync_key', (select decrypted_secret from vault.decrypted_secrets where name = 'hv_airtable_sync_key'),
    'pat',      (select decrypted_secret from vault.decrypted_secrets where name = 'airtable_pat')
  );
$$;

comment on function api.get_airtable_sync_config() is
  'Returns internal sync key + Airtable PAT for the hv-airtable-tier-sync edge function. service_role only.';

revoke all on function api.get_airtable_sync_config() from public;
revoke all on function api.get_airtable_sync_config() from anon;
revoke all on function api.get_airtable_sync_config() from authenticated;
grant execute on function api.get_airtable_sync_config() to service_role;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713111807','regulatory_tier_airtable_sync_config_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713111807_regulatory_tier_airtable_sync_config_rpc.sql

-- RECOVERY BEGIN 20260713120000_education_review_attribution.sql
-- Reviewer attribution for education_modules content review workflow.
--
-- content_review_status previously had no downstream consumer: a repo-wide
-- search found exactly one reference to this column (the migration that
-- sets it via the batch generation job). Nothing in application code reads
-- or gates on it, which is why AI-generated content lands in
-- publication_state = 'published' regardless of review status.
--
-- education_modules currently has SELECT-only RLS policies
-- (education_modules_admin_select, education_modules_public_select) and no
-- UPDATE policy. Writes go through lib/supabase/adminDataClient.ts's
-- service-role mutation helper (the established pattern for admin writes in
-- this codebase), which bypasses RLS by design; requireAdminAuth() is the
-- actual authorization gate, enforced before the server action runs.
--
-- This does NOT change publication_state or unpublish anything currently
-- live -- by explicit decision, existing published-but-unreviewed content
-- stays published. This only adds the ability to mark items reviewed going
-- forward.

alter table public.education_modules
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713120000','education_review_attribution','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713120000_education_review_attribution.sql

-- RECOVERY BEGIN 20260713130000_network_review_producers.sql
-- Phase C: network_review_items producers.
--
-- network_review_items had a fully-designed schema (object_type constrained to
-- country|category|listing|wanted_request|intelligence_brief, review_status
-- lifecycle, legal/compliance flags) but zero rows, zero triggers, zero
-- functions referencing it anywhere -- a review gate that nothing fed.
--
-- 'category' is intentionally NOT covered here: no backing content table was
-- found for it (checked information_schema for anything category-shaped;
-- 'category' only exists as an enum column on listings/buyer_requests, not
-- as a standalone content object). Left out rather than guessed at.
--
-- 'intelligence_brief' -> cc_jurisdiction_briefings. Note this table already
-- has its own `review_state` column and is actively fed (302 rows, updated
-- as recently as 2026-07-11) independent of this system. Per explicit
-- decision, this migration adds a SECOND, duplicate review record in
-- network_review_items for the same content. This is accepted duplication,
-- not an oversight -- flagging again here so it isn't mistaken for one later.
--
-- All four trigger functions are SECURITY DEFINER: network_review_items RLS
-- only grants admin/operator/service_role (policies: admin_operator_only,
-- service_role_all). A regular seller/buyer creating a listing or buyer
-- request is neither, so the insert would fail under RLS running as the
-- invoking role. SECURITY DEFINER bypasses that, matching the pattern
-- already established elsewhere in this codebase for admin-adjacent writes
-- triggered by non-admin actions.
--
-- claim_risk defaults to 'medium' (the network_review_items column default)
-- for all four types -- this is a coarse, uniform default, not a
-- risk-calibrated judgment per type. Per-type risk tuning is a follow-up,
-- not attempted here.
--
-- requires_legal_review / requires_compliance_review are set per object
-- type as a reasonable default, not a definitive policy:
--   listing, wanted_request -> requires_compliance_review = true (commercial claims)
--   country, intelligence_brief -> requires_legal_review = true (jurisdiction/regulatory claims)

-- ---------------------------------------------------------------------------
-- listings -> object_type = 'listing'
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_listings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      category_label, public_summary_draft, requires_compliance_review, created_by
    ) values (
      'listing', NEW.id::text, NEW.title, NEW.title,
      NEW.category::text, NEW.description, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_listings on public.listings;
create trigger trg_network_review_listings
  after insert on public.listings
  for each row execute function public.network_review_producer_listings();

-- ---------------------------------------------------------------------------
-- buyer_requests -> object_type = 'wanted_request'
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_buyer_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      category_label, public_summary_draft, requires_compliance_review, created_by
    ) values (
      'wanted_request', NEW.id::text, NEW.title, NEW.title,
      NEW.category::text, NEW.description, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_buyer_requests on public.buyer_requests;
create trigger trg_network_review_buyer_requests
  after insert on public.buyer_requests
  for each row execute function public.network_review_producer_buyer_requests();

-- ---------------------------------------------------------------------------
-- countries -> object_type = 'country'
-- Fires on new rows, and on meaningful edits to public_summary (not on every
-- column touch -- this table has ~30 status/tier columns updated frequently
-- by unrelated batch jobs; only public_summary changes represent a new
-- public-facing claim worth reviewing).
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_countries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.public_summary is not distinct from OLD.public_summary then
    return NEW;
  end if;

  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      country_code, country_label, public_summary_draft, requires_legal_review, created_by
    ) values (
      'country', NEW.id::text, NEW.country_name, NEW.country_name,
      NEW.iso_alpha2, NEW.country_name, NEW.public_summary, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_countries on public.countries;
create trigger trg_network_review_countries
  after insert or update of public_summary on public.countries
  for each row execute function public.network_review_producer_countries();

-- ---------------------------------------------------------------------------
-- cc_jurisdiction_briefings -> object_type = 'intelligence_brief'
-- See top-of-file note: intentional duplication with this table's own
-- review_state column, per explicit decision.
-- ---------------------------------------------------------------------------
create or replace function public.network_review_producer_cc_briefings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.public_summary is not distinct from OLD.public_summary then
    return NEW;
  end if;

  begin
    insert into public.network_review_items (
      object_type, source_ref, title_internal, title_public_draft,
      country_code, category_label, public_summary_draft, requires_legal_review, created_by
    ) values (
      'intelligence_brief', NEW.id::text,
      'Briefing: ' || coalesce(NEW.jurisdiction_slug, NEW.id::text),
      'Briefing: ' || coalesce(NEW.jurisdiction_slug, NEW.id::text),
      NEW.country_iso2, NEW.jurisdiction_type, NEW.public_summary, true, auth.uid()
    );
  exception when others then
    raise warning 'network_review_producer failed for %.%: %', TG_TABLE_NAME, NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_network_review_cc_briefings on public.cc_jurisdiction_briefings;
create trigger trg_network_review_cc_briefings
  after insert or update of public_summary on public.cc_jurisdiction_briefings
  for each row execute function public.network_review_producer_cc_briefings();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713130000','network_review_producers','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713130000_network_review_producers.sql

-- RECOVERY BEGIN 20260713155218_regulatory_tier_outbound_airtable_push.sql
-- Outbound push: countries.regulatory_tier change -> Airtable via edge function.
create or replace function public.push_regulatory_tier_to_airtable()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor text := coalesce(current_setting('hv.sync_actor', true), 'supabase');
  v_ps    text;
  v_key   text;
  v_url   text := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-airtable-tier-sync';
  v_anon  text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M';
begin
  -- Loop guard: never echo an Airtable-originated write back to Airtable.
  if v_actor = 'airtable' then
    return new;
  end if;

  -- Only push when a tier-relevant column actually changed.
  if new.regulatory_tier is not distinct from old.regulatory_tier
     and new.regulatory_tier_origin is not distinct from old.regulatory_tier_origin
     and new.regulatory_tier_needs_review is not distinct from old.regulatory_tier_needs_review
     and new.regulatory_tier_rationale is not distinct from old.regulatory_tier_rationale then
    return new;
  end if;

  select program_status into v_ps
    from public.cc_jurisdiction_briefings
   where country_iso2 = new.iso_alpha2 and jurisdiction_type = 'country';

  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'hv_airtable_sync_key';

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'x-hv-sync-key', v_key
    ),
    body := jsonb_build_object(
      'iso',            new.iso_alpha2,
      'tier',           new.regulatory_tier,
      'origin',         new.regulatory_tier_origin,
      'rationale',      new.regulatory_tier_rationale,
      'program_status', v_ps,
      'needs_review',   new.regulatory_tier_needs_review,
      'actor',          v_actor
    )
  );

  return new;
end;
$function$;

comment on function public.push_regulatory_tier_to_airtable() is
  'AFTER UPDATE on countries: pushes regulatory_tier changes to Airtable via hv-airtable-tier-sync. Skips writes whose hv.sync_actor session var is ''airtable'' (loop guard).';

drop trigger if exists trg_push_regulatory_tier_to_airtable on public.countries;
create trigger trg_push_regulatory_tier_to_airtable
after update of regulatory_tier, regulatory_tier_origin, regulatory_tier_needs_review, regulatory_tier_rationale
on public.countries
for each row
execute function public.push_regulatory_tier_to_airtable();

-- Loop guard on the write-back path: stamp the actor so the outbound trigger can skip it.
create or replace function api.set_regulatory_tier(p_iso text, p_tier text, p_actor text DEFAULT 'agent'::text, p_note text DEFAULT NULL::text)
 RETURNS countries
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  -- Make the actor visible to the outbound Airtable trigger (loop guard).
  perform set_config('hv.sync_actor', p_actor, true);

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'reviewed override ('||p_actor||') '||to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor, coalesce(p_note,'Manual override via set_regulatory_tier'));

  return v_row;
end;
$function$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713155218','regulatory_tier_outbound_airtable_push','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713155218_regulatory_tier_outbound_airtable_push.sql

-- RECOVERY BEGIN 20260713155432_regulatory_tier_airtable_writeback_rpc.sql
-- Inbound write-back: Airtable tier edit -> Supabase. service_role only (edge function auth'd via sync key).
-- Stamps hv.sync_actor='airtable' so the outbound trigger does NOT echo it back (loop guard).
create or replace function api.apply_airtable_tier(p_iso text, p_tier text, p_rationale text default null)
returns public.countries
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  -- Loop guard: mark this write as Airtable-originated so the outbound trigger skips it.
  perform set_config('hv.sync_actor', 'airtable', true);

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2 = p_iso and jurisdiction_type = 'country';

  -- No-op guard: if nothing actually changed, don't churn.
  if v_old.regulatory_tier is not distinct from p_tier
     and (p_rationale is null or v_old.regulatory_tier_rationale is not distinct from p_rationale) then
    return v_old;
  end if;

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'airtable edit ' || to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_rationale, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'airtable_writeback', v_ps, 'airtable',
     coalesce(p_rationale, 'Tier edited in Airtable'));

  return v_row;
end;
$function$;

comment on function api.apply_airtable_tier(text,text,text) is
  'Applies an Airtable-originated tier edit. service_role only; stamps hv.sync_actor=airtable for outbound loop guard.';

revoke all on function api.apply_airtable_tier(text,text,text) from public;
revoke all on function api.apply_airtable_tier(text,text,text) from anon;
revoke all on function api.apply_airtable_tier(text,text,text) from authenticated;
grant execute on function api.apply_airtable_tier(text,text,text) to service_role;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713155432','regulatory_tier_airtable_writeback_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713155432_regulatory_tier_airtable_writeback_rpc.sql

-- RECOVERY BEGIN 20260713212905_lock_down_get_corridor_stats_grants.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713212905.
--
-- Rewriting this file cannot affect production: 20260713212905 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- get_corridor_stats is only ever called via the /api/corridors/data route, which uses the
-- service-role key. anon/authenticated EXECUTE was over-granted (get_command_centre_stats, the
-- pattern it should match, is service_role-only). Revoke the unnecessary exposure.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM anon, authenticated;

-- Also revoke on the underlying public function in case it was granted there too.
REVOKE EXECUTE ON FUNCTION public.get_corridor_stats(text) FROM anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713212905','lock_down_get_corridor_stats_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713212905_lock_down_get_corridor_stats_grants.sql

-- RECOVERY BEGIN 20260713212924_lock_down_corridor_stats_revoke_public.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713212924.
--
-- Rewriting this file cannot affect production: 20260713212924 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- The grants are inherited via PUBLIC (the schema-default EXECUTE grant), not direct role grants —
-- same gotcha as the marketplace_public_listings_v1 view earlier. Revoke from PUBLIC, grant service_role only.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_corridor_stats(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.get_corridor_stats(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_corridor_stats(text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713212924','lock_down_corridor_stats_revoke_public','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713212924_lock_down_corridor_stats_revoke_public.sql

-- RECOVERY BEGIN 20260713213101_digest_llm_fallback_and_manual_review_queue.sql
-- Extends the Anthropic -> OpenAI -> Gemini circuit-breaker fallback pattern
-- (already proven in run_signal_extraction, see
-- 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql) to the
-- two functions that generate the public Daily Digest: run_daily_digest and
-- run_editorial_digest. Both were previously hardcoded to Anthropic only, with
-- no fallback and no retry, so a single Anthropic outage silently froze the
-- digest for the rest of the day (and beyond -- see run_daily_digest fix
-- below) with zero visibility.
--
-- Also adds pipeline_manual_review_queue: a shared table any of the LLM-backed
-- pipelines can write to when every configured provider is circuit-broken for
-- a given pipeline+date, so there is something to review by hand instead of
-- the failure disappearing into a jsonb return value nobody reads. Wired into
-- run_daily_digest, run_editorial_digest, and (one-line addition) the
-- already-fallback-aware run_signal_extraction.
--
-- Two additional bugs fixed in run_daily_digest while porting the fallback:
--   1. Its "already ran today" guard checked for *any* daily_digest row for
--      today, but run_editorial_digest upserts a row for today (with empty
--      headlines) independently. If editorial ran first, run_daily_digest
--      would see that row and skip for the entire day without ever having
--      tried -- headlines stayed empty. Now checks headlines actually has
--      content.
--   2. Once a _digest_jobs row received *any* HTTP response (including a
--      same-provider error like the Anthropic billing failure), the job was
--      never marked collected (that only happened for true multi-hour
--      timeouts), so every later invocation that day re-entered the same
--      dead collect branch and never fired a retry or fallback. Collected is
--      now set unconditionally once a response is parsed, matching how
--      run_editorial_digest already behaved.

-- ── Manual review bucket ──────────────────────────────────────────────────────
create table if not exists public.pipeline_manual_review_queue (
  id uuid primary key default gen_random_uuid(),
  pipeline text not null,
  reference_date date not null,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  resolved_at timestamptz,
  resolved_by text,
  unique (pipeline, reference_date)
);

comment on table public.pipeline_manual_review_queue is
  'Rows land here when every configured LLM provider (anthropic/openai/gemini) is circuit-broken for a pipeline+date, so a human can review manually. Checked daily by the pipeline-manual-review-notify cron.';

-- ── Track which provider actually served each digest job ─────────────────────
alter table public._digest_jobs add column if not exists provider text;
alter table public._editorial_digest_jobs add column if not exists provider text;

-- ── run_daily_digest: 3-tier fallback + same-day retry fix ───────────────────
create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- Give up only on jobs pg_net truly never returned anything for.
  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _digest_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _digest_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _digest_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals));
  end if;

  if v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',2500,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'SIGNALS:\n' || v_signals::text)
          )),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'openai'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',2500)
        ),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'signals_sent',jsonb_array_length(v_signals));
end $function$;

-- ── run_editorial_digest: 3-tier fallback ────────────────────────────────────
create or replace function public.run_editorial_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_items jsonb;
  v_item_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of Harbourview''s Daily Wire, a global cannabis news digest for a general audience — not a trade or industry briefing. Below is a JSON array of candidate items, each from a mainstream (non-cannabis-industry) news outlet or a government source, published within the last 7 days. Select up to 8 of the most interesting or globally significant items (fewer if fewer qualify) with a strong bias toward emerging and historically underreported cannabis markets — small or unusual jurisdictions, not the usual US/Canada/Germany/UK/Australia stories. You may include at most ONE major-market story, and only if it is genuinely globally significant this week; omit it entirely if nothing meets that bar. For each selected item, rewrite it as an original short editorial of roughly 150-250 words in Harbourview''s voice: analytical, globally-minded, measured, no hype or cannabis-culture slang, no promotional language, and no direct quotes over a few words. Ground every claim in the source material provided — do not invent facts, figures, or context not present in the input. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string (max 110 chars, your own words), "why_it_matters": string (the full ~150-250 word editorial body), "market": string (country name, or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  update _editorial_digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.item_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    enriched as (
      select o.request_id, o.item_ids,
        (select jsonb_agg(elem || jsonb_build_object(
                  'published_at', ei.published_at,
                  'source_url', ei.source_url,
                  'outlet_name', ei.outlet_name))
         from jsonb_array_elements(o.p) as elem
         left join editorial_items ei on ei.id::text = elem->>'item_id') as p
      from ok o
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', e.p, 'published', now()
      from enriched e
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    mark_collected as (
      update _editorial_digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'published_at', e.published_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and coalesce(published_at, created_at) > now() - interval '7 days'
    order by coalesce(published_at, created_at) desc
    limit 60
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items published in the last 7 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _editorial_digest_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _editorial_digest_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _editorial_digest_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('editorial_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_items', jsonb_array_length(v_items)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_items));
  end if;

  if v_provider = 'anthropic' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',6000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nITEMS:\n' || v_items::text))),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',6000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'ITEMS:\n' || v_items::text)
          )),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'openai'
    );
  else
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'ITEMS:\n' || v_items::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',6000)
        ),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'items_sent',jsonb_array_length(v_items));
end $function$;

-- ── run_signal_extraction: wire into the same manual-review bucket ──────────
-- Already has the 3-tier fallback; it just silently returned {degraded:true}
-- with no queryable record. One-line addition, logic otherwise unchanged from
-- 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql.
create or replace function public.run_signal_extraction(p_fire_limit integer default 25)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
begin
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false
    and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id)
    and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  where coalesce(j.collected,false)=false and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id);

  with resp as (
    select j.request_id, j.snapshot_id, j.source_name, j.captured_url,
           coalesce(
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
             safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
             safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
           ) as claude_text
    from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
    where coalesce(j.collected,false)=false and r.status_code=200
  ),
  arr as (select *, safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p from resp),
  arr2 as (select *, case when jsonb_typeof(p)='array' then p else '[]'::jsonb end as a from arr),
  cand as (
    select a.source_name, a.captured_url, a.snapshot_id, sig,
      left(coalesce(sig->>'title','Untitled signal'),300) as t,
      left(coalesce(sig->>'market','Global'),120) as mkt,
      least(100,greatest(0,coalesce((sig->>'confidence')::int,50))) as conf,
      row_number() over (partition by lower(coalesce(sig->>'title','')), lower(coalesce(sig->>'market','')) order by 1) as rn
    from arr2 a, jsonb_array_elements(a.a) as sig
    where jsonb_typeof(a.a)='array' and jsonb_array_length(a.a)>0
  ),
  ins as (
    insert into ia_signals (id,title,type,category,stage,market,confidence,commercial_impact,summary,source_id,source_name,notes)
    select 's-'||gen_random_uuid(), c.t,
      case when lower(coalesce(c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(c.sig->>'type') else 'regulatory' end,
      case when lower(coalesce(c.sig->>'category',c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(coalesce(c.sig->>'category',c.sig->>'type')) else 'regulatory' end,
      case when c.conf >= 80 then 'qualified' else 'new' end,
      c.mkt, c.conf,
      case when lower(coalesce(c.sig->>'commercial_impact','')) in ('high','medium','low') then lower(c.sig->>'commercial_impact') else 'medium' end,
      coalesce(c.sig->>'summary',''), null, c.source_name,
      'auto-extracted (claude-haiku-4-5) from snapshot '||c.snapshot_id||coalesce(' · '||c.captured_url,'')
    from cand c
    where c.rn = 1
      and not public.is_boilerplate_signal(c.sig->>'summary')
      and not exists (
        select 1 from ia_signals x
        where lower(x.title)=lower(c.t) and lower(x.market)=lower(c.mkt)
          and x.created_at > now() - interval '45 days'
      )
    returning 1
  )
  select count(*) into v_inserted from ins;

  update source_snapshots s set processing_status='extracted', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code=200 and s.processing_status<>'extracted';
  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code<>200 and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  from net._http_response r where r.id=j.request_id and coalesce(j.collected,false)=false;
  get diagnostics v_collected = row_count;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('signal_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('inserted', v_inserted, 'collected', v_collected))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'inserted', v_inserted, 'collected', v_collected, 'fired', 0, 'ran_at', now());
  end if;

  if v_provider = 'anthropic' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.anthropic.com/v1/messages',
      headers:=jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
      body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
        'messages',jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'anthropic'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  elsif v_provider = 'openai' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
      body:=jsonb_build_object('model','gpt-4o-mini','max_tokens',1500,'temperature',0,
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content',v_pre),
          jsonb_build_object('role','user','content',
            E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
            || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))
        )),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'openai'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  else
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1500)
      ),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'gemini'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  end if;

  return jsonb_build_object('ok',true,'degraded',(v_provider <> 'anthropic'),'provider',v_provider,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713213101','digest_llm_fallback_and_manual_review_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713213101_digest_llm_fallback_and_manual_review_queue.sql

-- RECOVERY BEGIN 20260713213432_digest_llm_fallback_and_manual_review_queue.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713213432.
--
-- Rewriting this file cannot affect production: 20260713213432 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Extends the Anthropic -> OpenAI -> Gemini circuit-breaker fallback pattern
-- (already proven in run_signal_extraction, see
-- 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql) to the
-- two functions that generate the public Daily Digest: run_daily_digest and
-- run_editorial_digest. Both were previously hardcoded to Anthropic only, with
-- no fallback and no retry, so a single Anthropic outage silently froze the
-- digest for the rest of the day (and beyond -- see run_daily_digest fix
-- below) with zero visibility.
--
-- Also adds pipeline_manual_review_queue: a shared table any of the LLM-backed
-- pipelines can write to when every configured provider is circuit-broken for
-- a given pipeline+date, so there is something to review by hand instead of
-- the failure disappearing into a jsonb return value nobody reads. Wired into
-- run_daily_digest, run_editorial_digest, and (one-line addition) the
-- already-fallback-aware run_signal_extraction.
--
-- Two additional bugs fixed in run_daily_digest while porting the fallback:
--   1. Its "already ran today" guard checked for *any* daily_digest row for
--      today, but run_editorial_digest upserts a row for today (with empty
--      headlines) independently. If editorial ran first, run_daily_digest
--      would see that row and skip for the entire day without ever having
--      tried -- headlines stayed empty. Now checks headlines actually has
--      content.
--   2. Once a _digest_jobs row received *any* HTTP response (including a
--      same-provider error like the Anthropic billing failure), the job was
--      never marked collected (that only happened for true multi-hour
--      timeouts), so every later invocation that day re-entered the same
--      dead collect branch and never fired a retry or fallback. Collected is
--      now set unconditionally once a response is parsed, matching how
--      run_editorial_digest already behaved.

-- ── Manual review bucket ──────────────────────────────────────────────────────
create table if not exists public.pipeline_manual_review_queue (
  id uuid primary key default gen_random_uuid(),
  pipeline text not null,
  reference_date date not null,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  resolved_at timestamptz,
  resolved_by text,
  unique (pipeline, reference_date)
);

comment on table public.pipeline_manual_review_queue is
  'Rows land here when every configured LLM provider (anthropic/openai/gemini) is circuit-broken for a pipeline+date, so a human can review manually. Checked daily by the pipeline-manual-review-notify cron.';

-- ── Track which provider actually served each digest job ─────────────────────
alter table public._digest_jobs add column if not exists provider text;
alter table public._editorial_digest_jobs add column if not exists provider text;

-- ── run_daily_digest: 3-tier fallback + same-day retry fix ───────────────────
create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- Give up only on jobs pg_net truly never returned anything for.
  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _digest_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _digest_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _digest_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals));
  end if;

  if v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',2500,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'SIGNALS:\n' || v_signals::text)
          )),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'openai'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',2500)
        ),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'signals_sent',jsonb_array_length(v_signals));
end $function$;

-- ── run_editorial_digest: 3-tier fallback ────────────────────────────────────
create or replace function public.run_editorial_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_items jsonb;
  v_item_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of Harbourview''s Daily Wire, a global cannabis news digest for a general audience — not a trade or industry briefing. Below is a JSON array of candidate items, each from a mainstream (non-cannabis-industry) news outlet or a government source, published within the last 7 days. Select up to 8 of the most interesting or globally significant items (fewer if fewer qualify) with a strong bias toward emerging and historically underreported cannabis markets — small or unusual jurisdictions, not the usual US/Canada/Germany/UK/Australia stories. You may include at most ONE major-market story, and only if it is genuinely globally significant this week; omit it entirely if nothing meets that bar. For each selected item, rewrite it as an original short editorial of roughly 150-250 words in Harbourview''s voice: analytical, globally-minded, measured, no hype or cannabis-culture slang, no promotional language, and no direct quotes over a few words. Ground every claim in the source material provided — do not invent facts, figures, or context not present in the input. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string (max 110 chars, your own words), "why_it_matters": string (the full ~150-250 word editorial body), "market": string (country name, or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  update _editorial_digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.item_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    enriched as (
      select o.request_id, o.item_ids,
        (select jsonb_agg(elem || jsonb_build_object(
                  'published_at', ei.published_at,
                  'source_url', ei.source_url,
                  'outlet_name', ei.outlet_name))
         from jsonb_array_elements(o.p) as elem
         left join editorial_items ei on ei.id::text = elem->>'item_id') as p
      from ok o
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', e.p, 'published', now()
      from enriched e
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    mark_collected as (
      update _editorial_digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'published_at', e.published_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and coalesce(published_at, created_at) > now() - interval '7 days'
    order by coalesce(published_at, created_at) desc
    limit 60
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items published in the last 7 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _editorial_digest_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _editorial_digest_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _editorial_digest_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('editorial_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_items', jsonb_array_length(v_items)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_items));
  end if;

  if v_provider = 'anthropic' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',6000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nITEMS:\n' || v_items::text))),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',6000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'ITEMS:\n' || v_items::text)
          )),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'openai'
    );
  else
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'ITEMS:\n' || v_items::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',6000)
        ),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'items_sent',jsonb_array_length(v_items));
end $function$;

-- ── run_signal_extraction: wire into the same manual-review bucket ──────────
-- Already has the 3-tier fallback; it just silently returned {degraded:true}
-- with no queryable record. One-line addition, logic otherwise unchanged from
-- 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql.
create or replace function public.run_signal_extraction(p_fire_limit integer default 25)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
begin
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false
    and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id)
    and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  where coalesce(j.collected,false)=false and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id);

  with resp as (
    select j.request_id, j.snapshot_id, j.source_name, j.captured_url,
           coalesce(
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
             safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
             safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
           ) as claude_text
    from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
    where coalesce(j.collected,false)=false and r.status_code=200
  ),
  arr as (select *, safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p from resp),
  arr2 as (select *, case when jsonb_typeof(p)='array' then p else '[]'::jsonb end as a from arr),
  cand as (
    select a.source_name, a.captured_url, a.snapshot_id, sig,
      left(coalesce(sig->>'title','Untitled signal'),300) as t,
      left(coalesce(sig->>'market','Global'),120) as mkt,
      least(100,greatest(0,coalesce((sig->>'confidence')::int,50))) as conf,
      row_number() over (partition by lower(coalesce(sig->>'title','')), lower(coalesce(sig->>'market','')) order by 1) as rn
    from arr2 a, jsonb_array_elements(a.a) as sig
    where jsonb_typeof(a.a)='array' and jsonb_array_length(a.a)>0
  ),
  ins as (
    insert into ia_signals (id,title,type,category,stage,market,confidence,commercial_impact,summary,source_id,source_name,notes)
    select 's-'||gen_random_uuid(), c.t,
      case when lower(coalesce(c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(c.sig->>'type') else 'regulatory' end,
      case when lower(coalesce(c.sig->>'category',c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(coalesce(c.sig->>'category',c.sig->>'type')) else 'regulatory' end,
      case when c.conf >= 80 then 'qualified' else 'new' end,
      c.mkt, c.conf,
      case when lower(coalesce(c.sig->>'commercial_impact','')) in ('high','medium','low') then lower(c.sig->>'commercial_impact') else 'medium' end,
      coalesce(c.sig->>'summary',''), null, c.source_name,
      'auto-extracted (claude-haiku-4-5) from snapshot '||c.snapshot_id||coalesce(' · '||c.captured_url,'')
    from cand c
    where c.rn = 1
      and not public.is_boilerplate_signal(c.sig->>'summary')
      and not exists (
        select 1 from ia_signals x
        where lower(x.title)=lower(c.t) and lower(x.market)=lower(c.mkt)
          and x.created_at > now() - interval '45 days'
      )
    returning 1
  )
  select count(*) into v_inserted from ins;

  update source_snapshots s set processing_status='extracted', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code=200 and s.processing_status<>'extracted';
  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code<>200 and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  from net._http_response r where r.id=j.request_id and coalesce(j.collected,false)=false;
  get diagnostics v_collected = row_count;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('signal_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('inserted', v_inserted, 'collected', v_collected))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'inserted', v_inserted, 'collected', v_collected, 'fired', 0, 'ran_at', now());
  end if;

  if v_provider = 'anthropic' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.anthropic.com/v1/messages',
      headers:=jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
      body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
        'messages',jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'anthropic'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  elsif v_provider = 'openai' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
      body:=jsonb_build_object('model','gpt-4o-mini','max_tokens',1500,'temperature',0,
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content',v_pre),
          jsonb_build_object('role','user','content',
            E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
            || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))
        )),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'openai'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  else
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1500)
      ),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'gemini'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  end if;

  return jsonb_build_object('ok',true,'degraded',(v_provider <> 'anthropic'),'provider',v_provider,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713213432','digest_llm_fallback_and_manual_review_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713213432_digest_llm_fallback_and_manual_review_queue.sql

-- RECOVERY BEGIN 20260713213743_expose_pipeline_manual_review_queue_via_api.sql
-- Exposes public.pipeline_manual_review_queue (added in
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql) to
-- PostgREST via the api schema, mirroring api.daily_digest
-- (security_invoker view, service_role only -- this is internal ops data,
-- not a public/authenticated surface). Used by
-- app/api/cron/pipeline-manual-review-notify.
--
-- Converted to a no-op stub on 2026-07-19: the actual work here was
-- already applied to production under the neighboring version
-- 20260713213759 (16 seconds later, same filename) -- confirmed live via
-- information_schema.columns that api.pipeline_manual_review_queue exists
-- with exactly the 9 columns this file's SELECT list defines. Re-running
-- `create view` (no OR REPLACE) against the already-existing view fails
-- with "relation already exists".
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713213743','expose_pipeline_manual_review_queue_via_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713213743_expose_pipeline_manual_review_queue_via_api.sql

-- RECOVERY BEGIN 20260713213759_expose_pipeline_manual_review_queue_via_api.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713213759.
--
-- Rewriting this file cannot affect production: 20260713213759 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

alter table public.pipeline_manual_review_queue enable row level security;

create view api.pipeline_manual_review_queue
  with (security_invoker = on)
  as select
    id,
    pipeline,
    reference_date,
    reason,
    detail,
    created_at,
    notified_at,
    resolved_at,
    resolved_by
  from public.pipeline_manual_review_queue;

grant select, update on api.pipeline_manual_review_queue to service_role;
grant select, update on public.pipeline_manual_review_queue to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713213759','expose_pipeline_manual_review_queue_via_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713213759_expose_pipeline_manual_review_queue_via_api.sql

-- RECOVERY BEGIN 20260713221048_signals_feed_gate_source_engine_quality.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713221048.
--
-- Rewriting this file cannot affect production: 20260713221048 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- The signals side of the feed gated only on reviewed=true AND score>=6, which let 528 raw
-- SOURCE_ENGINE scraper rows (median score 30) flood the feed and bury ~75 curated signals
-- (median score 70). reviewed=true is set by ingest, not a real review, so it isn't a real gate.
--
-- Fix: keep curated categories at the low bar, but require SOURCE_ENGINE (the raw scraper tier)
-- to clear score>=60 — the point where its distribution separates from noise (14 of 528 survive,
-- vs 48 of 75 curated). Also hard-exclude literal raw-text dumps (unprocessed page scrapes whose
-- headline still contains the scraper's "--> STATUS AS AT"/"CHAPTER" boilerplate or has no
-- lowercase letters at all). ia_signals side unchanged (already gated by stage).
CREATE OR REPLACE VIEW public.signals_intelligence_feed AS
 SELECT s.id AS signal_id,
    s.headline AS title,
    s.summary,
    s.cat AS category,
    s.country,
    s.date AS signal_date,
    s.score,
    s.pri AS priority,
    s.commercial_impact,
    s.url,
    s.source,
    s.reviewed,
    s.created_at,
    'signals'::text AS source_table
   FROM signals s
  WHERE s.reviewed = true
    AND (
      (s.cat = 'SOURCE_ENGINE' AND s.score >= 60)
      OR (s.cat <> 'SOURCE_ENGINE' AND s.score >= 6)
    )
    -- belt-and-suspenders: never surface an unprocessed raw-text dump
    AND s.headline !~~ '-->%'
    AND s.headline !~~ '%STATUS AS AT%'
    AND s.headline ~ '[a-z]'
UNION ALL
 SELECT ia.id AS signal_id,
    ia.title,
    ia.summary,
    ia.category,
    ia.market AS country,
    ia.detected_at AS signal_date,
    (ia.confidence / 10)::numeric AS score,
    ia.commercial_impact AS priority,
    ia.commercial_impact,
    NULL::text AS url,
    ia.source_name AS source,
    true AS reviewed,
    ia.created_at,
    'ia_signals'::text AS source_table
   FROM ia_signals ia
  WHERE (ia.stage = ANY (ARRAY['qualified'::text, 'converted_to_opportunity'::text])) AND ia.id !~~ 's-%'::text;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713221048','signals_feed_gate_source_engine_quality','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713221048_signals_feed_gate_source_engine_quality.sql

-- RECOVERY BEGIN 20260713221555_enrichment_llm_fallback_extension.sql
-- Extends the Anthropic -> OpenAI -> Gemini circuit-breaker fallback (see
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql for the
-- digest port, and 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql
-- for the original pattern) to the four remaining Anthropic-only, no-fallback
-- functions identified during that investigation:
--   - run_country_intel_enrichment
--   - run_counterparty_enrichment
--   - run_education_section_gen
--   - run_education_deep_regen
-- Each is functionally unchanged except: (1) key decryption for all three
-- providers, (2) response parsing generalized to accept any of the three
-- providers' JSON shapes, (3) the same per-provider circuit-breaker selection
-- already used elsewhere, (4) a provider-branched net.http_post at fire time,
-- and (5) a write to pipeline_manual_review_queue when every provider is
-- circuit-broken. Anthropic stays tier 1 with its original model; OpenAI
-- (gpt-4o-mini) and Gemini (gemini-flash-latest) fallback tiers match the
-- models already in use for run_signal_extraction and the digest functions.

alter table public._counterparty_enrich_jobs add column if not exists provider text;
alter table public._country_enrich_jobs add column if not exists provider text;
alter table public._education_regen_jobs add column if not exists provider text;
alter table public._education_gen_jobs add column if not exists provider text;

-- ── run_counterparty_enrichment ───────────────────────────────────────────────
create or replace function public.run_counterparty_enrichment()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_ids text[];
  v_updated int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are a B2B cannabis market intelligence analyst for Harbourview. Below is a JSON array of trading counterparties (sellers, buyers, suppliers, distributors, importers, logistics providers). Each includes its role, markets, product categories, and REAL scored attributes derived from Harbourview''s relationship intelligence (certifications, market-access relevance, interaction history, score drivers). Using ONLY these provided facts (never invent company details, certifications, volumes, or relationships not present in the source material), write for each: (1) a "supply_profile" for sellers/suppliers/distributors/logistics (what they supply / their capabilities, 2-3 sentences) OR a "needs_profile" for buyers/importers (what they source / their requirements, 2-3 sentences). For a counterparty whose role is a seller-type, populate supply_profile and set needs_profile to null; for buyer-types, populate needs_profile and set supply_profile to null. Base every statement on the provided attributes -- if material is thin, write a shorter factual profile rather than embellishing. Return ONLY a JSON array (no markdown, no prose). Each element: {"id": string, "supply_profile": string|null, "needs_profile": string|null}.';
begin
  -- COLLECT phase
  perform 1 from _counterparty_enrich_jobs j where not j.collected;
  if found then
    update _counterparty_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text,
             r.status_code
      from _counterparty_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update ia_counterparties c set
        supply_profile = coalesce(nullif(trim(h->>'supply_profile'), ''), c.supply_profile),
        needs_profile  = coalesce(nullif(trim(h->>'needs_profile'), ''), c.needs_profile),
        last_profile_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where c.id = h->>'id'
      returning 1
    ),
    done as (
      update _counterparty_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_enriched', coalesce(v_updated, 0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  with targets as (
    select c.id, c.name, c.role, c.markets, c.categories
    from ia_counterparties c
    where c.last_profile_enriched_at is null
      and c.needs_profile is null and c.supply_profile is null
      and c.role in ('seller','buyer','supplier','distributor','importer','logistics_provider','packaging_supplier','consultant')
    limit 10
  ),
  material as (
    select t.id, t.name, t.role, t.markets, t.categories,
      (
        select jsonb_agg(distinct d)
        from ia_scoring_records sr, unnest(coalesce(sr.score_drivers, array[]::text[])) d
        where sr.counterparty_id = t.id
      ) as drivers,
      (
        select jsonb_agg(distinct m)
        from ia_scoring_records sr, unnest(coalesce(sr.market_access_relevance, array[]::text[])) m
        where sr.counterparty_id = t.id
      ) as market_access
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'role', role,
      'markets', to_jsonb(markets), 'categories', to_jsonb(categories),
      'score_drivers', coalesce(drivers, '[]'::jsonb),
      'market_access_relevance', coalesce(market_access, '[]'::jsonb)
    )),
    array_agg(id)
  into v_payload, v_ids
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unprofiled trading counterparties remaining');
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('counterparty_enrichment', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('candidates', jsonb_array_length(v_payload)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',3000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nCOUNTERPARTIES:\n' || v_payload::text))),
        timeout_milliseconds := 90000
      ), v_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',3000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'COUNTERPARTIES:\n' || v_payload::text)
          )),
        timeout_milliseconds := 90000
      ), v_ids, 'openai'
    );
  else
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTERPARTIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',3000)
        ),
        timeout_milliseconds := 90000
      ), v_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'counterparties_sent', jsonb_array_length(v_payload));
end;
$function$;

-- ── run_country_intel_enrichment ──────────────────────────────────────────────
create or replace function public.run_country_intel_enrichment()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_countries text[];
  v_updated int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are a cannabis regulatory intelligence editor for Harbourview, a B2B market intelligence platform. Below is a JSON array of countries, each with its current briefing and REAL source material: recently-captured intelligence signals and/or a researched market-entry playbook (legal framework, licensing steps, regulators, timeline, cost). Using ONLY the facts in the provided material (never invent facts, names, dates, or figures not present in the source material), write two things per country: (1) a richer "public_summary" (3-5 sentences, factual, no speculation, safe for a free public teaser page) and (2) a deeper "commercial_pathway_summary" (4-6 sentences, factual, covering licensing/market-entry/trade specifics found in the material) for a paid subscriber briefing. If the material does not support a claim, do not include it -- prefer being shorter and accurate over longer and speculative. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"country_code": string, "public_summary": string, "commercial_pathway_summary": string}.';
begin
  -- COLLECT phase
  perform 1 from _country_enrich_jobs j where not j.collected;
  if found then
    update _country_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.country_codes,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text,
             r.status_code
      from _country_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, country_codes, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, country_codes, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update country_intel ci set
        public_summary = coalesce(nullif(trim(h->>'public_summary'), ''), ci.public_summary),
        commercial_pathway_summary = coalesce(nullif(trim(h->>'commercial_pathway_summary'), ''), ci.commercial_pathway_summary),
        last_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where ci.country_code = h->>'country_code'
      returning 1
    ),
    done as (
      update _country_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'countries_enriched', coalesce(v_updated, 0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  with targets as (
    select ci.country_code, ci.country_name, ci.public_summary, ci.commercial_pathway_summary
    from country_intel ci
    where ci.last_enriched_at is null
      and (
        exists (select 1 from ia_signals s where s.market = ci.country_name and s.stage in ('qualified','converted_to_opportunity'))
        or exists (select 1 from signals sg where sg.country = ci.country_name)
        or exists (select 1 from jurisdiction_playbooks p where p.country_iso2 = ci.country_code and p.status = 'published')
      )
    limit 8
  ),
  material as (
    select t.country_code, t.country_name, t.public_summary, t.commercial_pathway_summary,
      (
        select jsonb_agg(jsonb_build_object('title', s.title, 'summary', s.summary, 'type', s.type, 'confidence', s.confidence))
        from (
          select title, summary, type, confidence from ia_signals
          where market = t.country_name and stage in ('qualified','converted_to_opportunity')
          order by confidence desc, created_at desc limit 6
        ) s
      ) as ia_material,
      (
        select jsonb_agg(jsonb_build_object('title', sg.headline, 'summary', sg.summary))
        from (
          select headline, summary from signals where country = t.country_name
          order by created_at desc limit 6
        ) sg
      ) as mature_material,
      (
        select jsonb_build_object(
                 'legal_framework', p.legal_framework_summary,
                 'difficulty', p.difficulty,
                 'typical_timeline_months', p.typical_timeline_months,
                 'estimated_cost_range', p.estimated_cost_range,
                 'steps', p.steps,
                 'key_regulators', p.key_regulators,
                 'common_pitfalls', p.common_pitfalls)
        from jurisdiction_playbooks p
        where p.country_iso2 = t.country_code and p.status = 'published'
        limit 1
      ) as playbook_material
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'country_code', country_code, 'country_name', country_name,
      'current_public_summary', public_summary, 'current_commercial_pathway_summary', commercial_pathway_summary,
      'signals', coalesce(ia_material, '[]'::jsonb) || coalesce(mature_material, '[]'::jsonb),
      'playbook', playbook_material
    )),
    array_agg(country_code)
  into v_payload, v_countries
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unenriched countries with real source material');
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('country_intel_enrichment', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('countries', jsonb_array_length(v_payload)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',4000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nCOUNTRIES:\n' || v_payload::text))),
        timeout_milliseconds := 90000
      ), v_countries, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',4000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'COUNTRIES:\n' || v_payload::text)
          )),
        timeout_milliseconds := 90000
      ), v_countries, 'openai'
    );
  else
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTRIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',4000)
        ),
        timeout_milliseconds := 90000
      ), v_countries, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'countries_sent', jsonb_array_length(v_payload));
end;
$function$;

-- ── run_education_section_gen ────────────────────────────────────────────────
create or replace function public.run_education_section_gen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_mod record;
  v_inserted int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are writing a professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- like a seasoned practitioner explaining hard-won knowledge to a competent peer. The module must follow EXACTLY this five-section structure, each section 1800-4000 characters of substantive prose (no bullet lists as the primary content, no headers within a section body): 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways". Ground everything in established, generally-accepted professional practice for the topic. Do NOT invent specific statistics, market-size figures, named companies, dates, or citations -- speak at the level of durable professional principle rather than fabricated specifics. Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase
  perform 1 from _education_gen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _education_gen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        with p as (select safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g'))) as arr),
        ins as (
          insert into education_module_sections (module_id, section_order, heading, body, block_type)
          select v_mod.module_id::uuid,
                 (s->>'section_order')::int,
                 s->>'heading',
                 s->>'body',
                 'text'
          from p, jsonb_array_elements(p.arr) s
          where jsonb_typeof(p.arr)='array'
            and not exists (select 1 from education_module_sections es where es.module_id = v_mod.module_id::uuid)
          returning 1
        )
        select count(*) from ins into v_inserted;
      end if;
      update _education_gen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','sections_inserted', v_inserted);
  end if;

  -- FIRE phase: one module per call
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and not exists (select 1 from education_module_sections s where s.module_id = m.id)
    and not exists (select 1 from _education_gen_jobs j where j.module_id = m.id::text and not j.collected)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','no empty published modules remaining'); end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('education_section_gen', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('module', v_mod.slug))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded', 'module', v_mod.slug);
  end if;

  if v_provider = 'anthropic' then
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',8000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                  || E'\nTRACK: ' || coalesce(v_mod.track,'')
                  || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',8000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',
              E'MODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))
          )),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'openai'
    );
  else
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
            E'MODULE TITLE: ' || v_mod.title
            || E'\nTRACK: ' || coalesce(v_mod.track,'')
            || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',8000)
        ),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'module',v_mod.slug);
end;
$function$;

-- ── run_education_deep_regen ─────────────────────────────────────────────────
create or replace function public.run_education_deep_regen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_mod record;
  v_done int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are writing an in-depth professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- a seasoned practitioner explaining hard-won knowledge to a competent peer who wants genuine depth, not an overview.

Follow EXACTLY this five-section structure, each section 3500-6000 characters of substantive prose: 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways".

DEPTH REQUIREMENTS: Use concrete, illustrative specifics to teach -- worked numeric examples, realistic scenarios, specific decision criteria a practitioner actually applies, and step-by-step reasoning. For example, walk through an actual calculation, describe a representative timeline with rough durations, or trace a specific decision path. This makes the content genuinely useful rather than abstract.

HONESTY RULE (critical): When you use a specific number, timeline, cost, or scenario as a teaching example, frame it explicitly as illustrative -- e.g. "consider a distributor moving roughly 500kg per quarter", "a typical EU-GMP readiness timeline might run 12-18 months", "suppose a jurisdiction reports 40,000 registered patients". Do NOT present illustrative figures as verified current market data, and do NOT invent named real companies, fake citations, specific dated events, or statistics attributed to real sources. Illustrative examples = yes and encouraged; fabricated verified facts = never.

Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase: process ALL ready responses
  perform 1 from _education_regen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _education_regen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        declare v_arr jsonb;
        begin
          v_arr := safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g')));
          if jsonb_typeof(v_arr)='array' and jsonb_array_length(v_arr) = 5 then
            delete from education_module_sections where module_id = v_mod.module_id::uuid;
            insert into education_module_sections (module_id, section_order, heading, body, block_type)
            select v_mod.module_id::uuid, (s->>'section_order')::int, s->>'heading', s->>'body', 'text'
            from jsonb_array_elements(v_arr) s;
            update education_modules set content_review_status='ai_generated_pending_review', updated_at=now()
            where id = v_mod.module_id::uuid;
            v_done := v_done + 1;
          end if;
        end;
      end if;
      update _education_regen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','modules_regenerated', v_done);
  end if;

  -- FIRE phase: next un-regenerated published module
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and m.content_review_status is distinct from 'ai_generated_pending_review'
    and not exists (select 1 from _education_regen_jobs j where j.module_id = m.id::text)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','all published modules regenerated'); end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('education_deep_regen', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('module', v_mod.slug))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded', 'module', v_mod.slug);
  end if;

  if v_provider = 'anthropic' then
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',12000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                  || E'\nTRACK: ' || coalesce(v_mod.track,'')
                  || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',12000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',
              E'MODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))
          )),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'openai'
    );
  else
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
            E'MODULE TITLE: ' || v_mod.title
            || E'\nTRACK: ' || coalesce(v_mod.track,'')
            || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',12000)
        ),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'module',v_mod.slug);
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713221555','enrichment_llm_fallback_extension','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713221555_enrichment_llm_fallback_extension.sql

-- RECOVERY BEGIN 20260713221946_enrichment_llm_fallback_extension.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713221946.
--
-- Rewriting this file cannot affect production: 20260713221946 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Extends the Anthropic -> OpenAI -> Gemini circuit-breaker fallback (see
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql for the
-- digest port, and 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql
-- for the original pattern) to the four remaining Anthropic-only, no-fallback
-- functions identified during that investigation:
--   - run_country_intel_enrichment
--   - run_counterparty_enrichment
--   - run_education_section_gen
--   - run_education_deep_regen
-- Each is functionally unchanged except: (1) key decryption for all three
-- providers, (2) response parsing generalized to accept any of the three
-- providers' JSON shapes, (3) the same per-provider circuit-breaker selection
-- already used elsewhere, (4) a provider-branched net.http_post at fire time,
-- and (5) a write to pipeline_manual_review_queue when every provider is
-- circuit-broken. Anthropic stays tier 1 with its original model; OpenAI
-- (gpt-4o-mini) and Gemini (gemini-flash-latest) fallback tiers match the
-- models already in use for run_signal_extraction and the digest functions.

alter table public._counterparty_enrich_jobs add column if not exists provider text;
alter table public._country_enrich_jobs add column if not exists provider text;
alter table public._education_regen_jobs add column if not exists provider text;
alter table public._education_gen_jobs add column if not exists provider text;

-- ── run_counterparty_enrichment ───────────────────────────────────────────────
create or replace function public.run_counterparty_enrichment()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_ids text[];
  v_updated int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are a B2B cannabis market intelligence analyst for Harbourview. Below is a JSON array of trading counterparties (sellers, buyers, suppliers, distributors, importers, logistics providers). Each includes its role, markets, product categories, and REAL scored attributes derived from Harbourview''s relationship intelligence (certifications, market-access relevance, interaction history, score drivers). Using ONLY these provided facts (never invent company details, certifications, volumes, or relationships not present in the source material), write for each: (1) a "supply_profile" for sellers/suppliers/distributors/logistics (what they supply / their capabilities, 2-3 sentences) OR a "needs_profile" for buyers/importers (what they source / their requirements, 2-3 sentences). For a counterparty whose role is a seller-type, populate supply_profile and set needs_profile to null; for buyer-types, populate needs_profile and set supply_profile to null. Base every statement on the provided attributes -- if material is thin, write a shorter factual profile rather than embellishing. Return ONLY a JSON array (no markdown, no prose). Each element: {"id": string, "supply_profile": string|null, "needs_profile": string|null}.';
begin
  -- COLLECT phase
  perform 1 from _counterparty_enrich_jobs j where not j.collected;
  if found then
    update _counterparty_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text,
             r.status_code
      from _counterparty_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update ia_counterparties c set
        supply_profile = coalesce(nullif(trim(h->>'supply_profile'), ''), c.supply_profile),
        needs_profile  = coalesce(nullif(trim(h->>'needs_profile'), ''), c.needs_profile),
        last_profile_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where c.id = h->>'id'
      returning 1
    ),
    done as (
      update _counterparty_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_enriched', coalesce(v_updated, 0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  with targets as (
    select c.id, c.name, c.role, c.markets, c.categories
    from ia_counterparties c
    where c.last_profile_enriched_at is null
      and c.needs_profile is null and c.supply_profile is null
      and c.role in ('seller','buyer','supplier','distributor','importer','logistics_provider','packaging_supplier','consultant')
    limit 10
  ),
  material as (
    select t.id, t.name, t.role, t.markets, t.categories,
      (
        select jsonb_agg(distinct d)
        from ia_scoring_records sr, unnest(coalesce(sr.score_drivers, array[]::text[])) d
        where sr.counterparty_id = t.id
      ) as drivers,
      (
        select jsonb_agg(distinct m)
        from ia_scoring_records sr, unnest(coalesce(sr.market_access_relevance, array[]::text[])) m
        where sr.counterparty_id = t.id
      ) as market_access
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'role', role,
      'markets', to_jsonb(markets), 'categories', to_jsonb(categories),
      'score_drivers', coalesce(drivers, '[]'::jsonb),
      'market_access_relevance', coalesce(market_access, '[]'::jsonb)
    )),
    array_agg(id)
  into v_payload, v_ids
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unprofiled trading counterparties remaining');
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('counterparty_enrichment', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('candidates', jsonb_array_length(v_payload)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',3000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nCOUNTERPARTIES:\n' || v_payload::text))),
        timeout_milliseconds := 90000
      ), v_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',3000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'COUNTERPARTIES:\n' || v_payload::text)
          )),
        timeout_milliseconds := 90000
      ), v_ids, 'openai'
    );
  else
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTERPARTIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',3000)
        ),
        timeout_milliseconds := 90000
      ), v_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'counterparties_sent', jsonb_array_length(v_payload));
end;
$function$;

-- ── run_country_intel_enrichment ──────────────────────────────────────────────
create or replace function public.run_country_intel_enrichment()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_countries text[];
  v_updated int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are a cannabis regulatory intelligence editor for Harbourview, a B2B market intelligence platform. Below is a JSON array of countries, each with its current briefing and REAL source material: recently-captured intelligence signals and/or a researched market-entry playbook (legal framework, licensing steps, regulators, timeline, cost). Using ONLY the facts in the provided material (never invent facts, names, dates, or figures not present in the source material), write two things per country: (1) a richer "public_summary" (3-5 sentences, factual, no speculation, safe for a free public teaser page) and (2) a deeper "commercial_pathway_summary" (4-6 sentences, factual, covering licensing/market-entry/trade specifics found in the material) for a paid subscriber briefing. If the material does not support a claim, do not include it -- prefer being shorter and accurate over longer and speculative. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"country_code": string, "public_summary": string, "commercial_pathway_summary": string}.';
begin
  -- COLLECT phase
  perform 1 from _country_enrich_jobs j where not j.collected;
  if found then
    update _country_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.country_codes,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text,
             r.status_code
      from _country_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, country_codes, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, country_codes, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update country_intel ci set
        public_summary = coalesce(nullif(trim(h->>'public_summary'), ''), ci.public_summary),
        commercial_pathway_summary = coalesce(nullif(trim(h->>'commercial_pathway_summary'), ''), ci.commercial_pathway_summary),
        last_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where ci.country_code = h->>'country_code'
      returning 1
    ),
    done as (
      update _country_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'countries_enriched', coalesce(v_updated, 0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  with targets as (
    select ci.country_code, ci.country_name, ci.public_summary, ci.commercial_pathway_summary
    from country_intel ci
    where ci.last_enriched_at is null
      and (
        exists (select 1 from ia_signals s where s.market = ci.country_name and s.stage in ('qualified','converted_to_opportunity'))
        or exists (select 1 from signals sg where sg.country = ci.country_name)
        or exists (select 1 from jurisdiction_playbooks p where p.country_iso2 = ci.country_code and p.status = 'published')
      )
    limit 8
  ),
  material as (
    select t.country_code, t.country_name, t.public_summary, t.commercial_pathway_summary,
      (
        select jsonb_agg(jsonb_build_object('title', s.title, 'summary', s.summary, 'type', s.type, 'confidence', s.confidence))
        from (
          select title, summary, type, confidence from ia_signals
          where market = t.country_name and stage in ('qualified','converted_to_opportunity')
          order by confidence desc, created_at desc limit 6
        ) s
      ) as ia_material,
      (
        select jsonb_agg(jsonb_build_object('title', sg.headline, 'summary', sg.summary))
        from (
          select headline, summary from signals where country = t.country_name
          order by created_at desc limit 6
        ) sg
      ) as mature_material,
      (
        select jsonb_build_object(
                 'legal_framework', p.legal_framework_summary,
                 'difficulty', p.difficulty,
                 'typical_timeline_months', p.typical_timeline_months,
                 'estimated_cost_range', p.estimated_cost_range,
                 'steps', p.steps,
                 'key_regulators', p.key_regulators,
                 'common_pitfalls', p.common_pitfalls)
        from jurisdiction_playbooks p
        where p.country_iso2 = t.country_code and p.status = 'published'
        limit 1
      ) as playbook_material
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'country_code', country_code, 'country_name', country_name,
      'current_public_summary', public_summary, 'current_commercial_pathway_summary', commercial_pathway_summary,
      'signals', coalesce(ia_material, '[]'::jsonb) || coalesce(mature_material, '[]'::jsonb),
      'playbook', playbook_material
    )),
    array_agg(country_code)
  into v_payload, v_countries
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unenriched countries with real source material');
  end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('country_intel_enrichment', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('countries', jsonb_array_length(v_payload)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',4000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nCOUNTRIES:\n' || v_payload::text))),
        timeout_milliseconds := 90000
      ), v_countries, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',4000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'COUNTRIES:\n' || v_payload::text)
          )),
        timeout_milliseconds := 90000
      ), v_countries, 'openai'
    );
  else
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTRIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',4000)
        ),
        timeout_milliseconds := 90000
      ), v_countries, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'countries_sent', jsonb_array_length(v_payload));
end;
$function$;

-- ── run_education_section_gen ────────────────────────────────────────────────
create or replace function public.run_education_section_gen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_mod record;
  v_inserted int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are writing a professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- like a seasoned practitioner explaining hard-won knowledge to a competent peer. The module must follow EXACTLY this five-section structure, each section 1800-4000 characters of substantive prose (no bullet lists as the primary content, no headers within a section body): 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways". Ground everything in established, generally-accepted professional practice for the topic. Do NOT invent specific statistics, market-size figures, named companies, dates, or citations -- speak at the level of durable professional principle rather than fabricated specifics. Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase
  perform 1 from _education_gen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _education_gen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        with p as (select safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g'))) as arr),
        ins as (
          insert into education_module_sections (module_id, section_order, heading, body, block_type)
          select v_mod.module_id::uuid,
                 (s->>'section_order')::int,
                 s->>'heading',
                 s->>'body',
                 'text'
          from p, jsonb_array_elements(p.arr) s
          where jsonb_typeof(p.arr)='array'
            and not exists (select 1 from education_module_sections es where es.module_id = v_mod.module_id::uuid)
          returning 1
        )
        select count(*) from ins into v_inserted;
      end if;
      update _education_gen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','sections_inserted', v_inserted);
  end if;

  -- FIRE phase: one module per call
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and not exists (select 1 from education_module_sections s where s.module_id = m.id)
    and not exists (select 1 from _education_gen_jobs j where j.module_id = m.id::text and not j.collected)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','no empty published modules remaining'); end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('education_section_gen', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('module', v_mod.slug))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded', 'module', v_mod.slug);
  end if;

  if v_provider = 'anthropic' then
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',8000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                  || E'\nTRACK: ' || coalesce(v_mod.track,'')
                  || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',8000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',
              E'MODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))
          )),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'openai'
    );
  else
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
            E'MODULE TITLE: ' || v_mod.title
            || E'\nTRACK: ' || coalesce(v_mod.track,'')
            || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',8000)
        ),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'module',v_mod.slug);
end;
$function$;

-- ── run_education_deep_regen ─────────────────────────────────────────────────
create or replace function public.run_education_deep_regen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_mod record;
  v_done int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are writing an in-depth professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- a seasoned practitioner explaining hard-won knowledge to a competent peer who wants genuine depth, not an overview.

Follow EXACTLY this five-section structure, each section 3500-6000 characters of substantive prose: 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways".

DEPTH REQUIREMENTS: Use concrete, illustrative specifics to teach -- worked numeric examples, realistic scenarios, specific decision criteria a practitioner actually applies, and step-by-step reasoning. For example, walk through an actual calculation, describe a representative timeline with rough durations, or trace a specific decision path. This makes the content genuinely useful rather than abstract.

HONESTY RULE (critical): When you use a specific number, timeline, cost, or scenario as a teaching example, frame it explicitly as illustrative -- e.g. "consider a distributor moving roughly 500kg per quarter", "a typical EU-GMP readiness timeline might run 12-18 months", "suppose a jurisdiction reports 40,000 registered patients". Do NOT present illustrative figures as verified current market data, and do NOT invent named real companies, fake citations, specific dated events, or statistics attributed to real sources. Illustrative examples = yes and encouraged; fabricated verified facts = never.

Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase: process ALL ready responses
  perform 1 from _education_regen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _education_regen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        declare v_arr jsonb;
        begin
          v_arr := safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g')));
          if jsonb_typeof(v_arr)='array' and jsonb_array_length(v_arr) = 5 then
            delete from education_module_sections where module_id = v_mod.module_id::uuid;
            insert into education_module_sections (module_id, section_order, heading, body, block_type)
            select v_mod.module_id::uuid, (s->>'section_order')::int, s->>'heading', s->>'body', 'text'
            from jsonb_array_elements(v_arr) s;
            update education_modules set content_review_status='ai_generated_pending_review', updated_at=now()
            where id = v_mod.module_id::uuid;
            v_done := v_done + 1;
          end if;
        end;
      end if;
      update _education_regen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','modules_regenerated', v_done);
  end if;

  -- FIRE phase: next un-regenerated published module
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and m.content_review_status is distinct from 'ai_generated_pending_review'
    and not exists (select 1 from _education_regen_jobs j where j.module_id = m.id::text)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','all published modules regenerated'); end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('education_deep_regen', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('module', v_mod.slug))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded', 'module', v_mod.slug);
  end if;

  if v_provider = 'anthropic' then
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',12000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                  || E'\nTRACK: ' || coalesce(v_mod.track,'')
                  || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',12000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',
              E'MODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))
          )),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'openai'
    );
  else
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
            E'MODULE TITLE: ' || v_mod.title
            || E'\nTRACK: ' || coalesce(v_mod.track,'')
            || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',12000)
        ),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'module',v_mod.slug);
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713221946','enrichment_llm_fallback_extension','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713221946_enrichment_llm_fallback_extension.sql

-- RECOVERY BEGIN 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql
-- Root-caused the empty regulatory_signals.signals table (distinct from, and
-- unrelated to, the Anthropic billing outage fixed earlier this session --
-- this pipeline has no LLM call at all).
--
-- api."regulatory_signals.signals" is a security_invoker passthrough view
-- over regulatory_signals.signals, used by both the admin review UI
-- (lib/regulatory-signals/admin.ts) and the Fresh Regulatory Sources watcher's
-- write path (lib/regulatory-sources/runWatch.ts -> createDraftSignal). The
-- view was created before four columns were added to the base table
-- (source_url, source_published_at, private_summary, private_notes) and was
-- never refreshed. Every createDraftSignal() insert -- which always sets all
-- four -- has been failing with PostgREST's "column does not exist" error on
-- every single invocation since those columns were added. runRegulatoryWatch's
-- for-loop has no per-source try/catch, so this uncaught failure aborted the
-- entire daily cron run at the first source with a relevant item every time,
-- which is also why source_check_runs stayed empty and the same source
-- (Peru DIGEMID) kept getting re-checked instead of the registry rotating.
--
-- Safe to add these columns to this specific view: regulatory_signals.signals
-- has RLS enabled with exactly one policy (admin_all, gated on
-- user_roles.role = 'admin'), so a non-admin authenticated caller gets zero
-- rows regardless of which columns the view exposes -- this is an
-- admin/service-role-only draft-review surface, not a public one. Distinct
-- from regulatory_signals.public_signals, the actual curated public surface,
-- which is untouched here.
create or replace view api."regulatory_signals.signals"
  with (security_invoker = on)
  as select
    id,
    slug,
    source_id,
    headline,
    signal_type,
    confidence,
    impact_level,
    country_code,
    country_name,
    region,
    jurisdiction,
    regulator_name,
    signal_date,
    source_tier,
    source_type,
    canonical_source_url,
    raw_excerpt,
    analyst_notes,
    public_summary,
    public_implication,
    review_status,
    public_safe,
    publish_to_public,
    internal_only,
    requires_diligence,
    commercial_relevance,
    linked_country_slug,
    linked_product_category,
    reviewer_id,
    reviewed_at,
    published_at,
    last_reviewed_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    source_url,
    source_published_at,
    private_summary,
    private_notes,
    reviewed_by,
    approved_by,
    published_by
  from regulatory_signals.signals;

-- No GRANT statements needed: CREATE OR REPLACE VIEW preserves existing
-- privileges (postgres/service_role: full CRUD; authenticated: SELECT only)
-- since the OID and existing column set are unchanged, only extended.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713223057','fix_stale_regulatory_signals_signals_api_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql

-- RECOVERY BEGIN 20260713223137_fix_stale_regulatory_signals_signals_api_view.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260713223137.
--
-- Rewriting this file cannot affect production: 20260713223137 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Root-caused the empty regulatory_signals.signals table (distinct from, and
-- unrelated to, the Anthropic billing outage fixed earlier this session --
-- this pipeline has no LLM call at all).
--
-- api."regulatory_signals.signals" is a security_invoker passthrough view
-- over regulatory_signals.signals, used by both the admin review UI
-- (lib/regulatory-signals/admin.ts) and the Fresh Regulatory Sources watcher's
-- write path (lib/regulatory-sources/runWatch.ts -> createDraftSignal). The
-- view was created before four columns were added to the base table
-- (source_url, source_published_at, private_summary, private_notes) and was
-- never refreshed. Every createDraftSignal() insert -- which always sets all
-- four -- has been failing with PostgREST's "column does not exist" error on
-- every single invocation since those columns were added. runRegulatoryWatch's
-- for-loop has no per-source try/catch, so this uncaught failure aborted the
-- entire daily cron run at the first source with a relevant item every time,
-- which is also why source_check_runs stayed empty and the same source
-- (Peru DIGEMID) kept getting re-checked instead of the registry rotating.
--
-- Safe to add these columns to this specific view: regulatory_signals.signals
-- has RLS enabled with exactly one policy (admin_all, gated on
-- user_roles.role = 'admin'), so a non-admin authenticated caller gets zero
-- rows regardless of which columns the view exposes -- this is an
-- admin/service-role-only draft-review surface, not a public one. Distinct
-- from regulatory_signals.public_signals, the actual curated public surface,
-- which is untouched here.
create or replace view api."regulatory_signals.signals"
  with (security_invoker = on)
  as select
    id,
    slug,
    source_id,
    headline,
    signal_type,
    confidence,
    impact_level,
    country_code,
    country_name,
    region,
    jurisdiction,
    regulator_name,
    signal_date,
    source_tier,
    source_type,
    canonical_source_url,
    raw_excerpt,
    analyst_notes,
    public_summary,
    public_implication,
    review_status,
    public_safe,
    publish_to_public,
    internal_only,
    requires_diligence,
    commercial_relevance,
    linked_country_slug,
    linked_product_category,
    reviewer_id,
    reviewed_at,
    published_at,
    last_reviewed_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    source_url,
    source_published_at,
    private_summary,
    private_notes,
    reviewed_by,
    approved_by,
    published_by
  from regulatory_signals.signals;

-- No GRANT statements needed: CREATE OR REPLACE VIEW preserves existing
-- privileges (postgres/service_role: full CRUD; authenticated: SELECT only)
-- since the OID and existing column set are unchanged, only extended.;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260713223137','fix_stale_regulatory_signals_signals_api_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260713223137_fix_stale_regulatory_signals_signals_api_view.sql

-- RECOVERY BEGIN 20260714092852_regulatory_tier_airtable_pull_reconcile.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714092852.
--
-- Rewriting this file cannot affect production: 20260714092852 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Snapshot of the tier value we last observed in / pushed to Airtable, per country.
-- Lets the poller tell an Airtable-side human edit (at_tier != last_seen AND != current)
-- apart from an outbound echo (at_tier == current) without needing timestamps.
alter table public.countries add column if not exists airtable_last_seen_tier text;
update public.countries set airtable_last_seen_tier = regulatory_tier where airtable_last_seen_tier is null;

-- Reconcile a batch of {iso, tier} rows fetched from Airtable. service_role only.
create or replace function api.reconcile_airtable_tiers(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r         jsonb;
  v_iso     text;
  v_at_tier text;
  v_cur     text;
  v_seen    text;
  v_ps      text;
  v_pulled  text[] := '{}';
  v_marked  int := 0;
  v_valid   constant text[] := array['legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited'];
begin
  for r in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb))
  loop
    v_iso     := r->>'iso';
    v_at_tier := r->>'tier';
    if v_iso is null or v_at_tier is null then continue; end if;
    if not (v_at_tier = any(v_valid)) then continue; end if;

    select regulatory_tier, airtable_last_seen_tier into v_cur, v_seen
      from public.countries where iso_alpha2 = v_iso;
    if not found then continue; end if;

    -- Unchanged in Airtable since we last observed it -> nothing to do.
    if v_at_tier is not distinct from v_seen then
      continue;
    end if;

    if v_at_tier is distinct from v_cur then
      -- Genuine Airtable-originated edit -> pull it in (loop-guarded so it won't echo back).
      perform set_config('hv.sync_actor','airtable', true);
      select program_status into v_ps from public.cc_jurisdiction_briefings
        where country_iso2 = v_iso and jurisdiction_type = 'country';
      update public.countries set
        regulatory_tier = v_at_tier,
        regulatory_tier_origin = 'override',
        regulatory_tier_reviewed_at = now(),
        regulatory_tier_needs_review = false,
        regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_source = 'airtable poll ' || to_char(now(),'YYYY-MM-DD'),
        airtable_last_seen_tier = v_at_tier
      where iso_alpha2 = v_iso;
      insert into public.regulatory_tier_audit
        (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
      values
        (v_iso, v_cur, v_at_tier, 'override', 'airtable_poll', v_ps, 'airtable', 'Tier pulled from Airtable (poll)');
      v_pulled := v_pulled || v_iso;
    else
      -- at_tier == current Supabase tier but != last_seen: this is an outbound echo.
      -- Just advance the marker; no write to the tier, no audit.
      update public.countries set airtable_last_seen_tier = v_at_tier where iso_alpha2 = v_iso;
      v_marked := v_marked + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'pulled', to_jsonb(v_pulled),
    'pulled_count', coalesce(array_length(v_pulled,1),0),
    'echo_marked', v_marked
  );
end;
$function$;

comment on function api.reconcile_airtable_tiers(jsonb) is
  'Reconciles a batch of {iso,tier} rows read from Airtable: pulls genuine Airtable-side edits into Supabase (loop-guarded), advances the airtable_last_seen_tier marker for outbound echoes. service_role only.';

revoke all on function api.reconcile_airtable_tiers(jsonb) from public;
revoke all on function api.reconcile_airtable_tiers(jsonb) from anon;
revoke all on function api.reconcile_airtable_tiers(jsonb) from authenticated;
grant execute on function api.reconcile_airtable_tiers(jsonb) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714092852','regulatory_tier_airtable_pull_reconcile','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714092852_regulatory_tier_airtable_pull_reconcile.sql

-- RECOVERY BEGIN 20260714093329_regulatory_tier_airtable_pull_cron.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714093329.
--
-- Rewriting this file cannot affect production: 20260714093329 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Cron wrapper: invoke the Airtable pull poller. SECURITY DEFINER so pg_cron can read the vault key.
create or replace function public.run_airtable_tier_pull()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_key  text;
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'hv_airtable_sync_key';
  perform net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-airtable-tier-poller',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'x-hv-sync-key', v_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
end;
$function$;

comment on function public.run_airtable_tier_pull() is
  'pg_cron entrypoint: pulls Airtable regulatory-tier edits into Supabase via hv-airtable-tier-poller.';

-- Every 2 minutes. Idempotent: unschedule any prior job of the same name first.
select cron.unschedule('airtable-tier-pull')
  where exists (select 1 from cron.job where jobname = 'airtable-tier-pull');
select cron.schedule('airtable-tier-pull', '*/2 * * * *', 'select public.run_airtable_tier_pull();');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714093329','regulatory_tier_airtable_pull_cron','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714093329_regulatory_tier_airtable_pull_cron.sql

-- RECOVERY BEGIN 20260714094735_revert_regulatory_signals_orphaned_constraint_drift.sql
-- Reverts undocumented, out-of-band drift on regulatory_signals.signals
-- back to the original, git-tracked design in
-- 20260312000000_regulatory_signals_v1.sql.
--
-- Investigation (same session as the api view fix in
-- 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql): the
-- live schema had silently diverged from the original migration -- and from
-- every current application file that targets this table
-- (lib/regulatory-signals/types.ts, admin.ts, the Fresh Regulatory Sources
-- watcher) -- across a much wider surface than a single stale view:
--
--   - review_status CHECK: original 10-value set (captured/triaged/
--     needs_source_validation/in_review/approved_private/approved_public/
--     published/rejected/archived/expired) had narrowed to 5 values (draft/
--     in_review/published/archived/rejected), and the column default had
--     changed from 'captured' to 'draft'.
--   - signal_type CHECK: original 12-value set had been replaced with an
--     entirely different 18-value set (enforcement_action, policy_consultation,
--     legislation_change, quota_allocation, pharmaceutical_reclassification,
--     hemp_cbd_boundary, etc.) that appears nowhere else in this repository --
--     no migration, no TypeScript file, no doc -- so there is no basis to
--     treat it as an intentional redesign rather than orphaned drift.
--   - confidence CHECK: original allowed 'official_confirmed' (matching
--     types.ts); live allowed 'verified' instead.
--   - regulatory_signals_publication_gate was missing entirely -- this is the
--     constraint that prevents a row from being marked review_status=
--     'published' unless public_safe, publish_to_public, public_summary,
--     public_implication, canonical_source_url, and published_at are all
--     actually populated. Its absence is a real compliance safety-net gap on
--     a regulated-industry intelligence table, not just a cosmetic issue.
--   - regulatory_signals_slug_not_empty / _private_summary_not_empty /
--     _source_url_not_empty were also missing, and six columns (slug,
--     signal_date, source_tier, source_type, source_url, private_summary)
--     had lost their NOT NULL constraint (only headline retained it).
--
-- supabase_migrations.schema_migrations records a
-- "20260628230550_regulatory_signals_pipeline_missing_columns" migration as
-- applied on 2026-06-28, but there is no corresponding file for it anywhere
-- in the repo (not even the "applied directly to remote" stub pattern used
-- elsewhere for other remote-only migrations) -- the likely, though not
-- provable beyond this, source of the drift.
--
-- Safe to fully revert: regulatory_signals.signals has 0 rows (confirmed
-- live immediately before this migration), so no existing data can violate
-- any restored NOT NULL or CHECK constraint.

-- Converted to a no-op stub on 2026-07-19: re-running the ALTER/ADD
-- CONSTRAINT statements below fails ("constraint already exists") because
-- this exact restoration was already applied to production under the
-- neighboring version 20260714095121 (6 minutes later, same filename) --
-- confirmed live via pg_constraint that all 7 restored constraints
-- (review_status_check, type_check, confidence_check, slug_not_empty,
-- private_summary_not_empty, source_url_not_empty, publication_gate)
-- already exist exactly as this file defines them.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714094735','revert_regulatory_signals_orphaned_constraint_drift','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714094735_revert_regulatory_signals_orphaned_constraint_drift.sql

-- RECOVERY BEGIN 20260714102733_correct_wrongly_flipped_source_engine_reviewed.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714102733.
--
-- Rewriting this file cannot affect production: 20260714102733 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- ROOT-CAUSE FIX for the Intel/Signals feed quality problem.
--
-- Diagnosis (verified, not assumed):
--   * The feed readers (lib/regulatory-signals/public.ts, jurisdictionSynthesis,
--     dashboardServerData x3, dashboard/digest, dashboard/signals — 7+ consumers) all filter
--     signals on reviewed = true. reviewed=true is treated as "passed quality review".
--   * The ingest (promote_snapshot_to_signals) CORRECTLY inserts SOURCE_ENGINE rows with
--     reviewed = false. So the writer was never the problem.
--   * At some point on/before 2026-07-05, an untracked bulk UPDATE flipped 528 SOURCE_ENGINE
--     rows to reviewed = true. Their avg score (33) is LOWER than the unreviewed SOURCE_ENGINE
--     pool (41), so the flip did not select for quality — it was a mistake, not curation.
--   * Since 2026-07-06 (HAR-28 hardening disabled the old promote HTTP path), 4,146 new
--     SOURCE_ENGINE rows are all correctly reviewed = false and ZERO have been wrongly flipped.
--     The corruption source is already stopped; these 528 are stranded historical rows.
--   * signals has no reviewed_by/reviewed_at/curator column, so none of the 528 can represent a
--     tracked human review — they are unambiguously the bulk-flip artifacts.
--
-- Fix: restore the 528 wrongly-flipped SOURCE_ENGINE rows to reviewed = false (their original,
-- ingest-set value). This makes every reviewed=true reader correct simultaneously — the raw
-- scraper dumps (incl. the "--> STATUS AS AT" UN-treaty scrape) drop out of every feed at once,
-- while the ~75 genuinely-reviewed curated signals across all other categories are untouched.
--
-- Scope guard: ONLY SOURCE_ENGINE + reviewed=true. Never touches curated categories
-- (regulatory, financial, market, supply, intelligence, GAZETTE, etc.).

UPDATE public.signals
SET reviewed = false
WHERE cat = 'SOURCE_ENGINE'
  AND reviewed = true;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714102733','correct_wrongly_flipped_source_engine_reviewed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714102733_correct_wrongly_flipped_source_engine_reviewed.sql

-- RECOVERY BEGIN 20260714105740_country_name_normalization_alias_and_trigger.sql
-- Restore the exact production-owned body for migration 20260714105740.
-- The previous stub omitted public.country_name_aliases, which
-- 20260716195743 dereferences.

-- Fixes the country-matching bug found this session: fetchDashboardSignals()
-- does a plain lowercase exact-string match between signals.country and
-- countries.country_name, with no alias/ISO2 fallback. Confirmed 2,862
-- signals affected (USA:2611, UK:143, Turkiye:85, UAE:12, Czech Republic:8,
-- Democratic Republic of Congo:2, Turkey:1), dominated by USA -- the single
-- largest signal-producing country in the entire table.
--
-- Rather than patch the app-side JS comparison (which would need updating
-- at every call site, and there are multiple), this normalizes the DATA to
-- match countries.country_name exactly, so all existing exact-match code
-- just works with zero app changes. A trigger prevents recurrence, since
-- the extraction/scoring pipeline (LLM-driven) will keep naturally writing
-- colloquial forms like "USA" going forward.

CREATE TABLE IF NOT EXISTS public.country_name_aliases (
  alias TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.country_name_aliases IS
  'Maps colloquial/alternate country name spellings to the canonical countries.country_name value. Used by normalize_signal_country() to auto-correct signals.country on write, preventing the USA/United States-style silent country-filter mismatch found in the Jul 2026 audit.';

INSERT INTO public.country_name_aliases (alias, canonical_name) VALUES
  ('usa', 'United States'),
  ('us', 'United States'),
  ('u.s.', 'United States'),
  ('u.s.a.', 'United States'),
  ('america', 'United States'),
  ('united states of america', 'United States'),
  ('uk', 'United Kingdom'),
  ('u.k.', 'United Kingdom'),
  ('britain', 'United Kingdom'),
  ('great britain', 'United Kingdom'),
  ('turkiye', 'Türkiye'),
  ('turkey', 'Türkiye'),
  ('uae', 'United Arab Emirates'),
  ('u.a.e.', 'United Arab Emirates'),
  ('czech republic', 'Czechia'),
  ('democratic republic of congo', 'Democratic Republic of the Congo'),
  ('dr congo', 'Democratic Republic of the Congo'),
  ('drc', 'Democratic Republic of the Congo'),
  ('congo-kinshasa', 'Democratic Republic of the Congo'),
  ('congo-brazzaville', 'Republic of the Congo'),
  ('republic of congo', 'Republic of the Congo'),
  ('russian federation', 'Russia'),
  ('ivory coast', 'Cote d''Ivoire'),
  ('côte d''ivoire', 'Cote d''Ivoire'),
  ('cabo verde', 'Cape Verde'),
  ('swaziland', 'Eswatini'),
  ('macedonia', 'North Macedonia'),
  ('fyrom', 'North Macedonia'),
  ('burma', 'Myanmar'),
  ('holland', 'Netherlands'),
  ('vatican', 'Holy See'),
  ('vatican city', 'Holy See'),
  ('east timor', 'Timor-Leste'),
  ('bosnia', 'Bosnia and Herzegovina'),
  ('trinidad', 'Trinidad and Tobago'),
  ('saint vincent', 'Saint Vincent and the Grenadines'),
  ('st. lucia', 'Saint Lucia'),
  ('st lucia', 'Saint Lucia'),
  ('st. kitts and nevis', 'Saint Kitts and Nevis'),
  ('st kitts and nevis', 'Saint Kitts and Nevis'),
  ('antigua', 'Antigua and Barbuda'),
  ('palestinian territories', 'Palestine'),
  ('palestinian territory', 'Palestine'),
  ('korea', 'South Korea'),
  ('republic of korea', 'South Korea'),
  ('dprk', 'North Korea')
ON CONFLICT (alias) DO NOTHING;

-- Normalization function + trigger: auto-corrects signals.country on every
-- future insert/update, so the extraction pipeline writing "USA" tomorrow
-- gets silently rewritten to "United States" before it ever hits the table.
CREATE OR REPLACE FUNCTION public.normalize_signal_country()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_canonical TEXT;
BEGIN
  IF NEW.country IS NOT NULL THEN
    SELECT canonical_name INTO v_canonical
    FROM public.country_name_aliases
    WHERE alias = lower(trim(NEW.country));

    IF v_canonical IS NOT NULL THEN
      NEW.country := v_canonical;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_normalize_signal_country ON public.signals;
CREATE TRIGGER trg_normalize_signal_country
  BEFORE INSERT OR UPDATE OF country ON public.signals
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_signal_country();

-- Retroactive fix: correct all existing signals right now.
UPDATE public.signals s
SET country = a.canonical_name
FROM public.country_name_aliases a
WHERE lower(trim(s.country)) = a.alias
  AND s.country IS DISTINCT FROM a.canonical_name;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714105740','country_name_normalization_alias_and_trigger','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714105740_country_name_normalization_alias_and_trigger.sql

-- RECOVERY BEGIN 20260714120000_create_intel_eval_set_stage0.sql
-- Restored 2026-08-05. This file was converted to a "SELECT 1" no-op on
-- 2026-07-20 because re-running its CREATE TABLE against production failed
-- with "relation already exists". That reasoning holds for a forward-only
-- apply against production, but it broke zero-state replay: the two
-- consumers immediately after this version, 20260714120100
-- (expose_intel_eval_set_via_api_schema) and 20260714120200
-- (add_intel_eval_structural_crosscheck), both dereference
-- public.intel_eval_set, which nothing in the repository then created.
--
-- The body below is the production-recorded statement for version
-- 20260714224152, the duplicate registration of this same migration applied
-- roughly six hours later the same day. It is restored here, at the earlier
-- version, because that is where replay needs the table to exist. Its
-- twenty-one columns are exactly the set the 2026-07-20 stub comment
-- attributed to this file. 20260714224152 stays a no-op: by the time replay
-- reaches it the table exists, and its plain CREATE TABLE would fail.

-- Stage 0 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md: the labeled evaluation set.
-- Reason: the live scorer (score_signal_from_snapshot) is inverted and cannot be trusted
-- as a quality proxy. Every later stage (classifier, promotion) must be validated against
-- human labels BEFORE being wired to anything (spec Section 6.2, guardrail #2).
-- Additive, isolated, reversible. Rollback: DROP TABLE public.intel_eval_set;
-- RLS enabled with NO policies => service_role/admin only (deny-by-default per DATABASE_CONTROL.md).

create table public.intel_eval_set (
  id                 uuid primary key default gen_random_uuid(),
  signal_id          text not null unique
                       references public.signals(id) on delete cascade,

  -- ── Human ground-truth labels (spec Section 6.1 contract) ──
  quality_label      text check (quality_label in
                       ('signal','boilerplate','spam','nav','duplicate')),
  content_type       text check (content_type in
                       ('regulatory','market','story','research','noise')),
  impact             text check (impact in ('high','medium','low')),
  label_notes        text,
  labeled_by         text,           -- 'human:<id>', mirrors spec 4.2 reviewed_by convention
  labeled_at         timestamptz,

  -- ── First-pass draft labels (assistant-suggested, kept SEPARATE from human truth) ──
  -- so precision/recall at Stage 2 can be computed on human-confirmed rows only, and so
  -- draft-vs-human agreement is measurable. Drafts NEVER count as ground truth.
  draft_quality_label text check (draft_quality_label in
                       ('signal','boilerplate','spam','nav','duplicate')),
  draft_content_type  text check (draft_content_type in
                       ('regulatory','market','story','research','noise')),
  draft_impact        text check (draft_impact in ('high','medium','low')),
  draft_reason        text,

  -- ── Workflow state ──
  label_status       text not null default 'unlabeled'
                       check (label_status in
                       ('unlabeled','drafted','confirmed','corrected','unlabelable')),

  -- ── Sample snapshot (self-contained: signals.score/lang/etc. will change under Stage 2+) ──
  sample_stratum     text not null,
  sample_batch       text not null default 'stage0-v1-20260714',
  score_at_sample    int4,
  lang_at_sample     text,
  country_at_sample  text,
  top_lane_at_sample text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.intel_eval_set enable row level security;

comment on table  public.intel_eval_set is
  'Stage 0 labeled evaluation set for the intelligence classifier. Human labels are ground truth; draft_* columns are assistant first-pass suggestions and are NOT ground truth. See docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 6.2.';
comment on column public.intel_eval_set.quality_label is 'Human ground-truth: signal|boilerplate|spam|nav|duplicate';
comment on column public.intel_eval_set.content_type  is 'Human ground-truth: regulatory|market|story|research|noise';
comment on column public.intel_eval_set.draft_quality_label is 'Assistant first-pass suggestion — never counts as ground truth';
comment on column public.intel_eval_set.label_status is 'unlabeled -> drafted -> confirmed|corrected; unlabelable = dead/empty source';

create index intel_eval_set_status_idx  on public.intel_eval_set (label_status);
create index intel_eval_set_stratum_idx on public.intel_eval_set (sample_stratum);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714120000','create_intel_eval_set_stage0','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714120000_create_intel_eval_set_stage0.sql

-- RECOVERY BEGIN 20260714120100_expose_intel_eval_set_via_api_schema.sql
-- Stage 0 support: PostgREST on this project exposes ONLY the `api` schema
-- (lib/supabase/env.ts SUPABASE_DB_SCHEMA='api'). public.intel_eval_set is
-- therefore unreachable by the app's admin data client without an api-schema
-- surface. This migration adds a read VIEW and a write RPC, service_role-only.
-- Reason: the Stage 0 admin labeling page needs a reachable read/write path.
-- Additive + reversible. Rollback:
--   drop function if exists api.save_intel_eval_label(text,text,text,text,text,text,boolean);
--   drop view if exists api.intel_eval_labeling;

-- Converted to a no-op stub on 2026-07-20: re-running the CREATE VIEW
-- below fails ("relation already exists"). Confirmed live via pg_views/
-- pg_proc that api.intel_eval_labeling and api.save_intel_eval_label
-- already exist -- the real work was already applied to production under
-- the neighboring version 20260714225601 (same filename).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714120100','expose_intel_eval_set_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714120100_expose_intel_eval_set_via_api_schema.sql

-- RECOVERY BEGIN 20260714120200_add_intel_eval_structural_crosscheck.sql
-- Stage 0 hardening: an INDEPENDENT, non-LLM structural heuristic that predicts
-- junk-vs-content from surface features of the snapshot text, computed in SQL.
-- Purpose: a second "annotator" whose errors are UNCORRELATED with the assistant
-- semantic labels by construction. Agreement => high confidence; disagreement =>
-- the row is genuinely ambiguous and is the priority human-adjudication queue.
-- This grades the set rather than self-asserting it (spec §9.2), given human
-- labeling is deferred by the owner.
-- Additive columns. Reversible:
--   alter table public.intel_eval_set
--     drop column struct_is_junk, drop column struct_reason, drop column needs_human;

alter table public.intel_eval_set
  add column if not exists struct_is_junk boolean,
  add column if not exists struct_reason  text,
  add column if not exists needs_human    boolean not null default false;

comment on column public.intel_eval_set.struct_is_junk is
  'Independent non-LLM heuristic: does surface structure look like nav/boilerplate/spam (true) vs real content (false)? Errors uncorrelated with the assistant semantic label by construction.';
comment on column public.intel_eval_set.needs_human is
  'true = structural heuristic disagrees with the assistant quality label (junk vs signal). Priority human-adjudication queue.';

-- Populate the heuristic from surface features of signals.summary.
with feats as (
  select e.signal_id,
    ( (s.summary ~* 'skip to content')::int
    + (s.summary ~* 'free ultimate|ai guide|\$1,750|laws by state')::int
    + (s.summary ~* 'link--with-arrow-block|data-component-id')::int
    + (s.summary ~* 'menu entrar|entrar/regist')::int
    + (s.summary ~* 'call 988|compulsive gambling|alcohol/drug helpline')::int
    + (s.summary ~* 'editorial picks|m&a tracker|press releases stay informed')::int
    + (s.summary ~* '(medical marijuana report: 20)(.|\n){0,120}(medical marijuana report: 20)')::int
    + (s.summary ~* 'polityka.*cookie|deklaracja dost|serwis bip')::int
    + (s.summary ~* 'certificate of (marijuana )?tax compliance|cannabis tracking system')::int
    ) as strong_hits,
    ( (s.summary ~* 'read more')::int
    + (s.summary ~* 'subscribe|newsletter')::int
    + (s.summary ~* 'facebooklink|youtubelink|linkedinlink|rsslink')::int
    + (s.summary ~* 'sign up|learn more')::int
    + (s.summary ~* 'privacy|cookie')::int
    + (s.summary ~* '\[email protected\]|@[a-z0-9.]+\.(gov|com|org)')::int
    + (s.summary ~* '[0-9]{3}[- ][0-9]{3}[- ][0-9]{4}')::int
    + (s.summary ~* 'all countries a.z|world cannabis legality map')::int
    ) as weak_hits
  from public.intel_eval_set e
  join public.signals s on s.id = e.signal_id
)
update public.intel_eval_set e set
  struct_is_junk = (f.strong_hits >= 1 or f.weak_hits >= 3),
  struct_reason  = 'strong=' || f.strong_hits || ' weak=' || f.weak_hits
from feats f
where e.signal_id = f.signal_id;

update public.intel_eval_set set needs_human =
  case
    when draft_quality_label = 'duplicate' then false
    when struct_is_junk = true  and draft_quality_label = 'signal' then true
    when struct_is_junk = false and draft_quality_label in ('nav','boilerplate','spam') then true
    else false
  end;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714120200','add_intel_eval_structural_crosscheck','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714120200_add_intel_eval_structural_crosscheck.sql

-- RECOVERY BEGIN 20260714120300_expose_needs_human_in_eval_view.sql
-- Widen the Stage 0 labeling view to surface the cross-check columns so the
-- review UI can flag disagreement rows for extra care during the full human pass.
-- (CREATE OR REPLACE cannot run cross-schema unqualified here; drop+recreate.)
-- Reversible: re-run the view body from expose_intel_eval_set_via_api_schema.
drop view if exists api.intel_eval_labeling;
create view api.intel_eval_labeling as
select
  e.id, e.signal_id,
  s.headline, s.summary, s.source, s.url,
  e.lang_at_sample, e.country_at_sample, e.score_at_sample, e.top_lane_at_sample,
  e.sample_stratum,
  e.draft_quality_label, e.draft_content_type, e.draft_impact, e.draft_reason,
  e.quality_label, e.content_type, e.impact, e.label_notes, e.labeled_by, e.labeled_at,
  e.label_status, e.updated_at,
  e.struct_is_junk, e.needs_human
from public.intel_eval_set e
join public.signals s on s.id = e.signal_id;

comment on view api.intel_eval_labeling is
  'Stage 0 labeling surface: intel_eval_set joined to signal content + cross-check flags. Admin/service-role only. Provenance (source/url) is admin-context only, never a public DTO.';

grant select on api.intel_eval_labeling to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714120300','expose_needs_human_in_eval_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714120300_expose_needs_human_in_eval_view.sql

-- RECOVERY BEGIN 20260714181723_relax_signal_quality_gate_remove_reviewed_requirement.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714181723.
--
-- Rewriting this file cannot affect production: 20260714181723 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fixes the second major gap found this session: signals_quality required
-- cat='SOURCE_ENGINE' rows to have reviewed=true, but the review UI that
-- exists in the app (app/admin/signals/review/page.tsx) is wired to a
-- completely different, empty schema (regulatory_signals.signals, 0 rows)
-- -- not public.signals. Result: 7,136 automated signals had literally no
-- path to ever being marked reviewed=true, so 0 of them ever appeared
-- anywhere in the product regardless of quality.
--
-- Per Tyler's decision: relax the gate rather than build a new review UI
-- right now. Kept the existing score >= 50 threshold (already calibrated
-- by whoever built the scoring function, part of the original view) and
-- simply dropped the reviewed=true requirement for SOURCE_ENGINE rows.
-- This is a score-distribution-informed choice, not an arbitrary number:
-- score >= 50 already existed as the intended quality bar in the original
-- view definition; only the redundant, unreachable reviewed check is removed.
--
-- Verified impact before applying: exactly 1,085 of 7,136 SOURCE_ENGINE
-- signals have score >= 50 and will now surface.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE cat <> 'SOURCE_ENGINE' OR (cat = 'SOURCE_ENGINE' AND score >= 50);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714181723','relax_signal_quality_gate_remove_reviewed_requirement','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714181723_relax_signal_quality_gate_remove_reviewed_requirement.sql

-- RECOVERY BEGIN 20260714181926_exclude_top_score_band_nav_chrome_pollution.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714181926.
--
-- Rewriting this file cannot affect production: 20260714181926 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Refines the score>=50 relaxation applied moments ago. Spot-checking the
-- newly-surfaced content found the score band 90-99 is dominated by site
-- navigation/footer chrome, not real content -- confirmed by comparing
-- multiple articles on the same source (e.g. Business of Cannabis): the
-- exact same nav-menu boilerplate ("BofC Awards 2026 Cannabis Europa...
-- Recent Searches Popular Searches") scored 99 on two unrelated articles,
-- while the genuine substantive prose from those same articles (Albania's
-- cultivation law text, Slovenia's JAZMP licensing detail) scored 30-70.
-- Likely cause: nav menus densely repeat topic-taxonomy keywords
-- ("cannabis regulation", "medical cannabis", etc) in a way that games a
-- keyword-density-based score, while natural prose doesn't.
--
-- The existing v_boilerplate filter in hv_extract_signals_from_captured_text
-- catches generic site-chrome phrases (cookie policy, sign in, etc) but not
-- a site's own internal topic-navigation menu -- a different, source-
-- specific pattern that a generic list can't anticipate.
--
-- Excluding score >= 90 drops only 64 of the 1,085 newly-surfaced signals
-- (keeping 1,021) and removes essentially all of the nav-chrome pollution
-- observed in spot checks.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE cat <> 'SOURCE_ENGINE' OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714181926','exclude_top_score_band_nav_chrome_pollution','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714181926_exclude_top_score_band_nav_chrome_pollution.sql

-- RECOVERY BEGIN 20260714190000_jurisdiction_playbooks_batch22a_sources.sql
-- Sources for jurisdiction_playbooks batch 22 (part A of B, see batch22b for
-- playbook content + market metrics). Split across two files due to payload size.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('International Bar Association — Regulatory evolution of medicinal cannabis and new hemp framework in Peru', 'https://www.ibanet.org/medicinal-cannabis-regulations-peru', 'Peru', 'PE', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law No. 32195 (Dec 2024) industrial hemp framework for cosmetics/food/textiles/construction, 27 registered cannabis-derived products (4 medicines, 23 natural products), regional leadership framing'),
  ('CMS Expert Guides — Cannabis law and legislation in Peru', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/peru', 'Peru', 'PE', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'State-exclusive growing/import/commercialization by default, Supreme Decree 004-2023-SA license category breakdown, criminal penalties 8-15 years unlicensed cultivation'),
  ('Herb.co — How to Buy Weed in Peru: Lima, Cusco and South America''s Shifting Cannabis Laws', 'https://herb.co/city-guides/buy-weed-peru', 'Peru', 'PE', 'Americas', 2, 'html_snapshot', 'quarterly', 'news', 'RENPUC patient registry process, foreign medical card non-recognition, Article 299 Penal Code 8g decriminalization threshold explained'),
  ('Harris Sliwoski Canna Law Blog — Peru: New Medical Cannabis Regs', 'https://harris-sliwoski.com/cannalawblog/peru-new-medical-cannabis-regs/', 'Peru', 'PE', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Droguerias/pharmaceutical laboratory licensing route, psychoactive/non-psychoactive 1% THC classification, DIGEMID import certificate requirement'),
  ('SKNIS (St. Kitts-Nevis Information Service) — AG Wilkin Explains Why Cannabis Cannot Be Fully Legalized Amid Global Banking Risks', 'https://sknis.gov.kn/2026/03/31/attorney-general-wilkin-explains-why-cannabis-cannot-be-fully-legalized-amid-global-banking-risks/', 'Saint Kitts and Nevis', 'KN', 'Americas', 1, 'html_snapshot', 'monthly', 'government_release', 'Official March 31 2026 National Assembly statement: correspondent banking relationship risk explicitly cited as reason full legalization is not feasible'),
  ('CannaCarib — Cannabis in St. Kitts and Nevis: Laws and Tourist Guide', 'https://www.cannacarib.net/saint-kitts-and-nevis/', 'Saint Kitts and Nevis', 'KN', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Medicinal Cannabis Authority launched April 2025, permit/licence application forms available April 2026, no walk-in dispensaries exist'),
  ('Cannabis Business Plans — St. Kitts and Nevis Cannabis Market', 'https://cannabusinessplans.com/st-kitts-and-nevis-cannabis-market/', 'Saint Kitts and Nevis', 'KN', 'Americas', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Cannabis Board formed 2021, Nov 2023 authority transferred Prime Minister to Minister of Agriculture, 2024 subcommittee structure for licensing rollout'),
  ('Leafwell — Is Marijuana Legal in Saint Kitts and Nevis?', 'https://leafwell.com/blog/is-marijuana-legal-in-saint-kitts-and-nevis', 'Saint Kitts and Nevis', 'KN', 'Americas', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Full regulatory timeline 2019 High Court ruling through 2023 Rastafari Rights Recognition Act and Freedom of Conscience Act'),
  ('Cannabis Clarity SKN — Public Education Campaign', 'https://cannabisclarityskn.com/', 'Saint Kitts and Nevis', 'KN', 'Americas', 1, 'html_snapshot', 'quarterly', 'government_release', 'Official government education portal: 56g/15g resin thresholds, 5-plant cultivation limit, EC$100 annual Rastafari registration fee waived pre-Dec 2026'),
  ('Herb.co — How to Buy Weed in Panama: Canal Zone, Bocas del Toro and the Central American Gray Area', 'https://herb.co/city-guides/buy-weed-panama', 'Panama', 'PA', 'Americas', 1, 'html_snapshot', 'quarterly', 'news', 'Full regulatory timeline Law 242 through Jan 2026 first pharmacy opening, Decree 6 (Apr 2025) multi-agency licensing rewrite, 2-year domestic cultivation transition period'),
  ('MMJDaily — Panama begins implementation of medical cannabis program after four-year delay', 'https://www.mmjdaily.com/article/9784434/panama-begins-implementation-of-medical-cannabis-program-after-four-year-delay/', 'Panama', 'PA', 'Americas', 1, 'html_snapshot', 'quarterly', 'news', 'April 2026: elimination of mandatory prescriber courses, removal of closed qualifying-conditions list, first Central American country to grant formal medicinal cannabis permits'),
  ('Wikipedia — Cannabis in Panama', 'https://en.wikipedia.org/wiki/Cannabis_in_Panama', 'Panama', 'PA', 'Americas', 2, 'html_snapshot', 'quarterly', 'reference', 'First cannabis-exclusive pharmacy opened 22 Jan 2026, 7 commercialization licenses issued, MINSA/MIDA joint cultivation oversight'),
  ('Lexology — Updates on the regulation of medical cannabis in Panama', 'https://www.lexology.com/library/detail.aspx?g=d3c2571f-ad60-45da-a53d-ef3d455f3c62', 'Panama', 'PA', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Resolution 212 of 2025 sanitary registration exemption requirements for THC and CBD products'),
  ('Cannabisregulations.ai — Is Weed Legal in Panama? 2026 Medical Cannabis Law Guide', 'https://www.cannabisregulations.ai/country-legality/panama-marijuana', 'Panama', 'PA', 'Americas', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Seven license categories under Law 242, five-year licence term, Panamanian-majority ownership requirement for cultivation, no domestic finished product at scale as of 2025'),
  ('Jamaica Observer — New cannabis rules remove barriers for small farmers, says CLA head', 'https://www.jamaicaobserver.com/2026/04/18/new-cannabis-rules-remove-barriers-small-farmers-says-cla-head/', 'Jamaica', 'JM', 'Americas', 1, 'html_snapshot', 'monthly', 'news', 'April 2026 CLA CEO Farrah Blake direct quotes: standardized 3-year licence tenure, employee ID cards, special community permit with no application fee'),
  ('Jamaica Gleaner — Clarendon ganja growers urged to tap into new licensing arrangements', 'https://www.jamaica-gleaner.com/article/news/20260706/clarendon-ganja-growers-urged-tap-new-licensing-arrangements', 'Jamaica', 'JM', 'Americas', 2, 'html_snapshot', 'monthly', 'news', 'March 2026 Minister Aubyn Hill statement on finalizing licensing regulation amendments, community cultivation model up to 10 acres, banking access still unresolved'),
  ('Cannabis Licensing Authority of Jamaica — About the Authority', 'https://cla.gov.jm/page/about-authority', 'Jamaica', 'JM', 'Americas', 1, 'html_snapshot', 'quarterly', 'government_release', 'Official CLA mandate under Dangerous Drug Amendment Act 2015, ISO 9001:2015 QMS, indigenous strain/cultivar IP strategy, religious use excluded from CLA jurisdiction (Ministry of Justice)'),
  ('LegalClarity — Is Marijuana Legal in Jamaica? Decriminalization Facts', 'https://legalclarity.org/what-are-the-current-marijuana-laws-in-jamaica/', 'Jamaica', 'JM', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Licensing fee schedule: commercial cultivation US$2-3k/year, herb house/retail US$2,500/year, application fees US$300 individual/US$500 company'),
  ('CannaCarib — How Tourists Legally Buy Weed at Jamaica''s Herb Houses (2026 Permit Guide)', 'https://www.cannacarib.net/jamaica/', 'Jamaica', 'JM', 'Americas', 2, 'html_snapshot', 'quarterly', 'news', 'Therapeutic Cannabis Permit for Visitors process, named licensed herb house chains, 2oz/56g decriminalization threshold, 5-plant home cultivation limit')
ON CONFLICT DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714190000','jurisdiction_playbooks_batch22a_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714190000_jurisdiction_playbooks_batch22a_sources.sql
