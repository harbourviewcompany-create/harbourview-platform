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
-- version 20260719231533.
--
-- Rewriting this file cannot affect production: 20260719231533 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Corrects a factual error in cc_jurisdiction_briefings for Namibia: the prior entry stated
-- "Namibia's High Court ruled in 2018 that private cannabis use and possession was not
-- criminally unlawful" -- no such Namibian ruling exists. This is South Africa's Constitutional
-- Court ruling (Minister of Justice and Constitutional Development v Prince [2018] ZACC 30,
-- 18 Sept 2018, concourt.org.za / SAFLII), evidently conflated with Namibia given the two
-- countries' shared colonial-era drug-law history. Confirmed via cross-check against Namibia's
-- own, still-unresolved GUN/RUF constitutional challenge (filed 2021) -- which would make no
-- sense if personal use had already been judicially decriminalized in 2018. That challenge was
-- itself dismissed on prematurity grounds by the Windhoek High Court on 11 July 2026 (The
-- Namibian), a genuinely new development this correction also incorporates.
-- Every substantive field built on the false premise (program_status, patient/physician access,
-- market_dynamics, regulatory_outlook, data_source_summary, confidence_categories) is corrected.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; Legislative Reform Under LRDC Review',
  public_summary = 'Cannabis remains fully prohibited in Namibia under the apartheid-era Abuse of Dependence-Producing Substances and Rehabilitation Centres Act, No. 41 of 1971 (inherited from South African colonial administration). No judicial decriminalization has occurred: a constitutional challenge filed in August 2021 by Ganja Users of Namibia (GUN) and the Rastafari United Front, seeking to have the prohibition declared unconstitutional, was dismissed on prematurity grounds by the Windhoek High Court on 11 July 2026 -- Judge Claudia Claasen ruled the dispute is "polycentric" and deferred to the government''s ongoing Law Reform and Development Commission (LRDC) review as the appropriate channel, without ruling on the constitutional merits. The Ministry of Health and Social Services has separately and explicitly rejected proposals for commercial medical cannabis cultivation, most recently in June 2024. No licensed medical or commercial cannabis market exists.',
  patient_access = 'No patient access pathway exists. There is no licensed medical cannabis program, no prescribing framework, and no legal cultivation or dispensing channel of any kind.',
  physician_access = 'Physicians cannot lawfully prescribe cannabis under any regulated framework; no such framework exists in Namibia.',
  market_dynamics = 'No licensed commercial market exists, and none is imminent. Namibia''s Ministry of Health has explicitly declined commercial medical cultivation proposals as recently as June 2024. A coalition of advocacy groups (Cannabis and Hemp Association of Namibia, GUN, Medical Marijuana Association of Namibia, Rastafari United Front) submitted a joint decriminalization and hemp-legalization proposal to the Ministry of Justice in June 2025, in response to a government call for input on reform -- a live policy channel, but one that has not yet produced legislative change.',
  regulatory_outlook = 'The Law Reform and Development Commission (LRDC) review is the sole active reform channel following the High Court''s July 2026 dismissal of the judicial route on prematurity grounds; no public timeline for the LRDC review''s conclusion was located. Given the government''s explicit rejections of medical cultivation proposals and the absence of a published reform timeline, near-term licensing should not be assumed. Namibia''s agricultural conditions could support future cultivation if reform advances, but this remains speculative pending the LRDC''s findings.',
  regulatory_body = 'Ministry of Health and Social Services (MoHSS); Namibian Police Force (NAMPOL) for enforcement; Law Reform and Development Commission (LRDC) -- current locus of any reform activity.',
  data_source_summary = 'Windhoek High Court ruling, 11 Jul 2026 (The Namibian); Constitutional Court of South Africa, Minister of Justice v Prince [2018] ZACC 30 (verified as a South African, not Namibian, precedent); MoHSS public rejection of medical cultivation proposals, Jun 2024; CHAN/GUN/RUF/Medical Marijuana Association of Namibia joint submission to Ministry of Justice, Jun 2025.',
  verification_summary = 'Corrected and re-verified 19 Jul 2026 -- prior entry''s core premise (a 2018 Namibian High Court decriminalization ruling) did not exist in any located source and has been removed.',
  last_reviewed_date = '2026-07-19',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.65, "market_access": 0.25, "regulatory_framework": 0.9}'::jsonb,
  change_notes = change_notes || '[
    {"title": "Windhoek High Court dismisses GUN/RUF constitutional challenge on prematurity grounds, deferring to LRDC review", "market": "Namibia", "timeAgo": "11 July 2026", "direction": "neutral", "sourceRef": "The Namibian -- namibian.com.na/attempt-to-legalise-cannabis-fails-in-high-court", "reviewState": "reviewed"},
    {"title": "Correction: prior entry incorrectly attributed South Africa''s 2018 Constitutional Court Prince ruling to Namibia; no such Namibian ruling exists and cannabis remains fully prohibited", "market": "Namibia", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Constitutional Court of South Africa (concourt.org.za) -- Minister of Justice v Prince [2018] ZACC 30; cross-verified against Namibian High Court case record", "reviewState": "reviewed"}
  ]'::jsonb,
  updated_at = now()
WHERE country_iso2 = 'NA';
