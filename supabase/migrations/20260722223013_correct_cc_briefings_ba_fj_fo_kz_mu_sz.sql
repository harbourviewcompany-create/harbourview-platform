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
-- version 20260722223013.
--
-- Rewriting this file cannot affect production: 20260722223013 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Six more corrections to the templated "Prohibited"/"Prohibited — No Medical Programme" cluster.
-- Unlike Albania/Botswana (independently re-verified via fresh web search this session), these
-- rely on the sourcing already in jurisdiction_playbooks -- real, named sources (Leafwell,
-- Lexology, Reuters, Semafor Africa, named officials) with "high" confidence labels already
-- attached, but not freshly re-verified by me externally. Scored 0.72-0.78 rather than the
-- 0.82-0.85 given to AL/BW to preserve that honest distinction.

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical Legal (Law Passed); Implementing Regulations In Progress',
  public_summary = 'Bosnia and Herzegovina''s Ministry of Civil Affairs is implementing a medical cannabis legalization law; as of April 2026, the professional guidelines and operational procedures needed before cannabis-based medicines reach pharmacies were still being finalized, so patient access is not yet live. A separate, pre-existing industrial hemp pathway (registered varieties at or below 0.2% THC, competent-body authorization) already operates independently of the medical reform.',
  regulatory_outlook = 'Watch for the Ministry''s implementing regulations to be finalized -- that, not further legislation, is the remaining gate before patient access goes live.',
  data_source_summary = 'Soft Secrets (Bosnia and Herzegovina medical cannabis regulation reporting); independent trade press.',
  confidence_score = 0.75, confidence_categories = '{"enforcement": 0.6, "market_access": 0.35, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited/no medical programme; a medical cannabis law has passed and implementing regulations were in progress as of April 2026", "market": "Bosnia and Herzegovina", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Soft Secrets", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'BA';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Industrial Hemp Legal (Since 2022); Medical Export Framework Under Investigation',
  public_summary = 'Fiji removed industrial hemp (under 1% THC) from Schedule 1 of the Illicit Drugs Control Act in August 2022, permitting import, cultivation, sale and supply under standard agricultural licensing -- the only currently operative cannabis-adjacent legal pathway. General cannabis and any THC-bearing medical product remain fully illegal with no licensing pathway. A medical-cannabis export policy framework was endorsed in 2024 but remains investigative, not an operative licensing regime, and excludes domestic medical use.',
  regulatory_outlook = 'The hemp pathway is real and operating today; medical/export development remains at the policy-study stage with no confirmed licensing timeline.',
  data_source_summary = 'Leafwell (Aug 2022 hemp exception, named political advocates).',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.65, "market_access": 0.4, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited; industrial hemp under 1% THC has been legal since August 2022, though general cannabis/medical remains illegal", "market": "Fiji", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'FJ';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical Legal (Narrow, 11 Approved Products); Cultivation Fully Illegal',
  public_summary = 'The Faroe Islands permit prescription of a fixed list of 11 pre-approved imported cannabis-based products (no flower) as a last-resort treatment after other options fail -- there is no MMJ card system, and costs are entirely patient-borne with no Danish-style reimbursement structure identified. Cultivation is illegal for both medical and recreational purposes, with no exception for approved patients.',
  regulatory_outlook = 'No expansion beyond the current 11-product list or a reimbursement structure has been signaled.',
  data_source_summary = 'Leafwell (detailed programme description); independent local news on enforcement posture.',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.7, "market_access": 0.3, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited/no medical programme; a narrow prescription pathway for 11 approved imported products exists as a last-resort treatment", "market": "Faroe Islands", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'FO';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Industrial Hemp Legal (Since 2025); No Medical or Recreational Program',
  public_summary = 'Kazakhstan enacted an industrial hemp licensing law in mid-2025, administered by the Ministry of Internal Affairs for certified non-narcotic varieties (0.3% THC or below) restricted to agricultural/industrial uses (fiber, paper, construction materials); only 4 cultivation licenses had been issued as of April 2025. No pathway exists for recreational or medical cannabis, or CBD consumer products -- full prohibition continues outside the hemp carve-out.',
  regulatory_outlook = 'Early-stage industrial hemp rollout (4 licenses as of April 2025); no medical or consumer CBD reform signaled.',
  data_source_summary = 'Multiple independent news sources quoting named Kazakh officials on the 2025 hemp law.',
  confidence_score = 0.75, confidence_categories = '{"enforcement": 0.7, "market_access": 0.25, "regulatory_framework": 0.7}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited with no qualification; an industrial hemp licensing law passed mid-2025 with 4 licenses issued by April 2025, though no medical/recreational program exists", "market": "Kazakhstan", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Named Kazakh officials via independent news reporting", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'KZ';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical Legal (Narrow, Named-Condition Import); Industrial Hemp Pilot-Stage',
  public_summary = 'Mauritius permits a narrow medical pathway via Ministry of Health and Wellness import authorization for compliant cannabis-derived products (THC capped at 30mg/mL, volume capped at 60mL) tied to an approved condition or Medicinal Cannabis Therapeutic Committee approval. A separate industrial hemp pilot (Ministry of Agriculture/FAREI) remains early-stage, not a mature licensing regime. General recreational cannabis remains illegal and prosecuted.',
  regulatory_outlook = 'A cited 2026-2030 master plan signals further development; specifics were not independently detailed in available sources and should be confirmed directly before relying on a timeline.',
  data_source_summary = 'Lexology legal analysis (THC/volume thresholds, import-authorization structure); Leafwell; cannabisregulations.ai (general prohibition/penalties); 321CBD (hemp pilot); TalkingDrugs (2026-2030 master plan reference).',
  confidence_score = 0.75, confidence_categories = '{"enforcement": 0.65, "market_access": 0.4, "regulatory_framework": 0.7}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited/no medical programme; a narrow named-condition medical import pathway exists via Ministry of Health authorization and a Medicinal Cannabis Therapeutic Committee", "market": "Mauritius", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Lexology; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'MU';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Narrow Executive-Licensed Export Precedent; Broader Legalization Bill Pending Supermajority',
  public_summary = 'General cannabis cultivation, possession, and sale remain illegal and actively prosecuted in Eswatini. However, at least two companies -- PSIQ (exclusive license, 2019) and Profile Solutions Inc. (10-year license) -- hold direct executive-granted cultivation/export licenses under GMP-standard conditions, predating any general legalization; terms are not standardized or open to ordinary applicants. A broader medical-legalization bill (tabled 2020, resurfaced 2023) proposing a new Medicines Regulatory Authority requires a three-quarters supermajority in both the House of Assembly and Senate and had not been confirmed passed as of the most recent reporting.',
  regulatory_outlook = 'Watch the pending bill''s supermajority requirement -- a high bar not yet cleared -- rather than assuming the existing narrow executive-license precedent will expand into general licensing.',
  data_source_summary = 'Wikipedia; Sensi Seeds; Reuters; High Times; Semafor Africa -- documented licensee examples on both the narrow-export and general-prohibition sides.',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.7, "market_access": 0.35, "regulatory_framework": 0.7}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited without qualification; at least two named companies hold real executive-granted cultivation/export licenses, and a broader legalization bill requiring a 3/4 legislative supermajority is pending", "market": "Eswatini", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Reuters; Semafor Africa; Wikipedia", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'SZ';
