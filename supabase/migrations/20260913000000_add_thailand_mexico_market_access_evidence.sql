-- Adds 2 more jurisdictions to the evidence table this PR introduces: Thailand and
-- Mexico. Same sourcing bar as the rest of this table (named authority, primary
-- government URL, dated). Contributed as a suggestion into this branch rather than
-- against main directly, since the table these rows belong to doesn't exist until
-- this PR merges.
--
-- This does not attempt to close the full coverage gap (still well over 200
-- jurisdictions short of all 291 countries) -- it demonstrates the sourcing standard
-- can be met incrementally and adds two real, checkable rows.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('dtam-th-medical-only-20260913','TH','medical_limited_trade',
 'Cannabis flower reclassified as a controlled herb under Ministerial Notification B.E. 2568; legal access is restricted to patients holding a doctor-issued PT33 prescription (30-day validity) from a licensed medical or Thai traditional-medicine practitioner. Recreational, online, and vending-machine sale are prohibited.',
 'Thailand Ministry of Public Health -- Department of Thai Traditional and Alternative Medicine (DTAM)',
 'https://med-cannabis.dtam.moph.go.th/law/2418/',
 date '2025-06-26','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('dof-mx-domestic-only-20260913','MX','domestic_only',
 'Supreme Court (SCJN) Declaratoria General de Inconstitucionalidad 1/2018 constitutionally protects adult personal cannabis possession and home cultivation, and a federal regulation published in the Diario Oficial de la Federacion governs medical cannabis production, research, and prescribing. Congress has not passed commercial adult-use legislation and no licensed recreational dispensaries operate nationally.',
 'Diario Oficial de la Federacion (Mexico) -- Secretaria de Salud / COFEPRIS',
 'https://dof.gob.mx/2021/SALUD/SALUD_120121.pdf',
 date '2021-01-13','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
