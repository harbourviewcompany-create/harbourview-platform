-- Seed: Mexico · Importer · "Compliance & Reg." education overlay content.
--
-- STATUS: review_pending on every row -> DOES NOT DISPLAY to clients.
-- The overlay query + RLS only surface review_status IN (verified_*).
-- This is well-sourced DRAFT content for human verification, NOT verified
-- guidance. A reviewer with domain authority must check each topic against
-- the primary regulations and flip review_status to a verified_* value
-- (and populate source_ids with the reviewed source rows) before anything
-- here reaches a paying client.
--
-- Sourcing (retrieved 2026-07, current at time of drafting — Mexico's medical
-- cannabis / CBD import framework is changing rapidly through 2026, so treat
-- specifics as verify-before-publish):
--   - Reglamento de la Ley General de Salud en materia de control sanitario
--     para la producción, investigación y uso medicinal de la cannabis
--     (published 2021; import/export, control-book, permit-retention rules)
--   - Ley General de Salud arts. 235-248 (1% THC threshold, art. 245)
--   - COFEPRIS GMP standard NOM-241-SSA1-2025
--   - COFEPRIS Equivalency/Abbreviated Route expansion (eff. 2025-09-01)
--   - 2026 Economic Package customs/tariff reform (presented 2025-09-09; SAT
--     digital customs, stricter HS classification/valuation for botanicals)
-- Depends on: feat/education-country-overlay (country_education_overlay table).

insert into country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, review_status, reviewer)
values
(
  'MX',
  'Compliance & Reg.',
  'importer',
  jsonb_build_array(
    -- Topic 1 — National regulatory authority requirements and licence conditions
    'Cannabis import into Mexico is gated by COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios), the federal sanitary authority under the Secretaría de Salud, with SADER/SENASICA involved where cultivation or harvest is upstream. Commercial activity is confined to medical and research purposes — no recreational commercial market exists as of 2026. The decisive classification question is the 1% THC threshold under Article 245 of the Ley General de Salud: products at or below 1% THC are treated as industrial hemp, above 1% as controlled cannabis, and this determines which permit track, prescription regime, and level of scrutiny applies.',
    -- Topic 2 — Authorization classes, permit types and renewal obligations
    'Raw materials, pharmacological derivatives, and finished cannabis medicines may only be imported with a prior sanitary permit issued by COFEPRIS (or SADER, depending on product class) plus customs clearance from the competent authority. Import may never be conducted by ordinary mail. Importers must retain each import/export permit for a minimum of three years. Establishments that consistently require raw materials or derivatives must notify COFEPRIS of anticipated next-year quantities in January and May. Where an import is denied or restricted, the primary legal remedy is an amparo (constitutional injunction), which can be slow and should be budgeted for.',
    -- Topic 3 — Inspection readiness: documentation, SOPs and audit trail
    'Any establishment involved in import, export, manufacture, or use of cannabis raw materials or derivatives must maintain a COFEPRIS-authorized control book (libro de control) recording product name, lot number, quantities used and balance remaining, and must operate documented GMP and GLP systems (GMP per NOM-241-SSA1-2025). No product may be released until quality is formally evaluated. As of 2025–2026 COFEPRIS has moved to mandatory e-filing (PDF/A, digitally signed) and stricter physical audits, and SAT customs is digitalizing — import files should be pre-audited, e-filing-ready, and accompanied by verifiable certificates of analysis and end-to-end chain-of-custody.',
    -- Topic 4 — Continuing competency and professional obligations
    'Downstream handling obligations sit alongside the import permit: cannabis medicines may only be sold to establishments holding a valid sanitary licence for that purpose; prescribing professionals must hold a COFEPRIS-authorized barcode and use special prescription formats; and advertising/promotion is restricted to health professionals only — promotion to the general public is prohibited. Shortages, waste, or destruction of derivatives must be reported to COFEPRIS in writing, and destruction carried out in the presence of a health authority or verifier. Importers should plan for quarterly review of COFEPRIS and SAT changes given the pace of 2026 reform.',
    -- Topic 5 — Enforcement exposure and voluntary disclosure procedures
    'Enforcement exposure concentrates at two points: customs classification/valuation and post-entry sanitary audit. The 2026 Economic Package customs reform (presented September 2025) tightens HS-code classification, valuation, and documentation for botanicals and nutraceuticals including CBD, with customs audit clarification turnarounds reported around 10–14 days — a missed response window risks shipment detention. Maintaining a documented pre-import compliance trail (why a product''s classification, labelling, value, and claims were determined) is the principal mitigation. Where a foreign approval exists (FDA, EMA, Health Canada, Swissmedic, ANVISA, TGA), the COFEPRIS Equivalency/Abbreviated Route (expanded September 2025) may shorten review — surface those approvals and matching GMP evidence in the dossier.'
  ),
  'Request verified Mexico importer briefing',
  'review_pending',
  'seed:ai-drafted-web-sourced-2026-07 — REQUIRES human verification against primary COFEPRIS regulation before any verified_* status'
);
