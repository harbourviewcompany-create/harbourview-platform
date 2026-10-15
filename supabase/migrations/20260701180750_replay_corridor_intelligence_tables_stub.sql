-- Reconstructed from the live production catalog for zero-state migration replay.
-- Seed values below are restored from production migration-ledger evidence.
--
-- Production version 20260701180751 created these tables and seeded 59 processing
-- observations plus 15 regulatory alerts in the same recorded statement. The
-- repository-only 20260701230000 reconstruction is relocated before that version
-- by prepare-production-faithful-migration-replay.mjs so the dependent historical
-- function can compile on a clean database.
--
-- The seed rows are part of the production contract, not disposable fixture data:
-- /intelligence/logistics-trade-routes reads both tables directly and suppresses
-- its benchmark/alert sections when they are empty. Omitting the rows therefore
-- makes a zero-state rebuild materially different from production.
--
-- Production already records version 20260701230000, so this is a
-- repository-only replay-fidelity repair and is not a production migration.
-- It is never reapplied remotely.

create table if not exists public.corridor_processing_times (
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  permit_type text,
  days_taken integer not null,
  submitter_role text,
  verified boolean default false,
  submitted_at timestamptz default now(),
  constraint corridor_processing_times_days_taken_check
    check (days_taken > 0 and days_taken < 1000)
);

create index if not exists idx_cpt_key
  on public.corridor_processing_times (corridor_key);

create table if not exists public.corridor_regulatory_alerts (
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  alert_date date not null,
  severity text not null,
  summary text not null,
  detail text,
  source text,
  created_at timestamptz default now(),
  constraint corridor_regulatory_alerts_severity_check
    check (severity = any (array['major'::text, 'minor'::text, 'watch'::text]))
);

create index if not exists idx_cra_key_date
  on public.corridor_regulatory_alerts (corridor_key, alert_date desc);

-- Exact processing-time seed values recorded in production migration 20260701180751.
insert into public.corridor_processing_times
  (corridor_key, permit_type, days_taken, submitter_role, verified)
values
  ('Netherlands→Germany','BfArM Import Permit',42,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',56,'Compliance Officer',true),
  ('Netherlands→Germany','BfArM Import Permit',49,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',63,'Regulatory Affairs',true),
  ('Netherlands→Germany','BfArM Import Permit',48,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',70,'Compliance Officer',false),
  ('Netherlands→Germany','BfArM Import Permit',44,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',52,'Importer',true),
  ('Canada→Germany','EU GMP + BfArM Import',84,'Regulatory Affairs',true),
  ('Canada→Germany','EU GMP + BfArM Import',98,'Compliance Officer',true),
  ('Canada→Germany','EU GMP + BfArM Import',112,'Regulatory Affairs',true),
  ('Canada→Germany','BfArM Import Permit',70,'Importer',true),
  ('Canada→Germany','BfArM Import Permit',91,'Importer',true),
  ('Canada→Germany','BfArM Import Permit',77,'Compliance Officer',true),
  ('Canada→United Kingdom','MHRA Import Licence',63,'Regulatory Affairs',true),
  ('Canada→United Kingdom','MHRA Import Licence',77,'Importer',true),
  ('Canada→United Kingdom','MHRA Import Licence',56,'Compliance Officer',true),
  ('Canada→United Kingdom','MHRA Import Licence',84,'Regulatory Affairs',false),
  ('Canada→United Kingdom','MHRA Import Licence',70,'Importer',true),
  ('Portugal→Germany / EU','EU Import Permit',70,'Regulatory Affairs',true),
  ('Portugal→Germany / EU','EU Import Permit',84,'Compliance Officer',true),
  ('Portugal→Germany / EU','EU Import Permit',63,'Importer',true),
  ('Portugal→Germany / EU','EU Import Permit',91,'Regulatory Affairs',true),
  ('Australia→Global','ODC Export Permit',56,'Exporter',true),
  ('Australia→Global','ODC Export Permit',70,'Regulatory Affairs',true),
  ('Australia→Global','ODC Export Permit',49,'Exporter',true),
  ('Australia→Global','ODC Export Permit',84,'Compliance Officer',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',28,'Distributor',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',42,'Compliance Officer',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',35,'Distributor',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',56,'Regulatory Affairs',true),
  ('Canada→Australia','ODC Import Permit + TGA GMP',84,'Regulatory Affairs',true),
  ('Canada→Australia','ODC Import Permit + TGA GMP',98,'Importer',true),
  ('Canada→Australia','ODC Import Permit + TGA GMP',77,'Compliance Officer',true),
  ('Canada→France','ANSM Import Authorisation',91,'Regulatory Affairs',true),
  ('Canada→France','ANSM Import Authorisation',112,'Compliance Officer',true),
  ('Canada→France','ANSM Import Authorisation',84,'Regulatory Affairs',true),
  ('Netherlands→United Kingdom','MHRA Import Licence',70,'Compliance Officer',true),
  ('Netherlands→United Kingdom','MHRA Import Licence',84,'Importer',true),
  ('Netherlands→United Kingdom','MHRA Import Licence',63,'Regulatory Affairs',true),
  ('New Zealand→Australia','TGA Import Permit',42,'Exporter',true),
  ('New Zealand→Australia','TGA Import Permit',56,'Regulatory Affairs',true),
  ('New Zealand→Australia','TGA Import Permit',35,'Exporter',true),
  ('Colombia→EU / LATAM','INVIMA Export + EU Import',112,'Regulatory Affairs',true),
  ('Colombia→EU / LATAM','INVIMA Export + EU Import',126,'Compliance Officer',true),
  ('Colombia→EU / LATAM','INVIMA Export + EU Import',98,'Regulatory Affairs',true),
  ('South Africa→Germany / EU','SAHPRA Export + BfArM Import',140,'Regulatory Affairs',true),
  ('South Africa→Germany / EU','SAHPRA Export + BfArM Import',154,'Compliance Officer',true),
  ('Israel→Germany / EU','Research Grade Import',98,'Regulatory Affairs',true),
  ('Israel→Germany / EU','Research Grade Import',126,'Researcher',true),
  ('Israel→Germany / EU','Research Grade Import',112,'Compliance Officer',true),
  ('Canada→Israel','IMCA Import Permit',70,'Regulatory Affairs',true),
  ('Canada→Israel','IMCA Import Permit',84,'Importer',true),
  ('Canada→Israel','IMCA Import Permit',77,'Compliance Officer',true),
  ('Portugal→United Kingdom','MHRA Import Licence',77,'Regulatory Affairs',true),
  ('Portugal→United Kingdom','MHRA Import Licence',91,'Importer',true),
  ('Denmark→Germany / EU','EU Narcotics Export/Import',49,'Regulatory Affairs',true),
  ('Denmark→Germany / EU','EU Narcotics Export/Import',56,'Importer',true),
  ('Denmark→Germany / EU','EU Narcotics Export/Import',63,'Compliance Officer',true);

-- Exact regulatory-alert seed values recorded in production migration 20260701180751.
insert into public.corridor_regulatory_alerts
  (corridor_key, alert_date, severity, summary, detail, source)
values
  ('Germany→EU Distribution','2026-07-01','major','BfArM integrates Anbauvereinigung supply into wholesale GDP framework','Following the adult-use Anbauvereinigung rollout, BfArM issued guidance integrating licensed social club production into the wholesale GDP distribution chain. Wholesalers must now maintain separate batch records for Anbauvereinigung-sourced vs. imported product.','BfArM Guidance Note 2026-07'),
  ('Canada→France','2026-06-28','major','ANSM expands cannabis médicale approved supplier list — 3 new Canadian LPs added','ANSM published updated approved supplier list including Aurora Cannabis, Canopy Growth (Spectrum Therapeutics), and Tilray Medical. Product-level authorisations for specific formats still required per existing procedure.','ANSM Decision 2026-06-28'),
  ('Netherlands→Germany','2026-06-15','minor','BfArM revises import permit application Form 4a — new attestation language required','Import permit applications submitted after 1 July 2026 must use the updated Form 4a, which includes a new section attesting to Anbauvereinigung product segregation compliance. Applications on old form will be returned without processing.','BfArM Announcement 15.06.2026'),
  ('Canada→Germany','2026-05-20','minor','Health Canada updates Export Permit workflow — new end-use attestation required for EU-bound shipments','Health Canada Cannabis Regulation Division issued updated workflow requiring exporters to obtain a destination-country end-use attestation before Export Permit issuance for EU-bound medical cannabis. Adds approximately 2 weeks to permit timeline.','Health Canada HC 2026-132'),
  ('Thailand→Asia-Pacific','2026-04-10','major','Thai FDA tightens export restrictions following 2024 partial re-scheduling','Thai FDA clarified that all cannabis products above 0.2% THC now require ONCB export licence regardless of domestic decriminalisation status. Unlicensed exports intercepted at Bangkok Suvarnabhumi resulted in operator suspensions.','Thai FDA Notification 2026-04'),
  ('Colombia→EU / LATAM','2026-03-22','watch','Colombian peso depreciation — EUR-denominated contracts recommended','COP depreciated 12% vs EUR YTD 2026. EU buyers on COP-denominated contracts face significant FX gains; Colombian exporters on EUR contracts face margin compression. Harbourview recommends EUR or USD denomination with FX hedge clauses in new supply agreements.','Harbourview FX Monitor 2026-Q1'),
  ('Canada→United Kingdom','2026-03-15','minor','MHRA updates Controlled Drug import licence application portal — digital-only from April 2026','MHRA launched updated online portal for Schedule 2 CD import licence applications. Paper applications no longer accepted from 1 April 2026. Digital submission reduces average processing time by an estimated 8 business days.','MHRA Notice 2026-CD-04'),
  ('Israel→Germany / EU','2026-02-14','major','EU-Israel IMC-GMP equivalency decision delayed to Q4 2026 — EMA announcement','EMA confirmed IMC-GMP equivalency assessment will not conclude before Q4 2026, pushing expected full EU GMP parity for Israeli producers to early 2027. Israeli products continue to enter EU only via research pathway until equivalency is confirmed.','EMA/2026/IMC-GMP/012'),
  ('South Africa→Germany / EU','2026-01-30','watch','SAHPRA increases cannabis export permit processing fee to ZAR 18,500 — 23% increase','SAHPRA revised scheduled fees effective 1 February 2026. Cannabis export permit fee increased from ZAR 15,000 to ZAR 18,500. Annual facility inspection fee for export-eligible facilities increased to ZAR 45,000.','SAHPRA Government Gazette Notice 2026-01'),
  ('Australia→Global','2026-01-15','minor','ODC updates online export permit portal — new product database entry required before application','ODC now requires all cannabis export applications to reference an ODC product database entry before permit issuance. New products require database registration (est. 3–4 weeks) before export permit application can proceed.','ODC Notice 2026-001'),
  ('Malta→EU','2025-12-01','major','MRA publishes first commercial cannabis export framework — pilot scheme for 5 operators','Malta Regulatory Authority published the first operational cannabis export framework, initially available to 5 pilot-licensed cultivation operators. Applications open Q1 2026. Export priority given to EU medical markets.','MRA/2025/Cannabis/Export/001'),
  ('Switzerland→EU','2025-11-18','watch','Swiss-EU bilateral cannabis MRA negotiations stalled — export pilot extended 12 months','FOPH confirmed bilateral MRA negotiations with EU have stalled due to disagreements on pharmacovigilance reporting. Existing cannabis export pilot extended 12 months pending resolution.','FOPH Press Release 18.11.2025'),
  ('Morocco→EU','2025-09-12','watch','Morocco tables medical cannabis export bill — legislative passage expected H1 2026','Moroccan parliament received draft legislation enabling licensed medical cannabis cultivation and export with EU GMP requirements. Monitor for passage and implementing regulations.','Harbourview Legislative Watch'),
  ('Poland→EU Distribution','2025-08-20','minor','URPL extends export permit processing to 12 weeks — domestic demand cited','URPL issued notice extending standard export permit processing from 8 to 12 weeks effective September 2025, citing high domestic prescription volumes. Export operators advised to apply 16 weeks before target ship date.','URPL Notice 2025-08'),
  ('Jamaica→North America / EU','2025-10-05','minor','CLA introduces operator verification database — reduces EU due diligence burden','Cannabis Licensing Authority (Jamaica) launched online operator verification portal. EU importers can now verify CLA licence status in 2–3 days vs previous 4–6 week process.','CLA Jamaica Press Release Oct 2025');


-- Fail closed if replay no longer reproduces the production seed cardinalities.
do $corridor_seed_fidelity$
begin
  if (select count(*) from public.corridor_processing_times) <> 59 then
    raise exception 'corridor_processing_times replay seed count mismatch';
  end if;
  if (select count(*) from public.corridor_regulatory_alerts) <> 15 then
    raise exception 'corridor_regulatory_alerts replay seed count mismatch';
  end if;
end
$corridor_seed_fidelity$;
