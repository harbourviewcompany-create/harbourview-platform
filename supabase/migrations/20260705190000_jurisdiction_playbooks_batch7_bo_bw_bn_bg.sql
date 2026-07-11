-- Research batch 7 of jurisdiction_playbooks: Bolivia, Botswana, Brunei, Bulgaria.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Bolivia', 'https://en.wikipedia.org/wiki/Cannabis_in_Bolivia', 'Bolivia', 'BO', 'Latin America', 2, 'html_snapshot', 'quarterly', 'reference', 'Ley 1008 (1988) penalty structure, treated equal to cocaine'),
  ('Leafwell — Is Marijuana Legal in Bolivia', 'https://leafwell.com/blog/is-marijuana-legal-in-bolivia', 'Bolivia', 'BO', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 913 (2017) sovereignty reform context, cultivation penalties'),
  ('CannabisRegulations.ai — Bolivia', 'https://www.cannabisregulations.ai/country-legality/bolivia-marijuana', 'Bolivia', 'BO', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Article 49 treatment-alternative provision, no medical law enacted as of 2026'),
  ('High Life Global — Is Cannabis Legal in Botswana 2026', 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-botswana/', 'Botswana', 'BW', 'Africa', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Cannabis Bill 2025 passage, recreational still illegal'),
  ('CannaReporter — Botswana high licensing fees', 'https://cannareporter.eu/en/2026/02/04/botswana-elevadas-taxas-de-licenciamento-ameacam-mercado-justo-para-o-canhamo-e-a-canabis-medicinal/', 'Botswana', 'BW', 'Africa', 2, 'html_snapshot', 'monthly', 'trade_press', 'Specific fee figures by license category, equity criticism'),
  ('Hemp Today — Botswana industrial cannabis regulations', 'https://hemptoday.net/botswana-government-says-it-will-support-hemp-after-issuing-strict-regulations/', 'Botswana', 'BW', 'Africa', 2, 'html_snapshot', 'monthly', 'trade_press', '0.7% THC industrial cannabis definition, real license example, President Boko agenda'),
  ('Tripbase — Brunei drug laws 2026', 'https://www.tripbase.com/drug-laws/brunei/', 'Brunei', 'BN', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '500g trafficking threshold, penalty tiers, citing Misuse of Drugs Act directly'),
  ('Brunei Narcotics Control Bureau — Drug Laws (official)', 'https://www.narcotics.gov.bn/SitePages/Drug%20Laws.aspx', 'Brunei', 'BN', 'Asia', 1, 'html_snapshot', 'quarterly', 'regulator_official', 'Official confirmation Misuse of Drugs Act is primary legislation'),
  ('Wikipedia — Cannabis in Brunei', 'https://en.wikipedia.org/wiki/Cannabis_in_Brunei', 'Brunei', 'BN', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2013 Act cultivation penalties, documented death sentence cases'),
  ('CMS Expert Guides — Cannabis law and legislation in Bulgaria', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bulgaria', 'Bulgaria', 'BG', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'NSPCA framework, licensed hemp cultivation conditions, doctor liability'),
  ('CannabisRegulations.ai — Bulgaria', 'https://www.cannabisregulations.ai/country-legality/bulgaria-marijuana', 'Bulgaria', 'BG', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Penal Code Art 354a/354c penalty ranges, regulator names'),
  ('Cannigma — Cannabis laws in Bulgaria', 'https://cannigma.com/regulation/cannabis-laws-in-bulgaria/', 'Bulgaria', 'BG', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', '2019 CBD-as-traditional-food classification, first EU country to allow CBD sale')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, possession, and sale of cannabis are illegal in Bolivia under Ley 1008 (1988), the Anti-Drug Law, which treats cannabis with the same severity as cocaine: possession of even one gram can carry a 10-25 year prison sentence, and manufacturing carries 5-15 years. Cultivation specifically (sowing, harvesting, gathering) carries 1-2 years for a first offense, with longer sentences for repeat offenders. Article 49 allows judges discretion to order treatment rather than incarceration for first-time personal users, though this is not a decriminalization and remains rarely applied in practice. Law 913 (2017) reasserted Bolivian sovereignty over drug policy and shifted rhetoric toward public health and human rights, but made no changes to cannabis-specific penalties. Medical cannabis legislation has been repeatedly debated in the Asamblea Legislativa Plurinacional (including a 2023 public debate) but no bill has been enacted as of 2026; CBD import and use are equally prohibited, with no cannabinoid medicines available even in pharmacies.',
  steps = '[]'::jsonb,
  key_regulators = '["Consejo Nacional de Lucha Contra el Trafico Ilicito de Drogas (CONALTID)","Fuerza Especial de Lucha Contra el Narcotrafico (FELCN)","Ministerio de Gobierno"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Article 49''s treatment-alternative provision amounts to decriminalization — it is narrow judicial discretion for first-time personal users, not a legal exemption, and possession remains criminalized regardless of quantity',
    'Assuming Law 913 (2017) softened cannabis penalties — it reasserted sovereignty and public-health framing but did not change cannabis-specific sentences',
    'Bringing CBD products into Bolivia expecting leniency — CBD is treated as a controlled-substance derivative with no THC-content exemption, and personal shipments are routinely seized'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Wikipedia, legal-analysis, and reform-tracking sources; two lower-quality sources claiming a 2016 medical-cannabis law and a 50g decriminalization threshold were discarded as contradicted by the stronger multi-source consensus',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bolivia')
WHERE country_iso2 = 'BO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'Cultivation licenses range from roughly €214 to €534 per year for resident applicants; non-resident processing/manufacturing licenses can exceed €2 million per year — a fee structure widely criticized locally as excluding smallholder farmers',
  legal_framework_summary = 'Recreational cannabis remains illegal in Botswana under the Drugs and Related Substances Act, but the country has moved decisively toward a regulated medicinal, scientific, and industrial framework: Parliament adopted a licit-use cannabis policy in April 2025 and passed the Cannabis Bill, 2025, tightly regulating cultivation, production, storage, distribution, import, and export strictly for medicinal, scientific, research, and industrial purposes. The regulations define "industrial cannabis" (rather than using a separate "hemp" category) with a THC cap of 0.7%, while both CBD and recreational marijuana remain illegal outside the licensed framework. Cultivation is restricted to licensed operators under specific categories (commercial growing, nurseries, seed production), with licenses issued for three-year terms subject to inspection and renewal. President Duma Boko''s government has framed the sector as part of an economic diversification strategy to reduce reliance on diamond exports, and has issued licenses to companies including Hemp Innovations Botswana (linked to a Swedish partner).',
  steps = '[{"step":"Choose a license category","detail":"Apply under one of the specific categories: commercial cultivation, nursery, seed production, processing/manufacturing, or dispensary (medicinal)"},{"step":"Meet the THC/product definition","detail":"Note Botswana uses \"industrial cannabis\" (THC capped at 0.7%) rather than a separate hemp category; CBD and recreational marijuana remain illegal regardless of licensing"},{"step":"Budget for steep licensing fees","detail":"Resident cultivation licenses run roughly €214-534/year; non-resident processing/manufacturing licenses can exceed €2 million/year — factor this into any market-entry model, especially partnership structures with non-resident entities"},{"step":"Plan for 3-year license terms","detail":"Licenses are subject to periodic inspection and renewal on a three-year cycle"}]'::jsonb,
  key_regulators = '["Ministry overseeing the Cannabis Bill 2025 licensing regime","Botswana University of Agriculture and Natural Resources (pilot trials)","Drugs and Related Substances Act enforcement bodies (recreational prohibition)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2025 reform legalized recreational or CBD use — it strictly covers medicinal, scientific, research, and industrial purposes; recreational cannabis and CBD remain illegal',
    'Underestimating licensing costs for non-resident partnerships — fees for non-resident processing/manufacturing licenses can exceed €2 million/year, and partnering with a non-resident entity can push a project into the highest fee tier',
    'Assuming smallholder or informal cultivation has a place in the new framework — cultivation is restricted to licensed operators only, and critics note the rules effectively exclude ordinary Batswana farmers'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across independent trade press, industry forums, and consistent reporting on the 2025 Cannabis Bill and licensing fee structure',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-botswana/')
WHERE country_iso2 = 'BW';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Brunei under the Misuse of Drugs Act (Chapter 27), with no medical or recreational exemption, and Brunei''s legal system is shaped by Sharia-Islamic principles under the Sultan. Possession of more than 500 grams of cannabis is presumed to be trafficking and carries the mandatory death penalty; smaller personal-possession amounts typically bring lengthy imprisonment (commonly cited around a 20-year minimum) plus caning. Cultivating cannabis carries 3 to 20 years imprisonment and/or a fine up to USD 40,000 under the 2013 Act provisions. While no executions for drug offenses are known to have been carried out in recent decades and Brunei is generally considered abolitionist in practice, the death sentence has been formally handed down in documented cases (2004 and 2017), and the law remains fully in force with no reform trajectory.',
  steps = '[]'::jsonb,
  key_regulators = '["Narcotics Control Bureau (NCB)","Royal Brunei Police Force"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the lack of recent executions signals de facto tolerance — the law remains fully enforced through long prison sentences, caning, and formal death sentences even without carried-out executions',
    'Underestimating the trafficking threshold — possession of just over 500 grams triggers a presumption of trafficking and mandatory death penalty exposure, a much lower bar than in most jurisdictions',
    'Assuming CBD or hemp products are treated differently from THC-containing cannabis — Brunei''s Misuse of Drugs Act makes no such distinction and any cannabis-derived product carries the same severe exposure'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the Brunei Narcotics Control Bureau''s official site plus the primary statute text and multiple independent legal-analysis sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.narcotics.gov.bn/SitePages/Drug%20Laws.aspx')
WHERE country_iso2 = 'BN';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 12,
  estimated_cost_range = 'Industrial hemp cultivation license from the Ministry of Agriculture, Food and Forestry (no widely published standard fee); CBD businesses face compliance costs for lab testing and labeling but no special novel-food licensing fee, since Bulgaria classifies compliant CBD as a "traditional food" rather than requiring EU Novel Food authorization',
  legal_framework_summary = 'Cannabis remains illegal in Bulgaria for both recreational and medical use under the Narcotic Substances and Precursors Control Act (NSPCA) and Penal Code Articles 354a and 354c, with standard possession carrying 1-6 years imprisonment and fines of 2,000-10,000 leva, rising to 3-12 years for trafficking or cultivation under aggravating circumstances. There is no formally recognized personal-use threshold, though Article 354a(5) allows judges to impose a fine (up to roughly 1,000 leva) for insignificant quantities — this still constitutes a criminal conviction, not decriminalization. Bulgaria has no medical cannabis program, unlike neighboring Greece and Romania. Industrial hemp cultivation is legal only under Ministry of Agriculture license, restricted to fiber, animal feed seed, or sowing use, with THC content below 0.2% by weight (one source references a possible increase to 0.3%, unconfirmed across other sources) and subject to State Agency for National Security supervision. Bulgaria was the first EU country to permit legal CBD sales (2019), classifying compliant hemp-derived CBD (under 0.2% THC) as a "traditional food" rather than requiring EU Novel Food authorization — a notably more permissive stance than most EU states on that specific point.',
  steps = '[{"step":"Industrial hemp cultivation route","detail":"Apply to the Ministry of Agriculture, Food and Forestry for a cultivation license restricted to fiber, seed, or sowing use; THC must stay below 0.2% by weight; cultivation is supervised by the State Agency for National Security"},{"step":"CBD product route","detail":"Source CBD from licensed industrial hemp under 0.2% THC; Bulgaria''s traditional-food classification (rather than EU Novel Food) simplifies market entry relative to most EU states, but quality, THC-testing, and labeling standards still apply via the Bulgarian Food Safety Agency"},{"step":"Avoid any medical cannabis assumption","detail":"There is no medical cannabis program; doctors who prescribe cannabis outside narcotics regulations face criminal liability up to 5 years imprisonment"}]'::jsonb,
  key_regulators = '["Bulgarian Drug Agency (Ministry of Health)","Ministry of Interior — General Directorate for Combating Organized Crime (GDBOP)","Ministry of Agriculture, Food and Forestry (hemp licensing)","Bulgarian Food Safety Agency (CBD product oversight)","State Agency for National Security (hemp cultivation supervision)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Bulgaria''s permissive CBD market signals broader cannabis reform — CBD''s traditional-food classification is a narrow exception; recreational and medical cannabis remain fully illegal with no program of either kind',
    'Assuming hemp cultivation is open to any grower — it requires a specific Ministry of Agriculture license and ongoing State Agency for National Security supervision, not simple registration',
    'Assuming Article 354a(5)''s reduced fine for insignificant quantities is a decriminalization threshold — it remains a criminal conviction, just with a lighter sanction'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a law firm expert guide (CMS), independent legal-analysis sources, and Cannigma''s detailed 2019 CBD-classification reporting',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bulgaria')
WHERE country_iso2 = 'BG';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BO','BW','BN','BG');
