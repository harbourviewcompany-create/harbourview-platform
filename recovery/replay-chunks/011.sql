
-- RECOVERY BEGIN 20260710170100_jurisdiction_playbooks_batch20b_content.sql
-- Playbook content + market metrics for batch 20 (part B of B, see batch20a
-- for source_registry entries this migration references by source_url).

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Not publicly disclosed by regulator; licensing fees and quota-application costs are set case-by-case by the Ministry of Health based on submitted proposals — no standard published fee schedule as of 2026',
  legal_framework_summary = 'Ukraine legalized cannabis for medical, industrial, scientific, and educational purposes under Law No. 3528-IX, adopted by the Verkhovna Rada on 21 December 2023, signed by President Zelenskyy in February 2024, and effective 16 August 2024. Cannabis, its resin, extracts, and tinctures were reclassified out of the "especially dangerous substances" category into a restricted, state-controlled category. Cultivation, processing, manufacturing, compounding, wholesale, retail, import, and export are permitted solely for medical, R&D, and educational purposes, and every activity requires both a license and an annual government quota allocation — the Cabinet of Ministers approved Ukraine''s first-ever medical cannabis quotas for 2026, setting a THC storage ceiling of 592,068 grams. Until 2028, the law sets a zero import quota for cannabis plants and substances except for a short list of exempted categories (chiefly already-authorized finished medicines and APIs for pharmacy compounding), meaning early market entry is realistically import-of-finished-product-only via that exemption, not domestic cultivation, which the government itself has said will come later. Patients access cannabis medicines exclusively through electronic prescription from a Ministry of Health-approved list of roughly 20 qualifying conditions (including multiple sclerosis, epilepsy, PTSD, cancer-related symptoms, and Parkinson''s), dispensed through a fully traceable electronic system with per-plant and per-batch electronic identifiers. Recreational use remains fully prohibited and criminally/administratively enforced: cultivation of up to 10 plants without intent to sell is an administrative offense (fine plus seizure), and possession without intent to sell is decriminalized only up to 5 grams. Industrial hemp cultivation is permitted under license with a 0.2% THC ceiling on dried straw, rising to 0.3% from 16 February 2027. The reform was substantially driven by wartime demand: Ukraine''s Health Ministry has cited estimates of up to 6 million potential patients, including soldiers with PTSD and traumatic injury, though as of mid-2026 the program remains in an early implementation phase with the first patients only having received prescriptions in mid-2026 and cultivation licensing conditions still being finalized by the Cabinet of Ministers.',
  steps = '[{"step":"Confirm quota eligibility","detail":"Government quotas are allocated annually based on proposals from the Ministry of Health, itself built from quota applications submitted by companies, healthcare, R&D, and educational institutions — apply for inclusion in the relevant annual quota cycle before any licensed activity can begin"},{"step":"Obtain activity license","detail":"Any cultivation, processing, manufacturing, compounding, storage, import, or export activity requires a specific license; licensing conditions for cultivation specifically were still being finalized by the Cabinet of Ministers as of mid-2026"},{"step":"Register in the electronic traceability system","detail":"All controlled activity must be logged in Ukraine''s electronic circulation-tracking system within 24 hours of each transaction, covering more than 30 transaction types across seed, cultivation, processing, and dispensing stages"},{"step":"Near-term entry via the finished-medicine import exemption","detail":"Given the zero cannabis-plant import quota in force until 2028 (with narrow exemptions), the most realistic 2026 entry point is supplying already-authorized finished medicines or APIs for licensed pharmacy compounding rather than raw plant material or domestic cultivation"}]'::jsonb,
  key_regulators = '["Ministry of Health of Ukraine — prescribing conditions, quota proposals, patient access","State Service of Ukraine on Medicines and Drugs Control — licensing and quality oversight","Ministry of Agrarian Policy — cultivation and processing licensing","National Police of Ukraine — security compliance, mandatory facility access rights"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming medical legalization opened cultivation or raw-material import — a zero cannabis-plant import quota is in force until 2028 except for a narrow exempted category; realistic near-term entry is finished-medicine supply, not plant material',
    'Underestimating the licensing and quota dual-requirement — a license alone is not sufficient; every activity also requires an annual government quota allocation, and 2026 was the first year quotas were set at all',
    'Treating this as a mature program — the first patients only received prescriptions in mid-2026 and cultivation licensing conditions were still being finalized by the Cabinet of Ministers as of the most recent reporting; the operational program is very new'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across a CMS Expert Guide, an official CMS Law Now regulatory alert on the 2026 quotas, Ukraine''s Ministry of Health, and multiple independent reform-tracking outlets, with consistent dates and figures across all sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine')
WHERE country_iso2 = 'UA';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Licensing fees not uniformly published; NACOC operates 11 distinct licence categories covering cultivation, processing, distribution, and export separately, each with its own fee and compliance requirements — corporate applicants must budget for compliance with the 50% Ghanaian-ownership and majority-Ghanaian-directors requirement in addition to licensing costs',
  legal_framework_summary = 'Ghana operates a licensed, low-THC-only cannabis framework restricted to medicinal and industrial purposes, formally launched for implementation on 11 February 2026 (with a public program-opening event on 26 February 2026) under the Narcotics Control Commission (Amendment) Act, 2023 (Act 1100) and the Narcotics Control Commission (Cultivation and Management of Cannabis) Regulations, 2023 (L.I. 2475). Only cannabis varieties at or below 0.3% THC on a dry-weight basis are permitted — this is explicitly framed by the Interior Ministry as an industrial hemp and therapeutic-cannabis program, not adult-use legalization, and recreational "wee" remains fully criminalized under Section 45 of the Narcotics Control Commission Act 2020 (Act 1019), which criminalizes purchase, sale, or possession of narcotic plants without lawful authority. The Narcotics Control Commission (NACOC) administers 11 distinct license categories spanning the full value chain: cultivation, processing, distribution, transport, research, and export. Licensing is restricted to Ghanaian citizens or permanent residents aged 18 or older; corporate applicants must maintain at least 50% Ghanaian ownership and a majority of Ghanaian directors, a deliberate policy choice the government has framed around directing the $7.8 billion in 2025 diaspora remittances toward domestic industry-building rather than foreign capital. The government has publicly cited Canada''s legal cannabis sector (C$894.6 million in 2022–23 revenue) as its benchmark for the economic opportunity it is pursuing, and has stated anticipated outcomes including reduced illegal high-THC cultivation as farmers transition to the legal low-THC track, job creation particularly for rural youth, and licensing/export revenue. As of April 2026, the program had begun formally accepting applications, including from Ghanaians living abroad. A parallel commentary track (legal academics, industry critics) has noted that domestic hemp cultivation still faces the same NACOC narcotics-style licensing and security burden as hard narcotics, even as imported hemp-derived consumer products (skincare, cosmetics) already circulate in ordinary Ghanaian retail channels without equivalent friction — a live domestic-versus-imported asymmetry worth monitoring for anyone building a Ghana-based (rather than export-into-Ghana) operation.',
  steps = '[{"step":"Confirm ownership-structure eligibility","detail":"Corporate applicants must have at least 50% Ghanaian ownership and a majority of Ghanaian directors — structure any joint venture or local entity accordingly before applying"},{"step":"Select the correct license category","detail":"NACOC operates 11 separate license categories across cultivation, processing, distribution, transport, research, and export — identify which stage(s) of the value chain the intended activity covers"},{"step":"Apply through NACOC","detail":"Submit application to the Narcotics Control Commission; the program began formally accepting applications, including from the Ghanaian diaspora, as of April 2026"},{"step":"Confirm THC compliance pathway","detail":"All cultivated material must test at or below 0.3% THC dry-weight — build lab-testing and compliance verification into the cultivation plan from the outset, since this is the central legal boundary separating the licensed program from criminal narcotics enforcement"}]'::jsonb,
  key_regulators = '["Narcotics Control Commission (NACOC) — licensing, cultivation and management oversight, enforcement","Ministry of the Interior — program policy and public communication","Ghana Investment Promotion Centre — diaspora and foreign investment facilitation"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming this is adult-use or retail legalization — Ghana''s Interior Minister has explicitly and repeatedly stated the program is not about legalizing recreational "wee"; it is a licensed low-THC medicinal/industrial framework only, and Section 45 of Act 1019 still criminalizes unauthorized cannabis dealing',
    'Overlooking the Ghanaian-ownership requirement — corporate applicants need at least 50% Ghanaian ownership and majority-Ghanaian directors; a wholly foreign-owned entity cannot obtain a license as structured',
    'Assuming domestic cultivation faces the same low friction as importing hemp-derived consumer products — critics have specifically noted that imported hemp cosmetics and skincare already move through ordinary retail with minimal friction, while domestic growers face narcotics-style licensing, fees, and security requirements; this asymmetry is a live policy tension, not a settled feature'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the Ghana Ministry of the Interior official announcement, NACOC''s own regulatory page, and multiple independent industry-press accounts with consistent dates, licence-category counts, and ownership-requirement figures',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/')
WHERE country_iso2 = 'GH';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Licenses issued by the CCRA are valid for five-year periods; specific fee schedules are not yet publicly consolidated, but penalty exposure for unauthorized activity is severe — PKR 1,000,000 to 10,000,000 (roughly $3,500-$35,000) for individuals and up to PKR 200,000,000 (roughly $700,000) for companies, which signals the compliance stakes applicants should budget against even before considering licensing fees themselves',
  legal_framework_summary = 'Pakistan has legalized industrial hemp and medical/industrial cannabis in law, but the regulatory infrastructure to actually operate a license is still being stood up as of mid-2026, making this a jurisdiction with real legal authorization but immature institutional capacity. The foundational reform was a September 2020 federal cabinet decision approving industrial hemp production (0.3% THC ceiling), championed by then-Science Minister Fawad Chaudhry with a projected $1 billion revenue opportunity over three years. That was followed by years of inter-ministerial jurisdictional disputes (Ministry of Narcotics Control versus Ministry of Food Security) that stalled implementation. The Cannabis Control and Regulatory Authority Ordinance 2024 (later the Cannabis Control and Regulatory Authority Act, 2024) formally established the CCRA under the Cabinet Division in early-to-mid 2024, tasked with regulating cultivation, extraction, refining, manufacturing, and sale of cannabis derivatives for medical and industrial use, issuing five-year licenses, and formulating a national cannabis policy. Cannabis is defined broadly in the Act to include charas/resin, hashish oil, and the flowering/fruiting tops (bhang, siddhi, ganja are explicitly named), while all activity remains subject to the Control of Narcotic Substances Act of 1997 outside the licensed carve-out — recreational cultivation, possession, sale, and use remain criminal offenses with penalties up to seven years imprisonment, and CBD products are not legally distinguished from THC-containing cannabis. As of May 2026, the CCRA is in active infrastructure buildout: the federal cabinet approved a Rs. 100 million (~$359,000) supplementary grant in May 2026 to renovate a new Islamabad headquarters (a former government building), the Chairman''s Chamber was formally inaugurated on 12 May 2026, and the agency has launched an E-Licensing Portal advertised as offering QR-coded, digitally signed licenses with dynamic capacity tiers from small test beds to large commercial fields. However, no independent, verifiable reporting as of mid-2026 confirms licenses have actually been issued and operational cultivation has begun under the new framework — the legal authorization exists, but the practical licensing pipeline is very new and largely unproven for outside applicants.',
  steps = '[{"step":"Monitor CCRA institutional readiness","detail":"The regulator itself is still finalizing its headquarters and operational capacity as of May 2026 — confirm current institutional status directly with CCRA before committing resources to an application"},{"step":"Apply via the E-Licensing Portal","detail":"CCRA''s official portal (ccra.gov.pk) is the only legitimate application channel; the agency has issued explicit fraud warnings against third parties claiming to offer CCRA licensing or approval services"},{"step":"Select capacity tier","detail":"The E-Licensing Portal is built around dynamic capacity management from small test beds to large commercial fields — determine appropriate tier based on intended operation scale"},{"step":"Budget for the 5-year license term and compliance regime","detail":"Licenses run five years and are subject to regular inspections; penalty exposure for any lapse into unauthorized activity is severe (up to PKR 200M for companies), so compliance infrastructure should be built in from the start"}]'::jsonb,
  key_regulators = '["Cannabis Control and Regulatory Authority (CCRA) — licensing, cultivation and derivative-product oversight, under the Cabinet Division","Ministry of Narcotics Control — historical jurisdictional stakeholder, narcotics enforcement","Federal Board of Revenue — customs and import/export enforcement (active seizure enforcement confirmed as of January 2026)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming CCRA''s legal establishment (2024) means the licensing system is fully operational — as of May 2026 the agency was still finalizing its own headquarters and institutional capacity; verify current operational status directly rather than assuming the 2024 Act alone means licenses are readily issuable',
    'Engaging with any third party claiming to broker or expedite CCRA licensing — CCRA has issued explicit public fraud warnings that any licensing claims made outside its official website and communications channels are illegitimate',
    'Treating CBD as legally distinct from THC-containing cannabis — Pakistani law does not draw this distinction outside the licensed CCRA framework; CBD products remain illegal without a corresponding license'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium-high — CCRA''s existence, structure, and recent headquarters buildout are directly confirmed via its official government site and Wikipedia''s sourced entry; however, no independent source as of mid-2026 confirms licenses have actually been issued or operational cultivation has begun, which is flagged explicitly above rather than assumed',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.ccra.gov.pk/')
WHERE country_iso2 = 'PK';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'No standard published fee schedule for cultivation/production/distribution licenses as of 2026; the framework is deliberately open (any qualifying individual or company may apply, no public tender, no state monopoly), so costs are primarily compliance-driven — GACP/GMP-equivalent production standards, facility security, and JAZMP inspection readiness rather than a fixed government licensing fee',
  legal_framework_summary = 'Slovenia has one of the most structurally open medical cannabis frameworks in Europe as of 2026, while adult-use reform remains a live but unresolved legislative process. The Medical and Scientific Use of Cannabis Act passed Slovenia''s National Assembly on 15 July 2025 (50-29-2), was vetoed by the National Council 20-9, then reaffirmed by the National Assembly 49-11 on 24 July 2025, and formally entered into force on 20 August 2025 — 15 days after Official Gazette publication. The law legalizes cultivation, production, distribution, and use of Cannabis sativa L. for medical and scientific purposes under an explicitly non-restrictive, open licensing system: any individual or company (public or private) meeting the regulatory criteria can obtain a license, with no public tender process and no state monopoly, a deliberate design choice distinguishing Slovenia from more restrictive single-operator or limited-tender European medical cannabis regimes. The Slovenian Agency for Medicinal Products and Medical Devices (JAZMP) is the central regulator, responsible for licensing cultivation, processing, and distribution, plus import/export authorization; only companies already licensed to manufacture medicines or active pharmaceutical ingredients may operate in cannabis production, and cultivation/processing must meet GACP (Good Agricultural and Collection Practice) and GMP (Good Manufacturing Practice) standards. Physicians may prescribe cannabis for any condition they judge appropriate — an unusually broad prescribing authority that Slovenia''s own Medical Chamber has publicly flagged as anomalous relative to how every other medicine is regulated in the country, citing physician training gaps as a practical concern. Prescriptions are capped at one month and are non-renewable, requiring a new medical examination annually. Implementation carries statutory deadlines: cannabis/THC removal from the prohibited-substances list within 90 days of enactment, harmonization of medicines-dispensing regulations within 90 days, Ministry of Health technical rules (facility security, production licensing conditions, monitoring mechanisms) within 6 months of enactment (i.e., by roughly February 2026), and JAZMP given 18 months to build electronic patient/production record infrastructure. Industry forecasts project the medical cannabis market reaching approximately EUR55 million by 2029 at roughly 4% annual growth. Separately and not yet law, a coalition-backed adult-use bill (allowing home cultivation of up to 4 plants per person / 6 per household, public possession up to 7g, and non-commercial sharing) was introduced in the National Assembly following the medical law''s passage, backed by non-binding June 2024 referendum results (66.71% support for medical home-grow, 51.57% support for adult personal-use legalization) — but as of the most recent reporting the bill remained under debate, had not received full coalition backing (the Social Democrats, part of the governing coalition, had not endorsed it), and its timeline to a vote was unconfirmed. Recreational cannabis outside this pending bill remains decriminalized-but-illegal: personal-use possession is a misdemeanor (fine of EUR36-EUR179, reducible via treatment enrollment), not a criminal offense.',
  steps = '[{"step":"Confirm JAZMP technical-rules status","detail":"The Ministry of Health had a 6-month statutory deadline from the 20 August 2025 enactment date (i.e., roughly February 2026) to finalize technical rules on facility security, production licensing conditions, and monitoring — confirm these are published and current before applying"},{"step":"Verify existing pharmaceutical manufacturing licensure","detail":"Only companies already licensed to manufacture medicines or active pharmaceutical ingredients may operate in cannabis production under this law — this is a threshold eligibility requirement, not just a compliance standard"},{"step":"Apply to JAZMP under the open licensing model","detail":"No public tender and no state monopoly — any qualifying individual or company may apply directly; there is no competitive bidding process to navigate"},{"step":"Build to GACP/GMP standards","detail":"Cultivation and processing must meet EU Good Agricultural and Collection Practice and Good Manufacturing Practice standards from the outset"},{"step":"Monitor the pending adult-use bill separately","detail":"A separate, not-yet-passed adult-use bill exists in parliament — do not conflate its provisions (home cultivation limits, possession thresholds) with the medical/scientific framework, which is the only one currently in force"}]'::jsonb,
  key_regulators = '["Slovenian Agency for Medicinal Products and Medical Devices (JAZMP) — licensing, import/export authorization, e-records infrastructure","Ministry of Health — technical rules, prescribing regulation harmonization, patient examination requirements"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Slovenia has adult-use/recreational legalization — only the medical and scientific framework is currently in force; a separate adult-use bill remains pending in parliament without full coalition backing as of the most recent reporting',
    'Applying without existing pharmaceutical manufacturing licensure — eligibility is restricted to companies already licensed to manufacture medicines or APIs, not open to any agricultural operator regardless of the "open licensing" framing',
    'Assuming the "open licensing, no state monopoly" framing means low regulatory friction — production must still meet full GACP/GMP pharmaceutical-grade standards, and technical implementing rules were only due by ~February 2026, meaning the practical licensing environment was still maturing well after the law''s August 2025 entry into force'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Business of Cannabis, Sibiz (a Slovenia-based business services firm), Prohibition Partners'' European legislation tracker, Marijuana Moment''s legislative reporting on the veto/override sequence, and multiple industry outlets, all consistent on dates, vote counts, and structural details',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://businessofcannabis.com/inside-slovenias-new-revolutionary-medical-cannabis-law/')
WHERE country_iso2 = 'SI';

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('UA', 'INCB Import Quota 2026', 592068, 'grams', '2026-01-01', '2026-12-31', 'annual', 'observed', 'high', 'Cabinet of Ministers of Ukraine / CMS Law Now', 'https://cms-lawnow.com/en/ealerts/2026/01/ukraine-approves-2026-quotas-for-controlled-substances-including-medical-cannabis-thc', '2026-01-14', 'THC storage quota ceiling; first-ever medical cannabis quota set by Ukraine, covers production/import/export/storage limits under Resolution No. 1772'),
  ('UA', 'Estimated Addressable Patient Population', 6000000, 'patients', '2026-01-01', '2026-12-31', 'annual', 'estimated', 'medium', 'Ukraine Ministry of Health (via MyCannabis / Marijuana Moment reporting)', 'https://www.mycannabis.com/is-weed-legal-in-ukraine/', '2026-06-02', 'Health Ministry estimate of Ukrainians who could benefit from cannabis-based treatment, including PTSD-affected soldiers and civilians; not a current enrolled-patient count'),
  ('GH', 'NACOC Licence Categories', 11, 'categories', '2026-02-01', '2026-12-31', 'annual', 'observed', 'high', 'Herb.co (citing NACOC regulations)', 'https://herb.co/city-guides/buy-weed-ghana', '2026-05-21', 'Number of distinct license categories under the Cannabis Regulatory Programme covering the full value chain'),
  ('GH', 'Ghana Diaspora Remittances 2025', 7800000000, 'USD', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high', 'The Marijuana Herald (citing central bank officials)', 'https://themarijuanaherald.com/2026/04/ghana-opens-cannabis-licenses-to-citizens-abroad-as-hemp-industry-begins-accepting-applications/', '2026-04-20', 'Cited by government as the diaspora capital pool the cannabis licensing ownership rules aim to direct toward domestic industry'),
  ('PK', 'CCRA HQ Renovation Grant May 2026', 359000, 'USD', '2026-05-01', '2026-05-31', 'point_in_time', 'observed', 'high', 'The Marijuana Herald (citing Economic Coordination Committee)', 'https://themarijuanaherald.com/2026/05/pakistan-approves-funding-to-launch-government-run-cannabis-regulatory-office-in-islamabad/', '2026-05-08', 'Rs. 100 million supplementary grant approved for CCRA headquarters renovation in Islamabad; institutional-capacity signal, not a market-size metric'),
  ('PK', 'Maximum Corporate Penalty for Unauthorized Cannabis Activity', 700000, 'USD', '2026-01-01', '2026-12-31', 'annual', 'observed', 'medium', 'LegalClarity', 'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/', '2025-08-23', 'PKR 200,000,000 statutory maximum for companies under CCRA framework, converted at approximate mid-2026 exchange rate; individual maximum is PKR 10,000,000 (~$35,000)'),
  ('SI', 'Projected Medical Cannabis Market Size 2029', 55000000, 'EUR', '2029-01-01', '2029-12-31', 'annual', 'estimated', 'medium', 'Business of Cannabis (industry analyst forecast)', 'https://businessofcannabis.com/inside-slovenias-new-revolutionary-medical-cannabis-law/', '2026-08-27', 'Industry forecast at ~4% annual growth rate; forward-looking projection, not a current observed market figure'),
  ('SI', 'Adult Past-Month Cannabis Use Rate', 2.8, 'percent', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high', 'European Union Drugs Agency 2025 report (via Cannabis Now)', 'https://cannabisnow.com/slovenias-proposed-cannabis-legalization-measure-would-help-consumers/', '2025-08-13', 'EUDA 2025 report figure; also cites 5.4% past-year and 22% lifetime prevalence for Slovenian adults')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('UA','GH','PK','SI');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710170100','jurisdiction_playbooks_batch20b_content','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710170100_jurisdiction_playbooks_batch20b_content.sql

-- RECOVERY BEGIN 20260710170141_fix_security_definer_view_bypass_18_views.sql
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
-- version 20260710170141.
--
-- Rewriting this file cannot affect production: 20260710170141 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace view api.deal_room_messages with (security_invoker = true) as
select id, room_id, sender_id, message_type, body, attachments, read_at, created_at
from public.deal_room_messages;

create or replace view api.subscriptions with (security_invoker = true) as
select id, user_id, stripe_customer_id, status, tier, price_id, current_period_start,
  current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at
from public.subscriptions;

create or replace view api.hv_evidence_documents with (security_invoker = true) as
select id, org_id, document_type, display_name, storage_path, file_hash, file_size_bytes,
  mime_type, uploaded_by, verification_status, verified_by, verified_at, expiry_date,
  is_public, created_at
from public.hv_evidence_documents;

create or replace view api.cc_org_pathway_progress with (security_invoker = true) as
select id, org_id, template_id, current_step, status, started_at, completed_at,
  last_action_at, created_at, updated_at
from public.cc_org_pathway_progress;

create or replace view api.cc_org_requirement_status with (security_invoker = true) as
select id, org_id, requirement_id, status, evidence_document_id, licence_id, notes,
  submitted_at, reviewed_at, reviewed_by, created_at, updated_at
from public.cc_org_requirement_status;

create or replace view api.cc_watch_rules with (security_invoker = true) as
select id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at
from public.cc_watch_rules;

create or replace view api.cc_watchlist_items with (security_invoker = true) as
select id, org_id, added_by, item_type, ref_id, title, subtitle, tags, jurisdiction,
  confidence_pct, latest_change_at, latest_change_note, next_action, watch_status,
  snoozed_until, created_at, updated_at
from public.cc_watchlist_items;

create or replace view api.cc_watchlist_notifications with (security_invoker = true) as
select id, user_id, org_id, watchlist_item_id, notification_type, title, body, is_read,
  is_snoozed, snoozed_until, created_at
from public.cc_watchlist_notifications;

create or replace view api.country_education_overlay with (security_invoker = true) as
select id, country_iso2, module_key, role_id, topics, action_label, source_ids,
  review_status, reviewer, last_verified_at, updated_at
from public.country_education_overlay;

create or replace view api.editorial_items with (security_invoker = true) as
select id, source_id, snapshot_id, headline, summary, why_it_matters, outlet_name,
  source_url, country, region, language, tone, published_at, used_in_digest_at, stage,
  created_at, updated_at
from public.editorial_items;

create or replace view api.market_metrics with (security_invoker = true) as
select id, country_iso2, metric_name, metric_value, metric_unit, period_start, period_end,
  period_granularity, data_type, confidence_band, source_name, source_url, source_date,
  notes, created_at, updated_at
from public.market_metrics;

create or replace view api.stripe_webhook_events with (security_invoker = true) as
select id, type, processed_at
from public.stripe_webhook_events;

create or replace view api.countries with (security_invoker = true) as
select id, country_name, country_slug, iso_alpha2, iso_alpha3, region, subregion,
  map_region_key, market_access_status, medical_status, adult_use_status, import_status,
  export_status, signals_status, opportunity_status, compliance_risk_status,
  education_status, marketplace_availability_status, public_summary, data_completeness,
  last_updated_label, created_at, updated_at, lat, lng, opportunity_categories,
  trade_roles, regulator_label, opportunity_score, regulatory_tier
from public.countries;

create or replace view api.trade_flows with (security_invoker = true) as
select id, origin_iso2, destination_iso2, flow_direction, product_category, legal_status,
  permit_required, permit_authority, purpose, gmp_required, gacp_required,
  key_requirements, notes, source_name, source_url, last_verified, confidence, created_at,
  updated_at
from public.trade_flows;

create or replace view api.education_tracks with (security_invoker = true) as
select id, slug, title, description, publication_state, created_at, updated_at
from public.education_tracks;

create or replace view api.hv_public_profile_snapshots with (security_invoker = true) as
select id, org_id, snapshot_data, snapshot_version, generated_at
from public.hv_public_profile_snapshots;

create or replace view api.cc_pathway_steps with (security_invoker = true) as
select id, template_id, step_number, title, description, unlock_condition, created_at
from public.cc_pathway_steps;

create or replace view api.cc_pathway_step_requirements with (security_invoker = true) as
select id, step_id, title, description, evidence_type, is_required, sort_order, created_at
from public.cc_pathway_step_requirements;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710170141','fix_security_definer_view_bypass_18_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710170141_fix_security_definer_view_bypass_18_views.sql

-- RECOVERY BEGIN 20260710170151_grant_select_base_tables_for_invoker_views.sql
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
-- version 20260710170151.
--
-- Rewriting this file cannot affect production: 20260710170151 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

grant select on public.trade_flows to anon, authenticated;
grant select on public.market_metrics to anon, authenticated;
grant select on public.hv_public_profile_snapshots to anon, authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.deal_room_messages to authenticated;
grant select on public.hv_evidence_documents to authenticated;
grant select on public.cc_org_pathway_progress to authenticated;
grant select on public.cc_org_requirement_status to authenticated;
grant select on public.cc_watch_rules to authenticated;
grant select on public.cc_watchlist_items to authenticated;
grant select on public.cc_watchlist_notifications to authenticated;

grant select on public.workspace_members to authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710170151','grant_select_base_tables_for_invoker_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710170151_grant_select_base_tables_for_invoker_views.sql

-- RECOVERY BEGIN 20260710171159_add_cbd_hemp_only_regulatory_tier.sql
-- Adds a fifth regulatory tier: cannabis prohibited, but a lawful licensed
-- hemp / low-THC-CBD regime exists. These are genuine (if narrow) market-access
-- states — commodity hemp fibre/seed and CBD ingredients — that were previously
-- flattened into 'prohibited', hiding real commercial opportunity (e.g. China
-- is the world's largest industrial hemp producer/exporter).
--
-- Deliberately NARROW. A country only qualifies if the briefing affirmatively
-- describes a *lawful* hemp/CBD regime (licensed, regulated, permitted). Grey
-- markets ("informal retail without legal clarity" — Bosnia), research-only
-- interest (Taiwan), or mere aspiration ("shown some interest" — Kazakhstan)
-- do NOT qualify and stay 'prohibited'.

alter table public.countries
  drop constraint if exists countries_regulatory_tier_check;

alter table public.countries
  add constraint countries_regulatory_tier_check
  check (regulatory_tier is null or regulatory_tier in (
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only',
    'prohibited'
  ));

comment on column public.countries.regulatory_tier is
  'Reviewed regulatory access tier for globe colouring. NULL = unreviewed. One of: legal_commercial_access, medical_limited_trade, domestic_only, cbd_hemp_only, prohibited. Never derive from market_access_status/import_status/export_status (unsourced, contain false values).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710171159','add_cbd_hemp_only_regulatory_tier','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710171159_add_cbd_hemp_only_regulatory_tier.sql

-- RECOVERY BEGIN 20260710171211_classify_cbd_hemp_only_countries.sql
-- Reclassify the 4 countries with a lawful hemp/CBD regime but prohibited
-- cannabis, from 'prohibited' to 'cbd_hemp_only'. Rationale drawn from each
-- country's own briefing text. Reviewed_at stays NULL (pending human review).
--
-- China    - world's largest licensed industrial hemp producer/exporter; CBD a
--            regulated cosmetic ingredient.
-- Turkiye  - provinces designated for hemp; regulated low-THC CBD framework;
--            hemp identified as strategic export crop.
-- Moldova  - industrial hemp cultivation permitted, aligned with EU standards.
-- India    - industrial hemp selectively licensed (Uttarakhand and others) for
--            fibre and seed.
--
-- Bosnia (informal retail, no legal clarity) and Taiwan (research only, no
-- licensed market) were reviewed and deliberately LEFT as 'prohibited'.

update public.countries set
  regulatory_tier = 'cbd_hemp_only',
  regulatory_tier_source = 'cc_jurisdiction_briefings (CBD/hemp review 2026-07-10, pending review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'CN' then 'Cannabis (THC) prohibited, but China is the world''s largest licensed industrial hemp producer/exporter; CBD clarified as a cosmetic ingredient (2019).'
    when 'TR' then 'Cannabis prohibited, but provinces are designated for hemp cultivation under a regulated framework; low-THC CBD available; hemp identified as a strategic export crop.'
    when 'MD' then 'Cannabis prohibited, but industrial hemp cultivation is permitted under regulations aligned with EU standards.'
    when 'IN' then 'Recreational cannabis prohibited, but industrial hemp is selectively licensed (Uttarakhand and other states) for fibre and seed.'
  end
where iso_alpha2 in ('CN','TR','MD','IN');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710171211','classify_cbd_hemp_only_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710171211_classify_cbd_hemp_only_countries.sql

-- RECOVERY BEGIN 20260710190000_fix_security_definer_view_bypass_18_views.sql
-- This exact class of bug has regressed at least 3 times already:
-- 20260622151411_fix_security_definer_views_to_invoker,
-- 20260701001549_fix_api_schema_views_rls_bypass,
-- 20260709092127_fix_security_definer_views_api_schema. It keeps coming
-- back because api.* views are created with plain
-- `CREATE OR REPLACE VIEW api.x AS SELECT * FROM public.x` and
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to its
-- default (security_invoker = false) -- so a later, unrelated edit to a
-- view silently reopens every RLS policy on the underlying table. Found
-- via a live audit prompted by the same bug being caught and fixed on
-- client_error_reports in 20260709032305: the security advisor currently
-- flags 18 api.* views with this property, all simple SELECT * passthroughs
-- with no legitimate reason to run as the view owner instead of the caller.
--
-- Confirmed live (get_advisors + information_schema.role_table_grants +
-- pg_policies) that every one of these 18 views grants SELECT to
-- anon/authenticated. Eight have a genuinely restrictive underlying RLS
-- policy that this bug fully bypasses -- i.e. this was an active,
-- exploitable cross-tenant/cross-user data leak, not a theoretical one:
--   - deal_room_messages: policy restricts to the two parties in a deal
--     room; bypass exposed every private deal negotiation message on the
--     platform to any authenticated OR anonymous caller.
--   - subscriptions: policy restricts to auth.uid() = user_id; bypass
--     exposed every user's Stripe customer id, tier, and billing status.
--   - hv_evidence_documents: policy restricts to org members / platform
--     staff; bypass exposed every org's compliance evidence documents,
--     including ones with is_public = false.
--   - cc_org_pathway_progress, cc_org_requirement_status, cc_watch_rules,
--     cc_watchlist_items: policy restricts to workspace members of that
--     org; bypass exposed every org's internal Command Centre compliance
--     progress, requirement status, watch rules, and watchlist.
--   - cc_watchlist_notifications: policy restricts to auth.uid() =
--     user_id; bypass exposed every user's notifications to every other
--     user.
-- The remaining 10 either had a real but lower-severity content-exposure
-- gap (unpublished/unverified rows shown as if reviewed/live:
-- country_education_overlay, editorial_items, market_metrics,
-- stripe_webhook_events -- the last of which is meant to be
-- service_role-only end to end) or no behavioral change at all because the
-- underlying table policy was already `true` for anon/authenticated
-- (countries, trade_flows, education_tracks, hv_public_profile_snapshots,
-- cc_pathway_steps, cc_pathway_step_requirements) -- those are fixed here
-- too, for lint compliance and so this list doesn't need revisiting piecemeal.
--
-- Column lists below are copied verbatim from the live
-- information_schema.views.view_definition for each view -- this migration
-- changes ONLY the security_invoker option, not any exposed column.

create or replace view api.deal_room_messages with (security_invoker = true) as
select id, room_id, sender_id, message_type, body, attachments, read_at, created_at
from public.deal_room_messages;

create or replace view api.subscriptions with (security_invoker = true) as
select id, user_id, stripe_customer_id, status, tier, price_id, current_period_start,
  current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at
from public.subscriptions;

create or replace view api.hv_evidence_documents with (security_invoker = true) as
select id, org_id, document_type, display_name, storage_path, file_hash, file_size_bytes,
  mime_type, uploaded_by, verification_status, verified_by, verified_at, expiry_date,
  is_public, created_at
from public.hv_evidence_documents;

create or replace view api.cc_org_pathway_progress with (security_invoker = true) as
select id, org_id, template_id, current_step, status, started_at, completed_at,
  last_action_at, created_at, updated_at
from public.cc_org_pathway_progress;

create or replace view api.cc_org_requirement_status with (security_invoker = true) as
select id, org_id, requirement_id, status, evidence_document_id, licence_id, notes,
  submitted_at, reviewed_at, reviewed_by, created_at, updated_at
from public.cc_org_requirement_status;

create or replace view api.cc_watch_rules with (security_invoker = true) as
select id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at
from public.cc_watch_rules;

create or replace view api.cc_watchlist_items with (security_invoker = true) as
select id, org_id, added_by, item_type, ref_id, title, subtitle, tags, jurisdiction,
  confidence_pct, latest_change_at, latest_change_note, next_action, watch_status,
  snoozed_until, created_at, updated_at
from public.cc_watchlist_items;

create or replace view api.cc_watchlist_notifications with (security_invoker = true) as
select id, user_id, org_id, watchlist_item_id, notification_type, title, body, is_read,
  is_snoozed, snoozed_until, created_at
from public.cc_watchlist_notifications;

create or replace view api.country_education_overlay with (security_invoker = true) as
select id, country_iso2, module_key, role_id, topics, action_label, source_ids,
  review_status, reviewer, last_verified_at, updated_at
from public.country_education_overlay;

create or replace view api.editorial_items with (security_invoker = true) as
select id, source_id, snapshot_id, headline, summary, why_it_matters, outlet_name,
  source_url, country, region, language, tone, published_at, used_in_digest_at, stage,
  created_at, updated_at
from public.editorial_items;

create or replace view api.market_metrics with (security_invoker = true) as
select id, country_iso2, metric_name, metric_value, metric_unit, period_start, period_end,
  period_granularity, data_type, confidence_band, source_name, source_url, source_date,
  notes, created_at, updated_at
from public.market_metrics;

create or replace view api.stripe_webhook_events with (security_invoker = true) as
select id, type, processed_at
from public.stripe_webhook_events;

create or replace view api.countries with (security_invoker = true) as
select id, country_name, country_slug, iso_alpha2, iso_alpha3, region, subregion,
  map_region_key, market_access_status, medical_status, adult_use_status, import_status,
  export_status, signals_status, opportunity_status, compliance_risk_status,
  education_status, marketplace_availability_status, public_summary, data_completeness,
  last_updated_label, created_at, updated_at, lat, lng, opportunity_categories,
  trade_roles, regulator_label, opportunity_score, regulatory_tier
from public.countries;

create or replace view api.trade_flows with (security_invoker = true) as
select id, origin_iso2, destination_iso2, flow_direction, product_category, legal_status,
  permit_required, permit_authority, purpose, gmp_required, gacp_required,
  key_requirements, notes, source_name, source_url, last_verified, confidence, created_at,
  updated_at
from public.trade_flows;

create or replace view api.education_tracks with (security_invoker = true) as
select id, slug, title, description, publication_state, created_at, updated_at
from public.education_tracks;

create or replace view api.hv_public_profile_snapshots with (security_invoker = true) as
select id, org_id, snapshot_data, snapshot_version, generated_at
from public.hv_public_profile_snapshots;

create or replace view api.cc_pathway_steps with (security_invoker = true) as
select id, template_id, step_number, title, description, unlock_condition, created_at
from public.cc_pathway_steps;

create or replace view api.cc_pathway_step_requirements with (security_invoker = true) as
select id, step_id, title, description, evidence_type, is_required, sort_order, created_at
from public.cc_pathway_step_requirements;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190000','fix_security_definer_view_bypass_18_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190000_fix_security_definer_view_bypass_18_views.sql

-- RECOVERY BEGIN 20260710190100_grant_select_base_tables_for_invoker_views.sql
-- Companion to 20260710190000_fix_security_definer_view_bypass_18_views:
-- flipping those views to security_invoker = true means the CALLING role's
-- own privileges now apply, not the view owner's. These base tables had
-- zero grants to anon/authenticated at all (only the SECURITY DEFINER view
-- did) -- so without this, RLS never gets a chance to evaluate; the read
-- fails at the coarser GRANT check first with a hard permission-denied,
-- breaking legitimate signed-in users' access to their own data (e.g. a
-- user's own subscription row, their own org's watchlist).
--
-- SELECT only -- this does not widen which ROWS are visible. Every table
-- below already has a real, verified-restrictive RLS SELECT policy
-- (auth.uid() = user_id, workspace membership, deal-room participancy, or
-- hv_is_org_member()) that still applies underneath this grant. This just
-- lets that policy run instead of the request being rejected outright.
--
-- anon is intentionally granted on only 3 of these: trade_flows,
-- market_metrics, hv_public_profile_snapshots are the only ones whose RLS
-- policy is actually satisfiable by an unauthenticated caller (public
-- reference data / a data_type filter with roles = public). The other 8
-- are gated on auth.uid() (directly, or transitively via workspace_members
-- / hv_is_org_member()), which is NULL for anon and can never match --
-- granting anon SELECT there would add permission surface for zero
-- capability, so those stay authenticated-only.

grant select on public.trade_flows to anon, authenticated;
grant select on public.market_metrics to anon, authenticated;
grant select on public.hv_public_profile_snapshots to anon, authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.deal_room_messages to authenticated;
grant select on public.hv_evidence_documents to authenticated;
grant select on public.cc_org_pathway_progress to authenticated;
grant select on public.cc_org_requirement_status to authenticated;
grant select on public.cc_watch_rules to authenticated;
grant select on public.cc_watchlist_items to authenticated;
grant select on public.cc_watchlist_notifications to authenticated;

-- Needed for the cc_* tables' RLS policies above: their USING clause
-- subqueries workspace_members (org_id IN (SELECT workspace_id FROM
-- workspace_members WHERE user_id = auth.uid())), which itself requires
-- SELECT on workspace_members to evaluate. workspace_members has its own
-- RLS (auth.uid() = user_id OR admin) so this grant does not let a caller
-- read any row but their own membership record.
grant select on public.workspace_members to authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190100','grant_select_base_tables_for_invoker_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190100_grant_select_base_tables_for_invoker_views.sql

-- RECOVERY BEGIN 20260710190200_client_error_reports.sql
-- Client-side error capture for app/country/[country]/error.tsx and
-- app/global-error.tsx. Neither boundary currently records anything durable
-- (console.error only), so a client-side hydration crash leaves zero
-- evidence behind for the next investigation. This table is the landing
-- zone for a best-effort beacon fired from those boundaries' useEffect.
--
-- Insert-only for anon/authenticated (same shape as marketplace_inquiries):
-- visitors can report an error, nobody can read another visitor's report
-- through the client. user_id is populated from auth.uid() server-side via
-- the column default, not accepted from the client payload, so it can't be
-- spoofed by a caller hitting the API route directly.

create table if not exists public.client_error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  boundary text not null check (boundary in ('country_role', 'global')),
  route text,
  digest text,
  message text not null,
  stack text,
  user_agent text,
  viewport_width int,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  extra jsonb
);

alter table public.client_error_reports enable row level security;

revoke all on public.client_error_reports from anon;
revoke all on public.client_error_reports from authenticated;
grant insert on public.client_error_reports to anon, authenticated;

drop policy if exists "Public can report client errors" on public.client_error_reports;
create policy "Public can report client errors"
  on public.client_error_reports
  for insert
  to anon, authenticated
  with check (
    length(trim(message)) > 0
    and length(message) <= 2000
    and (stack is null or length(stack) <= 4000)
    and (route is null or length(route) <= 500)
    and (digest is null or length(digest) <= 200)
    and (user_agent is null or length(user_agent) <= 500)
    and (viewport_width is null or (viewport_width > 0 and viewport_width <= 20000))
    and (extra is null or pg_column_size(extra) <= 4000)
    and user_id is not distinct from auth.uid()
  );

create index if not exists client_error_reports_created_at_idx
  on public.client_error_reports (created_at desc);

-- PostgREST is configured to expose only the api schema (see
-- 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql for the
-- same PGRST205 "table not found in schema cache" failure mode this
-- prevents). Passthrough view + grant, no triggers needed: this is a
-- simple single-table view so Postgres's auto-updatable-view mechanism
-- handles INSERT (and the underlying table's default/RLS) transparently.

-- security_invoker = true is required here, not left to a follow-up ALTER:
-- Postgres views default to security_invoker = false, which runs permission
-- and RLS checks as the view OWNER (table owner, RLS-exempt) rather than the
-- calling role — silently letting inserts bypass every check above. Also,
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to that
-- default, so this must be repeated on every future replace of this view,
-- not set once and assumed to stick.
create or replace view api.client_error_reports
with (security_invoker = true)
as select * from public.client_error_reports;

grant insert on api.client_error_reports to anon, authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190200','client_error_reports','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190200_client_error_reports.sql

-- RECOVERY BEGIN 20260710190300_github_pat_vault_rpc.sql
-- Vault-backed GitHub PAT accessor. See github-bridge and hv-repo-reader
-- edge functions -- both call this via supabase.rpc('get_github_pat')
-- instead of a hardcoded token in source, so rotation is a one-line SQL
-- update rather than a redeploy.

CREATE OR REPLACE FUNCTION public.get_github_pat()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, vault
AS $fn$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'GITHUB_PAT' LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.get_github_pat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_github_pat() TO service_role;

CREATE OR REPLACE FUNCTION api.get_github_pat()
RETURNS text
LANGUAGE sql STABLE
AS $fn$ SELECT public.get_github_pat() $fn$;

REVOKE ALL ON FUNCTION api.get_github_pat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION api.get_github_pat() TO service_role;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190300','github_pat_vault_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190300_github_pat_vault_rpc.sql

-- RECOVERY BEGIN 20260710190400_jurisdiction_playbooks_batch20_ua_gh_pk_si.sql
-- Research batch 20 of jurisdiction_playbooks: Ukraine, Ghana, Pakistan, Slovenia.
-- All four pulled from content_coverage_queue with playbook + market_metrics + education
-- gaps flagged. Playbook and market_metrics content written below; education overlay
-- left untouched (see migration message).

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('CMS Expert Guides — Cannabis law and legislation in Ukraine', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine', 'Ukraine', 'UA', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 3528-IX full licensing/quota framework, zero import quota until 2028 exception list, industrial hemp THC 0.2%->0.3% Feb 2027 threshold'),
  ('CMS Law Now — Ukraine approves 2026 quotas for controlled substances including medical cannabis', 'https://cms-lawnow.com/en/ealerts/2026/01/ukraine-approves-2026-quotas-for-controlled-substances-including-medical-cannabis-thc', 'Ukraine', 'UA', 'Europe', 1, 'html_snapshot', 'annual', 'regulatory_filing', 'First-ever 2026 THC storage/production/import/export quotas, 592,068g storage limit'),
  ('Wikipedia — Cannabis in Ukraine', 'https://en.wikipedia.org/wiki/Cannabis_in_Ukraine', 'Ukraine', 'UA', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', 'Administrative possession threshold 5g, cultivation up to 10 plants administrative not criminal'),
  ('MyCannabis — Is Weed Legal in Ukraine 2026', 'https://www.mycannabis.com/is-weed-legal-in-ukraine/', 'Ukraine', 'UA', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'War-driven reform context, up to 6M potential patients per Health Ministry estimate'),
  ('Ministry of the Interior Ghana — Ghana Begins Medicinal and Industrial Cannabis Cultivation', 'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/', 'Ghana', 'GH', 'Africa', 1, 'html_snapshot', 'quarterly', 'government_release', 'Official Feb 2026 program launch, 50% Ghanaian ownership requirement, 18+ age requirement'),
  ('Narcotics Control Commission Ghana — Cannabis Regulations', 'https://www.ncc.gov.gh/cannabis-regulations/', 'Ghana', 'GH', 'Africa', 1, 'html_snapshot', 'quarterly', 'regulatory_filing', 'Act 1100 (2023) and L.I. 2475 legal basis, 0.3% THC ceiling, NACOC oversight'),
  ('Herb.co — How to Buy Weed in Ghana in 2026', 'https://herb.co/city-guides/buy-weed-ghana', 'Ghana', 'GH', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '11 NACOC licence categories, Section 45 Act 1019 criminal penalty for unauthorized dealing confirmed still in force'),
  ('The Marijuana Herald — Ghana Opens Cannabis Licenses to Citizens Abroad', 'https://themarijuanaherald.com/2026/04/ghana-opens-cannabis-licenses-to-citizens-abroad-as-hemp-industry-begins-accepting-applications/', 'Ghana', 'GH', 'Africa', 2, 'html_snapshot', 'quarterly', 'news', 'Diaspora investment framing, $7.8B 2025 remittances context, full supply chain licensing scope'),
  ('Cannabis Control & Regulatory Authority Pakistan — Official Site', 'https://www.ccra.gov.pk/', 'Pakistan', 'PK', 'Asia', 1, 'html_snapshot', 'monthly', 'government_release', 'CCRA HQ inaugurated May 2026, E-Licensing Portal live, QR-coded digital licenses'),
  ('Wikipedia — Cannabis Control and Regulatory Authority', 'https://en.wikipedia.org/wiki/Cannabis_Control_and_Regulatory_Authority', 'Pakistan', 'PK', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'CCRA Act 2024 establishment, Cabinet Division oversight, board functions'),
  ('LegalClarity — Is Weed Legal in Pakistan? A Look at Current Laws', 'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/', 'Pakistan', 'PK', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '5-year license validity, penalty structure PKR 1-10M individuals up to 200M companies, CBD not distinguished from THC'),
  ('The Marijuana Herald — Pakistan Approves Funding to Launch Cannabis Regulatory Office', 'https://themarijuanaherald.com/2026/05/pakistan-approves-funding-to-launch-government-run-cannabis-regulatory-office-in-islamabad/', 'Pakistan', 'PK', 'Asia', 2, 'html_snapshot', 'quarterly', 'news', 'May 2026 ECC Rs.100M supplementary grant for HQ, still-forming institutional capacity signal'),
  ('Business of Cannabis — Inside Slovenia''s New Revolutionary Medical Cannabis Law', 'https://businessofcannabis.com/inside-slovenias-new-revolutionary-medical-cannabis-law/', 'Slovenia', 'SI', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Act in force 20 Aug 2025, 6-month technical rules deadline, JAZMP 18-month e-records deadline, EUR55M by 2029 forecast'),
  ('Sibiz — Slovenia legalizes medical cannabis: new law effective from August 20 2025', 'https://sibiz.eu/slovenia-legalizes-medical-cannabis-marijuana-new-law-effective-from-august-20-2025/', 'Slovenia', 'SI', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Any-condition prescribing authority, 1-month non-renewable prescriptions, Medical Chamber concern about scope'),
  ('Marijuana Moment — Slovenian Lawmakers File Bill To Legalize Marijuana For Adults', 'https://www.marijuanamoment.net/slovenian-lawmakers-file-bill-to-legalize-marijuana-for-adults-as-separate-medical-cannabis-measure-passes/', 'Slovenia', 'SI', 'Europe', 2, 'html_snapshot', 'monthly', 'legislative_tracking', 'National Council veto 20-9 then National Assembly override 49-11, adult-use bill still pending as of reporting'),
  ('Prohibition Partners — Slovenia Medical Cannabis Legislation & Legal Status Map', 'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/slovenia/', 'Slovenia', 'SI', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Open licensing system framing, any-operator-qualifies model, JAZMP licensing authority confirmed')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Not publicly disclosed by regulator; licensing fees and quota-application costs are set case-by-case by the Ministry of Health based on submitted proposals — no standard published fee schedule as of 2026',
  legal_framework_summary = 'Ukraine legalized cannabis for medical, industrial, scientific, and educational purposes under Law No. 3528-IX, adopted by the Verkhovna Rada on 21 December 2023, signed by President Zelenskyy in February 2024, and effective 16 August 2024. Cannabis, its resin, extracts, and tinctures were reclassified out of the "especially dangerous substances" category into a restricted, state-controlled category. Cultivation, processing, manufacturing, compounding, wholesale, retail, import, and export are permitted solely for medical, R&D, and educational purposes, and every activity requires both a license and an annual government quota allocation — the Cabinet of Ministers approved Ukraine''s first-ever medical cannabis quotas for 2026, setting a THC storage ceiling of 592,068 grams. Until 2028, the law sets a zero import quota for cannabis plants and substances except for a short list of exempted categories (chiefly already-authorized finished medicines and APIs for pharmacy compounding), meaning early market entry is realistically import-of-finished-product-only via that exemption, not domestic cultivation, which the government itself has said will come later. Patients access cannabis medicines exclusively through electronic prescription from a Ministry of Health-approved list of roughly 20 qualifying conditions (including multiple sclerosis, epilepsy, PTSD, cancer-related symptoms, and Parkinson''s), dispensed through a fully traceable electronic system with per-plant and per-batch electronic identifiers. Recreational use remains fully prohibited and criminally/administratively enforced: cultivation of up to 10 plants without intent to sell is an administrative offense (fine plus seizure), and possession without intent to sell is decriminalized only up to 5 grams. Industrial hemp cultivation is permitted under license with a 0.2% THC ceiling on dried straw, rising to 0.3% from 16 February 2027. The reform was substantially driven by wartime demand: Ukraine''s Health Ministry has cited estimates of up to 6 million potential patients, including soldiers with PTSD and traumatic injury, though as of mid-2026 the program remains in an early implementation phase with the first patients only having received prescriptions in mid-2026 and cultivation licensing conditions still being finalized by the Cabinet of Ministers.',
  steps = '[{"step":"Confirm quota eligibility","detail":"Government quotas are allocated annually based on proposals from the Ministry of Health, itself built from quota applications submitted by companies, healthcare, R&D, and educational institutions — apply for inclusion in the relevant annual quota cycle before any licensed activity can begin"},{"step":"Obtain activity license","detail":"Any cultivation, processing, manufacturing, compounding, storage, import, or export activity requires a specific license; licensing conditions for cultivation specifically were still being finalized by the Cabinet of Ministers as of mid-2026"},{"step":"Register in the electronic traceability system","detail":"All controlled activity must be logged in Ukraine''s electronic circulation-tracking system within 24 hours of each transaction, covering more than 30 transaction types across seed, cultivation, processing, and dispensing stages"},{"step":"Near-term entry via the finished-medicine import exemption","detail":"Given the zero cannabis-plant import quota in force until 2028 (with narrow exemptions), the most realistic 2026 entry point is supplying already-authorized finished medicines or APIs for licensed pharmacy compounding rather than raw plant material or domestic cultivation"}]'::jsonb,
  key_regulators = '["Ministry of Health of Ukraine — prescribing conditions, quota proposals, patient access","State Service of Ukraine on Medicines and Drugs Control — licensing and quality oversight","Ministry of Agrarian Policy — cultivation and processing licensing","National Police of Ukraine — security compliance, mandatory facility access rights"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming medical legalization opened cultivation or raw-material import — a zero cannabis-plant import quota is in force until 2028 except for a narrow exempted category; realistic near-term entry is finished-medicine supply, not plant material',
    'Underestimating the licensing and quota dual-requirement — a license alone is not sufficient; every activity also requires an annual government quota allocation, and 2026 was the first year quotas were set at all',
    'Treating this as a mature program — the first patients only received prescriptions in mid-2026 and cultivation licensing conditions were still being finalized by the Cabinet of Ministers as of the most recent reporting; the operational program is very new'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across a CMS Expert Guide, an official CMS Law Now regulatory alert on the 2026 quotas, Ukraine''s Ministry of Health, and multiple independent reform-tracking outlets, with consistent dates and figures across all sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine')
WHERE country_iso2 = 'UA';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Licensing fees not uniformly published; NACOC operates 11 distinct licence categories covering cultivation, processing, distribution, and export separately, each with its own fee and compliance requirements — corporate applicants must budget for compliance with the 50% Ghanaian-ownership and majority-Ghanaian-directors requirement in addition to licensing costs',
  legal_framework_summary = 'Ghana operates a licensed, low-THC-only cannabis framework restricted to medicinal and industrial purposes, formally launched for implementation on 11 February 2026 (with a public program-opening event on 26 February 2026) under the Narcotics Control Commission (Amendment) Act, 2023 (Act 1100) and the Narcotics Control Commission (Cultivation and Management of Cannabis) Regulations, 2023 (L.I. 2475). Only cannabis varieties at or below 0.3% THC on a dry-weight basis are permitted — this is explicitly framed by the Interior Ministry as an industrial hemp and therapeutic-cannabis program, not adult-use legalization, and recreational "wee" remains fully criminalized under Section 45 of the Narcotics Control Commission Act 2020 (Act 1019), which criminalizes purchase, sale, or possession of narcotic plants without lawful authority. The Narcotics Control Commission (NACOC) administers 11 distinct license categories spanning the full value chain: cultivation, processing, distribution, transport, research, and export. Licensing is restricted to Ghanaian citizens or permanent residents aged 18 or older; corporate applicants must maintain at least 50% Ghanaian ownership and a majority of Ghanaian directors, a deliberate policy choice the government has framed around directing the $7.8 billion in 2025 diaspora remittances toward domestic industry-building rather than foreign capital. The government has publicly cited Canada''s legal cannabis sector (C$894.6 million in 2022–23 revenue) as its benchmark for the economic opportunity it is pursuing, and has stated anticipated outcomes including reduced illegal high-THC cultivation as farmers transition to the legal low-THC track, job creation particularly for rural youth, and licensing/export revenue. As of April 2026, the program had begun formally accepting applications, including from Ghanaians living abroad. A parallel commentary track (legal academics, industry critics) has noted that domestic hemp cultivation still faces the same NACOC narcotics-style licensing and security burden as hard narcotics, even as imported hemp-derived consumer products (skincare, cosmetics) already circulate in ordinary Ghanaian retail channels without equivalent friction — a live domestic-versus-imported asymmetry worth monitoring for anyone building a Ghana-based (rather than export-into-Ghana) operation.',
  steps = '[{"step":"Confirm ownership-structure eligibility","detail":"Corporate applicants must have at least 50% Ghanaian ownership and a majority of Ghanaian directors — structure any joint venture or local entity accordingly before applying"},{"step":"Select the correct license category","detail":"NACOC operates 11 separate license categories across cultivation, processing, distribution, transport, research, and export — identify which stage(s) of the value chain the intended activity covers"},{"step":"Apply through NACOC","detail":"Submit application to the Narcotics Control Commission; the program began formally accepting applications, including from the Ghanaian diaspora, as of April 2026"},{"step":"Confirm THC compliance pathway","detail":"All cultivated material must test at or below 0.3% THC dry-weight — build lab-testing and compliance verification into the cultivation plan from the outset, since this is the central legal boundary separating the licensed program from criminal narcotics enforcement"}]'::jsonb,
  key_regulators = '["Narcotics Control Commission (NACOC) — licensing, cultivation and management oversight, enforcement","Ministry of the Interior — program policy and public communication","Ghana Investment Promotion Centre — diaspora and foreign investment facilitation"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming this is adult-use or retail legalization — Ghana''s Interior Minister has explicitly and repeatedly stated the program is not about legalizing recreational "wee"; it is a licensed low-THC medicinal/industrial framework only, and Section 45 of Act 1019 still criminalizes unauthorized cannabis dealing',
    'Overlooking the Ghanaian-ownership requirement — corporate applicants need at least 50% Ghanaian ownership and majority-Ghanaian directors; a wholly foreign-owned entity cannot obtain a license as structured',
    'Assuming domestic cultivation faces the same low friction as importing hemp-derived consumer products — critics have specifically noted that imported hemp cosmetics and skincare already move through ordinary retail with minimal friction, while domestic growers face narcotics-style licensing, fees, and security requirements; this asymmetry is a live policy tension, not a settled feature'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the Ghana Ministry of the Interior official announcement, NACOC''s own regulatory page, and multiple independent industry-press accounts with consistent dates, licence-category counts, and ownership-requirement figures',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/')
WHERE country_iso2 = 'GH';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Licenses issued by the CCRA are valid for five-year periods; specific fee schedules are not yet publicly consolidated, but penalty exposure for unauthorized activity is severe — PKR 1,000,000 to 10,000,000 (roughly $3,500-$35,000) for individuals and up to PKR 200,000,000 (roughly $700,000) for companies, which signals the compliance stakes applicants should budget against even before considering licensing fees themselves',
  legal_framework_summary = 'Pakistan has legalized industrial hemp and medical/industrial cannabis in law, but the regulatory infrastructure to actually operate a license is still being stood up as of mid-2026, making this a jurisdiction with real legal authorization but immature institutional capacity. The foundational reform was a September 2020 federal cabinet decision approving industrial hemp production (0.3% THC ceiling), championed by then-Science Minister Fawad Chaudhry with a projected $1 billion revenue opportunity over three years. That was followed by years of inter-ministerial jurisdictional disputes (Ministry of Narcotics Control versus Ministry of Food Security) that stalled implementation. The Cannabis Control and Regulatory Authority Ordinance 2024 (later the Cannabis Control and Regulatory Authority Act, 2024) formally established the CCRA under the Cabinet Division in early-to-mid 2024, tasked with regulating cultivation, extraction, refining, manufacturing, and sale of cannabis derivatives for medical and industrial use, issuing five-year licenses, and formulating a national cannabis policy. Cannabis is defined broadly in the Act to include charas/resin, hashish oil, and the flowering/fruiting tops (bhang, siddhi, ganja are explicitly named), while all activity remains subject to the Control of Narcotic Substances Act of 1997 outside the licensed carve-out — recreational cultivation, possession, sale, and use remain criminal offenses with penalties up to seven years imprisonment, and CBD products are not legally distinguished from THC-containing cannabis. As of May 2026, the CCRA is in active infrastructure buildout: the federal cabinet approved a Rs. 100 million (~$359,000) supplementary grant in May 2026 to renovate a new Islamabad headquarters (a former government building), the Chairman''s Chamber was formally inaugurated on 12 May 2026, and the agency has launched an E-Licensing Portal advertised as offering QR-coded, digitally signed licenses with dynamic capacity tiers from small test beds to large commercial fields. However, no independent, verifiable reporting as of mid-2026 confirms licenses have actually been issued and operational cultivation has begun under the new framework — the legal authorization exists, but the practical licensing pipeline is very new and largely unproven for outside applicants.',
  steps = '[{"step":"Monitor CCRA institutional readiness","detail":"The regulator itself is still finalizing its headquarters and operational capacity as of May 2026 — confirm current institutional status directly with CCRA before committing resources to an application"},{"step":"Apply via the E-Licensing Portal","detail":"CCRA''s official portal (ccra.gov.pk) is the only legitimate application channel; the agency has issued explicit fraud warnings against third parties claiming to offer CCRA licensing or approval services"},{"step":"Select capacity tier","detail":"The E-Licensing Portal is built around dynamic capacity management from small test beds to large commercial fields — determine appropriate tier based on intended operation scale"},{"step":"Budget for the 5-year license term and compliance regime","detail":"Licenses run five years and are subject to regular inspections; penalty exposure for any lapse into unauthorized activity is severe (up to PKR 200M for companies), so compliance infrastructure should be built in from the start"}]'::jsonb,
  key_regulators = '["Cannabis Control and Regulatory Authority (CCRA) — licensing, cultivation and derivative-product oversight, under the Cabinet Division","Ministry of Narcotics Control — historical jurisdictional stakeholder, narcotics enforcement","Federal Board of Revenue — customs and import/export enforcement (active seizure enforcement confirmed as of January 2026)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming CCRA''s legal establishment (2024) means the licensing system is fully operational — as of May 2026 the agency was still finalizing its own headquarters and institutional capacity; verify current operational status directly rather than assuming the 2024 Act alone means licenses are readily issuable',
    'Engaging with any third party claiming to broker or expedite CCRA licensing — CCRA has issued explicit public fraud warnings that any licensing claims made outside its official website and communications channels are illegitimate',
    'Treating CBD as legally distinct from THC-containing cannabis — Pakistani law does not draw this distinction outside the licensed CCRA framework; CBD products remain illegal without a corresponding license'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium-high — CCRA''s existence, structure, and recent headquarters buildout are directly confirmed via its official government site and Wikipedia''s sourced entry; however, no independent source as of mid-2026 confirms licenses have actually been issued or operational cultivation has begun, which is flagged explicitly above rather than assumed',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.ccra.gov.pk/')
WHERE country_iso2 = 'PK';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'No standard published fee schedule for cultivation/production/distribution licenses as of 2026; the framework is deliberately open (any qualifying individual or company may apply, no public tender, no state monopoly), so costs are primarily compliance-driven — GACP/GMP-equivalent production standards, facility security, and JAZMP inspection readiness rather than a fixed government licensing fee',
  legal_framework_summary = 'Slovenia has one of the most structurally open medical cannabis frameworks in Europe as of 2026, while adult-use reform remains a live but unresolved legislative process. The Medical and Scientific Use of Cannabis Act passed Slovenia''s National Assembly on 15 July 2025 (50-29-2), was vetoed by the National Council 20-9, then reaffirmed by the National Assembly 49-11 on 24 July 2025, and formally entered into force on 20 August 2025 — 15 days after Official Gazette publication. The law legalizes cultivation, production, distribution, and use of Cannabis sativa L. for medical and scientific purposes under an explicitly non-restrictive, open licensing system: any individual or company (public or private) meeting the regulatory criteria can obtain a license, with no public tender process and no state monopoly, a deliberate design choice distinguishing Slovenia from more restrictive single-operator or limited-tender European medical cannabis regimes. The Slovenian Agency for Medicinal Products and Medical Devices (JAZMP) is the central regulator, responsible for licensing cultivation, processing, and distribution, plus import/export authorization; only companies already licensed to manufacture medicines or active pharmaceutical ingredients may operate in cannabis production, and cultivation/processing must meet GACP (Good Agricultural and Collection Practice) and GMP (Good Manufacturing Practice) standards. Physicians may prescribe cannabis for any condition they judge appropriate — an unusually broad prescribing authority that Slovenia''s own Medical Chamber has publicly flagged as anomalous relative to how every other medicine is regulated in the country, citing physician training gaps as a practical concern. Prescriptions are capped at one month and are non-renewable, requiring a new medical examination annually. Implementation carries statutory deadlines: cannabis/THC removal from the prohibited-substances list within 90 days of enactment, harmonization of medicines-dispensing regulations within 90 days, Ministry of Health technical rules (facility security, production licensing conditions, monitoring mechanisms) within 6 months of enactment (i.e., by roughly February 2026), and JAZMP given 18 months to build electronic patient/production record infrastructure. Industry forecasts project the medical cannabis market reaching approximately EUR55 million by 2029 at roughly 4% annual growth. Separately and not yet law, a coalition-backed adult-use bill (allowing home cultivation of up to 4 plants per person / 6 per household, public possession up to 7g, and non-commercial sharing) was introduced in the National Assembly following the medical law''s passage, backed by non-binding June 2024 referendum results (66.71% support for medical home-grow, 51.57% support for adult personal-use legalization) — but as of the most recent reporting the bill remained under debate, had not received full coalition backing (the Social Democrats, part of the governing coalition, had not endorsed it), and its timeline to a vote was unconfirmed. Recreational cannabis outside this pending bill remains decriminalized-but-illegal: personal-use possession is a misdemeanor (fine of EUR36-EUR179, reducible via treatment enrollment), not a criminal offense.',
  steps = '[{"step":"Confirm JAZMP technical-rules status","detail":"The Ministry of Health had a 6-month statutory deadline from the 20 August 2025 enactment date (i.e., roughly February 2026) to finalize technical rules on facility security, production licensing conditions, and monitoring — confirm these are published and current before applying"},{"step":"Verify existing pharmaceutical manufacturing licensure","detail":"Only companies already licensed to manufacture medicines or active pharmaceutical ingredients may operate in cannabis production under this law — this is a threshold eligibility requirement, not just a compliance standard"},{"step":"Apply to JAZMP under the open licensing model","detail":"No public tender and no state monopoly — any qualifying individual or company may apply directly; there is no competitive bidding process to navigate"},{"step":"Build to GACP/GMP standards","detail":"Cultivation and processing must meet EU Good Agricultural and Collection Practice and Good Manufacturing Practice standards from the outset"},{"step":"Monitor the pending adult-use bill separately","detail":"A separate, not-yet-passed adult-use bill exists in parliament — do not conflate its provisions (home cultivation limits, possession thresholds) with the medical/scientific framework, which is the only one currently in force"}]'::jsonb,
  key_regulators = '["Slovenian Agency for Medicinal Products and Medical Devices (JAZMP) — licensing, import/export authorization, e-records infrastructure","Ministry of Health — technical rules, prescribing regulation harmonization, patient examination requirements"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Slovenia has adult-use/recreational legalization — only the medical and scientific framework is currently in force; a separate adult-use bill remains pending in parliament without full coalition backing as of the most recent reporting',
    'Applying without existing pharmaceutical manufacturing licensure — eligibility is restricted to companies already licensed to manufacture medicines or APIs, not open to any agricultural operator regardless of the "open licensing" framing',
    'Assuming the "open licensing, no state monopoly" framing means low regulatory friction — production must still meet full GACP/GMP pharmaceutical-grade standards, and technical implementing rules were only due by ~February 2026, meaning the practical licensing environment was still maturing well after the law''s August 2025 entry into force'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Business of Cannabis, Sibiz (a Slovenia-based business services firm), Prohibition Partners'' European legislation tracker, Marijuana Moment''s legislative reporting on the veto/override sequence, and multiple industry outlets, all consistent on dates, vote counts, and structural details',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://businessofcannabis.com/inside-slovenias-new-revolutionary-medical-cannabis-law/')
WHERE country_iso2 = 'SI';

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('UA', 'INCB Import Quota 2026', 592068, 'grams', '2026-01-01', '2026-12-31', 'annual', 'observed', 'high', 'Cabinet of Ministers of Ukraine / CMS Law Now', 'https://cms-lawnow.com/en/ealerts/2026/01/ukraine-approves-2026-quotas-for-controlled-substances-including-medical-cannabis-thc', '2026-01-14', 'THC storage quota ceiling; first-ever medical cannabis quota set by Ukraine, covers production/import/export/storage limits under Resolution No. 1772'),
  ('UA', 'Estimated Addressable Patient Population', 6000000, 'patients', '2026-01-01', '2026-12-31', 'annual', 'estimated', 'medium', 'Ukraine Ministry of Health (via MyCannabis / Marijuana Moment reporting)', 'https://www.mycannabis.com/is-weed-legal-in-ukraine/', '2026-06-02', 'Health Ministry estimate of Ukrainians who could benefit from cannabis-based treatment, including PTSD-affected soldiers and civilians; not a current enrolled-patient count'),
  ('GH', 'NACOC Licence Categories', 11, 'categories', '2026-02-01', '2026-12-31', 'annual', 'observed', 'high', 'Herb.co (citing NACOC regulations)', 'https://herb.co/city-guides/buy-weed-ghana', '2026-05-21', 'Number of distinct license categories under the Cannabis Regulatory Programme covering the full value chain'),
  ('GH', 'Ghana Diaspora Remittances 2025', 7800000000, 'USD', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high', 'The Marijuana Herald (citing central bank officials)', 'https://themarijuanaherald.com/2026/04/ghana-opens-cannabis-licenses-to-citizens-abroad-as-hemp-industry-begins-accepting-applications/', '2026-04-20', 'Cited by government as the diaspora capital pool the cannabis licensing ownership rules aim to direct toward domestic industry'),
  ('PK', 'CCRA HQ Renovation Grant May 2026', 359000, 'USD', '2026-05-01', '2026-05-31', 'point_in_time', 'observed', 'high', 'The Marijuana Herald (citing Economic Coordination Committee)', 'https://themarijuanaherald.com/2026/05/pakistan-approves-funding-to-launch-government-run-cannabis-regulatory-office-in-islamabad/', '2026-05-08', 'Rs. 100 million supplementary grant approved for CCRA headquarters renovation in Islamabad; institutional-capacity signal, not a market-size metric'),
  ('PK', 'Maximum Corporate Penalty for Unauthorized Cannabis Activity', 700000, 'USD', '2026-01-01', '2026-12-31', 'annual', 'observed', 'medium', 'LegalClarity', 'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/', '2025-08-23', 'PKR 200,000,000 statutory maximum for companies under CCRA framework, converted at approximate mid-2026 exchange rate; individual maximum is PKR 10,000,000 (~$35,000)'),
  ('SI', 'Projected Medical Cannabis Market Size 2029', 55000000, 'EUR', '2029-01-01', '2029-12-31', 'annual', 'estimated', 'medium', 'Business of Cannabis (industry analyst forecast)', 'https://businessofcannabis.com/inside-slovenias-new-revolutionary-medical-cannabis-law/', '2026-08-27', 'Industry forecast at ~4% annual growth rate; forward-looking projection, not a current observed market figure'),
  ('SI', 'Adult Past-Month Cannabis Use Rate', 2.8, 'percent', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high', 'European Union Drugs Agency 2025 report (via Cannabis Now)', 'https://cannabisnow.com/slovenias-proposed-cannabis-legalization-measure-would-help-consumers/', '2025-08-13', 'EUDA 2025 report figure; also cites 5.4% past-year and 22% lifetime prevalence for Slovenian adults')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('UA','GH','PK','SI');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190400','jurisdiction_playbooks_batch20_ua_gh_pk_si','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190400_jurisdiction_playbooks_batch20_ua_gh_pk_si.sql

-- RECOVERY BEGIN 20260710190500_jurisdiction_playbooks_batch20a_sources.sql
-- Sources for jurisdiction_playbooks batch 20 (part A of B, see batch20b for
-- playbook content + market metrics). Split across two files due to payload size.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('CMS Expert Guides — Cannabis law and legislation in Ukraine', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine', 'Ukraine', 'UA', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 3528-IX full licensing/quota framework, zero import quota until 2028 exception list, industrial hemp THC 0.2%->0.3% Feb 2027 threshold'),
  ('CMS Law Now — Ukraine approves 2026 quotas for controlled substances including medical cannabis', 'https://cms-lawnow.com/en/ealerts/2026/01/ukraine-approves-2026-quotas-for-controlled-substances-including-medical-cannabis-thc', 'Ukraine', 'UA', 'Europe', 1, 'html_snapshot', 'annual', 'regulatory_filing', 'First-ever 2026 THC storage/production/import/export quotas, 592,068g storage limit'),
  ('Wikipedia — Cannabis in Ukraine', 'https://en.wikipedia.org/wiki/Cannabis_in_Ukraine', 'Ukraine', 'UA', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', 'Administrative possession threshold 5g, cultivation up to 10 plants administrative not criminal'),
  ('MyCannabis — Is Weed Legal in Ukraine 2026', 'https://www.mycannabis.com/is-weed-legal-in-ukraine/', 'Ukraine', 'UA', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'War-driven reform context, up to 6M potential patients per Health Ministry estimate'),
  ('Ministry of the Interior Ghana — Ghana Begins Medicinal and Industrial Cannabis Cultivation', 'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/', 'Ghana', 'GH', 'Africa', 1, 'html_snapshot', 'quarterly', 'government_release', 'Official Feb 2026 program launch, 50% Ghanaian ownership requirement, 18+ age requirement'),
  ('Narcotics Control Commission Ghana — Cannabis Regulations', 'https://www.ncc.gov.gh/cannabis-regulations/', 'Ghana', 'GH', 'Africa', 1, 'html_snapshot', 'quarterly', 'regulatory_filing', 'Act 1100 (2023) and L.I. 2475 legal basis, 0.3% THC ceiling, NACOC oversight'),
  ('Herb.co — How to Buy Weed in Ghana in 2026', 'https://herb.co/city-guides/buy-weed-ghana', 'Ghana', 'GH', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '11 NACOC licence categories, Section 45 Act 1019 criminal penalty for unauthorized dealing confirmed still in force'),
  ('The Marijuana Herald — Ghana Opens Cannabis Licenses to Citizens Abroad', 'https://themarijuanaherald.com/2026/04/ghana-opens-cannabis-licenses-to-citizens-abroad-as-hemp-industry-begins-accepting-applications/', 'Ghana', 'GH', 'Africa', 2, 'html_snapshot', 'quarterly', 'news', 'Diaspora investment framing, $7.8B 2025 remittances context, full supply chain licensing scope'),
  ('Cannabis Control & Regulatory Authority Pakistan — Official Site', 'https://www.ccra.gov.pk/', 'Pakistan', 'PK', 'Asia', 1, 'html_snapshot', 'monthly', 'government_release', 'CCRA HQ inaugurated May 2026, E-Licensing Portal live, QR-coded digital licenses'),
  ('Wikipedia — Cannabis Control and Regulatory Authority', 'https://en.wikipedia.org/wiki/Cannabis_Control_and_Regulatory_Authority', 'Pakistan', 'PK', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'CCRA Act 2024 establishment, Cabinet Division oversight, board functions'),
  ('LegalClarity — Is Weed Legal in Pakistan? A Look at Current Laws', 'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/', 'Pakistan', 'PK', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '5-year license validity, penalty structure PKR 1-10M individuals up to 200M companies, CBD not distinguished from THC'),
  ('The Marijuana Herald — Pakistan Approves Funding to Launch Cannabis Regulatory Office', 'https://themarijuanaherald.com/2026/05/pakistan-approves-funding-to-launch-government-run-cannabis-regulatory-office-in-islamabad/', 'Pakistan', 'PK', 'Asia', 2, 'html_snapshot', 'quarterly', 'news', 'May 2026 ECC Rs.100M supplementary grant for HQ, still-forming institutional capacity signal'),
  ('Business of Cannabis — Inside Slovenia''s New Revolutionary Medical Cannabis Law', 'https://businessofcannabis.com/inside-slovenias-new-revolutionary-medical-cannabis-law/', 'Slovenia', 'SI', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Act in force 20 Aug 2025, 6-month technical rules deadline, JAZMP 18-month e-records deadline, EUR55M by 2029 forecast'),
  ('Sibiz — Slovenia legalizes medical cannabis: new law effective from August 20 2025', 'https://sibiz.eu/slovenia-legalizes-medical-cannabis-marijuana-new-law-effective-from-august-20-2025/', 'Slovenia', 'SI', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Any-condition prescribing authority, 1-month non-renewable prescriptions, Medical Chamber concern about scope'),
  ('Marijuana Moment — Slovenian Lawmakers File Bill To Legalize Marijuana For Adults', 'https://www.marijuanamoment.net/slovenian-lawmakers-file-bill-to-legalize-marijuana-for-adults-as-separate-medical-cannabis-measure-passes/', 'Slovenia', 'SI', 'Europe', 2, 'html_snapshot', 'monthly', 'legislative_tracking', 'National Council veto 20-9 then National Assembly override 49-11, adult-use bill still pending as of reporting'),
  ('Prohibition Partners — Slovenia Medical Cannabis Legislation & Legal Status Map', 'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/slovenia/', 'Slovenia', 'SI', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Open licensing system framing, any-operator-qualifies model, JAZMP licensing authority confirmed')
ON CONFLICT DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190500','jurisdiction_playbooks_batch20a_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190500_jurisdiction_playbooks_batch20a_sources.sql

-- RECOVERY BEGIN 20260710190700_add_ratings_indexes_concurrently.sql
-- CONCURRENTLY removed 2026-08-05 for zero-state replay. The Supabase CLI sends
-- a migration's statements as one pipeline, and Postgres refuses CREATE INDEX
-- CONCURRENTLY there:
--   ERROR: CREATE INDEX CONCURRENTLY cannot be executed within a pipeline
--   (SQLSTATE 25001)
-- Only the keyword is dropped; every index name, table and column list below is
-- unchanged, so the resulting schema is identical. CONCURRENTLY exists to avoid
-- locking a populated table, which is meaningless against the empty database a
-- replay builds, and production already carries these indexes -- this version is
-- recorded in supabase_migrations.schema_migrations, applied there as a single
-- statement, which is why the pipeline rule never bit in production.

-- Split out of 20260709000000_add_ratings_to_listings.sql on second review
-- (PR #1004): the original migration created these indexes with a plain
-- CREATE INDEX, which takes a lock that blocks writes to `listings` for the
-- duration of the build -- risky on a live table.
--
-- CREATE INDEX cannot run inside a transaction block, and this
-- would be split across a transaction if it stayed in the same file as the
-- ALTER TABLE / CREATE FUNCTION / CREATE TRIGGER statements there. So, per
-- the precedent already set by 20260622130000_add_missing_fk_indexes_jun22.sql,
-- these two indexes get their own migration file.
--
-- Do NOT wrap this file in BEGIN/COMMIT -- cannot run inside a
-- transaction block.

CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710190700','add_ratings_indexes_concurrently','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710190700_add_ratings_indexes_concurrently.sql

-- RECOVERY BEGIN 20260710200000_revoke_excess_grants_content_gated_tables.sql
-- Flagged during the security_definer_view audit (20260710190000): these 3
-- base tables grant full CRUD (DELETE, INSERT, REFERENCES, SELECT, TRIGGER,
-- TRUNCATE, UPDATE) directly to anon/authenticated, almost certainly from a
-- stray broad GRANT rather than a deliberate decision -- confirmed by
-- checking pg_policies: none of the three has a permissive INSERT/UPDATE/
-- DELETE policy for anon/authenticated, so RLS already blocks every write
-- via PostgREST today. Not an active breach (RLS is the real enforcing
-- control and it's intact), but dead, overly-broad grants are still worth
-- closing:
--   - Least privilege: no code path needs these, so there's nothing to
--     preserve by keeping them.
--   - TRUNCATE is the one command Postgres never subjects to RLS at all --
--     currently inert only because anon/authenticated aren't reachable via
--     a direct Postgres connection in this architecture (PostgREST-only),
--     but that's an operational fact to keep true, not something this
--     grant should depend on.

-- country_education_overlay / editorial_items: each has exactly one
-- permissive policy, and it's SELECT-only (content-gated: review_status /
-- stage). Keep that read path; drop everything else.
revoke insert, update, delete, truncate, trigger, references
  on public.country_education_overlay from anon, authenticated;
revoke insert, update, delete, truncate, trigger, references
  on public.editorial_items from anon, authenticated;

-- stripe_webhook_events: its one policy is `ALL ... USING (auth.role() =
-- 'service_role')` -- anon/authenticated are blocked from every command,
-- including SELECT. No read path to preserve here at all.
revoke all on public.stripe_webhook_events from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710200000','revoke_excess_grants_content_gated_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710200000_revoke_excess_grants_content_gated_tables.sql

-- RECOVERY BEGIN 20260710230603_insert_test_snapshot_fallback_test.sql
-- Reconstructed from production.
--
-- The production ledger statement for version 20260710230603 inserted a
-- transient test snapshot against source UUID
-- 431f3158-b037-471c-8ae7-af55efc8ea35. Fresh read-only production metadata
-- shows that source is no longer present and no recorded production migration
-- creates it. Repository zero-state replay also retains the legacy snapshot_hash
-- NOT NULL column from 20260303000000 although production no longer does.
--
-- Preserve the production-facing test payload, supply only a deterministic
-- replay compatibility hash, and execute the historical insert only when its
-- parent source exists. No source metadata is invented or reassociated.
--
-- Rewriting this file cannot affect production: 20260710230603 is already
-- recorded in schema_migrations and is skipped by production migration push.

INSERT INTO source_snapshots (
  source_id,
  snapshot_hash,
  captured_url,
  captured_title,
  captured_text,
  fetch_status,
  language_detected,
  processing_status,
  signal_candidates
)
SELECT
  source.id,
  md5('20260710230603:https://www.theguardian.com/world/2026/jul/10/thailand-cannabis-fallback-test'),
  'https://www.theguardian.com/world/2026/jul/10/thailand-cannabis-fallback-test',
  'TEST: Thailand health ministry cannabis inspection order',
  'Thailand''s Ministry of Public Health ordered stricter joint inspections of licensed cannabis cultivation sites this week, threatening suspension or revocation of licences for violations, following a string of cannabis seizures traced to Thai growers surfacing in the UK, Germany, Indonesia and Hong Kong.',
  'success',
  'en',
  'pending',
  NULL
FROM public.source_registry source
WHERE source.id = '431f3158-b037-471c-8ae7-af55efc8ea35'
RETURNING id;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710230603','insert_test_snapshot_fallback_test','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710230603_insert_test_snapshot_fallback_test.sql

-- RECOVERY BEGIN 20260710230656_cleanup_fallback_test.sql
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
-- version 20260710230656.
--
-- Rewriting this file cannot affect production: 20260710230656 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


DELETE FROM editorial_items WHERE snapshot_id = 'f783b729-6af8-45c5-adac-c6b835a76aaa';
DELETE FROM source_snapshots WHERE id = 'f783b729-6af8-45c5-adac-c6b835a76aaa';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710230656','cleanup_fallback_test','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710230656_cleanup_fallback_test.sql

-- RECOVERY BEGIN 20260710235323_restore_hv_passports_foundation.sql
-- Replay-safe restoration of the production operator-passport foundation.
--
-- public.hv_passports and public.hv_passport_scores exist in production but
-- have no registered creator migration. Their first ledger reference is the
-- immediately following numeric-to-double-precision optimization. Restore the
-- exact live contract here with the original numeric score types so that the
-- recorded optimization remains the owner of the float8 conversion.

create table if not exists public.hv_passports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.workspaces(id) on delete cascade,
  completeness_score numeric,
  completeness_band text,
  verification_level text not null default 'none',
  export_readiness_score numeric,
  export_readiness_band text,
  import_readiness_score numeric,
  deal_readiness_score numeric,
  payment_readiness_signals jsonb,
  recall_exposure_flag boolean not null default false,
  last_computed_at timestamptz,
  public_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_passports_completeness_band_check check (
    completeness_band is null
    or completeness_band in ('incomplete', 'partial', 'substantial', 'complete')
  ),
  constraint hv_passports_export_band_check check (
    export_readiness_band is null
    or export_readiness_band in ('not_ready', 'partial', 'ready', 'verified')
  ),
  constraint hv_passports_verification_level_check check (
    verification_level in ('none', 'basic', 'standard', 'enhanced')
  )
);

create table if not exists public.hv_passport_scores (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.hv_passports(id) on delete cascade,
  dimension text not null,
  score numeric,
  max_score numeric not null default 100,
  confidence text not null default 'insufficient_data',
  evidence_count integer not null default 0,
  flags jsonb,
  computed_at timestamptz not null default now(),
  constraint hv_passport_scores_passport_id_dimension_key unique (passport_id, dimension),
  constraint hv_passport_scores_dimension_check check (
    dimension in (
      'identity',
      'licence',
      'facility',
      'document',
      'claim',
      'coa',
      'export',
      'import',
      'payment',
      'recall'
    )
  ),
  constraint hv_passport_scores_confidence_check check (
    confidence in ('high', 'medium', 'low', 'insufficient_data')
  )
);

create index if not exists idx_hv_passports_org
  on public.hv_passports (org_id);

create index if not exists idx_hv_passports_band
  on public.hv_passports (verification_level, completeness_band);

create index if not exists idx_hv_passport_scores_passport
  on public.hv_passport_scores (passport_id);

alter table public.hv_passports enable row level security;
alter table public.hv_passport_scores enable row level security;

grant select, insert, update, delete
  on table public.hv_passports, public.hv_passport_scores
  to anon, authenticated;
grant all privileges
  on table public.hv_passports, public.hv_passport_scores
  to service_role;

do $restore_hv_passport_policies$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passports'::regclass
      and polname = 'hv_passports_org_member_select'
  ) then
    execute $policy$
      create policy hv_passports_org_member_select
        on public.hv_passports
        as permissive
        for select
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passports'::regclass
      and polname = 'hv_passports_staff_all'
  ) then
    execute $policy$
      create policy hv_passports_staff_all
        on public.hv_passports
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passport_scores'::regclass
      and polname = 'hv_passport_scores_org_member_select'
  ) then
    execute $policy$
      create policy hv_passport_scores_org_member_select
        on public.hv_passport_scores
        as permissive
        for select
        to public
        using (
          passport_id in (
            select p.id
            from public.hv_passports p
            where public.hv_is_org_member(p.org_id)
          )
        )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passport_scores'::regclass
      and polname = 'hv_passport_scores_staff_all'
  ) then
    execute $policy$
      create policy hv_passport_scores_staff_all
        on public.hv_passport_scores
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;
end
$restore_hv_passport_policies$;

comment on table public.hv_passports is
  'One passport per org. Scores computed by Edge Function only.';
comment on table public.hv_passport_scores is
  'Dimension-level breakdown. All numeric — PRIVATE to org and admin only.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710235323','restore_hv_passports_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710235323_restore_hv_passports_foundation.sql

-- RECOVERY BEGIN 20260710235324_batch_10_numeric_to_double_precision_optimization_v2.sql
-- Optimization: reclassify score/confidence columns from numeric -> double precision.
-- Scope: only columns with ZERO dependent views in ANY schema (verified via pg_depend,
-- including a same-named api.* view layer that a naive same-schema check would miss).
--
-- Excluded (view dependency -- would require dropping/recreating views this session hasn't
-- inspected, in a schema with a documented RLS-sensitivity history -- deliberately not
-- attempted blind): listings.average_rating, cc_jurisdiction_briefings.confidence_score,
-- hv_import_staging.duplicate_confidence, marketplace_candidates.confidence,
-- signal_candidates.* (13 columns).
--
-- Excluded (money/quantity -- keep numeric for exact decimal precision): commissions.*,
-- engagements.*, opportunities.value_num, listings.price_amount, listings.quantity,
-- market_metrics.metric_value.

ALTER TABLE coverage_gaps
  ALTER COLUMN severity_score TYPE double precision USING severity_score::double precision,
  ALTER COLUMN strategic_score TYPE double precision USING strategic_score::double precision;

ALTER TABLE discovery_sources
  ALTER COLUMN commercial_relevance_score TYPE double precision USING commercial_relevance_score::double precision,
  ALTER COLUMN freshness_score TYPE double precision USING freshness_score::double precision,
  ALTER COLUMN priority_score TYPE double precision USING priority_score::double precision,
  ALTER COLUMN trust_score TYPE double precision USING trust_score::double precision;

ALTER TABLE extracted_citations
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision;

ALTER TABLE extracted_entities
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision;

ALTER TABLE extracted_events
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision,
  ALTER COLUMN significance_score TYPE double precision USING significance_score::double precision;

ALTER TABLE extraction_contradictions
  ALTER COLUMN contradiction_score TYPE double precision USING contradiction_score::double precision;

ALTER TABLE hv_passport_scores
  ALTER COLUMN max_score TYPE double precision USING max_score::double precision,
  ALTER COLUMN score TYPE double precision USING score::double precision;

ALTER TABLE hv_passports
  ALTER COLUMN completeness_score TYPE double precision USING completeness_score::double precision,
  ALTER COLUMN deal_readiness_score TYPE double precision USING deal_readiness_score::double precision,
  ALTER COLUMN export_readiness_score TYPE double precision USING export_readiness_score::double precision,
  ALTER COLUMN import_readiness_score TYPE double precision USING import_readiness_score::double precision;

ALTER TABLE hv_relations
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision;

ALTER TABLE signal_duplicate_groups
  ALTER COLUMN similarity_score TYPE double precision USING similarity_score::double precision;

ALTER TABLE source_candidates
  ALTER COLUMN aggregate_score TYPE double precision USING aggregate_score::double precision,
  ALTER COLUMN authority_score TYPE double precision USING authority_score::double precision,
  ALTER COLUMN commercial_relevance_score TYPE double precision USING commercial_relevance_score::double precision,
  ALTER COLUMN novelty_score TYPE double precision USING novelty_score::double precision,
  ALTER COLUMN parseability_score TYPE double precision USING parseability_score::double precision,
  ALTER COLUMN recurrence_score TYPE double precision USING recurrence_score::double precision;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710235324','batch_10_numeric_to_double_precision_optimization_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710235324_batch_10_numeric_to_double_precision_optimization_v2.sql

-- RECOVERY BEGIN 20260710235525_batch_10_optimization_controlref_log.sql
INSERT INTO project_control_refs
  (id, system, external_type, external_id, external_url, canonical_entity_type, canonical_entity_id,
   canonical_key, authority, write_mode, title, status, metadata, first_seen_at, last_seen_at)
VALUES
  (gen_random_uuid(), 'manual', 'schema_change', 'numeric_to_double_optimization',
   'https://github.com/harbourviewcompany-create/harbourview-platform/blob/main/supabase/migrations/20260710190000_numeric_to_double_precision_optimization.sql',
   'schema_change', 'numeric_to_double_optimization',
   'schema_change:numeric_to_double_optimization', 'proposal', 'read_only',
   'Reclassified 25 score/confidence columns numeric -> double precision to eliminate PostgREST numeric-as-string bug class. Excluded 16 columns (signal_candidates x13, marketplace_candidates, hv_import_staging) due to dependent views (some in an api schema mirror not caught by a same-schema check) -- deliberately not touched given RLS-sensitivity history.',
   'pending_review',
   jsonb_build_object(
     'columns_converted', 25,
     'columns_excluded_view_dependency', jsonb_build_array('signal_candidates.*(13 cols)','marketplace_candidates.confidence','hv_import_staging.duplicate_confidence','listings.average_rating','cc_jurisdiction_briefings.confidence_score'),
     'app_layer_fixes', jsonb_build_array('lib/marketplace/publicProjection.ts:price_amount','lib/dashboard/dashboardLiveData.ts:confidence_score'),
     'note', 'cc_jurisdiction_briefings.confidence_score confirmed via existing code comment to be a uniform 0.72 seed value across all 203 countries -- casting fixed its type but the data itself is not meaningful. Recommend deciding whether to stop exposing it or re-seed real values. api schema view layer (hv_import_staging, marketplace_candidates, signal_candidates) needs inspection before those 14 remaining columns can be converted.',
     'rollback_available', true
   ),
   now(), now());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710235525','batch_10_optimization_controlref_log','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710235525_batch_10_optimization_controlref_log.sql

-- RECOVERY BEGIN 20260711000853_grant_select_buyer_requests_public_read.sql
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
-- version 20260711000853.
--
-- Rewriting this file cannot affect production: 20260711000853 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Same bug class as the earlier fixes: buyer_requests_public_read policy
-- (status = 'approved', roles anon+authenticated) exists and is correctly
-- scoped, but the base-table grant was never applied. This is a live,
-- actively-used table (marketplace match engine, admin promote flow), so
-- this was silently blocking the public "browse buyer requests" read path.

GRANT SELECT ON public.buyer_requests TO anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711000853','grant_select_buyer_requests_public_read','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711000853_grant_select_buyer_requests_public_read.sql

-- RECOVERY BEGIN 20260711010336_expose_marketplace_matching_tables_via_api_schema.sql
-- Restore the exact production-owned body for migration 20260711010336.
-- The previous local reconciliation stub omitted the API views that the later
-- security-invoker hardening migration expects to exist.

-- buyer_requests: column-restricted, omits contact_name/contact_email/contact_phone/legal_entity/internal_notes/archived_at
-- (RLS gates rows by status='approved' but not columns; those fields stay service_role/direct-SQL only)
create view api.buyer_requests as
select
  id,
  category,
  title,
  description,
  product_type,
  region,
  price_range,
  buyer_type,
  requirements,
  status,
  created_at,
  updated_at
from public.buyer_requests;

grant select, insert on api.buyer_requests to anon, authenticated;
grant select on api.buyer_requests to service_role;

-- marketplace_item_images: NOT the recorded body, deliberately.
--
-- The recorded body selects listing_id, candidate_id, uploader_user_id,
-- storage_path, mime_type, display_order and is_primary, which describe the
-- seventeen-column public.marketplace_item_images living in production. That
-- is not the table this repository builds.
-- 20260605000000_marketplace_image_trust_layer.sql creates a different
-- forty-column table of the same name, and lib/marketplace/images/*.ts reads
-- that trust-layer shape.
--
-- The trust-layer migration has never executed against production: its ledger
-- row carries an empty statement array, none of its marketplace_image_* enum
-- types exist there, and production's table has zero trust-layer columns. The
-- repository is ahead of production here, so the recorded body encodes the
-- superseded pre-trust-layer shape and replaying it verbatim fails with
-- column "listing_id" does not exist.
--
-- The column list below is not invented: it is exactly
-- PUBLIC_MARKETPLACE_IMAGE_COLUMNS from lib/marketplace/images/dto.ts, the
-- repository's own public projection for this table, which that module keeps
-- deliberately separate from ADMIN_MARKETPLACE_IMAGE_COLUMNS. Nothing from the
-- admin set is exposed here: no original/edited/public storage bucket or path,
-- no source_name/source_url/source_reference, no adobe_edit_summary, no
-- content_credentials_*, no checksum, no rejection_reason, no reviewed_by,
-- no uploaded_by. created_at and updated_at are outside that public list and
-- are therefore also omitted.
--
-- Row visibility is unchanged: the trust layer's own "Public can read approved
-- public marketplace images" policy still gates anon to review_status =
-- 'APPROVED_PUBLIC' with rights_status <> 'UNKNOWN', image_class <>
-- 'ADMIN_PRIVATE_EVIDENCE' and public_url not null, and 20260711160935 sets
-- security_invoker on this view so that policy is enforced rather than
-- bypassed.
create view api.marketplace_item_images as
select
  id,
  item_id,
  image_class,
  image_role,
  source_type,
  public_url,
  thumbnail_url,
  hero_url,
  gallery_url,
  social_url,
  alt_text,
  caption,
  is_illustrative,
  review_status,
  rights_status
from public.marketplace_item_images;

grant select on api.marketplace_item_images to anon, authenticated, service_role;

-- matches: already admin/operator-only via RLS, full passthrough is fine
create view api.matches as
select
  id,
  listing_id,
  buyer_request_id,
  inquiry_id,
  status,
  internal_notes,
  proposed_at,
  introduced_at,
  closed_at,
  created_at,
  updated_at,
  match_rationale,
  match_rationale_model,
  match_rationale_generated_at
from public.matches;

grant select on api.matches to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711010336','expose_marketplace_matching_tables_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711010336_expose_marketplace_matching_tables_via_api_schema.sql

-- RECOVERY BEGIN 20260711010600_expose_workspaces_and_hv_passports_via_api_schema.sql
-- Restore the exact production-owned body for migration 20260711010600.
-- The previous local reconciliation stub omitted the API views that the later
-- security-invoker hardening migration expects to exist.

create view api.workspaces as
select
  id,
  name,
  created_at,
  slug,
  settings,
  status,
  updated_at,
  legal_name,
  trade_name,
  org_type,
  jurisdiction_country,
  jurisdiction_region,
  verification_status,
  verified_at,
  verified_by,
  is_public
from public.workspaces;

grant select, insert, update on api.workspaces to authenticated;
grant select, insert, update on api.workspaces to service_role;

create view api.hv_passports as
select
  id,
  org_id,
  completeness_score,
  completeness_band,
  verification_level,
  export_readiness_score,
  export_readiness_band,
  import_readiness_score,
  deal_readiness_score,
  payment_readiness_signals,
  recall_exposure_flag,
  last_computed_at,
  public_snapshot,
  created_at,
  updated_at
from public.hv_passports;

grant select, insert, update on api.hv_passports to authenticated;
grant select, insert, update on api.hv_passports to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711010600','expose_workspaces_and_hv_passports_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711010600_expose_workspaces_and_hv_passports_via_api_schema.sql

-- RECOVERY BEGIN 20260711010651_expose_hv_facilities_licences_passport_scores_via_api.sql
-- Restore the exact production-owned body for migration 20260711010651.
-- The previous local reconciliation stub omitted the API views that the later
-- security-invoker hardening migration expects to exist.

create view api.hv_facilities as
select
  id,
  org_id,
  name,
  facility_type,
  country,
  region,
  gmp_certified,
  gacp_certified,
  certification_evidence_id,
  status,
  created_at
from public.hv_facilities;

grant select, insert, update on api.hv_facilities to authenticated, service_role;

create view api.hv_licences as
select
  id,
  org_id,
  licence_number,
  issuing_authority,
  jurisdiction_country,
  jurisdiction_region,
  licence_type,
  permitted_activities,
  issued_at,
  expires_at,
  status,
  evidence_document_id,
  verified,
  verified_at,
  verified_by,
  created_at,
  updated_at
from public.hv_licences;

grant select, insert, update on api.hv_licences to authenticated, service_role;

create view api.hv_passport_scores as
select
  id,
  passport_id,
  dimension,
  score,
  max_score,
  confidence,
  evidence_count,
  flags,
  computed_at
from public.hv_passport_scores;

grant select, insert, update on api.hv_passport_scores to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711010651','expose_hv_facilities_licences_passport_scores_via_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711010651_expose_hv_facilities_licences_passport_scores_via_api.sql

-- RECOVERY BEGIN 20260711011620_expose_dossiers_via_api_schema.sql
-- Restore the exact production-owned body for migration 20260711011620.
-- The previous local reconciliation stub omitted the API view that the later
-- security-invoker hardening migration expects to exist.

create view api.dossiers as
select
  id,
  title,
  created_at,
  country_id,
  storage_bucket,
  file_path,
  file_size_bytes,
  maturity_score,
  maturity_tier,
  page_count,
  updated_at,
  drive_file_id
from public.dossiers;

grant select on api.dossiers to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711011620','expose_dossiers_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711011620_expose_dossiers_via_api_schema.sql

-- RECOVERY BEGIN 20260711011701_expose_user_dashboard_preferences_via_api_schema.sql
-- Restore the exact production-owned body for migration 20260711011701.
-- The previous local reconciliation stub omitted the API view that the later
-- security-invoker hardening migration expects to exist.

create view api.user_dashboard_preferences as
select
  id,
  user_id,
  country_iso2,
  role_id,
  heatmap_layer,
  created_at,
  updated_at
from public.user_dashboard_preferences;

grant select, insert, update, delete on api.user_dashboard_preferences to authenticated;
grant select, insert, update, delete on api.user_dashboard_preferences to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711011701','expose_user_dashboard_preferences_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711011701_expose_user_dashboard_preferences_via_api_schema.sql

-- RECOVERY BEGIN 20260711012305_expose_hv_claims_via_api_schema.sql
-- Restore the exact production-owned body for migration 20260711012305.
-- The previous local reconciliation stub omitted the API view that the later
-- security-invoker hardening migration expects to exist.

create view api.hv_claims as
select
  id,
  org_id,
  claim_type,
  claim_text,
  evidence_document_id,
  status,
  is_public,
  created_at,
  updated_at
from public.hv_claims;

grant select, insert, update on api.hv_claims to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711012305','expose_hv_claims_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711012305_expose_hv_claims_via_api_schema.sql

-- RECOVERY BEGIN 20260711012348_expose_clinical_education_tables_via_api_schema.sql
-- Restore the exact production-owned body for migration 20260711012348.
-- The previous local reconciliation stub omitted both API views that the later
-- security-invoker hardening migration expects to exist.

create view api.clinical_education_country_readiness as
select
  id,
  country,
  region,
  professional_education_readiness,
  known_training_gap,
  official_guidance_status,
  formats_requiring_education,
  pharmacist_relevance,
  clinician_relevance,
  research_status,
  professional_reviewer_needed,
  brief_availability,
  sort_order,
  created_at,
  updated_at
from public.clinical_education_country_readiness;

grant select on api.clinical_education_country_readiness to anon, authenticated, service_role;

create view api.clinical_education_modules as
select
  id,
  slug,
  title,
  route,
  audience,
  module_status,
  risk_level,
  public_summary,
  education_themes,
  safe_language,
  restricted_language,
  research_status,
  professional_review_required,
  source_basis,
  reviewer_role_required,
  audience_boundary,
  last_reviewed,
  next_review_due,
  public_use_approved,
  medical_advice_boundary,
  country_relevance,
  format_relevance,
  disclaimer_type,
  cta_label,
  cta_href,
  sort_order,
  created_at,
  updated_at
from public.clinical_education_modules;

grant select on api.clinical_education_modules to anon, authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711012348','expose_clinical_education_tables_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711012348_expose_clinical_education_tables_via_api_schema.sql

-- RECOVERY BEGIN 20260711030217_batch_11_playbooks_metrics_overlay_tr_mk_na_ke.sql
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
-- version 20260711030217.
--
-- Rewriting this file cannot affect production: 20260711030217 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Batch 11: jurisdiction_playbooks + market_metrics + country_education_overlay for TR, MK, NA, KE
-- Real, sourced content closing all three content_coverage_queue gaps for these four countries.
-- TR: new 2025 pharma-only medical law + Jan 2026 implementing regulations, still-forming market.
-- MK: mature (2016) free-market medical cultivation/export regime; GMP-recognition bottleneck flagged.
-- NA: full apartheid-era prohibition; live unresolved constitutional case + 2025 LRDC policy review.
-- KE: full prohibition with 2022 penalty-tier reform + live Rastafarian religious-exemption case
--     (judgment date has shifted three times; most recent reporting points to 15 Jul 2026).

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('Daily Sabah -- New cannabis law to boost pain relief, Turkiye''s competitiveness',
   'https://www.dailysabah.com/politics/legislation/new-cannabis-law-to-boost-pain-relief-turkiyes-competitiveness',
   'news', 1, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Direct quotes from AK Party sponsor on the 2025 pharmacy-sale law; confirms Agriculture/Health ministry split'),
  ('Business of Cannabis -- Landmark Turkish Bill Legalises Low-THC Cannabis Sales in Pharmacies',
   'https://businessofcannabis.com/landmark-turkish-bill-legalises-low-thc-cannabis-sales-in-pharmacies/',
   'industry_press', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Confirms electronic monitoring system and 19-of-81-province industrial hemp licensing history'),
  ('International CBC -- Turkey Sets Hemp Quota For Medical Products',
   'https://internationalcbc.com/turkey-sets-hemp-quota-for-medical-products/',
   'industry_press', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Oct 2024 presidential decree: 120,000-plant / 5,000sqm annual national cultivation quota for pharma API use'),
  ('Coherent Market Insights -- Turkey Medical Cannabis Market Forecast 2026-2033',
   'https://www.coherentmarketinsights.com/industry-reports/turkey-medical-cannabis-market',
   'market_research', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'USD 140.7M (2025) to USD 430.2M (2032) market forecast; also references a 2025 Curaleaf operating license'),
  ('Wikipedia -- Cannabis in Turkey',
   'https://en.wikipedia.org/wiki/Cannabis_in_Turkey',
   'reference', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Background on the 2016 Sativex approval pathway and 19-province hemp cultivation history'),

  ('Invest North Macedonia -- Pharmaceuticals and Medical Devices',
   'https://investnorthmacedonia.gov.mk/invest-pharmaceuticals/',
   'government_official', 1, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Official government investment-promotion page; cultivation facility and licensing requirements'),
  ('CMS Expert Guides -- Cannabis law and legislation in North Macedonia',
   'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/north-macedonia',
   'legal_analysis', 1, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Statutory basis (Law on Control of Narcotic Drugs and Psychotropic Substances); penalty range 6mo-10yr'),
  ('Lalicic & Partners Law Firm -- Medical Cannabis in North Macedonia',
   'https://lblaw.com.mk/en/medical-cannabis-in-north-macedonia/',
   'legal_analysis', 2, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'EUR 300,000 bank guarantee requirement and full cultivation-application document checklist'),
  ('Cannabusinessplans.com -- Cannabis Market in North Macedonia',
   'https://cannabusinessplans.com/cannabis-market-macedonia/',
   'industry_press', 2, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '2025 Germany export volume (5,765kg) and approximate 100-licensed-processor figure'),
  ('Cannavigia -- Cannabis Compliance in North Macedonia',
   'https://www.cannavigia.com/blog-posts/cannabis-country-report-north-macedonia-background-info-how-to-checklist-free-licensing-guide',
   'industry_press', 2, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'GMP non-recognition bottleneck and MAKKANABIS trade-association context; 2022 Strumica seizure'),

  ('The Namibian -- High Court judge wants cannabis legalisation issues trimmed',
   'https://www.namibian.com.na/high-court-judge-wants-cannabis-legalisation-issues-trimmed/',
   'news', 1, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Most current status (Mar 2026) of the GUN/RUF constitutional case and the state''s LRDC-review defense'),
  ('MMJ Daily -- Namibia does not want to let courts rule on cannabis policy',
   'https://www.mmjdaily.com/article/9834450/namibia-doesn-t-want-to-let-courts-rule-on-cannabis-policy/',
   'industry_press', 2, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Confirms the May 5-8 2026 special-plea hearing date'),
  ('Hemp Today -- Namibia''s hemp future depends on dismantling cannabis prohibition, advocates urge',
   'https://hemptoday.net/namibias-hemp-future-depends-on-dismantling-cannabis-prohibition-advocates-urge/',
   'industry_press', 2, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'June 2025 joint CHAN/GUN/RUF/Medical Marijuana Association of Namibia submission to the Ministry of Justice'),
  ('Leafwell -- Is Marijuana Legal in Namibia?',
   'https://leafwell.com/blog/is-marijuana-legal-in-namibia',
   'legal_analysis', 2, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   '2006 Combating of the Abuse of Drugs Bill penalty figures (N$500,000 / up to 40yr)'),

  ('Herb -- How to Buy Weed in Kenya: Nairobi, Mombasa & East Africa''s Cannabis Scene',
   'https://herb.co/city-guides/buy-weed-kenya',
   'industry_press', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'monthly', 'active', true, true,
   'April 2026 synthesis: 2022 penalty-tier amendment figures, NACADA addiction-rate data, regional comparison'),
  ('Cannabis Law Report -- Kenya Rastafarian Use of Bhang Case',
   'https://cannabislaw.report/kenya-rastafarian-use-of-bhang-case-hear-nov-2025-thru-jan-2026-court-videos-testimonies-come-online/',
   'legal_analysis', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'RSK v. State case background and the February 2026 evidentiary ruling'),
  ('Switch News -- Kenya''s Rastafarians Await Landmark Court Ruling on Cannabis Rights',
   'https://news.switchtv.ke/2026/07/kenyas-rastafarians-await-landmark-court-ruling-on-cannabis-rights/',
   'news', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Most current confirmation (early Jul 2026) that judgment has shifted again, now expected 15 Jul 2026'),
  ('Wikipedia -- Cannabis in Kenya',
   'https://en.wikipedia.org/wiki/Cannabis_in_Kenya',
   'reference', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Statutory and historical background, the 1994 Act, UNODC cultivation-hub data')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.jurisdiction_playbooks
  (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
   legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed, last_verified_at)
VALUES
(
  'TR', 'Turkiye', 'high', 18,
  'No standardized public fee schedule identified; national cultivation is capped at a fixed 120,000-plant / 5,000 sqm annual quota reserved for pharmaceutical API production, so the binding constraint is licensed capacity rather than budget',
  'Turkiye legalized regulated, pharmacy-only sale of low-THC (under 0.3%) medical cannabis products under a health-law package ("Amendments to Certain Health-Related Laws and Decree Law No. 663") passed by Parliament in mid-2025, ending a regime that since 2016 had permitted only sublingual cannabinoid sprays such as Sativex via a specialist-issued "red prescription." Under the new law, the Ministry of Agriculture and Forestry oversees cultivation and harvesting while the Ministry of Health controls processing, licensing, export and pharmacy sales, with every unit tracked through an electronic monitoring system; products are dispensed exclusively through licensed pharmacies on prescription, and officials (including AK Party deputy group chair Leyla Sahin Usta) have been explicit that the law does not open any recreational pathway. Implementing detail followed in the Regulation on Cultivation and Control of Cannabis and the Regulation on Products Derived from Cannabis, both published in the Official Gazette on 31 January 2026 -- meaning the operational rulebook is only months old at time of review. Separately, an October 2024 presidential decree fixed a national annual hemp cultivation quota of 120,000 plants across 5,000 sqm exclusively for pharmaceutical active-ingredient production, administered by the Ministry of Agriculture and Forestry, with universities and permitted research institutes exempted from the cap for R&D. A global medical-cannabis industry report notes Curaleaf was awarded an operating license in Turkiye''s nascent medical market in 2025, among the first such licenses issued. Outside this narrow pharma channel, Turkiye maintains one of the strictest cannabis regimes in the region: whole-plant cannabis is a Schedule I substance under the Turkish Penal Code, and 2023 amendments raised the minimum mandatory sentence for possession of up to 5 grams from six months to one year, with tiered fines and vigorous, undifferentiated enforcement against citizens and tourists alike at borders and in major cities. Industrial hemp cultivation for fiber, textile and construction use is a separate, older track: legalized in 19 of Turkiye''s 81 provinces since 2016 under Ministry of Agriculture and Forestry permits (maximum three-year validity, extendable to other provinces with permission). CBD sits in an unsettled middle position -- one consumer-facing source cites a 0.2% THC administrative tolerance, but no personal-import or general retail-CBD exemption is published, and pharmacy-channel cannabinoid medicines are regulated as medicines, not consumer goods.',
  '[
    {"step": "Distinguish the pharmacy-only medical channel from all other cannabis activity", "detail": "Patient access runs exclusively through Ministry of Health-licensed pharmacies on physician prescription; there is no dispensary, retail, or personal-cultivation model, and whole-plant cannabis outside this channel remains a Schedule I criminal matter"},
    {"step": "Apply for cultivation-quota allocation through the Ministry of Agriculture and Forestry", "detail": "National hemp cultivation for pharmaceutical API use is capped at 120,000 plants / 5,000 sqm per year under an October 2024 presidential decree; universities and permitted research institutes are exempted from the cap for R&D purposes"},
    {"step": "Verify current procedural detail directly with regulators", "detail": "The two implementing regulations (Cultivation and Control of Cannabis; Products Derived from Cannabis) were only published in the Official Gazette on 31 January 2026, so application forms, timelines, and fee schedules should be confirmed directly rather than assumed from the primary law alone"},
    {"step": "Build for electronic traceability from day one", "detail": "All licensed product must be logged through the Ministry of Health''s electronic monitoring system across cultivation, processing, and pharmacy dispensing"},
    {"step": "Treat industrial hemp-for-fiber licensing (19 of 81 provinces, Ministry of Agriculture, 3-year permits) as a wholly separate regime from the 2025 medical-pharma law", "detail": "The two tracks have different regulators, purposes, and product scopes; conflating them risks applying under the wrong framework"}
  ]'::jsonb,
  '["Ministry of Health -- processing, licensing, pharmacy distribution and prescription oversight", "Ministry of Agriculture and Forestry -- cultivation quota, harvesting and industrial hemp permits", "Turkish Medicines and Medical Devices Agency -- clinical trials and product registration"]'::jsonb,
  ARRAY[
    'Assuming the 2025 law created any recreational or general retail opening -- officials have explicitly and repeatedly stated it does not, and whole-plant cannabis remains a Schedule I substance with 2023-enhanced minimum sentences enforced against citizens and tourists alike',
    'Assuming the 120,000-plant / 5,000 sqm national cultivation quota is expandable per-operator on request -- it is a fixed national ceiling reserved for pharmaceutical API production, meaning realistic near-term supply capacity is small and any licensing process is likely to be competitive',
    'Treating the January 2026 implementing regulations as a mature, precedent-tested framework -- they are only months old at time of review, and the Curaleaf 2025 license is among the first issued, so procedural precedent remains thin'
  ],
  'published',
  'medium-high -- the underlying 2025 law and its 2025 first-license issuance are corroborated across Daily Sabah, Ganjapreneur, Business of Cannabis, and a global medical-cannabis industry report; the 31 January 2026 implementing-regulation date traces to a single legal-industry blog and should be verified against the Official Gazette directly; two independent market-forecast providers (Coherent Market Insights vs. Statista) give materially different market-size estimates for the same market, flagged rather than silently resolved',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.dailysabah.com/politics/legislation/new-cannabis-law-to-boost-pain-relief-turkiyes-competitiveness'),
  CURRENT_DATE, now()
),
(
  'MK', 'North Macedonia', 'moderate', 12,
  'A EUR 300,000 bank guarantee (MKD-equivalent) is a documented application requirement, and licensed cultivators must additionally commit a share of net annual profit (10-20% depending on source) to the state budget; beyond these fixed items, published fee schedules are otherwise sparse, and the largest real cost driver is GMP re-certification, since EU markets do not recognize Macedonian-issued GMP certificates and licensees must separately contract foreign GMP auditors',
  'North Macedonia legalized medical cannabis cultivation on 9 February 2016 through amendments to the Law on Control of Narcotic Drugs and Psychotropic Substances, and has since operated one of Europe''s few genuinely free-market cannabis regimes: private companies, not a state monopoly, cultivate and export, a structure the government has explicitly modeled on Canada. Cultivation requires prior consent from the Government of the Republic of North Macedonia, after which the Ministry of Health issues a cultivation approval within 30 days; the licensed entity must then separately obtain a sowing/planting approval from the Ministry of Agriculture, Forestry and Water Economy (MAFWE) within 15 days, before any planting begins. Facility requirements are strict and security-driven: a minimum four-metre perimeter fence topped with barbed wire and fronted with coiled razor wire, 24-hour video surveillance of the entire site, and mandatory staffing including a pharmacist with at least three years'' experience and an agronomist with at least three years'' experience. A 2021 amendment to the law, undertaken to better align with EU conventions, extended export authorization to include dried flower (previously only finished extracts, oils and similar processed products could be exported); export permits are issued by the Agency for Medicines and Medical Devices (AMMD) and are valid for three months. The sector has scaled meaningfully: as of 2025 approximately 100 companies were licensed to process cannabis, and North Macedonia exported 5,765 kg of cannabis to Germany across the first three quarters of 2025 alone -- up 116% from 2,666 kg over the same period in 2024 -- placing it fourth among Germany''s cannabis import sources behind only Canada, Portugal and Denmark. However, licensing has not been friction-free: of roughly 67 cultivation licenses granted between 2016 and 2022, 35 had lapsed or been invalidated by the most recent reporting, and in 2022 police seized approximately 1.5 tons of undeclared marijuana from a licensed company in Strumica, illustrating real compliance and enforcement exposure inside the legal framework. The trade association MAKKANABIS, formed in 2020, has specifically flagged that Macedonian-issued GMP certificates are not recognized in the EU, forcing exporters into a separate, slow and costly foreign GMP re-certification process -- widely cited as the sector''s central operational bottleneck -- and has also lobbied (without success to date) for a single dedicated cannabis regulatory agency to replace the current split between the Ministry of Health and Ministry of Agriculture. Recreational use remains fully illegal, punishable under the Macedonian Criminal Code by 6 months to 10 years'' imprisonment. CBD and low-THC products (0.2% THC or below) may be sold without prescription; products above that threshold require a physician''s prescription, with prescribing reportedly limited to specific conditions such as certain cancers, epilepsy, HIV and multiple sclerosis.',
  '[
    {"step": "Assemble a compliant legal entity, facility plan and security arrangement", "detail": "Requirements include Central Register proof of registration, proof of ownership or lease of the cultivation site, a physical security plan or contract with a licensed security company, and a formal cultivation study/plan"},
    {"step": "Secure the EUR 300,000 bank guarantee and profit-share commitment", "detail": "A bank guarantee in MKD-equivalent and a formal commitment to remit a share of net annual profit (sources give 10-20%) to the state budget are documented application components"},
    {"step": "Obtain Government of North Macedonia consent, then Ministry of Health cultivation approval", "detail": "The Ministry of Health issues its approval within 30 days of receiving the Government''s prior consent"},
    {"step": "Obtain the separate Ministry of Agriculture, Forestry and Water Economy (MAFWE) sowing/planting approval", "detail": "Required before any planting begins; issued within 15 days of application, and cannot be skipped even after Ministry of Health approval is granted"},
    {"step": "Plan for the GMP-recognition bottleneck from the outset", "detail": "EU markets do not recognize Macedonian-issued GMP certificates, so any operator planning to export finished extracts or oils into the EU must separately budget for foreign GMP re-certification -- flagged by MAKKANABIS as the sector''s central obstacle"},
    {"step": "Underwrite for high license attrition when modeling the opportunity", "detail": "Of the roughly 67 cultivation licenses issued between 2016 and 2022, 35 had lapsed by the most recent reporting -- licensing alone does not guarantee a durable operation"}
  ]'::jsonb,
  '["Ministry of Health -- cultivation, processing and extraction licensing", "Ministry of Agriculture, Forestry and Water Economy (MAFWE) -- sowing/planting approval", "Government of the Republic of North Macedonia -- prior consent required for every cultivation license", "Agency for Medicines and Medical Devices (AMMD) -- export permits"]'::jsonb,
  ARRAY[
    'Underestimating the GMP-recognition gap -- a Macedonian GMP certificate is not accepted in the EU, so any export-oriented operator must budget separately, and substantially, for foreign GMP re-certification, which the industry association MAKKANABIS identifies as the sector''s central bottleneck',
    'Treating a Ministry of Health cultivation approval as sufficient on its own -- a separate MAFWE sowing/planting approval is mandatory before planting, and the Government-consent, Ministry of Health, and MAFWE steps must be sequenced correctly and in order',
    'Assuming license issuance guarantees a durable business -- roughly half of the cultivation licenses granted in the sector''s first six years (2016-2022) had lapsed by the most recent reporting, and a licensed company was subject to a 1.5-ton undeclared-cannabis seizure in 2022, underscoring real compliance and enforcement risk even within the legal framework'
  ],
  'published',
  'high -- the licensing framework, facility requirements and free-market structure are consistently corroborated across CMS Expert Guides, a North Macedonian law firm (Lalicic & Partners), the government''s own Invest North Macedonia investment-promotion site, and multiple industry sources (Cannavigia, Cannabusinessplans.com); the profit-share percentage shows an unresolved 10% vs. 20% conflict across sources and is flagged rather than silently resolved; 2025 export-volume figures are corroborated via reporting on German import statistics',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://investnorthmacedonia.gov.mk/invest-pharmaceuticals/'),
  CURRENT_DATE, now()
),
(
  'NA', 'Namibia', 'very_high', 0,
  'Not applicable -- no legal pathway exists for cultivation, processing, sale, or medical use of cannabis in any form',
  'Namibia maintains full prohibition of cannabis for both recreational and medical use under the apartheid-era Abuse of Dependence-Producing Substances and Rehabilitation Centres Act, No. 41 of 1971 (inherited from South African colonial administration) as supplemented by the 2006 Combating of the Abuse of Drugs Bill. No legal medical, industrial-hemp, or adult-use pathway exists in current law, and the Ministry of Health and Social Services has explicitly and formally rejected proposals for commercial medical cannabis cultivation, most recently in June 2024. That said, two genuinely live and unresolved reform channels are worth active monitoring rather than being treated as settled: first, a coalition of advocacy groups (the Cannabis and Hemp Association of Namibia, Ganja Users of Namibia, the Medical Marijuana Association of Namibia, and the Rastafari United Front) submitted a fresh joint decriminalization and hemp-legalization proposal to the Ministry of Justice and Labour Relations in June 2025, in direct response to a government call for public input on "obsolete and discriminatory legislation"; second, a constitutional challenge filed in August 2021 by Ganja Users of Namibia president Brian Jaftha and secretary-general Borro Ndungula, seeking to have the cannabis prohibition declared unconstitutional and struck from the 1971 Act, remains active in the Windhoek High Court. The government''s defense in that case has consistently argued the matter is premature because the Law Reform and Development Commission (LRDC) is separately conducting its own review of Namibia''s cannabis laws, and that reform is properly a legislative rather than judicial matter; a special-plea hearing on that jurisdictional question was scheduled for 5-8 May 2026, and no publicly reported outcome had been located as of this review -- this is a genuinely unresolved, live case rather than a settled one. Penalty figures conflict materially across sources: reported maximum fines range from roughly N$200,000 (about $14,000) to N$500,000 (about $27,000), and reported maximum imprisonment terms range from 20 to 40 years depending on the specific source and offense category (simple possession vs. cultivation vs. dealing); any single cited figure should be treated as indicative rather than definitive pending confirmation of the exact charge against the current statute. Cannabis (locally "dagga") is reported as the most commonly used illicit drug in the country, and Namibia is a documented regional trafficking transit point. CBD carries no express legal carve-out and is generally treated as illegal by extension of the general cannabis prohibition, notwithstanding its growing commercial availability elsewhere.',
  '[]'::jsonb,
  '["Ministry of Health and Social Services -- has explicitly declined proposals for medical cannabis licensing, most recently in June 2024", "Namibian Police Force (NAMPOL) and the Office of the Prosecutor-General -- enforcement of the 1971 Act", "Law Reform and Development Commission (LRDC) -- conducting an official review of Namibia''s cannabis laws, cited by the government as the appropriate reform channel rather than the courts"]'::jsonb,
  ARRAY[
    'Assuming the active High Court constitutional challenge or the June 2025 advocacy submission to the Ministry of Justice signals imminent legal change -- both are live, unresolved processes; the government has consistently resisted judicial intervention on the merits, arguing reform is a legislative/LRDC matter, and no resolution timeline is confirmed',
    'Treating any single cited penalty figure (fine amount or maximum sentence) as authoritative -- available sources conflict materially on both dimensions (N$200,000 vs. N$500,000; 20 years vs. 40 years); confirm the specific statute and offense category with Namibian counsel before relying on any number',
    'Assuming CBD or hemp-derived products carry any distinct legal status in Namibia -- no such carve-out exists; CBD is treated as illegal by extension of the general cannabis prohibition'
  ],
  'published',
  'high on the core prohibition status (corroborated across Wikipedia, Leafwell, Accomplit, and The Namibian''s ongoing court coverage), medium on specific penalty figures (fine and maximum-sentence figures conflict materially across sources), and explicitly unresolved on litigation outcome -- the GUN/RUF constitutional case and the LRDC legislative review were both still pending as of the most recent reporting located, with a special-plea hearing scheduled for May 2026 and no confirmed result found',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.namibian.com.na/high-court-judge-wants-cannabis-legalisation-issues-trimmed/'),
  CURRENT_DATE, now()
),
(
  'KE', 'Kenya', 'high', 0,
  'Not applicable for commercial cultivation, processing, or sale -- no operational licensing pathway exists; the Narcotic Drugs and Psychotropic Substances (Control) Act, 1994 nominally provides for medical and scientific use, but no functioning license-issuance process for that carve-out was identified in available sources',
  'Cannabis (locally "bhang") is illegal in Kenya under the Narcotic Drugs and Psychotropic Substances (Control) Act, 1994 (Cap 245), Kenya''s primary drug law, which replaced the 1933 colonial-era Dangerous Drugs Act. NACADA (the National Authority for the Campaign Against Alcohol and Drug Abuse) has repeatedly and publicly reaffirmed that recreational and commercial cannabis trade remain prohibited notwithstanding periodic political reform calls; the Act nominally provides for medical and scientific use, but no operational commercial licensing pathway for that provision was identified in available sources. A significant 2022 amendment introduced quantity-based, tiered penalties distinguishing personal-use possession from trafficking by weight: under the current framework, possession for personal consumption carries up to 5 years'' imprisonment or a fine of up to KSh 100,000 (roughly $770) -- a substantial reduction from the pre-amendment regime, under which simple possession could draw a minimum 10-year term and cultivation or dealing could draw 20 years to life plus fines of KSh 1 million or three times market value. Kenya has seen a decade of stalled reform attempts: the late Kibra MP Ken Okoth''s 2018 Marijuana Control Bill never advanced, and 2022 presidential candidate George Wajackoyah (Roots Party), who made legalization the centerpiece of his campaign, announced in February 2026 that he intends to run again in the 2027 presidential election on the same platform. The most consequential live development is a religious-freedom constitutional case: the Rastafari Society of Kenya has litigated since 2021 before Justice Bahati Mwamuye at the Milimani Law Courts to have cannabis use for sacramental worship exempted from Sections 3, 5 and 6 of the 1994 Act. The case has been repeatedly adjourned -- judgment dates were successively set for 12 March, then 27/28 May, and as of the most recent reporting located (early July 2026) had shifted again to 15 July 2026 -- with no ruling found as of this review; this is a live, closely watched, genuinely unresolved case, and even a favorable outcome would establish only a narrow religious-worship exemption, not broad legalization. NACADA reports that cannabis use rose roughly 90% over five years and that 47.4% of current cannabis users in its surveys met its criteria for problematic use ("addiction"). Regionally, Kenya sits in a fast-shifting landscape: Uganda issued its first experimental medicinal cannabis license in July 2025, Rwanda has operated a licensed medical framework since a 2021 ministerial order, and Ghana launched a licensed medicinal/industrial program in February 2026, while Kenya and Tanzania remain the region''s more restrictive holdouts. CBD is not legally distinguished from THC-containing cannabis under current Kenyan law.',
  '[]'::jsonb,
  '["National Authority for the Campaign Against Alcohol and Drug Abuse (NACADA) -- primary enforcement-messaging and drug-policy body, has repeatedly reaffirmed prohibition", "Directorate of Criminal Investigations and the Kenya Police Service -- enforcement", "Judiciary (Milimani Law Courts) -- actively adjudicating the pending Rastafari Society of Kenya constitutional/religious-freedom case"]'::jsonb,
  ARRAY[
    'Assuming the 1994 Act''s nominal medical/scientific use provision means a functioning medical cannabis program exists -- no operational licensing pathway for that carve-out was identified in available sources; treat Kenya as fully prohibited in practice',
    'Treating the pending Rastafari Society of Kenya case as a broad legalization proceeding -- even a favorable ruling (most recently expected around 15 July 2026, though the date has already shifted three times) would establish a narrow religious-worship exemption only, not commercial or general recreational legality',
    'Citing pre-2022 penalty figures (minimum 10-year terms, life imprisonment for dealing) as current law -- the 2022 amendment introduced materially lower, quantity-tiered penalties specifically for personal-use possession; confirm which offense category and which version of the law applies before relying on any single penalty figure'
  ],
  'published',
  'high on the core prohibition status and the 2022 penalty-tier amendment (corroborated across Herb''s April 2026 reporting, Leafwell, Wikipedia, and NACADA''s own public statements); the Rastafari Society case timeline is well-documented across multiple 2025-2026 Kenyan news sources (Nation, The Star, Capital News, Cannabis Law Report) but its outcome is explicitly unresolved as of this review, and the judgment date has already shifted three times, so it should not be treated as settled',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-kenya'),
  CURRENT_DATE, now()
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  difficulty = EXCLUDED.difficulty,
  typical_timeline_months = EXCLUDED.typical_timeline_months,
  estimated_cost_range = EXCLUDED.estimated_cost_range,
  legal_framework_summary = EXCLUDED.legal_framework_summary,
  steps = EXCLUDED.steps,
  key_regulators = EXCLUDED.key_regulators,
  common_pitfalls = EXCLUDED.common_pitfalls,
  status = EXCLUDED.status,
  confidence_label = EXCLUDED.confidence_label,
  source_id = EXCLUDED.source_id,
  last_reviewed = EXCLUDED.last_reviewed,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO public.market_metrics
  (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('TR', 'medical_cannabis_market_value_2025', 140700000, 'USD', '2025-01-01', '2025-12-31', 'annual', 'estimated', 'medium',
   'Coherent Market Insights -- Turkey Medical Cannabis Market Forecast 2026-2033',
   'https://www.coherentmarketinsights.com/industry-reports/turkey-medical-cannabis-market', '2026-01-01',
   'Projects growth to USD 430.2M by 2032 (16.5% CAGR); a separate Statista forecast gives a materially lower USD 58.64M figure for 2024, an unresolved cross-provider discrepancy typical of very new, thinly-covered markets'),
  ('TR', 'annual_hemp_cultivation_quota_2025', 120000, 'plants', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high',
   'International CBC -- Turkey Sets Hemp Quota For Medical Products',
   'https://internationalcbc.com/turkey-sets-hemp-quota-for-medical-products/', '2024-11-04',
   'Fixed national ceiling (also expressed as 5,000 sqm) set by an October 2024 presidential decree, reserved exclusively for pharmaceutical active-ingredient production; universities and permitted research institutes are exempt from the cap'),
  ('TR', 'industrial_hemp_licensed_provinces', 19, 'provinces', '2016-01-01', '2016-12-31', 'point_in_time', 'observed', 'high',
   'Wikipedia -- Cannabis in Turkey', 'https://en.wikipedia.org/wiki/Cannabis_in_Turkey', '2026-03-11',
   'Of Turkiye''s 81 provinces, 19 have been licensed for industrial/medical hemp cultivation since 2016, corroborated by Sensi Seeds and Business of Cannabis reporting'),

  ('MK', 'cannabis_exports_to_germany_2025_ytd_q3', 5765, 'kg', '2025-01-01', '2025-09-30', 'point_in_time', 'observed', 'high',
   'Cannabusinessplans.com -- Cannabis Market in North Macedonia',
   'https://cannabusinessplans.com/cannabis-market-macedonia/', '2025-12-01',
   'Up 116% from 2,666 kg over the same Jan-Sep period in 2024; ranks North Macedonia fourth among Germany''s cannabis import sources, behind Canada, Portugal and Denmark'),
  ('MK', 'licensed_cannabis_processing_companies_2025', 100, 'companies', '2025-01-01', '2025-12-31', 'point_in_time', 'estimated', 'medium',
   'Cannabusinessplans.com -- Cannabis Market in North Macedonia',
   'https://cannabusinessplans.com/cannabis-market-macedonia/', '2025-12-01',
   'Approximate figure; of the roughly 67 cultivation licenses issued 2016-2022, 35 had lapsed by the most recent reporting, indicating meaningful churn beneath the headline count'),
  ('MK', 'cultivation_license_bank_guarantee_requirement', 300000, 'EUR', '2025-01-01', '2025-12-31', 'point_in_time', 'observed', 'high',
   'Lalicic & Partners Law Firm -- Medical Cannabis in North Macedonia',
   'https://lblaw.com.mk/en/medical-cannabis-in-north-macedonia/', '2025-04-01',
   'Bank guarantee (MKD-equivalent) required as part of the cultivation-license application; sources conflict on whether the associated state profit-share is 10% or 20% of net annual profit'),

  ('NA', 'annual_cannabis_use_prevalence_rate', 3.9, 'percent', '2000-01-01', '2000-12-31', 'point_in_time', 'observed', 'low',
   'UNODC (via Leafwell and Wikipedia)', 'https://en.wikipedia.org/wiki/Cannabis_in_Namibia', '2011-01-01',
   'Figure originates from year-2000 data reported in a 2011 UNODC report; no more recent official prevalence estimate was located, so treat as dated background context rather than a current figure'),
  ('NA', 'maximum_cultivation_fine_2006_bill', 500000, 'NAD', '2006-01-01', '2006-12-31', 'point_in_time', 'observed', 'medium',
   'Leafwell -- Is Marijuana Legal in Namibia?', 'https://leafwell.com/blog/is-marijuana-legal-in-namibia', '2025-10-03',
   'Per the 2006 Combating of the Abuse of Drugs Bill (cultivation offense, paired with up to 40 years'' imprisonment in the same source); other sources cite a lower N$200,000 fine and a 20-year maximum term for the underlying 1971 Act -- an unresolved cross-source conflict, flagged rather than resolved'),

  ('KE', 'personal_possession_max_fine_2022_amendment', 100000, 'KES', '2022-01-01', '2026-12-31', 'annual', 'observed', 'high',
   'Herb -- How to Buy Weed in Kenya', 'https://herb.co/city-guides/buy-weed-kenya', '2026-04-01',
   'Maximum fine for personal-consumption possession under the 2022 quantity-tiered amendment to the Narcotic Drugs and Psychotropic Substances (Control) Act, 1994; paired with up to 5 years'' imprisonment as an alternative or concurrent penalty'),
  ('KE', 'cannabis_use_disorder_rate_among_users', 47.4, 'percent', '2025-01-01', '2026-04-01', 'point_in_time', 'observed', 'medium',
   'NACADA (via Herb -- How to Buy Weed in Kenya)', 'https://herb.co/city-guides/buy-weed-kenya', '2026-04-01',
   'Share of current cannabis users classified by NACADA surveys as meeting its criteria for problematic/addictive use; methodology not independently verified'),
  ('KE', 'five_year_cannabis_use_increase', 90, 'percent', '2021-01-01', '2026-04-01', 'point_in_time', 'observed', 'medium',
   'NACADA (via Herb -- How to Buy Weed in Kenya)', 'https://herb.co/city-guides/buy-weed-kenya', '2026-04-01',
   'Reported increase in cannabis use over a five-year window per NACADA; underlying survey methodology not independently verified')
ON CONFLICT (country_iso2, metric_name, period_start, period_end) DO NOTHING;

INSERT INTO public.country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('TR', 'market-access-strategy', 'investor_operator',
   '["Turkiye legalized pharmacy-only, prescription-based sale of low-THC (under 0.3%) medical cannabis products in mid-2025 -- there is no retail, dispensary, or recreational pathway", "National cultivation is capped at a fixed 120,000-plant / 5,000 sqm annual quota reserved for pharmaceutical active-ingredient production, set by an October 2024 presidential decree", "Implementing regulations were only published in the Official Gazette on 31 January 2026, so the operational rulebook is still very new", "Curaleaf was awarded an operating license in 2025, among the first issued under the new framework"]'::jsonb,
   'Read the Turkiye jurisdiction playbook before assuming any retail or cultivation-capacity opportunity',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.dailysabah.com/politics/legislation/new-cannabis-law-to-boost-pain-relief-turkiyes-competitiveness')],
   'verified_secondary_source'),

  ('MK', 'licence-class-guide', 'cultivator_producer',
   '["North Macedonia has operated a free-market medical cannabis cultivation and export regime since February 2016 -- private companies, not a state monopoly, hold licenses", "A EUR 300,000 bank guarantee and a share of net annual profit (10-20% depending on source) to the state budget are documented licensing requirements", "Cultivation requires sequential approval: Government of North Macedonia consent, then Ministry of Health approval (30 days), then a separate Ministry of Agriculture sowing/planting approval (15 days)", "The sector''s central operational bottleneck is that EU markets do not recognize Macedonian-issued GMP certificates, forcing exporters into costly foreign re-certification", "Roughly half of cultivation licenses issued 2016-2022 had lapsed by the most recent reporting -- licensing alone does not guarantee a durable operation"]'::jsonb,
   'Read the North Macedonia jurisdiction playbook before budgeting a cultivation or export license application',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://investnorthmacedonia.gov.mk/invest-pharmaceuticals/')],
   'verified_secondary_source'),

  ('NA', 'prohibition-risk-map', 'general',
   '["Namibia maintains full prohibition of cannabis for both recreational and medical use under an apartheid-era 1971 Act -- there is no legal pathway of any kind", "The Ministry of Health and Social Services has explicitly rejected commercial medical cannabis cultivation proposals, most recently in June 2024", "A constitutional challenge to the prohibition has been active in the Windhoek High Court since 2021 and remains unresolved, with a special-plea hearing held in May 2026 and no confirmed outcome located", "A coalition of advocacy groups submitted a fresh decriminalization proposal to the Ministry of Justice in June 2025 -- a live policy-review channel, not yet law", "Reported penalty figures conflict materially across sources (N$200,000-N$500,000 fines; 20-40 year maximum terms) -- do not rely on a single cited figure"]'::jsonb,
   'Read the Namibia jurisdiction playbook -- full prohibition with live, unresolved litigation to monitor',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.namibian.com.na/high-court-judge-wants-cannabis-legalisation-issues-trimmed/')],
   'verified_secondary_source'),

  ('KE', 'prohibition-risk-map', 'general',
   '["Cannabis remains fully illegal in Kenya under the 1994 Narcotic Drugs and Psychotropic Substances (Control) Act, with no operational medical or commercial licensing pathway despite a nominal statutory carve-out", "A 2022 amendment substantially reduced personal-use possession penalties (now up to 5 years / KSh 100,000 fine) compared to the pre-amendment regime", "The Rastafari Society of Kenya has an active religious-freedom case before the High Court seeking a narrow sacramental-use exemption -- judgment has been repeatedly postponed and was most recently expected 15 July 2026, with no ruling confirmed as of this review", "Even a favorable ruling in that case would not create any commercial or broad recreational legality", "Regional neighbors (Uganda, Rwanda, Ghana) have moved to licensed medical frameworks in 2025-2026, leaving Kenya and Tanzania as regional holdouts"]'::jsonb,
   'Read the Kenya jurisdiction playbook -- monitor the pending Rastafarian case but do not treat it as a legalization proceeding',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-kenya')],
   'verified_secondary_source')
ON CONFLICT (country_iso2, module_key, role_id) DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('TR','MK','NA','KE');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711030217','batch_11_playbooks_metrics_overlay_tr_mk_na_ke','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711030217_batch_11_playbooks_metrics_overlay_tr_mk_na_ke.sql

-- RECOVERY BEGIN 20260711095614_tighten_anon_grants_on_org_scoped_views.sql
revoke select on api.cc_org_pathway_progress from anon;
revoke select on api.cc_org_requirement_status from anon;
revoke select on api.cc_watch_rules from anon;
revoke select on api.cc_watchlist_items from anon;
revoke select on api.deal_room_messages from anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711095614','tighten_anon_grants_on_org_scoped_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711095614_tighten_anon_grants_on_org_scoped_views.sql

-- RECOVERY BEGIN 20260711095637_tighten_anon_grant_hv_evidence_documents.sql
revoke select on api.hv_evidence_documents from anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711095637','tighten_anon_grant_hv_evidence_documents','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711095637_tighten_anon_grant_hv_evidence_documents.sql

-- RECOVERY BEGIN 20260711100000_jurisdiction_playbooks_batch21a_sources.sql
-- Sources for jurisdiction_playbooks batch 21 (part A of B, see batch21b for
-- playbook content + market metrics). Split across two files due to payload size.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Cannabiz Africa / Cannabis Law Report — Lesotho Completely Overhauls Cannabis Oversight', 'https://cannabislaw.report/cannabiz-africa-report-lesotho-completely-overhauls-cannabis-oversight-with-new-regulations-expected-soon/', 'Lesotho', 'LS', 'Africa', 1, 'html_snapshot', 'monthly', 'news', 'May 2026: LeMeRA + Lesotho Narcotics Bureau formed, new regulations gazetted Dec 2025, technical rules due Q2 2026/7 fiscal year, marketing authorization pathway confirmed'),
  ('GrowerIQ — Africa''s Cannabis Frontier: South Africa and Lesotho 2026', 'https://groweriq.ca/2026/06/23/africa-cannabis-frontier-south-africa-lesotho-2026/', 'Lesotho', 'LS', 'Africa', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Only 17 of 140 historical licences active at assessment, 1 of 33 licensees GMP-certified, structural export/testing bottlenecks documented, 1% outdoor THC limit'),
  ('PMC — Envisaging challenges for the emerging medicinal Cannabis sector in Lesotho', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11097424/', 'Lesotho', 'LS', 'Africa', 1, 'html_snapshot', 'annual', 'academic', 'Peer-reviewed academic study: 33 companies licensed, 8 registered, 1 GMP-certified, SMME exclusion critique, first licence issued 2017 (MG Health)'),
  ('Cannavigia — Cannabis Compliance in Lesotho Licensing Guide', 'https://www.cannavigia.com/blog-posts/cannabis-country-report-lesotho-how-to-get-a-license-how-to-export-products-abroad', 'Lesotho', 'LS', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '7 licence types, 0% corporate tax outside SACU / 10% within SADC, mandatory South Africa export routing, GMP compliance gap'),
  ('Lesotho National Development Corporation — Medicinal Cannabis Investment', 'https://lndc.org.ls/medicinal-cannabis/', 'Lesotho', 'LS', 'Africa', 1, 'html_snapshot', 'quarterly', 'government_release', 'Official investment promotion page: Drugs of Abuse (Cannabis) Regulations 2018 + 2025 Amendment, EU-GMP/USDA-APHIS/ISO-FSSC target certifications, VAT 15% domestic / 0% direct export'),
  ('Cannavigia — Cannabis Compliance in Malawi Licensing Guide', 'https://www.cannavigia.com/blog-posts/cannabis-country-report-malawi-how-to-get-a-cannabis-license', 'Malawi', 'MW', 'Africa', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'CRA licensing process, 21-day target turnaround, security-plan requirements distinct for industrial hemp vs medical cannabis, licences issued to companies/cooperatives only'),
  ('ICA Malawi — Industrial Hemp and Medical Cannabis FAQs', 'https://www.ica-malawi.org/faqs', 'Malawi', 'MW', 'Africa', 1, 'html_snapshot', 'quarterly', 'reference', 'CRA fee structure, 12-month initial licence validity, self-funded regulator via licence/infringement fees, Cannabis Act Feb 2020'),
  ('Sensi Seeds — Cannabis in Malawi Laws and History', 'https://sensiseeds.com/en/blog/countries/cannabis-in-malawi-laws-use-history/', 'Malawi', 'MW', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '86 licences issued to 35 companies since Nov 2020, recreational sale/distribution still illegal, Malawi Gold excluded from legal medical programme'),
  ('PMC — Medical cannabis and cannabidiol: A new harvest for Malawi', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9356517/', 'Malawi', 'MW', 'Africa', 1, 'html_snapshot', 'annual', 'academic', 'Cannabis Regulation Bill 2020 passed 28 Feb 2020, distinguishes marijuana/hemp/medical cannabis, 20+ years of advocacy history documented'),
  ('LegalClarity — Is Weed Legal in Ireland? Recreational vs Medical', 'https://legalclarity.org/is-weed-legal-in-ireland-a-look-at-the-current-laws/', 'Ireland', 'IE', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'National Drugs Strategy 2026-2029 health-diversion scheme, MCAP HSE reimbursement via community schemes, no legal THC tolerance in food except hemp seed products'),
  ('Herb.co — How to Buy Weed in Ireland in 2026', 'https://herb.co/city-guides/buy-weed-ireland', 'Ireland', 'IE', 'Europe', 2, 'html_snapshot', 'quarterly', 'news', 'April 2026 MCAP formal review launched (Prof. Shane Allwright), 2025 customs seizures ~EUR107M, Oireachtas Committee 59 decrim recommendations Oct 2024'),
  ('Cannigma — Ireland Marijuana Laws 2026', 'https://cannigma.com/regulation/ireland-marijuana-laws/', 'Ireland', 'IE', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'MCAP excludes flower/high-THC formulations and chronic pain, ministerial-approval route only 63 patients, 6-month consultant prescription cap'),
  ('An Garda Síochána — Is Cannabis Legal? Official Guidance', 'https://www.garda.ie/en/crime/drugs/is-cannabis-legal-.html', 'Ireland', 'IE', 'Europe', 1, 'html_snapshot', 'quarterly', 'government_release', 'Official police guidance: no cultivation licences issued for medical purposes historically, CBD not controlled under Misuse of Drugs legislation, THC edibles explicitly illegal'),
  ('Herb.co — How to Buy Weed in Grenada: 2026 Visitor Guide', 'https://herb.co/city-guides/buy-weed-grenada', 'Grenada', 'GD', 'Americas', 1, 'html_snapshot', 'quarterly', 'news', 'Drug Abuse (Prevention and Control) (Amendment) Act 2026 assented 13 Feb 2026, gazetted 20 Feb 2026, 56g/15g resin threshold, 4 plants per premises, no licensed retail yet'),
  ('International CBC — Grenada''s Parliament Approves Major Cannabis Legislation', 'https://internationalcbc.com/grenadas-parliament-approves-major-cannabis-legislation/', 'Grenada', 'GD', 'Americas', 1, 'html_snapshot', 'quarterly', 'news', 'Automatic expungement of minor offences, Rastafari sacramental use rights in registered places of worship, Health Minister confirms recreational commercial sale not permitted'),
  ('St. Martin News Network — Grenada Parliament Approves Landmark Cannabis Bill', 'https://smn-news.com/index.php/st-maarten-st-martin-news/49861-grenada-parliament-approves-landmark-cannabis-decriminalization-and-regulation-bill.html', 'Grenada', 'GD', 'Americas', 2, 'html_snapshot', 'quarterly', 'news', 'National cannabis policy framework confirmed in development, commercial focus strictly limited to medical/therapeutic sector, severe penalties retained for supply to minors'),
  ('NOW Grenada — Draft Bill and Policy Statement for Decriminalisation', 'https://nowgrenada.com/2026/01/draft-bill-and-policy-statement-for-the-decriminalisation-of-cannabis-in-grenada/', 'Grenada', 'GD', 'Americas', 1, 'html_snapshot', 'quarterly', 'government_release', 'Cannabis Legalisation and Regulation Secretariat draft bill/policy statement publication, tabled in Parliament 20 January 2026'),
  ('Caribbean Today — Grenada Parliament Approves Amendment to Marijuana Legislation', 'https://caribbeantoday.com/sections/politics/grenada-parliament-approves-amendment-to-marijuana-legislation', 'Grenada', 'GD', 'Americas', 2, 'html_snapshot', 'quarterly', 'news', 'Age threshold set at 21 (not 18) after parliamentary debate, PM Mitchell and AG Joseph direct quotes on bipartisan support and framing')
ON CONFLICT DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711100000','jurisdiction_playbooks_batch21a_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711100000_jurisdiction_playbooks_batch21a_sources.sql

-- RECOVERY BEGIN 20260711100100_jurisdiction_playbooks_batch21b_content.sql
-- Playbook content + market metrics for batch 21 (part B of B, see batch21a
-- for source_registry entries this migration references by source_url).

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'License fee thresholds have historically been high enough to exclude small and medium enterprises, per Cannavigia''s licensing guide; exact current fee schedule under the December 2025 regulations is not yet fully published pending Q2 2026/7 gazetting of implementing rules. Zero corporate tax on profits for manufacturing companies exporting outside SACU, 10% within SADC',
  legal_framework_summary = 'Lesotho was Africa''s cannabis pioneer, becoming the first African nation to license medical cannabis cultivation in 2017, but a decade later the sector remains structurally underdeveloped relative to its head start, and as of 2026 is in the middle of its most significant regulatory overhaul since founding. A peer-reviewed academic study (PMC, 2024) found that of 33 licensed cannabis companies at the time of research, only 8 were legally registered and just 1 held Good Manufacturing Practice (GMP) certification — the credential required to export into regulated markets like the EU. Independent 2026 reporting corroborates continued underperformance: of a reported 140+ licences issued across the sector''s history, only around 17 were active at one recent assessment, with roughly 5 farms reported as successfully operational. Structural bottlenecks include the absence of any accredited domestic testing laboratory (samples must be sent to South Africa at significant cost and delay), an export logistics requirement that routes all shipments through South Africa (Lesotho is landlocked, entirely surrounded by South Africa), and until recently the absence of marketing authorisation regulations, which blocked domestic dispensary development entirely. In response, Lesotho has in the past 10 months (as of May 2026 reporting) completely rebuilt its regulatory architecture: the Lesotho Medicines and Medical Devices Control Authority Act, 2023 has been operationalized, and two new bodies now govern the sector — the Lesotho Medicines Regulatory Authority (LeMeRA), modeled on South Africa''s SAHPRA and responsible for technical review of licence and import/export permit applications, and the Lesotho Narcotics Bureau (LNB), which handles vetting and final licensing decisions to ensure compliance with local and international (particularly INCB) reporting protocols. New licensing regulations were gazetted in December 2025, and further operational guidelines covering marketing authorisation, drug schedules, and clinical trial protocols are expected to be gazetted by the second quarter of the 2026/27 fiscal year. Notably, despite being the continent''s cannabis pioneer, Lesotho has still not legalized medical cannabis for consumption by its own domestic population — the entire framework is oriented toward high-quality medical cannabis production for export, primarily to the EU and UK, and LeMeRA''s own leadership has publicly acknowledged in a meeting with the INCB that this domestic-access gap remains an open policy question. Outdoor cultivation is capped at 1% THC. Three of the earliest five licensed companies were acquired in whole or part by major Canadian licensed producers (Aphria, Supreme Cannabis, Canopy Growth), signalling early international institutional interest even as domestic execution has lagged.',
  steps = '[{"step":"Confirm current LeMeRA/LNB operational status","detail":"Two new regulatory bodies were established within the last 10 months as of mid-2026 and the licensing/inspection framework is actively being rebuilt — confirm which guidelines are gazetted and operational versus still in draft before applying"},{"step":"Select from the license category structure","detail":"Historically 5-7 license types have existed spanning cultivation, processing, transport, retail, and distribution — confirm current categories under the new LeMeRA/LNB structure"},{"step":"Plan for South Africa-routed export logistics from day one","detail":"As a landlocked nation entirely surrounded by South Africa, all cannabis exports must be routed through South African ports and customs — factor this into supply chain planning and timeline expectations, as historical reporting indicates significant product has been stuck in warehouses awaiting paperwork"},{"step":"Budget for GMP certification as a distinct, non-trivial milestone","detail":"Historically only 1 of 33 licensed companies achieved GMP certification — treat this as a major compliance project requiring dedicated resources, not an automatic byproduct of holding a licence"},{"step":"Arrange third-country testing until domestic labs are accredited","detail":"No accredited domestic testing laboratory exists as of the most recent reporting; samples must be sent to South Africa, adding cost and time to every compliance cycle"}]'::jsonb,
  key_regulators = '["Lesotho Medicines Regulatory Authority (LeMeRA) — technical review of licence and import/export permit applications, modeled on South Africa''s SAHPRA","Lesotho Narcotics Bureau (LNB) — final licence vetting and decisions, local/international reporting compliance including INCB","Ministry of Health — historical licensing authority prior to LeMeRA/LNB establishment"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Lesotho''s decade of "first mover" history means mature operational infrastructure — independent assessments found only a small fraction of historically issued licences (around 17 of 140+) were active, and just 1 of 33 companies studied held GMP certification; treat this as an early-stage, still-being-rebuilt market despite the 2017 origin date',
    'Underestimating export logistics — Lesotho is landlocked and entirely surrounded by South Africa, so every export shipment depends on South African customs and port processes outside Lesotho''s direct control; budget realistic time and cost for this dependency',
    'Assuming licensed cultivation means domestic sale is possible — Lesotho has still not legalized cannabis for consumption by its own population; the entire legal framework is export-oriented, and this gap was recently acknowledged as unresolved by LeMeRA''s own leadership'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across a peer-reviewed academic study (PMC), an in-depth May 2026 industry analysis (GrowerIQ) citing named regulatory officials, dedicated Cannabiz Africa reporting on the LeMeRA/LNB overhaul, and Lesotho''s own national investment promotion agency (LNDC), all broadly consistent on licence counts, GMP certification numbers, and the recent institutional restructuring',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cannabislaw.report/cannabiz-africa-report-lesotho-completely-overhauls-cannabis-oversight-with-new-regulations-expected-soon/')
WHERE country_iso2 = 'LS';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 9,
  estimated_cost_range = 'Fee structure is set out in the Cannabis Act 2020 fee addendum (published by the Cannabis Regulatory Authority and the Industrial Crops Association); licenses run 12 months initially with renewal at the same fee, and the CRA is considering allowing 3- or 5-year renewal terms after the first 12-month cycle though this has not yet been gazetted. Licenses are issued only to companies or cooperatives with a registered off-taker, not individuals',
  legal_framework_summary = 'Malawi legalized industrial hemp and medical cannabis cultivation on 28 February 2020 via the Cannabis Regulation Act, becoming the eighth African country to do so, following over 20 years of advocacy that began with a 2016 parliamentary motion exploring cannabis as an alternative crop to tobacco (Malawi has historically had one of the world''s most tobacco-dependent economies, and tobacco export income has been declining under worldwide anti-tobacco policy pressure — tobacco output fell 31.3% in the 2020 season alone). The Act, drafted following successful industrial hemp cultivation trials at the Chitedze Agricultural Research Station, creates three explicit legal categories — marijuana (which remains fully illegal), industrial hemp, and medical cannabis — replacing the prior ambiguous framework under the Dangerous Drugs Act and Noxious Weeds Act, neither of which distinguished between cannabis varieties. The Cannabis Regulatory Authority (CRA), established under the Act and based at the Chitedze Agriculture Research Station near Lilongwe, is the sole licensing body, mandated to license cultivation, processing, distribution, storage, export, import, research, laboratory testing, and transport across the full value chain, and is designed to be self-funded through licence and infringement fees rather than government budget allocation. Since licensing began in November 2020, the CRA has issued 86 licences to 35 companies for industrial hemp production (per Sensi Seeds'' most recent count). Licences are restricted to registered companies or cooperatives with a confirmed off-taker agreement — individual farmers cannot apply directly and must work through a registered entity, a structural choice intended to keep subsistence farmers connected to formal market access. Notably, Malawi Gold — the internationally famous, uniquely potent local landrace strain that is one of the country''s most recognized cultural and economic exports ("chamba" is informally grouped alongside chombe/tea and chambo/tilapia as one of the country''s signature "Big C" exports) — is explicitly excluded from the legal medical cannabis programme, an irony noted by multiple industry sources. Recreational sale and distribution remain illegal, though the law is comparatively ambiguous on simple personal possession/use, and enforcement in practice focuses on trafficking rather than individual users.',
  steps = '[{"step":"Register a Malawian company or cooperative","detail":"Licenses are issued only to companies or cooperatives, not individuals — if you do not already have a registered Malawian entity, register one through the Malawi Investment and Trade Centre first"},{"step":"Secure an off-taker agreement","detail":"Applications require disclosing agreements with off-taker businesses who will process, transport, and retail the product — this must be arranged before or during the application, not after licensing"},{"step":"Obtain the CRA application form and prepare a security plan","detail":"Forms are available at the CRA''s Chitedze Agriculture Research Station office or by email request; industrial hemp requires a physical barrier around the farm perimeter, while medical cannabis requires a 2-metre fence with secured gate and siting at least 3km from public institutions (schools, hospitals, markets) unless grown in a barrier-enclosed greenhouse"},{"step":"Submit to the CRA Director General","detail":"Applications are made to the CRA Director General in Lilongwe; the CRA targets a 21-day review turnaround, though in practice this has ranged from 21 days to 3 months"},{"step":"Pay the applicable licence fee for a 12-month term","detail":"Licences are valid for 12 months initially, with the same fee applying on renewal; the CRA is evaluating longer 3- or 5-year renewal terms for established operators but this has not yet been formalized in regulation"}]'::jsonb,
  key_regulators = '["Cannabis Regulatory Authority (CRA) — sole licensing body for the full cannabis/hemp value chain, based at Chitedze Agriculture Research Station","Malawi Investment and Trade Centre — company/cooperative registration prerequisite to licensing"]'::jsonb,
  common_pitfalls = ARRAY[
    'Applying as an individual — Malawi licenses only companies or cooperatives with a confirmed off-taker, not individual farmers; this is a hard structural gate, not a preference',
    'Assuming Malawi Gold or other high-recognition local landrace strains can be grown under the legal programme — the law explicitly excludes marijuana varieties, including the country''s most famous cultivar, from the medical/industrial legal framework',
    'Underestimating the review timeline variance — the CRA''s stated 21-day target has in practice ranged up to 3 months; build schedule buffer into any launch plan rather than assuming the target turnaround'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across the Industrial Crops Association''s official FAQ (a Malawi-based hemp/cannabis trade body with direct CRA contact details), a peer-reviewed academic overview (PMC), Cannavigia''s licensing guide, and Sensi Seeds'' regularly updated country report, all consistent on the Act''s February 2020 passage, licence-count figures, and the company/cooperative-only licensing structure',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.ica-malawi.org/faqs')
WHERE country_iso2 = 'MW';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'No standard commercial licensing fee schedule exists because there is no commercial cannabis licensing pathway to enter — the only access route is the government-administered Medical Cannabis Access Programme (MCAP) for patients, which is not a channel for business entry. Ministerial licences for controlled-drug activity (manufacture, import, export, supply) are assessed case-by-case with no published standard fee',
  legal_framework_summary = 'Ireland has one of the most restrictive cannabis frameworks in Western Europe, with no commercial pathway of any kind — recreational, medical-commercial, or cultivation-for-supply — currently open to businesses as of 2026. Cannabis is a Schedule 1 controlled substance under the Misuse of Drugs Acts 1977-2016, meaning it is officially considered to have a high potential for abuse and no accepted medical use, and cultivation, import, export, production, supply, and possession are all offences except under a Ministerial Licence. An Garda Síochána (the national police), in its own official public guidance, states plainly that policy to date has not permitted cannabis cultivation for medical purposes and no licences have been issued for that activity — meaning there is currently no legal domestic cultivation industry of any kind, medical or otherwise. The one narrow legal access route for patients is the Medical Cannabis Access Programme (MCAP), introduced in 2019, which allows prescription of specific cannabis-based products (that notably exclude cannabis flower and any high-THC formulations) for a limited list of conditions including certain forms of epilepsy, multiple sclerosis spasticity, and chemotherapy-induced nausea — chronic pain, a common qualifying condition in most other medical cannabis programmes internationally, is explicitly not covered. A separate ministerial-approval route exists for named-patient access to any cannabis product for any condition, but as of recent reporting only 63 patients nationally use this pathway. Ireland''s Health Minister commissioned a formal review of MCAP in April 2026 (led by Professor Shane Allwright) specifically to assess whether eligibility should be expanded, signalling the government''s own recognition that the current programme is too narrow, though no outcome or timeline for legislative change has been confirmed. On the reform side, the Citizens'' Assembly on Drugs Use recommended a health-led approach to personal drug possession in January 2024, and the Oireachtas Joint Committee on Drug Use backed this with 59 specific recommendations in October 2024, including decriminalization of personal possession for all substances — but legislative action has been slow to follow, and Ireland''s National Drugs Strategy 2026-2029 includes a planned health-diversion scheme (offering healthcare referral rather than automatic prosecution for a first or second personal-possession offence, with a third offence returning the case to the standard criminal justice process) that has not yet been operationalized as of the most recent reporting. CBD itself is not a controlled substance, but Irish and EU food-safety rules set no general THC tolerance in food products (except narrow hemp-seed exceptions), and any product testing over trace THC levels has triggered product recalls per the Food Safety Authority of Ireland. Cannabis seized at Irish customs in 2025 was valued at approximately €107 million, roughly €46 million of which originated from the United States — an indicator of substantial illicit-market demand persisting alongside the restrictive legal framework.',
  steps = '[{"step":"Recognize there is no commercial entry pathway as of 2026","detail":"Unlike most jurisdictions in this playbook series, Ireland has no licensing route for cultivation, processing, or medical-cannabis commercial supply open to new applicants — the Garda''s own official guidance confirms no cultivation licences for medical purposes have been issued to date"},{"step":"Monitor the April 2026 MCAP review outcome","detail":"The Allwright-led review of the Medical Cannabis Access Programme could expand eligibility criteria or product scope — this is the most concrete near-term signal of potential regulatory movement and should be tracked directly via the Department of Health"},{"step":"Track the National Drugs Strategy 2026-2029 health-diversion scheme implementation","detail":"This is a personal-possession policy change, not a commercial pathway, but its implementation timeline is one of the clearest live indicators of the government''s broader direction on cannabis policy"},{"step":"If pursuing CBD/hemp food products, engage FSAI compliance early","detail":"There is no general THC tolerance in Irish food products outside narrow hemp-seed exceptions, and recalls have resulted from non-compliant THC levels — lab verification and FSAI-aligned labelling should be built into any CBD product plan from the outset"}]'::jsonb,
  key_regulators = '["Health Products Regulatory Authority (HPRA) — CBD/hemp product classification, does not currently recognize CBD as a medicinal product","Department of Health — Medical Cannabis Access Programme administration, commissioned the April 2026 MCAP review","An Garda Síochána — enforcement and official public guidance on legal status","Food Safety Authority of Ireland (FSAI) — THC tolerance and labelling rules for CBD/hemp food products","Health Service Executive (HSE) — MCAP reimbursement administration via community drug schemes"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming MCAP or Ireland''s "medical cannabis legalization" headlines mean a commercial licensing pathway exists — MCAP is a narrow patient-prescription programme only; there is no route for businesses to obtain cultivation or supply licences, confirmed directly by An Garda Síochána''s official guidance',
    'Assuming CBD compliance is straightforward because CBD itself is not controlled — Irish and EU food-safety rules set no general THC tolerance, and FSAI has recorded product recalls over non-compliant THC content; treat lab verification as mandatory, not optional',
    'Treating the Citizens'' Assembly and Oireachtas Committee recommendations as enacted policy — both bodies have recommended decriminalization and reform, but as of the most recent reporting legislative action has been slow, and the existing criminal framework applies in full pending any actual legal change'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by An Garda Síochána''s official public guidance (the national police), the Food Safety Authority of Ireland, and multiple independent legal-analysis outlets (LegalClarity, Cannigma, Herb.co) all consistent on MCAP''s scope limitations, the absence of any cultivation licensing, and the April 2026 review timeline',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.garda.ie/en/crime/drugs/is-cannabis-legal-.html')
WHERE country_iso2 = 'IE';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 15,
  estimated_cost_range = 'A comprehensive national cannabis policy framework governing commercial licensing was confirmed by government officials as under development as of early 2026, but had not yet been published; no licensing fee schedule exists yet because no commercial licensing programme has formally opened',
  legal_framework_summary = 'Grenada enacted historic cannabis reform in early 2026, but — critically — this reform is a decriminalization and personal-use law, not a commercial licensing framework, and no licensed medical or therapeutic cannabis market yet exists for businesses to enter. The Drug Abuse (Prevention and Control) (Amendment) Act, 2026 (Act No. 1 of 2026) was assented to on 13 February 2026 and published in the Government Gazette on 20 February 2026, following passage in Parliament with bipartisan support (both government and opposition legislators voted in favour) on 20 January 2026. The Act decriminalizes personal possession of up to 56 grams of cannabis flower or 15 grams of resin for adults aged 21 and over — a notably generous threshold, the highest in the Eastern Caribbean (compared to Antigua and Barbuda''s 15 grams) — and permits registered household cultivation of up to 4 cannabis plants for medicinal, therapeutic, or horticultural purposes, with separate households on shared premises treated independently. The age threshold of 21 (rather than 18) was the subject of notable parliamentary debate: Prime Minister Dickon Mitchell stated his personal preference had been for 18, consistent with Grenada''s general age of civil responsibility, but deferred to medical and mental-health experts'' concerns about adolescent brain development. The Act also provides automatic amnesty and expungement of criminal records for minor past cannabis offences, discontinues pending prosecutions for amounts within the new legal thresholds, and formally recognizes the constitutional right of the Rastafari community to use cannabis as a religious sacrament within registered places of worship and at officially designated "exempt events," with specific cultivation allowances for the community. Attorney General Claudette Joseph and Health Minister Phillip Telesford have both been explicit and consistent in public statements that this legislation does not create a commercial recreational cannabis market — recreational sale remains illegal, public consumption remains prohibited, and severe criminal penalties remain in place for supplying cannabis to minors. The government has stated its intention to develop "a regulated medicinal and therapeutic cannabis industry" as a distinct, separate policy track, with a comprehensive national cannabis policy framework described as under development by the Cannabis Legalisation and Regulation Secretariat (established under the Ministry of Agriculture) as of early-to-mid 2026, but this framework had not been published as of the most recent reporting — meaning there is currently no formal licensing process for businesses seeking to enter a Grenadian medical/therapeutic cannabis sector.',
  steps = '[{"step":"Monitor the Cannabis Legalisation and Regulation Secretariat for policy framework publication","detail":"The Secretariat (under the Ministry of Agriculture, Lands and Forestry) is the body conducting research and consultations to shape Grenada''s eventual commercial cannabis policy — no licensing framework exists yet, so this is the primary channel to track for when commercial applications may open"},{"step":"Distinguish personal decriminalization from commercial opportunity","detail":"The 2026 Act governs personal possession and household cultivation only (up to 4 plants); it does not authorize any commercial cultivation, processing, or retail activity — do not conflate the two when assessing market entry timing"},{"step":"Engage early with the Secretariat''s public consultation process","detail":"The Secretariat has stated it is conducting research and public consultations to advise the Minister of Agriculture on how to structure the eventual industry — early engagement may provide visibility into the framework''s direction before formal licensing opens"},{"step":"Track the religious/Rastafari sacramental use framework separately","detail":"Registered places of worship and exempt events have distinct legal cultivation allowances under the Act — this is a separate legal track from any future commercial medical/therapeutic licensing regime and should not be assumed to provide a business entry point"}]'::jsonb,
  key_regulators = '["Cannabis Legalisation and Regulation Secretariat — policy research, public consultation, and recommendations to the Minister of Agriculture on commercial framework design","Ministry of Agriculture, Lands and Forestry, Economic Development and Planning — political oversight of cannabis industry policy development","Ministry of Health — public health framing and enforcement policy for decriminalization implementation"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2026 Act creates a licensable commercial cannabis market — it decriminalizes personal possession and household cultivation only; both the Attorney General and Health Minister have explicitly and repeatedly stated commercial recreational sale remains prohibited and is not authorized by this legislation',
    'Treating "regulated medicinal and therapeutic cannabis industry" language in government statements as an active licensing programme — as of the most recent reporting this remains a stated future policy direction with a framework still in development, not a program open for applications',
    'Assuming the 21-plant/56-gram thresholds signal an imminent commercial framework timeline — these are personal-use decriminalization thresholds only, and the commercial policy framework''s publication timeline has not been confirmed by government sources'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across direct government-sourced reporting (NOW Grenada publishing the Secretariat''s own draft bill and policy statement), multiple independent Caribbean and international news outlets (Caribbean Today, St. Martin News Network, International CBC) with consistent quotes from named officials (PM Mitchell, AG Joseph, Health Minister Telesford), and a June 2026 visitor-focused legal summary (Herb.co) confirming the Act''s in-force status and absence of licensed retail',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-grenada')
WHERE country_iso2 = 'GD';

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('LS', 'Active Licences (of Historical Total Issued)', 17, 'licences', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'medium', 'GrowerIQ (Africa Cannabis Frontier analysis)', 'https://groweriq.ca/2026/06/23/africa-cannabis-frontier-south-africa-lesotho-2026/', '2026-06-23', 'Of a reported 140+ licences issued across the sector''s history, only ~17 recorded as active at time of assessment; illustrates the gap between cumulative licensing and operational reality'),
  ('LS', 'Africa Medical Cannabis Market Size 2025', 1900000000, 'USD', '2025-01-01', '2025-12-31', 'annual', 'observed', 'medium', 'IMARC Group (via GrowerIQ)', 'https://groweriq.ca/2026/06/23/africa-cannabis-frontier-south-africa-lesotho-2026/', '2026-06-23', 'Continent-wide figure spanning 6 key jurisdictions (Lesotho, Zimbabwe, South Africa, Ghana, Zambia, Malawi), not Lesotho-specific; projected to reach $8.2B by 2034 at 17.2% CAGR'),
  ('MW', 'Licences Issued Since Nov 2020', 86, 'licences', '2020-11-01', '2026-01-01', 'point_in_time', 'observed', 'high', 'Sensi Seeds', 'https://sensiseeds.com/en/blog/countries/cannabis-in-malawi-laws-use-history/', '2026-03-26', '86 licences issued to 35 companies for industrial hemp production since licensing began in November 2020'),
  ('MW', 'CRA Application Review Target', 21, 'days', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'medium', 'Cannavigia / Industrial Crops Association', 'https://www.ica-malawi.org/faqs', '2026-01-01', 'Stated CRA target turnaround for licence application assessment; independent sources note actual turnaround has ranged from 21 days to 3 months in practice'),
  ('IE', '2025 Customs Cannabis Seizure Value', 107000000, 'EUR', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high', 'Herb.co (citing Irish customs data)', 'https://herb.co/city-guides/buy-weed-ireland', '2026-05-14', 'Total value of cannabis seized at Irish customs in 2025; approximately EUR46M of the total originated from the United States'),
  ('IE', 'MCAP Ministerial-Approval Route Patients', 63, 'patients', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'medium', 'Prohibition Partners (via Cannigma)', 'https://cannigma.com/regulation/ireland-marijuana-laws/', '2026-02-17', 'Number of patients nationally accessing cannabis via the separate ministerial-approval route (any product, any condition, with written Minister of Health approval) rather than standard MCAP prescription'),
  ('GD', 'Legal Personal Possession Threshold', 56, 'grams', '2026-02-20', '2026-12-31', 'point_in_time', 'observed', 'high', 'Herb.co (citing Drug Abuse (Prevention and Control) (Amendment) Act 2026)', 'https://herb.co/city-guides/buy-weed-grenada', '2026-06-08', 'Highest personal possession decriminalization threshold in the Eastern Caribbean as of 2026, compared to Antigua and Barbuda''s 15 grams; cannabis resin threshold set separately at 15 grams'),
  ('GD', 'Maximum Household Cultivation Plants', 4, 'plants', '2026-02-20', '2026-12-31', 'point_in_time', 'observed', 'high', 'NOW Grenada (citing draft Bill and Policy Statement)', 'https://nowgrenada.com/2026/01/draft-bill-and-policy-statement-for-the-decriminalisation-of-cannabis-in-grenada/', '2026-01-15', 'Per premises for medicinal, therapeutic, or horticultural purposes; separate households on shared premises are treated independently under the Act')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('LS','MW','IE','GD');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711100100','jurisdiction_playbooks_batch21b_content','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711100100_jurisdiction_playbooks_batch21b_content.sql

-- RECOVERY BEGIN 20260711104709_ratings_forward_fix_bigint_concurrently_null_default.sql
-- Production forward-fix for PR #1021 (bigint review_count, CONCURRENTLY indexes, NULL rating default).
-- Applied directly to production 2026-07-11 via Supabase MCP (Tyler approved). This file reconciles
-- the migration ledger with what is now actually live -- it does not need to be re-run.
--
-- review_count was `integer` (overflow risk under real load); average_rating defaulted to `0.0`
-- instead of NULL (the correct "no ratings yet" value -- every consumer already treats these columns
-- as nullable). Both idx_listings_avg_rating and idx_listings_review_count were rebuilt CONCURRENTLY
-- to avoid locking `listings`.
--
-- Two objects transitively depend on these columns and had to be dropped/recreated to allow the type
-- change: trigger_ratings_updated (BEFORE UPDATE trigger referencing review_count in its WHEN clause)
-- and public.marketplace_public_listings_v1 (view, cascades to api.marketplace_public_listings_v1).
-- Both views were recreated with security_invoker = true preserved -- see the recurring
-- CREATE OR REPLACE VIEW security_invoker regression class documented in
-- 20260709032305/20260710_close_rls_bypass_18_views. Recreating a view resets its privileges to
-- schema defaults, NOT just its WITH options: the first recreation attempt here briefly granted
-- anon/authenticated INSERT/UPDATE/DELETE/TRUNCATE on public.marketplace_public_listings_v1 (default
-- privileges on the public schema), caught and reverted to SELECT-only within the same session before
-- any traffic could hit it. Explicit REGRANT of exactly the prior privilege set is required every time
-- a view is dropped and recreated in this schema, not just security_invoker.

-- Converted to a no-op stub on 2026-07-19: re-running the ALTER above fails
-- ("cannot alter type of a column used in a trigger definition") because
-- trigger_ratings_updated already exists and already references review_count
-- in its WHEN clause -- confirmed live that review_count is already bigint
-- and average_rating already has no default, matching the comment above's
-- own claim that this reconciles the ledger rather than needing a real run.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711104709','ratings_forward_fix_bigint_concurrently_null_default','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711104709_ratings_forward_fix_bigint_concurrently_null_default.sql

-- RECOVERY BEGIN 20260711105146_revoke_excess_grants_content_gated_tables.sql
-- Flagged during the security_definer_view audit (20260710190000): these 3
-- base tables grant full CRUD (DELETE, INSERT, REFERENCES, SELECT, TRIGGER,
-- TRUNCATE, UPDATE) directly to anon/authenticated, almost certainly from a
-- stray broad GRANT rather than a deliberate decision -- confirmed by
-- checking pg_policies: none of the three has a permissive INSERT/UPDATE/
-- DELETE policy for anon/authenticated, so RLS already blocks every write
-- via PostgREST today. Not an active breach (RLS is the real enforcing
-- control and it's intact), but dead, overly-broad grants are still worth
-- closing:
--   - Least privilege: no code path needs these, so there's nothing to
--     preserve by keeping them.
--   - TRUNCATE is the one command Postgres never subjects to RLS at all --
--     currently inert only because anon/authenticated aren't reachable via
--     a direct Postgres connection in this architecture (PostgREST-only),
--     but that's an operational fact to keep true, not something this
--     grant should depend on.

-- country_education_overlay / editorial_items: each has exactly one
-- permissive policy, and it's SELECT-only (content-gated: review_status /
-- stage). Keep that read path; drop everything else.
revoke insert, update, delete, truncate, trigger, references
  on public.country_education_overlay from anon, authenticated;
revoke insert, update, delete, truncate, trigger, references
  on public.editorial_items from anon, authenticated;

-- stripe_webhook_events: its one policy is `ALL ... USING (auth.role() =
-- 'service_role')` -- anon/authenticated are blocked from every command,
-- including SELECT. No read path to preserve here at all.
revoke all on public.stripe_webhook_events from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711105146','revoke_excess_grants_content_gated_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711105146_revoke_excess_grants_content_gated_tables.sql

-- RECOVERY BEGIN 20260711111007_regulatory_tier_classifier_function.sql
-- Single source of truth for deriving a regulatory_tier from briefing text.
-- Both the change-trigger and any manual/agent re-run call THIS, so the logic
-- can never drift between "how it was seeded" and "how it re-derives".
--
-- Mirrors the reviewed classification logic (migrations 20260710165831 /
-- 165848 / 171211). Exclusions run before affirmations so prospective/negated
-- language ("No Medical Programme", "Reform Under Consideration", "Export
-- Licensing Under Discussion") is not read as an active regime.
--
-- Returns NULL if there is genuinely no signal (caller decides how to treat it).

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
begin
  if ps = '' then
    return null;
  end if;

  -- cbd_hemp_only: cannabis prohibited BUT an affirmative licensed hemp/CBD
  -- regime. Deliberately narrow — requires an explicit licensed/permitted/
  -- producer signal, not mere "research interest".
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful cross-border trade operating.
  if ps ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented)'
     and ps !~* 'export licensing under (discussion|consideration|review)'
  then
    return 'legal_commercial_access';
  end if;
  if ps ~* 'industrial (cultivation licensed|legal)' then
    return 'legal_commercial_access';
  end if;
  if ps ~* 'adult-use legal — federal' then
    return 'legal_commercial_access';
  end if;

  -- domestic_only: lawful internally (adult-use / personal cultivation /
  -- coffee-shop / pilot retail) but no cross-border route.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- medical_limited_trade: affirmative medical access; exclude negated/future.
  if ps ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
  then
    return 'medical_limited_trade';
  end if;

  -- default: prohibited.
  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Single source of truth for deriving countries.regulatory_tier from cc_jurisdiction_briefings.program_status. Called by the change-trigger and by manual re-runs so logic never drifts.';

revoke all on function api.derive_regulatory_tier(text) from public, anon, authenticated;
grant execute on function api.derive_regulatory_tier(text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711111007','regulatory_tier_classifier_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711111007_regulatory_tier_classifier_function.sql

-- RECOVERY BEGIN 20260711111045_regulatory_tier_provenance_and_staleness.sql
-- Provenance + staleness so auto-classification and human/agent overrides can
-- coexist safely, and so a tier "knows" when its source has moved underneath it.

alter table public.countries
  -- 'auto'      = value came from api.derive_regulatory_tier and may be
  --               recomputed freely on briefing change.
  -- 'override'  = a human or agent deliberately set this; the auto-classifier
  --               must NOT silently overwrite it. (Moldova, India today.)
  add column if not exists regulatory_tier_origin text not null default 'auto'
    check (regulatory_tier_origin in ('auto','override')),
  -- Hash of the program_status the current tier was derived from. When the live
  -- briefing hash differs, the tier is stale.
  add column if not exists regulatory_tier_source_hash text,
  -- Set true when the briefing changed and the newly-derived tier differs from
  -- what's stored (the "flag if surprising" signal). Cleared on reclassify/ack.
  add column if not exists regulatory_tier_needs_review boolean not null default false,
  add column if not exists regulatory_tier_last_derived_at timestamptz;

comment on column public.countries.regulatory_tier_origin is
  'auto = safe to recompute from briefing; override = a human/agent set it, classifier must not clobber.';
comment on column public.countries.regulatory_tier_needs_review is
  'True when a briefing change produced a tier different from the stored one (surprising change to confirm).';
comment on column public.countries.regulatory_tier_source_hash is
  'md5 of the program_status the current tier was derived from; mismatch vs live = stale.';

-- Backfill: mark the two manual CBD calls as overrides so the trigger respects
-- them, and seed source hashes + derived timestamps for everything.
update public.countries c set
  regulatory_tier_origin = case when c.iso_alpha2 in ('MD','IN','TR','CN') then 'override' else 'auto' end,
  regulatory_tier_source_hash = md5(coalesce(b.program_status,'')),
  regulatory_tier_last_derived_at = now()
from public.cc_jurisdiction_briefings b
where b.country_iso2=c.iso_alpha2 and b.jurisdiction_type='country';

-- Rows with no briefing (the 8 manual ones) are overrides by definition.
update public.countries set
  regulatory_tier_origin = 'override',
  regulatory_tier_source_hash = md5(''),
  regulatory_tier_last_derived_at = now()
where iso_alpha2 in ('RU','PR','FK','VA','FM','SC','TO','EH');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711111045','regulatory_tier_provenance_and_staleness','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711111045_regulatory_tier_provenance_and_staleness.sql

-- RECOVERY BEGIN 20260711111103_regulatory_tier_audit_log.sql
-- Append-only audit trail. Every tier change (auto or manual) lands here, so
-- "what changed, when, why, from what source text" is always answerable — this
-- is the "wired into the active database, knows when something changes" part.

create table if not exists public.regulatory_tier_audit (
  id             bigint generated always as identity primary key,
  country_iso2   text not null,
  changed_at     timestamptz not null default now(),
  old_tier       text,
  new_tier       text,
  origin         text not null,          -- 'auto' | 'override'
  trigger_source text not null,          -- 'briefing_change' | 'manual' | 'backfill' | 'reclassify_all'
  program_status text,                   -- the source text at time of change
  actor          text,                   -- who/what made the change (agent id, 'system', etc.)
  note           text
);

create index if not exists idx_reg_tier_audit_iso   on public.regulatory_tier_audit(country_iso2, changed_at desc);
create index if not exists idx_reg_tier_audit_recent on public.regulatory_tier_audit(changed_at desc);

comment on table public.regulatory_tier_audit is
  'Append-only history of every regulatory_tier change. Never updated/deleted in normal operation.';

alter table public.regulatory_tier_audit enable row level security;
-- Read for authenticated app users + service role; writes only via the trigger
-- and service role (SECURITY DEFINER functions run as owner regardless).
revoke all on public.regulatory_tier_audit from anon, authenticated;
grant select on public.regulatory_tier_audit to authenticated, service_role;
grant insert on public.regulatory_tier_audit to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711111103','regulatory_tier_audit_log','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711111103_regulatory_tier_audit_log.sql

-- RECOVERY BEGIN 20260711111130_regulatory_tier_briefing_change_trigger.sql
-- Fires when a country briefing's program_status changes. Keeps countries.
-- regulatory_tier fresh automatically, per the chosen policy:
--   * origin='auto'     → reclassify immediately; if the new tier differs from
--                         the old, set needs_review=true (the "flag surprising
--                         change" signal) and log it.
--   * origin='override' → do NOT change the tier, but update the source hash and
--                         set needs_review=true so someone re-confirms the
--                         human/agent call against the new text.
-- Every change is written to regulatory_tier_audit.

create or replace function public.sync_regulatory_tier_from_briefing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_iso        text := new.country_iso2;
  v_old_tier   text;
  v_origin     text;
  v_new_tier   text;
  v_new_hash   text := md5(coalesce(new.program_status,''));
begin
  -- Only care about country-level briefings with a program_status change.
  if new.jurisdiction_type is distinct from 'country' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.program_status is not distinct from new.program_status then
    return new;   -- program_status didn't change; nothing to do.
  end if;

  select regulatory_tier, regulatory_tier_origin
    into v_old_tier, v_origin
    from public.countries
   where iso_alpha2 = v_iso;

  if not found then
    return new;   -- no matching country row; ignore.
  end if;

  v_new_tier := public.api_derive_or_null(new.program_status);

  if v_origin = 'override' then
    -- Respect the human/agent call; just refresh provenance and flag for
    -- re-confirmation against the new source text.
    update public.countries set
      regulatory_tier_source_hash = v_new_hash,
      regulatory_tier_needs_review = true,
      regulatory_tier_last_derived_at = now()
    where iso_alpha2 = v_iso;

    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_old_tier, 'override', 'briefing_change', new.program_status, 'system',
       'Briefing changed under an overridden tier; flagged for re-confirmation, tier left as-is.');
    return new;
  end if;

  -- origin = 'auto': recompute.
  update public.countries set
    regulatory_tier = coalesce(v_new_tier, regulatory_tier),
    regulatory_tier_source = 'auto-reclassified on briefing change ' || to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_source_hash = v_new_hash,
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = case when v_new_tier is distinct from v_old_tier then true else regulatory_tier_needs_review end
  where iso_alpha2 = v_iso;

  if v_new_tier is distinct from v_old_tier then
    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_new_tier, 'auto', 'briefing_change', new.program_status, 'system',
       'Auto-reclassified after briefing change.');
  end if;

  return new;
end;
$$;

-- Thin wrapper so the trigger (search_path='') can reach the api-schema
-- classifier by a fully-qualified, stable name.
create or replace function public.api_derive_or_null(program_status text)
returns text language sql immutable security definer set search_path='' as $$
  select api.derive_regulatory_tier(program_status);
$$;

drop trigger if exists trg_sync_regulatory_tier on public.cc_jurisdiction_briefings;
create trigger trg_sync_regulatory_tier
  after insert or update of program_status on public.cc_jurisdiction_briefings
  for each row execute function public.sync_regulatory_tier_from_briefing();

comment on function public.sync_regulatory_tier_from_briefing() is
  'Keeps countries.regulatory_tier in sync when a country briefing program_status changes. Respects overrides, flags surprising changes, writes regulatory_tier_audit.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711111130','regulatory_tier_briefing_change_trigger','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711111130_regulatory_tier_briefing_change_trigger.sql

-- RECOVERY BEGIN 20260711111230_regulatory_tier_agent_controls_and_views.sql
-- The "editing view" surface: what's stale/flagged, plus RPCs an agent (or the
-- Airtable sync) calls to make changes safely. All writes funnel through these
-- so provenance, hashing, audit, and the needs_review flag stay consistent.

-- 1. Review-queue view: everything currently flagged, with its source text and
--    what the classifier WOULD say now (so a reviewer sees the delta at a glance).
create or replace view api.regulatory_tier_review_queue as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.regulatory_tier              as current_tier,
  c.regulatory_tier_origin       as origin,
  api.derive_regulatory_tier(b.program_status) as classifier_suggests,
  (c.regulatory_tier is distinct from api.derive_regulatory_tier(b.program_status)) as differs_from_classifier,
  b.program_status,
  c.regulatory_tier_rationale    as rationale,
  c.regulatory_tier_reviewed_at  as reviewed_at,
  c.regulatory_tier_last_derived_at as last_derived_at
from public.countries c
left join public.cc_jurisdiction_briefings b
  on b.country_iso2=c.iso_alpha2 and b.jurisdiction_type='country'
where c.regulatory_tier_needs_review = true
order by c.country_name;

grant select on api.regulatory_tier_review_queue to authenticated, service_role;

-- 2. Agent sets a reviewed tier (becomes an override, clears the flag, logs it).
create or replace function api.set_regulatory_tier(
  p_iso text,
  p_tier text,
  p_actor text default 'agent',
  p_note text default null
) returns public.countries
language plpgsql security definer set search_path=''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'reviewed override ('||p_actor||') '||to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor, coalesce(p_note,'Manual override via set_regulatory_tier'));

  return v_row;
end;
$$;

-- 3. Agent accepts the classifier's current suggestion (reverts to auto, clears flag).
create or replace function api.accept_classifier_tier(
  p_iso text,
  p_actor text default 'agent'
) returns public.countries
language plpgsql security definer set search_path=''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
  v_new text;
begin
  select * into v_old from public.countries where iso_alpha2=p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';
  v_new := api.derive_regulatory_tier(v_ps);

  update public.countries set
    regulatory_tier = coalesce(v_new, regulatory_tier),
    regulatory_tier_origin = 'auto',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'classifier-accepted ('||p_actor||') '||to_char(now(),'YYYY-MM-DD')
  where iso_alpha2=p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, coalesce(v_new,v_old.regulatory_tier), 'auto', 'manual', v_ps, p_actor, 'Accepted classifier suggestion');

  return v_row;
end;
$$;

revoke all on function api.set_regulatory_tier(text,text,text,text) from public, anon;
revoke all on function api.accept_classifier_tier(text,text) from public, anon;
grant execute on function api.set_regulatory_tier(text,text,text,text) to authenticated, service_role;
grant execute on function api.accept_classifier_tier(text,text) to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711111230','regulatory_tier_agent_controls_and_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711111230_regulatory_tier_agent_controls_and_views.sql

-- RECOVERY BEGIN 20260711113521_batch_12_playbooks_metrics_overlay_li_tt_gd_ie.sql
-- Batch 12: jurisdiction_playbooks + market_metrics + country_education_overlay for LI, TT, GD, IE
-- Real, sourced content closing all three content_coverage_queue gaps for these four countries.
-- LI: full, static prohibition since 1983; even industrial hemp banned since 2005; no reform movement.
-- TT: two-tier situation -- 2019 decriminalization is live; 2022 Cannabis Control Act is enacted
--     but had not been proclaimed into force as of the most recent reporting (days old at review).
-- GD: brand-new (Feb 2026) decriminalization + Rastafari sacramental framework; commercial/medical
--     licensing framework explicitly promised within 3-6 months of Jan 2026 but not yet published.
-- IE: fully illegal recreationally; narrow 3-condition MCAP under active April 2026 government review;
--     strong decriminalization reform momentum (Citizens' Assembly, Oireachtas Committee) not yet law.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('Wikipedia -- Cannabis in Liechtenstein',
   'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein',
   'reference', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '1983 law, 1% THC statutory threshold, 2005 hemp ban, Minister Pedrazzini quote on rejecting liberalization'),
  ('Cannigma -- Cannabis laws in Liechtenstein',
   'https://cannigma.com/regulation/cannabis-laws-in-liechtenstein/',
   'legal_analysis', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'CBD legal-gray-zone analysis and non-EU status re: 2020 EU CJEU CBD ruling'),
  ('Leafwell -- Is Marijuana Legal in Liechtenstein?',
   'https://leafwell.com/blog/is-marijuana-legal-in-liechtenstein',
   'legal_analysis', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Sativex/Epidiolex prescription-only medical pathway detail'),
  ('CannaConnection -- Legal status of cannabis in Liechtenstein',
   'https://www.cannaconnection.com/blog/14675-legal-status-liechtenstein',
   'legal_analysis', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Confirms no anticipated near-term law changes'),

  ('Trinidad and Tobago Parliament -- The Cannabis Control Act, 2022',
   'https://www.ttparliament.org/publication/the-cannabis-control-act-2022/',
   'government_official', 1, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'Official record: Act No. 10 of 2022, assented 17-Jun-2022, gazetted 23-Jun-2022'),
  ('Jamaica Experiences -- Where is cannabis legal in the Caribbean: a guide',
   'https://www.jamaicaexperiences.com/blogs/details/article/where-is-cannabis-legal-in-the-caribbean-a-guide',
   'industry_press', 2, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'Most current confirmation that the Cannabis Control Act has yet to come into full effect'),
  ('Legal Aid and Advisory Authority (LAAA) -- The Decriminalization of Marijuana: Do''s and Don''ts',
   'https://laaa.org.tt/news-and-events/148-the-decriminalization-of-marijuana-the-dos-and-donts',
   'legal_analysis', 1, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   'Full tiered penalty schedule under the Dangerous Drugs Act as amended'),
  ('Marijuana Moment -- Trinidad And Tobago Government Introduces Marijuana Reform Bills',
   'https://www.marijuanamoment.net/trinidad-and-tobago-government-introduces-marijuana-reform-bills/',
   'news', 2, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   '30% local-control licensing requirement, direct Al-Rawi quote'),
  ('nathuLAW -- Possession of cannabis decriminalised in Trinidad and Tobago',
   'https://nathulaw.com/possession-of-cannabis-decriminalised-in-trinidad-and-tobago/',
   'legal_analysis', 2, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   '2019 Act proclamation date and initial police-service offense guidance'),

  ('Cannabis Legalisation and Regulation Secretariat -- Government of Grenada',
   'https://www.cannabiscommission.gov.gd/',
   'government_official', 1, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'Official Grenadian government secretariat leading cannabis policy design and consultation'),
  ('International CBC -- Grenada Receives Governor-General Approval For Cannabis Reforms',
   'https://internationalcbc.com/grenada-receives-governor-general-approval-for-cannabis-reforms/',
   'industry_press', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'Confirms Feb 13 2026 assent and Feb 20 2026 Gazette Vol 144 No 9 publication'),
  ('Herb -- How to Buy Weed in Grenada: 2026 Visitor Guide',
   'https://herb.co/city-guides/buy-weed-grenada',
   'industry_press', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'June 2026 on-the-ground confirmation of no licensed dispensaries yet operating'),
  ('Caribbean Today -- Grenada Parliament Approves Amendment to Marijuana Legislation',
   'https://caribbeantoday.com/sections/politics/grenada-parliament-approves-amendment-to-marijuana-legislation',
   'news', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'PM Mitchell and AG Joseph direct quotes from the parliamentary debate; 3-6 month framework commitment'),
  ('NOW Grenada -- Draft Bill and Policy Statement for the Decriminalisation of Cannabis in Grenada',
   'https://nowgrenada.com/2026/01/draft-bill-and-policy-statement-for-the-decriminalisation-of-cannabis-in-grenada/',
   'news', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'Original draft Bill provisions ahead of the Jan 20 2026 Parliament tabling'),

  ('HPRA -- Medical Cannabis Access Programme (MCAP)',
   'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme',
   'government_official', 1, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'monthly', 'active', true, true,
   'Official regulator page: MCAP eligibility conditions and Ministerial Licence route'),
  ('Herb -- How to Buy Weed in Ireland in 2026: Laws, Medical Access & What''s Changing',
   'https://herb.co/city-guides/buy-weed-ireland',
   'industry_press', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'monthly', 'active', true, true,
   'May 2026 synthesis: April 2026 MCAP review, 2025 customs seizure data, reform timeline'),
  ('Cannigma -- Ireland Marijuana Laws 2026',
   'https://cannigma.com/regulation/ireland-marijuana-laws/',
   'legal_analysis', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'MCAP qualifying-conditions detail and Ministerial Licence patient count'),
  ('Business of Cannabis -- Ireland''s Cannabis Reform Gains Momentum',
   'https://businessofcannabis.com/irelands-cannabis-reform-gains-momentum-oireachtas-committee-pushes-decriminalisation-of-cannabis-in-ireland/',
   'industry_press', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Oireachtas Joint Committee interim report detail and cannabis social club model recommendation'),
  ('Wikipedia -- Cannabis in Ireland',
   'https://en.wikipedia.org/wiki/Cannabis_in_Ireland',
   'reference', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Legislative history, Citizens'' Assembly background, party-position tracking'),
  ('legalize.news -- Is Weed Legal in Ireland? 2026 Legal Status',
   'https://legalize.news/is-weed-legal-in-ireland',
   'legal_analysis', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Full tiered possession-penalty schedule (1st/2nd/3rd offense) under the Misuse of Drugs Acts')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.jurisdiction_playbooks
  (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
   legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed, last_verified_at)
VALUES
(
  'LI', 'Liechtenstein', 'very_high', 0,
  'Not applicable -- no legal market-entry pathway exists for cultivation, processing, or sale of cannabis in any form; even industrial hemp has been banned since 2005',
  'Liechtenstein has maintained a stable, unreformed cannabis prohibition since the Law on Narcotics and Psychotropic Substances (Gesetz uber die Betaubungsmittel und die psychotropen Stoffe) was passed by the Landtag on 20 April 1983, which prohibits the cultivation, production, or sale of cannabis products with a THC content above 1%. Since a 2005 decree spearheaded by then-regent Prince Alois, industrial hemp has been banned for any use whatsoever, including as cattle feed, despite farmers having reported that European hemp feed calmed cows and increased milk yield. Liechtenstein has no medical marijuana program, but as a member of the European Medicines Agency framework it permits prescription-only access to the cannabinoid pharmaceuticals Sativex and Epidiolex (Epidyolex received its EU marketing authorization in September 2019). CBD sits in an unresolved gray zone: no law or regulation specifically bans CBD, and because cannabis is only legally defined as material above 1% THC, sub-threshold CBD products arguably fall outside the prohibition by implication rather than explicit exemption -- and because Liechtenstein is not an EU member, it is not bound by the EU Court of Justice''s 2020 ruling that CBD is not a narcotic. Penalties are real and enforced: possession of small amounts can draw a fine or up to one year of imprisonment, while selling or cultivating cannabis can draw up to three years. According to the World Drug Report 2011, 8.6% of Liechtenstein''s population used cannabis at least once annually, and a 2016 survey of 15-16-year-old students found 44% reported easy access to cannabis. Liechtenstein''s only organized reform push came in 2018, when the Free List political party toured the country advocating relaxed enforcement on fiscal grounds; then-Minister of Social Affairs Mauro Pedrazzini publicly declined to embrace liberalization, saying he preferred to "wait and see" the actions of neighboring countries and explicitly stating he did not want Liechtenstein to become a "stoner stronghold in the Rhine Valley." No further legislative reform initiative has been identified since, and multiple independent consumer-facing legal guides explicitly state they are not aware of any anticipated near-term change, notwithstanding Liechtenstein''s close economic and customs ties to Switzerland, which has itself run regulated-sale pilot programs.',
  '[]'::jsonb,
  '["Landtag (national parliament) -- enacted the 1983 Law on Narcotics and Psychotropic Substances", "Amt fur Gesundheit (Office of Public Health) -- enforcement and any EMA-authorized pharmaceutical access", "Ministry of Social Affairs -- has publicly and explicitly opposed liberalization"]'::jsonb,
  ARRAY[
    'Assuming Liechtenstein''s close economic and customs ties to Switzerland extend to cannabis policy -- Switzerland''s regulated-sale pilot programs have not been adopted or referenced as a template by Liechtenstein''s government',
    'Assuming CBD products are clearly and affirmatively legal -- the status rests on an interpretive gap (cannabis is only statutorily defined above 1% THC) rather than an explicit legal carve-out, and Liechtenstein''s non-EU status means it is not bound by EU-level CBD rulings',
    'Treating the 2018 Free List reform push as an active or ongoing legislative process -- it did not advance, the responsible minister publicly and explicitly rejected liberalization, and no subsequent government reform initiative has been identified'
  ],
  'published',
  'high -- the core prohibition, the 1% THC statutory threshold, and the 2005 hemp ban are consistently corroborated across Wikipedia, Cannigma, and Leafwell; the near-total absence of any reform movement is corroborated by multiple independent consumer-facing legal guides that explicitly note no anticipated changes, though these secondary sources are not all recently updated and should be spot-checked for very recent developments',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein'),
  CURRENT_DATE, now()
),
(
  'TT', 'Trinidad and Tobago', 'high', 0,
  'Not applicable for commercial licensing -- the Cannabis Control Act, 2022 (Act No. 10 of 2022) has been passed and gazetted but had not been proclaimed into force as of the most recent reporting, so the Cannabis Licensing Authority is not yet operational and no commercial licenses can currently be applied for',
  'Trinidad and Tobago operates on two distinct legal layers that are frequently conflated. The first, currently in force, is decriminalization under the Dangerous Drugs (Amendment) Act No. 24 of 2019, proclaimed 23 December 2019: adults may possess up to 30 grams of cannabis or 5 grams of cannabis resin without criminal charge, and may cultivate up to 4 cannabis plants per household. Possession above those thresholds is tiered: 30-60g (or 5-10g resin) draws a fixed penalty/fine of up to TTD 50,000 on summary conviction; 60-100g (or 10-14g resin) up to TTD 75,000; and above 100g (or 14g resin) escalates to a TTD 250,000 fine plus up to 5 years'' imprisonment on summary conviction, or a TTD 1,000,000 fine plus up to 15 years on indictment. Public smoking remains an offense (up to TTD 50,000 fine), and sale or distribution of any amount is treated as drug trafficking, carrying up to TTD 3,000,000 or 10 times street value plus potential life imprisonment on indictment -- with enhanced exposure within 500 metres of a school. The second layer -- a licensed commercial, medical, and religious cannabis industry -- exists in statute but is not yet operational. The Cannabis Control Bill, 2020 passed the House of Representatives unanimously, passed the Senate on 18 May 2022, received assent on 17 June 2022, and was gazetted 23 June 2022 as the Cannabis Control Act, 2022. The Act establishes the Trinidad and Tobago Cannabis Licensing Authority and creates license categories spanning cultivation, laboratory/testing, processing, retail distribution/dispensing, import, export, transport, and religious use; corporate applicants must maintain at least 30% local (Trinidad and Tobago or CARICOM-citizen) control, explicitly designed, per then-Attorney General Faris Al-Rawi, to "avoid the abuses that occurred with multinational domination in other territories." However, as of the most recent reporting located (mid-2026), the Act had not been proclaimed into force, meaning the Licensing Authority has not been constituted and no commercial licenses -- cultivation, dispensary, or otherwise -- have been issued; selling cannabis, including under a claimed medical or religious rationale without formal authorization, remains a criminal offense, with unauthorized medicinal use carrying a fine and up to 10 years'' imprisonment. A visible but entirely informal cannabis commerce already operates in the gap between decriminalized possession and the still-dormant licensing framework. CARICOM''s 2018 Regional Commission on Marijuana report concluded that considerable economic benefits could be gained from a more liberalized regional cannabis regime, a finding regularly cited by domestic reform advocates pressing the government to proclaim the 2022 Act.',
  '[
    {"step": "Track proclamation status directly with the Attorney General''s office or T&T Parliament before assuming any license category is actually open", "detail": "The Cannabis Control Act, 2022 is enacted law but had not been proclaimed into force as of the most recent reporting, so the Licensing Authority does not yet exist as an operating body"},
    {"step": "Understand the decriminalization layer is already fully live and operates independently", "detail": "30g personal possession / 4-plant household cultivation thresholds under the 2019 Act apply today regardless of the 2022 Act''s proclamation status"},
    {"step": "Plan for the 30% local/CARICOM-ownership requirement once licensing opens", "detail": "Wholly foreign-owned entities will not qualify under the Act as drafted; corporate applicants must maintain at least 30% Trinidad and Tobago or CARICOM-citizen control"},
    {"step": "Identify the correct license category in advance", "detail": "Cultivation, laboratory, processing, retail distribution (dispensary), import, export, transport, and religious-use licenses are separately defined under the Act"},
    {"step": "Treat any current commercial cannabis activity in the market as informal and unlicensed", "detail": "No legal retail or wholesale channel exists yet, and participating in one carries real trafficking-level criminal exposure regardless of the 2019 decriminalization"}
  ]'::jsonb,
  '["Trinidad and Tobago Cannabis Licensing Authority -- established by the 2022 Act but not yet constituted pending proclamation", "Ministry of the Attorney General and Legal Affairs -- policy ownership of the Cannabis Control Act", "Trinidad and Tobago Police Service -- enforcement of the Dangerous Drugs Act"]'::jsonb,
  ARRAY[
    'Treating the Cannabis Control Act, 2022 as operational because it has been passed and gazetted -- passage and proclamation are legally distinct steps, and the Act had not been proclaimed into force as of the most recent reporting, meaning the Licensing Authority does not yet exist',
    'Assuming decriminalized personal possession extends to sale or commercial activity -- selling cannabis in any amount, and cultivating beyond the 4-plant household limit, remain serious criminal offenses with trafficking-level penalties',
    'Assuming a wholly foreign-owned entity can qualify once licensing does open -- the Act requires at least 30% local (Trinidad and Tobago or CARICOM) control for corporate applicants'
  ],
  'published',
  'high -- the two-tier structure (2019 decriminalization in force; 2022 Act enacted but not proclaimed) is directly corroborated by Trinidad and Tobago''s own Parliament records (bill/Act pages with assent and gazette dates) and by a Caribbean regional guide updated within days of this review confirming the Act "has yet to come into full effect"; specific penalty figures are corroborated by a Trinidad-based legal aid authority (LAAA) citing the Dangerous Drugs Act directly',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.ttparliament.org/publication/the-cannabis-control-act-2022/'),
  CURRENT_DATE, now()
),
(
  'GD', 'Grenada', 'high', 0,
  'Not applicable for commercial cultivation, processing, or medical licensing -- that framework was still under development as of the most recent reporting, with government having targeted a 3-6 month timeline (from January 2026) to publish it; household cultivation registration (up to 4 plants) is an administrative process through the Cannabis Secretariat and Ministry of Agriculture rather than a commercial license',
  'Grenada substantially reformed its cannabis law via the Drug Abuse (Prevention and Control) (Amendment) Act, 2026, tabled in Parliament on 20 January 2026, passed with cross-party support within days, assented by Governor-General Dame Cecile La Grenade on 13 February 2026, and published in the Government Gazette (Volume 144, Number 9) on 20 February 2026 -- one of the most recently enacted cannabis reforms in the Caribbean at time of review. The Act decriminalizes possession of up to 56 grams of cannabis and 15 grams of cannabis resin for adults aged 21 and over (Prime Minister Dickon Mitchell said he had personally favored setting the threshold at 18, the age of civil majority for voting, driving, and marriage, but deferred to "passionate" parliamentary debate favoring 21); it permits registered household cultivation of up to 4 plants for medicinal, therapeutic, or horticultural purposes, with registration required through the Cannabis Secretariat and Ministry of Agriculture; and it creates a specific religious-use framework recognizing Rastafari sacramental cannabis use, under which the Minister may authorize cultivation on designated lands, and registered places of worship and Minister-recognized "exempt events" receive legal protection. The Act also mandates an amnesty and automatic-expungement pathway for qualifying past minor cannabis convictions, with the review Board empowered to expunge records including on its own motion. Public consumption remains restricted -- violations carry a $300 fixed penalty or up to a $5,000 fine, with enhanced prohibitions within 100 yards of schools and 5 metres of public entrances -- and the Act explicitly does not create a recreational commercial market: both Health Minister Phillip Telesford and Attorney General Claudette Joseph were explicit during the parliamentary debate that recreational retail sale remains prohibited, with any commercial track limited to a still-pending medical and therapeutic framework. At the time of passage, government officials stated they would move within three to six months to develop a comprehensive national cannabis policy and supporting legislation covering cultivation, processing, research, and medicinal distribution; as of the most recent reporting located (June 2026), a visitor-facing industry guide found no official evidence of any licensed recreational or medical dispensary operating in Grenada, meaning the commercial framework remains in development. The pre-existing Cannabis Legalisation and Regulation Secretariat, operating under the Ministry of Agriculture, is the body conducting stakeholder consultation and is expected to lead design of that forthcoming regulatory framework.',
  '[
    {"step": "Register for household cultivation with the Cannabis Secretariat and Ministry of Agriculture if pursuing the personal/therapeutic track", "detail": "Up to 4 plants per household are permitted once registered; formal registration guidelines were still being finalized by the Secretariat around the time of the Act''s passage"},
    {"step": "Monitor the Cannabis Legalisation and Regulation Secretariat for the promised national cannabis policy framework", "detail": "Government committed to a 3-6 month timeline (from January 2026) for legislation covering commercial cultivation, processing, research, and medicinal distribution; no commercial licensing category exists yet"},
    {"step": "If pursuing Rastafari sacramental cultivation, apply for Ministerial authorization on designated lands", "detail": "This is a distinct legal pathway from household registration, tied to registered places of worship or Minister-recognized exempt events"},
    {"step": "Do not assume any current commercial activity is licensed", "detail": "A June 2026 visitor-facing review found no evidence of licensed recreational or medical dispensaries operating in Grenada as of that review"},
    {"step": "Respect public-consumption restrictions when evaluating any hospitality or tourism angle", "detail": "Use in or near public places, including many hotel common areas, can trigger fines, and individual properties vary widely in their own policies"}
  ]'::jsonb,
  '["Cannabis Legalisation and Regulation Secretariat (Ministry of Agriculture) -- policy design and stakeholder consultation for the forthcoming commercial framework", "Ministry of Agriculture -- household cultivation registration", "Office of the Attorney General -- legislative drafting and legal policy"]'::jsonb,
  ARRAY[
    'Assuming the February 2026 Act creates any form of legal commercial market -- both the Attorney General and Health Minister were explicit that recreational retail sale remains prohibited, and the promised medical/therapeutic licensing framework had not been published as of the most recent reporting',
    'Treating Grenada''s 56-gram possession limit (nearly 4x Antigua and Barbuda''s 15g) as evidence of a more commercially permissive environment overall -- the generous personal-possession threshold does not translate into an open licensing environment, which remains entirely undeveloped',
    'Assuming hotel and resort properties uniformly tolerate cannabis use -- policies vary sharply by property, and public-space rules under the Act apply to many common hotel areas regardless of a property''s informal stance'
  ],
  'published',
  'high -- the Act''s key provisions (56g/15g possession threshold, 4-plant household registration, Rastafari sacramental framework, expungement mechanism) are directly corroborated by Grenada''s own government secretariat, multiple Caribbean regional news outlets reporting from the parliamentary debate itself, and a June 2026 visitor-facing guide confirming no commercial dispensaries yet exist; the promised 3-6 month commercial-framework timeline is a government commitment as reported at time of passage and had not been independently confirmed as met or missed as of this review',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabiscommission.gov.gd/'),
  CURRENT_DATE, now()
),
(
  'IE', 'Ireland', 'high', 0,
  'Not applicable for cultivation, processing, or retail sale -- fully illegal outside two narrow license routes (industrial hemp cultivation permits and Ministerial/MCAP medical prescribing); industrial hemp cultivation requires an annual Department of Health license with no standardized public fee schedule identified',
  'Cannabis is illegal in Ireland for recreational use under the Misuse of Drugs Acts 1977-1984, which schedule cannabis as a controlled substance permitting cultivation, sale, or possession only under Ministerial license. Possession penalties are tiered by offense count: a first offense draws a fine up to EUR 381 on summary conviction (up to EUR 635 on indictment); a second offense up to EUR 508 (EUR 1,269 on indictment); a third or subsequent offense escalates to a fine up to EUR 1,269 or imprisonment up to 12 months summarily, or up to 3 years on indictment. CBD is legal for sale if THC content is below 0.2%, though CBD is not listed as a medical product by the Health Products Regulatory Authority (HPRA) and cannot be formally prescribed; cannabis seeds may be legally bought, sold, and imported despite cultivation itself being illegal without a license -- a frequently misunderstood quirk of the law. Industrial hemp cultivation is legal under an annual Department of Health license, with plantations required to stay under 0.2% THC and be sited away from public roads. Medical access runs through the Medical Cannabis Access Programme (MCAP), a pilot launched in 2021 following 2019 enabling legislation and originally set to run five years; a consultant may prescribe a cannabis-based product only for three defined, treatment-resistant conditions -- spasticity associated with multiple sclerosis, intractable chemotherapy-related nausea and vomiting, and severe refractory epilepsy -- for up to six months at a time, and only after standard treatments have failed. A separate, broader Ministerial Licence route lets a registered practitioner seek the Health Minister''s written approval to prescribe any cannabis product for any condition, but this pathway has reached only a small number of patients (sources vary: roughly 63-74 patients cited across recent reporting windows), leading Irish media to describe the programme as effectively failing patients at scale. In April 2026, Health Minister Jennifer Carroll MacNeill launched a formal government review of MCAP, commissioning Professor Shane Allwright to assess whether eligibility should be expanded -- a live, active process without a concluded outcome as of this review. Separately, reform momentum on the recreational/decriminalization side has been building without yet producing legislation: Ireland''s Citizens'' Assembly on Drug Use recommended decriminalizing personal possession of all drugs in January 2024; the Oireachtas Joint Committee on Drug Use published an interim report in late 2024 (sources cite differing recommendation counts across drafting stages) backing decriminalization and specifically recommending against mandatory health-service referrals for personal possession, while also proposing a Germany/Malta-style regulated non-profit cannabis social club model rather than commercial retail; committee chair Gary Gannon called it "a recognition that criminalizing people for their own drug use has not reduced risks." None of these recommendations had been enacted into law as of the most recent reporting, and successive governments have shown more openness to decriminalization than to full legalization. Enforcement remains real and current: cannabis seized at Irish customs in 2025 was valued at approximately EUR 107 million, with roughly EUR 46 million of that originating from the United States.',
  '[
    {"step": "Distinguish the three separate legal channels before assuming any pathway applies", "detail": "CBD retail (under 0.2% THC, unregulated as a medicine), licensed industrial hemp cultivation (Department of Health annual license, under 0.2% THC), and MCAP/Ministerial medical prescribing (narrow, prescriber-led, not a commercial retail model) are entirely distinct, and none permits a general cannabis business"},
    {"step": "Apply for an annual Department of Health hemp cultivation license if pursuing industrial hemp", "detail": "Plantations must stay under 0.2% THC and be located away from public roads, with the license renewed yearly"},
    {"step": "Track the April 2026 MCAP review before assuming current medical-access criteria are final", "detail": "Professor Shane Allwright''s government-commissioned assessment of whether to expand MCAP eligibility was still underway as of this review"},
    {"step": "Monitor the Oireachtas Joint Committee''s decriminalization recommendations as a policy signal, not enacted law", "detail": "As of the most recent reporting, none of the committee''s or Citizens'' Assembly''s recommendations had been passed into legislation"},
    {"step": "Do not assume cannabis seed legality implies cultivation is permitted", "detail": "Seeds may be legally bought and sold in Ireland, but germinating and growing cannabis without a Ministerial license remains a criminal offense"}
  ]'::jsonb,
  '["Health Products Regulatory Authority (HPRA) -- administers the Medical Cannabis Access Programme and controlled-drug licensing", "Department of Health -- Ministerial Licence approvals and industrial hemp cultivation licenses", "An Garda Siochana -- enforcement of the Misuse of Drugs Acts"]'::jsonb,
  ARRAY[
    'Assuming the strong political and public reform momentum (Citizens'' Assembly, Oireachtas Committee recommendations) means legalization or decriminalization is imminent -- multiple reporting cycles across 2024-2026 confirm no legislative change had been enacted as of this review, and the process has historically moved slowly',
    'Treating the Medical Cannabis Access Programme as a broad or commercially significant medical market -- it covers only three narrow, treatment-resistant conditions with consultant sign-off required, and total Ministerial Licence patient counts remain in the low dozens to low hundreds depending on the source',
    'Assuming CBD''s legal retail status means it can be marketed with medical claims -- CBD is not HPRA-listed as a medical product and cannot be formally prescribed, keeping it in a wellness/retail category distinct from the regulated MCAP pathway'
  ],
  'published',
  'high -- the current legal framework, MCAP structure, and 2025 customs seizure data are corroborated across Herb''s May 2026 guide, the official HPRA MCAP page, Cannigma, and Wikipedia; the exact Ministerial Licence patient count shows a source conflict (63 vs. 74 patients across different reporting windows) and is flagged rather than resolved; the Oireachtas Committee recommendation count also varies by source, likely reflecting different drafting stages of the same interim report',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme'),
  CURRENT_DATE, now()
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  difficulty = EXCLUDED.difficulty,
  typical_timeline_months = EXCLUDED.typical_timeline_months,
  estimated_cost_range = EXCLUDED.estimated_cost_range,
  legal_framework_summary = EXCLUDED.legal_framework_summary,
  steps = EXCLUDED.steps,
  key_regulators = EXCLUDED.key_regulators,
  common_pitfalls = EXCLUDED.common_pitfalls,
  status = EXCLUDED.status,
  confidence_label = EXCLUDED.confidence_label,
  source_id = EXCLUDED.source_id,
  last_reviewed = EXCLUDED.last_reviewed,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO public.market_metrics
  (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('LI', 'annual_cannabis_use_prevalence_rate', 8.6, 'percent', '2011-01-01', '2011-12-31', 'point_in_time', 'observed', 'low',
   'World Drug Report 2011 (via Wikipedia)', 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein', '2011-01-01',
   'UNODC-sourced figure; no more recent official prevalence estimate for Liechtenstein was located, so treat as dated background context'),
  ('LI', 'youth_easy_access_to_cannabis_rate', 44, 'percent', '2016-01-01', '2016-12-31', 'point_in_time', 'observed', 'medium',
   'Wikipedia -- Cannabis in Liechtenstein', 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein', '2025-04-07',
   'Share of surveyed 15-16-year-old students reporting easy access to cannabis'),

  ('TT', 'personal_possession_threshold_2019', 30, 'grams', '2019-12-23', '2019-12-23', 'point_in_time', 'observed', 'high',
   'nathuLAW -- Possession of cannabis decriminalised in Trinidad and Tobago',
   'https://nathulaw.com/possession-of-cannabis-decriminalised-in-trinidad-and-tobago/', '2019-12-23',
   'Decriminalized personal-possession ceiling under the Dangerous Drugs (Amendment) Act No. 24 of 2019; separate 5-gram ceiling applies to cannabis resin'),
  ('TT', 'corporate_license_local_ownership_requirement', 30, 'percent', '2022-06-23', '2022-06-23', 'point_in_time', 'observed', 'high',
   'Marijuana Moment -- Trinidad And Tobago Government Introduces Marijuana Reform Bills',
   'https://www.marijuanamoment.net/trinidad-and-tobago-government-introduces-marijuana-reform-bills/', '2019-11-25',
   'Minimum local/CARICOM-citizen control required for corporate licensees under the Cannabis Control Act, 2022, once proclaimed and operational'),
  ('TT', 'maximum_trafficking_fine', 3000000, 'TTD', '2019-12-23', '2026-12-31', 'point_in_time', 'observed', 'high',
   'Legal Aid and Advisory Authority (LAAA) -- The Decriminalization of Marijuana',
   'https://laaa.org.tt/news-and-events/148-the-decriminalization-of-marijuana-the-dos-and-donts', '2025-02-13',
   'Maximum fine on indictment for cannabis sale/trafficking (or 10x street value, whichever is greater), paired with potential life imprisonment'),

  ('GD', 'personal_possession_threshold_2026', 56, 'grams', '2026-02-20', '2026-02-20', 'point_in_time', 'observed', 'high',
   'International CBC -- Grenada Receives Governor-General Approval For Cannabis Reforms',
   'https://internationalcbc.com/grenada-receives-governor-general-approval-for-cannabis-reforms/', '2026-03-09',
   'Decriminalized possession ceiling for adults 21+ under the Drug Abuse (Prevention and Control) (Amendment) Act, 2026; separate 15-gram ceiling applies to cannabis resin'),
  ('GD', 'household_cultivation_plant_limit', 4, 'plants', '2026-02-20', '2026-02-20', 'point_in_time', 'observed', 'high',
   'NOW Grenada -- Draft Bill and Policy Statement for the Decriminalisation of Cannabis in Grenada',
   'https://nowgrenada.com/2026/01/draft-bill-and-policy-statement-for-the-decriminalisation-of-cannabis-in-grenada/', '2026-01-15',
   'Registered household cultivation limit for medicinal, therapeutic, or horticultural purposes'),
  ('GD', 'public_consumption_max_fine', 5000, 'XCD', '2026-02-20', '2026-02-20', 'point_in_time', 'observed', 'medium',
   'Herb -- How to Buy Weed in Grenada: 2026 Visitor Guide', 'https://herb.co/city-guides/buy-weed-grenada', '2026-06-08',
   'Alternative to a lower $300 fixed penalty for public consumption; currency assumed East Caribbean dollars (XCD) based on Grenada''s national currency, not explicitly specified in source'),

  ('IE', 'cannabis_customs_seizure_value_2025', 107000000, 'EUR', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high',
   'Herb -- How to Buy Weed in Ireland in 2026', 'https://herb.co/city-guides/buy-weed-ireland', '2026-05-14',
   'Total value of cannabis seized at Irish customs during 2025'),
  ('IE', 'cannabis_customs_seizure_from_us_2025', 46000000, 'EUR', '2025-01-01', '2025-12-31', 'annual', 'observed', 'medium',
   'Herb -- How to Buy Weed in Ireland in 2026', 'https://herb.co/city-guides/buy-weed-ireland', '2026-05-14',
   'Portion of the 2025 total customs seizure value reported as originating from the United States'),
  ('IE', 'mcap_ministerial_licence_patients', 63, 'patients', '2025-01-01', '2025-12-31', 'point_in_time', 'observed', 'low',
   'Cannigma -- Ireland Marijuana Laws 2026 (via Prohibition Partners)', 'https://cannigma.com/regulation/ireland-marijuana-laws/', '2026-02-17',
   'Patient count under the broader Ministerial Licence route (any condition, Health Minister written approval); a separate report cites 74 patients over a 5-year window -- an unresolved cross-source conflict, flagged rather than resolved')
ON CONFLICT (country_iso2, metric_name, period_start, period_end) DO NOTHING;

INSERT INTO public.country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('LI', 'prohibition-risk-map', 'general',
   '["Liechtenstein has maintained full cannabis prohibition unchanged since 1983, with even industrial hemp banned since 2005", "No medical marijuana program exists, though Sativex and Epidiolex are available strictly by prescription", "CBD sits in an unresolved legal gray zone rather than an affirmatively legal category -- Liechtenstein is not bound by EU-level CBD rulings as a non-EU state", "The only organized reform push (2018) was explicitly and publicly rejected by the responsible government minister, and no reform initiative has followed since"]'::jsonb,
   'Read the Liechtenstein jurisdiction playbook -- static full prohibition with no active reform signal',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein')],
   'verified_secondary_source'),

  ('TT', 'market-access-strategy', 'investor_operator',
   '["Trinidad and Tobago has two distinct legal layers: 2019 decriminalization is fully in force today, while the 2022 Cannabis Control Act (commercial licensing) is enacted law but had not been proclaimed into force as of the most recent reporting", "The Cannabis Licensing Authority created by the 2022 Act does not yet exist as an operating body, so no commercial cultivation, processing, or dispensary licenses can currently be applied for", "Corporate license applicants will need at least 30% local (Trinidad and Tobago or CARICOM-citizen) control once licensing opens", "Selling cannabis in any amount remains a serious criminal offense today, regardless of the 2019 decriminalization of personal possession"]'::jsonb,
   'Read the Trinidad and Tobago jurisdiction playbook -- track proclamation status before assuming any commercial licence is open',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.ttparliament.org/publication/the-cannabis-control-act-2022/')],
   'verified_secondary_source'),

  ('GD', 'market-access-strategy', 'investor_operator',
   '["Grenada enacted the Drug Abuse (Prevention and Control) (Amendment) Act, 2026 in February 2026, decriminalizing possession (56g/15g resin) for adults 21+ and permitting registered 4-plant household cultivation", "The Act explicitly does not create a recreational commercial market -- both the Health Minister and Attorney General were clear that retail sale remains prohibited", "Government committed to publishing a national commercial/medical cannabis policy framework within 3-6 months of January 2026, but as of the most recent reporting (June 2026) no licensed dispensaries were confirmed operating", "A distinct Rastafari sacramental-use framework allows Ministerial authorization for cultivation on designated lands and at registered places of worship"]'::jsonb,
   'Read the Grenada jurisdiction playbook -- decriminalization is live, but the commercial licensing framework is still pending',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabiscommission.gov.gd/')],
   'verified_secondary_source'),

  ('IE', 'patient-access-pathways', 'patient_general',
   '["Cannabis remains fully illegal in Ireland for recreational use; medical access runs only through the narrow Medical Cannabis Access Programme (MCAP), covering three treatment-resistant conditions after standard treatments have failed", "A separate Ministerial Licence route allows any-condition prescribing with the Health Minister''s written approval, but has reached only a small number of patients", "In April 2026, the government launched a formal review of MCAP eligibility, led by Professor Shane Allwright -- an active, unresolved process as of this review", "Strong reform momentum exists (Citizens'' Assembly, Oireachtas Committee recommendations favoring decriminalization and a Germany/Malta-style social club model) but none of it had been enacted into law as of the most recent reporting"]'::jsonb,
   'Read the Ireland jurisdiction playbook for the full MCAP eligibility criteria and the pending eligibility review',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme')],
   'verified_secondary_source')
ON CONFLICT (country_iso2, module_key, role_id) DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('LI','TT','GD','IE');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711113521','batch_12_playbooks_metrics_overlay_li_tt_gd_ie','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711113521_batch_12_playbooks_metrics_overlay_li_tt_gd_ie.sql

-- RECOVERY BEGIN 20260711160935_fix_security_definer_view_regression_15_views.sql
-- This exact class of bug has now regressed at least 4 times:
-- 20260622151411_fix_security_definer_views_to_invoker,
-- 20260701001549_fix_api_schema_views_rls_bypass,
-- 20260709092127_fix_security_definer_views_api_schema,
-- 20260710190000_fix_security_definer_view_bypass_18_views. It keeps
-- coming back because api.* views are created with plain
-- `CREATE OR REPLACE VIEW api.x AS SELECT * FROM public.x`, and
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to
-- its default (security_invoker = false) -- so a later, unrelated edit
-- to a view silently reopens every RLS policy on the underlying table.
--
-- Found via get_advisors (security, ERROR level) flagging 15 api.* views
-- with this property. Confirmed live (pg_class.reloptions, pg_policy,
-- information_schema.role_table_grants) immediately before this
-- migration: view owner is `postgres`, which has BYPASSRLS, so every one
-- of these views was returning ALL rows to any caller with view-level
-- SELECT, regardless of the real RLS policy on the underlying table.
--
-- Currently exploitable (authenticated/anon already had view-level
-- SELECT; base table has a real, restrictive RLS policy underneath):
--   dossiers            -- confidential dossier metadata incl. file_path/
--                           drive_file_id; real policy is admin/operator
--                           only, any authenticated user could read all
--   hv_claims, hv_facilities, hv_licences, hv_passports,
--   hv_passport_scores   -- cross-org compliance/verification/licensing
--                           data; real policy is org-member-or-staff only,
--                           any authenticated user could read every org's
--   matches              -- includes internal_notes; real policy is
--                           admin/operator only, any authenticated user
--                           could read every match on the platform
--   workspaces           -- legal_name/verification_status/etc; real
--                           policy is admin/operator only, any
--                           authenticated user could read every workspace
--   user_dashboard_preferences -- real policy is auth.uid() = user_id;
--                           any authenticated user could read/write any
--                           other user's dashboard preferences
--   buyer_requests, marketplace_item_images -- real policy restricts to
--                           approved/public rows; anon+authenticated
--                           could read unapproved/unmoderated rows too
--
-- Not currently exploitable, fixed for consistency (RLS policy already
-- `true` / fully public by design):
--   clinical_education_country_readiness, clinical_education_modules,
--   watchlist_collections, watchlist_collection_signals

alter view api.hv_claims set (security_invoker = true);
alter view api.clinical_education_country_readiness set (security_invoker = true);
alter view api.clinical_education_modules set (security_invoker = true);
alter view api.watchlist_collections set (security_invoker = true);
alter view api.watchlist_collection_signals set (security_invoker = true);
alter view api.dossiers set (security_invoker = true);
alter view api.user_dashboard_preferences set (security_invoker = true);
alter view api.buyer_requests set (security_invoker = true);
alter view api.marketplace_item_images set (security_invoker = true);
alter view api.matches set (security_invoker = true);
alter view api.workspaces set (security_invoker = true);
alter view api.hv_passports set (security_invoker = true);
alter view api.hv_facilities set (security_invoker = true);
alter view api.hv_licences set (security_invoker = true);
alter view api.hv_passport_scores set (security_invoker = true);

-- Companion grants so RLS gets a chance to evaluate instead of a hard
-- permission-denied at the coarser GRANT check. Every grant below
-- mirrors a privilege the view itself already exposed to that role --
-- this does not widen which rows are visible or add a new capability,
-- it makes the pre-existing, nominal grant enforceable through RLS
-- instead of bypassed entirely. The real restriction (org membership via
-- hv_is_org_member(), admin/operator role, auth.uid() = user_id, or
-- approved/public status) still applies underneath every grant here.
grant insert, select, update on public.hv_claims to authenticated;
grant insert, select, update on public.hv_facilities to authenticated;
grant insert, select, update on public.hv_licences to authenticated;
grant insert, select, update on public.hv_passports to authenticated;
grant insert, select, update on public.hv_passport_scores to authenticated;
grant select on public.dossiers to authenticated;
grant select on public.matches to authenticated;
grant insert, select, update on public.workspaces to authenticated;
grant insert, select, update, delete on public.user_dashboard_preferences to authenticated;
grant select on public.marketplace_item_images to anon, authenticated;
grant insert on public.buyer_requests to authenticated;

-- Known follow-up, not addressed here: INSERT/UPDATE/DELETE grants above
-- were mirrored 1:1 from each view's existing grant set without auditing
-- whether the app actually writes through these api.* views (vs. a
-- service-role path). Worth a direct check before assuming this is the
-- live write path for any of these tables.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711160935','fix_security_definer_view_regression_15_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711160935_fix_security_definer_view_regression_15_views.sql

-- RECOVERY BEGIN 20260711163645_fix_security_definer_regulatory_tier_review_queue.sql
-- Same bug class as 20260711160935_fix_security_definer_view_regression_15_views:
-- api.regulatory_tier_review_queue was flagged by get_advisors (security, ERROR)
-- with security_invoker missing, moments after that fix was applied -- confirms
-- this is an actively live, actively recurring pattern, not a one-time cleanup.
--
-- Lower severity than the prior 15: both underlying tables (countries,
-- cc_jurisdiction_briefings) already have a fully public RLS read policy
-- (`true` for anon+authenticated) and already have base-table SELECT grants,
-- so this view wasn't leaking anything beyond what's already public data.
-- Fixed anyway for consistency with the ERROR-level advisor finding and to
-- stop this specific instance from being mistaken for a real leak later.
-- No companion grant needed -- both base tables already grant anon+authenticated
-- SELECT.

alter view api.regulatory_tier_review_queue set (security_invoker = true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711163645','fix_security_definer_regulatory_tier_review_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711163645_fix_security_definer_regulatory_tier_review_queue.sql

-- RECOVERY BEGIN 20260711170000_fix_regulatory_tier_rpc_missing_authz.sql
-- Security fix: api.set_regulatory_tier and api.accept_classifier_tier were
-- SECURITY DEFINER functions with no internal authorization check, callable by
-- any `authenticated` role via PostgREST RPC. Any signed-in user could
-- arbitrarily override a country's compliance regulatory_tier classification.
-- Found via a live advisors scan (authenticated_security_definer_function_executable),
-- 2026-07-11. Applied directly to production the same day (Tyler approved) --
-- this file reconciles the migration ledger with what is now actually live.
--
-- Fix: admin-only guard, matching the existing is_genetics_admin_or_reviewer()
-- pattern in this schema (user_roles.role = 'admin', keyed on auth.uid()).
-- api.get_corridor_stats is intentionally left untouched -- it is read-only and
-- was already assessed as lower severity (also flagged by the advisor scan, but
-- as a data-exposure question, not a write/privilege-escalation one).

create or replace function public.is_regulatory_tier_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
  );
$$;

create or replace function api.accept_classifier_tier(p_iso text, p_actor text default 'agent'::text)
returns countries
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
  v_new text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  select * into v_old from public.countries where iso_alpha2=p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';
  v_new := api.derive_regulatory_tier(v_ps);

  update public.countries set
    regulatory_tier = coalesce(v_new, regulatory_tier),
    regulatory_tier_origin = 'auto',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'classifier-accepted ('||p_actor||') '||to_char(now(),'YYYY-MM-DD')
  where iso_alpha2=p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, coalesce(v_new,v_old.regulatory_tier), 'auto', 'manual', v_ps, p_actor, 'Accepted classifier suggestion');

  return v_row;
end;
$$;

create or replace function api.set_regulatory_tier(p_iso text, p_tier text, p_actor text default 'agent'::text, p_note text default null::text)
returns countries
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'reviewed override ('||p_actor||') '||to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor, coalesce(p_note,'Manual override via set_regulatory_tier'));

  return v_row;
end;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260711170000','fix_regulatory_tier_rpc_missing_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260711170000_fix_regulatory_tier_rpc_missing_authz.sql

-- RECOVERY BEGIN 20260712070059_fix_regulatory_tier_rpc_missing_authz.sql
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
-- version 20260712070059.
--
-- Rewriting this file cannot affect production: 20260712070059 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Security fix: api.set_regulatory_tier and api.accept_classifier_tier were
-- SECURITY DEFINER functions with no internal authorization check, callable by
-- any `authenticated` role via PostgREST RPC. Any signed-in user could
-- arbitrarily override a country's compliance regulatory_tier classification.
-- Found via a live advisors scan (authenticated_security_definer_function_executable),
-- 2026-07-11.
--
-- Fix: admin-only guard, matching the existing is_genetics_admin_or_reviewer()
-- pattern in this schema (user_roles.role = 'admin', keyed on auth.uid()).
-- api.get_corridor_stats is intentionally left untouched -- it is read-only and
-- was already assessed as lower severity.

create or replace function public.is_regulatory_tier_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
  );
$$;

create or replace function api.accept_classifier_tier(p_iso text, p_actor text default 'agent'::text)
returns countries
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
  v_new text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  select * into v_old from public.countries where iso_alpha2=p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';
  v_new := api.derive_regulatory_tier(v_ps);

  update public.countries set
    regulatory_tier = coalesce(v_new, regulatory_tier),
    regulatory_tier_origin = 'auto',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'classifier-accepted ('||p_actor||') '||to_char(now(),'YYYY-MM-DD')
  where iso_alpha2=p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, coalesce(v_new,v_old.regulatory_tier), 'auto', 'manual', v_ps, p_actor, 'Accepted classifier suggestion');

  return v_row;
end;
$$;

create or replace function api.set_regulatory_tier(p_iso text, p_tier text, p_actor text default 'agent'::text, p_note text default null::text)
returns countries
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'reviewed override ('||p_actor||') '||to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor, coalesce(p_note,'Manual override via set_regulatory_tier'));

  return v_row;
end;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260712070059','fix_regulatory_tier_rpc_missing_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260712070059_fix_regulatory_tier_rpc_missing_authz.sql

-- RECOVERY BEGIN 20260712070915_insert_test_snapshot_v3_fallback.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- Production no longer depends on the legacy snapshot_hash column, while a
-- zero-state repository replay still carries snapshot_hash NOT NULL from the
-- earlier source_snapshots contract. The deterministic hash below is therefore
-- a replay-only compatibility value. The historical fixture source was also
-- transient and is no longer present in production; preserve the original test
-- insert only when that parent source exists instead of inventing source data.
--
-- Rewriting this file cannot affect production: 20260712070915 is already
-- recorded in schema_migrations, so production migration execution skips it.

INSERT INTO public.source_snapshots (
  source_id,
  snapshot_hash,
  captured_url,
  captured_title,
  captured_text,
  fetch_status,
  language_detected,
  processing_status,
  signal_candidates
)
SELECT
  source.id,
  md5('20260712070915:https://www.theguardian.com/world/2026/jul/11/thailand-cannabis-3tier-test'),
  'https://www.theguardian.com/world/2026/jul/11/thailand-cannabis-3tier-test',
  'TEST: Thailand cannabis inspection order v3',
  'Thailand''s Ministry of Public Health tightened inspections of licensed cannabis farms this week following seizures of Thai-grown cannabis in the UK, Germany, Indonesia and Hong Kong.',
  'success',
  'en',
  'pending',
  NULL
FROM public.source_registry source
WHERE source.id = '431f3158-b037-471c-8ae7-af55efc8ea35'
RETURNING id;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260712070915','insert_test_snapshot_v3_fallback','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260712070915_insert_test_snapshot_v3_fallback.sql

-- RECOVERY BEGIN 20260712070954_cleanup_v3_fallback_test.sql
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
-- version 20260712070954.
--
-- Rewriting this file cannot affect production: 20260712070954 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


DELETE FROM editorial_items WHERE snapshot_id = '854ef022-6f43-42cf-bf42-01ee4ae7339e';
DELETE FROM source_snapshots WHERE id = '854ef022-6f43-42cf-bf42-01ee4ae7339e';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260712070954','cleanup_v3_fallback_test','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260712070954_cleanup_v3_fallback_test.sql
