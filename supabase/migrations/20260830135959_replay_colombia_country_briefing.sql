-- Replay-only reconstruction of Colombia's country briefing, verbatim from production.
--
-- public.cc_jurisdiction_briefings holds 302 rows in production and only 242
-- after a zero-state repository replay (verified 2026-09-06 against project
-- zvxdgdkukjrrwamdpqrg). Colombia is one of the sixty with no repository INSERT
-- anywhere in migration history: the bulk americas seeds
-- (20260621233459 / 233543 / 233640 / 233743) cover AR BB BO BR BZ CL CR CU DM
-- DO EC GD GT GY HT SV HN JM KN MX NI PA PE PY AG BS LC SR TT US UY VC VE and
-- skip CO, while 20260623100137_seed_content_depth_updates only UPDATEs a CO row
-- it assumes already exists.
--
-- 20260830140000_full_regulatory_tier_coverage then asserts that CO's stored
-- regulatory_tier equals api.derive_regulatory_tier(api.briefing_text_for_iso('CO')).
-- With no briefing row that derives NULL, so the assertion fails on replay while
-- passing in production. The text below is production's own row, read back
-- unchanged; it derives legal_commercial_access, matching the stored tier.
--
-- This file exists only in the temporary production-faithful replay workspace and
-- is never a production migration or a migration-ledger entry. The underlying gap
-- -- sixty briefings live in production with no repository record -- is NOT fixed
-- by this file and is tracked separately.

insert into public.cc_jurisdiction_briefings (
  jurisdiction_slug,
  jurisdiction_type,
  country_iso2,
  program_status,
  public_summary,
  patient_access,
  physician_access,
  market_dynamics,
  regulatory_outlook,
  regulatory_body,
  data_source_summary,
  verification_summary,
  update_cadence,
  coverage_summary,
  last_reviewed_date, watch_regions, change_notes, review_state
)
select
  $hvco$colombia$hvco$,
  $hvco$country$hvco$,
  $hvco$CO$hvco$,
  $hvco$Medical Legal — Export Industry Leader$hvco$,
  $hvco$Colombia was the first country in Latin America to establish a comprehensive regulated medical cannabis framework. Law 1787 of 2016 legalised medical cannabis, and Decree 631 of 2020 created the export licensing framework that has made Colombia a significant global medical cannabis producer. Colombia benefits from ideal growing conditions (tropical climate, near-equatorial light cycles, low-cost labour), making it one of the lowest-cost producers globally. Domestic adult-use remains legally ambiguous — the Constitutional Court decriminalised personal possession (up to 20g) in 1994 (Sentence C-221/94), but selling, buying, and public use remain prohibited. A 2023 bill to legalise adult-use cannabis passed the Senate but not the House; the Petro government has expressed support for adult-use legalisation.$hvco$,
  $hvco$Colombian medical cannabis patients access products through licensed pharmacies and medical dispensaries authorised under the Law 1787 framework. The Ministry of Health (MinSalud) administers patient access. Products include standardised oils, capsules, and dried flower. Domestic medical cannabis is very affordably priced given Colombia's low production costs. Patient registration is managed through the INVIMA regulatory framework.$hvco$,
  $hvco$Colombian physicians may recommend medical cannabis for qualified patients under the Law 1787 framework. INVIMA oversees product approvals. The Colombian Medical Federation has engaged with cannabis prescribing guidelines. No specialist-only restriction exists at the national level.$hvco$,
  $hvco$Colombia is primarily an export market for medical cannabis. Over 1,000 cultivation and production licences have been issued. Major Colombian cannabis companies include Clever Leaves, Khiron Life Sciences, Flora Growth, and PharmaLeaf Colombia. Export destinations include Germany, the UK, Australia, Brazil, and Mexico. Colombia's cost advantage (production cost as low as $0.10–0.30/gram dried flower) makes it highly competitive globally.$hvco$,
  $hvco$Colombia's Petro government (2022–2026) has been the most cannabis-supportive in the country's history. Adult-use legalisation faces legislative obstacles from conservative parties. If it passes, Colombia would become the first country in South America to fully legalise cannabis. The export framework is stable and well-regarded by importing countries' regulators.$hvco$,
  $hvco$INVIMA — invima.gov.co; Colombian Ministry of Justice; Agencia Nacional de Licencias Ambientales$hvco$,
  $hvco$Colombia Ministry of Justice cannabis policy data; INVIMA licensing registry; Colombia Ministerio de Salud y Protección Social publications; Clever Leaves/Khiron investor disclosures; EMCDDA Colombia country data$hvco$,
  $hvco$Current as of Q2 2026; verified against INVIMA and Colombian government official publications$hvco$,
  $hvco$Quarterly$hvco$,
  $hvco$National; 1,000+ licences issued; world's largest medical cannabis exporter by volume; growing domestic market$hvco$,
  date '2026-06-22', '[]'::jsonb, '[]'::jsonb, 'reviewed'
where not exists (
  select 1 from public.cc_jurisdiction_briefings
  where country_iso2 = 'CO' and jurisdiction_type = 'country'
);
