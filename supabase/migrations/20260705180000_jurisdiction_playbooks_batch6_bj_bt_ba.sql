-- Research batch 6 of jurisdiction_playbooks: Benin, Bhutan, Bosnia and Herzegovina.
-- Real, sourced content replacing draft stub rows. Bosnia is a recent, in-progress
-- legal change (medical cannabis legalized Dec 2025, implementing regulations still
-- being finalized as of April 2026) — noted explicitly in the summary and confidence label.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Benin', 'https://en.wikipedia.org/wiki/Cannabis_in_Benin', 'Benin', 'BJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition context, transshipment role, seizure trend'),
  ('Grokipedia — Cannabis in Benin', 'https://grokipedia.com/page/cannabis_in_benin', 'Benin', 'BJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Act No. 97-025 (1997) statutory detail, penalty range'),
  ('Wikipedia — Cannabis in Bhutan', 'https://en.wikipedia.org/wiki/Cannabis_in_Bhutan', 'Bhutan', 'BT', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Wild-growth context, enforcement history'),
  ('Grokipedia — Cannabis in Bhutan', 'https://grokipedia.com/page/cannabis_in_bhutan', 'Bhutan', 'BT', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2015 Act name, penalty tiers, licensed hemp fiber program, 2023 PM statement'),
  ('Soft Secrets — Bosnia and Herzegovina Moves to Regulate Medical Cannabis', 'https://softsecrets.com/en-US/article/bosnia-legalizes-medicinal-cannabis', 'Bosnia and Herzegovina', 'BA', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'Dec 2025 Council of Ministers decision, effective Jan 1 2026, pharmaceutical-only scope'),
  ('Newsweed — BiH Continues Rollout of Medical Cannabis', 'https://www.newsweed.fr/en/bosnia-and-herzegovina-continues-to-roll-out-medical-cannabis-following-its-legalization/', 'Bosnia and Herzegovina', 'BA', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'April 2026 roundtable confirming implementation still in progress'),
  ('CMS Expert Guides — Cannabis law and legislation in Bosnia & Herzegovina', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bosnia-and-herzegovina', 'Bosnia and Herzegovina', 'BA', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Pre-existing industrial hemp framework baseline (0.2% THC)')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis production, processing, possession, use, importation, exportation, sale, and trafficking are all prohibited under Act No. 97-025 of July 18, 1997 on the control of drugs and precursors, with no exemptions for medical, scientific, or recreational purposes. Penalties range from 2 to 20 years imprisonment depending on offense severity, with the higher end reserved for trafficking or organized distribution. Enforcement is handled primarily by the National Police and Gendarmerie; despite the ban, cannabis is the only drug produced domestically (mostly small-scale) and Benin, particularly Porto-Novo, has increasingly become a regional transshipment point for cannabis moving toward Nigeria.',
  steps = '[]'::jsonb,
  key_regulators = '["National Police","Gendarmerie Nationale"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming small personal-use amounts are tolerated in practice — enforcement is variable but the law provides no formal exemption, and penalties start at 2 years even for lower-severity offenses',
    'Confusing Benin''s role as a transit/transshipment country with any domestic legal tolerance — transshipment activity is itself criminalized and increasingly targeted by law enforcement',
    'Assuming any distinction exists between hemp and drug-type cannabis — the 1997 Act makes no such distinction'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference sources with specific statutory detail (Act No. 97-025) confirmed',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Benin')
WHERE country_iso2 = 'BJ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable for personal, recreational, or medical use. A narrow licensed non-psychoactive hemp fiber program (under ~1% THC) operates in parts of western Bhutan under government authorization, with no published general fee schedule.',
  legal_framework_summary = 'Possession, cultivation, sale, and recreational use of cannabis are illegal under the Narcotic Drugs, Psychotropic Substances and Substance Abuse Act of 2015, which classifies cannabis as a Schedule I controlled narcotic; despite this, the plant grows wild and prolifically across the country and has long been used for non-psychoactive purposes such as pig fodder, rope, and hemp fiber for archery bows. Small-scale possession or cultivation is a misdemeanor carrying up to 3 years imprisonment, while larger-quantity cultivation, harvesting, or trafficking is a third- or fourth-degree felony carrying several years or more; courts may substitute mandatory counseling for incarceration in qualifying cases. Licensed non-psychoactive fiber production is permitted in parts of western Bhutan, but no exception exists for CBD, recreational seeds, or any psychoactive use. Prime Minister Lotay Tshering explicitly reaffirmed in 2023 that Bhutan rejects legalization, prioritizing cultural preservation — cannabis use conflicts with Vajrayana Buddhist principles — and abuse prevention.',
  steps = '[{"step":"Licensed industrial fiber route only","detail":"Non-psychoactive hemp fiber cultivation (roughly under 1% THC) is permitted in designated western regions under government license, strictly for fiber/fodder use — no psychoactive, CBD, or seed-sale pathway exists"}]'::jsonb,
  key_regulators = '["Royal Bhutan Police — National Drug Law Enforcement Unit","Ministry of Health"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the plant''s wild abundance implies legal tolerance — possession and use remain fully criminalized regardless of the plant growing unmanaged',
    'Assuming CBD is treated separately from THC — Bhutanese law makes no such distinction and CBD products are equally illegal',
    'Assuming the licensed hemp-fiber program signals movement toward broader legalization — the Prime Minister explicitly rejected this in 2023'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across reference and legal-analysis sources, including the specific 2015 Act name and the 2023 PM statement',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bhutan')
WHERE country_iso2 = 'BT';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Not yet determinable — implementing regulations (professional guidelines, operational procedures) were still being developed as of April 2026; no licensing or patient-fee structure has been published. Separately, pre-existing industrial hemp cultivation requires authorization from a competent body with no widely published fee schedule.',
  legal_framework_summary = 'On December 29, 2025, the Council of Ministers of Bosnia and Herzegovina approved reclassifying cannabis, its resins, extracts, and tinctures from the list of strictly prohibited substances to a "strict monitoring" table, legalizing cannabis for medical purposes effective January 1, 2026 — ending roughly a decade of legislative deadlock. Access will be limited to patients with a valid prescription from an authorized physician, with cannabis dispensed exclusively as pharmaceutical products (oils, tinctures, or magistral preparations) rather than whole-plant flower. As of an April 24, 2026 roundtable convened by the Ministry of Civil Affairs, authorities were still developing the implementing regulations, professional guidelines, and operational procedures needed before patients can actually access cannabis-based medicines through pharmacies — meaning the legal change is confirmed but practical patient access was not yet operational as of that date. Separately, industrial hemp cultivation (fiber/seed, THC at or below 0.2%) has long been permitted under the pre-existing Law on Prevention and Suppression of Narcotic Drugs Abuse, requiring authorization and registered hemp varieties; recreational cannabis remains fully prohibited.',
  steps = '[{"step":"Monitor implementation regulations","detail":"As of April 2026, the Ministry of Civil Affairs was still finalizing professional guidelines and operational procedures required before cannabis-based medicines reach pharmacies — check for published implementing rules before assuming patient access is live"},{"step":"Industrial hemp route (separately established)","detail":"Apply for authorization from the competent body to grow, import, or sell registered hemp varieties at or below 0.2% THC for fiber, animal feed seed, or further processing"}]'::jsonb,
  key_regulators = '["Council of Ministers of Bosnia and Herzegovina","Ministry of Civil Affairs","Entity-level Ministries of Health (Federation of BiH / Republika Srpska)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the December 2025 legalization decision means patients can access medical cannabis today — as of an April 2026 government roundtable, implementing regulations were still being finalized with no confirmed pharmacy-access date',
    'Assuming whole-plant flower will be dispensable — the framework is designed around pharmaceutical-grade oils, tinctures, and magistral preparations, not flower',
    'Overlooking Bosnia and Herzegovina''s split entity structure (Federation of BiH / Republika Srpska) — implementation may proceed at different paces or through different health authorities across entities'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the legal reform itself (extensively corroborated across independent trade press and government statements); medium on the implementation timeline, which was explicitly still in progress as of April 2026',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://softsecrets.com/en-US/article/bosnia-legalizes-medicinal-cannabis')
WHERE country_iso2 = 'BA';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BJ','BT','BA');
