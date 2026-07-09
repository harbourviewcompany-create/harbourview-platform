-- Research batch 8 of jurisdiction_playbooks: Burkina Faso, Burundi, Cambodia, Cameroon.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Leafwell — Is Marijuana Legal in Burkina Faso', 'https://leafwell.com/blog/is-marijuana-legal-in-burkina-faso', 'Burkina Faso', 'BF', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Code des drogues au Burkina, Table I classification detail'),
  ('CannabisLaws.Global — Burkina Faso', 'https://cannabislaws.global/burkina-faso/', 'Burkina Faso', 'BF', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Up to 10 years imprisonment penalty range'),
  ('Wikipedia — Cannabis in Burundi', 'https://en.wikipedia.org/wiki/Cannabis_in_Burundi', 'Burundi', 'BI', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', '1977 US Congressional report, fine range, rare enforcement'),
  ('Leafwell — Is Marijuana Legal in Burundi', 'https://leafwell.com/blog/is-marijuana-legal-in-burundi', 'Burundi', 'BI', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'No hemp/THC distinction, cultivation penalty detail'),
  ('Wikipedia — Cannabis in Cambodia', 'https://en.wikipedia.org/wiki/Cannabis_in_Cambodia', 'Cambodia', 'KH', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Law on Drug Management Article 2, historical enforcement pattern, Happy restaurants'),
  ('CannabisRegulations.ai — Cambodia', 'https://www.cannabisregulations.ai/country-legality/cambodia-marijuana', 'Cambodia', 'KH', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Post-2019-2020 tourist-area enforcement tightening, regulator names'),
  ('Leafwell — Is Marijuana Legal in Cameroon', 'https://leafwell.com/blog/is-marijuana-legal-in-cameroon', 'Cameroon', 'CM', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law No. 97/19 (1997) Sections 91-95 penalty detail, 2001/2003/2019 failed medical-export attempts'),
  ('Wikipedia — Cannabis in Cameroon', 'https://en.wikipedia.org/wiki/Cannabis_in_Cameroon', 'Cameroon', 'CM', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Transit-hub role, 2001 BBC medical import report')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis production, trade, transport, and possession are fully prohibited under the Code des drogues au Burkina, which classifies cannabis under "Table I" — high-risk plants and substances of no recognized medical interest — alongside a general ban derived from Burkina Faso''s adherence to international UN drug-control conventions. The law makes no distinction between medical and recreational use, and there is no CBD-specific exemption. Despite the ban, Burkina Faso''s tropical climate makes it well-suited to cultivation, and cannabis is grown clandestinely in rural areas (particularly around Ouagadougou), primarily for export to neighboring countries such as Nigeria and Mali rather than domestic consumption, which remains comparatively low among Burkinabé youth.',
  steps = '[]'::jsonb,
  key_regulators = '["Police and judicial enforcement under the Code des drogues au Burkina","UNODC-coordinated border monitoring"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming rural cultivation activity signals any legal tolerance — cultivation is criminalized under Table I of the Code des drogues regardless of scale or intent',
    'Assuming any hemp/CBD carve-out exists — the law makes no distinction between low-THC hemp and drug-type cannabis, and CBD has no separate legal status',
    'Assuming neighboring reform momentum (Ghana''s decriminalization, Nigeria''s medical-cannabis discussions) signals imminent Burkinabé change — no legislative movement has been reported'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and legal-analysis sources with specific statutory classification (Table I) confirmed',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-burkina-faso')
WHERE country_iso2 = 'BF';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Burundi for all purposes, with no distinction made between recreational and medical use, hemp and drug-type cannabis, or CBD and THC — even 0-THC smokable hemp or medical CBD products are prohibited. A 1977 U.S. Congressional report documented cultivation, transport, and possession penalties of fines ranging from 100 to 100,000 francs, though enforcement was noted even then as rare, with no cannabis violations recorded in the prior eight years. Current personal possession penalties range from fines up to roughly one year imprisonment, and cultivation carries scaling fines and prison time with plant confiscation. The plant grows only in small, wild batches given Burundi''s climate, which is not well-suited to cultivation, and cannabis use is considered a comparatively minor drug issue domestically, with no indication of near-term legal reform given Burundi''s adherence to the UN''s blanket cannabis ban.',
  steps = '[]'::jsonb,
  key_regulators = '["Burundian national police and judicial enforcement bodies"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming low enforcement activity signals informal tolerance for commercial cultivation or trade — the law provides no legal pathway regardless of enforcement intensity',
    'Assuming CBD or 0-THC hemp products are exempt — Burundian law treats all cannabis-derived products identically, with no cannabinoid-content distinction',
    'Assuming Burundi''s climate supports viable commercial cultivation — the country''s conditions are poorly suited to the plant, limiting it to small wild-growing batches'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Wikipedia''s historical statutory detail and independent legal-analysis sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Burundi')
WHERE country_iso2 = 'BI';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Cambodia under the Law on Drug Management, which since 1961/1992 (in compliance with the Single Convention on Narcotic Drugs) explicitly prohibits cultivation of cannabis indica and sativa, with penalties for possession ranging from fines up to 10 years imprisonment and cultivation/trafficking carrying sentences up to life imprisonment. However, enforcement has historically been opportunistic and inconsistent rather than systematic: "Happy" restaurants in Phnom Penh, Siem Reap, and Sihanoukville have long openly served cannabis-infused food ("happy pizza") to tourists, and the UNODC noted cannabis cultivation had "ceased to be a major concern" by 2009. Enforcement in tourist areas tightened following 2019-2020 crackdowns on informal happy-pizza venues, and foreign nationals are prosecuted under the same statute as citizens, though bribery of local police to avoid prosecution has been documented. There is no medical cannabis program and no separate legal status for CBD, which falls under the general cannabis prohibition.',
  steps = '[]'::jsonb,
  key_regulators = '["National Authority for Combating Drugs (NACD)","Anti-Drug Department, Cambodian National Police","Ministry of Health"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the visible "Happy" restaurant scene means cannabis is effectively legal — it remains a criminal offense under the Law on Drug Management, with enforcement applied opportunistically rather than never',
    'Assuming enforcement leniency is uniform nationwide or guaranteed to continue — tourist-area enforcement has tightened since 2019-2020, and crackdowns can occur without warning',
    'Assuming CBD is treated separately from THC-containing cannabis — Cambodian law does not distinguish CBD, leaving its status governed by the same general prohibition'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia''s statutory citation (Law on Drug Management Article 2) and multiple independent legal-analysis and travel sources describing the enforcement pattern consistently',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Cambodia')
WHERE country_iso2 = 'KH';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis cultivation, production, possession, use, and trafficking are prohibited under Law No. 97/19 of 7 August 1997, which classifies cannabis and cannabis resin as "high-risk drugs" under Cameroon''s narcotics control framework; Sections 91-95 impose 10 to 20 years imprisonment plus fines of CFAF 250,000 to 1,250,000 for cultivation, production, import/export, or sale. No exemption exists for medical use, industrial hemp, or CBD, even though Cameroon''s climate is well-suited to hemp cultivation. Despite the ban, cannabis (locally "banga") is widely and traditionally grown, particularly by rural farmers in northern Cameroon who derive significant income from it, and the country has made several unsuccessful attempts to establish a legal medical-cannabis export industry: a 2001 BBC report on a proposed Canada-import medical program that Canadian health authorities denied any agreement for, a 2003 UN-registered request for medicinal cultivation/export that was never implemented, and a 2019 scheme involving foreign investors and rainforest road-building that was later exposed as financial fraud.',
  steps = '[]'::jsonb,
  key_regulators = '["Cameroonian judicial and police enforcement under Law No. 97/19","Customs authorities at Douala and Yaoundé airports (documented transit points for cannabis trafficking to Europe)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Cameroon''s repeated past attempts at a legal medical-cannabis export program signal an imminent legal pathway — all prior attempts (2001, 2003, 2019) failed or were exposed as fraudulent, with no current legal framework in place',
    'Assuming widespread rural cultivation implies informal legal tolerance — cultivation remains a serious criminal offense carrying 10-20 years imprisonment regardless of local prevalence',
    'Assuming industrial hemp (low-THC) is distinguished from drug-type cannabis — Law No. 97/19 makes no such distinction; any cannabis or hemp cultivation is equally prohibited'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia, Sensi Seeds, and Leafwell, with consistent statutory citation (Law No. 97/19, Sections 91-95) and consistent historical detail on the failed 2001/2003/2019 reform attempts',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-cameroon')
WHERE country_iso2 = 'CM';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BF','BI','KH','CM');
