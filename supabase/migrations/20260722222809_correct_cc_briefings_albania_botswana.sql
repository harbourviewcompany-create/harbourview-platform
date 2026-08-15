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
-- version 20260722222809.
--
-- Rewriting this file cannot affect production: 20260722222809 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Both confirmed via independent, multi-source verification (government sites, court records,
-- specialist industry press) -- not heuristic guesses. Both briefing entries were flatly wrong,
-- not just stale on detail: Albania's export-only medical/industrial regime has existed since
-- July 2023 (Law 61/2023, NACC); Botswana's Cannabis Bill, 2025 passed 14 Aug 2025, ten months
-- before this briefing's 21-Jun-2026 dated entry still said "Prohibited."

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical/Industrial Legal (Export-Only, Since 2023); NACC-Licensed',
  public_summary = 'Albania legalized licensed cannabis cultivation and processing for medical and industrial purposes via Law No. 61/2023 (passed July 2023), regulated by the National Agency for Cannabis Control (NACC) under the Ministry of Health. Every licensed product is designated exclusively for export -- domestic retail, wholesale, prescription, and personal use remain fully illegal, and Albania does not recognize foreign medical cannabis prescriptions. Licenses run 15 years; industrial hemp is defined at an unusually high 0.8% THC ceiling (vs. the 0.2-0.3% common in the EU/US). NACC joined the Cannabis Regulators Association (CANNRA) in November 2024, a genuine marker of institutional maturity. Recreational cannabis remains criminally prosecuted.',
  regulatory_outlook = 'The export-only program is real and actively maturing (CANNRA membership, active licensing pipeline), not merely proposed. No domestic retail or patient-access reform is signaled -- the policy intent is explicitly to build an export industry, not a domestic market.',
  data_source_summary = 'National Agency for Cannabis Control (nacc.gov.al, official); LegalClarity; Global Initiative Against Transnational Organized Crime risk bulletin; Wikipedia.',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.75, "market_access": 0.6, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry stated no medical programme exists; Albania legalized export-only medical/industrial cultivation in July 2023 under NACC, which joined CANNRA in Nov 2024", "market": "Albania", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "NACC (nacc.gov.al); LegalClarity; GI-TOC risk bulletin", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'AL';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical/Industrial/Scientific Legal (Cannabis Bill 2025); Recreational Prohibited',
  public_summary = 'Botswana''s Parliament adopted a cannabis policy framework in April 2025 and passed the Cannabis Bill, 2025 on 14 August 2025 (25-5-4 vote), establishing a National Cannabis Control Authority to license cultivation, processing, research, and medical/scientific use. Botswana regulates hemp as "industrial cannabis" at a 0.7% THC ceiling rather than a separate hemp category. A 2018 licensed grower (Fresh Standard (Pty) Ltd) had its rights to produce hemp and cannabis for industrial/medical purposes upheld by the Botswana High Court in 2022 after wrongful cancellation -- evidence of real licensed activity predating the 2025 framework. Recreational use, sale, and CBD products remain fully illegal and criminally prosecuted. Licensing fees are steeply tiered: roughly EC[sic, should read] €214-534/year for resident cultivators versus over €2 million/year for non-resident processing/manufacturing licenses, a structure locally criticized for excluding smallholders.',
  regulatory_outlook = 'The framework is newly operational -- government-run hemp production trials were reported succeeding within days of this review, with commercial-scale licensing the next phase. Near-term development is industry scale-up under the new Authority, not further legislative change. CBD and recreational use remain outside any near-term reform path.',
  data_source_summary = 'Hemp Today (2026, government trials); News24 (2022 High Court ruling); Growers Network Forum (Aug 2025 Bill passage detail).',
  confidence_score = 0.82,
  confidence_categories = '{"enforcement": 0.7, "market_access": 0.55, "regulatory_framework": 0.8}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited with no medical programme; Botswana passed the Cannabis Bill, 2025 in August 2025, establishing a National Cannabis Control Authority and licensing regime ten months before this entry''s last review date", "market": "Botswana", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Hemp Today; News24; Growers Network Forum", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'BW';
