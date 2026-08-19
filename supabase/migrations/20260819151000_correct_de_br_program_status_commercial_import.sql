-- ============================================================
-- DE / BR program_status correction → live tier re-derive
-- ============================================================
-- After import-aware + negation-aware classifiers landed on production,
-- DE and BR remained domestic_only because live program_status text lacked
-- affirmative cross-border commercial language (or over-weighted adult-use).
--
-- Facts (2025–2026):
--   DE: Europe's largest medical cannabis import market (BfArM: ~201 t in 2025);
--       licensed importers / wholesalers under MedCanG; CanG adult-use social
--       clubs coexist but do not erase the commercial import pathway.
--   BR: Medical cannabis legal via Anvisa product authorisation and prescription;
--       no adult-use commercial market; not a scale commercial import hub on the
--       same order as DE — tier should be medical_limited_trade, not domestic_only.
--
-- UPDATE of program_status fires trg_sync_regulatory_tier →
--   countries.regulatory_tier for origin=auto rows.
-- ============================================================

-- Germany
UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Adult-use social club framework (CanG); Europe''s largest medical import market with licensed importers (BfArM MedCanG pathway)',
  change_notes = coalesce(change_notes, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'title', 'program_status: record commercial medical import pathway so regulatory_tier promotes to legal_commercial_access',
      'market', 'Germany',
      'timeAgo', '19 August 2026',
      'direction', 'up',
      'sourceRef', 'BfArM Medizinalcannabisverkehr Ein-/Ausfuhr; BfArM 2025 import totals (~201 t); MedCanG §4 licensed importers',
      'reviewState', 'reviewed'
    )
  ),
  last_reviewed_date = '2026-08-19',
  updated_at = now()
WHERE country_iso2 = 'DE'
  AND jurisdiction_type = 'country';

-- Brazil
UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical legal; prescription programme; Anvisa-authorised product pathway',
  change_notes = coalesce(change_notes, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'title', 'program_status: medical prescription pathway without adult-use commercial framing; tier medical_limited_trade',
      'market', 'Brazil',
      'timeAgo', '19 August 2026',
      'direction', 'neutral',
      'sourceRef', 'Anvisa RDC medical cannabis product authorisation; prescription access',
      'reviewState', 'reviewed'
    )
  ),
  last_reviewed_date = '2026-08-19',
  updated_at = now()
WHERE country_iso2 = 'BR'
  AND jurisdiction_type = 'country';

-- Safety net: if trigger path is disabled or origin was sticky, force auto re-derive
-- for DE/BR only when origin is auto (never touch overrides).
UPDATE public.countries c
SET
  regulatory_tier = api.derive_regulatory_tier(b.program_status),
  regulatory_tier_source = 'auto-reclassified on DE/BR briefing correction 2026-08-19',
  regulatory_tier_rationale = 'Derived from briefing: "' || left(b.program_status, 500) || '"',
  regulatory_tier_source_hash = md5(coalesce(b.program_status, '')),
  regulatory_tier_last_derived_at = now(),
  regulatory_tier_needs_review = true
FROM public.cc_jurisdiction_briefings b
WHERE b.country_iso2 = c.iso_alpha2
  AND b.jurisdiction_type = 'country'
  AND c.iso_alpha2 IN ('DE', 'BR')
  AND coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
  AND b.program_status IS NOT NULL
  AND api.derive_regulatory_tier(b.program_status) IS DISTINCT FROM c.regulatory_tier;
