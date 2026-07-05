-- Research batch 1 of jurisdiction_playbooks: Argentina, India, Nigeria.
-- Real, sourced content replacing the 'draft'/pending stub rows created in
-- 20260705130012_jurisdiction_playbooks_stub_remaining_192.sql.
-- Countries chosen deliberately to span regions (Latin America, South Asia,
-- West Africa) rather than defaulting to large/wealthy markets.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Harris Sliwoski Canna Law Blog — Argentina ARICCAME framework', 'https://harris-sliwoski.com/cannalawblog/argentinas-regulatory-framework-for-hemp-and-medical-cannabis/', 'Argentina', 'AR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Law 27.669 / ARICCAME structure, licensing scope'),
  ('LegalClarity — Argentina REPROCANN and Resolution 1780/2025', 'https://legalclarity.org/drugs-in-argentina-laws-penalties-and-regulations/', 'Argentina', 'AR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'REPROCANN cultivation/possession limits post reform'),
  ('Lexology — General introduction to cannabis law in India', 'https://www.lexology.com/library/detail.aspx?g=988e0f27-70db-42bb-a35b-f11f01243a87', 'India', 'IN', 'South Asia', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'NDPS Act plant-part distinctions, FSSAI hemp standard'),
  ('IASPOINT — India cannabis laws state patchwork', 'https://iaspoint.com/indias-cannabis-laws-cultivation-use-and-legal-nuances/', 'India', 'IN', 'South Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'State-level hemp licensing, bhang regulation variance'),
  ('LegalClarity — Legal status of marijuana in Nigeria', 'https://legalclarity.org/the-legal-status-of-marijuana-in-nigeria/', 'Nigeria', 'NG', 'West Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'NDLEA Act / Indian Hemp Act penalty structure'),
  ('Wikipedia — Drug policy of Nigeria', 'https://en.wikipedia.org/wiki/Drug_policy_of_Nigeria', 'Nigeria', 'NG', 'West Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'NDLEA Act statutory history')
ON CONFLICT DO NOTHING;

-- Argentina
UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high',
  typical_timeline_months = 18,
  estimated_cost_range = 'Varies by activity — self-cultivation registration is low-cost; commercial licensing under ARICCAME''s successor bodies is capital-intensive and currently in flux',
  legal_framework_summary = 'Medical cannabis has been legal since Law 27.350 (2017), expanded by Decree 883/2020 which created the REPROCANN patient registry. Law 27.669 (2022) established a commercial/industrial framework and created ARICCAME as regulator, later dissolved in 2025 with functions folded into health and agriculture ministries. Resolution 1780/2025 tightened REPROCANN eligibility and cultivation limits. Recreational use remains illegal; commercial high-THC pharmaceutical cultivation is largely still theoretical, with licensing concentrated in low-THC hemp fiber/grain.',
  steps = '[{"step":"Patient/self-cultivator route","detail":"Register via REPROCANN with a physician in the Federal Network of Health Professionals; self-cultivation permits run 3 years, org/research permits 1 year"},{"step":"Commercial/industrial route","detail":"Apply for licensing under Law 27.669 for import/export/cultivation/manufacture; currently administered across health and agriculture ministries following ARICCAME dissolution"},{"step":"Provincial engagement","detail":"Coordinate with provincial programs (e.g., Jujuy, Chaco, Santa Fe) which are currently ahead of national commercial infrastructure"}]'::jsonb,
  key_regulators = '["ANMAT (National Administration of Drugs, Foods and Medical Devices)","Ministry of Health","Ministry of Productive Development / Agriculture (post-ARICCAME)","RENPRE (chemical precursors)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming ARICCAME still exists as a standalone agency — it was dissolved in 2025 and its functions redistributed',
    'Registering high-THC pharmaceutical-grade cultivation, which remains largely unauthorized in practice despite the legal framework',
    'Missing REPROCANN renewal deadlines under the tightened Resolution 1780/2025 rules'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — regulatory structure in active transition (ARICCAME dissolution, 2025 REPROCANN reform)',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://harris-sliwoski.com/cannalawblog/argentinas-regulatory-framework-for-hemp-and-medical-cannabis/')
WHERE country_iso2 = 'AR';

-- India
UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high',
  typical_timeline_months = 24,
  estimated_cost_range = 'State-dependent; hemp cultivation licensing fees are modest but legal ambiguity raises effective compliance cost',
  legal_framework_summary = 'The NDPS Act 1985 criminalizes the cannabis "genus" nationally, but Section 10/14 lets state governments permit low-THC (<0.3%) cultivation for industrial/scientific purposes — a carve-out legal scholars flag as potentially ultra vires the parent Act. Ganja (flowering tops) and charas (resin) are prohibited; leaves and seeds are excluded from the NDPS cannabis definition, which is why bhang remains legal in several states under state excise law. Hemp food products are separately regulated by FSSAI (Standard 2.16: <=0.3% THC, <=75mg/kg CBD).',
  steps = '[{"step":"Confirm state-level authorization","detail":"Only a handful of states (Uttarakhand, Himachal Pradesh, Madhya Pradesh, UP) have active hemp cultivation licensing regimes"},{"step":"Apply through state agriculture/forestry department","detail":"Submit land records, character certificate, storage proof, and THC-compliance undertaking to the District Magistrate"},{"step":"FSSAI registration for food-category products","detail":"Hemp seed, seed oil, and flour require compliance with FSSAI Fifth Amendment Standard 2.16"},{"step":"Central Bureau of Narcotics clearance","detail":"Required for import of hemp-derived material sourced from an NDPS-scheduled origin"}]'::jsonb,
  key_regulators = '["Narcotics Control Bureau (NCB)","Central Bureau of Narcotics","FSSAI (Food Safety and Standards Authority of India)","State Excise Departments","State Agriculture/Forestry Departments"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating state hemp-cultivation rules as settled law — legal scholars argue the 0.3% THC carve-out has no basis in the NDPS Act''s genus-level definition and remains legally contested',
    'Assuming CBD is uniformly legal nationwide — it is not scheduled under NDPS but sits in a regulatory gray zone with no explicit central approval pathway',
    'Attempting inter-state transport of any cannabis-derived product without an NDPS narcotics transport license, even for products legally produced in-state'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — central law and state implementing rules are in active legal dispute',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.lexology.com/library/detail.aspx?g=988e0f27-70db-42bb-a35b-f11f01243a87')
WHERE country_iso2 = 'IN';

-- Nigeria
UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high',
  typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis in all forms — recreational, medical, and industrial hemp — is illegal in Nigeria. The Indian Hemp Act 1966 and the NDLEA Act (Cap N30, LFN 2004) make no distinction between low-THC hemp and drug-type cannabis; cultivation of any cannabis plant is a criminal offense. No licensing pathway, medical program, or hemp pilot exists at the federal level. Proposed legislative amendments to allow NDLEA-issued cultivation/production licenses have been introduced in the National Assembly but have not passed.',
  steps = '[]'::jsonb,
  key_regulators = '["NDLEA (National Drug Law Enforcement Agency)","NAFDAC (has not registered any hemp-derived product for retail)","Central Bank of Nigeria Trade and Exchange Department (cannabis items are FX-restricted)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming any distinction exists between industrial hemp and drug cannabis under Nigerian law — none does',
    'Relying on proposed legalization bills as a signal of imminent change — none have passed despite repeated introduction',
    'Attempting to import hemp-derived consumer products at commercial scale — Customs routinely refuses these even when small personal-use quantities are tolerated'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'high — prohibition is unambiguous and consistently enforced',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://legalclarity.org/the-legal-status-of-marijuana-in-nigeria/')
WHERE country_iso2 = 'NG';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AR','IN','NG');
