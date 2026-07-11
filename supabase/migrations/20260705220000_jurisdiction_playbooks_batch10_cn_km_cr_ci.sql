-- Research batch 10 of jurisdiction_playbooks: China, Comoros, Costa Rica, Cote d'Ivoire.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('CannabisRegulations.ai — China marijuana', 'https://www.cannabisregulations.ai/country-legality/china-marijuana', 'China', 'CN', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Article 347 trafficking thresholds, PSAPL possession penalty detail'),
  ('Cannigma — Cannabis laws in China', 'https://cannigma.com/regulation/cannabis-laws-china/', 'China', 'CN', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Industrial hemp export market, 1985 Convention on Psychotropic Substances accession'),
  ('Leafwell — Is Marijuana Legal in China', 'https://leafwell.com/blog/is-marijuana-legal-in-china', 'China', 'CN', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '1985 cultivation ban, CBD food/medicine prohibition despite export'),
  ('Wikipedia — Cannabis in Comoros', 'https://en.wikipedia.org/wiki/Cannabis_in_Comoros', 'Comoros', 'KM', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', '1975-1978 legalization under Ali Soilih, current prohibition'),
  ('CannaConnection — Legal status of cannabis in Comoros', 'https://www.cannaconnection.com/blog/14828-legal-status-comoros', 'Comoros', 'KM', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'No near-term reform indicated'),
  ('Central Law — Costa Rica Medicinal Cannabis Regulatory Framework', 'https://central-law.com/en/costa-rica-medicinal-cannabis-an-evolving-regulatory-framework-and-investment-opportunities/', 'Costa Rica', 'CR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Law 10113 license categories and terms, One-Stop Investment Window'),
  ('Costa Rica Immigration — Costa Rica Cannabis Law', 'https://costarica-immigration.com/costa-rica-cannabis-law/', 'Costa Rica', 'CR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2024 recreational bill status, foreign investment rules'),
  ('High Times — Costa Rica Grants First Medical Cannabis Cultivation License', 'https://hightimes.com/news/costa-rica-grants-first-medical-cannabis-cultivation-license/', 'Costa Rica', 'CR', 'Latin America', 2, 'html_snapshot', 'monthly', 'trade_press', 'Real first-licensee example (Azul Wellness S.A.), 1% THC hemp threshold'),
  ('Leafwell — Is Marijuana Legal in Cote d''Ivoire', 'https://leafwell.com/blog/is-marijuana-legal-in-cote-divoire', 'Cote d''Ivoire', 'CI', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law No. 88-686 (1988), 2022 Senate committee reform bill, real 2021 case example'),
  ('Wikipedia — Cannabis in Ivory Coast', 'https://en.wikipedia.org/wiki/Cannabis_in_Ivory_Coast', 'Cote d''Ivoire', 'CI', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', '1989-1990 cocoa crisis cultivation surge context')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable for any consumer/recreational/medical pathway. China has a large industrial hemp export industry (Yunnan and Heilongjiang "hemp hubs") with an NMPA cosmetics-approval pathway for CBD, but no domestic consumption market — cost structures apply only to export-oriented hemp fiber/cosmetic ingredient production, not consumer cannabis or CBD products.',
  legal_framework_summary = 'Cannabis is completely illegal in China for recreational and medical use, classified under the Criminal Law as equivalent to heroin, opium, and methamphetamine, with no exceptions. Personal possession of any quantity triggers administrative detention of 10-15 days plus fines up to 2,000 RMB under the Public Security Administration Punishments Law; possessing 200 grams or more crosses into criminal territory carrying sentences starting at three years, and Article 347 allows life imprisonment or the death penalty for trafficking 50+ grams of resin or 10+ kilograms of leaf cannabis. Despite this, China has never banned hemp cultivation for industrial purposes and is the world''s largest hemp producer, with government-sanctioned "hemp hubs" in Yunnan and Heilongjiang provinces growing fiber and CBD strictly for export — domestic sale and consumption of CBD in food, medicine, or consumer products has been banned since 2021, and CBD cosmetics require separate NMPA approval. Foreign nationals face the same zero-tolerance enforcement as citizens, typically resulting in detention, imprisonment, deportation, and a lifetime re-entry ban.',
  steps = '[{"step":"Industrial hemp export route only","detail":"Cultivation and export of fiber and CBD for international markets is permitted through licensed operations concentrated in Yunnan and Heilongjiang provinces — this is strictly an export/industrial channel with zero domestic consumer market access"},{"step":"CBD cosmetics route","detail":"A narrow NMPA approval pathway exists for CBD as a cosmetic ingredient; food, beverage, and medicinal CBD products remain banned domestically regardless of THC content"}]'::jsonb,
  key_regulators = '["National Medical Products Administration (NMPA) — cosmetics approval","Ministry of Public Security — narcotics enforcement","Customs — border seizure of CBD/cannabis products regardless of stated THC content"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming China''s massive industrial hemp export industry implies any domestic consumer legality — hemp/CBD produced in China is exclusively for export; domestic sale and consumption in food, medicine, or consumer products has been banned since 2021',
    'Bringing any CBD product into China expecting leniency because it is legal at the point of origin — customs treats CBD the same as high-THC cannabis products and routinely seizes it',
    'Assuming foreign nationals receive different treatment than citizens — enforcement is applied equally, with typical outcomes including detention, imprisonment, deportation, and a lifetime re-entry ban'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across multiple independent legal-analysis sources with consistent statutory citation (Article 347, PSAPL thresholds) and consistent detail on the hemp-export/domestic-ban dichotomy',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabisregulations.ai/country-legality/china-marijuana')
WHERE country_iso2 = 'CN';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is currently illegal in Comoros for cultivation, sale, and possession, with no legal recreational or medical pathway as of the most recent available confirmation (September 2019). Notably, Comoros had a distinct historical period of legal cannabis: between January 1975 and May 1978, President Ali Soilih legalized cannabis as part of a broader set of radical youth-oriented reforms following his seizure of power — one of the few documented instances globally of a national government fully legalizing cannabis, only to later reverse the policy. No indication of any near-term legislative movement toward re-legalization has been identified in available sources.',
  steps = '[]'::jsonb,
  key_regulators = '["Comorian national police and judicial enforcement bodies (specific agency names not well documented in available English-language sources)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 1975-1978 legalization period has any bearing on current law — cannabis has been illegal again for decades and there is no indication of movement to restore that earlier policy',
    'Assuming CBD or hemp products are treated separately from THC-containing cannabis — no such distinction is established in available Comorian legal sources',
    'Treating this entry as equally well-documented as larger jurisdictions — available English-language legal sourcing on Comoros is comparatively thin'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the core prohibition and the historical 1975-1978 legalization period, both consistently corroborated across multiple sources; lower confidence on granular penalty specifics, which are thinly documented',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Comoros')
WHERE country_iso2 = 'KM';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Six-year renewable licenses across four categories (cultivation/primary production, manufacturing, import of psychoactive derivatives, import of propagative material); fees are proportional to business size and nature per the Ministry of Agriculture and Livestock, with no self-cultivation option available at any scale',
  legal_framework_summary = 'Costa Rica legalized medical and therapeutic cannabis and industrial hemp under Law 10113 ("The Law for the Medical and Therapeutic Use of Cannabis and for the Industrial Use of Hemp"), signed March 2, 2022 — the country''s first cannabis legal framework. The law establishes distinct licensing categories for cultivation/primary production, manufacturing of psychoactive derivatives and medicines, and import of derivatives, finished products, or propagative material, each granted for a renewable six-year term by the Ministry of Health and Ministry of Agriculture and Livestock (MAG); home cultivation is explicitly prohibited, and unlicensed cultivation or sale carries 6-12 years imprisonment. Industrial hemp is defined at up to 1% THC by dry weight (more permissive than the 0.3% US standard) and is legal for food and industrial use. Recreational cannabis remains illegal, though personal possession in small doses (informally understood as roughly 1-8 grams) is not typically prosecuted in practice due to statutory ambiguity in the underlying Narcotics Law No. 8204, and a separate 2024 government-submitted recreational legalization bill remains under legislative discussion with no enactment as of 2026. The first medical cultivation license was granted to Azul Wellness S.A. in 2023.',
  steps = '[{"step":"Choose a license category","detail":"Apply for one of: cultivation/primary production, manufacturing of psychoactive derivatives/medicines, import of finished products, or import of propagative material — each is a distinct 6-year renewable license issued by Ministry of Health and/or MAG"},{"step":"Meet registration and compliance requirements","detail":"Register as an employer with the Costa Rican Social Security Fund (CCSS), obtain environmental and local government permits, and submit a sworn statement of no disqualifying prohibitions"},{"step":"Plan for traceability requirements","detail":"A seed-to-sale traceability system is being phased in; until fully operational, oversight runs through MAG, Ministry of Health, and the Costa Rica Institute on Drugs (ICD)"},{"step":"Do not plan around home cultivation","detail":"Self-cultivation for personal medical use is explicitly prohibited under Law 10113 — all cultivation must occur under a licensed commercial operation"}]'::jsonb,
  key_regulators = '["Ministry of Health (Ministerio de Salud)","Ministry of Agriculture and Livestock (MAG)","Costa Rica Institute on Drugs (ICD)","Costa Rican Foreign Trade Promotion Agency (PROCOMER) — One-Stop Investment Window coordination"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming home cultivation is available for medical patients — Law 10113 explicitly prohibits self-cultivation; all product must come from a licensed commercial operation via pharmacy or CCSS',
    'Assuming tourist or foreign medical cannabis prescriptions are honored — Costa Rica does not recognize foreign prescriptions and tourists cannot access the medical program',
    'Assuming the 2024 recreational legalization bill is close to passage — it remains under legislative discussion with no confirmed enactment timeline as of 2026'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a specialized regulatory law firm analysis, multiple independent trade-press sources, and Wikipedia, including a real documented first-licensee example',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://central-law.com/en/costa-rica-medicinal-cannabis-an-evolving-regulatory-framework-and-investment-opportunities/')
WHERE country_iso2 = 'CR';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Cote d''Ivoire for both medical and recreational use under Law No. 88-686 (1988) on the suppression of trafficking and illicit use of narcotic drugs, with no distinction made between THC-rich cannabis and CBD/hemp products. Simple possession or consumption can carry 3-5 years imprisonment plus fines, and cultivation is prosecuted severely — a documented 2021 case saw a grower sentenced to 10 years imprisonment plus a fine of roughly 1,680 USD for a discovered cannabis field. The country has among the highest cannabis seizure rates in Africa, with cultivation notably surging after a 1989-1990 "cocoa crisis" made cannabis dramatically more profitable per hectare than the country''s traditional cocoa export crop. In May 2022, a Senate committee passed a bill reframing drug users as needing therapeutic/rehabilitative assistance rather than punishment, but available sources do not confirm this bill was subsequently signed into law or is currently in force — its enactment status should be verified before relying on it.',
  steps = '[]'::jsonb,
  key_regulators = '["Anti-drug police (PAD — Police Anti-Drogue)","Ministry of Interior and Security","Judicial enforcement under Law No. 88-686"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2022 Senate committee-passed rehabilitation-focused bill is current law — available sources confirm committee passage but do not confirm final enactment; verify current status before relying on a more lenient framework',
    'Assuming CBD or hemp products are treated separately from THC-containing cannabis — Cote d''Ivoire''s law makes no such distinction',
    'Underestimating enforcement severity for cultivation specifically — a documented 2021 case resulted in a 10-year sentence for a single discovered cannabis field, reflecting the country''s aggressive anti-trafficking posture'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the core prohibition and penalty structure, extensively corroborated across multiple independent sources including a specific documented case; medium on the 2022 reform bill''s final enactment status, which is not confirmed in available sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-cote-divoire')
WHERE country_iso2 = 'CI';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('CN','KM','CR','CI');
