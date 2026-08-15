-- Jurisdiction Command Canada source correction.
-- Forward-only content repair: do not rewrite historical seed migration 20260623100137.
-- Primary-source basis verified 2026-08-15 against Health Canada:
--   Cannabis Act legislative review final report (tabled 2024-03-22)
--   Cannabis Regulations streamlining amendments (in force 2025-03-12)
--   current Cannabis Regulations medical-access guidance
--   current cannabis import/export guidance
--   2026 Industrial Hemp Regulations consultation status

UPDATE public.cc_jurisdiction_briefings
SET
  public_summary = 'Canada regulates cannabis federally under the Cannabis Act and Cannabis Regulations, with provinces and territories responsible for important distribution, retail and local implementation rules. A separate federal medical-access system remains available under the Cannabis Regulations alongside legal non-medical access. Commercial activity is licence- and activity-specific; a country-level legal status should not be treated as transaction authorization.',
  patient_access = 'Under the Cannabis Regulations, an individual may obtain a medical document from a health care practitioner and register as a client of a holder of a licence for sale for medical purposes. The federal framework also permits eligible individuals to register with Health Canada for personal production or designated production. These medical-access routes operate under the Cannabis Act and Cannabis Regulations, not the former ACMPR framework.',
  physician_access = 'Health Canada''s current medical-access guidance provides that a health care practitioner may issue a medical document when they determine that a limited amount of cannabis is required for the person''s condition. The medical document must contain the information required by the Cannabis Regulations. Professional authorization and standards of practice remain subject to the applicable provincial or territorial regulatory framework.',
  market_dynamics = 'Canada has national legal non-medical and medical cannabis frameworks, but commercial execution varies materially by province or territory, licence class, product and activity. International cannabis import and export permits are issued only for medical or scientific purposes and are assessed shipment by shipment under the federal framework. Operators therefore need transaction-specific licence, permit, destination and product evidence rather than a single national market-status label.',
  regulatory_outlook = 'The independent Expert Panel''s final Legislative Review of the Cannabis Act report was tabled in both Houses of Parliament on March 22, 2024. On March 12, 2025, amendments streamlining requirements under the Cannabis Regulations and related instruments came into force. Health Canada also ran a consultation from May 16 to June 30, 2026 on potential amendments to the Industrial Hemp Regulations; that consultation is closed, and any future regulatory proposals based on it are expected to be pre-published in the Canada Gazette, Part I before final amendments.',
  data_source_summary = 'Health Canada: Cannabis Act legislative review; Legislative Review of the Cannabis Act final report; Summary of changes following the streamlining of regulations; Accessing cannabis for medical purposes; Importing and exporting cannabis; Closed consultation on potential amendments to the Industrial Hemp Regulations.',
  verification_summary = 'Primary-source refresh completed 2026-08-15. The prior ACMPR references and the statement that the Cannabis Act legislative review was completed in 2023 were removed. Transaction-specific conclusions still require current licence, product, purpose, origin/destination and permit evidence.',
  update_cadence = 'Event-driven with quarterly review',
  last_reviewed_date = DATE '2026-08-15'
WHERE country_iso2 = 'CA'
  AND jurisdiction_type = 'country';
