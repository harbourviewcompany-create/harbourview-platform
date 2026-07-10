-- Research batch 4 of jurisdiction_playbooks: Azerbaijan, Bahamas, Bahrain, Bangladesh.
-- Bahamas is flagged 'needs_review' (draft, not published) rather than auto-published:
-- three sources directly conflict on whether the governing Cannabis Act/Bill has
-- actually been enacted (2023 per Wikipedia, assented July 2024 per two sources,
-- still not enacted as of May 2026 per another). Requires human verification
-- against the official Bahamas government legislation gazette.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Azerbaijan', 'https://en.wikipedia.org/wiki/Cannabis_in_Azerbaijan', 'Azerbaijan', 'AZ', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '1998 Law on Narcotic Drugs, cultivation extent, penalty structure'),
  ('CannabisLaws.Global — Azerbaijan', 'https://cannabislaws.global/azerbaijan/', 'Azerbaijan', 'AZ', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Small-quantity non-prosecution practice, no CBD distinction'),
  ('CannaCarib — Cannabis in the Bahamas 2026', 'https://www.cannacarib.net/bahamas/', 'Bahamas', 'BS', 'Caribbean', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Reports Cannabis Bill 2024 as introduced but NOT enacted as of May 2026 — conflicts with other sources'),
  ('Herb.co — How to Buy Weed in the Bahamas 2026', 'https://herb.co/city-guides/buy-weed-bahamas', 'Bahamas', 'BS', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', 'Reports Cannabis Act 2024 assented July 26 2024 but not fully operationalized — conflicts with cannacarib.net'),
  ('Wikipedia — Cannabis in the Bahamas', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Bahamas', 'Bahamas', 'BS', 'Caribbean', 2, 'html_snapshot', 'monthly', 'reference', 'States Cannabis Bill enacted 2023 — third conflicting version of enactment timeline'),
  ('Wikipedia — Cannabis in Bahrain', 'https://en.wikipedia.org/wiki/Cannabis_in_Bahrain', 'Bahrain', 'BH', 'Middle East', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition confirmed, case example of 2014 conviction'),
  ('Leafwell — Is Marijuana Legal in Bahrain', 'https://leafwell.com/blog/is-marijuana-legal-in-bahrain', 'Bahrain', 'BH', 'Middle East', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 15/2007 penalty structure detail'),
  ('Wikipedia — Cannabis in Bangladesh', 'https://en.wikipedia.org/wiki/Cannabis_in_Bangladesh', 'Bangladesh', 'BD', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Narcotics Control Act 2018, death penalty threshold, cultivation regions')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Sale, use, possession, and cultivation of cannabis are illegal under the 1998 Law on Narcotic Drugs, Psychotropic Substances, and Precursors, with no medical program in place. In practice, possession of small amounts (sources cite thresholds between roughly 2.5 and 10 grams) is often treated as personal use and handled through family referral for addiction treatment rather than criminal prosecution, but cultivation or possession above that threshold is prosecuted as trafficking, carrying penalties up to 8 years imprisonment for cultivation and up to 12 years for possession of over 1,000 grams. CBD is treated identically to THC with no cannabinoid distinction, so it is equally illegal, and state-authorized cultivation is limited strictly to experimental medical product samples under direct government control.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Internal Affairs","State Customs Committee"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming small-amount non-prosecution equals formal decriminalization or legality — it is prosecutorial discretion, not a legal exemption',
    'Assuming CBD is treated differently from THC — Azerbaijani law makes no such distinction',
    'Assuming the state-authorized experimental medical cultivation exception signals an emerging program — it is narrow, government-controlled, and not accessible to private entities'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Azerbaijan')
WHERE country_iso2 = 'AZ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 12,
  estimated_cost_range = 'Unresolved — dependent on which legislative status is accurate (see confidence note); if the Cannabis Act 2024 framework is confirmed in force, import/export licenses were reported at $10,000 each with 100% Bahamian ownership required for cultivation/sales/transport licenses',
  legal_framework_summary = 'Bahamian cannabis law is in a confirmed state of legislative flux with directly conflicting reports as of mid-2026. Some 2026 sources state a Cannabis Act 2024 received formal assent on July 26, 2024, establishing a $250 fixed-penalty framework for possession under 30 grams, legalizing medical and religious use, and creating the Bahamas Cannabis Authority — but report that implementing/commencement regulations have not been fully operationalized, so on-the-ground enforcement under the older Dangerous Drugs Act (a criminal offense carrying up to $125,000 in fines or 10 years imprisonment) reportedly continued through at least September 2025. A separate May 2026 source instead describes an equivalent "Cannabis Bill 2024" as merely introduced and not yet enacted. Wikipedia states a Cannabis Bill was already enacted in 2023 alongside amendments removing "Indian Hemp" from the Dangerous Drugs Act. Given this direct three-way conflict on whether the governing law has actually passed, this entry requires human verification against the official Bahamian government legislation gazette before being treated as authoritative.',
  steps = '[]'::jsonb,
  key_regulators = '["Bahamas Cannabis Authority (proposed/established per some sources; licensing platform reportedly built but not accepting applications)","Royal Bahamas Police Force","Ministry of Agriculture (cultivation zoning)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on any single source for current Bahamian cannabis legal status — sources actively conflict on whether the governing Act has passed at all',
    'Assuming the $250 fixed-penalty framework is currently enforced — multiple 2026 sources report enforcement still followed the older criminal Dangerous Drugs Act as of late 2025',
    'Assuming licensing is open — the Cannabis Authority''s platform is reported as built but not yet accepting applications'
  ],
  status = 'draft', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — conflicting 2026 sources disagree on whether the governing Cannabis Act/Bill has been enacted; flagged for human verification against the official Bahamas legislation gazette',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannacarib.net/bahamas/')
WHERE country_iso2 = 'BS';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is classified as a Schedule I narcotic under Law No. 15 of 2007, with no legal pathway for recreational or medical use and no distinction drawn between CBD and THC. Bahrain applies among the harshest penalty structures in the world for cannabis offenses: fines of up to BD 50,000, life imprisonment, or the death penalty for trafficking-scale possession or distribution, with stiffer penalties for repeat offenders and public officials. As a GCC member, Bahrain enforces a zero-tolerance drug policy with heavily monitored borders and active anti-trafficking cooperation with the UNODC since 2014; even CBD-containing skincare products can be treated as illicit.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Interior (narcotics enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Bahrain''s relatively liberal regional reputation in other areas extends to drug policy — cannabis enforcement is among the strictest in the world',
    'Assuming CBD-only products are exempt — Bahraini law makes no distinction from THC-containing cannabis, and even skincare products have been treated as illicit',
    'Carrying any cannabis-derived product across the border, including for prescribed medical use elsewhere — enforcement applies regardless of intent or THC content'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference, legal-analysis, and legal-directory sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bahrain')
WHERE country_iso2 = 'BH';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, transport, sale, purchase, and possession of cannabis in all forms have been illegal in Bangladesh since 1989, currently governed by the Narcotics Control Act 2018, which gives courts discretionary power to impose the death penalty for possession over 2 kilograms. CBD is not legally distinguished from cannabis and is equally illegal. Despite this strict statutory framework, enforcement is reported to be lax in practice, and Bangladesh remains a notable cultivator in specific districts (Naogaon, Rajshahi, Jamalpur, Netrokona, and Chittagong Hill Tract areas near Cox''s Bazaar), with cannabis retaining deep cultural and traditional roots, including at the annual Lalon Shah folk festival in Kushtia.',
  steps = '[]'::jsonb,
  key_regulators = '["Department of Narcotics Control","Bangladesh Police"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming lax on-the-ground enforcement signals tolerance for any commercial activity — no legal pathway exists and the 2018 Act permits the death penalty for larger quantities',
    'Assuming CBD is treated separately from THC — Bangladeshi law makes no such distinction',
    'Confusing cultural or traditional tolerance at specific events or in specific communities with legal permission — cultivation, sale, and possession remain criminal offenses nationwide'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bangladesh')
WHERE country_iso2 = 'BD';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AZ','BH','BD');

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'needs_review', last_researched_at = now(), last_researched_by = 'claude-agent',
    research_notes = 'Three sources conflict on whether the Cannabis Act/Bill has actually been enacted (2023 per Wikipedia, assented July 2024 per two sources, still not enacted as of May 2026 per another). Needs verification against official Bahamas government gazette.'
WHERE country_code = 'BS';
