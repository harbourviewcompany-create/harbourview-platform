-- Research batch 9 of jurisdiction_playbooks: Cape Verde, Central African Republic, Chad, Chile.
-- Real, sourced content replacing draft stub rows. Chile required correcting a widely-
-- repeated myth (the "6 plants per household" figure never became law) and flagging a
-- live 2026 political/legal risk (penalty-reform under Constitutional Court challenge).

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Tripbase — Cape Verde cannabis drug laws', 'https://www.tripbase.com/drug-laws/cape-verde/cannabis/', 'Cape Verde', 'CV', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Consumption vs trafficking penalty distinction, citing UK FCDO'),
  ('Dagga Diaries — Legality of Cannabis in Cape Verde', 'https://www.daggadiaries.com/countries/cannabis-in-cape-verde', 'Cape Verde', 'CV', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Law No. 78/IV/93 and Law No. 92/92 statutory citation, treatment-alternative option'),
  ('Leafwell — Is Marijuana Legal in the Central African Republic', 'https://leafwell.com/blog/is-marijuana-legal-in-central-african-republic', 'Central African Republic', 'CF', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Fine threshold over 1,000,000 francs, no CBD distinction, rising youth use'),
  ('Wikipedia — Cannabis in the Central African Republic', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Central_African_Republic', 'Central African Republic', 'CF', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition since Central African Empire era (1976-1979)'),
  ('Leafwell — Is Marijuana Legal in Chad', 'https://leafwell.com/blog/is-marijuana-legal-in-chad', 'Chad', 'TD', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'No CBD distinction, no decrim/legalization progress noted'),
  ('Wikipedia — Cannabis in Chad', 'https://en.wikipedia.org/wiki/Cannabis_in_Chad', 'Chad', 'TD', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Lake Chad wild cultivation note, limited available data'),
  ('MyCannabis — Is Weed Legal in Chile 2026', 'https://www.mycannabis.com/is-weed-legal-in-chile/', 'Chile', 'CL', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Corrects the widely-repeated "6 plants" myth; 2026 political shift and May 2026 penalty-reform legal challenge'),
  ('CMS Expert Guides — Cannabis law and legislation in Chile', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/chile', 'Chile', 'CL', 'Latin America', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'No industrial authorization, no CBD statutory reference, self-cultivation personal-use-only scope'),
  ('Leafwell — Is Marijuana Legal in Chile', 'https://leafwell.com/blog/is-marijuana-legal-in-chile', 'Chile', 'CL', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Sativex pharmacy pricing, large-scale cultivation restriction detail')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Cape Verde for all purposes under Law No. 78/IV/93 (1993) and Law No. 92/92 (1992), with no recreational or medical program. Personal drug consumption is penalized more leniently than trafficking or production (consumption reported at around three months'' imprisonment, with defendants able to seek treatment plus a financial penalty in lieu of incarceration), but possession still routinely results in arrest, fines, and jail, and travelers have been arrested for personal-use amounts. Enforcement in practice is described as comparatively lax for small quantities given limited police presence, but this does not amount to any legal exemption or tolerance policy.',
  steps = '[]'::jsonb,
  key_regulators = '["Cape Verdean national police and judicial enforcement bodies"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming light on-the-ground enforcement (a documented pattern given limited police presence) signals legal tolerance — no legal pathway exists regardless of practical enforcement intensity',
    'Relying on low-quality sources claiming a 25-gram legal possession threshold or the existence of legal dispensaries — no such threshold or retail market exists; cannabis is illegal for all purposes',
    'Assuming CBD or hemp products are treated separately from THC-containing cannabis — no such distinction is established in Cape Verdean law'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across UK FCDO travel advisories, Wikipedia, and legal-analysis sources; one templated low-quality source falsely claiming a 25g legal threshold and dispensaries was discarded as contradicted by every credible source',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.tripbase.com/drug-laws/cape-verde/cannabis/')
WHERE country_iso2 = 'CV';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis possession, sale, distribution, cultivation, and consumption are all illegal in the Central African Republic, with no distinction made between recreational and medical use and no legal status for CBD or other cannabis derivatives — prohibition dates back at least to the Central African Empire administration (1976-1979). Violators face extended jail time and fines exceeding 1,000,000 francs. Despite the ban, cannabis is reportedly the most widely cultivated and consumed illicit substance in the country, with use said to be rising among young men under 35, though ongoing instability and weakened rule of law limit available data on the actual scale of cultivation, consumption, and enforcement. There is no known proposed legislation, past or present, to legalize cannabis for any purpose.',
  steps = '[]'::jsonb,
  key_regulators = '["Central African Republic judicial and law enforcement bodies (data on specific agencies is limited given ongoing instability)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming widespread illicit cultivation and use signal any movement toward legal reform — no proposed legislation exists, and cultivation remains a serious criminal offense',
    'Assuming CBD or non-psychoactive hemp derivatives are exempt — no such distinction exists in CAR''s drug law',
    'Treating enforcement data as reliable or current — ongoing instability and weak rule of law mean available information on actual enforcement practice is limited and may not reflect ground reality'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium-high — legal prohibition itself is consistently confirmed across sources, but detailed enforcement data is acknowledged as limited given the country''s instability',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-central-african-republic')
WHERE country_iso2 = 'CF';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Chad for both recreational and medical use, with no legal distinction made for CBD products regardless of THC content. Specific sentencing guidelines and fine amounts are not well documented in available English-language sources, but law enforcement is reported to treat drug possession of any kind seriously, and cultivation is entirely prohibited. A 1999 report noted wild cannabis cultivation on islands in Lake Chad that local police had not moved to destroy, suggesting some enforcement gaps in remote areas, though this does not constitute any legal tolerance. There is no known legislative movement toward decriminalization or legalization. Available legal documentation on Chad specifically is comparatively thin relative to most other jurisdictions in this database, reflecting limited English-language legal-analysis coverage of the country.',
  steps = '[]'::jsonb,
  key_regulators = '["Chadian national police and judicial enforcement bodies (specific agency names not well documented in available sources)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the documented enforcement gap around wild Lake Chad cultivation signals broader tolerance — this is a localized, remote-area enforcement gap, not a legal exemption',
    'Assuming CBD is treated separately from THC-containing cannabis — no such distinction exists in Chadian law',
    'Treating this entry as equally well-documented as other countries — available sourcing on Chad specifically is thin and should be supplemented with local legal counsel before any commercial decision'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — prohibition itself is consistently confirmed, but specific penalty/enforcement detail is thin across available English-language sources; flagged for follow-up research if French-language primary sources become available',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Chad')
WHERE country_iso2 = 'TD';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Medical cannabis pharmaceuticals (chiefly Sativex) cost patients out of pocket, with generics reported around $120 and typically not covered by insurance; large-scale cultivation authorization is restricted to a small number of specially licensed firms with no standardized public fee schedule; personal/home cultivation for self-consumption carries no licensing cost',
  legal_framework_summary = 'Chile decriminalized private personal cannabis consumption in 2005 under Law 20,000, and courts have consistently held that small-scale home cultivation for genuine personal/immediate use (not quantified by a specific plant count) is not a criminal act — though the widely-cited "six plants per household" figure never actually became law: a 2015 bill establishing that limit passed the lower house 68-39 but died in the Senate. Medical cannabis has been legal since Supreme Decree 84 (2015), letting patients with qualifying conditions (cancer, epilepsy, multiple sclerosis, among others) access prescribed cannabis-based medicines — chiefly Sativex — through more than 500 licensed pharmacies overseen by the Instituto de Salud Pública (ISP); a 2023 amendment lets a treating doctor''s prescription itself justify home cultivation for medical purposes. Recreational sale, distribution, transport, and large-scale production remain fully illegal, with trafficking carrying 5-15 years imprisonment, and large-scale cultivation authorization is restricted to a handful of specially licensed firms (one operation scaled to roughly 7,000 plants/year under Agriculture and Livestock Service supervision). CBD has no standalone legal definition and is treated identically to other cannabis-based medicines, requiring the same prescription-and-pharmacy pathway. As of 2026, the political and legal environment has shifted: right-wing president José Antonio Kast (elected December 2025, took office March 2026) has prioritized a law-and-order agenda over drug reform, and a May 2026 statutory reform broadening trafficking-level penalties to smaller quantities of substances deemed capable of "serious harm" is being challenged before the Constitutional Court by opposition deputies who argue it could sweep in personal and medicinal users, since cannabis remains classified as a hard drug under a 2007 decree.',
  steps = '[{"step":"Personal-use route","detail":"Private, non-public consumption and small-scale home cultivation for genuine personal use are decriminalized in practice through consistent judicial interpretation of Law 20,000 — not through a specific plant-count statute"},{"step":"Medical route","detail":"Obtain a qualifying diagnosis and physician prescription; access Sativex or other ISP-approved cannabis-based medicines through licensed pharmacies, or cultivate at home under a 2023-amendment medical justification"},{"step":"Large-scale/commercial route","detail":"Apply for special cultivation authorization (very limited number granted to date) under Agriculture and Livestock Service supervision; recreational sale and distribution remain illegal regardless of scale"},{"step":"Monitor the 2026 penalty-reform legal challenge","detail":"A May 2026 reform expanding trafficking-level penalties to smaller quantities is under Constitutional Court review; outcome could affect risk exposure for personal/medical users"}]'::jsonb,
  key_regulators = '["Instituto de Salud Pública (ISP) — pharmaceutical/medical cannabis oversight","Servicio Agrícola y Ganadero (SAG) — cultivation licensing and supervision","SENDA (Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Repeating the widely-cited "six plants per household" rule as current law — it comes from a 2015 bill that passed the lower house but never cleared the Senate; actual protection for home growers rests on judicial interpretation of "personal use," not a codified plant limit',
    'Assuming medical legalization created a normal commercial market — large-scale cultivation remains restricted to a small handful of specially authorized firms, and recreational sale/distribution/transport remain fully criminal with 5-15 year trafficking penalties',
    'Assuming the 2026 political and legal environment is static — a new law-and-order government and a May 2026 penalty-reform under active Constitutional Court challenge could meaningfully change enforcement risk for personal and medical users'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a law firm expert guide (CMS), multiple independent legal-analysis sources, and recent 2026 reporting on the political/legal shift; the "6 plants" myth was specifically identified and corrected using the most current (June 2026) source',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.mycannabis.com/is-weed-legal-in-chile/')
WHERE country_iso2 = 'CL';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('CV','CF','TD','CL');
