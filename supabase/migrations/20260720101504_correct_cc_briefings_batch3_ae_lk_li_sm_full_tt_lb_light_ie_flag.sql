-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260720101504.
--
-- Rewriting this file cannot affect production: 20260720101504 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Four more full corrections (AE, LK, LI, SM), two lighter-touch fixes for overstated
-- operational maturity (TT, LB), and one flagged-not-asserted item (IE).
-- AE: cited the superseded 1995 law and omitted both the 2021 reform (Decree-Law 30 --
--     rehab pathway, Article 96 entry-point mechanism) and the brand-new Jan 2026 Industrial
--     Hemp Decree-Law entirely.
-- LK: claimed Ayurvedic cannabis use is "not formally recognized" -- it is, via the Ayurveda
--     Act (state Ayurvedic Drugs Corporation, ~16,000 licensed physicians); also omitted the
--     Aug 2025 BOI export-only cultivation scheme entirely.
-- LI/SM: both overstated neighbor-alignment (Switzerland / Italy respectively) in a way that
--     contradicts specific, sourced facts -- Liechtenstein's own minister explicitly rejected
--     following Switzerland (2018) and banned industrial hemp entirely (2005); San Marino's
--     medical access is a narrow domestic Sativex program, not Italian AIFA-protocol access.
-- TT/LB: not factually false, but overstate operational maturity -- TT's CLA exists in statute
--     but was never proclaimed into an operating body; LB's Authority was only constituted in
--     summer 2025, five years after the law, and says 2026 is too tight even for a first harvest.
-- IE: flagging, not asserting -- a "2023 Health (Amendment) Act" and an already-introduced
--     diversion scheme could not be corroborated against two independent research passes
--     (mine, and another agent's), both of which found MCAP still described as a pilot and the
--     diversion scheme as planned (National Drugs Strategy 2026-2029), not yet enacted.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited (2021 Procedural Reform); New Industrial Hemp Framework (2026)',
  public_summary = 'The UAE''s narcotics law was replaced in 2021 by Federal Decree-Law No. 30 (superseding the 1995 law), which removed automatic prison time and the prior mandatory minimum for qualifying first-time personal-use offenses, substituting a rehabilitation pathway. A separate entry-point mechanism (Article 96 / Cabinet Resolution 43) allows seizure and entry denial without criminal charges for qualifying cases at borders. Trafficking and sale remain severely punished (5-year minimum, up to life or death in defined cases), and CBD/hemp consumer products are still treated as cannabis in practice -- any detectable THC can trigger prosecution. A new Industrial Hemp Decree-Law took effect 1 January 2026, creating the UAE''s first federal licensing framework for industrial hemp (THC capped at 0.3% dry-weight) covering cultivation, processing, and use in authorized medical products -- a narrow, security-heavy industrial/pharmaceutical framework, not a consumer opening. Treatment of cannabis flower and CBD extraction under the new law remains explicitly unresolved pending implementing regulations.',
  regulatory_outlook = 'Reform trajectory is narrowly industrial and pharmaceutical, state-driven rather than consumer-facing. Key open question is how flower-based cultivation and CBD extraction will be treated under the new hemp law -- unresolved as of this review. No consumer-facing reform (medical prescribing recognition, CBD retail, decriminalization) is on the agenda.',
  data_source_summary = 'Wikipedia; LYLAW (Article 96/Resolution 43, documented acquittal case); MIO & Partners (Industrial Hemp Decree-Law detail); Hemp Today (unresolved flower-treatment analysis).',
  confidence_score = 0.82,
  confidence_categories = '{"enforcement": 0.8, "market_access": 0.3, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry cited the superseded 1995 law and omitted the 2021 procedural reform and the new Jan 2026 Industrial Hemp Decree-Law entirely", "market": "United Arab Emirates", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "MIO & Partners; LYLAW; Wikipedia", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'AE';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; Ayurvedic Channel Formally Legal; New Export-Only Scheme (2025)',
  public_summary = 'Recreational cannabis is fully illegal in Sri Lanka under the Poisons, Opium and Dangerous Drugs Ordinance of 1935, which is interpreted to cover industrial hemp and CBD as well. Traditional Ayurvedic use IS formally legally recognized, not merely historical: the Ayurveda Act permits the state Ayurvedic Drugs Corporation as the exclusive lawful source of cannabis-based preparations, dispensed by roughly 16,000 licensed Ayurvedic physicians -- though supply has historically relied on police-seized cannabis, often degraded by the time lengthy court cases release it. In August 2025, the Board of Investment approved cannabis cultivation licenses for 7 foreign investors (of 37 proposals) strictly for pharmaceutical-grade export -- each requiring a minimum $5M investment plus a $2M performance bond with the Central Bank -- explicitly not for any domestic market, following Sri Lanka''s 2022 debt default and IMF bailout.',
  regulatory_outlook = 'The August 2025 export scheme is the development to watch, not domestic reform -- officials have stressed zero tolerance for domestic leakage. Sri Lanka''s own National Dangerous Drugs Control Board chairman has publicly questioned the scheme''s economics given global cannabis oversupply. No domestic medical or recreational reform is anticipated.',
  data_source_summary = 'Leafwell; Wikipedia; OneWorld SouthAsia (Aug 2025 licensing detail); MJBizDaily.',
  confidence_score = 0.8,
  confidence_categories = '{"enforcement": 0.75, "market_access": 0.4, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said Ayurvedic use is not formally recognized (it is, via the Ayurveda Act) and omitted the Aug 2025 BOI export-only cultivation scheme entirely", "market": "Sri Lanka", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "OneWorld SouthAsia; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'LK';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; No Swiss-Style Reform Adopted',
  public_summary = 'Liechtenstein has not followed Switzerland''s more liberal cannabis trajectory despite the customs union -- its own government has explicitly rejected doing so. Then-Minister of Social Affairs Mauro Pedrazzini said in 2018 he preferred to "wait and see" rather than follow neighboring countries, and did not want Liechtenstein to become a "stoner stronghold in the Rhine Valley." Industrial hemp has been banned outright since a 2005 decree -- stricter than Switzerland''s framework, not aligned with it. Medical access is limited to prescription-only Sativex and Epidiolex via the EMA pharmaceutical pathway (as a European Medicines Agency-linked market), not general access to "Swiss-authorised" cannabis medicines. Cannabis under the 1983 Law on Narcotics and Psychotropic Substances is defined only above 1% THC; sub-threshold CBD sits in an unresolved gray zone rather than being affirmatively legal, and as a non-EU state Liechtenstein is not bound by EU-level CBD rulings.',
  regulatory_outlook = 'No reform is anticipated. The only organized reform push (2018, Free List party) did not advance and was explicitly rejected by the responsible minister; no government initiative has followed. Liechtenstein''s trajectory should not be assumed to track Switzerland''s.',
  data_source_summary = 'Wikipedia; Leafwell; Cannigma; CannaConnection.',
  confidence_score = 0.82,
  confidence_categories = '{"enforcement": 0.7, "market_access": 0.15, "regulatory_framework": 0.8}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry overstated Swiss regulatory alignment; Liechtenstein''s government explicitly rejected following Switzerland''s approach in 2018 and has banned industrial hemp outright since 2005", "market": "Liechtenstein", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Wikipedia; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'LI';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; Narrow Domestic Sativex-Only Medical Access',
  public_summary = 'San Marino''s medical cannabis access is a narrow, self-administered domestic program, not access via Italian AIFA protocols. Since 2016, following a citizen-initiated istanza d''Arengo, San Marino has provided the pharmaceutical Sativex free of charge through its own health system for two specific conditions (MS-related pain, spinal cord/bone-marrow pain) -- imported as a finished product, with cultivation illegal even for this purpose. In 2021 San Marino entered a research partnership with Italy (data-sharing, clinical trials, continuing education), which is distinct from a general AIFA-protocol access arrangement. A 2019 proposal to regulate recreational use (30g possession, 4-plant home grow) was approved but reversed by Parliament in March 2020, which opted to wait and follow Italy''s lead -- Italy has not itself legalized recreational cannabis. Outside the Sativex program, narcotics penalties (3-8 years plus fine) apply without a specific lighter cannabis carve-out.',
  regulatory_outlook = 'No independent reform is anticipated; San Marino remains loosely tethered to Italy via the 2021 research partnership rather than full regulatory integration. Any recreational movement is tied to Italy''s own (currently absent) reform trajectory.',
  data_source_summary = 'Wikipedia; Leafwell; Cannigma; CannaConnection.',
  confidence_score = 0.78,
  confidence_categories = '{"enforcement": 0.65, "market_access": 0.15, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry characterized medical access as via Italian AIFA protocols; it is a narrow, self-administered domestic Sativex-only program since 2016, distinct from a 2021 Italy research partnership", "market": "San Marino", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Wikipedia; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'SM';

UPDATE public.cc_jurisdiction_briefings
SET
  public_summary = 'Trinidad and Tobago decriminalized possession of up to 30 grams of cannabis in 2019 through the Dangerous Drugs (Amendment) Act. Separately, the Cannabis Control Act, 2022 created the Cannabis Licensing Authority in statute -- but as of mid-2026 the Act had not been proclaimed into force, meaning the Authority has not been constituted as an operating body and no commercial licenses of any kind (cultivation, dispensary, or otherwise) have been issued. Full commercial operations had not yet launched.',
  regulatory_outlook = 'Proclamation of the 2022 Act, not further framework development, is the key near-term event to watch -- the statutory framework already exists on paper and is simply dormant pending proclamation. A medical program launch followed by potential adult-use licensing is the anticipated trajectory once proclaimed.',
  change_notes = change_notes || '[{"title": "Clarification: the Cannabis Licensing Authority exists in statute (2022 Act) but has not been proclaimed into an operating body -- prior phrasing implied active framework development rather than dormancy pending proclamation", "market": "Trinidad and Tobago", "timeAgo": "19 July 2026", "direction": "neutral", "sourceRef": "Trinidad and Tobago Parliament (Act record); Jamaica Experiences regional guide", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'TT';

UPDATE public.cc_jurisdiction_briefings
SET
  public_summary = 'Lebanon passed Law No. 178 in April 2020, legalizing cannabis cultivation for medical and industrial purposes -- the first Arab country to do so. The implementing Regulatory Authority for Cannabis Cultivation for Medical and Industrial Use was only formally constituted in summer 2025, five years after the law''s passage, under current head Dani Fayyad. As of early 2026 the Authority itself indicated the 2026 timeline was too tight to support even a first legal harvest; no functioning legal purchase channel exists for patients, consumers, or export buyers. The Bekaa Valley remains a historically significant illicit hashish production region operating largely undisturbed by the still-dormant legal framework.',
  regulatory_outlook = 'A first legal harvest -- not export licensing -- is the realistic near-term milestone, and even that was described by the Authority itself as a stretch for 2026. Morocco, which passed comparable legislation a year later (2021), reached licensed commercial exports within three years; Lebanon''s five-year gap between law and functioning regulator is the more useful implementation benchmark than the law''s 2020 passage date.',
  change_notes = change_notes || '[{"title": "Correction: prior entry described the legal framework as \"in place\" with the regulator operating under the Ministry of Economy; the implementing Authority was only constituted in summer 2025 and had enabled no legal harvest as of early 2026", "market": "Lebanon", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Herb; CMS Expert Guides; The Beiruter", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'LB';

UPDATE public.cc_jurisdiction_briefings
SET
  change_notes = change_notes || '[{"title": "Flagged, not corrected: a cited 2023 Health (Amendment) Act establishing a \"permanent\" MCAP framework, and an already-introduced diversion scheme, could not be corroborated across two independent research passes -- both instead found MCAP still described as a pilot and a diversion scheme as planned under the National Drugs Strategy 2026-2029, not yet enacted. Worth direct verification against HPRA/Oireachtas records rather than treating either version as settled.", "market": "Ireland", "timeAgo": "19 July 2026", "direction": "neutral", "sourceRef": "HPRA MCAP page; Herb; Business of Cannabis", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'IE';
