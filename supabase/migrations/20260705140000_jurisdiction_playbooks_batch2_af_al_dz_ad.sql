-- Research batch 2 of jurisdiction_playbooks: Afghanistan, Albania, Algeria, Andorra.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Afghanistan', 'https://en.wikipedia.org/wiki/Cannabis_in_Afghanistan', 'Afghanistan', 'AF', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition history, Taliban-era enforcement'),
  ('UNODC Sherloc — Afghanistan Law on Campaign Against Intoxicants', 'https://sherloc.unodc.org/cld/en/legislation/afg/law_on_campaign_against_intoxicants_drugs_and_their_control/chapter_iv/article_41-47/article_41-47.html', 'Afghanistan', 'AF', 'Asia', 1, 'html_snapshot', 'quarterly', 'primary_legislation', 'Official statutory penalty structure'),
  ('NACC (National Agency for Cannabis Control) — Albania Licensing', 'https://www.nacc.gov.al/en/licensing/', 'Albania', 'AL', 'Europe', 1, 'html_snapshot', 'monthly', 'regulator_official', 'Official regulator: license terms, fees, area caps'),
  ('Business of Cannabis — Albania green-lights cultivation', 'https://businessofcannabis.com/albania-officially-green-lights-medical-and-industrial-cannabis-cultivation/', 'Albania', 'AL', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'Law 61/2023 passage, vote count, regulator creation'),
  ('Wikipedia — Cannabis in Algeria', 'https://en.wikipedia.org/wiki/Cannabis_in_Algeria', 'Algeria', 'DZ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Law 04-18 / Decree 07-228 framework'),
  ('CannabisLaws.Global — Algeria', 'https://cannabislaws.global/algeria/', 'Algeria', 'DZ', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'CBD/THC non-distinction, no medical program in practice'),
  ('High Life Global — Is Cannabis Legal in Andorra 2026', 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-andorra/', 'Andorra', 'AD', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Sativex-only cannabinoid protocol, penalty structure'),
  ('Andorra Insiders — Cannabis, Andorra, CBD, Marijuana Crops', 'https://andorrainsiders.com/en/cannabis-andorra-cbd-marijuana-crops/', 'Andorra', 'AD', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Draft cultivation law status, CBD cosmetic-only pathway')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis cultivation, possession, and trafficking are illegal under the Counter Narcotics Drug Law of 2005, with penalties ranging from fines and short prison terms for small personal amounts up to 10-20 years or life imprisonment for large-scale cultivation, and the death penalty theoretically available for trafficking. Since the Taliban retook power in 2021, cannabis and hemp cultivation have been reaffirmed as banned nationwide, with enforcement under Sharia-based penalties including corporal punishment for violators. Despite this, Afghanistan remains the world''s largest producer of cannabis resin (hashish), and a 2021 Taliban-announced agreement with a German pharmaceutical firm to build an export-only medical cannabis facility has not translated into any domestic legal pathway.',
  steps = '[]'::jsonb,
  key_regulators = '["Taliban Ministry of Interior / counter-narcotics enforcement (not internationally recognized as a governing authority by most states)","UNODC (monitoring only, no domestic regulatory role)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating the 2021 Taliban-Cpharm export agreement as an active legal pathway — it has not materialized into licensing or operations',
    'Assuming international recognition issues with the Taliban government create ambiguity in enforcement — domestic penalties are applied regardless',
    'No distinction exists between hemp and drug-type cannabis under Afghan law — low-THC cultivation is equally prohibited'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — prohibition is unambiguous and consistently documented, though the governing authority itself is unrecognized by most states',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Afghanistan')
WHERE country_iso2 = 'AF';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Medical license: minimum ~100 million lek (~€1M) capital requirement plus non-refundable ALL 100,000 application fee, annual fee of 1.5% of turnover (floor €100,000) after year 3. Industrial hemp: lower barrier, minimum 1-hectare plot, 5-year permit.',
  legal_framework_summary = 'Law No. 61/2023 (passed July 2023, 69-23 vote) legalized licensed cultivation and processing of cannabis for medical and industrial purposes, but strictly for export — there is no domestic patient access, retail, or consumer market. The National Agency for Cannabis Control (NACC), under the Ministry of Health, issues 15-year medical licenses (5-10 hectare units, 200-hectare national cap) requiring applicants to show 3 years of OECD-market cannabis experience. Industrial hemp is rolled out through designated cadastral zones (first approved March 2025 in Shkodra/Malësi e Madhe) under 5-year permits, with a notably high 0.8% THC ceiling. Recreational and domestic medical use remain criminal offenses under Criminal Code Article 283, carrying 5-10 years imprisonment.',
  steps = '[{"step":"Confirm export-only scope","detail":"No license type permits domestic sale, prescription, or retail — plan for 100% export from the outset"},{"step":"Meet licensing bar","detail":"Demonstrate 3 years of cannabis production/cultivation experience in an OECD country; capitalize at ~€1M+ for medical license"},{"step":"Apply via NACC","detail":"Submit application with ALL 100,000 non-refundable fee; medical license runs 15 years, reassessed every 3 years"},{"step":"Build to security spec","detail":"Outdoor sites require 4m+ concrete perimeter walls, barbed wire, 24/7 CCTV directly accessible to regulator, alarm links to local police"},{"step":"Industrial hemp alternative","detail":"Apply for a plot within a designated cadastral zone (Shkodra/Malësi e Madhe as of 2025); 5-year permit, 1+ hectare minimum, 0.8% THC ceiling"}]'::jsonb,
  key_regulators = '["National Agency for Cannabis Control (NACC) — primary regulator","Ministry of Health and Social Protection","Ministry of Agriculture and Rural Development (industrial hemp)","Albanian State Police"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming licensed cultivation means a domestic market exists — the entire regime is export-only with zero in-country retail or patient access',
    'Underestimating the OECD-experience and capital requirements, which are deliberately structured to favor established foreign operators over domestic entrants',
    'Confusing the licensed export framework with broader legalization — unlicensed possession, use, or cultivation remains criminal under Article 283'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated by the NACC''s own official licensing page plus multiple independent trade-press sources on the 2023 law and 2025 hemp-zone rollout',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.nacc.gov.al/en/licensing/')
WHERE country_iso2 = 'AL';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no functioning legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, commerce, and possession of cannabis are prohibited under Law No. 04-18 (2004) and enforcement Decree No. 07-228 (2007), except for narrow case-by-case medical or research use pre-authorized by the Minister of Health. A 2020 Prime Ministerial decree set procedural rules for any such cannabinoid prescriptions — capped at 3-month outpatient scripts, weekly renewal for hospitalized patients, dispensing restricted to hospital pharmacies — but this framework functions rarely in practice and does not amount to an accessible medical program. Algerian law draws no distinction between CBD and THC, and industrial hemp cultivation is not permitted.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Health (sole authority for rare case-by-case medical/research authorization)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating the Minister of Health medical exception as an operating program — approvals are rare, ad hoc, and hospital-pharmacy-only, not a commercial pathway',
    'Assuming CBD is treated differently from THC — Algerian law makes no such distinction, so CBD is equally prohibited',
    'Assuming low-THC hemp is a viable workaround — industrial hemp cultivation is not legally permitted'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Algeria')
WHERE country_iso2 = 'DZ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal for both recreational and medical use under the Andorran Penal Code (Article 284); personal possession can carry up to 12 months imprisonment and a ~€1,200 fine, rising to 2 years and ~€1,800 for public use, with trafficking/cultivation treated as more serious offenses. The only cannabinoid pathway is a narrow government protocol permitting prescription of Sativex for spasticity treatment — not a general medical cannabis program. A 2021 research initiative and a 2022 government-commissioned draft cultivation law have not resulted in passed legislation as of 2026. CBD exists in a legal gray area: it can only be sold as an EU-approved, foreign-manufactured cosmetic product, since Andorra is outside the EU and has no domestic CBD statute.',
  steps = '[]'::jsonb,
  key_regulators = '["Govern d''Andorra (cannabinoid prescription protocol)","Police Cos d''Andorra","Ministry of Health"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming proximity to Spain/France cannabis tolerance carries over — Andorra enforces strict prohibition independent of neighboring policy',
    'Treating the narrow Sativex/spasticity protocol as a general medical cannabis program — it is not, and there is no broader patient-access route',
    'Selling CBD without confirming EU manufacture/approval — domestically produced or unapproved CBD product has no legal basis and remains a gray-zone risk'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistent across government-protocol references and independent legal guides; a 2022-commissioned draft cultivation law remains unpassed with no update found',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-andorra/')
WHERE country_iso2 = 'AD';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AF','AL','DZ','AD');
