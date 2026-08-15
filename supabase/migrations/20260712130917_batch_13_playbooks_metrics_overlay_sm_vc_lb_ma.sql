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
