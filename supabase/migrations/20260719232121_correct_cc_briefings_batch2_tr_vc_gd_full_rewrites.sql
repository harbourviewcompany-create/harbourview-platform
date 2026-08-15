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
-- version 20260719232121.
--
-- Rewriting this file cannot affect production: 20260719232121 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Three confirmed factual errors in cc_jurisdiction_briefings, same class as the Namibia fix:
-- TR: flatly states "no medical cannabis programme exists" -- Turkey passed a pharmacy-only
--     medical cannabis law in 2025 with implementing regs published Jan 2026 (Daily Sabah,
--     Business of Cannabis, Coherent Market Insights -- all independently corroborated in my
--     own TR playbook research).
-- VC: states "no formal medical program has been established... expressed interest in
--     developing" -- Saint Vincent has run a genuinely operational 5-tier commercial licensing
--     program since Dec 2018, with 224 licenses issued in 2021 alone and named international
--     investors (MCA's own site, MJBizDaily, GrowerIQ).
-- GD: dates Grenada's decriminalization to 2019 -- confirmed via 6 independent sources
--     (NOW Grenada, St. Martin News Network, Tripbase, CannaCarib, MJBizDaily, International
--     CBC) this happened in 2026. The 2019 date is almost certainly conflated with Trinidad and
--     Tobago's real 2019 decriminalization -- a different Caribbean neighbor, same error pattern
--     as the Namibia/South Africa mix-up.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical Legal (Pharmacy-Only, Since 2025); Industrial Hemp Expanding',
  public_summary = 'Turkiye passed a health-law package in mid-2025 legalizing regulated, pharmacy-only sale of low-THC (under 0.3%) medical cannabis products on prescription -- ending a regime that since 2016 had permitted only sublingual cannabinoid sprays (Sativex) via specialist prescription. Implementing regulations (Regulation on Cultivation and Control of Cannabis; Regulation on Products Derived from Cannabis) were published in the Official Gazette 31 January 2026. National cultivation is capped at a fixed 120,000-plant/5,000 sqm annual quota reserved for pharmaceutical API production. Curaleaf was awarded an operating license in 2025, among the first issued. Separately, industrial hemp cultivation for fiber/textile use has been licensed in 19 of Turkiye''s 81 provinces since 2016 and continues expanding. Whole-plant recreational cannabis remains a Schedule I substance with 2023-enhanced minimum sentences; officials have been explicit the 2025 law creates no recreational opening.',
  regulatory_outlook = 'The pharmacy-only medical channel is newly operational (regulations only months old) and likely to see procedural refinement through 2026-2027 as the first licensees (including Curaleaf) scale. Industrial hemp continues expanding in parallel as a distinct, older track. No recreational reform is on the agenda; officials have repeatedly and explicitly ruled it out.',
  data_source_summary = 'Daily Sabah (2025 law, ministry quotes); Business of Cannabis; Coherent Market Insights (Curaleaf license, market forecast); Wikipedia (hemp-province history).',
  confidence_score = 0.8,
  confidence_categories = '{"enforcement": 0.75, "market_access": 0.55, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry stated no medical cannabis programme exists; Turkiye passed a pharmacy-only medical cannabis law in 2025 with Jan 2026 implementing regulations", "market": "Turkiye", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "Daily Sabah; Business of Cannabis; Official Gazette 31-Jan-2026", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'TR';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical/Commercial Legal (Since 2018); Export-Oriented Industry Operational',
  public_summary = 'Saint Vincent and the Grenadines runs a genuinely operational commercial medical cannabis industry, not merely an "interest" -- Parliament passed the Medicinal Cannabis Industry Act and the Cannabis Cultivation (Amnesty) Act in December 2018. The Medicinal Cannabis Authority (MCA) issues five tiers of cultivation license (Class A-E, priced EC$100,000 to EC$2.67 million by acreage) plus manufacturing, dispensing, laboratory-testing, and import/export licenses. The MCA approved 224 licenses in 2021 alone, including a 300-acre license to Acres Agricultural (SVG), a subsidiary of a Canadian firm, alongside licenses for local farmer cooperatives. The industry is oriented toward pharmaceutical-grade export (GMP/GACP/GlobalGAP standards), not domestic or tourist retail -- there is no walk-in dispensary model. Personal possession up to 56g was separately decriminalized in July 2018.',
  regulatory_outlook = 'The commercial export program is mature relative to Caribbean peers and continues to scale; near-term development is incremental (additional license approvals, export-market expansion) rather than foundational. No tourist-facing retail model is expected -- the industry''s economics run through licensed export.',
  data_source_summary = 'Medicinal Cannabis Authority (mca.vc, official regulator); MJBizDaily (first-licensee reporting); GrowerIQ (2021 licensing figures); Wikipedia.',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.7, "market_access": 0.85, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry described only decriminalization plus interest in a future program; SVG has run an operational 5-tier commercial licensing regime since Dec 2018 with 224 licenses issued in 2021 alone", "market": "Saint Vincent and the Grenadines", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "Medicinal Cannabis Authority (mca.vc); MJBizDaily", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'VC';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Decriminalized (2026); No Commercial Framework Yet',
  public_summary = 'Grenada decriminalized cannabis via the Drug Abuse (Prevention and Control) (Amendment) Act, 2026 -- tabled 20 January 2026, assented by the Governor-General 13 February 2026, gazetted 20 February 2026 -- not 2019 as previously stated (that date applies to Trinidad and Tobago''s decriminalization, a different country). Adults 21+ may possess up to 56g cannabis / 15g resin and register to cultivate up to 4 plants per household; the Act also creates a Rastafari sacramental-use framework and an amnesty/expungement mechanism for past minor offenses. The Attorney General and Health Minister were explicit during the parliamentary debate that the Act does not create a recreational commercial market. Government committed to developing a national commercial/medical cannabis policy framework within 3-6 months of January 2026; no such framework had been published as of mid-2026.',
  regulatory_outlook = 'The Cannabis Legalisation and Regulation Secretariat is leading design of the promised commercial/medical framework; government''s own 3-6 month timeline (from Jan 2026) has passed without publication as of this review, so no near-term commercial licensing should be assumed. Decriminalization and the Rastafari framework are fully in force today independent of that timeline.',
  data_source_summary = 'Cannabis Legalisation and Regulation Secretariat (cannabiscommission.gov.gd, official); NOW Grenada (parliamentary reporting); International CBC; Government Gazette Vol 144 No 9 (20-Feb-2026).',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.6, "market_access": 0.2, "regulatory_framework": 0.8}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry dated decriminalization to 2019 (that is Trinidad and Tobago''s date, not Grenada''s); Grenada''s decriminalization Act was assented 13 Feb 2026 and gazetted 20 Feb 2026", "market": "Grenada", "timeAgo": "19 July 2026", "direction": "neutral", "sourceRef": "Cannabis Legalisation and Regulation Secretariat; NOW Grenada; Government Gazette Vol 144 No 9", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'GD';
