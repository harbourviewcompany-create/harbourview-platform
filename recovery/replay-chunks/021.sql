
-- RECOVERY BEGIN 20260902220000_tighten_regulatory_signals_grants_to_intended_scope.sql
-- Follow-up to 20260829181346_fix_regulatory_signals_missing_grants.sql
-- (renamed from 20260830000000 by #1701).
--
-- Live inspection (2026-08-31) found anon and authenticated both holding
-- INSERT, UPDATE, and DELETE on regulatory_signals.sources and
-- regulatory_signals.source_snapshots. Before writing a blanket revoke,
-- checked every migration in this repository's history that touches
-- either table's grants (schema_migrations.statements holds the real,
-- complete SQL for every applied migration -- see below), to avoid
-- reverting something intentional:
--
--   20260613040315_fresh_regulatory_sources_engine.sql grants authenticated
--   (not anon) SELECT/INSERT/UPDATE/DELETE on source_snapshots
--   specifically, deliberately, alongside its own dedicated policy
--   (regulatory_source_snapshots_admin_operator_only, for all to
--   authenticated, admin/operator check) as the enforcement mechanism.
--   That grant is real, intentional, and load-bearing: PostgREST writes
--   as `authenticated`, and Postgres requires both grant-level
--   permission and RLS policy passage -- revoking the grant would break
--   every legitimate admin/operator source-snapshot write, not just
--   close a hygiene gap. This migration does not touch it.
--
--   20260829181346_fix_regulatory_signals_missing_grants.sql grants
--   anon and authenticated SELECT only, on both tables -- nothing else,
--   for either role, on either table, anywhere else in this
--   repository's migration history.
--
-- So exactly three of the four excess privilege grants found live are
-- genuinely unaccounted for and safe to revoke; the fourth
-- (authenticated + source_snapshots: INSERT/UPDATE/DELETE) is
-- deliberately excluded, not overlooked.
--
-- Confirmed inert before writing this, same as the excluded case is
-- confirmed load-bearing: RLS is enabled on both tables
-- (relrowsecurity = true), and neither table's policy names anon in its
-- roles list. Revoking anon's write privileges and authenticated's
-- write privileges on `sources` specifically changes no currently
-- observable query result for any role -- RLS already fully enforces
-- the intended boundary in both cases. This closes the gap between
-- "enforced" and "granted" so a future change to either policy's USING
-- clause doesn't silently inherit write access nobody meant to give it.

revoke insert, update, delete on regulatory_signals.sources from anon, authenticated;
revoke insert, update, delete on regulatory_signals.source_snapshots from anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260902220000','tighten_regulatory_signals_grants_to_intended_scope','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260902220000_tighten_regulatory_signals_grants_to_intended_scope.sql

-- RECOVERY BEGIN 20260903100000_make_supply_catalog_globally_available.sql
-- Sets target_countries to all ~195 ISO2 country codes for every
-- Harbourview-direct supply catalog SKU. This is a DISPLAY/DISCOVERABILITY
-- change per explicit product instruction ("every country should see and
-- have access to everything available in the marketplace") -- it does NOT
-- assert that any specific SKU is compliant to ship as-is into every one
-- of those countries. Actual export/import legality is still verified at
-- quote-review time by a human, the same way it already worked for the
-- single-country (CA-only) items before this change -- this migration
-- widens visibility, not automated fulfillment.
--
-- compliance_flags are UNCHANGED by this migration -- CA packaging items
-- still only carry CA-specific compliance metadata (CSA Z76.1, plain
-- packaging, etc.). No new per-country compliance claims are made here.
--
-- Production apply: operator-authorized. Reconciled 2026-09-10 -- the data was
-- already in the exact target state (92/92 rows, identical 195-element array), so
-- only the missing ledger row was recorded at this version. See docs/control/EVIDENCE_LOG.md.

update public.listings
set target_countries = array[
'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','YE','ZM','ZW'
]
where sold_by_harbourview = true;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260903100000','make_supply_catalog_globally_available','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260903100000_make_supply_catalog_globally_available.sql

-- RECOVERY BEGIN 20260903103515_create_country_cannabis_legal_status_reference.sql
-- Reconstructed from production. Verbatim statements for version 20260903103515.
--
-- Production applied this table creation on 2026-09-03 via Supabase MCP, which
-- writes a supabase_migrations.schema_migrations row and no repository file.
-- PR #1755 originally carried the same DDL under an invented version
-- (20260903100100), combined with the seed below. That would have left the
-- repository permanently out of correspondence with the live ledger in both
-- directions: two applied-not-committed versions in production and two
-- committed-not-applied versions here.
--
-- Committed at the real version instead. Body is byte-identical to
-- schema_migrations.statements[1] (1,199 bytes, md5
-- 11a093d94e6666ebd5cb890947dcf1e9), verified before write. Rewriting this file
-- cannot affect production: 20260903103515 is already recorded, so
-- `supabase db push` skips it.

create table if not exists public.country_cannabis_legal_status (
  iso2 text primary key,
  country_name text not null,
  legal_status text not null check (legal_status in (
    'recreational_retail',      -- true commercial recreational retail market
    'recreational_noncommercial', -- personal possession/home-grow/social clubs, no open retail
    'medical_only',              -- prescription-based medical program
    'cbd_hemp_only',              -- only low-THC/CBD products permitted
    'prohibited',                 -- cannabis illegal, no legal framework
    'unresearched'                -- not yet individually verified this pass
  )),
  notes text,
  last_reviewed date not null default current_date
);

comment on table public.country_cannabis_legal_status is
  'Country-level cannabis legal framework classification (NOT per-SKU packaging compliance -- see listings.compliance_flags for that, which currently only exists for CA). Populated from a general research pass, not individually verified per-country the way CA/DE/AU packaging rules were. Most of the ~195 ISO2 codes not present here default to unresearched in application logic, not assumed-prohibited or assumed-legal.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260903103515','create_country_cannabis_legal_status_reference','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260903103515_create_country_cannabis_legal_status_reference.sql

-- RECOVERY BEGIN 20260903103549_seed_country_cannabis_legal_status_known_markets.sql
-- Reconstructed from production. Verbatim statements for version 20260903103549.
--
-- The country legal-status seed, applied to production on 2026-09-03. See the
-- companion 20260903103515 for why this is committed at the live version rather
-- than the invented one PR #1755 proposed.
--
-- Scope disclosure, unchanged from the applied text: this is a general research
-- pass covering 41 of ~195 ISO2 codes, not an individually-verified audit.
-- Countries absent from this table are `unresearched`, not assumed legal and
-- not assumed prohibited. It is country-level legal framework only -- NOT
-- per-SKU packaging compliance, which lives in listings.compliance_flags and
-- currently has individually-researched content for CA only.
--
-- Body is byte-identical to schema_migrations.statements[1] (6,017 bytes, md5
-- 7d34b95fd49687d65011d96ea941ae89), verified before write. Committing already
-- applied SQL is a repository-fidelity action; it makes no new compliance claim.

insert into public.country_cannabis_legal_status (iso2, country_name, legal_status, notes) values
-- Full commercial recreational retail
('CA','Canada','recreational_retail','Federally legal commercial recreational market since 2018.'),
('UY','Uruguay','recreational_retail','First country to fully legalize commercial recreational cannabis (2013).'),
('US','United States','recreational_retail','Federal law still prohibits cannabis; state-by-state patchwork -- recreational retail legal in 24 states + DC as of 2026, medical-only or fully illegal elsewhere. Treat as mixed, not uniformly legal.'),
-- Recreational legal but non-commercial (possession/home-grow/social clubs only)
('DE','Germany','recreational_noncommercial','Personal possession, home cultivation, and non-profit Cannabis Social Clubs legal since 2024; no commercial retail market yet (Pillar 2 pilot still pending as of 2026).'),
('MT','Malta','recreational_noncommercial','Personal possession and home cultivation legal; non-profit associations distribute, no commercial retail.'),
('LU','Luxembourg','recreational_noncommercial','Adults may grow up to 4 plants at home and possess small amounts; commercial sales remain prohibited.'),
('CZ','Czechia','recreational_noncommercial','Personal possession and home cultivation (up to 3 plants) legal since Jan 2026; commercial sales prohibited.'),
('ZA','South Africa','recreational_noncommercial','Constitutional Court ruling permits private personal use and cultivation; commercial sale remains prohibited.'),
('GE','Georgia','recreational_noncommercial','Constitutional Court rulings mean personal consumption is not punished, but cultivation/sale remain restricted.'),
('NL','Netherlands','recreational_noncommercial','Sale tolerated at licensed coffeeshops under a policy of non-enforcement, not full legalization; legal grey area, not a licensed retail framework.'),
-- Medical-only, prescription-based programs
('AU','Australia','medical_only','TGA-regulated medical cannabis nationwide; no legal recreational retail channel anywhere in the country.'),
('GB','United Kingdom','medical_only','Prescription-only medical cannabis program; recreational use illegal.'),
('IL','Israel','medical_only','Established medical cannabis program; recreational decriminalized for personal use in some contexts but not a commercial retail market.'),
('TH','Thailand','medical_only','Medical cannabis framework with a complex, still-evolving recreational grey period; treat as medical-only pending clearer verification.'),
('AR','Argentina','medical_only','Medical cannabis and patient home cultivation permitted via registration; no recreational retail.'),
('BR','Brazil','medical_only','Medical cannabis products available by prescription/import authorization; some home-grow permitted by court order; no recreational retail.'),
('CL','Chile','medical_only','Medical use with prescription permitted; private personal use tolerated; commercial sale not legal.'),
('CO','Colombia','medical_only','Medical cannabis legal and a significant licensed medical-export industry exists; recreational retail not legal.'),
('CR','Costa Rica','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('EC','Ecuador','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('HR','Croatia','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('CY','Cyprus','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('FI','Finland','medical_only','Medical cannabis legal by prescription; recreational use not legal.'),
('FR','France','medical_only','Medical cannabis program being generalized after a national trial; recreational use not legal.'),
('PL','Poland','medical_only','Prescription-based medical cannabis program; recreational use not legal.'),
('PT','Portugal','medical_only','Medical cannabis legal by prescription; personal possession of small amounts decriminalized (not the same as legalized) since 2001; recreational sale not legal.'),
('DK','Denmark','medical_only','Medical cannabis pilot/permanent program; recreational use not legal.'),
('JM','Jamaica','medical_only','Decriminalized small amounts and sacramental/medical use since 2015, with a licensed medical industry; full recreational retail not legal.'),
('LS','Lesotho','medical_only','First African nation to license cannabis cultivation (2017), medical/export-oriented; recreational use not legal.'),
('MX','Mexico','medical_only','Supreme Court ruled prohibition unconstitutional for personal adult use/cultivation (2021), but a regulated commercial framework has not been fully implemented; treat as personal-use tolerated, not commercial-legal.'),
-- CBD/hemp-only
('CH','Switzerland','cbd_hemp_only','Low-THC (under ~1%) CBD products broadly legal and commercially sold; higher-THC cannabis remains restricted to a limited pilot-program framework.'),
-- Prohibited / no legal framework
('SG','Singapore','prohibited','Cannabis fully illegal with severe penalties.'),
('JP','Japan','prohibited','Cannabis use/possession illegal; CBD products with zero THC narrowly permitted.'),
('AE','United Arab Emirates','prohibited','Cannabis fully illegal with severe penalties.'),
('SA','Saudi Arabia','prohibited','Cannabis fully illegal with severe penalties.'),
('CN','China','prohibited','Cannabis fully illegal with severe penalties.'),
('RU','Russia','prohibited','Cannabis fully illegal.'),
('KR','South Korea','prohibited','Cannabis illegal domestically (medical cannabis law exists but is narrowly applied); treat as effectively prohibited for commercial purposes.'),
('ID','Indonesia','prohibited','Cannabis fully illegal with severe penalties.'),
('MY','Malaysia','prohibited','Cannabis fully illegal with severe penalties.'),
('PH','Philippines','prohibited','Cannabis fully illegal with severe penalties.')
on conflict (iso2) do nothing;

select count(*) as classified from public.country_cannabis_legal_status;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260903103549','seed_country_cannabis_legal_status_known_markets','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260903103549_seed_country_cannabis_legal_status_known_markets.sql

-- RECOVERY BEGIN 20260907015309_expose_verified_regulatory_tier_in_api_countries.sql
-- Expose the evidence-backed regulatory tier columns through api.countries.
--
-- The public globe colours Market Access from countries.verified_regulatory_tier
-- and fails closed unless tier + evidence key + verified_at + unexpired
-- expires_at all agree (lib/globe/supabaseGlobeData.ts). The browser client is
-- pinned to the `api` schema, so it reads api.countries -- which exposed the
-- legacy countries.regulatory_tier but none of those four columns. Every globe
-- request therefore failed with 42703 and the map rendered with no tier colour
-- at all, while 117 countries sat in public.countries with valid, unexpired,
-- evidence-backed tiers (earliest expiry 2027-03-01).
--
-- docs/control/REGULATORY_MARKET_ACCESS_LIVE_EFFECT_RECONCILIATION_20260831.md
-- already establishes that verified_regulatory_tier is "the only tier the public
-- globe may render", so this exposes nothing new in intent -- it lets the view
-- catch up with the contract the application was already written against.
--
-- No new privilege is granted. The view keeps security_invoker = true, so the
-- caller's own rights apply, and anon/authenticated already hold column-level
-- SELECT on all four columns of public.countries (verified live 2026-09-06).
-- Columns are appended in order so CREATE OR REPLACE VIEW is legal.

create or replace view api.countries
with (security_invoker = true) as
select
  id,
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  region,
  subregion,
  map_region_key,
  market_access_status,
  medical_status,
  adult_use_status,
  import_status,
  export_status,
  signals_status,
  opportunity_status,
  compliance_risk_status,
  education_status,
  marketplace_availability_status,
  public_summary,
  data_completeness,
  last_updated_label,
  created_at,
  updated_at,
  lat,
  lng,
  opportunity_categories,
  trade_roles,
  regulator_label,
  opportunity_score,
  regulatory_tier,
  verified_regulatory_tier,
  regulatory_tier_evidence_key,
  regulatory_tier_verified_at,
  regulatory_tier_expires_at
from public.countries;

comment on view api.countries is
  'Public country projection. Market Access colour must be read from verified_regulatory_tier (evidence-backed, expiring); regulatory_tier is legacy and must not be used for public colouring.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260907015309','expose_verified_regulatory_tier_in_api_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260907015309_expose_verified_regulatory_tier_in_api_countries.sql

-- RECOVERY BEGIN 20260907120000_market_access_evidence_tranche_two.sql
-- Market Access evidence tranche 2 — 18 previously-neutral national jurisdictions.
--
-- Sourcing bar for this tranche is recorded in
-- docs/control/REGULATORY_MARKET_ACCESS_EVIDENCE_TRANCHE_20260907.md and matches
-- the bar already used for the 51 US state rows in 20260831130000 (a named
-- authority plus a citable published source; primary regulator pages preferred,
-- recognised institutional and legal-practice sources accepted).
--
-- Tier follows what the cited source establishes, NOT countries.regulatory_tier.
-- Seven researched jurisdictions are deliberately omitted so they keep
-- publishing NULL (neutral): LB, SZ, RO, MU, PH, ME, FJ. Reasons are in the
-- control document. Omission is the fail-closed default and is intentional.

insert into public.regulatory_market_access_evidence
  (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('hv-mkt-al-20260907','AL','medical_limited_trade',
 'Law 61/2023 authorises licensed cultivation and processing of medical cannabis under a National Agency for Cannabis Control within the Ministry of Health, but licensed output is restricted to export and no domestic patient market is verified.',
 'Karanovic & Partners — Albania: Legalization of Cannabis for Medical and Industrial Purposes',
 'https://www.karanovicpartners.com/news/albania-legalization-of-cannabis-for-medical-and-industrial-purposes/',
 date '2023-07-21', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-bw-20260907','BW','legal_commercial_access',
 'The Cannabis Act 2025 and the Cannabis Regulations 2026 license cultivation, manufacture, transportation, import and export; the National Cannabis Control Authority began operating in March 2026 and pilot cultivation licences have been granted.',
 'Government of Botswana — Daily News',
 'https://dailynews.gov.bw/news-detail/88153',
 date '2026-01-12', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-cy-20260907','CY','medical_limited_trade',
 'The Drugs and Psychotropic Substances (Medical Cannabis) Regulations of 2019 legalise cultivation, production, import and export under Ministry of Health licence, but only a small initial licence round has run and no meaningful production industry has developed.',
 'Prohibition Partners — European Medical Cannabis Legislation Map: Cyprus',
 'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/cyprus/',
 date '2019-03-06', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-fr-20260907','FR','medical_limited_trade',
 'Medical cannabis remains available only through the ANSM-run national experimentation pending generalisation; prescribing is restricted to trained practitioners and defined indications, and the enabling texts for a general market are not yet published.',
 'Agence nationale de securite du medicament et des produits de sante (ANSM)',
 'https://ansm.sante.fr/dossiers-thematiques/cannabis-a-usage-medical/mise-en-place-de-lexperimentation-du-cannabis-medical',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-gh-20260907','GH','cbd_hemp_only',
 'Section 43 of the Narcotics Control Commission Act 2020 (Act 1019), as amended by Act 1100 and implemented by LI 2475, licenses cannabis cultivation only where THC does not exceed 0.3 per cent on a dry weight basis, for industrial or medicinal purposes. Recreational use is not authorised.',
 'Narcotics Control Commission (NACOC), Ghana',
 'https://www.ncc.gov.gh/2025/09/no-entity-authorised-to-facilitate-the-acquisition-of-cannabis-licences-nacoc/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-gy-20260907','GY','cbd_hemp_only',
 'The Industrial Hemp Act 2022 licenses cultivation of hemp at or below 0.3 per cent THC under a Guyana Industrial Hemp Regulatory Authority; no medical or adult-use cannabis framework exists.',
 'Harris Sliwoski — Canna Law Blog: International Hemp, Guyana Takes the Stage',
 'https://harris-sliwoski.com/cannalawblog/international-hemp-guyana-takes-the-stage/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-hr-20260907','HR','medical_limited_trade',
 'Croatia permits prescription access to cannabis-based preparations through pharmacies under Ministry of Health and HALMED authorisation, but no company has received full production or distribution authorisation and no commercial supply chain operates.',
 'Prohibition Partners — European Medical Cannabis Legislation Map: Croatia',
 'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/croatia/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ie-20260907','IE','medical_limited_trade',
 'The Medical Cannabis Access Programme allows prescribing for three refractory indications only, and there is no licensed domestic cultivation framework for high-THC cannabis.',
 'Health Products Regulatory Authority (HPRA), Ireland',
 'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-jm-20260907','JM','medical_limited_trade',
 'The Cannabis Licensing Authority licenses cultivation, processing, transport, retail and research for medical, therapeutic and scientific purposes under the 2015 Dangerous Drugs Act amendments; no lawful general commercial export pathway is established by this source.',
 'Cannabis Licensing Authority (CLA), Jamaica',
 'https://www.cla.org.jm/licence-information/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-jp-20260907','JP','medical_limited_trade',
 'The Cannabis Control Act as amended in December 2024 permits cannabis-derived medicines to be regulated and prescribed under the narcotics framework for the first time; commercial cultivation and cannabis trade remain closed.',
 'How Has Japan Cannabis Control Act Been Amended? — peer-reviewed, PubMed 40489340',
 'https://pubmed.ncbi.nlm.nih.gov/40489340/',
 date '2024-12-12', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ls-20260907','LS','legal_commercial_access',
 'Lesotho licenses medicinal cannabis cultivation, processing and export under the Drugs of Abuse (Cannabis) Regulations 2018 and its 2025 amendment, with Ministry of Health issued licences, export permits and an operating export trade.',
 'Lesotho National Development Corporation — Medicinal Cannabis',
 'https://lndc.org.ls/medicinal-cannabis/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ma-20260907','MA','legal_commercial_access',
 'Law 13-21 on the lawful uses of cannabis authorises ANRAC to license cultivation, processing, commercialisation, transport, import and export; cultivation is confined to the provinces of Al Hoceima, Chefchaouen and Taounate.',
 'Agence Nationale de Reglementation des Activites relatives au Cannabis (ANRAC), Morocco',
 'https://www.anrac.gov.ma/fr/loi1321/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-mw-20260907','MW','legal_commercial_access',
 'The Cannabis Regulation Act No. 6 of 2020 established the Cannabis Regulatory Authority, which licenses cultivation, processing, storage, sale, distribution and export; licences have been issued to multiple operators.',
 'Cannabis Regulatory Authority (CRA), Malawi',
 'https://www.cra.gov.mw/index.php/license-applications/guidelines',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-pa-20260907','PA','medical_limited_trade',
 'Law 242 of 2021, operationalised by Decree 25 of 16 January 2024, authorises Ministry of Health licences across seven categories including cultivation, import and export; a small number of operators are licensed and patient access remains limited.',
 'Library of Congress — Global Legal Monitor: Panama Medicinal Cannabis Law Enacted',
 'https://www.loc.gov/item/global-legal-monitor/2021-11-08/panama-medicinal-cannabis-law-enacted/',
 date '2024-01-16', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-th-20260907','TH','medical_limited_trade',
 'Cannabis flower is regulated as a controlled herb rather than a narcotic; since June 2025 all flower sales require a practitioner prescription, and from 2026 premises are restricted to medical facilities, pharmacies and licensed herbal retailers.',
 'Tilleke & Gibbins — Thailand New Cannabis Controls Impact Doctors, Dispensaries, and Growers',
 'https://www.tilleke.com/insights/thailands-new-cannabis-controls-impact-doctors-dispensaries-and-growers/',
 date '2025-06-26', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-tr-20260907','TR','medical_limited_trade',
 'A regulation published on 24 July 2025 brings production, licensing and sale of cannabis-derived medical products under Ministry of Health control with pharmacy-only sale; cultivation for pharmaceutical active ingredients requires a TMO certificate of competence and a Ministry of Agriculture and Forestry permit.',
 'CBC Law — New Regulation on Medical Products, Health and Support Products, and Personal Care Products Derived from Cannabis',
 'https://www.cbclaw.com.tr/en/new-regulation-on-medical-products-health-and-support-products-and-personal-care-products-derived-from-cannabis',
 date '2025-07-24', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ua-20260907','UA','medical_limited_trade',
 'Law 3528-IX came into force on 16 August 2024 and licensing conditions covering cultivation through import and export took effect on 1 December 2024; dispensing has begun but is currently limited to pharmacies of a single licensed entity.',
 'Ministry of Health of Ukraine',
 'https://moz.gov.ua/en/president-signed-the-law-on-the-circulation-of-medical-cannabis-in-ukraine',
 date '2024-08-16', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-vc-20260907','VC','medical_limited_trade',
 'The Medicinal Cannabis Industry Act 2018 established the Medicinal Cannabis Authority, which issues cultivation and research licences for medicinal purposes; first licences have been awarded.',
 'Medicinal Cannabis Authority (MCA), Saint Vincent and the Grenadines',
 'https://mca.vc/legislation/saint-vincent-and-the-grenadines-medicinal-cannabis-industry-act-2018/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00')

on conflict (evidence_key) do update set
  tier=excluded.tier, rationale=excluded.rationale, authority_name=excluded.authority_name,
  authority_url=excluded.authority_url, source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at, expires_at=excluded.expires_at, active=true;

select * from api.refresh_verified_market_access_tiers('market-access-evidence-tranche-two-20260907');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260907120000','market_access_evidence_tranche_two','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260907120000_market_access_evidence_tranche_two.sql

-- RECOVERY BEGIN 20260907140000_market_access_evidence_tranche_three.sql
-- Market Access evidence tranche 3 — 29 further national jurisdictions.
--
-- Same sourcing bar as tranche 2 and as the US state rows in 20260831130000.
-- Recorded in docs/control/REGULATORY_MARKET_ACCESS_EVIDENCE_TRANCHE_20260907.md.
--
-- This tranche deliberately includes `prohibited` rows. Before it, no jurisdiction
-- anywhere carried a published `prohibited` tier, so a closed market and an
-- unresearched one rendered identically neutral. Publishing prohibition where it
-- is sourced separates "closed" from "not yet assessed".
--
-- verified_at is backdated. The resolver requires verified_at <= now(); a
-- wall-clock time still in the future when the migration runs applies cleanly and
-- publishes nothing. See the tranche-2 defect note in the control document.

insert into public.regulatory_market_access_evidence
  (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
-- ── Licensed commercial pathways including cross-border trade ────────────────
('hv-mkt-zm-20260907','ZM','legal_commercial_access',
 'The Cannabis Act 2021 (Act 33) and Industrial Hemp Act 2021 (Act 34) license cultivation, manufacture, storage, distribution, import and export for medicinal, scientific and research purposes; the Zambia Medicines Regulatory Authority is lead agency on recommendation of the National Cannabis Coordinating Committee.',
 'Zambia Legal Information Institute — Cannabis Act, 2021',
 'https://zambialii.org/akn/zm/act/2021/33/eng@2021-05-20',
 date '2021-05-20', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-rw-20260907','RW','legal_commercial_access',
 'Ministerial Order No 003/MoH/2021 permits cultivation, processing, importation, export and use of cannabis for medical or research purposes under eight five-year licence types; export requires a NAEB licence tied to a verified foreign buyer in a jurisdiction where the product is lawful. Recreational use remains illegal.',
 'KT Press — Rwanda Moves Closer to Mass Production of Cannabis Following Approval of New Law',
 'https://www.ktpress.rw/2021/06/rwanda-moves-closer-to-mass-production-of-cannabis-following-approval-of-new-law/',
 date '2021-06-25', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-bb-20260907','BB','legal_commercial_access',
 'The Medicinal Cannabis Industry Act 2019 established the Barbados Medicinal Cannabis Licensing Authority, which grants eight licence categories including cultivator, processor, retail distributor, laboratory, research and development, import, export and transport.',
 'Barbados Medicinal Cannabis Licensing Authority (BMCLA)',
 'https://www.bmcla.bb/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-vu-20260907','VU','legal_commercial_access',
 'The Medical Cannabis and Industrial Hemp Act 2021, with regulations gazetted in 2023, licenses commercial cultivation and export; licences run ten years and cultivation is confined to named islands (medical cannabis to Efate, Santo and Malekula).',
 'Vanuatu Daily Post — Vanuatu Regulates Cultivation of Cannabis and Hemp',
 'https://www.dailypost.vu/news/vanuatu-regulates-cultivation-of-cannabis-and-hemp/article_9478f503-2a90-5cc7-9111-97c4a756ffa4.html',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

-- ── Regulated medical access, limited or no verified commercial trade ────────
('hv-mkt-ch-20260907','CH','medical_limited_trade',
 'Medical cannabis is available on prescription; since 1 August 2022 an exceptional FOPH authorisation is no longer required for cannabis at or above 1 per cent THC used for medical purposes. Non-medical supply remains confined to time-limited pilot trials.',
 'Chambers and Partners — Medical Cannabis & Psychedelic Medicines 2026: Switzerland',
 'https://practiceguides.chambers.com/practice-guides/medical-cannabis-psychedelic-medicines-2026/switzerland/trends-and-developments',
 date '2022-08-01', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-si-20260907','SI','medical_limited_trade',
 'Slovenia legalised medical cannabis in 2025 following the 2024 referendum; access is via regulated medical channels and no commercial adult-use market operates.',
 'Cannabis Europa — Medical Cannabis in Europe: Markets and Access Guide',
 'https://cannabis-europa.com/insights/medical-cannabis-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-lt-20260907','LT','medical_limited_trade',
 'Medical cannabis has been lawful since 2018, but the programme is narrow and has seen limited implementation; no commercial cultivation or trade pathway is verified.',
 'The Cannigma — Where is Cannabis Legal in Europe',
 'https://cannigma.com/where-cannabis-is-legal-in-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ar-20260907','AR','medical_limited_trade',
 'Decree 883/2020 allows prescribed patients to register with REPROCANN for cultivation, and the 2022 framework for the medical cannabis and hemp industry is overseen by ARICCAME. Permit policy was contested and revised during 2025.',
 'Biz Latin Hub — Medical Cannabis Regulations Across Latin America',
 'https://www.bizlatinhub.com/understanding-latin-american-cannabis-sector/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-cl-20260907','CL','medical_limited_trade',
 'Cannabis was removed from the hard-drug list in 2015, permitting pharmacy sale of authorised cannabis medicines; personal consumption in private is decriminalised and no commercial market operates.',
 'Biz Latin Hub — Medical Cannabis Regulations Across Latin America',
 'https://www.bizlatinhub.com/understanding-latin-american-cannabis-sector/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ec-20260907','EC','medical_limited_trade',
 'Medical cannabis was legalised in 2019 and therapeutic-use rules have since been updated; regulation of patient access and supply remains under active revision.',
 'Biz Latin Hub — Medical Cannabis Regulations Across Latin America',
 'https://www.bizlatinhub.com/understanding-latin-american-cannabis-sector/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-mx-20260907','MX','medical_limited_trade',
 'Mexico legalised medical cannabis in 2017 and approved implementing regulations in 2021; a general commercial market has not been established.',
 'Biz Latin Hub — Medical Cannabis Regulations Across Latin America',
 'https://www.bizlatinhub.com/understanding-latin-american-cannabis-sector/',
 date '2021-01-12', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-py-20260907','PY','medical_limited_trade',
 'Legislation passed in October 2019 permits import of cannabis seed and cultivation for medical use; the first medical cannabis production licences were awarded to twelve companies in February 2020.',
 'Biz Latin Hub — Medical Cannabis Regulations Across Latin America',
 'https://www.bizlatinhub.com/understanding-latin-american-cannabis-sector/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-lk-20260907','LK','medical_limited_trade',
 'Cannabis is unlawful for recreational or general medicinal use except as administered within Ayurvedic treatment; the state began cultivating medical cannabis for export in 2018.',
 'The Cannigma — Where is Cannabis Legal in Asia',
 'https://cannigma.com/where-cannabis-is-legal-in-asia/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-tt-20260907','TT','medical_limited_trade',
 'The Cannabis Control Act, 2022 (Act No. 10 of 2022) established the Trinidad and Tobago Cannabis Licensing Authority to license cultivation, import and sale, including hemp; adult possession of small quantities was decriminalised in 2019.',
 'Parliament of the Republic of Trinidad and Tobago — The Cannabis Control Act, 2022',
 'https://www.ttparliament.org/wp-content/uploads/2020/10/a2022-10.pdf',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-kn-20260907','KN','medical_limited_trade',
 'The Cannabis Act 2020 established a Medicinal Cannabis Authority regulating licensed cultivation, processing, research and supply for medicinal use; the licensing Parts III to VII were brought into operation on 20 April 2024.',
 'Cannabis Regulations — Saint Kitts and Nevis country legality',
 'https://www.cannabisregulations.ai/country-legality/saint-kitts-and-nevis-marijuana',
 date '2024-04-20', timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

-- ── Lawful access confined to hemp / low-THC pathways ────────────────────────
('hv-mkt-cn-20260907','CN','cbd_hemp_only',
 'Cannabis is a Category I narcotic with no recreational or medical exception anywhere in mainland China, while licensed industrial hemp cultivation operates at provincial level and is among the largest such sectors globally.',
 'The Cannigma — Where is Cannabis Legal in Asia',
 'https://cannigma.com/where-cannabis-is-legal-in-asia/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-in-20260907','IN','cbd_hemp_only',
 'The NDPS Act 1985 bans cannabis cultivation but section 14 permits licensed cultivation for fibre, seed, horticulture or medical research; Uttarakhand, Uttar Pradesh, Madhya Pradesh and Himachal Pradesh license low-THC industrial hemp. Bhang falls outside the Act definition of cannabis. No general commercial market exists.',
 'Drug Law India — Legal Status of Cannabis, Ganja and Bhang under the NDPS Act',
 'https://druglawindia.com/law/ndps/legal-status-of-cannabis-ganja-bhang-india-ndps-jatin-case/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

-- ── Prohibited: no lawful medical or commercial pathway ──────────────────────
('hv-mkt-bg-20260907','BG','prohibited',
 'Neither medical nor recreational cannabis is lawful in Bulgaria and patients have no route to cannabis for medical use.',
 'CMS Expert Guides — Cannabis law and legislation in Bulgaria',
 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bulgaria',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-sk-20260907','SK','prohibited',
 'It is not permitted to grow, import or sell cannabis for medical use in Slovakia; no regulatory framework allows its prescription or sale.',
 'CMS Expert Guides — Cannabis law and legislation in Slovakia',
 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/slovakia',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-hu-20260907','HU','prohibited',
 'Hungary places cannabis in the same statutory category as heroin and operates the strictest cannabis regime in the European Union; sanctions were further tightened by constitutional amendment in March 2025.',
 'The Cannex — Cannabis Laws in Europe: Legal Status, Penalties and Outlook by Country',
 'https://thecannex.com/cannabis-laws-europe-country-guide/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-se-20260907','SE','prohibited',
 'Cannabis is unlawful in Sweden for all purposes, including most medical purposes, and possession of even small amounts is a criminal offence.',
 'The Cannigma — Where is Cannabis Legal in Europe',
 'https://cannigma.com/where-cannabis-is-legal-in-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ru-20260907','RU','prohibited',
 'Cannabis is unlawful in Russia for both medical and recreational use, with no legal medical exception.',
 'The Cannigma — Where is Cannabis Legal in Europe',
 'https://cannigma.com/where-cannabis-is-legal-in-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-by-20260907','BY','prohibited',
 'Belarus draws no distinction between cannabis and hemp and permits no medical use; possession, use, sale and distribution are all unlawful.',
 'The Cannigma — Where is Cannabis Legal in Europe',
 'https://cannigma.com/where-cannabis-is-legal-in-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-rs-20260907','RS','prohibited',
 'Serbia moved toward a medical cannabis framework and then reversed; cannabis remains unlawful and possession for personal use is punishable by imprisonment.',
 'The Cannigma — Where is Cannabis Legal in Europe',
 'https://cannigma.com/where-cannabis-is-legal-in-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-md-20260907','MD','prohibited',
 'Cannabis is lawful in Moldova for neither recreational nor medical use; personal consumption is an administrative rather than criminal offence, which does not create a supply pathway.',
 'The Cannigma — Where is Cannabis Legal in Europe',
 'https://cannigma.com/where-cannabis-is-legal-in-europe/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-sg-20260907','SG','prohibited',
 'Singapore operates a zero-tolerance regime under the Misuse of Drugs Act with no medical exception; trafficking above 500 grams of cannabis attracts the mandatory death penalty.',
 'The Cannigma — Where is Cannabis Legal in Asia',
 'https://cannigma.com/where-cannabis-is-legal-in-asia/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ng-20260907','NG','prohibited',
 'Both medical and recreational cannabis are unlawful in Nigeria; proposals for licensed medicinal and industrial cultivation have been floated but no framework is in force.',
 'The Cannigma — Where Cannabis is Legal in Africa',
 'https://cannigma.com/where-cannabis-is-legal-in-africa/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-ke-20260907','KE','prohibited',
 'Recreational and medical cannabis are both unlawful in Kenya; legalisation remains a matter of public debate rather than enacted law.',
 'The Cannigma — Where Cannabis is Legal in Africa',
 'https://cannigma.com/where-cannabis-is-legal-in-africa/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00'),

('hv-mkt-tz-20260907','TZ','prohibited',
 'Cannabis is unlawful in Tanzania for medical and recreational purposes alike.',
 'The Cannigma — Where Cannabis is Legal in Africa',
 'https://cannigma.com/where-cannabis-is-legal-in-africa/',
 null, timestamptz '2026-09-07 00:05:00+00', timestamptz '2027-09-07 00:00:00+00')

on conflict (evidence_key) do update set
  tier=excluded.tier, rationale=excluded.rationale, authority_name=excluded.authority_name,
  authority_url=excluded.authority_url, source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at, expires_at=excluded.expires_at, active=true;

select * from api.refresh_verified_market_access_tiers('market-access-evidence-tranche-three-20260907');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260907140000','market_access_evidence_tranche_three','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260907140000_market_access_evidence_tranche_three.sql

-- RECOVERY BEGIN 20260908182816_gemini_multi_key_infrastructure.sql
-- Reconstructed from production. Applied 2026-08-31 via a branch/PR that was
-- never merged (claude/gemini-multi-key-and-fallback-fixes-20260831,
-- no PR opened) -- the SQL ran directly against production and was
-- confirmed live function-for-function against this exact text, but never
-- got a tracked migration version at the time.
--
-- Re-applied via apply_migration on 2026-09-08 (idempotent -- CREATE OR
-- REPLACE / IF NOT EXISTS throughout, verified byte-identical to what was
-- already live before re-applying) so this version is now properly
-- tracked in supabase_migrations.schema_migrations, matching this file's
-- name.
--
-- Gemini multi-key rotation, cooldown-aware selection, and a shared
-- key-fetch RPC. Built in response to OpenAI and Anthropic both being
-- billing-blocked (OpenAI ran out ~Aug 7; Anthropic/Gemini deliberately
-- left unfunded since 2026-07-21 per Tyler, pending the product making
-- money). A free-tier Gemini key was wired in as the fallback tier across
-- every LLM-dependent pipeline; a second free-tier key was added shortly
-- after to roughly double effective daily headroom.
--
-- NOTE: the actual key VALUES were added directly via Vault
-- (vault.create_secret / vault.update_secret) out of band -- never
-- committed to git. Re-running this migration on a fresh environment
-- creates the correct structure, but gemini_api_key and gemini_api_key_b
-- must be populated in Vault separately before anything Gemini-dependent
-- will actually work.

CREATE OR REPLACE FUNCTION public.hv_get_gemini_key()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'vault'
AS $function$
declare
  v_pick smallint;
  v_key_a text;
  v_key_b text;
  v_a_cooling boolean;
  v_b_cooling boolean;
begin
  select decrypted_secret into v_key_a from vault.decrypted_secrets where name = 'gemini_api_key';
  select decrypted_secret into v_key_b from vault.decrypted_secrets where name = 'gemini_api_key_b';

  if v_key_b is null then return v_key_a; end if;
  if v_key_a is null then return v_key_b; end if;

  select (cooldown_until > now()) into v_a_cooling from public.hv_gemini_key_cooldown where key_name = 'gemini_api_key';
  select (cooldown_until > now()) into v_b_cooling from public.hv_gemini_key_cooldown where key_name = 'gemini_api_key_b';

  if coalesce(v_a_cooling,false) and not coalesce(v_b_cooling,false) then return v_key_b; end if;
  if coalesce(v_b_cooling,false) and not coalesce(v_a_cooling,false) then return v_key_a; end if;

  update public.hv_gemini_key_rotation
    set next_key = case when next_key = 1 then 2 else 1 end
  where id = 1
  returning next_key into v_pick;

  return case when v_pick = 1 then v_key_a else v_key_b end;
end;
$function$
;

create table if not exists public.hv_gemini_key_rotation (
  id int primary key default 1,
  next_key smallint not null default 1,
  check (id = 1)
);
insert into public.hv_gemini_key_rotation (id, next_key) values (1, 1) on conflict (id) do nothing;

create table if not exists public.hv_gemini_key_cooldown (
  key_name text primary key,
  cooldown_until timestamptz
);

CREATE OR REPLACE FUNCTION public.hv_report_gemini_failure(p_key text, p_seconds integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_name text;
begin
  select case when decrypted_secret = p_key then name end into v_name
  from vault.decrypted_secrets where name in ('gemini_api_key','gemini_api_key_b') and decrypted_secret = p_key;

  if v_name is null then return; end if;

  insert into public.hv_gemini_key_cooldown (key_name, cooldown_until)
  values (v_name, now() + make_interval(secs => p_seconds))
  on conflict (key_name) do update set cooldown_until = excluded.cooldown_until;
end;
$function$
;
revoke all on function public.hv_report_gemini_failure(text,int) from public, anon, authenticated;
grant execute on function public.hv_report_gemini_failure(text,int) to service_role;

CREATE OR REPLACE FUNCTION public.hv_get_gemini_keys_ordered()
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'vault'
AS $function$
declare
  v_first text;
  v_key_a text;
  v_key_b text;
begin
  select decrypted_secret into v_key_a from vault.decrypted_secrets where name = 'gemini_api_key';
  select decrypted_secret into v_key_b from vault.decrypted_secrets where name = 'gemini_api_key_b';
  v_first := public.hv_get_gemini_key();

  if v_key_b is null then return array[v_key_a]; end if;
  if v_key_a is null then return array[v_key_b]; end if;

  if v_first = v_key_a then return array[v_key_a, v_key_b];
  else return array[v_key_b, v_key_a];
  end if;
end;
$function$
;
revoke all on function public.hv_get_gemini_keys_ordered() from public, anon, authenticated;
grant execute on function public.hv_get_gemini_keys_ordered() to service_role;

CREATE OR REPLACE FUNCTION public.hv_get_llm_keys()
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'vault'
AS $function$
  select jsonb_build_object(
    'anthropic_api_key', (select decrypted_secret from vault.decrypted_secrets where name = 'anthropic_api_key'),
    'openai_api_key',    (select decrypted_secret from vault.decrypted_secrets where name = 'openai_api_key'),
    'gemini_api_key',    public.hv_get_gemini_key(),
    'gemini_api_keys',   to_jsonb(public.hv_get_gemini_keys_ordered())
  );
$function$
;
revoke all on function public.hv_get_llm_keys() from public, anon, authenticated;
grant execute on function public.hv_get_llm_keys() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260908182816','gemini_multi_key_infrastructure','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260908182816_gemini_multi_key_infrastructure.sql

-- RECOVERY BEGIN 20260908182917_fix_extraction_fallback_and_embed_candidate_bug.sql
-- Reconstructed from production. Applied 2026-08-31 via the same unmerged
-- branch as 20260831120000 (never got a PR, applied directly to prod).
-- Adds Gemini as a third fallback provider (after Anthropic/OpenAI) to
-- run_signal_extraction and run_signal_counterparty_extraction. Confirmed
-- byte-identical to what is currently live.

CREATE OR REPLACE FUNCTION public.run_signal_extraction(p_fire_limit integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
begin
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false
    and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id)
    and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  where coalesce(j.collected,false)=false and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id);

  with resp as (
    select j.request_id, j.snapshot_id, j.source_name, j.captured_url,
           coalesce(
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
             safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
             safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
           ) as claude_text
    from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
    where coalesce(j.collected,false)=false and r.status_code=200
  ),
  arr as (select *, safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p from resp),
  arr2 as (select *, case when jsonb_typeof(p)='array' then p else '[]'::jsonb end as a from arr),
  cand as (
    select a.source_name, a.captured_url, a.snapshot_id, sig,
      left(coalesce(sig->>'title','Untitled signal'),300) as t,
      left(coalesce(sig->>'market','Global'),120) as mkt,
      least(100,greatest(0,coalesce((sig->>'confidence')::int,50))) as conf,
      row_number() over (partition by lower(coalesce(sig->>'title','')), lower(coalesce(sig->>'market','')) order by 1) as rn
    from arr2 a, jsonb_array_elements(a.a) as sig
    where jsonb_typeof(a.a)='array' and jsonb_array_length(a.a)>0
  ),
  ins as (
    insert into ia_signals (id,title,type,category,stage,market,confidence,commercial_impact,summary,source_id,source_name,notes)
    select 's-'||gen_random_uuid(), c.t,
      case when lower(coalesce(c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(c.sig->>'type') else 'regulatory' end,
      case when lower(coalesce(c.sig->>'category',c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(coalesce(c.sig->>'category',c.sig->>'type')) else 'regulatory' end,
      case when c.conf >= 80 then 'qualified' else 'new' end,
      c.mkt, c.conf,
      case when lower(coalesce(c.sig->>'commercial_impact','')) in ('high','medium','low') then lower(c.sig->>'commercial_impact') else 'medium' end,
      coalesce(c.sig->>'summary',''), null, c.source_name,
      'auto-extracted (claude-haiku-4-5) from snapshot '||c.snapshot_id||coalesce(' · '||c.captured_url,'')
    from cand c
    where c.rn = 1
      and not public.is_boilerplate_signal(c.sig->>'summary')
      and not exists (
        select 1 from ia_signals x
        where lower(x.title)=lower(c.t) and lower(x.market)=lower(c.mkt)
          and x.created_at > now() - interval '45 days'
      )
    returning 1
  )
  select count(*) into v_inserted from ins;

  update source_snapshots s set processing_status='extracted', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code=200 and s.processing_status<>'extracted';
  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code<>200 and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  from net._http_response r where r.id=j.request_id and coalesce(j.collected,false)=false;
  get diagnostics v_collected = row_count;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('signal_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('inserted', v_inserted, 'collected', v_collected))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'inserted', v_inserted, 'collected', v_collected, 'fired', 0, 'ran_at', now());
  end if;

  if v_provider = 'anthropic' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.anthropic.com/v1/messages',
      headers:=jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
      body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
        'messages',jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'anthropic'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  elsif v_provider = 'openai' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
      body:=jsonb_build_object('model','gpt-4o-mini','max_tokens',1500,'temperature',0,
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content',v_pre),
          jsonb_build_object('role','user','content',
            E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
            || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))
        )),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'openai'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  else
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',4000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
      ),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'gemini'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  end if;

  return jsonb_build_object('ok',true,'degraded',(v_provider <> 'anthropic'),'provider',v_provider,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end
$function$
;

CREATE OR REPLACE FUNCTION public.run_signal_counterparty_extraction()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_inserted int := 0;
  v_provider text; v_attempts int; v_failures int;
  v_collect_provider text;
  v_pre text := 'You extract named commercial counterparties from cannabis industry intelligence signals for a B2B relationship-memory system. Below is a JSON array of qualified signals. For each signal that names a SPECIFIC company, brand, or named regulator/agency (not a generic unnamed reference), extract one counterparty record. Classify role as exactly one of: buyer, seller, importer, distributor, supplier, consultant, equipment_vendor, packaging_supplier, logistics_provider, market_access_partner (use market_access_partner for named regulators/agencies). Skip signals with no clearly named entity — most signals should be skipped. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"name": string, "role": string, "market": string, "category": string (short tag e.g. licensing, enforcement, market_entry, supply), "signal_id": string}. If none qualify, return [].';
begin
  perform 1 from _counterparty_jobs j where not j.collected;
  if found then
    update _counterparty_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids, j.provider,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text,
             r.status_code
      from _counterparty_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array'
    ),
    extracted as (
      select
        'rm-' || md5(lower(trim(h->>'name'))) as id,
        trim(h->>'name') as name,
        coalesce(h->>'role','buyer') as role,
        coalesce(h->>'market','Global') as market,
        coalesce(h->>'category','general') as category
      from ok, jsonb_array_elements(ok.p) h
      where coalesce(h->>'name','') <> ''
    ),
    ins as (
      insert into ia_counterparties (id, name, role, markets, categories, interaction_count, introduction_count, documentation_status, last_interaction, notes)
      select id, name, role, array[market], array[category], 1, 0, 'missing', current_date,
             'Auto-extracted from a qualified intelligence signal — review and enrich.'
      from extracted
      on conflict (id) do update set
        markets           = (select array_agg(distinct m) from unnest(ia_counterparties.markets || excluded.markets) m),
        categories        = (select array_agg(distinct c) from unnest(ia_counterparties.categories || excluded.categories) c),
        interaction_count = ia_counterparties.interaction_count + 1,
        last_interaction  = greatest(ia_counterparties.last_interaction, excluded.last_interaction),
        updated_at        = now()
      returning 1
    ),
    mark_used as (
      update ia_signals s set counterparty_extracted_at = now()
      from ok o where s.id = any(o.signal_ids)
      returning 1
    ),
    done as (
      update _counterparty_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name = 'gemini_api_key' limit 1;
  if v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'market', s.market, 'category', s.category, 'summary', s.summary)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage in ('qualified','converted_to_opportunity') and counterparty_extracted_at is null
    order by created_at desc
    limit 25
  ) s;

  if v_signals is null then
    return jsonb_build_object('ok', true, 'skipped', 'no unprocessed qualified signals');
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('counterparty_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    v_req := net.http_post(
      url := 'https://api.anthropic.com/v1/messages',
      headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
      body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2000,
        'messages', jsonb_build_array(jsonb_build_object('role','user','content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
      timeout_milliseconds := 60000
    );
  else
    v_req := net.http_post(
      url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
      body := jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',5000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
      ),
      timeout_milliseconds := 60000
    );
  end if;

  insert into _counterparty_jobs (request_id, signal_ids, provider) values (v_req, v_signal_ids, v_provider);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'request_id', v_req, 'signals_sent', jsonb_array_length(v_signals));
end;
$function$
;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260908182917','fix_extraction_fallback_and_embed_candidate_bug','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260908182917_fix_extraction_fallback_and_embed_candidate_bug.sql

-- RECOVERY BEGIN 20260908182956_fix_entities_translate_dispatch_r_variable_collision.sql
-- Reconstructed from production. Applied 2026-08-31 via the same unmerged
-- branch as 20260831120000 (never got a PR, applied directly to prod).
--
-- Real bug fixed here: hv_entities_dispatch and hv_translate_dispatch both
-- reused the PL/pgSQL variable name `r` as both the FOR-loop record and a
-- table alias inside an earlier failure-tracking query in the same
-- function -- PL/pgSQL resolved the alias as the not-yet-assigned loop
-- variable, throwing "record r is not assigned yet". This masked itself
-- during initial testing (the daily dispatch budget was already
-- exhausted, so the buggy code path never ran) and only surfaced once the
-- budget reset -- at which point it crashed hv_pipeline_tick entirely for
-- roughly 2 days, since translate runs before classify/entities in that
-- function and an unhandled exception aborts everything after it. Fixed
-- by renaming the query alias from `r` to `resp`. Confirmed fixed and
-- stable in current production. 2026-08-23 (fallback added), 2026-08-26
-- (bug found and fixed).
--
-- Also adds Gemini as a fallback provider to entities/translate dispatch,
-- and provider-tracking columns so each job records which provider
-- (openai vs gemini) served it.

alter table public.hv_entity_jobs add column if not exists provider text;
alter table public.hv_translation_jobs add column if not exists provider text;
alter table public._counterparty_jobs add column if not exists provider text;

CREATE OR REPLACE FUNCTION public.hv_entities_dispatch(p_limit integer DEFAULT 60)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_rid bigint; v_openai_key text; v_gemini_key text; n int:=0;
  v_provider text; v_attempts int; v_failures int;
  v_sys text := 'Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.';
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;

  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response resp where resp.id = j.request_id);

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key';
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key';

  if v_openai_key is not null then
    select count(*), count(*) filter (where resp.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from hv_entity_jobs where provider='openai' and request_id is not null order by request_id desc limit 10) recent
    join net._http_response resp on resp.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;
  if v_provider is null then return 0; end if;

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    if v_provider = 'openai' then
      select net.http_post(
        url:='https://api.openai.com/v1/chat/completions',
        headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_openai_key),
        body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
          'messages',jsonb_build_array(
            jsonb_build_object('role','system','content',v_sys),
            jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
          )),
        timeout_milliseconds:=30000
      ) into v_rid;
    else
      select net.http_post(
        url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers:=jsonb_build_object('Content-Type','application/json','x-goog-api-key',v_gemini_key),
        body:=jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_sys))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1200,'responseMimeType','application/json','thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds:=30000
      ) into v_rid;
    end if;
    insert into public.hv_entity_jobs(request_id, signal_id, provider) values (v_rid, r.id, v_provider) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end
$function$
;

CREATE OR REPLACE FUNCTION public.hv_entities_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; v_raw text; v_entities jsonb; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_entity_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_raw := coalesce(
          r.content::jsonb->'choices'->0->'message'->>'content',
          r.content::jsonb->'candidates'->0->'content'->'parts'->0->>'text'
        );
        v_entities := (v_raw::jsonb)->'entities';
        for ent in select * from jsonb_array_elements(coalesce(v_entities, '[]'::jsonb))
        loop
          v_name := btrim(ent->>'name');
          v_type := coalesce(nullif(btrim(ent->>'type'),''),'other');
          if v_name is null or length(v_name) < 2 then continue; end if;
          select id into v_eid from public.ia_graph_entities where lower(label)=lower(v_name) limit 1;
          if v_eid is null then
            v_eid := 'ent:'||substr(md5(lower(v_name)),1,20);
            insert into public.ia_graph_entities(id,type,label,signal_count,last_activity,created_at,updated_at)
            values (v_eid, v_type, v_name, 0, now(), now(), now())
            on conflict (id) do nothing;
          end if;
          insert into public.signal_entities(signal_id, entity_id, mention_text, entity_type, confidence)
          values (r.signal_id, v_eid, v_name, v_type, 0.8)
          on conflict (signal_id, entity_id) do nothing;
          update public.ia_graph_entities set signal_count=coalesce(signal_count,0)+1, last_activity=now() where id=v_eid;
          n:=n+1;
        end loop;
      exception when others then null;
      end;
      update public.signals set entities_extracted_at = now()
       where id = r.signal_id and entities_extracted_at is null;
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end
$function$
;

CREATE OR REPLACE FUNCTION public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_rid bigint; v_openai_key text; v_gemini_key text; n int := 0;
  v_provider text; v_attempts int; v_failures int;
  v_sys text := 'You translate cannabis-industry news to English for a B2B regulatory-intelligence pipeline. Detect the original language and translate the headline and summary into natural English. Return ONLY strict JSON: {"lang":"<ISO 639-1>","title_en":"...","summary_en":"..."}. If already English, echo it back with lang:"en".';
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);
  p_limit := public.hv_consume_dispatch_budget('translate', p_limit);
  if p_limit <= 0 then return 0; end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key';
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key';

  if v_openai_key is not null then
    select count(*), count(*) filter (where resp.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from hv_translation_jobs where provider='openai' and request_id is not null order by request_id desc limit 10) recent
    join net._http_response resp on resp.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;
  if v_provider is null then return 0; end if;

  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
      and not exists (select 1 from public.hv_translation_jobs j where j.signal_id = s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    if v_provider = 'openai' then
      select net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_openai_key),
        body := jsonb_build_object(
          'model','gpt-4o-mini','temperature',0,
          'response_format', jsonb_build_object('type','json_object'),
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_sys),
            jsonb_build_object('role','user','content','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))
          )
        ),
        timeout_milliseconds := 30000
      ) into v_rid;
    else
      select net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('Content-Type','application/json','x-goog-api-key',v_gemini_key),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_sys))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1200,'responseMimeType','application/json','thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds := 30000
      ) into v_rid;
    end if;
    insert into public.hv_translation_jobs(request_id, signal_id, provider) values (v_rid, r.id, v_provider)
      on conflict (request_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end
$function$
;

CREATE OR REPLACE FUNCTION public.hv_translate_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_out jsonb; v_raw text; v_model text; n int := 0;
begin
  for r in
    select j.request_id, j.signal_id, j.provider, resp.status_code, resp.content
    from public.hv_translation_jobs j
    join net._http_response resp on resp.id = j.request_id
    where not j.harvested
  loop
    if r.status_code = 200 then
      begin
        v_raw := coalesce(
          r.content::jsonb->'choices'->0->'message'->>'content',
          r.content::jsonb->'candidates'->0->'content'->'parts'->0->>'text'
        );
        v_out := v_raw::jsonb;
        v_model := case coalesce(r.provider,'openai') when 'gemini' then 'gemini-3.6-flash' else 'gpt-4o-mini' end;
        update public.signals s set
          title_en   = nullif(btrim(v_out->>'title_en'),''),
          summary_en = nullif(btrim(v_out->>'summary_en'),''),
          lang_detected = nullif(btrim(v_out->>'lang'),''),
          translated_at = now(),
          translation_model = v_model
        where s.id = r.signal_id;
        n := n + 1;
      exception when others then null;
      end;
    end if;
    update public.hv_translation_jobs set harvested = true where request_id = r.request_id;
  end loop;
  return n;
end
$function$
;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260908182956','fix_entities_translate_dispatch_r_variable_collision','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260908182956_fix_entities_translate_dispatch_r_variable_collision.sql

-- RECOVERY BEGIN 20260908183011_add_gemini_embedding_column_repoint_embed_dispatch.sql
-- Reconstructed from production. Applied 2026-08-31 via the same unmerged
-- branch as 20260831120000 (never got a PR, applied directly to prod).
-- Repoints embedding dispatch from OpenAI to Gemini's batch embedding
-- endpoint (1024-dim), storing into embedding_gemini_1024 rather than the
-- prior embedding_1024 (OpenAI) column. Confirmed byte-identical to what
-- is currently live.

CREATE OR REPLACE FUNCTION public.hv_embed_dispatch(p_signal_ids text[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare v_rid bigint; v_texts text[]; v_ids text[]; v_allowed int; v_requests jsonb; v_gemini_key text;
begin
  v_allowed := public.hv_consume_dispatch_budget('embed', least(coalesce(array_length(p_signal_ids,1),0), 100));
  if v_allowed <= 0 then return null; end if;
  v_ids := p_signal_ids[1 : v_allowed];

  select array_agg(coalesce(s.title_en, s.headline) || '. ' || coalesce(s.summary_en, left(s.summary,300), '') order by ord)
    into v_texts
  from unnest(v_ids) with ordinality as u(sid, ord)
  join public.signals s on s.id = u.sid;

  select jsonb_agg(
    jsonb_build_object(
      'model','models/gemini-embedding-001',
      'content', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', left(t, 4000)))),
      'outputDimensionality', 1024
    )
  ) into v_requests
  from unnest(v_texts) t;

  v_gemini_key := public.hv_get_gemini_key();

  select net.http_post(
    url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=' || v_gemini_key,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('requests', v_requests),
    timeout_milliseconds := 45000
  ) into v_rid;

  insert into public.hv_embed_jobs(request_id, signal_ids) values (v_rid, v_ids);
  return v_rid;
end
$function$
;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260908183011','add_gemini_embedding_column_repoint_embed_dispatch','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260908183011_add_gemini_embedding_column_repoint_embed_dispatch.sql

-- RECOVERY BEGIN 20260910010500_hv_local_classifier_centroids.sql
-- Creates public.hv_local_classifier_centroids, the table
-- 20260910010532_local_classifier_gate.sql selects from.
--
-- The centroids table already exists in production. This migration restores
-- repository-first replayability for clean databases without seeding trained
-- model state.
--
-- Production shape verified 2026-09-11:
-- quality_label text NOT NULL primary key
-- centroid vector(1024) NOT NULL
-- n integer NOT NULL
-- updated_at timestamptz DEFAULT now(), nullable
-- RLS disabled; access restricted to postgres/service_role.

create table if not exists public.hv_local_classifier_centroids (
  quality_label text not null,
  centroid      vector(1024) not null,
  n             integer not null,
  updated_at    timestamptz default now(),
  constraint hv_local_classifier_centroids_pkey primary key (quality_label)
);

-- Trained centroid rows are intentionally not seeded. A fresh environment
-- safely falls through to the existing LLM classification path when empty.
grant select, insert, update, delete on public.hv_local_classifier_centroids to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260910010500','hv_local_classifier_centroids','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260910010500_hv_local_classifier_centroids.sql

-- RECOVERY BEGIN 20260910010532_local_classifier_gate.sql
-- Reconstructed from production. Applied 2026-08-30/31 via the same
-- unmerged branch as 20260831120000 (never got a PR, applied directly to
-- prod). Confirmed byte-identical to what is currently live.
--
-- Free, instant nearest-centroid classifier checked before spending an LLM
-- call on classification. Validated on held-out data: only auto-resolves
-- boilerplate/nav/spam predictions with a wide confidence margin, never
-- "signal" -- measured zero real-signal leakage at this threshold, ~17% of
-- volume resolvable this way. Everything else (including every
-- low-confidence case) still goes to the LLM exactly as before. Consumed
-- by hv_classify_corpus_dispatch (see 20260830140000_full_regulatory_tier_coverage.sql
-- era pipeline; wired into the dispatch loop directly against
-- signals.embedding_gemini_1024).

CREATE OR REPLACE FUNCTION public.hv_local_classify_gate(p_embedding vector)
 RETURNS TABLE(quality_label text, margin numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  with dists as (
    select c.quality_label, (c.centroid <=> p_embedding) as d
    from public.hv_local_classifier_centroids c
  ),
  ranked as (
    select quality_label, d, row_number() over (order by d) as rnk
    from dists
  )
  select r1.quality_label, (r2.d - r1.d)::numeric as margin
  from ranked r1 join ranked r2 on r2.rnk = 2
  where r1.rnk = 1
    and r1.quality_label != 'signal'
    and (r2.d - r1.d) >= 0.015;
$function$
;

CREATE OR REPLACE FUNCTION public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_rid bigint; n int:=0; v_ids text[]; c_max_attempts constant int := 5;
  v_gate record; v_local_resolved int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select s.id,
         coalesce(s.title_en, s.headline),
         coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline),
         'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days||' days')::interval
    and (
      select count(*) from public.hv_classify_jobs k
      where k.signal_id = s.id and k.outcome is not null and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
      and not exists (select 1 from public.intel_classify_review_queue q where q.signal_id=s.id and not q.resolved)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  for r in
    select s.id, s.embedding_gemini_1024 as emb
    from public.signals s
    where s.id = any(v_ids) and s.embedding_gemini_1024 is not null
  loop
    select * into v_gate from public.hv_local_classify_gate(r.emb);
    if v_gate.quality_label is not null then
      update public.signals
      set quality_label = v_gate.quality_label,
          content_type = 'noise',
          impact = 'low',
          quality_confidence = 0.85,
          classifier_version = 'local-centroid-v1'
      where id = r.id;
      v_ids := array_remove(v_ids, r.id);
      v_local_resolved := v_local_resolved + 1;
    end if;
  end loop;

  if v_ids is null or array_length(v_ids,1) = 0 then return v_local_resolved; end if;

  p_limit := public.hv_consume_dispatch_budget('classify', array_length(v_ids,1));
  if p_limit <= 0 then return v_local_resolved; end if;
  v_ids := v_ids[1:p_limit];

  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n + v_local_resolved;
end
$function$
;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260910010532','local_classifier_gate','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260910010532_local_classifier_gate.sql

-- RECOVERY BEGIN 20260910012108_clinical_sku_bootstrap_snapshots.sql
-- Bootstrap SKU snapshots

insert into public.clinical_formulary_skus (
  country_iso2, authority, registration_code, brand_name, product_name,
  strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
  source_url, source_type, review_status, notes, last_seen_at
)
select * from (values
  ('BR', 'ANVISA', null::text, null::text,
   'ANVISA-authorised CBD oral products (register class)',
   'Per product registration', 'oil / oral solution', 'oral / oromucosal',
   'CBD-dominant; THC limits per registration', 'authorised',
   'https://www.gov.br/anvisa', 'authority_register_snapshot', 'published',
   'Confirm exact brand, registration code and strength on the live ANVISA register before prescribing.',
   now()),
  ('BR', 'ANVISA', null, null,
   'Individual import authorisation pathway products',
   'Varies', 'varies', 'varies',
   'Varies by authorised product', 'import-authorised',
   'https://www.gov.br/anvisa', 'class_reference', 'published',
   'Import authorisation pathway — verify current ANVISA process for each patient product.',
   now()),
  ('AU', 'TGA', null, null,
   'TGA SAS-B medicinal cannabis products (pathway class)',
   'Sponsor-specific', 'varies', 'varies',
   'Wide CBD/THC range', 'authorised',
   'https://www.tga.gov.au', 'class_reference', 'published',
   'Most medicinal cannabis access is via SAS-B or Authorised Prescriber. Confirm current TGA pathway rules.',
   now()),
  ('AU', 'TGA', null, null,
   'Authorised Prescriber medicinal cannabis products (pathway class)',
   'Sponsor-specific', 'varies', 'varies',
   'Wide CBD/THC range', 'authorised',
   'https://www.tga.gov.au', 'class_reference', 'published',
   'Authorised Prescriber pathway — product set is clinic/sponsor specific.',
   now())
) as v(country_iso2, authority, registration_code, brand_name, product_name,
       strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
       source_url, source_type, review_status, notes, last_seen_at)
where not exists (
  select 1 from public.clinical_formulary_skus s
  where s.country_iso2 = v.country_iso2
    and s.authority = v.authority
    and s.product_name = v.product_name
);

SELECT 'sku_published' AS metric, count(*)::text AS value
FROM public.clinical_formulary_skus WHERE review_status = 'published';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260910012108','clinical_sku_bootstrap_snapshots','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260910012108_clinical_sku_bootstrap_snapshots.sql

-- RECOVERY BEGIN 20260911225008_decision_intel_stage0_first_slice.sql
-- Harbourview Decision Intelligence OS — Stage 0 / first production slice
-- Additive only. Existing signals/Pipeline B remain upstream.

create extension if not exists pgcrypto;

create table if not exists public.intel_evidence_refs (
  id uuid primary key default gen_random_uuid(),
  source_signal_id text references public.signals(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  hv_evidence_id uuid references public.hv_evidence(id) on delete restrict,
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_label text,
  source_url text,
  evidence_kind text not null default 'source_snapshot' check (evidence_kind in ('source_snapshot','hv_evidence','legacy_signal')),
  evidence_status text not null default 'needs_review' check (evidence_status in ('needs_review','partially_verified','verified','conflicting','stale')),
  access_classification text not null default 'internal' check (access_classification in ('internal','intel')),
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  check (source_signal_id is not null or source_snapshot_id is not null or hv_evidence_id is not null)
);
-- Snapshot identity is deliberately not unique: one acquisition snapshot may yield
-- multiple reviewed signals. Signal identity is the one-to-one legacy lineage key.
create unique index if not exists intel_evidence_refs_signal_uq on public.intel_evidence_refs(source_signal_id) where source_signal_id is not null;

create table if not exists public.intel_assertions (
  id uuid primary key default gen_random_uuid(),
  assertion_type text not null default 'development',
  statement text not null,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id) on delete set null,
  source_signal_id text references public.signals(id) on delete set null,
  confidence numeric(5,4),
  review_status text not null default 'needs_review' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists intel_assertions_source_signal_uq on public.intel_assertions(source_signal_id) where source_signal_id is not null;

create table if not exists public.intel_assertion_evidence (
  assertion_id uuid not null references public.intel_assertions(id) on delete cascade,
  evidence_ref_id uuid not null references public.intel_evidence_refs(id) on delete restrict,
  relationship text not null default 'supports' check (relationship in ('supports','contradicts','clarifies','supersedes','background')),
  created_at timestamptz not null default now(),
  primary key (assertion_id, evidence_ref_id, relationship)
);

create table if not exists public.intel_events (
  id text primary key,
  canonical_signal_id text references public.signals(id) on delete set null,
  event_type text not null default 'development',
  headline text not null,
  summary text,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id) on delete set null,
  jurisdiction_label text,
  occurred_at timestamptz,
  detected_at timestamptz,
  effective_at timestamptz,
  last_verified_at timestamptz,
  materiality text not null default 'medium' check (materiality in ('low','medium','high','critical')),
  consolidation_status text not null default 'candidate' check (consolidation_status in ('candidate','reviewed','confirmed','split','superseded')),
  review_status text not null default 'migrated_reviewed' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  source_count integer not null default 1 check (source_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intel_event_assertions (
  event_id text not null references public.intel_events(id) on delete cascade,
  assertion_id uuid not null references public.intel_assertions(id) on delete restrict,
  role text not null default 'core' check (role in ('core','supporting','contradicting','context')),
  created_at timestamptz not null default now(),
  primary key (event_id, assertion_id)
);

create table if not exists public.intel_assessments (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique references public.intel_events(id) on delete cascade,
  what_happened text not null,
  what_changed text,
  why_it_matters text,
  commercial_implications text,
  regulatory_implications text,
  affected_entities text[] not null default '{}',
  affected_markets text[] not null default '{}',
  affected_products text[] not null default '{}',
  why_now text,
  confidence numeric(5,4),
  confidence_rationale text,
  contradictions text[] not null default '{}',
  unknowns text[] not null default '{}',
  review_status text not null default 'needs_review' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intel_assessment_versions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.intel_assessments(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_reason text,
  created_at timestamptz not null default now(),
  unique (assessment_id, version)
);

create table if not exists public.intel_recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.intel_assessments(id) on delete cascade,
  recommendation_state text not null check (recommendation_state in ('act_now','investigate','monitor','no_action')),
  reasoning text not null,
  why_now text,
  action_summary text,
  urgency text not null default 'normal' check (urgency in ('low','normal','high','urgent')),
  review_status text not null default 'needs_review' check (review_status in ('needs_review','migrated_reviewed','verified','rejected','superseded')),
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical base objects remain internal/staff-readable. Product users consume the allowlisted projection below.
alter table public.intel_evidence_refs enable row level security;
alter table public.intel_assertions enable row level security;
alter table public.intel_assertion_evidence enable row level security;
alter table public.intel_events enable row level security;
alter table public.intel_event_assertions enable row level security;
alter table public.intel_assessments enable row level security;
alter table public.intel_assessment_versions enable row level security;
alter table public.intel_recommendations enable row level security;

do $$
declare t text;
begin
  foreach t in array array['intel_evidence_refs','intel_assertions','intel_assertion_evidence','intel_events','intel_event_assertions','intel_assessments','intel_assessment_versions','intel_recommendations'] loop
    execute format('drop policy if exists %I_staff_all on public.%I', t, t);
    execute format($p$
      create policy %I_staff_all on public.%I for all
      using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')))
      with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')))
    $p$, t, t);
  end loop;
end $$;

-- Seed a thin evidence reference from the existing acquisition estate. No raw evidence is copied.
-- source_signal_id is retained even when there is no snapshot so legacy provenance cannot cross-link
-- unrelated signals that happen to share a publisher or a null URL.
insert into public.intel_evidence_refs (source_signal_id, source_snapshot_id, source_registry_id, source_label, source_url, evidence_kind, evidence_status, access_classification, observed_at)
select
  s.id,
  s.snapshot_id,
  ss.source_id,
  nullif(s.source,''),
  nullif(s.url,''),
  case when s.snapshot_id is null then 'legacy_signal' else 'source_snapshot' end,
  'needs_review',
  'intel',
  coalesce(s.date, s.created_at)
from public.signals s
left join public.source_snapshots ss on ss.id = s.snapshot_id
where s.reviewed = true
  and (s.action is null or s.action <> 'rejected')
  and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
  and (s.content_type is null or s.content_type not in ('story','research','noise'))
on conflict (source_signal_id) where source_signal_id is not null do nothing;

-- One migrated assertion per reviewed surfaceable upstream signal. Review != verified.
insert into public.intel_assertions (assertion_type, statement, source_signal_id, confidence, review_status, valid_from, observed_at)
select
  coalesce(nullif(s.content_type,''), nullif(s.cat,''), 'development'),
  coalesce(nullif(s.summary_en,''), nullif(s.summary,''), nullif(s.editorial_blurb,''), nullif(s.headline,''), 'Development under review'),
  s.id,
  case when s.quality_confidence between 0 and 1 then s.quality_confidence else null end,
  'migrated_reviewed',
  s.date,
  coalesce(s.date, s.created_at)
from public.signals s
where s.reviewed = true
  and (s.action is null or s.action <> 'rejected')
  and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
  and (s.content_type is null or s.content_type not in ('story','research','noise'))
on conflict do nothing;

insert into public.intel_assertion_evidence (assertion_id, evidence_ref_id, relationship)
select a.id, e.id, 'supports'
from public.intel_assertions a
join public.intel_evidence_refs e on e.source_signal_id = a.source_signal_id
on conflict do nothing;

-- Candidate event identity is deterministic and cluster-aware. source_count counts distinct
-- source references, not raw rows, so repeated observations from one URL/publisher do not
-- masquerade as independent corroboration.
with surfaceable as (
  select s.*, coalesce(nullif(s.cluster_rep_id,''), s.id) as event_seed
  from public.signals s
  where s.reviewed = true
    and (s.action is null or s.action <> 'rejected')
    and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
    and (s.content_type is null or s.content_type not in ('story','research','noise'))
), source_counts as (
  select event_seed,
         count(distinct coalesce(nullif(url,''), nullif(source,''), id)) as source_count_calc
  from surfaceable
  group by event_seed
), ranked as (
  select s.*, sc.source_count_calc,
         row_number() over (partition by s.event_seed order by s.quality_confidence desc nulls last, s.date desc nulls last, s.created_at desc) as rn
  from surfaceable s
  join source_counts sc using (event_seed)
)
insert into public.intel_events (id, canonical_signal_id, event_type, headline, summary, jurisdiction_label, occurred_at, detected_at, materiality, source_count)
select
  'event:' || event_seed,
  id,
  coalesce(nullif(content_type,''), nullif(cat,''), 'development'),
  coalesce(nullif(title_en,''), nullif(editorial_title,''), nullif(headline,''), 'Intelligence event'),
  coalesce(nullif(summary_en,''), nullif(summary,''), nullif(editorial_blurb,'')),
  nullif(country,''),
  date,
  created_at,
  case lower(coalesce(impact, pri, commercial_impact, '')) when 'critical' then 'critical' when 'high' then 'high' when 'urgent' then 'high' when 'low' then 'low' else 'medium' end,
  source_count_calc
from ranked where rn = 1
on conflict (id) do nothing;

insert into public.intel_event_assertions (event_id, assertion_id, role)
select 'event:' || coalesce(nullif(s.cluster_rep_id,''), s.id), a.id,
       case when coalesce(nullif(s.cluster_rep_id,''), s.id) = s.id then 'core' else 'supporting' end
from public.intel_assertions a
join public.signals s on s.id = a.source_signal_id
on conflict do nothing;

-- Reuse defensible analysis fields, but preserve migrated-review status and explicit unknowns.
insert into public.intel_assessments (
  event_id, what_happened, what_changed, why_it_matters, commercial_implications,
  affected_entities, affected_markets, why_now, confidence, confidence_rationale,
  unknowns, review_status
)
select
  e.id,
  coalesce(nullif(s.summary_en,''), nullif(s.summary,''), e.summary, e.headline),
  nullif(s.analysis->>'what_changed',''),
  coalesce(nullif(s.commercial_impact,''), 'Commercial relevance requires contextual review.'),
  nullif(s.commercial_impact,''),
  case when nullif(s.analysis->>'who_is_affected','') is null then '{}'::text[] else array[s.analysis->>'who_is_affected'] end,
  case when nullif(s.country,'') is null then '{}'::text[] else array[s.country] end,
  case when e.source_count > 1 then e.source_count || ' distinct source references are associated with this event candidate.' else 'A reviewed upstream signal triggered this event candidate.' end,
  case when s.quality_confidence between 0 and 1 then s.quality_confidence else null end,
  nullif(s.analysis->>'confidence_rationale',''),
  case when s.snapshot_id is null then array['Direct source snapshot lineage is not available for the canonical upstream signal.'] else '{}'::text[] end,
  'migrated_reviewed'
from public.intel_events e
join public.signals s on s.id = e.canonical_signal_id
on conflict (event_id) do nothing;

insert into public.intel_assessment_versions (assessment_id, version, snapshot, change_reason)
select a.id, 1, jsonb_build_object(
  'what_happened',a.what_happened,'what_changed',a.what_changed,'why_it_matters',a.why_it_matters,
  'commercial_implications',a.commercial_implications,'affected_entities',a.affected_entities,
  'affected_markets',a.affected_markets,'why_now',a.why_now,'confidence',a.confidence,
  'confidence_rationale',a.confidence_rationale,'unknowns',a.unknowns,'review_status',a.review_status
), 'Stage 0 migration from reviewed/surfaceable Pipeline B signal'
from public.intel_assessments a
on conflict do nothing;

insert into public.intel_recommendations (assessment_id, recommendation_state, reasoning, why_now, action_summary, urgency, review_status)
select
  a.id,
  case
    when nullif(s.analysis->>'recommended_action','') is not null then 'investigate'
    when lower(coalesce(e.materiality,'')) in ('high','critical') then 'investigate'
    else 'monitor'
  end,
  case
    when nullif(s.analysis->>'recommended_action','') is not null then 'An upstream analysis proposes an action, but the migrated record is not independently verified; investigate before acting.'
    else 'The event is surfaceable but the first-slice migration does not contain enough verified decision evidence for immediate action.'
  end,
  a.why_now,
  nullif(s.analysis->>'recommended_action',''),
  case when e.materiality in ('critical','high') then 'high' else 'normal' end,
  'needs_review'
from public.intel_assessments a
join public.intel_events e on e.id = a.event_id
join public.signals s on s.id = e.canonical_signal_id
on conflict (assessment_id) do nothing;

create or replace view public.intel_event_dossiers
with (security_invoker = true)
as
select
  e.id,
  e.headline,
  e.summary,
  e.event_type,
  e.jurisdiction_label,
  e.occurred_at,
  e.detected_at,
  e.effective_at,
  e.last_verified_at,
  e.materiality,
  e.consolidation_status,
  e.review_status,
  e.source_count,
  a.what_happened,
  a.what_changed,
  a.why_it_matters,
  a.commercial_implications,
  a.regulatory_implications,
  a.affected_entities,
  a.affected_markets,
  a.affected_products,
  a.why_now,
  a.confidence,
  a.confidence_rationale,
  a.contradictions,
  a.unknowns,
  r.recommendation_state,
  r.reasoning as recommendation_reasoning,
  r.action_summary,
  r.urgency,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'sourceLabel', er.source_label,
    'sourceUrl', er.source_url,
    'status', er.evidence_status,
    'observedAt', er.observed_at
  )) filter (where er.id is not null and er.access_classification = 'intel'), '[]'::jsonb) as evidence
from public.intel_events e
join public.intel_assessments a on a.event_id = e.id
join public.intel_recommendations r on r.assessment_id = a.id
left join public.intel_event_assertions ea on ea.event_id = e.id
left join public.intel_assertion_evidence ae on ae.assertion_id = ea.assertion_id
left join public.intel_evidence_refs er on er.id = ae.evidence_ref_id
group by e.id, a.id, r.id;

-- Product read is tier-scoped. security_invoker means the public view still obeys
-- underlying RLS. Explicit SELECT grants are required because production's postgres
-- default privileges grant new public tables only to postgres/service_role.
create policy intel_events_tier_read on public.intel_events for select to authenticated
using (review_status in ('migrated_reviewed','verified') and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_event_assertions_tier_read on public.intel_event_assertions for select to authenticated
using (exists (select 1 from public.intel_events e where e.id = event_id and e.review_status in ('migrated_reviewed','verified')) and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_assertions_tier_read on public.intel_assertions for select to authenticated
using (review_status in ('migrated_reviewed','verified') and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_assertion_evidence_tier_read on public.intel_assertion_evidence for select to authenticated
using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_evidence_refs_tier_read on public.intel_evidence_refs for select to authenticated
using (access_classification = 'intel' and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_assessments_tier_read on public.intel_assessments for select to authenticated
using (review_status in ('migrated_reviewed','verified') and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));
create policy intel_recommendations_tier_read on public.intel_recommendations for select to authenticated
using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.tier in ('intel','operator')));

grant select on public.intel_events, public.intel_event_assertions, public.intel_assertions,
  public.intel_assertion_evidence, public.intel_evidence_refs, public.intel_assessments,
  public.intel_recommendations to authenticated;
grant select on public.intel_event_dossiers to authenticated;
revoke all on public.intel_event_dossiers from anon;

-- Production Data API exposes only `api`, not `public`. Publish only the allowlisted
-- dossier projection through the exposed schema; canonical base tables stay unexposed.
create or replace view api.intel_event_dossiers
with (security_invoker = true)
as select * from public.intel_event_dossiers;
grant select on api.intel_event_dossiers to authenticated;
revoke all on api.intel_event_dossiers from anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260911225008','decision_intel_stage0_first_slice','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260911225008_decision_intel_stage0_first_slice.sql

-- RECOVERY BEGIN 20260911225106_decision_intel_stage0_review_fixes.sql
-- Decision Intelligence Stage 0 review hardening.
-- Corrective additive migration for PR #1309; no later-stage schema is introduced.

-- One acquisition snapshot may legitimately yield multiple signals. Signal identity,
-- not snapshot identity, is the one-to-one legacy lineage key in slice 1.
drop index if exists public.intel_evidence_refs_snapshot_uq;

-- Preserve upstream signal identifiers as durable tombstone keys even if the legacy
-- signal is later deleted. Evidence and assertion lineage both retain canonical route
-- ownership for deleted cluster members and regulatory mirror aliases.
alter table public.intel_evidence_refs
  drop constraint if exists intel_evidence_refs_source_signal_id_fkey;
alter table public.intel_assertions
  drop constraint if exists intel_assertions_source_signal_id_fkey;

-- Confidence values are probabilities at the canonical boundary.
alter table public.intel_assertions
  drop constraint if exists intel_assertions_confidence_probability_chk,
  add constraint intel_assertions_confidence_probability_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1));

alter table public.intel_assessments
  drop constraint if exists intel_assessments_confidence_probability_chk,
  add constraint intel_assessments_confidence_probability_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1));

-- migrated_reviewed is a backfill-only state, never a default for future events.
alter table public.intel_events alter column review_status set default 'needs_review';

-- One source-backed assertion has exactly one canonical event in slice 1. This makes
-- source-signal -> assertion -> event routing deterministic rather than relying on
-- arbitrary LIMIT 1 selection if an assertion is accidentally linked twice.
create unique index if not exists intel_event_assertions_assertion_uq
  on public.intel_event_assertions(assertion_id);

-- Mutable canonical records must advance their recency timestamp on staff edits.
-- public.set_updated_at() is the repository-wide trigger function established by the
-- dashboard-preferences foundation migration and present before this Stage-0 slice.
drop trigger if exists intel_assertions_updated_at on public.intel_assertions;
create trigger intel_assertions_updated_at
before update on public.intel_assertions
for each row execute function public.set_updated_at();

drop trigger if exists intel_events_updated_at on public.intel_events;
create trigger intel_events_updated_at
before update on public.intel_events
for each row execute function public.set_updated_at();

drop trigger if exists intel_assessments_updated_at on public.intel_assessments;
create trigger intel_assessments_updated_at
before update on public.intel_assessments
for each row execute function public.set_updated_at();

drop trigger if exists intel_recommendations_updated_at on public.intel_recommendations;
create trigger intel_recommendations_updated_at
before update on public.intel_recommendations
for each row execute function public.set_updated_at();

-- Verified event transitions must carry the timestamp of the latest verification.
-- If a caller supplies a timestamp different from the historical value, preserve it;
-- otherwise stamp every transition into verified, including re-verification.
create or replace function public.stamp_intel_event_verification()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.review_status = 'verified' then
    if tg_op = 'INSERT' then
      if new.last_verified_at is null then new.last_verified_at := now(); end if;
    elsif old.review_status is distinct from 'verified'
      and (new.last_verified_at is null or new.last_verified_at is not distinct from old.last_verified_at) then
      new.last_verified_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists intel_events_verification_stamp on public.intel_events;
create trigger intel_events_verification_stamp
before insert or update of review_status on public.intel_events
for each row execute function public.stamp_intel_event_verification();

alter table public.intel_events
  drop constraint if exists intel_events_verified_timestamp_chk,
  add constraint intel_events_verified_timestamp_chk
    check (review_status <> 'verified' or last_verified_at is not null);

-- The canonical jurisdiction cross-reference foundation historically seeded ISO-2
-- identities without filling jurisdictions_id. Repair that link first using the
-- independently canonical ISO-3 identity present on countries + jurisdictions, then
-- consume jurisdiction_crossref for the Decision Intel backfill. No jurisdiction row
-- is fabricated when either side lacks a deterministic ISO mapping.
do $$
begin
  if to_regclass('public.jurisdiction_crossref') is not null
     and to_regclass('public.countries') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema='public' and table_name='countries' and column_name='iso_alpha3'
     )
     and exists (
       select 1 from information_schema.columns
       where table_schema='public' and table_name='jurisdictions' and column_name='iso_alpha3'
     ) then
    update public.jurisdiction_crossref xref
    set jurisdictions_id = j.jurisdiction_id
    from public.countries c
    join public.jurisdictions j
      on upper(j.iso_alpha3) = upper(c.iso_alpha3)
    where xref.jurisdictions_id is null
      and xref.countries_iso2 = c.iso_alpha2
      and c.iso_alpha3 is not null;
  end if;
end $$;

-- Recover canonical jurisdiction identity from Pipeline-B country_iso2 through the
-- repository's authoritative ISO-2 -> jurisdiction cross-reference. Canonical
-- jurisdiction ids are identity keys such as country_area:DEU, not ISO-2 values.
-- If the cross-reference or jurisdiction registry has no mapping, leave the FK null
-- rather than fabricating identity.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'signals' and column_name = 'country_iso2'
  ) and to_regclass('public.jurisdiction_crossref') is not null then
    execute $sql$
      update public.intel_assertions a
      set jurisdiction_id = j.jurisdiction_id
      from public.signals s
      join public.jurisdiction_crossref xref
        on upper(xref.canonical_iso2) = upper(nullif(s.country_iso2, ''))
      join public.jurisdictions j
        on j.jurisdiction_id = xref.jurisdictions_id
      where a.source_signal_id = s.id
        and a.jurisdiction_id is null
    $sql$;

    update public.intel_events e
    set jurisdiction_id = x.jurisdiction_id
    from (
      select ea.event_id, min(a.jurisdiction_id) as jurisdiction_id
      from public.intel_event_assertions ea
      join public.intel_assertions a on a.id = ea.assertion_id
      where a.jurisdiction_id is not null
      group by ea.event_id
      having count(distinct a.jurisdiction_id) = 1
    ) x
    where x.event_id = e.id
      and e.jurisdiction_id is null;
  end if;
end $$;

-- Assessment versions are append-only, including for privileged application paths.
create or replace function public.prevent_intel_assessment_version_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'intel_assessment_versions is append-only';
end;
$$;

drop trigger if exists intel_assessment_versions_immutable on public.intel_assessment_versions;
create trigger intel_assessment_versions_immutable
before update or delete on public.intel_assessment_versions
for each row execute function public.prevent_intel_assessment_version_mutation();

-- Every assessment creation and edit atomically appends the resulting canonical state
-- to the immutable ledger. The trigger is installed only after the migration backfill,
-- whose initial versions already exist, so existing rows are not duplicated.
create or replace function public.append_intel_assessment_version_on_write()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  next_version integer;
begin
  select coalesce(max(v.version), 0) + 1
    into next_version
    from public.intel_assessment_versions v
    where v.assessment_id = new.id;

  insert into public.intel_assessment_versions (assessment_id, version, snapshot, change_reason)
  values (
    new.id,
    next_version,
    jsonb_build_object(
      'what_happened', new.what_happened,
      'what_changed', new.what_changed,
      'why_it_matters', new.why_it_matters,
      'commercial_implications', new.commercial_implications,
      'regulatory_implications', new.regulatory_implications,
      'affected_entities', new.affected_entities,
      'affected_markets', new.affected_markets,
      'affected_products', new.affected_products,
      'why_now', new.why_now,
      'confidence', new.confidence,
      'confidence_rationale', new.confidence_rationale,
      'contradictions', new.contradictions,
      'unknowns', new.unknowns,
      'review_status', new.review_status,
      'updated_at', new.updated_at
    ),
    case when tg_op = 'INSERT' then 'Canonical assessment created' else 'Canonical assessment update' end
  );
  return new;
end;
$$;

drop trigger if exists intel_assessments_append_version on public.intel_assessments;
create trigger intel_assessments_append_version
after insert or update on public.intel_assessments
for each row execute function public.append_intel_assessment_version_on_write();

-- Canonical assessments/events are historical decision records. Their lifecycle is
-- review-state/consolidation-state based, not physical deletion. Prevent parent
-- deletion so immutable version history can never conflict with a cascade.
create or replace function public.prevent_intel_canonical_delete()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception '% is historical Decision Intelligence and cannot be deleted; use review/consolidation state', tg_table_name;
end;
$$;

drop trigger if exists intel_assessments_no_delete on public.intel_assessments;
create trigger intel_assessments_no_delete
before delete on public.intel_assessments
for each row execute function public.prevent_intel_canonical_delete();

drop trigger if exists intel_events_no_delete on public.intel_events;
create trigger intel_events_no_delete
before delete on public.intel_events
for each row execute function public.prevent_intel_canonical_delete();

alter table public.intel_assessment_versions
  drop constraint if exists intel_assessment_versions_assessment_id_fkey,
  add constraint intel_assessment_versions_assessment_id_fkey
    foreign key (assessment_id) references public.intel_assessments(id) on delete restrict;

drop policy if exists intel_assessment_versions_staff_all on public.intel_assessment_versions;
drop policy if exists intel_assessment_versions_staff_select on public.intel_assessment_versions;
drop policy if exists intel_assessment_versions_staff_insert on public.intel_assessment_versions;
create policy intel_assessment_versions_staff_select on public.intel_assessment_versions
for select to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')
));
create policy intel_assessment_versions_staff_insert on public.intel_assessment_versions
for insert to authenticated
with check (exists (
  select 1 from public.user_roles ur
  where ur.user_id = auth.uid() and ur.role in ('admin','operator','analyst')
));
grant select, insert on public.intel_assessment_versions to authenticated;
revoke update, delete on public.intel_assessment_versions from authenticated;

-- Canonical base tables are staff objects. Remove the product-tier SELECT policies
-- from the original migration so Intel/operator customers cannot query canonical
-- rows directly through an exposed public schema. Staff keep the existing *_staff_all
-- RLS policies and receive the DML privileges those policies are intended to govern.
drop policy if exists intel_events_tier_read on public.intel_events;
drop policy if exists intel_event_assertions_tier_read on public.intel_event_assertions;
drop policy if exists intel_assertions_tier_read on public.intel_assertions;
drop policy if exists intel_assertion_evidence_tier_read on public.intel_assertion_evidence;
drop policy if exists intel_evidence_refs_tier_read on public.intel_evidence_refs;
drop policy if exists intel_assessments_tier_read on public.intel_assessments;
drop policy if exists intel_recommendations_tier_read on public.intel_recommendations;

grant select, insert, update, delete on
  public.intel_evidence_refs,
  public.intel_assertions,
  public.intel_assertion_evidence,
  public.intel_event_assertions,
  public.intel_recommendations
  to authenticated;

grant select, insert, update on
  public.intel_events,
  public.intel_assessments
  to authenticated;
revoke delete on public.intel_events, public.intel_assessments from authenticated;

-- Rebuild the dossier projection through displayable event/assessment/recommendation
-- states and displayable assertions only. source_count is derived from that same
-- eligible evidence set so suppression cannot leave a stale corroboration count.
-- The generic review_status is the least-trusted state across the event, assessment
-- and recommendation layers, so a verified event cannot overstate an unverified
-- analytical or decision layer.
create or replace view public.intel_event_dossiers
with (security_invoker = true)
as
select
  e.id,
  e.headline,
  e.summary,
  e.event_type,
  e.jurisdiction_label,
  e.occurred_at,
  e.detected_at,
  e.effective_at,
  e.last_verified_at,
  e.materiality,
  e.consolidation_status,
  case
    when e.review_status = 'needs_review' or a.review_status = 'needs_review' or r.review_status = 'needs_review' then 'needs_review'
    when e.review_status = 'migrated_reviewed' or a.review_status = 'migrated_reviewed' or r.review_status = 'migrated_reviewed' then 'migrated_reviewed'
    when e.review_status = 'verified' and a.review_status = 'verified' and r.review_status = 'verified' then 'verified'
    else 'needs_review'
  end as review_status,
  count(distinct coalesce(nullif(er.source_url,''), nullif(er.source_label,''), er.id::text))
    filter (
      where er.id is not null
        and er.access_classification = 'intel'
        and ia.review_status in ('migrated_reviewed','verified')
    )::integer as source_count,
  a.what_happened,
  a.what_changed,
  a.why_it_matters,
  a.commercial_implications,
  a.regulatory_implications,
  a.affected_entities,
  a.affected_markets,
  a.affected_products,
  a.why_now,
  a.confidence,
  a.confidence_rationale,
  a.contradictions,
  a.unknowns,
  r.recommendation_state,
  r.reasoning as recommendation_reasoning,
  r.action_summary,
  r.urgency,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'sourceLabel', er.source_label,
    'sourceUrl', er.source_url,
    'status', er.evidence_status,
    'observedAt', er.observed_at,
    'relationship', case when ea.role = 'contradicting' then 'contradicts' else ae.relationship end
  )) filter (
    where er.id is not null
      and er.access_classification = 'intel'
      and ia.review_status in ('migrated_reviewed','verified')
  ), '[]'::jsonb) as evidence
from public.intel_events e
join public.intel_assessments a
  on a.event_id = e.id
  and a.review_status in ('migrated_reviewed','verified')
join public.intel_recommendations r
  on r.assessment_id = a.id
  and r.review_status in ('needs_review','migrated_reviewed','verified')
left join public.intel_event_assertions ea on ea.event_id = e.id
left join public.intel_assertions ia on ia.id = ea.assertion_id
left join public.intel_assertion_evidence ae on ae.assertion_id = ia.id
left join public.intel_evidence_refs er on er.id = ae.evidence_ref_id
where e.review_status in ('migrated_reviewed','verified')
  and e.consolidation_status <> 'superseded'
group by e.id, a.id, r.id;

-- The route map is canonical ownership, not a display-state projection. Superseded
-- events intentionally retain route ownership so their legacy source signals cannot
-- fall through and resurrect as legacy dossiers. The dossier projection above hides
-- the superseded event until a future canonical redirect target is explicitly modeled.
create or replace view public.intel_event_route_map
with (security_invoker = true)
as
select distinct ia.source_signal_id as signal_id, ea.event_id
from public.intel_event_assertions ea
join public.intel_assertions ia on ia.id = ea.assertion_id
join public.intel_events e on e.id = ea.event_id
where ia.source_signal_id is not null;

-- Direct relation reads are not the customer execution boundary. Revoke the views
-- created by the original migration and expose narrowly-scoped SECURITY DEFINER RPCs
-- that enforce the existing Intel/operator product-tier check before returning only
-- the allowlisted dossier/route projection. Base-table RLS remains staff-only.
revoke all on public.intel_event_dossiers from authenticated, anon;
revoke all on public.intel_event_route_map from authenticated, anon;
revoke all on api.intel_event_dossiers from authenticated, anon;

create or replace view api.intel_event_route_map
with (security_invoker = true)
as select * from public.intel_event_route_map;
revoke all on api.intel_event_route_map from authenticated, anon;

create or replace function api.get_intel_event_dossier(p_event_id text)
returns setof public.intel_event_dossiers
language plpgsql
stable
security definer
set search_path = pg_catalog, public, api, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  ) then
    return;
  end if;

  return query
    select d.* from public.intel_event_dossiers d where d.id = p_event_id;
end;
$$;

create or replace function api.resolve_intel_event_route(p_signal_id text)
returns table(event_id text)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, api, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  ) then
    return;
  end if;

  return query
    select m.event_id
    from public.intel_event_route_map m
    where m.signal_id = p_signal_id
       or (p_signal_id not like 'rs-%' and m.signal_id = 'rs-' || p_signal_id)
    order by case when m.signal_id = p_signal_id then 0 else 1 end
    limit 1;
end;
$$;

revoke all on function api.get_intel_event_dossier(text) from public, anon;
revoke all on function api.resolve_intel_event_route(text) from public, anon;
grant execute on function api.get_intel_event_dossier(text) to authenticated;
grant execute on function api.resolve_intel_event_route(text) to authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260911225106','decision_intel_stage0_review_fixes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260911225106_decision_intel_stage0_review_fixes.sql

-- RECOVERY BEGIN 20260911225151_decision_intel_stage0_completion_hardening.sql
-- Decision Intelligence Stage 0 completion hardening for PR #1309.
-- First-slice only: publication boundary, upstream withdrawal propagation,
-- dashboard route eligibility, canonical jurisdiction navigation, and complete initial assessment history.

-- Verification and customer publication are separate decisions. Backfilled events were
-- already customer-surfaceable Pipeline-B signals, so they receive the first-slice
-- customer classification explicitly. Future events default to internal.
alter table public.intel_events
  add column if not exists customer_visibility text not null default 'internal';

alter table public.intel_events
  drop constraint if exists intel_events_customer_visibility_chk,
  add constraint intel_events_customer_visibility_chk
    check (customer_visibility in ('internal','intel'));

update public.intel_events e
set customer_visibility = 'intel'
where customer_visibility = 'internal'
  and exists (
    select 1
    from public.signals s
    where s.id = e.canonical_signal_id
      and s.reviewed = true
      and (s.action is null or s.action <> 'rejected')
      and coalesce(s.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
      and (s.content_type is null or s.content_type not in ('story','research','noise'))
  );

-- Append stable canonical jurisdiction navigation metadata to the already allowlisted
-- dossier projection. The ISO-2 value comes only from the authoritative cross-reference
-- attached to the event's canonical jurisdiction ID; unresolved events remain unlinked.
create or replace view public.intel_event_dossiers
with (security_invoker = true)
as
select
  e.id,
  e.headline,
  e.summary,
  e.event_type,
  e.jurisdiction_label,
  e.occurred_at,
  e.detected_at,
  e.effective_at,
  e.last_verified_at,
  e.materiality,
  e.consolidation_status,
  case
    when e.review_status = 'needs_review' or a.review_status = 'needs_review' or r.review_status = 'needs_review' then 'needs_review'
    when e.review_status = 'migrated_reviewed' or a.review_status = 'migrated_reviewed' or r.review_status = 'migrated_reviewed' then 'migrated_reviewed'
    when e.review_status = 'verified' and a.review_status = 'verified' and r.review_status = 'verified' then 'verified'
    else 'needs_review'
  end as review_status,
  count(distinct coalesce(nullif(er.source_url,''), nullif(er.source_label,''), er.id::text))
    filter (
      where er.id is not null
        and er.access_classification = 'intel'
        and ia.review_status in ('migrated_reviewed','verified')
    )::integer as source_count,
  a.what_happened,
  a.what_changed,
  a.why_it_matters,
  a.commercial_implications,
  a.regulatory_implications,
  a.affected_entities,
  a.affected_markets,
  a.affected_products,
  a.why_now,
  a.confidence,
  a.confidence_rationale,
  a.contradictions,
  a.unknowns,
  r.recommendation_state,
  r.reasoning as recommendation_reasoning,
  r.action_summary,
  r.urgency,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'sourceLabel', er.source_label,
    'sourceUrl', er.source_url,
    'status', er.evidence_status,
    'observedAt', er.observed_at,
    'relationship', case when ea.role = 'contradicting' then 'contradicts' else ae.relationship end
  )) filter (
    where er.id is not null
      and er.access_classification = 'intel'
      and ia.review_status in ('migrated_reviewed','verified')
  ), '[]'::jsonb) as evidence,
  e.jurisdiction_id,
  max(jx.canonical_iso2) as jurisdiction_iso2
from public.intel_events e
join public.intel_assessments a
  on a.event_id = e.id
  and a.review_status in ('migrated_reviewed','verified')
join public.intel_recommendations r
  on r.assessment_id = a.id
  and r.review_status in ('needs_review','migrated_reviewed','verified')
left join public.intel_event_assertions ea on ea.event_id = e.id
left join public.intel_assertions ia on ia.id = ea.assertion_id
left join public.intel_assertion_evidence ae on ae.assertion_id = ia.id
left join public.intel_evidence_refs er on er.id = ae.evidence_ref_id
left join public.jurisdiction_crossref jx on jx.jurisdictions_id = e.jurisdiction_id
where e.review_status in ('migrated_reviewed','verified')
  and e.consolidation_status <> 'superseded'
group by e.id, a.id, r.id;

-- Customer-safe dossiers are an explicit publication projection over the already
-- allowlisted dossier shape. Verified internal analysis remains internal. A customer
-- dossier must also retain at least one accepted factual assertion; publication and
-- verification never substitute for an accepted factual basis.
create or replace view public.intel_customer_event_dossiers
with (security_invoker = true)
as
select d.*
from public.intel_event_dossiers d
join public.intel_events e on e.id = d.id
where e.customer_visibility = 'intel'
  and exists (
    select 1
    from public.intel_event_assertions ea
    join public.intel_assertions ia on ia.id = ea.assertion_id
    where ea.event_id = e.id
      and ia.review_status in ('migrated_reviewed','verified')
  );

revoke all on public.intel_customer_event_dossiers from authenticated, anon;

-- Product dossier reads now use the explicit customer-publication projection.
create or replace function api.get_intel_event_dossier(p_event_id text)
returns setof public.intel_event_dossiers
language plpgsql
stable
security definer
set search_path = pg_catalog, public, api, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tier in ('intel','operator')
  ) then
    return;
  end if;

  return query
    select d.* from public.intel_customer_event_dossiers d where d.id = p_event_id;
end;
$$;

revoke all on function api.get_intel_event_dossier(text) from public, anon;
grant execute on function api.get_intel_event_dossier(text) to authenticated;

-- Dashboard route hydration runs only on the server. Return canonical ownership,
-- customer displayability and the current canonical recommendation posture. No evidence,
-- assessment prose, private notes or canonical review metadata cross this boundary.
drop function if exists api.resolve_intel_dashboard_routes(text[]);
create function api.resolve_intel_dashboard_routes(p_signal_ids text[])
returns table(signal_id text, event_id text, displayable boolean, recommendation_state text)
language sql
stable
security definer
set search_path = pg_catalog, public, api
as $$
  select
    m.signal_id,
    m.event_id,
    d.id is not null as displayable,
    d.recommendation_state
  from public.intel_event_route_map m
  left join public.intel_customer_event_dossiers d on d.id = m.event_id
  where m.signal_id = any(coalesce(p_signal_ids, '{}'::text[]));
$$;

revoke all on function api.resolve_intel_dashboard_routes(text[]) from public, anon, authenticated;
grant execute on function api.resolve_intel_dashboard_routes(text[]) to service_role;

-- The immutable assessment ledger is written only by the controlled assessment trigger.
-- Browser-authenticated staff may read history but cannot forge/reserve arbitrary version
-- rows. SECURITY DEFINER is restricted to trigger/service execution.
create or replace function public.append_intel_assessment_version_on_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  next_version integer;
begin
  select coalesce(max(v.version), 0) + 1
    into next_version
    from public.intel_assessment_versions v
    where v.assessment_id = new.id;

  insert into public.intel_assessment_versions (assessment_id, version, snapshot, change_reason)
  values (
    new.id,
    next_version,
    jsonb_build_object(
      'what_happened', new.what_happened,
      'what_changed', new.what_changed,
      'why_it_matters', new.why_it_matters,
      'commercial_implications', new.commercial_implications,
      'regulatory_implications', new.regulatory_implications,
      'affected_entities', new.affected_entities,
      'affected_markets', new.affected_markets,
      'affected_products', new.affected_products,
      'why_now', new.why_now,
      'confidence', new.confidence,
      'confidence_rationale', new.confidence_rationale,
      'contradictions', new.contradictions,
      'unknowns', new.unknowns,
      'review_status', new.review_status,
      'updated_at', new.updated_at
    ),
    case when tg_op = 'INSERT' then 'Canonical assessment created' else 'Canonical assessment update' end
  );
  return new;
end;
$$;

revoke all on function public.append_intel_assessment_version_on_write() from public, anon, authenticated;
grant execute on function public.append_intel_assessment_version_on_write() to service_role;
drop policy if exists intel_assessment_versions_staff_insert on public.intel_assessment_versions;
revoke insert, update, delete on public.intel_assessment_versions from authenticated;
grant select on public.intel_assessment_versions to authenticated;

-- Upstream surfaceability is authoritative for migrated lineage. If a source signal is
-- withdrawn/rejected/unreviewed/reclassified out of the first-slice corpus, suppress
-- the entire affected canonical decision chain and require explicit review/publication
-- before it can ever be customer-visible again.
create or replace function public.suppress_intel_chain_for_withdrawn_signal()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_signal_id text;
  v_withdrawn boolean := false;
begin
  if tg_op = 'DELETE' then
    v_signal_id := old.id;
    v_withdrawn := true;
  else
    v_signal_id := new.id;
    v_withdrawn := not (
      new.reviewed = true
      and (new.action is null or new.action <> 'rejected')
      and coalesce(new.quality_label,'') not in ('spam','boilerplate','nav','duplicate')
      and (new.content_type is null or new.content_type not in ('story','research','noise'))
    );
  end if;

  if not v_withdrawn then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  update public.intel_assertions a
  set review_status = 'needs_review'
  where a.source_signal_id = v_signal_id
    and a.review_status in ('migrated_reviewed','verified');

  update public.intel_events e
  set review_status = 'needs_review',
      customer_visibility = 'internal'
  where e.id in (
    select ea.event_id
    from public.intel_event_assertions ea
    join public.intel_assertions a on a.id = ea.assertion_id
    where a.source_signal_id = v_signal_id
  )
    and (e.review_status in ('migrated_reviewed','verified') or e.customer_visibility <> 'internal');

  update public.intel_assessments a
  set review_status = 'needs_review'
  where a.event_id in (
    select ea.event_id
    from public.intel_event_assertions ea
    join public.intel_assertions ia on ia.id = ea.assertion_id
    where ia.source_signal_id = v_signal_id
  )
    and a.review_status in ('migrated_reviewed','verified');

  update public.intel_recommendations r
  set review_status = 'needs_review'
  where r.assessment_id in (
    select a.id
    from public.intel_assessments a
    where a.event_id in (
      select ea.event_id
      from public.intel_event_assertions ea
      join public.intel_assertions ia on ia.id = ea.assertion_id
      where ia.source_signal_id = v_signal_id
    )
  )
    and r.review_status in ('migrated_reviewed','verified');

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.suppress_intel_chain_for_withdrawn_signal() from public, anon, authenticated;
grant execute on function public.suppress_intel_chain_for_withdrawn_signal() to service_role;

-- AFTER triggers ensure the public signal transition succeeds first; canonical
-- suppression then happens in the same transaction.
drop trigger if exists signals_decision_intel_withdrawal_update on public.signals;
create trigger signals_decision_intel_withdrawal_update
after update of reviewed, action, quality_label, content_type on public.signals
for each row execute function public.suppress_intel_chain_for_withdrawn_signal();

drop trigger if exists signals_decision_intel_withdrawal_delete on public.signals;
create trigger signals_decision_intel_withdrawal_delete
after delete on public.signals
for each row execute function public.suppress_intel_chain_for_withdrawn_signal();

-- Repair migration-created version 1 snapshots to the same complete canonical field
-- contract used by every subsequent version. Because this PR has not been activated in
-- production, the migration chain reaches a complete immutable ledger before release.
drop trigger if exists intel_assessment_versions_immutable on public.intel_assessment_versions;

update public.intel_assessment_versions v
set snapshot = jsonb_build_object(
  'what_happened', a.what_happened,
  'what_changed', a.what_changed,
  'why_it_matters', a.why_it_matters,
  'commercial_implications', a.commercial_implications,
  'regulatory_implications', a.regulatory_implications,
  'affected_entities', a.affected_entities,
  'affected_markets', a.affected_markets,
  'affected_products', a.affected_products,
  'why_now', a.why_now,
  'confidence', a.confidence,
  'confidence_rationale', a.confidence_rationale,
  'contradictions', a.contradictions,
  'unknowns', a.unknowns,
  'review_status', a.review_status,
  'updated_at', a.updated_at
)
from public.intel_assessments a
where v.assessment_id = a.id
  and v.version = 1
  and v.change_reason = 'Stage 0 migration from reviewed/surfaceable Pipeline B signal';

create trigger intel_assessment_versions_immutable
before update or delete on public.intel_assessment_versions
for each row execute function public.prevent_intel_assessment_version_mutation();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260911225151','decision_intel_stage0_completion_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260911225151_decision_intel_stage0_completion_hardening.sql

-- RECOVERY BEGIN 20260911225324_clinical_api_surface.sql
-- Clinical API surface for PostgREST (schema api only).
-- security_invoker views so underlying public RLS applies to the caller JWT.

CREATE OR REPLACE VIEW api.clinical_patients
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_patients;

CREATE OR REPLACE VIEW api.clinical_care_team
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_care_team;

CREATE OR REPLACE VIEW api.clinical_consent_records
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_consent_records;

CREATE OR REPLACE VIEW api.clinical_encounters
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_encounters;

CREATE OR REPLACE VIEW api.clinical_calculations
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_calculations;

CREATE OR REPLACE VIEW api.clinical_recommendations
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_recommendations;

CREATE OR REPLACE VIEW api.clinical_prescriptions
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_prescriptions;

CREATE OR REPLACE VIEW api.clinical_dispensing_events
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_dispensing_events;

CREATE OR REPLACE VIEW api.clinical_jurisdiction_authority
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_jurisdiction_authority;

CREATE OR REPLACE VIEW api.clinical_clinician_links
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_clinician_links;

-- Expose verification fields needed by clinical UI (not public directory)
CREATE OR REPLACE VIEW api.clinical_my_professional
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.title,
  p.credential_type,
  p.verification_status,
  p.status,
  p.licence_number,
  p.licence_jurisdiction,
  p.clinical_role,
  p.user_id,
  p.countries,
  p.specialties
FROM public.hv_professionals p
WHERE p.user_id = (SELECT auth.uid());

-- NOTE: previously had a duplicate, weaker grant on api.clinical_patients
-- (SELECT-only) immediately before this one -- removed. Only the grant
-- below applies.
GRANT SELECT, INSERT, UPDATE ON api.clinical_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_care_team TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_encounters TO authenticated;
GRANT SELECT, INSERT ON api.clinical_calculations TO authenticated;
GRANT SELECT, INSERT ON api.clinical_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_prescriptions TO authenticated;
GRANT SELECT, INSERT ON api.clinical_dispensing_events TO authenticated;
GRANT SELECT ON api.clinical_jurisdiction_authority TO authenticated;
GRANT SELECT ON api.clinical_clinician_links TO authenticated;
GRANT SELECT ON api.clinical_my_professional TO authenticated;

GRANT ALL ON api.clinical_patients TO service_role;
GRANT ALL ON api.clinical_care_team TO service_role;
GRANT ALL ON api.clinical_consent_records TO service_role;
GRANT ALL ON api.clinical_encounters TO service_role;
GRANT ALL ON api.clinical_calculations TO service_role;
GRANT ALL ON api.clinical_recommendations TO service_role;
GRANT ALL ON api.clinical_prescriptions TO service_role;
GRANT ALL ON api.clinical_dispensing_events TO service_role;
GRANT ALL ON api.clinical_jurisdiction_authority TO service_role;
GRANT ALL ON api.clinical_clinician_links TO service_role;
GRANT ALL ON api.clinical_my_professional TO service_role;

-- Gate helper callable from app
CREATE OR REPLACE FUNCTION api.is_verified_clinician(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_verified_clinician(p_user_id);
$$;

REVOKE ALL ON FUNCTION api.is_verified_clinician(uuid) FROM public;
GRANT EXECUTE ON FUNCTION api.is_verified_clinician(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.clinical_has_active_consent(p_patient_id uuid, p_consent_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.clinical_has_active_consent(p_patient_id, p_consent_type);
$$;

REVOKE ALL ON FUNCTION api.clinical_has_active_consent(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION api.clinical_has_active_consent(uuid, text) TO authenticated, service_role;

-- Clinician self-service: request clinical verification fields on linked/owned profile
CREATE OR REPLACE FUNCTION api.clinical_request_verification(
  p_licence_number text,
  p_licence_jurisdiction text,
  p_clinical_role text,
  p_professional_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_clinical_role IS NULL OR p_clinical_role NOT IN (
    'doctor', 'pharmacist', 'nurse', 'nurse_practitioner', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid clinical_role' USING ERRCODE = '22023';
  END IF;

  IF p_licence_number IS NULL OR length(trim(p_licence_number)) < 2 THEN
    RAISE EXCEPTION 'licence_number required' USING ERRCODE = '22023';
  END IF;

  IF p_licence_jurisdiction IS NULL OR length(trim(p_licence_jurisdiction)) < 2 THEN
    RAISE EXCEPTION 'licence_jurisdiction required' USING ERRCODE = '22023';
  END IF;

  IF p_professional_id IS NOT NULL THEN
    UPDATE public.hv_professionals
    SET
      licence_number = trim(p_licence_number),
      licence_jurisdiction = upper(trim(p_licence_jurisdiction)),
      clinical_role = p_clinical_role,
      user_id = COALESCE(user_id, v_uid),
      verification_status = CASE
        WHEN verification_status = 'verified' THEN verification_status
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE id = p_professional_id
      AND (user_id IS NULL OR user_id = v_uid)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.hv_professionals
    SET
      licence_number = trim(p_licence_number),
      licence_jurisdiction = upper(trim(p_licence_jurisdiction)),
      clinical_role = p_clinical_role,
      user_id = COALESCE(user_id, v_uid),
      verification_status = CASE
        WHEN verification_status = 'verified' THEN verification_status
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE user_id = v_uid
    RETURNING id INTO v_id;
  END IF;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'professional profile not found for user' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.clinical_clinician_links (user_id, professional_id, link_status, linked_by)
  VALUES (v_uid, v_id, 'active', v_uid)
  ON CONFLICT (user_id, professional_id) DO UPDATE
    SET link_status = 'active';

  PERFORM public.clinical_audit_write(
    'clinician.verification_requested',
    'hv_professionals',
    v_id::text,
    upper(trim(p_licence_jurisdiction)),
    jsonb_build_object('clinical_role', p_clinical_role),
    v_uid
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION api.clinical_request_verification(text, text, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION api.clinical_request_verification(text, text, text, uuid) TO authenticated, service_role;

-- Admin approve. Requires the 'admin' role specifically -- NOT the generic
-- 'operator' role. Approving a clinician's medical/pharmacy licence is a
-- clinical-governance action, not a commercial/marketplace-admin action;
-- reusing the broad 'operator' role would let non-clinical ops staff
-- approve clinical credentials. If a dedicated clinical-admin role is
-- introduced later, add it here explicitly rather than widening back to
-- 'operator'.
CREATE OR REPLACE FUNCTION api.clinical_admin_verify_professional(
  p_professional_id uuid,
  p_approve boolean,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ok boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_uid AND role = 'admin'
  ) INTO v_ok;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'admin role required for clinical verification approval' USING ERRCODE = '42501';
  END IF;

  IF p_approve THEN
    UPDATE public.hv_professionals
    SET
      verification_status = 'verified',
      status = 'active',
      verified_by = v_uid,
      verification_notes = p_notes,
      verified_at = COALESCE(verified_at, now()),
      updated_at = now()
    WHERE id = p_professional_id
      AND clinical_role IS NOT NULL
      AND licence_number IS NOT NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'professional not eligible for clinical verify' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.clinical_clinician_links (user_id, professional_id, link_status, linked_by)
    SELECT user_id, id, 'active', v_uid
    FROM public.hv_professionals
    WHERE id = p_professional_id AND user_id IS NOT NULL
    ON CONFLICT (user_id, professional_id) DO UPDATE SET link_status = 'active';

    PERFORM public.clinical_audit_write(
      'clinician.verified',
      'hv_professionals',
      p_professional_id::text,
      NULL,
      jsonb_build_object('notes', p_notes),
      v_uid,
      'admin'
    );
  ELSE
    UPDATE public.hv_professionals
    SET
      verification_status = 'rejected',
      verified_by = v_uid,
      verification_notes = p_notes,
      updated_at = now()
    WHERE id = p_professional_id;

    PERFORM public.clinical_audit_write(
      'clinician.rejected',
      'hv_professionals',
      p_professional_id::text,
      NULL,
      jsonb_build_object('notes', p_notes),
      v_uid,
      'admin'
    );
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION api.clinical_admin_verify_professional(uuid, boolean, text) FROM public;
GRANT EXECUTE ON FUNCTION api.clinical_admin_verify_professional(uuid, boolean, text) TO authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260911225324','clinical_api_surface','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260911225324_clinical_api_surface.sql

-- RECOVERY BEGIN 20260912103655_signal_role_family_routing.sql
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

-- Signal → operator routing: role-family dimension
--
-- WHY
-- ---
-- Ingestion is healthy (~330 signals/day, 133 countries, feed fresh). The demand
-- side is not: 7 user_profiles, 0 subscriptions, 6 cc_watchlist_items,
-- 2 cc_watch_rules. The structural cause is that the only join key between a
-- signal and an operator was `country`, so "something happened in Germany" could
-- never become "your EU-GMP import lane is affected".
--
-- This migration adds the missing dimension using the role-family vocabulary
-- that already exists in `lib/roles/role-families.ts` and already drives
-- /country/[country]/role/[role]. Per INTELLIGENCE_ARCHITECTURE_SPEC.md §9
-- guardrail #10, a new parallel vocabulary was explicitly rejected.
--
-- REVERSIBILITY
-- -------------
-- Additive only. No existing column is altered, no row is mutated, no function
-- is replaced. Rollback is the `down` block at the foot of this file: drop the
-- three signals columns, the two cc_watch_rules columns, and the reference
-- table. Nothing reads these columns until a later change wires them up, so a
-- rollback at any point before that is a no-op for users.
--
-- NOT INCLUDED, DELIBERATELY
-- --------------------------
-- * No change to `hv_classify_corpus_harvest`. It is the live writer of
--   signals.quality_label on a pipeline that recovered on 2026-07-31; changing
--   it is a separate, individually reviewable step (guardrail #1, #8).
-- * No backfill. Populating ~5,853 rows is an LLM-spend decision with a cost
--   ceiling that belongs in the dispatch code (guardrail #9), not here.
-- * `cc_pathway_templates.role_id` uses an incompatible vocabulary
--   ('cultivator_producer' vs role-profiles.ts's 'licensed_cultivator'). That
--   drift is real and is NOT silently resolved here.
--
-- TRANSACTION HANDLING
-- --------------------
-- No explicit begin/commit: the Supabase CLI wraps each migration file in its
-- own transaction, and only 14 of this repo's 764 migrations nest one manually.
-- The file is still atomic.
--
-- ON `CREATE INDEX` (SQLFluff PG01 / Squawk)
-- ------------------------------------------------------
-- Both linters want here. Deliberately not used: it cannot run
-- inside a transaction block, so adopting it means either giving up this
-- migration's atomicity or splitting the index builds into a separate
-- non-transactional file. `public.signals` holds ~12.5k rows, where a plain
-- index build is milliseconds — not worth either cost. Recorded here so the
-- next reader does not relitigate it.

-- ── Canonical role-family vocabulary ─────────────────────────────────────────
-- Mirrors lib/roles/role-families.ts. That file stays the source of truth for
-- application behaviour (module ordering, CTAs); this table exists so the
-- database can enforce referential integrity on routed values and so the
-- vocabulary is queryable from SQL. `is_routable` marks the one internal family
-- that must never be a routing target or a subscribable audience.

create table if not exists public.role_families (
  key         text primary key,
  label       text not null,
  is_routable boolean not null default true,
  sort_order  integer not null,
  created_at  timestamptz not null default now()
);

comment on table public.role_families is
  'Canonical operator role-family vocabulary. Mirrors lib/roles/role-families.ts; that file remains source of truth for UI behaviour.';

insert into public.role_families (key, label, is_routable, sort_order) values
  ('genetics_breeding_ip',          'Genetics, breeding & IP',            true,   1),
  ('cultivation_production',        'Cultivation & production',           true,   2),
  ('processing_manufacturing',      'Processing & manufacturing',         true,   3),
  ('trade_distribution',            'Trade & distribution',               true,   4),
  ('buyers_procurement',            'Buyers & procurement',               true,   5),
  ('medical_clinical',              'Medical & clinical',                 true,   6),
  ('pharmacy_dispensing',           'Pharmacy & dispensing',              true,   7),
  ('labs_qa_verification',          'Labs, QA & verification',            true,   8),
  ('research_academia_trials',      'Research, academia & trials',        true,   9),
  ('regulators_policy_government',  'Regulators, policy & government',    true,  10),
  ('finance_investment_insurance',  'Finance, investment & insurance',    true,  11),
  ('equipment_facilities_services', 'Equipment, facilities & services',   true,  12),
  ('legal_compliance_professional', 'Legal, compliance & professional',   true,  13),
  ('data_intelligence_media',       'Data, intelligence & media',         true,  14),
  ('harbourview_admin_operator',    'Harbourview admin & operator',       false, 15)
on conflict (key) do update
  set label = excluded.label,
      is_routable = excluded.is_routable,
      sort_order = excluded.sort_order;

-- Least-privilege: the vocabulary is public reference data and is read by
-- customer-facing surfaces, so authenticated/anon may select. Nothing but the
-- service role may write it (guardrail #6).
alter table public.role_families enable row level security;

drop policy if exists role_families_read on public.role_families;
create policy role_families_read on public.role_families
  for select to anon, authenticated using (true);

-- ── Routing columns on signals ───────────────────────────────────────────────

alter table public.signals
  add column if not exists role_families   text[],
  add column if not exists routing_version text,
  add column if not exists routed_at       timestamptz;

comment on column public.signals.role_families is
  'Operator role families this signal is relevant to. NULL = not yet routed (matches on geography alone); empty array = routed and relevant to none.';
comment on column public.signals.routing_version is
  'Routing definition that produced role_families, e.g. hv-route/role-families/v1. NULL means unrouted — distinct from routed-to-nothing.';

-- GIN supports the `role_families && array[...]` overlap operator that every
-- routed read uses. Partial: unrouted rows are matched by geography and never
-- probe this index, and they are the majority until a backfill runs.
create index if not exists signals_role_families_gin
  on public.signals using gin (role_families)
  where role_families is not null;

-- No (country_iso2, date desc) index is created here. `idx_signals_iso_date`
-- from 20260716195743_signals_country_iso_resolution.sql is already byte-for-byte
-- what routed reads need — confirmed live:
--   CREATE INDEX idx_signals_iso_date ON public.signals
--     USING btree (country_iso2, date DESC) WHERE (country_iso2 IS NOT NULL)
-- Postgres does not deduplicate indexes by definition, and a different name
-- bypasses IF NOT EXISTS, so adding one would have meant two identical B-trees
-- maintained on every insert and country/date update for no query benefit.

-- Routed state is one fact, so the marker and the result cannot disagree:
-- `routing_version IS NULL` (never routed, matches on geography alone) must
-- exactly track `role_families IS NULL`. An empty array with a version set stays
-- valid — that is "routed, relevant to nobody". Without this, a partial
-- classifier or backfill write could set one and not the other and silently
-- widen or empty feeds.
alter table public.signals
  drop constraint if exists signals_routing_state_consistent;
-- Squawk flags NOT VALID + VALIDATE in one transaction as blocking reads. That
-- guidance exists for large tables; `public.signals` holds ~12.5k rows, where the
-- validation scan is milliseconds, so splitting this across two migration files
-- would add a moving part for no measurable lock benefit. Kept as one unit
-- deliberately — revisit if the table grows by orders of magnitude.
-- Blank counts as absent, matching `isRouted()` in lib/signals/routing.ts, which
-- requires a non-empty trimmed string. A bare NULL check accepted
-- `routing_version = ''` alongside a populated `role_families`, so the database
-- called the row routed while the read side called it unrouted and skipped
-- role-family filtering entirely — a malformed write could silently widen feeds.
alter table public.signals
  add constraint signals_routing_state_consistent
  check ((nullif(btrim(routing_version), '') is null) = (role_families is null)) not valid;
alter table public.signals validate constraint signals_routing_state_consistent;

-- ── Structured watch rules ───────────────────────────────────────────────────
-- cc_watch_rules was (rule_type, keywords) — substring matching only, which
-- cannot express "regulatory changes affecting cultivation in Lesotho". These
-- columns are additive; the existing keyword rule type keeps working unchanged.

alter table public.cc_watch_rules
  add column if not exists country_iso2  text[],
  add column if not exists role_families text[],
  add column if not exists min_impact    text;

alter table public.cc_watch_rules
  drop constraint if exists cc_watch_rules_min_impact_check;
alter table public.cc_watch_rules
  add constraint cc_watch_rules_min_impact_check
  check (min_impact is null or min_impact in ('low', 'medium', 'high'));

comment on column public.cc_watch_rules.role_families is
  'Role families this rule subscribes to. NULL/empty = no role-family filter, i.e. geography-only.';

-- ── Referential integrity for the text[] role-family columns ─────────────────
-- Without this the reference table above is decorative: Postgres will happily
-- accept an invented key, or the internal `harbourview_admin_operator` family,
-- into either array. The TypeScript resolver only protects callers that go
-- through it — direct SQL writes, the classifier harvest, and persisted watch
-- rules all bypass it.
--
-- A trigger rather than a CHECK because a CHECK constraint may not query another
-- table. Added to both columns; NULL and empty arrays remain valid (they mean
-- "no filter" / "not yet routed").

create or replace function public.hv_assert_routable_role_families()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare invalid text;
begin
  if new.role_families is null or cardinality(new.role_families) = 0 then
    return new;
  end if;

  -- A NULL element must be rejected explicitly. `string_agg` skips NULL inputs,
  -- so relying on the aggregate alone let `array['cultivation_production', NULL]`
  -- through with `invalid` still NULL — the check silently passing on exactly the
  -- malformed input it exists to catch.
  if exists (select 1 from unnest(new.role_families) as k where k is null) then
    raise exception 'role_families may not contain NULL elements'
      using errcode = '23514';
  end if;

  select string_agg(k, ', ')
    into invalid
  from unnest(new.role_families) as k
  where not exists (
    select 1 from public.role_families rf
    where rf.key = k and rf.is_routable
  );

  if invalid is not null then
    raise exception 'unknown or non-routable role_families: %', invalid
      using errcode = '23514';
  end if;

  return new;
end
$$;

revoke all on function public.hv_assert_routable_role_families() from public;

drop trigger if exists signals_role_families_check on public.signals;
create trigger signals_role_families_check
  before insert or update of role_families on public.signals
  for each row execute function public.hv_assert_routable_role_families();

drop trigger if exists cc_watch_rules_role_families_check on public.cc_watch_rules;
create trigger cc_watch_rules_role_families_check
  before insert or update of role_families on public.cc_watch_rules
  for each row execute function public.hv_assert_routable_role_families();

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- begin;
--   drop trigger if exists signals_role_families_check on public.signals;
--   drop trigger if exists cc_watch_rules_role_families_check on public.cc_watch_rules;
--   drop function if exists public.hv_assert_routable_role_families();
--   drop index if exists public.signals_role_families_gin;
--   drop index if exists public.signals_country_iso2_date_idx;
--   alter table public.signals
--     drop column if exists role_families,
--     drop column if exists routing_version,
--     drop column if exists routed_at;
--   alter table public.cc_watch_rules
--     drop constraint if exists cc_watch_rules_min_impact_check,
--     drop column if exists country_iso2,
--     drop column if exists role_families,
--     drop column if exists min_impact;
--   drop table if exists public.role_families;
-- commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260912103655','signal_role_family_routing','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260912103655_signal_role_family_routing.sql

-- RECOVERY BEGIN 20260912103723_api_expose_quality_and_routing_columns.sql
-- Expose the quality + routing columns through the PostgREST-visible views.
--
-- WHY — TWO SEPARATE PROBLEMS, ONE ROOT CAUSE
-- -------------------------------------------
-- `lib/supabase/server.ts` and `client.ts` pin `db: { schema: 'api' }`, so every
-- supabase-js read goes to `api.*`, not `public.*`. (Raw `fetch` calls to
-- /rest/v1 resolve to `public` instead, because `pgrst.db_schemas` is
-- "public, graphql_public, job_search, api" and `public` is first — which is why
-- `lib/regulatory-signals/public.ts` works while the dashboard does not.)
--
-- 1. PRE-EXISTING, LIVE, USER-VISIBLE (introduced by PR #1214, 2026-07-30)
--    `lib/dashboard/dashboardServerData.ts` selects `analysis` plus
--    SIGNAL_QUALITY_SELECT (quality_label, quality_confidence, content_type,
--    impact, title_en, summary_en, lang_detected, is_representative,
--    cluster_rep_id) from `signals_quality`, and orders by `quality_confidence`.
--    `api.signals_quality` carries none of them. Confirmed live:
--      select quality_confidence from api.signals_quality;  -- 42703 does not exist
--    PostgREST 400s, and the caller's `if (!error && data...)` falls through to
--    source #3, `listIaSignals()` — the `ia_signals` table, 641 rows, against the
--    12,465-row classified corpus. The Command Centre has been quietly serving
--    the wrong, much smaller source ever since, while every monitor stayed green.
--
-- 2. THIS PR's ROUTING COLUMNS
--    `role_families`, `routing_version`, `routed_at` (plus `geo_scope` /
--    `geo_region`, which `lib/signals/routing.ts` needs for regional and global
--    matching) would have been invisible to the same clients for the same
--    reason.
--
-- Same bug class and same fix pattern as
-- 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql and
-- 20260715085610 — a base-table column was added and the exposed view was never
-- refreshed. That has now happened at least three times; see DATABASE_CONTROL.md
-- for the standing note about adding a view-drift check.
--
-- COLUMNS ARE APPENDED, NEVER REORDERED
-- -------------------------------------
-- `create or replace view` cannot drop or reorder columns ("cannot drop columns
-- from view") — the 20260715085540 stub is a migration that died on exactly that.
-- Every existing column below is reproduced in its current live order and the
-- new ones are added at the end.
--
-- DELIBERATELY NOT CHANGED — needs an explicit decision
-- ----------------------------------------------------
-- `public.signals_quality`'s WHERE clause still gates rows on `score`:
--   reviewed = true OR cat NOT IN ('SOURCE_ENGINE','GAZETTE')
--     OR (cat='SOURCE_ENGINE' AND score >= 50 AND score < 90)
--     OR (cat='GAZETTE' AND score >= 70)
-- `score` is the legacy keyword scorer documented as INVERTED in
-- INTELLIGENCE_ARCHITECTURE_SPEC.md §2.5 and retired as a promotion instrument —
-- so a view named `signals_quality` is selecting rows by the one number the
-- platform has agreed not to trust. Changing which rows the Command Centre shows
-- is a product decision, not a drift fix, so this migration only makes the
-- columns readable and leaves row selection exactly as-is. Flagged for Tyler.
--
-- REVERSIBILITY
-- -------------
-- Additive column exposure only. No base table touched, no row mutated, no
-- filter altered, no grant widened. Rollback block at the foot.

-- ON `NOTIFY pgrst, 'reload schema'`
-- ----------------------------------
-- Not issued here, deliberately. Supabase installs its own schema-cache watchers
-- in the database rather than in this repo's migrations, so grepping `supabase/`
-- suggests none exist. Confirmed live on `zvxdgdkukjrrwamdpqrg`:
--   pgrst_ddl_watch   | ddl_command_end | enabled
--   pgrst_drop_watch  | sql_drop        | enabled
-- Both fire the reload automatically after the DDL below, making a manual NOTIFY
-- redundant. Recorded so this is not re-raised on the next read.

-- ── public.signals_quality — add the columns the view never carried ──────────

create or replace view public.signals_quality as
  select
    id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at,
    analysis, analysis_generated_at, analysis_backend,
    -- appended below this line
    quality_label, quality_confidence, content_type, impact, classifier_version,
    title_en, summary_en, lang_detected,
    is_representative, cluster_rep_id, corroborating_count,
    country_iso2, geo_scope, geo_region,
    role_families, routing_version, routed_at
  from public.signals
  where (action is null or action <> 'rejected')
    and (
      reviewed = true
      or (cat <> all (array['SOURCE_ENGINE'::text, 'GAZETTE'::text]))
      or (cat = 'SOURCE_ENGINE' and score >= 50 and score < 90)
      or (cat = 'GAZETTE' and score >= 70)
    );

-- ── api.signals_quality — the view the dashboard actually reads ──────────────

create or replace view api.signals_quality as
  select
    id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at,
    -- appended below this line
    analysis, analysis_generated_at, analysis_backend,
    quality_label, quality_confidence, content_type, impact, classifier_version,
    title_en, summary_en, lang_detected,
    is_representative, cluster_rep_id, corroborating_count,
    country_iso2, geo_scope, geo_region,
    role_families, routing_version, routed_at
  from public.signals_quality;

-- ── api.signals ──────────────────────────────────────────────────────────────

create or replace view api.signals as
  select
    id, date, cat, pri, score, headline, summary, source, url, verification,
    tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
    query_pack, commercial_impact, reviewed, action, created_at,
    embedding_1024, embedding_model, embedded_at, reviewed_by, reviewed_at,
    editorial_title, editorial_blurb, country_iso2,
    -- appended below this line
    quality_label, quality_confidence, content_type, impact, classifier_version,
    title_en, summary_en, lang_detected,
    is_representative, cluster_rep_id, corroborating_count,
    geo_scope, geo_region,
    role_families, routing_version, routed_at
  from public.signals;

-- ── api.cc_watch_rules — structured subscription fields ──────────────────────

create or replace view api.cc_watch_rules as
  select
    id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at,
    -- appended below this line
    country_iso2, role_families, min_impact
  from public.cc_watch_rules;

-- ── api.role_families — the vocabulary itself ────────────────────────────────
-- Read-only reference data. Clients need it to render subscription pickers.

create or replace view api.role_families as
  select key, label, is_routable, sort_order
  from public.role_families;

-- Least privilege: read-only to the browser roles, no write grant (guardrail #6).
--
-- BOTH grants are required. The `enforce_api_view_security_invoker_trigger`
-- event trigger (ddl_command_end) stamps every `api.*` view `security_invoker=on`
-- — confirmed live: 141 of 141 api views carry it. An invoker view executes with
-- the caller's privileges, so granting only the view yields
-- "permission denied for table role_families" at request time. The base-table
-- grant is what actually makes it readable; the RLS select policy added in
-- 20260731120000 is what keeps it read-only.
grant select on api.role_families to anon, authenticated;
grant select on public.role_families to anon, authenticated;

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- `create or replace view` cannot drop columns, so a true revert means dropping
-- and recreating each view at its previous column list. Definitions as they
-- stood on 2026-08-01 are recorded in docs/control/DATABASE_CONTROL.md.
--
-- begin;
--   drop view if exists api.role_families;
--   drop view if exists api.cc_watch_rules;      -- then recreate at 8 columns
--   drop view if exists api.signals;             -- then recreate at 32 columns
--   drop view if exists api.signals_quality;     -- then recreate at 27 columns
--   drop view if exists public.signals_quality;  -- then recreate at 30 columns
-- commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260912103723','api_expose_quality_and_routing_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260912103723_api_expose_quality_and_routing_columns.sql

-- RECOVERY BEGIN 20260912103805_harden_eval_labels_and_alert_delivery.sql
-- Forward-fix classifier learning-loop authorization and asynchronous alert delivery.
--
-- The ground-truth eval-set mutation is service-role-only. Authenticated
-- admin/operator users retain a narrowly authorized wrapper whose audit identity
-- is derived from auth.uid(), not supplied by the caller.
--
-- pg_net request ids mean queued, not delivered. Alert rows become delivered
-- only after a harvested 2xx response. Failures are retried with bounded
-- backoff, provider response bodies are never persisted, and concurrent ticks
-- operate on one locked set of alert ids.

revoke execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)
  to service_role;

create or replace function api.admin_add_signal_to_eval_set(
  p_signal_id text,
  p_quality_label text,
  p_content_type text,
  p_impact text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'api', 'auth', 'pg_temp'
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1
      from public.user_roles ur
     where ur.user_id = v_user_id
       and ur.role in ('admin', 'operator')
  ) then
    raise exception 'insufficient privileges: admin/operator role required'
      using errcode = '42501';
  end if;

  return api.add_signal_to_eval_set(
    p_signal_id,
    p_quality_label,
    p_content_type,
    p_impact,
    p_notes,
    'user:' || v_user_id::text
  );
end
$function$;

comment on function api.admin_add_signal_to_eval_set(text,text,text,text,text) is
  'Admin/operator learning-loop wrapper. The underlying mutation remains service-role-only and labeled_by is derived from auth.uid().';

revoke execute on function api.admin_add_signal_to_eval_set(text,text,text,text,text)
  from public, anon;
grant execute on function api.admin_add_signal_to_eval_set(text,text,text,text,text)
  to authenticated, service_role;

alter table public.hv_alert_log
  add column if not exists delivery_request_id bigint,
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists last_delivery_error text,
  add column if not exists delivery_queued_at timestamptz,
  add column if not exists next_delivery_attempt_at timestamptz;

alter table public.hv_alert_log
  drop constraint if exists hv_alert_log_delivery_status_check;
alter table public.hv_alert_log
  add constraint hv_alert_log_delivery_status_check
  check (delivery_status in ('pending', 'queued', 'delivered', 'failed')) not valid;
alter table public.hv_alert_log
  validate constraint hv_alert_log_delivery_status_check;

comment on column public.hv_alert_log.delivery_status is
  'Email lifecycle. queued is not delivery; only a harvested 2xx response becomes delivered.';
comment on column public.hv_alert_log.last_delivery_error is
  'Sanitized operational category and HTTP status only. Provider response bodies, recipients, headers, and credentials are never persisted.';

create or replace function public.hv_alert_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'net', 'vault'
as $function$
declare
  v_open               int := 0;
  v_new                int := 0;
  v_resolved           int := 0;
  v_delivered          int := 0;
  v_failed             int := 0;
  v_timed_out          int := 0;
  v_queued             int := 0;
  v_permanently_failed int := 0;
  v_key                text;
  v_to                 text;
  v_body               text;
  v_rid                bigint;
  v_alert_ids          bigint[] := '{}'::bigint[];
begin
  -- Harvest prior asynchronous requests before considering another attempt.
  with responses as (
    select l.id, r.status_code
      from public.hv_alert_log l
      join net._http_response r on r.id = l.delivery_request_id
     where l.delivery_status = 'queued'
  ), reconciled as (
    update public.hv_alert_log l
       set delivery_status = case when r.status_code between 200 and 299 then 'delivered' else 'failed' end,
           notified_at = case when r.status_code between 200 and 299 then now() else l.notified_at end,
           delivery_attempts = case when r.status_code between 200 and 299 then 0 else l.delivery_attempts end,
           delivery_queued_at = null,
           last_delivery_error = case
             when r.status_code between 200 and 299 then null
             else 'provider_rejected:http_' || coalesce(r.status_code::text, 'unknown')
           end,
           next_delivery_attempt_at = case
             when r.status_code between 200 and 299 then null
             else now() + least(
               interval '6 hours',
               interval '15 minutes' * power(2.0, greatest(l.delivery_attempts - 1, 0))::double precision
             )
           end
      from responses r
     where l.id = r.id
    returning delivery_status
  )
  select count(*) filter (where delivery_status = 'delivered'),
         count(*) filter (where delivery_status = 'failed')
    into v_delivered, v_failed
    from reconciled;

  -- A queued request with no response after two hours becomes retryable.
  update public.hv_alert_log
     set delivery_status = 'failed',
         last_delivery_error = 'provider_timeout:no_pg_net_response_after_2h',
         delivery_queued_at = null,
         next_delivery_attempt_at = now() + least(
           interval '6 hours',
           interval '15 minutes' * power(2.0, greatest(delivery_attempts - 1, 0))::double precision
         )
   where delivery_status = 'queued'
     and delivery_queued_at < now() - interval '2 hours';
  get diagnostics v_timed_out = row_count;
  v_failed := v_failed + v_timed_out;

  with cur as (
    select * from public.hv_pipeline_alerts() where severity <> 'ok'
  ), upsert as (
    insert into public.hv_alert_log (alert_key, severity, value, detail)
    select c.alert_key, c.severity, c.value, c.detail from cur c
    on conflict (alert_key) where resolved_at is null
    do update set severity = excluded.severity,
                  value = excluded.value,
                  detail = excluded.detail,
                  last_seen_at = now()
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted), count(*) into v_new, v_open from upsert;

  update public.hv_alert_log l set resolved_at = now()
   where l.resolved_at is null
     and not exists (
       select 1 from public.hv_pipeline_alerts() a
        where a.alert_key = l.alert_key and a.severity <> 'ok');
  get diagnostics v_resolved = row_count;

  select count(*)
    into v_permanently_failed
    from public.hv_alert_log
   where resolved_at is null
     and delivery_status = 'failed'
     and delivery_attempts >= 5;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_email_to' limit 1;

  if v_key is null or v_to is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'skipped: vault needs resend_api_key and alert_email_to');
  end if;

  -- Lock one exact eligible set. Concurrent ticks skip these rows and cannot
  -- construct an email body from a different snapshot than the queued update.
  select coalesce(array_agg(e.id order by e.id), '{}'::bigint[])
    into v_alert_ids
    from (
      select l.id
        from public.hv_alert_log l
       where l.resolved_at is null
         and l.delivery_status <> 'queued'
         and l.delivery_attempts < 5
         and coalesce(l.next_delivery_attempt_at, '-infinity'::timestamptz) <= now()
         and (l.notified_at is null or l.notified_at < now() - interval '6 hours')
       order by l.id
       for update skip locked
    ) e;

  if coalesce(array_length(v_alert_ids, 1), 0) = 0 then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'nothing eligible to queue');
  end if;

  select string_agg(
           '[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value, '') ||
           E'\n    ' || coalesce(detail, ''), E'\n' order by id)
    into v_body
    from public.hv_alert_log
   where id = any (v_alert_ids);

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object(
      'from', 'Harbourview Pipeline <alerts@harbourview.company>',
      'to', jsonb_build_array(v_to),
      'subject', 'Harbourview pipeline: ' || v_open || ' open alert(s)',
      'text', 'Pipeline assertions failing as of ' || now()::text || E':\n\n' || v_body
    ),
    timeout_milliseconds := 20000
  ) into v_rid;

  update public.hv_alert_log
     set delivery_request_id = v_rid,
         delivery_status = 'queued',
         delivery_attempts = delivery_attempts + 1,
         delivery_queued_at = now(),
         last_delivery_error = null,
         next_delivery_attempt_at = null
   where id = any (v_alert_ids);
  get diagnostics v_queued = row_count;

  return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
    'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
    'permanently_failed', v_permanently_failed, 'queued', v_queued,
    'delivery', 'queued', 'request_id', v_rid);
end
$function$;

comment on function public.hv_alert_tick() is
  'Records pipeline assertion breaches, reconciles async pg_net delivery, retries failures with bounded exponential backoff, reports permanently failed rows, and queues one concurrency-safe locked alert set. notified_at means confirmed 2xx delivery.';

revoke execute on function public.hv_alert_tick() from public, anon, authenticated;
grant execute on function public.hv_alert_tick() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260912103805','harden_eval_labels_and_alert_delivery','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260912103805_harden_eval_labels_and_alert_delivery.sql

-- RECOVERY BEGIN 20260912103836_harden_edge_function_cron_auth.sql
-- Harden inbound authentication for production Edge Functions invoked by pg_cron.
-- No secret values are stored in this migration. Each helper reads its high-entropy
-- caller secret from Supabase Vault at execution time and fails closed when absent.
--
-- Required Vault secret names before production activation:
--   job_refresh_cron_secret
--   schema_drift_cron_secret
--   hv_source_pull_runner_secret
--
-- HV_PRIVATE_PIPELINE_RUNNER_SECRET is intentionally not wired here because the
-- production caller for hv-private-pipeline-runner is not yet verified.

create or replace function public.invoke_job_refresh()
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'job_refresh_cron_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'job_refresh_cron_secret is not configured';
  end if;

  return net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/job-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-harbourview-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$fn$;

create or replace function public.invoke_schema_drift_monitor()
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'schema_drift_cron_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'schema_drift_cron_secret is not configured';
  end if;

  return net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/schema-drift-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-harbourview-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$fn$;

create or replace function public.hv_trigger_source_pull_runner()
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'hv_source_pull_runner_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'hv_source_pull_runner_secret is not configured';
  end if;

  return net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-source-pull-runner',
    params := jsonb_build_object('tier', '2', 'adapter', 'rss', 'limit', '3'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-harbourview-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
end;
$fn$;

revoke all on function public.invoke_job_refresh() from public, anon, authenticated;
revoke all on function public.invoke_schema_drift_monitor() from public, anon, authenticated;
revoke all on function public.hv_trigger_source_pull_runner() from public, anon, authenticated;
grant execute on function public.invoke_job_refresh() to service_role;
grant execute on function public.invoke_schema_drift_monitor() to service_role;
grant execute on function public.hv_trigger_source_pull_runner() to service_role;

comment on function public.invoke_job_refresh() is
  'Vault-backed authenticated pg_cron caller for the job-refresh Edge Function.';
comment on function public.invoke_schema_drift_monitor() is
  'Vault-backed authenticated pg_cron caller for the schema-drift-monitor Edge Function.';
comment on function public.hv_trigger_source_pull_runner() is
  'Vault-backed authenticated pg_cron caller for the hv-source-pull-runner Edge Function.';

-- Preserve current production schedules and job identities where possible by
-- changing only their command text. If a named job is absent, leave it absent;
-- this migration does not create new schedules implicitly.
--
-- Supabase owns cron.job as supabase_admin and grants postgres SELECT but not
-- direct UPDATE. pg_cron exposes cron.alter_job(...) to postgres for supported
-- mutation of postgres-owned jobs, so use that API instead of writing cron.job.
do $cron_auth$
declare
  v_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise notice 'cron.job unavailable; caller helpers installed but schedules not rewired';
    return;
  end if;

  select jobid into v_job_id
  from cron.job
  where jobname = 'job-refresh-daily';
  if found then
    perform cron.alter_job(v_job_id, command => 'select public.invoke_job_refresh();');
  end if;

  select jobid into v_job_id
  from cron.job
  where jobname = 'schema-drift-monitor';
  if found then
    perform cron.alter_job(v_job_id, command => 'select public.invoke_schema_drift_monitor();');
  end if;

  select jobid into v_job_id
  from cron.job
  where jobname = 'hv-source-pull-runner-safe-rss';
  if found then
    perform cron.alter_job(v_job_id, command => 'select public.hv_trigger_source_pull_runner();');
  end if;
end
$cron_auth$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260912103836','harden_edge_function_cron_auth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260912103836_harden_edge_function_cron_auth.sql

-- RECOVERY BEGIN 20260912162110_expose_country_legal_status_via_api_schema.sql
create or replace view api.country_cannabis_legal_status_v1
with (security_invoker = on) as
select iso2, country_name, legal_status, notes, last_reviewed
from public.country_cannabis_legal_status;

grant select on api.country_cannabis_legal_status_v1 to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260912162110','expose_country_legal_status_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260912162110_expose_country_legal_status_via_api_schema.sql

-- RECOVERY BEGIN 20260913002300_market_entry_os_mission_workspace.sql
-- Restored from production migration ledger on 2026-09-16.
-- Source: supabase_migrations.schema_migrations (ledger-exact).

-- Market Entry OS durable execution state.
create table if not exists public.market_entry_missions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  origin_iso2 text not null check (origin_iso2 ~ '^[A-Z]{2}$'),
  destination_iso2 text not null check (destination_iso2 ~ '^[A-Z]{2}$'),
  product_class text not null check (product_class in ('any','flower','extract','finished_product','starting_material')),
  status text not null default 'draft' check (status in ('draft','blocked','orientation','ready','in_progress','completed')),
  plan_version integer not null default 2,
  plan_snapshot jsonb not null,
  evidence_snapshot jsonb not null,
  reproducibility_key text not null,
  checkout_session_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_entry_missions_distinct_corridor check (origin_iso2 <> destination_iso2)
);
create index if not exists market_entry_missions_owner_idx on public.market_entry_missions(owner_user_id, created_at desc);
create index if not exists market_entry_missions_corridor_idx on public.market_entry_missions(origin_iso2, destination_iso2, product_class);
create table if not exists public.market_entry_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.market_entry_missions(id) on delete cascade,
  task_key text not null,
  title text not null,
  description text not null,
  side text not null check (side in ('export','import','shared')),
  status text not null default 'pending' check (status in ('pending','blocked','in_progress','complete')),
  prerequisite_task_keys text[] not null default '{}',
  estimated_weeks numeric,
  evidence_ids text[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(mission_id, task_key)
);
create index if not exists market_entry_tasks_mission_idx on public.market_entry_tasks(mission_id, status);
create table if not exists public.market_entry_events (
  id bigint generated by default as identity primary key,
  mission_id uuid not null references public.market_entry_missions(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists market_entry_events_mission_idx on public.market_entry_events(mission_id, created_at desc);
alter table public.market_entry_missions enable row level security;
alter table public.market_entry_missions force row level security;
alter table public.market_entry_tasks enable row level security;
alter table public.market_entry_tasks force row level security;
alter table public.market_entry_events enable row level security;
alter table public.market_entry_events force row level security;
drop policy if exists market_entry_missions_owner_select on public.market_entry_missions;
create policy market_entry_missions_owner_select on public.market_entry_missions for select using (owner_user_id = auth.uid());
drop policy if exists market_entry_missions_owner_insert on public.market_entry_missions;
create policy market_entry_missions_owner_insert on public.market_entry_missions for insert with check (owner_user_id = auth.uid());
drop policy if exists market_entry_missions_owner_update on public.market_entry_missions;
create policy market_entry_missions_owner_update on public.market_entry_missions for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists market_entry_missions_owner_delete on public.market_entry_missions;
create policy market_entry_missions_owner_delete on public.market_entry_missions for delete using (owner_user_id = auth.uid());
drop policy if exists market_entry_tasks_owner_select on public.market_entry_tasks;
create policy market_entry_tasks_owner_select on public.market_entry_tasks for select using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_tasks_owner_insert on public.market_entry_tasks;
create policy market_entry_tasks_owner_insert on public.market_entry_tasks for insert with check (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_tasks_owner_update on public.market_entry_tasks;
create policy market_entry_tasks_owner_update on public.market_entry_tasks for update using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid())) with check (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_tasks_owner_delete on public.market_entry_tasks;
create policy market_entry_tasks_owner_delete on public.market_entry_tasks for delete using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_events_owner_select on public.market_entry_events;
create policy market_entry_events_owner_select on public.market_entry_events for select using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_events_owner_insert on public.market_entry_events;
create policy market_entry_events_owner_insert on public.market_entry_events for insert with check (actor_user_id = auth.uid() and exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
revoke all on table public.market_entry_missions from anon;
revoke all on table public.market_entry_tasks from anon;
revoke all on table public.market_entry_events from anon;
grant select, insert, update, delete on public.market_entry_missions to authenticated;
grant select, insert, update, delete on public.market_entry_tasks to authenticated;
grant select, insert on public.market_entry_events to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913002300','market_entry_os_mission_workspace','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913002300_market_entry_os_mission_workspace.sql

-- RECOVERY BEGIN 20260913002354_market_entry_claim_provenance_and_payments.sql
-- Restored from production migration ledger on 2026-09-16.
alter table public.market_entry_missions add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid','checkout_created','paid','failed','refunded')), add column if not exists report_status text not null default 'locked' check (report_status in ('locked','generating','ready','delivered','void')), add column if not exists stripe_payment_intent_id text, add column if not exists stripe_customer_id text, add column if not exists report_snapshot jsonb, add column if not exists paid_at timestamptz, add column if not exists delivered_at timestamptz;
create unique index if not exists market_entry_missions_payment_intent_uidx on public.market_entry_missions(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create table if not exists public.regulatory_market_access_claims (claim_id uuid primary key default gen_random_uuid(), evidence_key text not null references public.regulatory_market_access_evidence(evidence_key) on delete cascade, jurisdiction_iso2 text not null, claim_key text not null unique, claim_text text not null, product_class text not null check (product_class in ('any','flower','extract','finished_product','starting_material')), jurisdiction_scope text not null, authority_name text not null, authority_url text not null, source_document_id text, source_effective_date date, retrieved_at timestamptz, verified_at timestamptz, expires_at timestamptz, evidence_status text not null default 'unverified' check (evidence_status in ('unverified','partial','verified','superseded','rejected')), source_snapshot_sha256 text, source_snapshot_uri text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint market_entry_claim_freshness check (expires_at is null or verified_at is null or expires_at > verified_at));
create index if not exists regulatory_market_access_claims_jurisdiction_idx on public.regulatory_market_access_claims(jurisdiction_iso2, product_class, evidence_status);
create index if not exists regulatory_market_access_claims_evidence_idx on public.regulatory_market_access_claims(evidence_key);
alter table public.regulatory_market_access_claims enable row level security; alter table public.regulatory_market_access_claims force row level security;
drop policy if exists regulatory_market_access_claims_public_read on public.regulatory_market_access_claims; create policy regulatory_market_access_claims_public_read on public.regulatory_market_access_claims for select to anon, authenticated using (evidence_status='verified' and source_snapshot_sha256 is not null and expires_at > now());
revoke insert,update,delete on public.regulatory_market_access_claims from anon,authenticated; grant select on public.regulatory_market_access_claims to anon,authenticated;
drop view if exists api.regulatory_market_access_executable_claims; create view api.regulatory_market_access_executable_claims as select claim_id,claim_key,evidence_key,jurisdiction_iso2,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_document_id,source_effective_date,retrieved_at,verified_at,expires_at,source_snapshot_sha256,source_snapshot_uri from public.regulatory_market_access_claims where evidence_status='verified' and authority_url<>'' and source_effective_date is not null and retrieved_at is not null and verified_at is not null and expires_at>now() and source_snapshot_sha256 is not null; grant select on api.regulatory_market_access_executable_claims to authenticated,service_role;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,verified_at,expires_at,evidence_status,source_snapshot_sha256) select e.evidence_key,e.jurisdiction_iso2,'market-access:'||e.evidence_key,e.rationale,'any',case when e.parent_iso2 is null then 'jurisdiction' else 'national_pathway_inheritance' end,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.expires_at,case when e.source_snapshot_sha256 is not null and e.source_effective_date is not null then 'verified' else 'partial' end,e.source_snapshot_sha256 from public.regulatory_market_access_evidence e on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,evidence_status=case when excluded.source_snapshot_sha256 is not null and excluded.source_effective_date is not null then 'verified' else 'partial' end,source_snapshot_sha256=excluded.source_snapshot_sha256,updated_at=now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913002354','market_entry_claim_provenance_and_payments','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913002354_market_entry_claim_provenance_and_payments.sql

-- RECOVERY BEGIN 20260913113111_outcome_check_recognize_manual_digest.sql
-- Restored from production migration ledger on 2026-09-16.
CREATE OR REPLACE FUNCTION public.hv_intelligence_outcome_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_newest_promoted timestamptz;
  v_feed_age_hours numeric;
  v_last_digest date;
  v_last_digest_manual boolean;
  v_digest_age_days int;
  v_unclassified bigint;
  v_reviewed_7d bigint;
  v_not_helpful_7d bigint;
  v_alerts jsonb := '[]'::jsonb;
  v_status text := 'healthy';
begin
  select max(reviewed_at) into v_newest_promoted from public.signals where reviewed is true;
  v_feed_age_hours := case when v_newest_promoted is null then null else extract(epoch from (now() - v_newest_promoted)) / 3600.0 end;
  select max(digest_date) into v_last_digest from public.daily_digest where status in ('published', 'published_manual') and ((headlines is not null and jsonb_array_length(headlines) > 0) or (editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0));
  select status = 'published_manual' into v_last_digest_manual from public.daily_digest where digest_date = v_last_digest;
  v_digest_age_days := case when v_last_digest is null then null else (current_date - v_last_digest) end;
  select count(*) into v_unclassified from public.signals where reviewed is distinct from true and quality_label is null and created_at > now() - interval '14 days';
  select count(*) into v_reviewed_7d from public.signals where reviewed is true and coalesce(reviewed_at, created_at) > now() - interval '7 days';
  select count(*) into v_not_helpful_7d from public.signal_relevance_feedback where verdict in ('not_helpful', 'stale', 'wrong_country') and created_at > now() - interval '7 days';
  if v_feed_age_hours is null or v_feed_age_hours > 72 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','feed_stale','severity','critical','message',format('Intel feed has no promotion in %s hours. Operators see a silent stale product while monitors may still say green.',coalesce(round(v_feed_age_hours)::text,'unknown')))); v_status := 'critical';
  elsif v_feed_age_hours > 36 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','feed_aging','severity','warning','message',format('Intel feed last promotion %s hours ago — still within tolerance but cooling.',round(v_feed_age_hours)))); if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;
  if v_digest_age_days is null or v_digest_age_days > 2 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','digest_stale','severity','critical','message',format('Daily Digest has no published edition (LLM or manual-pass) for %s days. Check run_daily_digest / LLM providers.',coalesce(v_digest_age_days::text,'unknown')))); v_status := 'critical';
  elsif v_digest_age_days > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','digest_missed_today','severity','warning','message','No Digest edition for today yet — may still land if cron is pending.')); if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;
  if v_last_digest_manual then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','digest_on_manual_fallback','severity','info','message',format('Most recent edition (%s) was the non-LLM manual-pass fallback, not LLM-curated -- likely means all configured LLM providers are still degraded.',v_last_digest)));
  end if;
  if v_unclassified > 2000 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','classify_backlog','severity','warning','message',format('%s unclassified signals in 14d window — quality pipeline may be lagging.',v_unclassified))); if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;
  if v_not_helpful_7d >= 5 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','operator_negative_feedback','severity','info','message',format('%s negative operator feedback marks in 7d — review ranking / promotion sample.',v_not_helpful_7d)));
  end if;
  return jsonb_build_object('ok',true,'status',v_status,'checked_at',now(),'metrics',jsonb_build_object('newest_promoted_at',v_newest_promoted,'feed_age_hours',v_feed_age_hours,'last_digest_date',v_last_digest,'last_digest_is_manual_fallback',coalesce(v_last_digest_manual,false),'digest_age_days',v_digest_age_days,'unclassified_14d',v_unclassified,'reviewed_7d',v_reviewed_7d,'negative_feedback_7d',v_not_helpful_7d),'alerts',v_alerts);
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913113111','outcome_check_recognize_manual_digest','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913113111_outcome_check_recognize_manual_digest.sql

-- RECOVERY BEGIN 20260913114422_20260913114340_production_security_hardening_followup.sql
alter view public.marketplace_public_listings_v1 set (security_invoker = true);
alter view public.signals_intelligence_feed set (security_invoker = true);
alter view public.signals_quality set (security_invoker = true);
revoke all on schema net from anon, authenticated;
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname in ('public','api','signals','regulatory_signals') loop
    execute format('revoke execute on function %s from anon, authenticated', r.sig);
  end loop;
end $$;
grant execute on function api.get_command_centre_stats() to authenticated;
grant execute on function api.get_corridor_stats(text) to authenticated;
grant execute on function api.get_source_registry_coverage(text) to authenticated;
grant execute on function api.regulatory_pending_changes_feed() to authenticated;
grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to authenticated;
grant execute on function api.is_verified_clinician(uuid) to authenticated;
grant execute on function api.clinical_has_active_consent(uuid,text) to authenticated;
grant execute on function api.clinical_request_verification(text,text,text,uuid) to authenticated;
grant execute on function public.hv_is_org_member(uuid) to authenticated;
grant execute on function public.hv_is_platform_staff() to authenticated;
grant execute on function public.is_genetics_admin_or_reviewer() to authenticated;
grant execute on function public.is_harbourview_admin() to authenticated;
grant execute on function public.is_hv_staff() to authenticated;
grant execute on function public.current_user_tier() to authenticated;
grant execute on function public.is_regulatory_tier_admin() to authenticated;
alter function public.hv_truncate_at_word_boundary(text, integer) set search_path = pg_catalog, public;
do $$
declare r record;
begin
  if exists (select 1 from pg_namespace where nspname='net') then
    for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_depend d on d.objid=p.oid and d.deptype='e' join pg_extension e on e.oid=d.refobjid where e.extname='pg_net' loop
      execute format('revoke execute on function %s from anon, authenticated', r.sig);
    end loop;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913114422','20260913114340_production_security_hardening_followup','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913114422_20260913114340_production_security_hardening_followup.sql

-- RECOVERY BEGIN 20260913114459_20260913114600_pgnet_browser_boundary.sql
revoke all on schema net from public;
revoke all on schema net from anon, authenticated;
do $$
declare r record;
begin
  if exists (select 1 from pg_namespace where nspname='net') then
    for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_depend d on d.objid=p.oid and d.deptype='e' join pg_extension e on e.oid=d.refobjid where e.extname='pg_net' loop
      execute format('revoke execute on function %s from public', r.sig);
      execute format('revoke execute on function %s from anon, authenticated', r.sig);
    end loop;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913114459','20260913114600_pgnet_browser_boundary','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913114459_20260913114600_pgnet_browser_boundary.sql

-- RECOVERY BEGIN 20260913114553_20260913120000_harden_definer_execution_defaults.sql
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname in ('public','api','signals','regulatory_signals') loop
    execute format('revoke execute on function %s from public', r.sig);
    execute format('revoke execute on function %s from anon, authenticated', r.sig);
  end loop;
end $$;
grant execute on function api.get_command_centre_stats() to authenticated;
grant execute on function api.get_corridor_stats(text) to authenticated;
grant execute on function api.get_source_registry_coverage(text) to authenticated;
grant execute on function api.regulatory_pending_changes_feed() to authenticated;
grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to authenticated;
grant execute on function api.is_verified_clinician(uuid) to authenticated;
grant execute on function api.clinical_has_active_consent(uuid,text) to authenticated;
grant execute on function api.clinical_request_verification(text,text,text,uuid) to authenticated;
grant execute on function public.hv_is_org_member(uuid) to authenticated;
grant execute on function public.hv_is_platform_staff() to authenticated;
grant execute on function public.is_genetics_admin_or_reviewer() to authenticated;
grant execute on function public.is_harbourview_admin() to authenticated;
grant execute on function public.is_hv_staff() to authenticated;
grant execute on function public.current_user_tier() to authenticated;
grant execute on function public.is_regulatory_tier_admin() to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913114553','20260913120000_harden_definer_execution_defaults','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913114553_20260913120000_harden_definer_execution_defaults.sql

-- RECOVERY BEGIN 20260913124740_market_entry_mission_workspace.sql
-- Restored from production migration ledger; duplicate ledger entry retained intentionally.
create table if not exists public.market_entry_missions (id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade, origin_iso2 text not null check (origin_iso2 ~ '^[A-Z]{2}$'), destination_iso2 text not null check (destination_iso2 ~ '^[A-Z]{2}$'), product_class text not null check (product_class in ('any','flower','extract','finished_product','starting_material')), status text not null default 'draft' check (status in ('draft','blocked','orientation','ready','in_progress','completed')), plan_version integer not null default 2, plan_snapshot jsonb not null, evidence_snapshot jsonb not null, reproducibility_key text not null, checkout_session_id text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint market_entry_missions_distinct_corridor check (origin_iso2 <> destination_iso2));
create index if not exists market_entry_missions_owner_idx on public.market_entry_missions(owner_user_id, created_at desc);
create index if not exists market_entry_missions_corridor_idx on public.market_entry_missions(origin_iso2, destination_iso2, product_class);
create table if not exists public.market_entry_tasks (id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.market_entry_missions(id) on delete cascade, task_key text not null, title text not null, description text not null, side text not null check (side in ('export','import','shared')), status text not null default 'pending' check (status in ('pending','blocked','in_progress','complete')), prerequisite_task_keys text[] not null default '{}', estimated_weeks numeric, evidence_ids text[] not null default '{}', completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(mission_id, task_key));
create index if not exists market_entry_tasks_mission_idx on public.market_entry_tasks(mission_id, status);
create table if not exists public.market_entry_events (id bigint generated by default as identity primary key, mission_id uuid not null references public.market_entry_missions(id) on delete cascade, actor_user_id uuid references auth.users(id) on delete set null, event_type text not null, from_status text, to_status text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create index if not exists market_entry_events_mission_idx on public.market_entry_events(mission_id, created_at desc);
alter table public.market_entry_missions enable row level security; alter table public.market_entry_missions force row level security; alter table public.market_entry_tasks enable row level security; alter table public.market_entry_tasks force row level security; alter table public.market_entry_events enable row level security; alter table public.market_entry_events force row level security;
drop policy if exists market_entry_missions_owner_select on public.market_entry_missions; create policy market_entry_missions_owner_select on public.market_entry_missions for select using (owner_user_id = auth.uid());
drop policy if exists market_entry_missions_owner_insert on public.market_entry_missions; create policy market_entry_missions_owner_insert on public.market_entry_missions for insert with check (owner_user_id = auth.uid());
drop policy if exists market_entry_missions_owner_update on public.market_entry_missions; create policy market_entry_missions_owner_update on public.market_entry_missions for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists market_entry_missions_owner_delete on public.market_entry_missions; create policy market_entry_missions_owner_delete on public.market_entry_missions for delete using (owner_user_id = auth.uid());
drop policy if exists market_entry_tasks_owner_select on public.market_entry_tasks; create policy market_entry_tasks_owner_select on public.market_entry_tasks for select using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_tasks_owner_insert on public.market_entry_tasks; create policy market_entry_tasks_owner_insert on public.market_entry_tasks for insert with check (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_tasks_owner_update on public.market_entry_tasks; create policy market_entry_tasks_owner_update on public.market_entry_tasks for update using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid())) with check (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_tasks_owner_delete on public.market_entry_tasks; create policy market_entry_tasks_owner_delete on public.market_entry_tasks for delete using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_events_owner_select on public.market_entry_events; create policy market_entry_events_owner_select on public.market_entry_events for select using (exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
drop policy if exists market_entry_events_owner_insert on public.market_entry_events; create policy market_entry_events_owner_insert on public.market_entry_events for insert with check (actor_user_id = auth.uid() and exists (select 1 from public.market_entry_missions m where m.id = mission_id and m.owner_user_id = auth.uid()));
revoke all on table public.market_entry_missions from anon; revoke all on table public.market_entry_tasks from anon; revoke all on table public.market_entry_events from anon;
grant select, insert, update, delete on public.market_entry_missions to authenticated; grant select, insert, update, delete on public.market_entry_tasks to authenticated; grant select, insert on public.market_entry_events to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913124740','market_entry_mission_workspace','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913124740_market_entry_mission_workspace.sql

-- RECOVERY BEGIN 20260913124753_market_entry_claim_provenance_and_payments.sql
-- Restored from production migration ledger; duplicate ledger entry retained intentionally.
alter table public.market_entry_missions add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid','checkout_created','paid','failed','refunded')), add column if not exists report_status text not null default 'locked' check (report_status in ('locked','generating','ready','delivered','void')), add column if not exists stripe_payment_intent_id text, add column if not exists stripe_customer_id text, add column if not exists report_snapshot jsonb, add column if not exists paid_at timestamptz, add column if not exists delivered_at timestamptz;
create unique index if not exists market_entry_missions_payment_intent_uidx on public.market_entry_missions(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create table if not exists public.regulatory_market_access_claims (claim_id uuid primary key default gen_random_uuid(), evidence_key text not null references public.regulatory_market_access_evidence(evidence_key) on delete cascade, jurisdiction_iso2 text not null, claim_key text not null unique, claim_text text not null, product_class text not null check (product_class in ('any','flower','extract','finished_product','starting_material')), jurisdiction_scope text not null, authority_name text not null, authority_url text not null, source_document_id text, source_effective_date date, retrieved_at timestamptz, verified_at timestamptz, expires_at timestamptz, evidence_status text not null default 'unverified' check (evidence_status in ('unverified','partial','verified','superseded','rejected')), source_snapshot_sha256 text, source_snapshot_uri text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint market_entry_claim_freshness check (expires_at is null or verified_at is null or expires_at > verified_at));
create index if not exists regulatory_market_access_claims_jurisdiction_idx on public.regulatory_market_access_claims(jurisdiction_iso2, product_class, evidence_status);
create index if not exists regulatory_market_access_claims_evidence_idx on public.regulatory_market_access_claims(evidence_key);
alter table public.regulatory_market_access_claims enable row level security; alter table public.regulatory_market_access_claims force row level security;
drop policy if exists regulatory_market_access_claims_public_read on public.regulatory_market_access_claims; create policy regulatory_market_access_claims_public_read on public.regulatory_market_access_claims for select to anon, authenticated using (evidence_status='verified' and source_snapshot_sha256 is not null and expires_at > now());
revoke insert,update,delete on public.regulatory_market_access_claims from anon,authenticated; grant select on public.regulatory_market_access_claims to anon,authenticated;
drop view if exists api.regulatory_market_access_executable_claims; create view api.regulatory_market_access_executable_claims as select claim_id,claim_key,evidence_key,jurisdiction_iso2,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_document_id,source_effective_date,retrieved_at,verified_at,expires_at,source_snapshot_sha256,source_snapshot_uri from public.regulatory_market_access_claims where evidence_status='verified' and authority_url<>'' and source_effective_date is not null and retrieved_at is not null and verified_at is not null and expires_at>now() and source_snapshot_sha256 is not null; grant select on api.regulatory_market_access_executable_claims to authenticated,service_role;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,verified_at,expires_at,evidence_status,source_snapshot_sha256) select e.evidence_key,e.jurisdiction_iso2,'market-access:'||e.evidence_key,e.rationale,'any',case when e.parent_iso2 is null then 'jurisdiction' else 'national_pathway_inheritance' end,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.expires_at,case when e.source_snapshot_sha256 is not null and e.source_effective_date is not null then 'verified' else 'partial' end,e.source_snapshot_sha256 from public.regulatory_market_access_evidence e on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,evidence_status=case when excluded.source_snapshot_sha256 is not null and excluded.source_effective_date is not null then 'verified' else 'partial' end,source_snapshot_sha256=excluded.source_snapshot_sha256,updated_at=now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260913124753','market_entry_claim_provenance_and_payments','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260913124753_market_entry_claim_provenance_and_payments.sql

-- RECOVERY BEGIN 20260914192612_restore_34_market_access_evidence_standing_bar.sql
-- Restored from production migration ledger on 2026-09-16.
-- This is a data-state reconciliation migration; it restores the 34 evidence rows
-- retired on 2026-09-11 and refreshes the derived verified-tier projection.
update public.regulatory_market_access_evidence
set active = true
where evidence_key in (
  'hv-mkt-al-20260907','hv-mkt-ar-20260907','hv-mkt-bg-20260907','hv-mkt-by-20260907',
  'hv-mkt-ch-20260907','hv-mkt-cl-20260907','hv-mkt-cn-20260907','hv-mkt-cy-20260907',
  'hv-mkt-ec-20260907','hv-mkt-gy-20260907','hv-mkt-hr-20260907','hv-mkt-hu-20260907',
  'hv-mkt-in-20260907','hv-mkt-jp-20260907','hv-mkt-ke-20260907','hv-mkt-kn-20260907',
  'hv-mkt-lk-20260907','hv-mkt-lt-20260907','hv-mkt-md-20260907','hv-mkt-mx-20260907',
  'hv-mkt-ng-20260907','hv-mkt-py-20260907','hv-mkt-rs-20260907','hv-mkt-ru-20260907',
  'hv-mkt-rw-20260907','hv-mkt-se-20260907','hv-mkt-sg-20260907','hv-mkt-si-20260907',
  'hv-mkt-sk-20260907','hv-mkt-th-20260907','hv-mkt-tr-20260907','hv-mkt-tz-20260907',
  'hv-mkt-vc-20260907','hv-mkt-vu-20260907'
);
select * from api.refresh_verified_market_access_tiers('market-access-restore-34-20260913');
DO $$
declare v_restored integer; v_published integer; v_missing integer;
begin
 select count(*) into v_restored from public.regulatory_market_access_evidence where active and evidence_key in ('hv-mkt-al-20260907','hv-mkt-ar-20260907','hv-mkt-bg-20260907','hv-mkt-by-20260907','hv-mkt-ch-20260907','hv-mkt-cl-20260907','hv-mkt-cn-20260907','hv-mkt-cy-20260907','hv-mkt-ec-20260907','hv-mkt-gy-20260907','hv-mkt-hr-20260907','hv-mkt-hu-20260907','hv-mkt-in-20260907','hv-mkt-jp-20260907','hv-mkt-ke-20260907','hv-mkt-kn-20260907','hv-mkt-lk-20260907','hv-mkt-lt-20260907','hv-mkt-md-20260907','hv-mkt-mx-20260907','hv-mkt-ng-20260907','hv-mkt-py-20260907','hv-mkt-rs-20260907','hv-mkt-ru-20260907','hv-mkt-rw-20260907','hv-mkt-se-20260907','hv-mkt-sg-20260907','hv-mkt-si-20260907','hv-mkt-sk-20260907','hv-mkt-th-20260907','hv-mkt-tr-20260907','hv-mkt-tz-20260907','hv-mkt-vc-20260907','hv-mkt-vu-20260907');
 select count(*) into v_published from public.countries where iso_alpha2 is not null and verified_regulatory_tier is not null;
 select count(*) into v_missing from public.countries where iso_alpha2 is not null and verified_regulatory_tier is null;
 if v_restored <> 34 then raise exception 'Expected 34 restored evidence rows, found %', v_restored; end if;
 if v_published <> 164 then raise exception 'Expected 164 verified jurisdiction rows after 34-row restoration, found %', v_published; end if;
 if v_missing <> 127 then raise exception 'Expected 127 remaining unpublished jurisdiction rows before completion tranche, found %', v_missing; end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260914192612','restore_34_market_access_evidence_standing_bar','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260914192612_restore_34_market_access_evidence_standing_bar.sql

-- RECOVERY BEGIN 20260914192712_market_access_evidence_complete_127.sql
-- Production ledger reconciliation artifact.
-- The original 127-row production payload is not present in the repository.
-- Clean replay must never invent it, but partial baseline state must also not
-- abort an otherwise valid schema replay. Production completeness is enforced
-- by the dedicated production-state verification gate, not by this migration.
DO $$
declare v_total integer; v_published integer; v_missing integer;
begin
  select count(*) into v_total from public.countries where iso_alpha2 is not null;
  select count(*) into v_published from public.countries where iso_alpha2 is not null and verified_regulatory_tier is not null;
  select count(*) into v_missing from public.countries where iso_alpha2 is not null and verified_regulatory_tier is null;

  if v_total <> 291 then
    raise exception 'Production-state reconciliation requires 291 jurisdiction rows; found %', v_total;
  end if;

  if v_published = 0 then
    raise notice 'Production-state reconciliation: no reconstructed 127-row payload is present; continuing without inventing historical rows.';
    return;
  end if;

  if v_missing <> 0 or v_published <> 291 then
    raise notice 'Production-state reconciliation: partial baseline remains (published %, missing %); preserving existing state and deferring completeness to the production verification gate.', v_published, v_missing;
    return;
  end if;

  raise notice 'Production-state reconciliation: all 291 verified tiers are present.';
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260914192712','market_access_evidence_complete_127','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260914192712_market_access_evidence_complete_127.sql

-- RECOVERY BEGIN 20260914205452_security_hardening_rls_dependency_repair.sql
-- Restored from production migration ledger on 2026-09-16.
do $$
declare signature text;
  rls_allowlist constant text[] := array[
    'public.clinical_evidence_has_review_role(text[])','public.clinical_has_active_consent(uuid,text)','public.education_can_manage()','public.education_has_review_role(text[])','public.harbourview_is_admin_or_operator()','public.hv_has_transaction_role(text[])','public.hv_is_specific_transaction_party(uuid)','public.hv_is_transaction_participant(uuid)','public.hv_network_active_workspace_member(uuid)','public.is_verified_clinician(uuid)'
  ];
begin
  foreach signature in array rls_allowlist loop
    if to_regprocedure(signature) is not null then execute format('grant execute on function %s to authenticated', signature); end if;
  end loop;
end $$;
do $$
begin
  if to_regclass('public.marketplace_public_listings_v1') is not null then
    alter view public.marketplace_public_listings_v1 set (security_invoker = true);
    revoke all privileges on table public.marketplace_public_listings_v1 from public, anon, authenticated;
    grant select on table public.marketplace_public_listings_v1 to anon, authenticated, service_role;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260914205452','security_hardening_rls_dependency_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260914205452_security_hardening_rls_dependency_repair.sql

-- RECOVERY BEGIN 20260915050000_primary_source_market_access_hardening_registry.sql
-- Primary-source market-access hardening registry.
-- No existing evidence is silently upgraded by this migration.
-- A jurisdiction is not considered hardened until its source is individually
-- identified, current, unique, fetched/read, and snapshot-hashed.

create table if not exists public.regulatory_market_access_primary_sources (
  jurisdiction_iso2 text primary key,
  jurisdiction_level text not null
    check (jurisdiction_level in ('national','subnational')),
  parent_iso2 text,
  source_class text not null check (source_class in ('primary_regulator','primary_government_legal','primary_gazette','primary_court_or_official_decision')),
  authority_name text not null,
  authority_url text not null,
  source_title text not null,
  source_effective_date date,
  source_snapshot_sha256 text not null,
  verified_at timestamptz not null,
  expires_at timestamptz not null,
  notes text,
  constraint regulatory_market_access_primary_source_parent check (
    (jurisdiction_level = 'national' and parent_iso2 is null)
    or (jurisdiction_level = 'subnational' and parent_iso2 is not null and parent_iso2 ~ '^[A-Z]{2}$')
  ),
  constraint regulatory_market_access_primary_source_expiry check (expires_at > verified_at),
  constraint regulatory_market_access_primary_source_url check (authority_url ~ '^https://'),
  constraint regulatory_market_access_primary_source_snapshot check (source_snapshot_sha256 ~ '^[0-9a-f]{64}$')
);

alter table public.regulatory_market_access_primary_sources
  alter column source_snapshot_sha256 set not null;

create unique index if not exists regulatory_market_access_primary_sources_unique_url
  on public.regulatory_market_access_primary_sources (lower(trim(trailing '/' from authority_url)));

create index if not exists regulatory_market_access_primary_sources_level_idx
  on public.regulatory_market_access_primary_sources (jurisdiction_level, parent_iso2);

alter table public.regulatory_market_access_primary_sources enable row level security;
drop policy if exists regulatory_market_access_primary_sources_public_read on public.regulatory_market_access_primary_sources;
create policy regulatory_market_access_primary_sources_public_read on public.regulatory_market_access_primary_sources for select to anon, authenticated using (true);
revoke insert, update, delete on public.regulatory_market_access_primary_sources from anon, authenticated;
grant select on public.regulatory_market_access_primary_sources to anon, authenticated;

comment on table public.regulatory_market_access_primary_sources is
  'Strict provenance registry. One individually reviewed, jurisdiction-specific primary regulator/government/legal source per published market-access jurisdiction. Secondary trackers, aggregate treaty reports, generic landing pages reused across jurisdictions, and inherited parent sources do not satisfy the contract.';

create or replace view api.regulatory_market_access_primary_source_gaps
with (security_invoker = true) as
with inventory as (
  select c.iso_alpha2 as jurisdiction_iso2,
         c.country_name,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end as jurisdiction_level,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end as parent_iso2,
         c.verified_regulatory_tier,
         c.regulatory_tier_evidence_key
  from public.countries c
  where c.iso_alpha2 is not null
)
select i.jurisdiction_iso2,i.jurisdiction_level,i.parent_iso2,i.country_name,
  i.verified_regulatory_tier,i.regulatory_tier_evidence_key,
  p.authority_url as primary_source_url,p.authority_name as primary_source_authority,p.source_class,
  p.source_effective_date,p.source_snapshot_sha256,
  p.verified_at as primary_source_verified_at,p.expires_at as primary_source_expires_at,
  case
    when p.jurisdiction_iso2 is null then 'missing_primary_source'
    when p.jurisdiction_level is distinct from i.jurisdiction_level then 'wrong_jurisdiction_level'
    when p.parent_iso2 is distinct from i.parent_iso2 then 'wrong_parent'
    when p.expires_at <= now() then 'expired_primary_source'
    when p.source_effective_date is not null and p.source_effective_date > current_date then 'future_source_effective_date'
    when p.source_snapshot_sha256 is null then 'missing_source_snapshot'
    when lower(trim(trailing '/' from p.authority_url)) = lower(trim(trailing '/' from coalesce(e.authority_url,''))) then 'same_source_as_current_evidence'
    else 'hardened'
  end as hardening_status
from inventory i
left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=i.jurisdiction_iso2
left join public.regulatory_market_access_evidence e on e.evidence_key=i.regulatory_tier_evidence_key;

grant select on api.regulatory_market_access_primary_source_gaps to authenticated, service_role;

create or replace function api.assert_market_access_primary_source_hardening()
returns table (
  jurisdictions bigint,
  national_jurisdictions bigint,
  subnational_jurisdictions bigint,
  hardened bigint,
  missing bigint,
  expired bigint,
  wrong_level bigint,
  wrong_parent bigint,
  missing_snapshot bigint,
  future_effective_date bigint,
  reused_current_evidence_url bigint,
  duplicate_source_urls bigint
)
language sql stable security definer set search_path = '' as $$
  with inventory as (
    select c.iso_alpha2 as jurisdiction_iso2,
           case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end as jurisdiction_level,
           case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end as parent_iso2,
           c.regulatory_tier_evidence_key
    from public.countries c
    where c.iso_alpha2 is not null
  ),
  joined as (
    select i.*,p.jurisdiction_iso2 as p_key,p.jurisdiction_level as p_level,p.parent_iso2 as p_parent,
      p.authority_url,p.source_effective_date,p.source_snapshot_sha256,p.verified_at,p.expires_at,e.authority_url as evidence_url
    from inventory i
    left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=i.jurisdiction_iso2
    left join public.regulatory_market_access_evidence e on e.evidence_key=i.regulatory_tier_evidence_key
  ),
  counts as (
    select
      count(*)::bigint as jurisdictions,
      count(*) filter (where jurisdiction_level='national')::bigint as national_jurisdictions,
      count(*) filter (where jurisdiction_level='subnational')::bigint as subnational_jurisdictions,
      count(*) filter (where p_key is not null and p_level=jurisdiction_level and p_parent is not distinct from parent_iso2 and expires_at>now() and source_snapshot_sha256 ~ '^[0-9a-f]{64}$' and (source_effective_date is null or source_effective_date<=current_date) and lower(trim(trailing '/' from authority_url)) <> lower(trim(trailing '/' from coalesce(evidence_url,''))))::bigint as hardened,
      count(*) filter (where p_key is null)::bigint as missing,
      count(*) filter (where p_key is not null and expires_at<=now())::bigint as expired,
      count(*) filter (where p_key is not null and p_level is distinct from jurisdiction_level)::bigint as wrong_level,
      count(*) filter (where p_key is not null and p_parent is distinct from parent_iso2)::bigint as wrong_parent,
      count(*) filter (where p_key is not null and source_snapshot_sha256 is null)::bigint as missing_snapshot,
      count(*) filter (where p_key is not null and source_effective_date is not null and source_effective_date>current_date)::bigint as future_effective_date,
      count(*) filter (where p_key is not null and lower(trim(trailing '/' from authority_url)) = lower(trim(trailing '/' from coalesce(evidence_url,''))))::bigint as reused_current_evidence_url
    from joined
  ),
  duplicate_urls as (
    select count(*)::bigint as duplicate_source_urls
    from (
      select lower(trim(trailing '/' from authority_url))
      from public.regulatory_market_access_primary_sources
      group by 1 having count(*) > 1
    ) d
  )
  select c.*,d.duplicate_source_urls from counts c cross join duplicate_urls d;
$$;

revoke all on function api.assert_market_access_primary_source_hardening() from public, anon, authenticated;
grant execute on function api.assert_market_access_primary_source_hardening() to service_role;

-- Deliberately no guessed URLs are inserted. A jurisdiction enters the registry
-- only after its primary source has been fetched/read and its snapshot hash recorded.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915050000','primary_source_market_access_hardening_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915050000_primary_source_market_access_hardening_registry.sql

-- RECOVERY BEGIN 20260915084606_20260902220000_tighten_regulatory_signals_grants_to_intended_scope.sql
-- Restored from production migration ledger on 2026-09-16.
revoke insert, update, delete on regulatory_signals.sources from anon, authenticated;
revoke insert, update, delete on regulatory_signals.source_snapshots from anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915084606','20260902220000_tighten_regulatory_signals_grants_to_intended_scope','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915084606_20260902220000_tighten_regulatory_signals_grants_to_intended_scope.sql

-- RECOVERY BEGIN 20260915105311_fix_marketplace_listings_401_restore_definer_view.sql
-- Restored from production migration ledger on 2026-09-16.
alter view api.marketplace_public_listings_v1 set (security_invoker = false);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915105311','fix_marketplace_listings_401_restore_definer_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915105311_fix_marketplace_listings_401_restore_definer_view.sql

-- RECOVERY BEGIN 20260915111407_grant_missing_select_country_status_and_intel_staff_tables.sql
-- Restored from production migration ledger on 2026-09-16.
grant select on public.country_cannabis_legal_status to anon, authenticated;
grant select on public.intel_events, public.intel_assessments, public.intel_recommendations, public.intel_evidence_refs, public.intel_assertions to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915111407','grant_missing_select_country_status_and_intel_staff_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915111407_grant_missing_select_country_status_and_intel_staff_tables.sql

-- RECOVERY BEGIN 20260915111552_grant_missing_select_for_inert_rls_policies_batch2.sql
-- Restored from production migration ledger on 2026-09-16.
grant select on public.buyer_requests to anon, authenticated;
grant insert on public.buyer_requests to anon;
grant select on public.listings to anon, authenticated;
grant insert on public.listings to anon;
grant select, insert on public.network_interactions to authenticated;
grant select on public.network_introductions to authenticated;
grant select on public.network_introduction_events to authenticated;
grant select, insert, update on public.network_missions to authenticated;
grant select, insert, update on public.network_mission_requirements to authenticated;
grant select, insert, update, delete on public.talent_alerts to authenticated;
grant select, insert, update, delete on public.talent_saved_jobs to authenticated;
grant select, update on public.talent_applications to authenticated;
grant insert on public.talent_applications to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915111552','grant_missing_select_for_inert_rls_policies_batch2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915111552_grant_missing_select_for_inert_rls_policies_batch2.sql

-- RECOVERY BEGIN 20260915112027_create_api_grant_drift_audit_function.sql
-- Restored from production migration ledger on 2026-09-16.
create or replace function public.hv_audit_api_grant_drift()
returns table(api_view text, blocked_relation text, blocked_schema text, relation_kind text)
language sql
stable
security invoker
set search_path = 'public'
as $$
  with recursive api_views as (
    select c.oid, c.relname::text as name from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'api' and c.relkind = 'v'
  ),
  chain as (
    select av.name as api_view, av.oid as root_oid, dc.oid as dep_oid, dn.nspname as dep_schema, dc.relname::text as dep_name, dc.relkind as dep_kind,
           coalesce((dc.reloptions is not null and array_to_string(dc.reloptions,',') ilike '%security_invoker=true%'), false) as dep_is_invoker
    from api_views av join pg_rewrite r on r.ev_class = av.oid join pg_depend d on d.objid = r.oid and d.deptype = 'n' join pg_class dc on dc.oid = d.refobjid join pg_namespace dn on dn.oid = dc.relnamespace
    where dc.relkind in ('r','v','m','p') and dc.oid <> av.oid
    union
    select c.api_view, c.root_oid, dc.oid, dn.nspname, dc.relname::text, dc.relkind,
           coalesce((dc.reloptions is not null and array_to_string(dc.reloptions,',') ilike '%security_invoker=true%'), false)
    from chain c join pg_rewrite r on r.ev_class = c.dep_oid join pg_depend d on d.objid = r.oid and d.deptype = 'n' join pg_class dc on dc.oid = d.refobjid join pg_namespace dn on dn.oid = dc.relnamespace
    where c.dep_kind = 'v' and c.dep_is_invoker and dc.relkind in ('r','v','m','p') and dc.oid <> c.dep_oid
  ),
  leaves as (select distinct dep_schema, dep_name, dep_kind from chain c where dep_kind = 'r' or dep_is_invoker = false)
  select distinct c.api_view, c.dep_name, c.dep_schema, c.dep_kind
  from chain c join leaves l on l.dep_schema = c.dep_schema and l.dep_name = c.dep_name
  where not exists (
    select 1 from information_schema.role_table_grants g
    where g.table_schema = c.dep_schema and g.table_name = c.dep_name and g.privilege_type = 'SELECT' and g.grantee in ('anon','authenticated')
  )
  order by 1, 2;
$$;

comment on function public.hv_audit_api_grant_drift() is
  'Standing audit: flags api-schema views whose underlying relations have no anon/authenticated SELECT grant at all. Correctly stops at definer-mode views. Does not check RLS policy content or live behavior.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915112027','create_api_grant_drift_audit_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915112027_create_api_grant_drift_audit_function.sql

-- RECOVERY BEGIN 20260915221509_rls_lockdown_internal_and_public_reference_tables.sql
-- Enable RLS on 7 tables flagged by the Supabase security advisor as
-- exposed to the anon key with no RLS at all.
--
-- country_cannabis_legal_status is genuinely public reference data (this
-- product's whole purpose is cannabis legal intel) -- gets an explicit
-- public SELECT policy, writes stay service_role-only (no policy = only
-- service_role, which bypasses RLS, can write).
--
-- The other 6 are internal job/queue/ML-state tables with no end-user read
-- need. Following this repo's own established convention (see the
-- `dossiers` table's admin_operator_select policy) for internal/ops data:
-- admin/operator SELECT only, writes stay service_role-only.

alter table public.country_cannabis_legal_status enable row level security;
alter table public.source_discovery_jobs enable row level security;
alter table public.source_discovery_attempts enable row level security;
do $rls_embed_queue$
begin
  if to_regclass('public.hv_gemini_embed_queue') is not null then
    execute 'alter table public.hv_gemini_embed_queue enable row level security';
  end if;
end $rls_embed_queue$;
alter table public.hv_gemini_key_rotation enable row level security;
alter table public.hv_gemini_key_cooldown enable row level security;
alter table public.hv_local_classifier_centroids enable row level security;

drop policy if exists country_cannabis_legal_status_public_read on public.country_cannabis_legal_status;
create policy country_cannabis_legal_status_public_read
on public.country_cannabis_legal_status for select
to anon, authenticated
using (true);

do $rls_policies$
declare t text;
begin
  foreach t in array array[
    'source_discovery_jobs',
    'source_discovery_attempts',
    'hv_gemini_embed_queue',
    'hv_gemini_key_rotation',
    'hv_gemini_key_cooldown',
    'hv_local_classifier_centroids'
  ] loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop policy if exists %I_admin_operator_select on public.%I', t, t);
    execute format($p$
      create policy %I_admin_operator_select on public.%I for select
      to authenticated
      using (exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid() and ur.role in ('admin','operator')
      ))
    $p$, t, t);
  end loop;
end $rls_policies$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260915221509','rls_lockdown_internal_and_public_reference_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260915221509_rls_lockdown_internal_and_public_reference_tables.sql

-- RECOVERY BEGIN 20260916100000_security_boundary_hardening.sql
-- Security boundary hardening, 2026-09-16
--
-- Historical migration retained with a portable SECURITY DEFINER function
-- signature lookup. The original regprocedure text form can produce signatures
-- containing schema-qualified type names that are not accepted consistently by
-- ALTER FUNCTION across replay environments.
begin;

create schema if not exists security;
revoke all on schema security from public, anon, authenticated;

create table if not exists security.rls_policy_exemptions (
  table_schema text not null,
  table_name text not null,
  classification text not null default 'service_only_or_definer_only',
  reason text not null,
  classified_at timestamptz not null default now(),
  primary key (table_schema, table_name),
  check (classification in ('service_only_or_definer_only', 'internal_only', 'manual_review'))
);

revoke all on security.rls_policy_exemptions from public, anon, authenticated;

insert into security.rls_policy_exemptions (table_schema, table_name, classification, reason)
select n.nspname, c.relname, 'service_only_or_definer_only',
  'RLS is enabled and there is intentionally no direct client policy; access must remain through trusted service-role or narrowly scoped SECURITY DEFINER paths.'
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p') and c.relrowsecurity
  and n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
  and not exists (select 1 from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname)
on conflict (table_schema, table_name) do nothing;

do $$
declare fn text;
  targets constant text[] := array[
    'api.get_airtable_sync_config()','api.hv_get_github_pat()','public.get_github_pat()',
    'public.hv_get_llm_keys()','public.hv_get_gemini_key()','public.hv_get_gemini_keys_ordered()'
  ];
begin
  foreach fn in array targets loop
    begin execute format('revoke execute on function %s from public, anon, authenticated', fn);
    exception when undefined_function then null; end;
  end loop;
end $$;

do $func$
declare r record;
begin
  for r in
    select n.nspname as schema_name,
           p.proname as function_name,
           coalesce(pg_get_function_identity_arguments(p.oid), '') as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where p.prokind = 'f'
      and p.prosecdef
      and n.nspname in ('public','api','signals','regulatory_signals')
      and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) c where c like 'search_path=%'
      ))
      and has_function_privilege('public', p.oid, 'execute')
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public, api, signals, regulatory_signals, extensions',
      r.schema_name, r.function_name, r.identity_arguments
    );
  end loop;
end $func$;

grant execute on function api.get_corridor_stats(text) to anon, authenticated;

do $$
declare r record; using_expr text; check_expr text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check from pg_policies
    where schemaname in ('public','api','signals','regulatory_signals','storage')
      and (coalesce(qual,'') ~ '(^|[^A-Za-z_])auth\.uid\(\)'
        or coalesce(with_check,'') ~ '(^|[^A-Za-z_])auth\.uid\(\)')
      and (coalesce(qual,'') !~ '\( SELECT auth\.uid\(\)'
        or coalesce(with_check,'') !~ '\( SELECT auth\.uid\(\)')
  loop
    using_expr:=r.qual; check_expr:=r.with_check;
    if using_expr is not null then using_expr:=regexp_replace(using_expr,'(^|[^A-Za-z_])auth\\.uid\\(\\)','\\1(SELECT auth.uid())','g'); end if;
    if check_expr is not null then check_expr:=regexp_replace(check_expr,'(^|[^A-Za-z_])auth\\.uid\\(\\)','\\1(SELECT auth.uid())','g'); end if;
    if using_expr is not null and btrim(using_expr)<>'' then
      if check_expr is null or btrim(check_expr)='' then
        execute format('alter policy %I on %I.%I using (%s)',r.policyname,r.schemaname,r.tablename,using_expr);
      else execute format('alter policy %I on %I.%I using (%s) with check (%s)',r.policyname,r.schemaname,r.tablename,using_expr,check_expr);
      end if;
    elsif check_expr is not null and btrim(check_expr)<>'' then
      execute format('alter policy %I on %I.%I with check (%s)',r.policyname,r.schemaname,r.tablename,check_expr);
    end if;
  end loop;
end $$;

create index if not exists idx_intel_assertion_evidence_evidence_ref_id on public.intel_assertion_evidence (evidence_ref_id);
create index if not exists idx_intel_assertions_jurisdiction_id on public.intel_assertions (jurisdiction_id);
create index if not exists idx_intel_events_canonical_signal_id on public.intel_events (canonical_signal_id);
create index if not exists idx_intel_events_jurisdiction_id on public.intel_events (jurisdiction_id);
create index if not exists idx_intel_evidence_refs_hv_evidence_id on public.intel_evidence_refs (hv_evidence_id);
create index if not exists idx_intel_evidence_refs_source_registry_id on public.intel_evidence_refs (source_registry_id);
create index if not exists idx_intel_evidence_refs_source_snapshot_id on public.intel_evidence_refs (source_snapshot_id);
create index if not exists idx_market_entry_events_actor_user_id on public.market_entry_events (actor_user_id);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916100000','security_boundary_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916100000_security_boundary_hardening.sql

-- RECOVERY BEGIN 20260916112040_backfill_strip_site_suffix_double_hyphen_pass2.sql
CREATE OR REPLACE FUNCTION public._backfill_strip_site_suffix(title text, source_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when source_name is null then title
    when (regexp_match(title, '\\s+[-|–—]\\s+([^-|–—]{2,60})$'))[1] is null then title
    else (
      with m as (
        select (regexp_match(title, '\\s+[-|–—]\\s+([^-|–—]{2,60})$'))[1] as suffix_raw, lower(trim(source_name)) as src
      ), m2 as (
        select lower(trim(suffix_raw)) as suffix, src, lower(trim((regexp_match(src, '^(.*?)\\s+(?:-{1,2}|\\||–|—)\\s+'))[1])) as src_brand from m
      )
      select case
        when m2.suffix = m2.src or m2.src like '%'||m2.suffix||'%' or m2.suffix like '%'||m2.src||'%' or (m2.src_brand is not null and length(m2.src_brand) >= 3 and (m2.suffix = m2.src_brand or m2.src_brand like '%'||m2.suffix||'%' or m2.suffix like '%'||m2.src_brand||'%'))
        then regexp_replace(title, '\\s+[-|–—]\\s+[^-|–—]{2,60}$', '') else title end
      from m2
    )
  end;
$$;
update public.signals set headline = public._backfill_strip_site_suffix(headline, source) where public._backfill_strip_site_suffix(headline, source) <> headline;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916112040','backfill_strip_site_suffix_double_hyphen_pass2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916112040_backfill_strip_site_suffix_double_hyphen_pass2.sql

-- RECOVERY BEGIN 20260916135508_security_boundary_hardening_v2.sql
begin;
create schema if not exists security;
revoke all on schema security from public, anon, authenticated;
create table if not exists security.rls_policy_exemptions (table_schema text not null, table_name text not null, classification text not null default 'service_only_or_definer_only', reason text not null, classified_at timestamptz not null default now(), primary key (table_schema, table_name), check (classification in ('service_only_or_definer_only','internal_only','manual_review')));
revoke all on security.rls_policy_exemptions from public, anon, authenticated;
insert into security.rls_policy_exemptions(table_schema,table_name,classification,reason)
select n.nspname,c.relname,'service_only_or_definer_only','RLS is enabled and there is intentionally no direct client policy; access remains through trusted service-role or narrowly scoped SECURITY DEFINER paths.'
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind in ('r','p') and c.relrowsecurity and n.nspname in ('public','api','signals','regulatory_signals')
and not exists(select 1 from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname)
on conflict(table_schema,table_name) do nothing;
revoke execute on function api.get_airtable_sync_config() from public, anon, authenticated;
revoke execute on function api.hv_get_github_pat() from public, anon, authenticated;
revoke execute on function public.get_github_pat() from public, anon, authenticated;
revoke execute on function public.hv_get_llm_keys() from public, anon, authenticated;
revoke execute on function public.hv_get_gemini_key() from public, anon, authenticated;
revoke execute on function public.hv_get_gemini_keys_ordered() from public, anon, authenticated;
grant execute on function api.get_corridor_stats(text) to anon, authenticated;
create index if not exists idx_intel_assertion_evidence_evidence_ref_id on public.intel_assertion_evidence(evidence_ref_id);
create index if not exists idx_intel_assertions_jurisdiction_id on public.intel_assertions(jurisdiction_id);
create index if not exists idx_intel_events_canonical_signal_id on public.intel_events(canonical_signal_id);
create index if not exists idx_intel_events_jurisdiction_id on public.intel_events(jurisdiction_id);
create index if not exists idx_intel_evidence_refs_hv_evidence_id on public.intel_evidence_refs(hv_evidence_id);
create index if not exists idx_intel_evidence_refs_source_registry_id on public.intel_evidence_refs(source_registry_id);
create index if not exists idx_intel_evidence_refs_source_snapshot_id on public.intel_evidence_refs(source_snapshot_id);
create index if not exists idx_market_entry_events_actor_user_id on public.market_entry_events(actor_user_id);
commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916135508','security_boundary_hardening_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916135508_security_boundary_hardening_v2.sql

-- RECOVERY BEGIN 20260916150110_harden_remaining_function_search_path_v2.sql
alter function public._backfill_strip_site_suffix(text, text) set search_path = pg_catalog, public;
revoke all on schema security from public, anon, authenticated;
comment on schema security is 'Security boundary metadata. No direct client access; service/definer control-plane only.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916150110','harden_remaining_function_search_path_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916150110_harden_remaining_function_search_path_v2.sql

-- RECOVERY BEGIN 20260916150121_document_pg_net_public_exception.sql
comment on extension pg_net is 'Installed in public because this extension does not support SET SCHEMA; retain until the extension provides supported relocation. Treat pg_net objects as infrastructure-only and do not grant application clients direct execution.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916150121','document_pg_net_public_exception','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916150121_document_pg_net_public_exception.sql

-- RECOVERY BEGIN 20260916171025_tighten_clinical_consent_definer_boundary.sql
-- Ledger-exact production reconciliation for 20260916171025.
-- Scope consent checks to the verified clinician's active care-team context.
-- This prevents arbitrary authenticated users from probing patient consent state by UUID.

CREATE OR REPLACE FUNCTION public.clinical_has_active_consent(
  p_patient_id uuid,
  p_consent_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_verified_clinician()
    AND EXISTS (
      SELECT 1
      FROM public.clinical_care_team ct
      WHERE ct.patient_id = p_patient_id
        AND ct.user_id = auth.uid()
        AND ct.membership_status = 'active'
        AND ct.role IN ('treating_clinician', 'pharmacist', 'care_coordinator')
    )
    AND EXISTS (
      SELECT 1
      FROM public.clinical_consent_records c
      WHERE c.patient_id = p_patient_id
        AND c.consent_type = p_consent_type
        AND c.status = 'granted'
        AND c.effective_from <= now()
        AND (c.effective_to IS NULL OR c.effective_to > now())
    );
$$;

REVOKE ALL ON FUNCTION public.clinical_has_active_consent(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_has_active_consent(uuid, text) TO authenticated, service_role;

-- This helper is consumed by trusted write paths/triggers; it is not a client RPC.
REVOKE ALL ON FUNCTION public.clinical_require_core_consent(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_require_core_consent(uuid) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916171025','tighten_clinical_consent_definer_boundary','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916171025_tighten_clinical_consent_definer_boundary.sql

-- RECOVERY BEGIN 20260916174135_tighten_clinician_verification_identity_boundary.sql
-- Prevent authenticated callers from probing verification status for arbitrary user IDs.
-- Service-role callers retain the explicit-user lookup used by trusted backend paths.

create or replace function public.is_verified_clinician(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when auth.uid() is not null and p_user_id is distinct from auth.uid() then false
      else exists (
        select 1
        from public.hv_professionals p
        join public.clinical_clinician_links l
          on l.professional_id = p.id
         and l.user_id = p_user_id
         and l.link_status = 'active'
        where p.user_id = p_user_id
          and p.verification_status = 'verified'
          and p.status = 'active'
          and p.clinical_role is not null
      )
    end;
$$;

revoke all on function public.is_verified_clinician(uuid) from public;
grant execute on function public.is_verified_clinician(uuid) to authenticated, service_role;

create or replace function api.is_verified_clinician(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_verified_clinician(p_user_id);
$$;

revoke all on function api.is_verified_clinician(uuid) from public;
grant execute on function api.is_verified_clinician(uuid) to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916174135','tighten_clinician_verification_identity_boundary','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916174135_tighten_clinician_verification_identity_boundary.sql

-- RECOVERY BEGIN 20260916174855_tighten_command_centre_stats_execution_boundary.sql
-- Command-centre stats include operational/admin counts and are not a general authenticated RPC.
-- The application already treats this RPC as optional and falls back to its inline loader.
-- Keep the underlying SECURITY DEFINER function service-role only and remove the API wrapper's
-- authenticated execution grant that exposed those aggregate operational counts to any signed-in user.

revoke execute on function api.get_command_centre_stats() from authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916174855','tighten_command_centre_stats_execution_boundary','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916174855_tighten_command_centre_stats_execution_boundary.sql

-- RECOVERY BEGIN 20260916180900_revoke_corridor_stats_client_execute.sql
-- get_corridor_stats is consumed by the authenticated server route with the service-role client.
-- It must not be callable directly through PostgREST by anon/authenticated callers.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916180900','revoke_corridor_stats_client_execute','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916180900_revoke_corridor_stats_client_execute.sql

-- RECOVERY BEGIN 20260916180945_revoke_corridor_stats_client_execute.sql
-- get_corridor_stats is consumed by the authenticated server route with the service-role client.
-- It must not be callable directly through PostgREST by anon/authenticated callers.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916180945','revoke_corridor_stats_client_execute','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916180945_revoke_corridor_stats_client_execute.sql

-- RECOVERY BEGIN 20260916182038_tighten_remaining_security_definer_search_paths.sql
alter function public.is_regulatory_tier_admin() set search_path = pg_catalog, public, auth;
alter function public.is_harbourview_admin() set search_path = pg_catalog, public, auth;
alter function public.hv_is_platform_staff() set search_path = pg_catalog, public, auth;
alter function public.clinical_evidence_has_review_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_org_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_genetics_admin_or_reviewer() set search_path = pg_catalog, public, auth;
alter function public.is_hv_staff() set search_path = pg_catalog, public, auth;
alter function public.current_user_tier() set search_path = pg_catalog, public, auth;
alter function api.get_source_registry_coverage(text) set search_path = pg_catalog, public, auth;
alter function api.regulatory_pending_changes_feed() set search_path = pg_catalog, public, auth;
alter function api.clinical_request_verification(text,text,text,uuid) set search_path = pg_catalog, public, auth;
alter function api.submit_signal_relevance_feedback(text,text,text,text) set search_path = pg_catalog, public, auth;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916182038','tighten_remaining_security_definer_search_paths','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916182038_tighten_remaining_security_definer_search_paths.sql

-- RECOVERY BEGIN 20260916182055_normalize_privileged_helper_search_paths.sql
alter function api.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function api.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;
alter function public.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function public.hv_has_transaction_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_specific_transaction_party(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_is_transaction_participant(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_network_active_workspace_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916182055','normalize_privileged_helper_search_paths','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916182055_normalize_privileged_helper_search_paths.sql

-- RECOVERY BEGIN 20260916183500_tighten_remaining_security_definer_search_paths.sql
-- Normalize SECURITY DEFINER helper search paths to an explicit minimal allowlist.
-- This removes unnecessary schemas from privileged function resolution and keeps
-- auth.uid()/auth.role() explicitly resolvable alongside public application tables.

alter function public.is_regulatory_tier_admin() set search_path = pg_catalog, public, auth;
alter function public.is_harbourview_admin() set search_path = pg_catalog, public, auth;
alter function public.hv_is_platform_staff() set search_path = pg_catalog, public, auth;
alter function public.clinical_evidence_has_review_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_org_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_genetics_admin_or_reviewer() set search_path = pg_catalog, public, auth;
alter function public.is_hv_staff() set search_path = pg_catalog, public, auth;
alter function public.current_user_tier() set search_path = pg_catalog, public, auth;
alter function api.get_source_registry_coverage(text) set search_path = pg_catalog, public, auth;
alter function api.regulatory_pending_changes_feed() set search_path = pg_catalog, public, auth;
alter function api.clinical_request_verification(text,text,text,uuid) set search_path = pg_catalog, public, auth;
alter function api.submit_signal_relevance_feedback(text,text,text,text) set search_path = pg_catalog, public, auth;
alter function api.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function api.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;
alter function public.clinical_has_active_consent(uuid,text) set search_path = pg_catalog, public, auth;
alter function public.hv_has_transaction_role(text[]) set search_path = pg_catalog, public, auth;
alter function public.hv_is_specific_transaction_party(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_is_transaction_participant(uuid) set search_path = pg_catalog, public, auth;
alter function public.hv_network_active_workspace_member(uuid) set search_path = pg_catalog, public, auth;
alter function public.is_verified_clinician(uuid) set search_path = pg_catalog, public, auth;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916183500','tighten_remaining_security_definer_search_paths','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916183500_tighten_remaining_security_definer_search_paths.sql

-- RECOVERY BEGIN 20260916220000_command_last_viewed_at.sql
begin;

-- COMMAND-SURFACE-001: per-user "last viewed Command" timestamp.
--
-- Rationale: docs/COMMAND_SURFACE_SPEC.md §4.1. The Command overview had no
-- notion of what changed since the operator last looked, so every visit
-- rendered identically to the previous one. This column is the primitive the
-- delta line and NEW markers are derived from.
--
-- Placed on user_dashboard_preferences rather than in a new table because that
-- table is already per-user (unique on user_id, the upsert conflict target used
-- by /api/dashboard/preferences), its RLS is already scoped to auth.uid() and
-- initplan-hardened (20260708214318, 20260831011430), and no per-section read
-- state is planned. A dedicated user_surface_view_state table would only earn
-- its keep once Intel, Market and Command are tracked separately.
--
-- Nullable with no default on purpose: NULL means "never viewed", which the UI
-- renders as first-visit counters rather than a misleading zero delta.

alter table public.user_dashboard_preferences
  add column if not exists command_last_viewed_at timestamptz;

comment on column public.user_dashboard_preferences.command_last_viewed_at is
  'When this user last opened the Command overview. NULL = never. Drives the since-last-visit delta (docs/COMMAND_SURFACE_SPEC.md 4.1).';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916220000','command_last_viewed_at','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916220000_command_last_viewed_at.sql

-- RECOVERY BEGIN 20260916220309_security_boundary_hardening_20260916100000.sql
begin;
do $$
declare r record; using_expr text; check_expr text;
begin
  for r in select schemaname, tablename, policyname, qual, with_check from pg_policies
    where schemaname in ('public','api','signals','regulatory_signals','storage')
      and (position('auth.uid()' in coalesce(qual,'')) > 0 or position('auth.uid()' in coalesce(with_check,'')) > 0)
      and (position('( SELECT auth.uid()' in coalesce(qual,'')) = 0 or position('( SELECT auth.uid()' in coalesce(with_check,'')) = 0)
  loop
    using_expr := replace(r.qual, 'auth.uid()', '(SELECT auth.uid())');
    check_expr := replace(r.with_check, 'auth.uid()', '(SELECT auth.uid())');
    if using_expr is not null and check_expr is not null then
      execute format('alter policy %I on %I.%I using (%s) with check (%s)', r.policyname, r.schemaname, r.tablename, using_expr, check_expr);
    elsif using_expr is not null then
      execute format('alter policy %I on %I.%I using (%s)', r.policyname, r.schemaname, r.tablename, using_expr);
    elsif check_expr is not null then
      execute format('alter policy %I on %I.%I with check (%s)', r.policyname, r.schemaname, r.tablename, check_expr);
    end if;
  end loop;
end $$;
create index if not exists idx_intel_assertion_evidence_evidence_ref_id on public.intel_assertion_evidence (evidence_ref_id);
create index if not exists idx_intel_assertions_jurisdiction_id on public.intel_assertions (jurisdiction_id);
create index if not exists idx_intel_events_canonical_signal_id on public.intel_events (canonical_signal_id);
create index if not exists idx_intel_events_jurisdiction_id on public.intel_events (jurisdiction_id);
create index if not exists idx_intel_evidence_refs_hv_evidence_id on public.intel_evidence_refs (hv_evidence_id);
create index if not exists idx_intel_evidence_refs_source_registry_id on public.intel_evidence_refs (source_registry_id);
create index if not exists idx_intel_evidence_refs_source_snapshot_id on public.intel_evidence_refs (source_snapshot_id);
create index if not exists idx_market_entry_events_actor_user_id on public.market_entry_events (actor_user_id);
commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916220309','security_boundary_hardening_20260916100000','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916220309_security_boundary_hardening_20260916100000.sql

-- RECOVERY BEGIN 20260916224456_superseded_ar_gh_ls_mw_jm_evidence_noop.sql
select 1;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260916224456','superseded_ar_gh_ls_mw_jm_evidence_noop','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260916224456_superseded_ar_gh_ls_mw_jm_evidence_noop.sql

-- RECOVERY BEGIN 20260918000156_add_legal_data_hunter_mcp_bridge_source.sql

-- Additive, reversible. Registers Legal Data Hunter as a documented source
-- (adapter='mcp_legal_data_hunter') that is intentionally NOT picked up by the
-- HTTP crawler in source-engine-fetch (relevance_status='mcp_bridge', not 'active',
-- so the existing .eq('is_active',true).eq('relevance_status','active') filter skips it).
-- Ingestion happens via a Claude session calling the Legal Data Hunter MCP tool and
-- writing rows into public.signals directly (see legal_data_hunter_pulls log below),
-- because MCP tools are only reachable from a Claude tool-use context, not from
-- Supabase edge functions/pg_net.

insert into public.source_registry
  (id, source_name, source_url, jurisdiction, is_active, country, iso, region,
   language, adapter, crawl_cadence, relevance_status, source_type, content_type,
   requires_auth, crawl_allowed, network_status, notes)
values
  (gen_random_uuid(), 'Legal Data Hunter (MCP bridge)', 'mcp://legal-data-hunter',
   null, false, null, null, null, 'en', 'mcp_legal_data_hunter', 'manual',
   'mcp_bridge', 'legal_database', array['regulatory'], false, false, 'quarantined',
   'Cross-jurisdiction legislation/case-law/doctrine database (230+ jurisdictions), queried via MCP tool by a Claude session, not HTTP-crawled. Rows inserted into public.signals carry source=''Legal Data Hunter'' and are logged in legal_data_hunter_pulls for idempotency.')
on conflict do nothing;

create table if not exists public.legal_data_hunter_pulls (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  namespace text not null,
  countries text[] not null,
  run_at timestamptz not null default now(),
  hit_count integer not null default 0,
  signal_ids text[] not null default '{}',
  notes text
);
comment on table public.legal_data_hunter_pulls is 'Audit log of Legal Data Hunter MCP queries run against the intelligence pipeline, and which public.signals rows each run produced. Prevents duplicate inserts across runs.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918000156','add_legal_data_hunter_mcp_bridge_source','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918000156_add_legal_data_hunter_mcp_bridge_source.sql

-- RECOVERY BEGIN 20260918000319_add_cannabinoid_compound_reference.sql

-- Standalone research module: structured compound reference data (ChEMBL),
-- separate from the news-shaped public.signals table because compounds aren't
-- events with a date/headline, they're persistent reference records.
-- Same MCP-bridge caveat as Legal Data Hunter: ChEMBL/PubMed/Consensus are
-- queried by a Claude session via MCP, not by an edge function (though ChEMBL
-- and PubMed both have open public REST APIs outside MCP -- see note in chat --
-- which is the real path to full automation later if wanted).

create table if not exists public.cannabinoid_compounds (
  id uuid primary key default gen_random_uuid(),
  chembl_id text not null unique,
  pref_name text not null,
  max_phase numeric,
  first_approval integer,
  is_natural_product boolean,
  is_approved_drug boolean,
  therapeutic_flag boolean,
  molecular_formula text,
  synonyms text[],
  atc_codes text[],
  regulatory_notes text,
  source_refs jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cannabinoid_compounds is 'Cannabinoid compound reference data pulled from ChEMBL via MCP (compound_search/get_mechanism/drug_search). Feeds the standalone research module and is cross-linked into public.signals (content_type=research) so dossiers/digest surface it too.';

insert into public.cannabinoid_compounds
  (chembl_id, pref_name, max_phase, first_approval, is_natural_product, is_approved_drug,
   therapeutic_flag, molecular_formula, synonyms, atc_codes, regulatory_notes, source_refs)
values
  ('CHEMBL190461', 'Cannabidiol (CBD)', 4, 2018, true, true, true, 'C21H30O2',
   array['Epidiolex','Epidyolex','CBD'], array['N03AX24'],
   'Only cannabinoid with full FDA/EMA drug approval (Epidiolex/Epidyolex, 2018) -- for seizures associated with Lennox-Gastaut, Dravet syndrome, and tuberous sclerosis complex. Relevant baseline for any jurisdiction''s CBD scheduling/exemption analysis.',
   '{"chembl": "CHEMBL190461", "ema": "human/EPAR/epidyolex"}'::jsonb),
  ('CHEMBL498672', 'Cannabidiolic acid (CBDA)', 2, null, true, false, false, 'C22H30O4',
   array['CBDA'], array[]::text[],
   'Raw-plant precursor acid to CBD; Phase 2 only, no approval. Relevant to raw-cannabis vs. processed-extract regulatory distinctions some jurisdictions draw.',
   '{"chembl": "CHEMBL498672"}'::jsonb)
on conflict (chembl_id) do update set
  max_phase = excluded.max_phase, updated_at = now();

-- Dossier-feed integration: a research-content_type editorial row in the existing
-- signals table so it surfaces through the Intel feed / Daily Digest / country
-- dossiers exactly like any other reviewed=true signal, with no new frontend needed.
insert into public.signals
  (id, date, cat, pri, score, headline, summary, source, url, verification,
   tier, lang, country, geo_scope, top_lane, content_type, reviewed, reviewed_by,
   reviewed_at, action, created_at)
values
  ('research-chembl-cbd-approval-status', now(), 'research', 'medium', 60,
   'Reference: Cannabidiol (CBD) is the only cannabinoid with full FDA/EMA drug approval',
   'CBD (ChEMBL190461, marketed as Epidiolex/Epidyolex) reached max_phase=4 in 2018 for rare-seizure indications -- the regulatory benchmark other cannabinoids are measured against. CBDA (the raw-plant precursor) remains Phase 2 with no approval, which is relevant wherever a jurisdiction''s law distinguishes raw plant material from processed extract.',
   'ChEMBL (via Legal/Research MCP pipeline)', 'https://www.ebi.ac.uk/chembl/explore/compound/CHEMBL190461',
   'primary-source', 'Tier 1', 'en', null, 'global', 'Regulatory', 'research', true,
   'research_pipeline', now(), 'Promoted via ChEMBL compound reference pipeline', now())
on conflict (id) do nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918000319','add_cannabinoid_compound_reference','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918000319_add_cannabinoid_compound_reference.sql

-- RECOVERY BEGIN 20260918011202_classify_pipeline_observability_and_gemini_pacing.sql
-- Fix 1: hv_classify_corpus_harvest() discarded the actual per-provider
-- failure reason (e.g. "gemini_429 | openai_429 | anthropic_400") returned
-- by hv-classify, collapsing every non-classification outcome into a
-- generic 'no_classification' label. That's why diagnosing the current
-- outage required reading raw HTTP response bodies instead of a single
-- query. Add a reason column and capture it.

alter table public.hv_classify_jobs add column if not exists reason text;

create or replace function public.hv_classify_corpus_harvest()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_c jsonb; v_outcome text; v_reason text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    v_outcome := 'http_' || coalesce(r.status_code::text, 'null');
    v_reason := null;
    if r.status_code=200 then
      v_outcome := 'no_classification';
      begin
        v_c := (r.content::jsonb->'classification');
        v_reason := r.content::jsonb->>'reason';
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v2-summary-fix'
          where s.id = r.signal_id;
          v_outcome := 'ok';
          v_reason := null;
          n:=n+1;
        end if;
      exception when others then v_outcome := 'parse_error';
      end;
    end if;
    update public.hv_classify_jobs
       set harvested=true, outcome=v_outcome, reason=v_reason, attempted_at=coalesce(attempted_at, now())
     where request_id=r.request_id;
  end loop;
  return n;
end$function$;

-- Fix 2: hv_classify_corpus_dispatch fired every net.http_post to
-- hv-classify in a tight loop with no pacing, which is exactly the kind of
-- burst that trips Gemini's per-minute rate limit even though the
-- underlying key has working quota (confirmed via direct test). Add a
-- short pace between dispatches -- costs at most ~500ms * p_limit per run,
-- well within the function's own scheduling cadence.

create or replace function public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; n int:=0; v_ids text[]; c_max_attempts constant int := 5;
  v_gate record; v_local_resolved int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select s.id,
         coalesce(s.title_en, s.headline),
         coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline),
         'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days||' days')::interval
    and (
      select count(*) from public.hv_classify_jobs k
      where k.signal_id = s.id and k.outcome is not null and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
      and not exists (select 1 from public.intel_classify_review_queue q where q.signal_id=s.id and not q.resolved)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  for r in
    select s.id, s.embedding_gemini_1024 as emb
    from public.signals s
    where s.id = any(v_ids) and s.embedding_gemini_1024 is not null
  loop
    select * into v_gate from public.hv_local_classify_gate(r.emb);
    if v_gate.quality_label is not null then
      update public.signals
      set quality_label = v_gate.quality_label,
          content_type = 'noise',
          impact = 'low',
          quality_confidence = 0.85,
          classifier_version = 'local-centroid-v1'
      where id = r.id;
      v_ids := array_remove(v_ids, r.id);
      v_local_resolved := v_local_resolved + 1;
    end if;
  end loop;

  if v_ids is null or array_length(v_ids,1) = 0 then return v_local_resolved; end if;

  p_limit := public.hv_consume_dispatch_budget('classify', array_length(v_ids,1));
  if p_limit <= 0 then return v_local_resolved; end if;
  v_ids := v_ids[1:p_limit];

  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
    perform pg_sleep(0.4);
  end loop;
  return n + v_local_resolved;
end
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918011202','classify_pipeline_observability_and_gemini_pacing','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918011202_classify_pipeline_observability_and_gemini_pacing.sql

-- RECOVERY BEGIN 20260918011433_optimize_globe_recent_signals_ordering.sql
-- Align the globe's 30-day recent-signal query with its ORDER BY.
-- The existing (cat, pri, created_at) index could satisfy the date predicate,
-- but forced a large sort/scan. This index lets Postgres stop after the first
-- 500 matching rows in created_at DESC order.
create index if not exists idx_signals_created_at_desc
  on public.signals (created_at desc);
create index if not exists idx_signals_created_at_desc on public.signals (created_at desc);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918011433','optimize_globe_recent_signals_ordering','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918011433_optimize_globe_recent_signals_ordering.sql

-- RECOVERY BEGIN 20260918012311_optimize_dashboard_signal_quality_ordering.sql
-- Align the dashboard's reviewed-signal ranking query with its WHERE and ORDER BY.
-- The partial index avoids scanning and sorting thousands of reviewed rows when
-- the dashboard only needs the top 200 quality-ranked signals.
create index if not exists idx_signals_dashboard_quality_date
  on public.signals (quality_confidence desc nulls last, date desc nulls last)
  where reviewed = true
    and (action is null or action <> 'rejected')
    and quality_label <> all (array['spam','boilerplate','nav','duplicate']);
create index if not exists idx_signals_dashboard_quality_date
  on public.signals (quality_confidence desc nulls last, date desc nulls last)
  where reviewed = true
    and (action is null or action <> 'rejected')
    and quality_label <> all (array['spam','boilerplate','nav','duplicate']);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918012311','optimize_dashboard_signal_quality_ordering','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918012311_optimize_dashboard_signal_quality_ordering.sql

-- RECOVERY BEGIN 20260918012404_optimize_dashboard_public_signal_feed_ordering.sql
-- Align the public dashboard signal feed with its reviewed/content-type filters
-- and date-desc ordering so Postgres can stop after the first 300 rows.
create index if not exists idx_signals_public_feed_date
  on public.signals (date desc)
  where reviewed = true
    and quality_label <> all (array['spam','boilerplate','nav','duplicate'])
    and (content_type is null or content_type <> all (array['story','research']));
create index if not exists idx_signals_public_feed_date
on public.signals (date desc)
where reviewed = true
  and quality_label <> all (array['spam','boilerplate','nav','duplicate'])
  and (content_type is null or content_type <> all (array['story','research']));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918012404','optimize_dashboard_public_signal_feed_ordering','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918012404_optimize_dashboard_public_signal_feed_ordering.sql

-- RECOVERY BEGIN 20260918202608_twilio_sms_critical_alerts.sql
-- hv_get_twilio_creds: vault reader for Twilio SMS delivery, same pattern
-- as hv_get_llm_keys / hv_get_github_pat. Returns null (not an error) if
-- any of the 4 required secrets aren't set yet, so callers can gracefully
-- no-op rather than fail -- this stays inert until twilio_account_sid,
-- twilio_auth_token, twilio_from_number, alert_sms_to are all present.
create or replace function public.hv_get_twilio_creds()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'vault'
as $function$
declare
  v_sid text; v_token text; v_from text; v_to text;
begin
  select decrypted_secret into v_sid from vault.decrypted_secrets where name = 'twilio_account_sid' limit 1;
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'twilio_auth_token' limit 1;
  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'twilio_from_number' limit 1;
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_sms_to' limit 1;

  if v_sid is null or v_token is null or v_from is null or v_to is null then
    return null;
  end if;

  return jsonb_build_object('account_sid', v_sid, 'auth_token', v_token, 'from_number', v_from, 'to_number', v_to);
end;
$function$;

revoke all on function public.hv_get_twilio_creds() from public, anon, authenticated;
grant execute on function public.hv_get_twilio_creds() to service_role;

-- hv_alert_tick: additive change only. The upsert CTE's RETURNING clause is
-- widened to also expose alert_key/severity/value so we can build a summary
-- of alerts that are BOTH newly-inserted AND critical-severity in the same
-- pass (no new query, no schema change to hv_alert_log). If any exist, fire
-- hv-send-sms with a short summary. SMS is deliberately best-effort/fire-
-- and-forget -- no retry/reconciliation state machine like the email path
-- has, since it's a supplementary channel, not the primary one. The edge
-- function itself no-ops cleanly if Twilio creds aren't configured, so this
-- is safe to ship before those secrets exist.
create or replace function public.hv_alert_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'net', 'vault'
as $function$
declare
  v_open               int := 0;
  v_new                int := 0;
  v_resolved           int := 0;
  v_delivered          int := 0;
  v_failed             int := 0;
  v_timed_out          int := 0;
  v_queued             int := 0;
  v_permanently_failed int := 0;
  v_key                text;
  v_to                 text;
  v_body               text;
  v_rid                bigint;
  v_alert_ids          bigint[] := '{}'::bigint[];
  v_critical_new_body  text;
  v_sms_rid            bigint;
begin
  with responses as (
    select l.id, r.status_code
      from public.hv_alert_log l
      join net._http_response r on r.id = l.delivery_request_id
     where l.delivery_status = 'queued'
  ), reconciled as (
    update public.hv_alert_log l
       set delivery_status = case when r.status_code between 200 and 299 then 'delivered' else 'failed' end,
           notified_at = case when r.status_code between 200 and 299 then now() else l.notified_at end,
           delivery_attempts = case when r.status_code between 200 and 299 then 0 else l.delivery_attempts end,
           delivery_queued_at = null,
           last_delivery_error = case
             when r.status_code between 200 and 299 then null
             else 'provider_rejected:http_' || coalesce(r.status_code::text, 'unknown')
           end,
           next_delivery_attempt_at = case
             when r.status_code between 200 and 299 then null
             else now() + least(
               interval '6 hours',
               interval '15 minutes' * power(2.0, greatest(l.delivery_attempts - 1, 0))::double precision
             )
           end
      from responses r
     where l.id = r.id
    returning delivery_status
  )
  select count(*) filter (where delivery_status = 'delivered'),
         count(*) filter (where delivery_status = 'failed')
    into v_delivered, v_failed
    from reconciled;

  update public.hv_alert_log
     set delivery_status = 'failed',
         last_delivery_error = 'provider_timeout:no_pg_net_response_after_2h',
         delivery_queued_at = null,
         next_delivery_attempt_at = now() + least(
           interval '6 hours',
           interval '15 minutes' * power(2.0, greatest(delivery_attempts - 1, 0))::double precision
         )
   where delivery_status = 'queued'
     and delivery_queued_at < now() - interval '2 hours';
  get diagnostics v_timed_out = row_count;
  v_failed := v_failed + v_timed_out;

  with cur as (
    select * from public.hv_pipeline_alerts() where severity <> 'ok'
  ), upsert as (
    insert into public.hv_alert_log (alert_key, severity, value, detail)
    select c.alert_key, c.severity, c.value, c.detail from cur c
    on conflict (alert_key) where resolved_at is null
    do update set severity = excluded.severity,
                  value = excluded.value,
                  detail = excluded.detail,
                  last_seen_at = now()
    returning alert_key, severity, value, (xmax = 0) as inserted
  )
  select
    count(*) filter (where inserted),
    count(*),
    string_agg('[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value, ''), E'\n' order by alert_key)
      filter (where inserted and severity = 'critical')
    into v_new, v_open, v_critical_new_body
    from upsert;

  update public.hv_alert_log l set resolved_at = now()
   where l.resolved_at is null
     and not exists (
       select 1 from public.hv_pipeline_alerts() a
        where a.alert_key = l.alert_key and a.severity <> 'ok');
  get diagnostics v_resolved = row_count;

  select count(*)
    into v_permanently_failed
    from public.hv_alert_log
   where resolved_at is null
     and delivery_status = 'failed'
     and delivery_attempts >= 5;

  if v_critical_new_body is not null then
    select net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-send-sms',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'hv_edge_anon_key' limit 1)
      ),
      body := jsonb_build_object('body', 'Harbourview CRITICAL alert(s):' || E'\n' || v_critical_new_body),
      timeout_milliseconds := 15000
    ) into v_sms_rid;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_email_to' limit 1;

  if v_key is null or v_to is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'skipped: vault needs resend_api_key and alert_email_to',
      'sms_request_id', v_sms_rid);
  end if;

  select coalesce(array_agg(e.id order by e.id), '{}'::bigint[])
    into v_alert_ids
    from (
      select l.id
        from public.hv_alert_log l
       where l.resolved_at is null
         and l.delivery_status <> 'queued'
         and l.delivery_attempts < 5
         and coalesce(l.next_delivery_attempt_at, '-infinity'::timestamptz) <= now()
         and (l.notified_at is null or l.notified_at < now() - interval '6 hours')
       order by l.id
       for update skip locked
    ) e;

  if coalesce(array_length(v_alert_ids, 1), 0) = 0 then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'nothing eligible to queue',
      'sms_request_id', v_sms_rid);
  end if;

  select string_agg(
           '[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value, '') ||
           E'\n    ' || coalesce(detail, ''), E'\n' order by id)
    into v_body
    from public.hv_alert_log
   where id = any (v_alert_ids);

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object(
      'from', 'Harbourview Pipeline <alerts@harbourview.company>',
      'to', jsonb_build_array(v_to),
      'subject', 'Harbourview pipeline: ' || v_open || ' open alert(s)',
      'text', 'Pipeline assertions failing as of ' || now()::text || E'\n\n' || v_body
    ),
    timeout_milliseconds := 20000
  ) into v_rid;

  update public.hv_alert_log
     set delivery_request_id = v_rid,
         delivery_status = 'queued',
         delivery_attempts = delivery_attempts + 1,
         delivery_queued_at = now(),
         last_delivery_error = null,
         next_delivery_attempt_at = null
   where id = any (v_alert_ids);
  get diagnostics v_queued = row_count;

  return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
    'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
    'permanently_failed', v_permanently_failed, 'queued', v_queued,
    'delivery', 'queued', 'request_id', v_rid, 'sms_request_id', v_sms_rid);
end
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260918202608','twilio_sms_critical_alerts','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260918202608_twilio_sms_critical_alerts.sql

-- RECOVERY BEGIN 20260919120000_expose_cannabinoid_compounds_api.sql
-- Exposes public.cannabinoid_compounds (added by the Legal/Research MCP pipeline
-- session on 2026-09-19) to PostgREST via the api schema, matching the
-- SUPABASE_DB_SCHEMA='api' convention (PostgREST only exposes the api schema on
-- this project -- see lib/supabase/env.ts and prior EVIDENCE_LOG entries).
--
-- Read-only, public-safe reference fields only: excludes internal bookkeeping
-- (source_refs jsonb payload) that isn't meant for the public research page.
-- Grants SELECT to anon/authenticated because this powers a PUBLIC intelligence
-- page (app/intelligence/cannabinoid-research), not an admin surface -- unlike
-- api.intel_eval_labeling, which is service_role-only.

create or replace view api.cannabinoid_compounds as
select
  id,
  chembl_id,
  pref_name,
  max_phase,
  first_approval,
  is_natural_product,
  is_approved_drug,
  therapeutic_flag,
  molecular_formula,
  synonyms,
  atc_codes,
  regulatory_notes,
  fetched_at,
  updated_at
from public.cannabinoid_compounds;

grant select on api.cannabinoid_compounds to anon, authenticated;

comment on view api.cannabinoid_compounds is
  'Public-safe projection of public.cannabinoid_compounds for the /intelligence/cannabinoid-research page. Rollback: drop view api.cannabinoid_compounds.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260919120000','expose_cannabinoid_compounds_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260919120000_expose_cannabinoid_compounds_api.sql

-- RECOVERY BEGIN 20260919160000_marketplace_inquiry_commercial_outcome.sql
-- Explicit commercial outcomes for marketplace inquiries.
-- review_status remains the workflow stage; commercial_outcome is the terminal business result.

do $migration$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    return;
  end if;

  alter table public.marketplace_inquiries
    add column if not exists commercial_outcome text null,
    add column if not exists commercial_outcome_reason text null,
    add column if not exists commercial_outcome_at timestamptz null;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_inquiries_commercial_outcome_check'
      and conrelid = 'public.marketplace_inquiries'::regclass
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_commercial_outcome_check
      check (
        commercial_outcome is null
        or commercial_outcome in ('won', 'lost', 'withdrawn')
      );
  end if;

  update public.marketplace_inquiries
  set
    commercial_outcome = 'won',
    commercial_outcome_reason = coalesce(commercial_outcome_reason, 'backfill:qualified'),
    commercial_outcome_at = coalesce(commercial_outcome_at, now())
  where commercial_outcome is null
    and review_status = 'qualified';

  update public.marketplace_inquiries
  set
    commercial_outcome = 'lost',
    commercial_outcome_reason = coalesce(commercial_outcome_reason, 'backfill:not_fit'),
    commercial_outcome_at = coalesce(commercial_outcome_at, now())
  where commercial_outcome is null
    and review_status = 'not_fit';
end
$migration$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260919160000','marketplace_inquiry_commercial_outcome','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260919160000_marketplace_inquiry_commercial_outcome.sql
