-- Research batch 12 of jurisdiction_playbooks: Djibouti, Dominica, Dominican Republic, Ecuador.
-- Real, sourced content replacing draft stub rows. Ecuador's personal-possession
-- status is a genuine, well-documented legal gray area since a Nov 2023 repeal
-- of the quantity table (not a source conflict) -- described precisely rather
-- than picking a side.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Djibouti', 'https://en.wikipedia.org/wiki/Cannabis_in_Djibouti', 'Djibouti', 'DJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Penalty structure, khat contrast, port trafficking role'),
  ('Sensi Seeds — Cannabis in Djibouti', 'https://sensiseeds.com/en/blog/countries/cannabis-in-djibouti-laws-use-history/', 'Djibouti', 'DJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'CBD/seed non-distinction, arid climate cultivation context'),
  ('US State Dept — 2022 Intl Religious Freedom Report: Dominica', 'https://www.state.gov/reports/2022-report-on-international-religious-freedom/dominica/', 'Dominica', 'DM', 'Caribbean', 1, 'html_snapshot', 'quarterly', 'government_official', '2020 decriminalization confirmation, Rastafarian sacramental tolerance in practice'),
  ('Wikipedia — Cannabis in Dominica', 'https://en.wikipedia.org/wiki/Cannabis_in_Dominica', 'Dominica', 'DM', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', 'Oct 2020 amendment: 28g possession + 3-plant cultivation decriminalized'),
  ('Herb.co — How to Buy Weed in Dominica 2026', 'https://herb.co/city-guides/buy-weed-dominica', 'Dominica', 'DM', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', 'National Cannabis Advisory Committee, July 2025 symposium, no retail market yet'),
  ('US Embassy Santo Domingo — STEP Message: DR Marijuana Laws', 'https://do.usembassy.gov/step-message-dominican-republic-marijuana-laws-a-quick-guide-for-u-s-travelers/', 'Dominican Republic', 'DO', 'Caribbean', 1, 'html_snapshot', 'quarterly', 'government_official', 'Official US Embassy advisory: zero-tolerance confirmation, no CBD distinction'),
  ('Herb.co — How to Buy Weed in the Dominican Republic 2026', 'https://herb.co/city-guides/buy-weed-dominican-republic', 'Dominican Republic', 'DO', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', 'Real Jan 2026 and March 2025 airport arrest cases, Law 50-88 hemp-fiber exclusions'),
  ('Wikipedia — Cannabis in the Dominican Republic', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Dominican_Republic', 'Dominican Republic', 'DO', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', 'Law 50-88 (1988) tiered penalty thresholds'),
  ('Cuenca Expat Hub — Ecuador Cannabis Laws for Expats', 'https://www.cuencaexpathub.com/ecuador-cannabis-laws-for-expats-a-guide-to-hemp--legal-risks', 'Ecuador', 'EC', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2023 quantity-table repeal creating personal-possession gray area, 169 licensed operators/$40M by end 2023'),
  ('LegalClarity — Cannabis Laws in Ecuador', 'https://legalclarity.org/cannabis-laws-in-ecuador-is-it-legal/', 'Ecuador', 'EC', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2019/2020 medical and hemp legalization, Nov 2023 Noboa repeal detail'),
  ('BizLatin Hub — Legal Framework for Cannabis Cultivation in Ecuador', 'https://www.bizlatinhub.com/medicinal-cannabis-ecuador-legislation-spur-commercial-boom/', 'Ecuador', 'EC', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Seven hemp license types under Ministerial Agreement 109-2020')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Djibouti for both recreational and medical purposes, with production, sale, and possession all carrying fines and up to 5 years imprisonment; sale and supply are treated as a much more serious offense carrying life imprisonment, though limited enforcement funding means trafficking laws are inconsistently applied. The law makes no distinction between cannabis and CBD, or between seeds and other plant parts, so both are equally illegal. Djibouti has no domestic hemp industry, partly because its arid terrain is poorly suited to cultivation and partly because cannabis use is not a major domestic issue — Djiboutians overwhelmingly prefer khat, a legal stimulant plant that is culturally central and consumes an estimated 20-40% of average household budgets, making cannabis reform politically low-priority. Djibouti''s port is a significant transit hub for cannabis trafficking from South and Southeast Asia to Africa, the Middle East, and Europe.',
  steps = '[]'::jsonb,
  key_regulators = '["Djiboutian national police and judicial enforcement bodies","Port of Djibouti customs (transit trafficking interdiction, resource-constrained)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming khat''s legal, culturally central status extends to cannabis — the two substances are treated completely differently under Djiboutian law, with khat legal and cannabis criminalized',
    'Assuming CBD or seeds are exempt — Djiboutian law draws no distinction between cannabis and CBD, or between seeds and other plant parts',
    'Assuming resource-constrained trafficking enforcement signals tolerance — funding limitations affect enforcement consistency, not legal status; occasional arrests, particularly in the capital, still occur'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and specialized sources, with the khat/cannabis contrast independently confirmed by Library of Congress research',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Djibouti')
WHERE country_iso2 = 'DJ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'No cost for decriminalized personal possession/cultivation. No commercial medical/industrial licensing framework or fee schedule exists yet — the National Task Force appointed in 2022 and National Cannabis Advisory Committee (active 2025) are still developing regulatory proposals as of the most recent available reporting.',
  legal_framework_summary = 'Dominica decriminalized personal cannabis possession (up to 28 grams) and home cultivation (up to 3 plants) for adults via an October 26, 2020 amendment to the Drugs (Prevention of Misuse) Act, following years of political back-and-forth (a 2019 decriminalization proposal from Prime Minister Roosevelt Skerrit stalled in parliament before eventually passing). Public consumption remains prohibited (EC$1,500 fine, though it does not create a criminal record), and selling or importing cannabis without authorization can carry up to 14 years imprisonment and EC$200,000 in fines. There is no medical cannabis program yet: a National Task Force was appointed in 2022 to develop a regulatory framework, and a National Cannabis Advisory Committee held a National Cannabis Symposium in July 2025 working toward a Medicinal Cannabis Bill and licensing structure, but as of the most recent reporting no such framework has been enacted. Rastafarian communities continue to press for full sacramental legalization; authorities reportedly do not enforce the law against religious use in practice, but this remains an informal tolerance rather than a codified religious exemption.',
  steps = '[{"step":"Personal-use route","detail":"Adults may possess up to 28g and cultivate up to 3 plants without criminal prosecution; public consumption remains a fineable (non-criminal-record) offense"},{"step":"Monitor the medical/commercial framework in development","detail":"Track output from the National Cannabis Advisory Committee and the proposed National Cannabis Regulatory Commission — no licensing pathway exists yet, but Dominica has stated intent to develop one"}]'::jsonb,
  key_regulators = '["National Cannabis Advisory Committee","Commonwealth of Dominica Police Force","Ministry of Ecclesiastical Affairs, Family, and Gender Affairs (religious-freedom liaison on Rastafarian sacramental use)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalization means a medical or commercial market exists — no licensing framework has been enacted; Dominica remains at the policy-development stage as of the most recent reporting',
    'Assuming Rastafarian sacramental use is formally legalized — it is informally tolerated in enforcement practice but not codified as a religious exemption, unlike some neighboring islands',
    'Confusing Dominica (the Commonwealth of Dominica) with the Dominican Republic — they are entirely separate nations with different cannabis legal frameworks'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across official US State Department religious-freedom reporting, Wikipedia''s statutory detail, and current 2026 trade-press coverage of the ongoing regulatory development process',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Dominica')
WHERE country_iso2 = 'DM';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is fully illegal in the Dominican Republic for both recreational and medical use under Law 50-88 on Drugs and Controlled Substances (1988, amended by Laws 17-95 and 35-90), with the US Embassy in Santo Domingo issuing a formal advisory confirming zero-tolerance enforcement. Possession is tiered by quantity: 20 grams or less carries a minimum 6-month sentence; larger amounts escalate toward trafficking classification, with possession of more than one pound (454g) treated as trafficking carrying a minimum 5 years and maximum 20 years imprisonment plus a fine of at least RD$50,000; importation specifically can carry 5 to 30 years. The law does not recognize foreign medical marijuana cards or prescriptions, and CBD/hemp products are not clearly distinguished from THC-containing cannabis — travelers should not assume any THC-content exemption will be honored, despite the statute containing narrow textual exclusions for mature stalk fiber and seed-derived oil/cake. Real 2025-2026 enforcement cases confirm this is actively applied at airports: a US citizen was arrested at Puerto Plata''s Gregorio Luperón International Airport in January 2026 for 17 packages of suspected marijuana and 29 THC vapes, and a Canadian national was arrested at the same airport in March 2025 for 32 packages. Proposed medical cannabis legislation has circulated since around 2021 with continued advocacy, but no bill has passed as of 2026, and there is no evidence of imminent legalization despite periodic government discussion of modernizing Law 50-88 for other purposes.',
  steps = '[]'::jsonb,
  key_regulators = '["Dominican National Drug Control Directorate (DNCD)","Dominican Customs (DGA) — active canine/X-ray screening at international airports"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming any foreign medical marijuana card or prescription is recognized — the Dominican Republic explicitly does not honor these, per official US Embassy guidance',
    'Assuming CBD or hemp-derived products are treated differently from THC cannabis — the law does not clearly distinguish them, and real 2025-2026 arrest cases at Puerto Plata airport show active enforcement against travelers carrying cannabis products',
    'Mistaking beach/resort-area cannabis availability for legality — cannabis is regularly offered to tourists informally, but this reflects enforcement gaps in casual street-level availability, not legal tolerance, and airport/border enforcement remains strict'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — overwhelming corroboration including an official US Embassy advisory and multiple specific, dated 2025-2026 enforcement cases',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://do.usembassy.gov/step-message-dominican-republic-marijuana-laws-a-quick-guide-for-u-s-travelers/')
WHERE country_iso2 = 'DO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'Non-psychoactive hemp/CBD licensing: seven license types under Ministerial Agreement No. 109-2020 (import/commercialization of seeds, sowing/production of seeds, cultivation, processing, plant breeding/research, export of derivatives/biomass), open only to incorporated companies, non-transferable; by end of 2023 Ecuador had approved ~$40 million in cannabis-sector investment contracts across 169 licensed operators. Medical/psychoactive cannabis licensing runs through SETED (research) and separate pharmaceutical-production channels.',
  legal_framework_summary = 'Ecuador draws a sharp legal line between non-psychoactive cannabis/hemp (under 1% THC by dry weight — legal for therapeutic, scientific, medicinal, and industrial purposes under a licensing framework established via the 2019 medical cannabis law, a December 2019 Organic Law, and Ministerial Agreement No. 109-2020) and psychoactive cannabis/marijuana (1%+ THC — recreational use not permitted). Medical cannabis was legalized by the National Assembly in September 2019 (83-23 vote), with products capped at 1.0% THC and requiring a diagnosed medical justification; ARCSA Resolution No. ARCSA-DE-002-2021-MAFG later set sanitary technical THC limits for different product categories. Personal recreational possession is in a genuine, well-documented legal gray area rather than settled either way: a 2013 reform decriminalized possession up to 10 grams, but President Daniel Noboa repealed the specific drug-quantity table on November 24, 2023, as part of an anti-micro-trafficking campaign, removing the bright-line threshold without providing a clear replacement rule. Ecuador''s National Court of Justice has since clarified that simple possession for personal use is not automatically a crime, but left it to case-by-case judicial/prosecutorial determination whether a given quantity reflects personal use or trafficking intent — creating real, acknowledged legal risk for individuals rather than a settled decriminalized threshold.',
  steps = '[{"step":"Non-psychoactive hemp/CBD route","detail":"Apply for one of seven license types under Ministerial Agreement No. 109-2020 through the Ministry of Agriculture and Livestock (MAG); only incorporated/domiciled Ecuadorian entities qualify; THC must stay below 1%"},{"step":"Medical/psychoactive cannabis route","detail":"Engage ARCSA and the Ministry of Health for medicinal product registration (THC-based products capped per ARCSA Resolution ARCSA-DE-002-2021-MAFG); SETED separately licenses cultivation for scientific research"},{"step":"Do not rely on a specific personal-possession threshold","detail":"Since the November 2023 repeal of the 10g quantity table, there is no codified safe-harbor amount for personal use — the National Court of Justice has said simple possession is not automatically criminal, but case-by-case judicial interpretation determines the outcome"}]'::jsonb,
  key_regulators = '["Ministry of Agriculture and Livestock (MAG) — hemp/non-psychoactive cannabis licensing","Agency for Health Regulation, Control, and Surveillance (ARCSA) — medical product THC/sanitary standards","Technical Secretariat of Drugs (SETED) — scientific research cultivation licensing","National Court of Justice (case-by-case personal-use determination)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the pre-2023 10-gram personal possession threshold still applies — President Noboa repealed the specific drug-quantity table in November 2023, and no replacement bright-line threshold has been established',
    'Assuming a licensed hemp/industrial cannabis operation permits any psychoactive-cannabis activity — Ecuador maintains a strict THC-based dividing line (1% by dry weight) between the legal non-psychoactive framework and the separately regulated (and more restricted) psychoactive/medical channel',
    'Assuming personal cultivation for consumption is clearly protected — while some sources describe pre-2023 tolerance for a small number of personal plants, there is no exact codified law stating this, and the post-2023 gray area affects cultivation as much as possession'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — the hemp/medical licensing framework is extensively and consistently corroborated across multiple legal-analysis and industry sources; the post-2023 personal-possession gray area is itself consistently documented as genuinely unresolved (not a source conflict, but an acknowledged real ambiguity in Ecuadorian law)',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cuencaexpathub.com/ecuador-cannabis-laws-for-expats-a-guide-to-hemp--legal-risks')
WHERE country_iso2 = 'EC';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('DJ','DM','DO','EC');
