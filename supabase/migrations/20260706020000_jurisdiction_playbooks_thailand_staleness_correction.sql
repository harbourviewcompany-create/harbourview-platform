-- Correction: jurisdiction_playbooks.TH was stale, describing Thailand's
-- pre-June-2025 permissive recreational framework as current. In reality,
-- Thailand re-criminalized recreational cannabis on June 25, 2025 (Notification
-- on Controlled Herbs B.E. 2568), moving to a medical-only PT33-prescription
-- model, with a further Ministerial Regulation on Category 5 Narcotics
-- (extracts) effective April 26, 2026. Discovered incidentally while
-- researching Eritrea (a "Legality of cannabis" Wikipedia citation referenced
-- a June 2025 Independent article on the reversal) and verified directly.
-- This is a reminder that 'published' status needs periodic re-verification,
-- not just initial sourcing -- staleness on a trusted entry is worse than an
-- honest 'draft' stub.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Al Jazeera — Thailand moves to re-criminalise cannabis', 'https://www.aljazeera.com/news/2025/6/26/thailand-moves-to-re-criminalise-cannabis-in-blow-to-1bn-industry', 'Thailand', 'TH', 'Asia', 2, 'html_snapshot', 'monthly', 'news', 'June 25 2025 Notification on Controlled Herbs, medical-only restriction'),
  ('CannabisRegulations.ai — Thailand marijuana (2026 update)', 'https://www.cannabisregulations.ai/country-legality/thailand-marijuana', 'Thailand', 'TH', 'Asia', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'PT33 prescription system, April 2026 Ministerial Regulation on Category 5 Narcotics extract import/export'),
  ('Terms.Law — Thailand Cannabis Laws 2026', 'https://terms.law/Thai/cannabis/cannabis-2025-status.html', 'Thailand', 'TH', 'Asia', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Shop closure statistics (7,297 of 18,433 closed by Feb 2026), public health impact data')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high',
  typical_timeline_months = 12,
  estimated_cost_range = 'Medical dispensary licensing requires on-site certified medical/traditional-medicine practitioner supervision and GACP-compliant cultivation; extract import/export licensing under the April 2026 Ministerial Regulation is limited to registered medical facilities, pharmacies, and herbal medicine shops with documented medical/research/commercial-extract purposes. The pre-2025 low-barrier retail/wellness-shop model no longer applies.',
  legal_framework_summary = 'Thailand''s 2022 decriminalization era ended on June 25, 2025, when the Ministry of Public Health issued a Notification on Controlled Herbs (B.E. 2568) restricting cannabis flower to medical use only — recreational sale and possession are once again illegal. Cannabis was not returned outright to the Category 5 narcotics list; instead, flowering buds are regulated as a controlled herb (lighter penalties than narcotics offenses, but still criminal for unlicensed recreational sale/possession), while extracts above 0.2% THC remain full Category 5 narcotics. To legally purchase, a buyer needs a PT33 prescription from a certified practitioner (valid up to 30 days) from a licensed dispensary with on-site medical supervision; public consumption carries fines up to 25,000 THB. A Ministerial Regulation on Category 5 Narcotics (Cannabis/Hemp Extracts) B.E. 2569, published March 26, 2026 and effective April 26, 2026, now separately governs extract import/export licensing through the Thai FDA and Office of the Narcotics Control Board. The policy reversal has had major market impact: of roughly 18,433 cannabis shops operating nationwide, 7,297 had closed by February 2026 after failing to meet the stricter medical-supervision licensing requirements, with further license expirations (4,587 in 2026, 5,210 in 2027) expected to continue shrinking the retail base. Foreign nationals visiting or living in Thailand should not rely on pre-2025 information describing Thailand as a permissive recreational market — that framework no longer exists.',
  steps = '[{"step":"Confirm current medical-only framework before any planning","detail":"Do not rely on 2022-2024-era descriptions of Thailand as a recreational market — the June 2025 reversal is definitive and enforced"},{"step":"Medical dispensary route","detail":"Operate under GACP cultivation standards with certified medical/traditional-medicine practitioner supervision; patients require a PT33 prescription (30-day validity) to purchase"},{"step":"Extract import/export route","detail":"Apply for Thai FDA / Office of the Narcotics Control Board licensing under the April 2026 Ministerial Regulation for cannabis/hemp extract import or export; limited to registered medical facilities, pharmacies, and herbal medicine shops"},{"step":"Plan for continued consolidation","detail":"Factor in further 2026-2027 license-renewal attrition (thousands of additional shop licenses expiring) when assessing retail-channel partners"}]'::jsonb,
  key_regulators = '["Thai Food and Drug Administration (Thai FDA)","Ministry of Public Health","Department of Thai Traditional and Alternative Medicine","Office of the Narcotics Control Board"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on 2022-2024-era information describing Thailand as a permissive recreational cannabis market — this ended definitively on June 25, 2025, and is actively enforced with real shop closures and fines',
    'Assuming CBD/hemp extracts and flower are regulated identically — flower is a "controlled herb" with lighter penalties, while extracts above 0.2% THC remain full Category 5 narcotics under separate, stricter licensing',
    'Underestimating market contraction — nearly 40% of previously operating cannabis shops (7,297 of 18,433) had closed by February 2026 due to the stricter medical-supervision requirements, with further attrition expected through 2027'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Al Jazeera, Forbes, and multiple specialized legal-analysis sources with consistent dates and mechanism detail; this update corrects a materially stale prior entry that still described the pre-June-2025 permissive framework',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.aljazeera.com/news/2025/6/26/thailand-moves-to-re-criminalise-cannabis-in-blow-to-1bn-industry')
WHERE country_iso2 = 'TH';
