-- Research batch 11 of jurisdiction_playbooks: Croatia, Cuba, Cyprus, DRC.
-- Croatia required discarding a fabricated "2026 Drug Reform Act" claim (full
-- recreational legalization + tourist dispensaries) contradicted by every other
-- source. DRC is flagged 'needs_review' (draft, not published): sources directly
-- conflict on whether a real medical/industrial cannabis licensing framework
-- exists (Wikipedia + named licensees) versus full illegality (multiple other
-- guides), and a peer-reviewed review could not access DRC's provisions at all.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Croatia', 'https://en.wikipedia.org/wiki/Cannabis_in_Croatia', 'Croatia', 'HR', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', 'April 2025 domestic licensed production update, 2013 decriminalization detail'),
  ('Leafwell — Is Marijuana Legal in Croatia', 'https://leafwell.com/blog/is-marijuana-legal-in-croatia', 'Croatia', 'HR', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '7.5g/30-day medical dose cap, no MMJ card recognition'),
  ('Hemp King — Croatia and Hemp Law (CBD and THC)', 'https://hempking.eu/en/croatia-and-hemp-law-cbd-and-thc/', 'Croatia', 'HR', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2019 amendment removing Cannabis Sativa L from narcotics list, Ministry of Agriculture oversight'),
  ('Wikipedia — Cannabis in Cuba', 'https://en.wikipedia.org/wiki/Cannabis_in_Cuba', 'Cuba', 'CU', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', 'Penalty structure, death-penalty moratorium since 2003'),
  ('CannaCarib — Cannabis in Cuba', 'https://www.cannacarib.net/cuba/', 'Cuba', 'CU', 'Caribbean', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2022/2023 revised Penal Code confirmation, no reform indication'),
  ('High Life Global — Is Cannabis Legal in Cyprus', 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-cyprus/', 'Cyprus', 'CY', 'Europe', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2026 framing: medical/hemp regulated, recreational illegal'),
  ('Leafwell — Is Marijuana Legal in Cyprus', 'https://leafwell.com/blog/is-marijuana-legal-in-cyprus', 'Cyprus', 'CY', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Confirms legal-but-inaccessible medical program gap'),
  ('CannabisRegulations.ai — Cyprus CBD', 'https://www.cannabisregulations.ai/country-legality/cyprus-cbd', 'Cyprus', 'CY', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Cyprus Drugs Council/Pharmaceutical Services CBD oversight, Epidyolex GeSY reimbursement'),
  ('Wikipedia — Cannabis in the Democratic Republic of the Congo', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Democratic_Republic_of_the_Congo', 'Democratic Republic of the Congo', 'CD', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Feb 2021 legalization directive, TMIG/Instadose Pharma DRC license — CONFLICTS with other sources claiming full illegality'),
  ('PMC — Status and Impacts of Cannabis Policies in Africa (systematic review)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9225416/', 'Democratic Republic of the Congo', 'CD', 'Africa', 1, 'html_snapshot', 'quarterly', 'academic', 'Peer-reviewed: DRC provisions "not accessible" through research method; notes 2017 EXMceuticals license despite no official government announcement'),
  ('LegalityLens — Is Cannabis Legal in DRC', 'https://legalitylens.com/is-cannabis-legal-in-democratic-republic-of-the-congo/', 'Democratic Republic of the Congo', 'CD', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Claims full illegality, no medical program — CONFLICTS with Wikipedia')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Domestic licensed medical cannabis production began April 2025 under specific commercial licensing (details of fee schedule not widely published); CBD/hemp businesses face standard EU agricultural registration costs; recreational-adjacent tourist retail does not exist',
  legal_framework_summary = 'Recreational cannabis is illegal in Croatia but decriminalized for personal use since 2013 — small-quantity possession is a misdemeanor carrying a fine of roughly HRK 5,000-20,000 (EUR 664-2,654), while cultivation or sale for profit remains a felony carrying a mandatory minimum 3-year prison sentence. Medical cannabis has been legal since October 2015 for a defined list of conditions (multiple sclerosis, cancer, AIDS, and others), accessed only via specialist-referred prescription through pharmacies, capped at 7.5 grams of THC per 30-day supply; Croatia does not recognize foreign medical cannabis cards. From April 2025, licensed domestic companies have been permitted to produce medical cannabis, which is expected to reduce costs and reliance on imports/black market. Separately, a 2019 amendment removed Cannabis Sativa L. from the narcotics list and shifted hemp oversight from the Ministry of Health to the Ministry of Agriculture, legalizing cultivation, processing, and sale of hemp/CBD products under 0.2% THC as an ordinary agricultural commodity. A "Lex Cannabis" bill proposing full recreational legalization was introduced in 2020 and has generated ongoing political discussion, but has not been enacted.',
  steps = '[{"step":"CBD/hemp route","detail":"Register as an agricultural/commercial operator under Ministry of Agriculture oversight; products must test at or below 0.2% THC and are sold as an ordinary commodity, not a controlled substance"},{"step":"Medical cannabis route","detail":"As of April 2025, apply for domestic production licensing to supply the prescription-only medical channel; patient access remains specialist-referral-only with a 7.5g/30-day THC dose cap"},{"step":"Do not assume recreational legalization","detail":"The 2020 Lex Cannabis bill for full recreational legalization remains unenacted; personal possession is decriminalized (fine-only) but there is no legal retail or tourist market"}]'::jsonb,
  key_regulators = '["Ministry of Health (medical cannabis prescribing framework)","Ministry of Agriculture (hemp/CBD oversight since 2019)","Croatian police (decriminalized-possession fine enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on a fabricated claim of a sweeping 2026 "Drug Reform Act" with tourist dispensaries and full recreational legalization — this claim appeared in one low-quality source and is directly contradicted by every other source, including ones from the same month; no such reform has passed',
    'Assuming foreign medical cannabis cards are recognized — Croatia requires its own specialist-referral prescription process and does not honor foreign MMJ cards',
    'Assuming decriminalization means a legal retail market exists — there are no dispensaries or legal recreational retail channels; only personal possession carries reduced (fine-only) penalties'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the well-corroborated decriminalization/medical/hemp framework; a single fabricated source claiming full 2026 recreational legalization was identified and explicitly discarded',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Croatia')
WHERE country_iso2 = 'HR';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is entirely illegal in Cuba for recreational, medical, and industrial purposes under the revised Penal Code (Law No. 151 of 2022), with no exceptions and no signs of reform. Possession carries roughly 6 months to 3 years imprisonment; cultivation, production, and transit of larger quantities carry 4 to 20 years; international trafficking carries 15 to 30 years or, in the most severe cases, a death sentence — though Cuba has maintained a de facto moratorium on executions since its last one in April 2003. Import and export are prohibited, with no hemp or medical cannabis import channel of any kind; customs at international airports actively screens for and seizes cannabis, including CBD products, treating undeclared items the same regardless of THC content. Foreign nationals receive no special treatment. Despite strict enforcement, an underground market persists, particularly low-grade "brick weed," reflecting genuine domestic demand alongside zero legal supply.',
  steps = '[]'::jsonb,
  key_regulators = '["Cuban National Revolutionary Police","Customs (Aduana General de la República) — active screening at international airports"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming any CBD or hemp exception exists — Cuba draws no distinction between CBD and THC-containing cannabis; both are equally prohibited with no import channel',
    'Assuming regional liberalization trends (Jamaica, US states, Mexico) create any pressure for Cuban reform — the government has shown no indication of policy change and diplomatic/enforcement cooperation with the US on drug issues has been reported as strained or paused',
    'Underestimating cultivation penalties specifically — 4 to 20 years applies even for domestically-oriented small-scale growing operations, not just large trafficking rings'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — overwhelming, near-unanimous corroboration across more than a dozen independent sources with no meaningful conflicts on the core prohibition or penalty structure',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Cuba')
WHERE country_iso2 = 'CU';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Not standardized in public sources; EU single-market membership lets Cyprus-based cannabis firms passport services across the EU without separate national approval in each state, which materially lowers the effective cost of pan-EU market access relative to a non-EU production base',
  legal_framework_summary = 'Recreational cannabis is illegal in Cyprus and classified as a Class B substance under the Narcotic Drugs and Psychotropic Substances Law of 1977, carrying penalties up to 8 years imprisonment for possession (reduced to up to 2 years for offenders under 25). Medical cannabis was first legalized in January 2017 for advanced-stage cancer patients, then substantially expanded in February/April 2019 to cover additional conditions (chronic pain associated with cancer, HIV, degenerative motor-system diseases, rheumatism, neuropathy, glaucoma, Tourette''s syndrome, and Crohn''s disease) and to legalize cultivation, manufacture, import, and export. Despite this legal framework being in place since 2019, multiple independent 2026 sources consistently confirm that a functioning patient-access system was still not fully operational — patients could not routinely obtain certification or products through ordinary channels, with access effectively limited to exceptional Minister of Health approval on a case-by-case basis. Cyprus has a genuine climate advantage for cultivation and, as an EU member, can passport medical cannabis production/services across the EU single market. CBD products under 0.2% THC are widely and legally sold in pharmacies and specialty shops, regulated by the Cyprus Drugs Council and Ministry of Health, with ingestibles subject to EU Novel Food rules and Epidyolex reimbursed through the General Healthcare System (GeSY).',
  steps = '[{"step":"CBD retail route","detail":"Source EU-approved hemp-derived CBD under 0.2% THC; ingestible products must comply with EU Novel Food Regulation (EU) 2015/2283 and the Foodstuffs Law"},{"step":"Medical cultivation/export route","detail":"Apply under the 2019 legal framework for cultivation, manufacture, import, or export licensing — Cyprus''s EU membership and favorable climate make it attractive for pan-EU medical cannabis production, though the domestic patient-access system remains underdeveloped"},{"step":"Do not plan around domestic patient volume","detail":"Multiple 2026 sources confirm ordinary patients still cannot easily obtain certification or product through the legal medical framework; a market-entry plan premised on domestic dispensing volume is currently unrealistic"}]'::jsonb,
  key_regulators = '["Ministry of Health — Advisory Committee on Medical Cannabis Regulation","Cyprus Drugs Council","Pharmaceutical Services (medical-claim products, Epidyolex/GeSY reimbursement)","Cyprus Police (Class B enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2019 medical legalization means patients can currently access cannabis through ordinary prescription channels — multiple 2026 sources confirm this remains effectively non-operational for most patients, with access limited to exceptional Minister of Health approval',
    'Assuming CBD is an unregulated loophole — CBD oils in particular are treated as controlled and may only be sold through pharmacies in certain circumstances; product composition and point of sale still matter',
    'Overlooking the EU passporting advantage — a Cyprus-based licensed operation can potentially serve other EU markets without separate national approval, a structural advantage worth building into any market-entry plan'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — the legal-but-not-yet-operational medical program is consistently confirmed across multiple independent 2026 sources rather than being a source conflict; this is a stable, well-documented implementation gap',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Cyprus')
WHERE country_iso2 = 'CY';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 12,
  estimated_cost_range = 'Unresolved pending verification of which legal status is accurate (see confidence note) — if a genuine industrial/medical licensing framework exists per the Feb 2021 directive, costs would follow a pharmaceutical-grade licensing model similar to at least one confirmed international licensee (TMIG/Instadose Pharma DRC)',
  legal_framework_summary = 'The legal status of cannabis in the DRC is genuinely disputed across available sources and requires verification before being treated as settled. Wikipedia states that on February 27, 2021, the DRC enacted legislation establishing conditions for narcotics and psychotropic substances "exclusively for purposes that are medical, educational or scientific," legalizing cannabis for industrial, medicinal, and scientific use (recreational use remaining illegal), and that the first cultivation/export license under this framework was granted to TMIG/Instadose Pharma DRC. A peer-reviewed systematic review of African cannabis policy separately notes that a Canadian company, EXMceuticals, became licensed to grow psychotropic cannabis in the DRC as of 2017, despite no official government announcement — suggesting real licensing activity occurred with limited public transparency. However, multiple independent legal-guide sources (dated as recently as 2025-2026) instead describe cannabis, including CBD and medical use, as fully illegal in the DRC with no legal framework of any kind, and the same peer-reviewed review notes that DRC''s cannabis provisions were "not accessible" through its standard research method — indicating the underlying legal texts are difficult to verify even for academic researchers. Recreational use, regardless of which version is accurate, is illegal, and cannabis remains widely cultivated as a rural cash crop, particularly in Kasai, Bandundu, and Lower Congo provinces, with major trafficking routes through Ndjili International Airport (Kinshasa) and the port of Matadi.',
  steps = '[{"step":"Verify current legal status before proceeding","detail":"Given the direct conflict between sources describing a real medical/industrial/scientific licensing framework (with named licensees) versus sources describing blanket illegality, confirm the current status through direct engagement with DRC''s Ministry of Health or a local legal counsel before any commercial planning"},{"step":"If the licensing framework is confirmed active","detail":"Pursue cultivation/export licensing following the pattern of confirmed licensees (TMIG/Instadose Pharma DRC, EXMceuticals) — both entered via industrial/scientific-use channels rather than domestic retail"}]'::jsonb,
  key_regulators = '["Ministry of Health (per the disputed Feb 2021 directive)","DRC national police and judicial enforcement (recreational-use prohibition, uncontested across all sources)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating either version of DRC''s legal status as settled without independent verification — sources directly conflict on whether a real medical/industrial cannabis legal framework exists, and even a peer-reviewed academic review could not access DRC''s specific provisions',
    'Assuming recreational cannabis is legal under any interpretation — all sources agree recreational use remains illegal regardless of the industrial/medical framework dispute',
    'Assuming rural cultivation prevalence signals legal tolerance — cultivation is a significant informal cash crop but this does not resolve the question of a formal licensing framework''s existence or accessibility'
  ],
  status = 'draft', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — sources directly conflict on the core question of whether a genuine legal industrial/medical cannabis framework exists in the DRC; flagged for verification against DRC government sources or direct legal counsel before treating either version as authoritative',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_the_Democratic_Republic_of_the_Congo')
WHERE country_iso2 = 'CD';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('HR','CU','CY');

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'needs_review', last_researched_at = now(), last_researched_by = 'claude-agent',
    research_notes = 'Sources directly conflict on whether DRC has a real, active medical/industrial/scientific cannabis licensing framework (Wikipedia + named licensees TMIG/Instadose Pharma DRC, EXMceuticals) versus full illegality with no framework (multiple 2025-2026 legal guides). A peer-reviewed systematic review notes DRC provisions were not accessible through standard research methods. Needs verification via DRC Ministry of Health or local counsel.'
WHERE country_code = 'CD';
