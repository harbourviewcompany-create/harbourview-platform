
-- RECOVERY BEGIN 20260702033107_regulatory_product_format_matrix.sql
-- Regulatory product-format matrix: which cannabis product formats are permitted,
-- restricted, or prohibited in each country, per regulatory pathway.
-- Pathways are first-class (e.g. Brazil RDC 1015 vs RDC 660; UK licensed vs CBPM specials).

create type public.reg_pathway_type as enum (
  'registered_medicine',      -- registered/approved pharmaceutical products (Sativex, Epidyolex)
  'domestic_authorization',   -- simplified national product authorization (BR RDC 1015, NZ scheme, IE MCAP)
  'special_access_import',    -- named-patient / special access / individual import (AU SAS, ZA s21, BR RDC 660)
  'magistral_compounding',    -- pharmacy compounding from raw material (PL, IT, ES RD 903/2025)
  'medical_access_program',   -- general prescription access to standardized unregistered products (DE, CH, TH)
  'adult_use_commercial',     -- licensed commercial adult-use (CA, UY, US states)
  'adult_use_noncommercial',  -- possession/home-grow/clubs without commercial retail (DE CanG, CZ, MT, ZA)
  'low_thc_consumer',         -- CBD / low-THC consumer products
  'pilot_program',            -- time-limited pilots/experiments (CH trials, NL wietexperiment, BR sandbox)
  'export_oriented',          -- cultivation/manufacture primarily for export (LS, MK, GR, CO)
  'research_only'
);

create type public.reg_rule_status as enum (
  'permitted','restricted','prohibited','unregulated','proposed','suspended','unknown'
);

create type public.reg_verification_status as enum ('verified','needs_review','stale');

create table public.product_formats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,  -- inhalable | oral | oromucosal | topical | rectal | raw_material | other
  description text,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table public.regulatory_pathways (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  iso_alpha2 text not null,
  slug text not null unique,
  name text not null,
  pathway_type public.reg_pathway_type not null,
  legal_basis text,
  regulator text,
  status text not null default 'active',  -- active | pilot | announced | suspended | repealed
  effective_date date,
  sunset_date date,
  summary text,
  prescription_notes text,
  source_urls text[] not null default '{}',
  verification public.reg_verification_status not null default 'needs_review',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index regulatory_pathways_country_idx on public.regulatory_pathways (country_id);
create index regulatory_pathways_iso2_idx on public.regulatory_pathways (iso_alpha2);
create index regulatory_pathways_type_idx on public.regulatory_pathways (pathway_type);

create table public.pathway_format_rules (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.regulatory_pathways(id) on delete cascade,
  format_id uuid not null references public.product_formats(id) on delete cascade,
  status public.reg_rule_status not null default 'unknown',
  thc_limit text,
  cbd_limit text,
  conditions jsonb not null default '{}'::jsonb,
  notes text,
  source_urls text[] not null default '{}',
  verification public.reg_verification_status not null default 'needs_review',
  last_verified_at timestamptz,
  effective_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pathway_id, format_id)
);
create index pathway_format_rules_format_idx on public.pathway_format_rules (format_id);
create index pathway_format_rules_status_idx on public.pathway_format_rules (status);

-- updated_at maintenance
create or replace function public.reg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_reg_pathways_touch before update on public.regulatory_pathways
  for each row execute function public.reg_touch_updated_at();
create trigger trg_reg_rules_touch before update on public.pathway_format_rules
  for each row execute function public.reg_touch_updated_at();

-- Change history: pipe substantive rule changes into the existing regulatory_field_changes audit table
create or replace function public.reg_log_rule_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'status', old.status::text, new.status::text, 'reg_format_matrix_trigger');
  end if;
  if new.thc_limit is distinct from old.thc_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'thc_limit', old.thc_limit, new.thc_limit, 'reg_format_matrix_trigger');
  end if;
  if new.cbd_limit is distinct from old.cbd_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'cbd_limit', old.cbd_limit, new.cbd_limit, 'reg_format_matrix_trigger');
  end if;
  return new;
end $$;

create trigger trg_reg_rules_changelog after update on public.pathway_format_rules
  for each row execute function public.reg_log_rule_change();

create or replace function public.reg_log_pathway_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('regulatory_pathways', new.id::text, 'status', old.status, new.status, 'reg_format_matrix_trigger');
  end if;
  return new;
end $$;

create trigger trg_reg_pathways_changelog after update on public.regulatory_pathways
  for each row execute function public.reg_log_pathway_change();

-- Flat matrix for the app layer
create view public.v_country_format_matrix
with (security_invoker = on) as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  p.id   as pathway_id,
  p.slug as pathway_slug,
  p.name as pathway_name,
  p.pathway_type,
  p.status as pathway_status,
  p.legal_basis,
  f.slug as format_slug,
  f.name as format_name,
  f.category as format_category,
  r.status as rule_status,
  r.thc_limit,
  r.cbd_limit,
  r.conditions,
  r.notes,
  r.verification,
  r.last_verified_at
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id = r.pathway_id
join public.product_formats f on f.id = r.format_id
join public.countries c on c.id = p.country_id;

-- Update loop: rows that need re-verification (feeds intelligence-automation agents)
create view public.v_regulatory_format_stale
with (security_invoker = on) as
select 'pathway'::text as record_type, p.id, p.iso_alpha2, p.slug as record_slug,
       p.verification, p.last_verified_at
from public.regulatory_pathways p
where p.verification <> 'verified' or p.last_verified_at < now() - interval '90 days' or p.last_verified_at is null
union all
select 'rule'::text, r.id, p.iso_alpha2, p.slug || ':' || f.slug,
       r.verification, r.last_verified_at
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id = r.pathway_id
join public.product_formats f on f.id = r.format_id
where r.verification <> 'verified' or r.last_verified_at < now() - interval '90 days' or r.last_verified_at is null;

-- Coverage across the full 203-country canon: absence of rows = research gap, not "prohibited"
create view public.v_regulatory_format_coverage
with (security_invoker = on) as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  count(distinct p.id) as pathway_count,
  count(r.id) as rule_count,
  min(p.verification::text) as worst_verification,
  max(greatest(coalesce(p.last_verified_at, 'epoch'::timestamptz), coalesce(r.last_verified_at, 'epoch'::timestamptz))) as last_verified_at
from public.countries c
left join public.regulatory_pathways p on p.country_id = c.id
left join public.pathway_format_rules r on r.pathway_id = p.id
group by c.iso_alpha2, c.country_name, c.region;

-- RLS: match platform convention (public read, service_role write)
alter table public.product_formats enable row level security;
alter table public.regulatory_pathways enable row level security;
alter table public.pathway_format_rules enable row level security;

create policy product_formats_public_read on public.product_formats
  for select to anon, authenticated using (true);
create policy product_formats_service_write on public.product_formats
  for all to service_role using (true) with check (true);

create policy regulatory_pathways_public_read on public.regulatory_pathways
  for select to anon, authenticated using (true);
create policy regulatory_pathways_service_write on public.regulatory_pathways
  for all to service_role using (true) with check (true);

create policy pathway_format_rules_public_read on public.pathway_format_rules
  for select to anon, authenticated using (true);
create policy pathway_format_rules_service_write on public.pathway_format_rules
  for all to service_role using (true) with check (true);

grant select on public.product_formats, public.regulatory_pathways, public.pathway_format_rules,
  public.v_country_format_matrix, public.v_regulatory_format_stale, public.v_regulatory_format_coverage
  to anon, authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702033107','regulatory_product_format_matrix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702033107_regulatory_product_format_matrix.sql

-- RECOVERY BEGIN 20260702033323_seed_product_formats_and_pathways.sql
-- Canonical product format taxonomy
insert into public.product_formats (slug, name, category, description, sort_order) values
('dried_flower','Dried flower','inhalable','Herbal cannabis flower (whole or milled), typically for vaporization; smoking often separately restricted',10),
('vape_products','Vape cartridges & liquids','inhalable','Pre-filled cartridges, pods and liquids for inhalation devices',20),
('extracts_concentrates','Extracts & concentrates','extract','Resin, rosin, full-spectrum extract, distillate; dispensed directly or as compounding input',30),
('isolates','Cannabinoid isolates','extract','Purified single cannabinoids (e.g. CBD >=98%, dronabinol) as API or finished form',40),
('oral_oil','Oral oils & solutions','oral','Oils, drops, tinctures and oral solutions',50),
('capsules','Capsules & softgels','oral','Hard and soft gel capsules',60),
('tablets','Tablets & pills','oral','Compressed tablets and pills',70),
('oromucosal_spray','Oromucosal & sublingual sprays','oromucosal','Sprays absorbed via oral mucosa (e.g. nabiximols)',80),
('lozenges','Lozenges, pastilles & wafers','oromucosal','Dissolvable oromucosal solids',90),
('edibles','Edibles','edible','Cannabis-infused food products',100),
('beverages','Beverages','edible','Cannabis-infused drinks',110),
('topicals','Topicals & dermal','topical','Creams, balms, cosmetics for external use',120),
('transdermal_patches','Transdermal patches','topical','Systemic delivery via skin patch',130),
('suppositories','Suppositories','rectal','Rectal/vaginal dosage forms',140),
('bulk_api_raw','Bulk raw material / API','raw_material','GMP flower, extract or cannabinoid API as manufacturing/compounding input or trade good',150),
('magistral_preparations','Magistral (compounded) preparations','compounded','Pharmacy-compounded preparations made to individual prescription',160),
('seeds_plants','Seeds & live plants','plant','Seeds, clones and plants for cultivation (home-grow or licensed)',170);

-- Regulatory pathways (priority markets, verified against Jun-Jul 2026 sources where noted)
insert into public.regulatory_pathways
  (country_id, iso_alpha2, slug, name, pathway_type, legal_basis, regulator, status, effective_date, summary, prescription_notes, verification, last_verified_at)
select c.id, v.iso2, v.slug, v.name, v.ptype::public.reg_pathway_type, v.legal, v.reg, v.status, v.eff::date, v.summary, v.rx, v.ver::public.reg_verification_status,
       case when v.ver='verified' then now() else null end
from (values
-- BRAZIL
('BR','br-rdc-1015','Sanitary Authorization for Cannabis Products (RDC 1.015/2026, ex-RDC 327/2019)','domestic_authorization','RDC 1.015/2026 (revokes RDC 327/2019; in force 4 May 2026); RDC 1.004/2025 (IFAV quality); RDC 1.013/2026 (<=0.3% THC medical cultivation)','Anvisa','active','2026-05-04','New framework approved by Dicol 28 Jan 2026 replacing RDC 327. Pharmacy-dispensed Cannabis products under sanitary authorization (~49 products / 24 companies under prior regime). Domestic cultivation <=0.3% THC now permitted for manufacture per STJ IAC 16 compliance.','Prescription-only; THC >0.2% products historically limited to palliative/terminal care (verify carryover in final 1.015 text)','verified',null),
('BR','br-rdc-660','Individual patient import of cannabis-derived products (RDC 660/2022)','special_access_import','RDC 660/2022','Anvisa','active',null,'Import by natural persons for own use on prescription; >660k import authorizations 2015-2025. Still in force but formally flagged by Anvisa (Jan 2026 vote) as a regulatory distortion needing urgent revision - expect a separate normative act.','Prescription from legally qualified professional; industrialized products only','verified',null),
('BR','br-registered-med','Registered cannabis medicine','registered_medicine','Medicine registration (RDC 200/2017 route)','Anvisa','active',null,'One registered cannabis medicine (Mevatyl / nabiximols).',null,'needs_review',null),
('BR','br-rdc-1014-sandbox','Regulatory sandbox: patient associations (RDC 1.014/2026)','pilot_program','RDC 1.014/2026','Anvisa','pilot','2026-02-03','Sandbox assessing cultivation, plant-based API production, and distribution of cannabis preparations by non-profit patient associations to members.',null,'verified',null),
-- UNITED KINGDOM
('GB','gb-cbpm-specials','Unlicensed cannabis-based products for medicinal use (CBPMs / specials)','medical_access_program','Misuse of Drugs Regulations 2001 as amended 2018 (Sch 2); MHRA specials regime','MHRA / Home Office','active','2018-11-01','Specialist-initiated prescriptions for unlicensed CBPMs. NHS prescribing rare (<20k); ~100k patients via private clinics. Imported and domestic products.','Specialist doctor initiation required; private clinic market dominant','verified',null),
('GB','gb-licensed','Licensed cannabis-based medicines','registered_medicine','MHRA marketing authorisations','MHRA','active',null,'Sativex (nabiximols), Epidyolex (CBD), Nabilone.',null,'verified',null),
('GB','gb-cbd-consumer','Consumer CBD (novel foods regime)','low_thc_consumer','FSA novel foods authorisation process; controlled-drug THC limits','FSA / Home Office','active',null,'Ingestible CBD requires novel-food authorisation track; cosmetics separate. CBD flower not permitted.','No prescription; controlled cannabinoid content must be below de-minimis thresholds','needs_review',null),
-- GERMANY
('DE','de-medcang','Medical cannabis (MedCanG prescription medicine)','medical_access_program','MedCanG (Apr 2024, cannabis removed from narcotics list); amendment bill restricting telemedicine/mail-order passed Cabinet 8 Oct 2025, Bundestag first reading 18 Dec 2025, final vote expected H1 2026','BfArM','active','2024-04-01','Standard e-prescription medicine; flower, extracts, dronabinol and finished meds. ~338k+ patients; imports ~81t H1 2025. Pending amendment: in-person first prescription, telemed follow-ups only within 4 quarters of in-person contact, mail-order dispensing ban (pharmacy courier delivery exempt).','Any physician; GKV reimbursement subject to G-BA rules; telemedicine restrictions pending - verify enactment','verified',null),
('DE','de-registered','Registered cannabis medicines','registered_medicine','AMG marketing authorisations','BfArM','active',null,'Sativex, Epidyolex, Canemes (nabilone).',null,'verified',null),
('DE','de-cang-pillar1','CanG Pillar 1: possession, home cultivation, cultivation associations','adult_use_noncommercial','CanG (KCanG), in force 1 Apr 2024','BLE / state authorities','active','2024-04-01','25g public / 50g home possession, 3 plants, non-profit cultivation associations (max 500 members). No commercial retail; Pillar 2 pilot framework still pending.',null,'verified',null),
-- AUSTRALIA
('AU','au-sas-ap','Unapproved medicinal cannabis via SAS-B / Authorised Prescriber (TGO 93 Categories 1-5)','medical_access_program','Therapeutic Goods Act 1989 s19; TGO 93 quality standard','TGA / ODC','active','2016-11-01','~1,000+ unapproved products supplied under SAS/AP; market >AUD 1bn (2025); 41 licensed cultivators, 41t produced 2024. 2025 federal review concluded; medicinal cannabis is a top TGA compliance priority for 2026-27 with tightening expected on advertising, telehealth prescribing and product quality.','Any registered doctor/NP via SAS-B or AP; Cat 2-5 are Schedule 8','verified',null),
('AU','au-registered','Registered cannabis medicines (ARTG)','registered_medicine','ARTG registration','TGA','active',null,'Sativex (nabiximols), Epidyolex (CBD).',null,'verified',null),
('AU','au-cbd-s3','Low-dose CBD Schedule 3 (pharmacist-only) pathway','low_thc_consumer','Poisons Standard Sch 3 entry (<=150mg/day CBD)','TGA','announced',null,'Down-scheduled pathway exists but no CBD product has achieved ARTG registration for S3 supply yet - no lawful OTC product on market.',null,'needs_review',null),
-- POLAND
('PL','pl-raw-material','Pharmaceutical raw material (flower, extracts, resin) for magistral preparation','magistral_compounding','Act on Counteracting Drug Addiction amendment, in force 1 Nov 2017; URPL raw-material marketing authorisations','URPL / GIF','active','2017-11-01','~50 authorized raw-material products (approx. 40 flower, 12 extract, Dec 2025). 5,447 kg flower dispensed 2025; 105k+ patients. Import-reliant; no active domestic cultivation. Telemedicine prescribing restricted since Nov 2024 (in-person consultation), market recovered above pre-ban peak by Dec 2025.','Any licensed physician; narcotic (pink) prescription; pharmacy compounds/doses','verified',null),
('PL','pl-registered','Registered cannabis medicines','registered_medicine','URPL marketing authorisation','URPL','active',null,'Sativex registered.',null,'verified',null),
('PL','pl-cbd-consumer','Consumer CBD / low-THC hemp (<=0.3% THC)','low_thc_consumer','Hemp threshold <=0.3% THC; EU Novel Food regime enforced by GIS','GIS','active',null,'CBD supplements/cosmetics sold subject to Novel Food enforcement (RASFF actions 2025); CBD hemp flower sold as collectible in grey zone.',null,'verified',null),
-- SOUTH AFRICA
('ZA','za-sahpra-s21','SAHPRA Section 21 unregistered medicine access','special_access_import','Medicines and Related Substances Act s21; THC Sch 6, CBD Sch 4 (GN 586/2020)','SAHPRA','active',null,'Named-patient authorization for unregistered cannabis medicines; 6-month approvals with outcome reporting.','Doctor applies per patient; renewal every 6 months','verified',null),
('ZA','za-cbd-exemption','Low-dose CBD complementary/OTC exemption','low_thc_consumer','GN 586 GG 43347 (May 2020): <=600mg CBD/pack & <=20mg/day, low-risk claims; or processed products <=0.0075% CBD & <=0.001% THC','SAHPRA / DoH','active','2020-05-22','Low-dose CBD sold OTC. Mar 2025 blanket ban on cannabis/hemp in foodstuffs was withdrawn after presidential intervention; foodstuff status remains contested pending new rules.',null,'verified',null),
('ZA','za-private-use','Private cultivation and use (CfPPA / Prince judgment)','adult_use_noncommercial','Constitutional Court Prince (2018); Cannabis for Private Purposes Act 7 of 2024 (signed 29 May 2024)','n/a','active','2024-05-29','Private adult possession/cultivation lawful; no commercial retail. Grow/social clubs remain a contested grey zone (Haze Club). Commercialisation Policy targeted for Cabinet Apr 2026; consolidated Cannabis Bill expected mid-2027.',null,'verified',null),
('ZA','za-sahpra-22c','Licensed medicinal cultivation, manufacture and export (s22C)','export_oriented','Medicines Act s22C(1)(b); GMP; hemp redefined <=2% THC under Plant Improvement Act (1 Dec 2025)','SAHPRA / DALRRD','active',null,'~120 export licences, 83+ cultivation licences; EU-facing export market. Hemp (<=2% THC) commercially cultivable under DALRRD permits since Dec 2025.',null,'verified',null),
-- CANADA
('CA','ca-adult-use','Adult-use commercial (Cannabis Act)','adult_use_commercial','Cannabis Act SC 2018 c.16 + Cannabis Regulations','Health Canada / provinces','active','2018-10-17','Full commercial framework across all consumer classes: dried/fresh, extracts, edibles, beverages, topicals, seeds/plants.',null,'needs_review',null),
('CA','ca-medical','Medical access (Cannabis Regulations Part 14)','medical_access_program','Cannabis Regulations Part 14','Health Canada','active','2018-10-17','Registered medical clients via licensed sellers; personal/designated production permitted.','Medical document from HCP','needs_review',null),
('CA','ca-registered','Registered cannabis medicine','registered_medicine','Food and Drugs Act DIN','Health Canada','active',null,'Sativex marketed.',null,'needs_review',null),
-- UNITED STATES
('US','us-state-programs','State-regulated medical and adult-use programs','adult_use_commercial','State statutes; federally Schedule I CSA (rescheduling to Sch III proposed, proceeding stalled)','State agencies / DEA-FDA (federal)','active',null,'Subnational patchwork: ~40 medical / ~24 adult-use states. Formats vary by state (flower, vapes, edibles, beverages, topicals, concentrates). Federal illegality persists; treat state matrix as separate subnational layer.',null,'needs_review',null),
('US','us-hemp','Hemp-derived cannabinoids (2018 Farm Bill, <=0.3% delta-9 THC)','low_thc_consumer','Agriculture Improvement Act 2018','USDA / FDA / states','active','2018-12-20','Hemp products federally lawful by delta-9 threshold; FDA has not authorized CBD in food/supplements; intoxicating hemp derivatives contested state-by-state.',null,'needs_review',null),
('US','us-fda-registered','FDA-approved cannabinoid medicines','registered_medicine','FDA NDA approvals','FDA','active',null,'Epidiolex (CBD), Marinol/Syndros (dronabinol), Cesamet (nabilone).',null,'needs_review',null),
-- NETHERLANDS
('NL','nl-omc','Office for Medicinal Cannabis pharmacy program','medical_access_program','Opium Act exemption; OMC monopoly supply (Bedrocan)','OMC (VWS)','active','2003-09-01','Standardized flower varieties and pharmacy-prepared oils dispensed on prescription; also major exporter of pharmaceutical flower.',null,'needs_review',null),
('NL','nl-experiment','Coffeeshop tolerance + closed-chain supply experiment','pilot_program','Wietexperiment; fully regulated supply in 10 participating municipalities since Apr 2025','VWS / JenV','pilot','2025-04-07','Tolerance policy retail via coffeeshops; participating municipalities restricted to regulated-chain product.',null,'verified',null),
-- SWITZERLAND
('CH','ch-medical','Medical prescription access','medical_access_program','NarcA revision in force 1 Aug 2022 (no federal exceptional authorisation needed)','Swissmedic / FOPH','active','2022-08-01','Physician prescription; magistral preparations, standardized flower and extracts; Sativex registered.',null,'needs_review',null),
('CH','ch-pilot-trials','Adult-use scientific pilot trials','pilot_program','NarcA Art. 8a pilot provision (2021)','FOPH','pilot','2023-01-30','Regulated sales to enrolled participants in Basel, Zurich, Bern, Geneva and other cities; evidence base for national framework.',null,'verified',null),
('CH','ch-low-thc','Low-THC cannabis (<1% THC)','low_thc_consumer','Excluded from NarcA below 1% THC','FOPH','active',null,'CBD flower and products under 1% THC sold as consumer goods (tobacco-substitute rules for smokables).',null,'needs_review',null),
-- THAILAND
('TH','th-controlled-herb','Medical-only controlled herb framework (cannabis flower)','medical_access_program','Notification on Controlled Herbs under Thai Traditional Medicine Act B.E. 2542, effective 25 Jun 2025; Ministerial Reg No.2 B.E. 2569 (Apr 2026) licensing overlay','MoPH / DTAM / Thai FDA','active','2025-06-25','Recreational sale recriminalized 25 Jun 2025. Flower dispensed only against PT33 prescription (max 30 days) at licensed dispensaries with on-site practitioner (Jan 2026 rules); import of flower prohibited; mass dispensary closures through licence attrition.','PT33 prescription from licensed Thai practitioner','verified',null),
('TH','th-narcotic-extracts','High-THC extracts as Category 5 narcotics','medical_access_program','Ministerial Regulation on Category 5 Narcotics (Cannabis/Hemp Extracts) B.E. 2569, published 26 Mar 2026, effective 26 Apr 2026','Thai FDA / ONCB','active','2026-04-26','Extracts >0.2% THC remain Cat 5 narcotics; licences limited to registered medical facilities, pharmacies and herbal shops for medical/research/commercial-extract purposes.',null,'verified',null),
('TH','th-cbd-consumer','CBD consumer products (<0.2% THC)','low_thc_consumer','Product labelling rules','Thai FDA','active',null,'CBD products under 0.2% THC sold without prescription.',null,'verified',null),
-- FRANCE
('FR','fr-permanent','Permanent medical cannabis framework (post-experiment)','medical_access_program','2024 Social Security Financing Act generalisation; framework live 1 Apr 2026','ANSM','active','2026-04-01','Transition from 2021-2025 experiment to permanent framework - the largest single EU market opening of 2026. Launching WITHOUT flower; oil/extract-based formats only. Reimbursement design determines patient scale.','Hospital/specialist initiation expected; verify final prescribing decree detail','verified',null),
('FR','fr-registered','Licensed cannabinoid medicines','registered_medicine','ANSM/EMA authorisations','ANSM','active',null,'Epidyolex available; Sativex authorised 2014 but never marketed (pricing).',null,'needs_review',null),
-- SPAIN
('ES','es-rd903','Hospital magistral medical cannabis (Royal Decree 903/2025)','magistral_compounding','Real Decreto 903/2025','AEMPS','active','2025-10-01','Standardized cannabis extract magistral preparations via hospital pharmacies only; no flower dispensing. Implementation rolling through 2026.','Hospital specialist prescribing; verify condition list and rollout status','verified',null),
('ES','es-registered','Licensed cannabis medicines','registered_medicine','AEMPS authorisations','AEMPS','active',null,'Sativex, Epidyolex.',null,'needs_review',null),
('ES','es-social-clubs','Cannabis social clubs (unregulated grey zone)','adult_use_noncommercial','No national statute; association jurisprudence','n/a','active',null,'~800-1,000 clubs operating without formal legislation; private consumption decriminalised.',null,'verified',null),
-- CZECHIA
('CZ','cz-medical','Medical cannabis program','medical_access_program','Act 50/2013; SUKL/SAKL regime; e-prescription; 90% reimbursement','SUKL / SAKL','active','2013-04-01','Flower and individually prepared (magistral) preparations on e-prescription; expanding market with domestic cultivation licences.',null,'needs_review',null),
('CZ','cz-adult-use','Adult-use personal framework','adult_use_noncommercial','Law passed Jul 2025, effective 1 Jan 2026','Government of Czechia','active','2026-01-01','Adults 21+: 3 plants home cultivation, 100g at home / 25g public possession. No commercial retail (deferred); psychomodulatory low-THC track separate.',null,'verified',null),
-- Registered-medicine + magistral markets and stubs follow in next seed batch
-- ISRAEL
('IL','il-imca','Israel Medical Cannabis (IMCA) prescription reform','medical_access_program','IMCA regulations; 2024 reform shifting from licence to prescription for most indications','IMCA (MoH)','active',null,'Large domestic market; flower, oils, extracts via pharmacies; export permitted since 2020.',null,'needs_review',null),
-- PORTUGAL
('PT','pt-infarmed','Infarmed medical cannabis framework','medical_access_program','Law 33/2018; DL 8/2019','Infarmed','active','2019-02-01','Prescription access to authorized preparations (flower, oral solutions); limited domestic product list; major EU-GMP cultivation/export hub.',null,'needs_review',null),
-- ITALY
('IT','it-magistral','Magistral dispensing (FM-2 + imports)','magistral_compounding','DM 9 Nov 2015; military pharmaceutical plant (SCFM) production + imports','Ministry of Health / SCFM','active','2015-11-09','Pharmacy-compounded preparations from flower/extracts; state production plus imports.',null,'needs_review',null),
('IT','it-cannabis-light','Cannabis light (hemp inflorescences)','low_thc_consumer','Law 242/2016; Apr 2025 security decree criminalising hemp flower trade - under legal challenge','n/a','suspended','2025-04-11','Formerly large <=0.5% THC hemp-flower sector; 2025 decree bans inflorescence trade, litigation ongoing.',null,'needs_review',null),
-- DENMARK
('DK','dk-scheme','Medicinal cannabis scheme (pilot made permanent)','domestic_authorization','Pilot programme 2018-2025; made permanent from 1 Jan 2025','Danish Medicines Agency','active','2025-01-01','Admitted products (flower, oils, capsules) prescribable; Denmark also a significant EU-GMP producer/exporter.',null,'needs_review',null),
-- NEW ZEALAND
('NZ','nz-scheme','Medicinal Cannabis Scheme (verified products)','domestic_authorization','Misuse of Drugs (Medicinal Cannabis) Regulations 2019','Medsafe / MCA','active','2020-04-01','Products meeting minimum quality standard prescribable by any doctor; flower and oral formats verified.',null,'needs_review',null),
-- IRELAND
('IE','ie-mcap','Medical Cannabis Access Programme + ministerial licences','domestic_authorization','MCAP (2019); Misuse of Drugs ministerial licence route','HPRA / DoH','active','2019-06-26','Named product list (oral solutions/oils, some flower via licence route); narrow condition list.',null,'needs_review',null),
-- ARGENTINA
('AR','ar-reprocann','REPROCANN + pharmacy/magistral access','medical_access_program','Law 27.350; Decree 883/2020; REPROCANN registry','ANMAT / MoH','active','2020-11-12','Registered patients may self-cultivate or access via network cultivators; pharmacy magistral and registered products; industrial framework via ARICCAME.',null,'needs_review',null),
-- COLOMBIA
('CO','co-framework','Medical cannabis and export framework','export_oriented','Law 1787/2016; Decree 811/2021 (permits dried flower export)','Minjusticia / INVIMA','active','2016-07-06','Licensed cultivation/manufacture; magistral domestic dispensing; dried flower export permitted since 2021.',null,'needs_review',null),
-- URUGUAY
('UY','uy-adult-use','Adult-use (pharmacies, clubs, home grow)','adult_use_commercial','Law 19.172 (2013)','IRCCA','active','2014-05-06','Registered residents buy flower at pharmacies; membership clubs; home cultivation.',null,'needs_review',null),
('UY','uy-medical','Medical cannabis','medical_access_program','Law 19.172; Decree 46/015','MSP / IRCCA','active',null,'Prescription products incl. oils; export industry active.',null,'needs_review',null),
-- MEXICO
('MX','mx-medical','Medical cannabis regulations','medical_access_program','2021 sanitary regulations (COFEPRIS)','COFEPRIS','active','2021-01-12','Pharmaceutical-derivative access regulated; implementation slow. Adult-use: SCJN declared prohibition unconstitutional; statutory market not enacted.',null,'needs_review',null),
-- JAPAN
('JP','jp-pharma','Cannabis-derived pharmaceuticals pathway','registered_medicine','Revised Cannabis Control Act (Dec 2024): allows approved cannabis-derived medicines; creates use offence; THC ppm limits for CBD goods','MHLW / PMDA','active','2024-12-12','Epidiolex-type approvals now possible; strict THC residual limits govern the CBD consumer market.',null,'needs_review',null),
('JP','jp-cbd','CBD consumer products (THC ppm limits)','low_thc_consumer','Cannabis Control Act amendment ministerial ordinance THC caps','MHLW','active','2024-12-12','CBD lawful within strict residual-THC ppm caps by product type.',null,'needs_review',null),
-- UKRAINE
('UA','ua-medical','Medical cannabis framework','medical_access_program','Law 3528-IX (adopted Dec 2023, effective Aug 2024)','MoH Ukraine','active','2024-08-16','Medical use legalised (war-trauma/PTSD emphasis); registered medicines and licensed circulation; implementation building out.',null,'needs_review',null),
-- MALTA
('MT','mt-medical','Medical cannabis (Production of Cannabis for Medicinal Use Act)','medical_access_program','2018 Act; Medicines Authority control card system','Malta Medicines Authority','active','2018-04-01','Flower and preparations via pharmacies on control card; also EU-GMP production hub.',null,'needs_review',null),
('MT','mt-chra','Adult-use harm reduction associations','adult_use_noncommercial','Cannabis Reform Act 2021 (ARUC)','ARUC','active','2021-12-18','7g possession, 4 plants; non-profit CHRAs supply members; no retail.',null,'needs_review',null),
-- LUXEMBOURG
('LU','lu-medical','Medical cannabis programme','medical_access_program','2018 law; hospital/pharmacy dispensing','Ministry of Health','active','2019-02-01','Flower and extracts dispensed via pharmacies.',null,'needs_review',null),
('LU','lu-home-grow','Adult-use home cultivation','adult_use_noncommercial','2023 law','Ministry of Justice','active','2023-07-21','4 plants per household; possession at home; no commercial sales.',null,'needs_review',null),
-- GREECE
('GR','gr-medical','Medical cannabis production and availability','export_oriented','Law 4523/2018; 4801/2021','EOF / Ministry of Development','active','2018-03-01','Production/export oriented framework; domestic pharmacy availability of final products limited and evolving.',null,'needs_review',null),
-- NORTH MACEDONIA
('MK','mk-framework','Medical cannabis extracts + flower export','export_oriented','2016 law (extracts); 2023 amendments enabling flower export','MALMED','active','2016-06-01','Licensed producers; extracts domestic, flower for export; EU-GMP capacity growing.',null,'needs_review',null),
-- MOROCCO
('MA','ma-anrac','Legal cannabis for medical/industrial/export (ANRAC)','export_oriented','Law 13-21 (2021)','ANRAC','active','2021-07-14','Licensed cultivation in designated provinces; processing for medical, cosmetic, industrial and export purposes; first legal products 2024.',null,'needs_review',null)
) as v(iso2, slug, name, ptype, legal, reg, status, eff, summary, rx, ver)
join public.countries c on c.iso_alpha2 = v.iso2;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702033323','seed_product_formats_and_pathways','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702033323_seed_product_formats_and_pathways.sql

-- RECOVERY BEGIN 20260702033517_seed_format_rules_priority_six.sql
insert into public.pathway_format_rules
  (pathway_id, format_id, status, thc_limit, cbd_limit, conditions, notes, verification, last_verified_at)
select p.id, f.id, v.status::public.reg_rule_status, v.thc, v.cbd, v.cond::jsonb, v.notes, v.ver::public.reg_verification_status,
       case when v.ver='verified' then now() else null end
from (values
-- ============ BRAZIL ============
('br-rdc-1015','oral_oil','permitted','THC <=0.2% standard; higher-THC historically limited to palliative/terminal (confirm carryover in RDC 1.015 final text)',null,'{"route":"oral"}','Core dispensing format under sanitary authorization; oral route ~91% of the market','verified'),
('br-rdc-1015','capsules','permitted',null,null,'{"route":"oral"}',null,'verified'),
('br-rdc-1015','isolates','permitted',null,'CBD phytopharmaceutical API >=98% purity per RDC 24/2011 quality route','{}','CBD as IFA; plant extract as IFAV per RDC 1.004/2025','verified'),
('br-rdc-1015','bulk_api_raw','permitted','Domestic cultivation input <=0.3% THC (RDC 1.013/2026)',null,'{"import":"RDC 988/2025 procedures"}','IFA/IFAV import and, newly, domestic cultivation for manufacture per STJ IAC 16 compliance','verified'),
('br-rdc-1015','oromucosal_spray','restricted',null,null,'{"routes_prior_regime":["oral","nasal"]}','Buccal/sublingual route expansion proposed in CP 1.316/2025 - confirm inclusion in RDC 1.015 final text','needs_review'),
('br-rdc-1015','vape_products','proposed',null,null,'{}','Inhalation route proposed in 2025 public consultation; confirm final text','needs_review'),
('br-rdc-1015','topicals','proposed',null,null,'{}','Dermatological route proposed in 2025 public consultation; confirm final text','needs_review'),
('br-rdc-1015','magistral_preparations','proposed',null,'Compounding proposed only for >=98% purity CBD','{}','Compounding-pharmacy access proposed in consultation; Dicol kept manipulation restricted pending separate act','verified'),
('br-rdc-1015','dried_flower','prohibited',null,null,'{"smoking_prohibited":true}','Plant/flower in natura not a permitted dispensed product','verified'),
('br-rdc-1015','edibles','prohibited',null,null,'{}','Food formats outside the sanitary-authorization product definition','verified'),
('br-rdc-660','oral_oil','permitted',null,null,'{"route_share":"oral ~90.8% of authorized import list"}','Individual import on prescription; industrialized products only','verified'),
('br-rdc-660','capsules','permitted',null,null,'{}',null,'verified'),
('br-rdc-660','topicals','permitted',null,null,'{"route_share":"topical ~4.7%"}',null,'verified'),
('br-rdc-660','vape_products','restricted',null,null,'{"route_share":"inhalation ~1.7%"}','Small share of authorized list; heightened scrutiny expected in pending RDC 660 revision','needs_review'),
('br-rdc-660','dried_flower','prohibited',null,null,'{}','Herbal cannabis in natura not importable by individuals','verified'),
('br-rdc-660','edibles','prohibited',null,null,'{}',null,'needs_review'),
('br-registered-med','oromucosal_spray','permitted',null,null,'{}','Mevatyl (nabiximols)','needs_review'),
('br-rdc-1014-sandbox','magistral_preparations','restricted',null,null,'{"scope":"non-profit patient associations, members only"}','Association-prepared cannabis preparations within sandbox parameters','verified'),
('br-rdc-1014-sandbox','seeds_plants','restricted',null,null,'{"scope":"association cultivation under sandbox"}',null,'verified'),
-- ============ UNITED KINGDOM ============
('gb-cbpm-specials','dried_flower','permitted',null,null,'{"smoking_prohibited":true,"administration":"vaporization"}','Dominant private-market format','verified'),
('gb-cbpm-specials','oral_oil','permitted',null,null,'{}',null,'verified'),
('gb-cbpm-specials','capsules','permitted',null,null,'{}',null,'needs_review'),
('gb-cbpm-specials','vape_products','permitted',null,null,'{}','Cartridges an expanding CBPM category; regulator concern over adult-use-style branding noted 2025-26','needs_review'),
('gb-cbpm-specials','lozenges','restricted',null,null,'{}','Pastille formats via some clinics','needs_review'),
('gb-cbpm-specials','extracts_concentrates','restricted',null,null,'{}',null,'needs_review'),
('gb-cbpm-specials','edibles','prohibited',null,null,'{}','Food formats not supplied as CBPMs','needs_review'),
('gb-licensed','oromucosal_spray','permitted',null,null,'{}','Sativex (nabiximols)','verified'),
('gb-licensed','oral_oil','permitted',null,null,'{}','Epidyolex (CBD oral solution)','verified'),
('gb-licensed','capsules','permitted',null,null,'{}','Nabilone','verified'),
('gb-cbd-consumer','oral_oil','restricted','Controlled-cannabinoid content must be below de-minimis thresholds',null,'{"fsa_adi":"10 mg/day CBD provisional guidance"}','Sale contingent on FSA novel-food authorisation track','needs_review'),
('gb-cbd-consumer','edibles','restricted',null,null,'{}','Novel-food regime applies','needs_review'),
('gb-cbd-consumer','beverages','restricted',null,null,'{}','Novel-food regime applies','needs_review'),
('gb-cbd-consumer','topicals','permitted',null,null,'{}','Cosmetics route outside novel-food scope','needs_review'),
('gb-cbd-consumer','dried_flower','prohibited',null,null,'{}','CBD flower/bud sales unlawful','verified'),
-- ============ GERMANY ============
('de-medcang','dried_flower','permitted',null,null,'{"pending_amendment":"in-person first Rx; telemed follow-ups only within 4 quarters of in-person contact; mail-order dispensing ban (pharmacy courier exempt)"}','Largest format; pending MedCanG amendment targets flower prescribing channels specifically','verified'),
('de-medcang','extracts_concentrates','permitted',null,null,'{}',null,'verified'),
('de-medcang','oral_oil','permitted',null,null,'{}','Dronabinol drops and oily solutions via Rezeptur','verified'),
('de-medcang','capsules','permitted',null,null,'{}',null,'needs_review'),
('de-medcang','magistral_preparations','permitted',null,null,'{}','Rezeptur compounding standard practice','verified'),
('de-medcang','vape_products','restricted',null,null,'{}','Device vaporization standard; prefilled cartridges a limited category','needs_review'),
('de-medcang','bulk_api_raw','permitted',null,null,'{"note":"imports ~81t H1 2025; temporary import-licence pause reported late 2025"}','EU-GMP flower/extract imports dominate supply; domestic BfArM-licensed cultivation <3t','verified'),
('de-medcang','edibles','prohibited',null,null,'{}',null,'verified'),
('de-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','verified'),
('de-registered','oral_oil','permitted',null,null,'{}','Epidyolex','verified'),
('de-registered','capsules','permitted',null,null,'{}','Canemes (nabilone)','verified'),
('de-cang-pillar1','seeds_plants','permitted',null,null,'{"home_grow":"3 plants per adult","clubs":"propagation for members"}',null,'verified'),
('de-cang-pillar1','dried_flower','permitted',null,null,'{"possession":"25g public / 50g home","supply":"cultivation associations to members only"}','No commercial retail; Pillar 2 pilots pending','verified'),
('de-cang-pillar1','extracts_concentrates','prohibited',null,null,'{}','Associations may not distribute extracts','verified'),
('de-cang-pillar1','edibles','prohibited',null,null,'{}',null,'verified'),
-- ============ AUSTRALIA ============
('au-sas-ap','dried_flower','permitted',null,null,'{"tgo93":true}','Fastest-growing format; high-THC flower leads prescription volume and value','verified'),
('au-sas-ap','oral_oil','permitted',null,null,'{"tgo93":true}','CBD and balanced oils hold consistent share','verified'),
('au-sas-ap','capsules','permitted',null,null,'{}',null,'verified'),
('au-sas-ap','vape_products','permitted',null,null,'{"vaping_reforms_2024":"devices banned generally; MC devices via ARTG-approved list or SAS/AP with pre-import Essential Principles notice"}','Permitted within post-2024 device framework','verified'),
('au-sas-ap','lozenges','permitted',null,null,'{}','Wafer/pastille/lozenge categories in SAS product lists','needs_review'),
('au-sas-ap','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('au-sas-ap','topicals','permitted',null,null,'{}',null,'needs_review'),
('au-sas-ap','oromucosal_spray','permitted',null,null,'{}',null,'needs_review'),
('au-sas-ap','edibles','restricted',null,null,'{}','Gummy-style products under active TGA compliance scrutiny (2026-27 priority area)','needs_review'),
('au-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','verified'),
('au-registered','oral_oil','permitted',null,null,'{}','Epidyolex','verified'),
('au-cbd-s3','oral_oil','proposed',null,'<=150 mg/day CBD (Sch 3 entry)','{}','Pathway exists; no ARTG-registered S3 product yet, so no lawful OTC supply','verified'),
-- ============ POLAND ============
('pl-raw-material','dried_flower','permitted','>0.3% THC = narcotic raw material, prescription-only',null,'{"administration":"vaporization","products":"~40 authorized flower raw materials"}','~77-79% of dispensed market; 5,447 kg in 2025','verified'),
('pl-raw-material','extracts_concentrates','permitted',null,null,'{"products":"12 extract raw materials (Dec 2025)"}','Primarily inputs for magistral preparations','verified'),
('pl-raw-material','magistral_preparations','permitted',null,null,'{}','Pharmacies compound and dose; includes magistral vape cartridges and rosin at some pharmacies','verified'),
('pl-raw-material','vape_products','restricted',null,null,'{"only_as":"magistral preparations"}','No industrially prefilled cartridges as authorized products','verified'),
('pl-raw-material','oral_oil','permitted',null,null,'{"only_as":"compounded preparations"}',null,'verified'),
('pl-raw-material','bulk_api_raw','permitted',null,null,'{"supply":"100% import-reliant; URPL raw-material marketing authorisations (5yr)"}',null,'verified'),
('pl-raw-material','edibles','prohibited',null,null,'{}',null,'verified'),
('pl-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','verified'),
('pl-cbd-consumer','oral_oil','restricted','<=0.3% THC','Novel Food authorisation generally required for ingestible extracts','{"enforcement":"GIS + RASFF actions 2025"}','Ingestibles high enforcement risk; cosmetics route safer','verified'),
('pl-cbd-consumer','topicals','permitted','<=0.3% THC',null,'{}','Cosmetics the most practical consumer lane','needs_review'),
('pl-cbd-consumer','dried_flower','restricted','<=0.3% THC',null,'{}','CBD hemp flower sold as collectible/aromatherapy in grey zone','needs_review'),
-- ============ SOUTH AFRICA ============
('za-sahpra-s21','dried_flower','permitted',null,null,'{"schedule":"THC products Sch 6"}','Named-patient supply of unregistered flower','needs_review'),
('za-sahpra-s21','oral_oil','permitted',null,null,'{"schedule":"CBD Sch 4 above exemption levels"}',null,'verified'),
('za-sahpra-s21','capsules','permitted',null,null,'{}',null,'needs_review'),
('za-sahpra-s21','extracts_concentrates','restricted',null,null,'{}',null,'needs_review'),
('za-cbd-exemption','oral_oil','permitted','Processed-product alternative track: <=0.001% THC','<=600 mg CBD/pack and <=20 mg/day; or <=0.0075% CBD processed products','{"claims":"low-risk/general health only"}','OTC in pharmacies and wellness retail','verified'),
('za-cbd-exemption','topicals','permitted',null,null,'{}',null,'needs_review'),
('za-cbd-exemption','edibles','restricted',null,null,'{}','Mar 2025 blanket foodstuffs ban withdrawn after presidential intervention; foodstuff treatment contested pending replacement rules','verified'),
('za-private-use','seeds_plants','permitted',null,null,'{"scope":"private cultivation; commercial seed/clone sales unlawful"}',null,'verified'),
('za-private-use','dried_flower','permitted',null,null,'{"scope":"private possession/use only; no trade"}','CfPPA 2024 + Prince judgment; quantity regulations pending full commencement detail','verified'),
('za-sahpra-22c','bulk_api_raw','permitted','Hemp track <=2% THC under Plant Improvement Act (since 1 Dec 2025)',null,'{}','GMP cultivation/manufacture; ~120 export licences','verified'),
('za-sahpra-22c','dried_flower','permitted',null,null,'{"purpose":"export to regulated markets"}',null,'verified'),
('za-sahpra-22c','extracts_concentrates','permitted',null,null,'{}',null,'needs_review')
) as v(pslug, fslug, status, thc, cbd, cond, notes, ver)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702033517','seed_format_rules_priority_six','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702033517_seed_format_rules_priority_six.sql

-- RECOVERY BEGIN 20260702033621_seed_format_rules_global_batch2.sql
insert into public.pathway_format_rules
  (pathway_id, format_id, status, thc_limit, cbd_limit, conditions, notes, verification, last_verified_at)
select p.id, f.id, v.status::public.reg_rule_status, v.thc, v.cbd, v.cond::jsonb, v.notes, v.ver::public.reg_verification_status,
       case when v.ver='verified' then now() else null end
from (values
-- CANADA
('ca-adult-use','dried_flower','permitted',null,null,'{"possession":"30g public equivalent"}',null,'needs_review'),
('ca-adult-use','extracts_concentrates','permitted','1000 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','edibles','permitted','10 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','beverages','permitted','10 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','vape_products','permitted',null,null,'{"note":"some provinces restrict"}',null,'needs_review'),
('ca-adult-use','topicals','permitted','1000 mg THC per package',null,'{}',null,'needs_review'),
('ca-adult-use','capsules','permitted','10 mg THC per unit (ingested extract)',null,'{}',null,'needs_review'),
('ca-adult-use','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('ca-adult-use','seeds_plants','permitted',null,null,'{"home_grow":"4 plants/household; MB/QC restrict"}',null,'needs_review'),
('ca-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('ca-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('ca-medical','seeds_plants','permitted',null,null,'{"personal_designated_production":true}',null,'needs_review'),
('ca-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','needs_review'),
-- UNITED STATES
('us-state-programs','dried_flower','restricted',null,null,'{"varies_by_state":true}','Permitted in most program states; subnational matrix pending','needs_review'),
('us-state-programs','vape_products','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','edibles','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','beverages','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','extracts_concentrates','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-state-programs','topicals','restricted',null,null,'{"varies_by_state":true}',null,'needs_review'),
('us-hemp','dried_flower','permitted','<=0.3% delta-9 THC dry weight',null,'{}','Hemp flower; state restrictions vary','needs_review'),
('us-hemp','oral_oil','unregulated',null,null,'{}','FDA has not authorized CBD in foods/supplements; enforcement discretion','needs_review'),
('us-hemp','edibles','unregulated',null,null,'{"intoxicating_hemp":"contested state-by-state"}',null,'needs_review'),
('us-hemp','vape_products','unregulated',null,null,'{}',null,'needs_review'),
('us-fda-registered','oral_oil','permitted',null,null,'{}','Epidiolex (CBD oral solution)','needs_review'),
('us-fda-registered','capsules','permitted',null,null,'{}','Marinol/Syndros (dronabinol), Cesamet (nabilone)','needs_review'),
-- NETHERLANDS
('nl-omc','dried_flower','permitted',null,null,'{"varieties":"standardized Bedrocan range"}',null,'needs_review'),
('nl-omc','oral_oil','permitted',null,null,'{"prepared_by":"pharmacy (e.g. Transvaal)"}',null,'needs_review'),
('nl-omc','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('nl-omc','bulk_api_raw','permitted',null,null,'{"role":"major pharmaceutical flower exporter"}',null,'needs_review'),
('nl-experiment','dried_flower','permitted',null,null,'{"scope":"regulated-chain product only in 10 participating municipalities since Apr 2025"}',null,'verified'),
('nl-experiment','extracts_concentrates','permitted',null,null,'{"product":"hash within regulated chain"}',null,'needs_review'),
('nl-experiment','edibles','restricted',null,null,'{}','Traditional edibles tolerance narrow; not part of regulated-chain assortment','needs_review'),
-- SWITZERLAND
('ch-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('ch-medical','oromucosal_spray','permitted',null,null,'{}','Sativex registered','needs_review'),
('ch-pilot-trials','dried_flower','permitted',null,null,'{"scope":"enrolled participants"}',null,'verified'),
('ch-pilot-trials','extracts_concentrates','restricted',null,null,'{"scope":"pilot assortment varies"}',null,'needs_review'),
('ch-pilot-trials','edibles','restricted',null,null,'{"scope":"pilot assortment varies"}',null,'needs_review'),
('ch-low-thc','dried_flower','permitted','<1% THC',null,'{"smokables":"tobacco-substitute rules"}',null,'needs_review'),
('ch-low-thc','oral_oil','permitted','<1% THC',null,'{}',null,'needs_review'),
('ch-low-thc','topicals','permitted',null,null,'{}',null,'needs_review'),
-- THAILAND
('th-controlled-herb','dried_flower','permitted',null,null,'{"prescription":"PT33, max 30 days","supply":"licensed dispensaries with on-site practitioner (Jan 2026 rules)","import":"prohibited","public_smoking":"prohibited"}','Domestic supply only; ~7,300 of 18,400 shops closed under stricter licensing by Feb 2026','verified'),
('th-narcotic-extracts','extracts_concentrates','restricted','>0.2% THC = Category 5 narcotic',null,'{"licensees":"registered medical facilities, pharmacies, herbal shops"}','Ministerial Regulation B.E. 2569 effective 26 Apr 2026','verified'),
('th-narcotic-extracts','oral_oil','restricted','>0.2% THC formulations narcotics-licensed',null,'{}','Hospital/clinic formulations','verified'),
('th-cbd-consumer','oral_oil','permitted','<0.2% THC',null,'{}','Sold without prescription at licensed retailers','verified'),
('th-cbd-consumer','topicals','permitted','<0.2% THC',null,'{}',null,'verified'),
('th-cbd-consumer','edibles','restricted',null,null,'{}','Infused products face tightened scrutiny post-2025 reforms','needs_review'),
-- FRANCE
('fr-permanent','oral_oil','permitted',null,null,'{}','Extract/oil-based launch','verified'),
('fr-permanent','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('fr-permanent','capsules','permitted',null,null,'{}',null,'needs_review'),
('fr-permanent','dried_flower','prohibited',null,null,'{}','Framework launching without flower (experiment-era vaporized flower not carried over)','verified'),
('fr-registered','oral_oil','permitted',null,null,'{}','Epidyolex','needs_review'),
-- SPAIN
('es-rd903','magistral_preparations','permitted',null,null,'{"dispensing":"hospital pharmacies only"}',null,'verified'),
('es-rd903','extracts_concentrates','permitted',null,null,'{"form":"standardized extracts as compounding base"}',null,'verified'),
('es-rd903','oral_oil','permitted',null,null,'{}','Formulated magistral preparations','needs_review'),
('es-rd903','dried_flower','prohibited',null,null,'{}','No flower dispensing under RD 903/2025','verified'),
('es-registered','oromucosal_spray','permitted',null,null,'{}','Sativex','needs_review'),
('es-registered','oral_oil','permitted',null,null,'{}','Epidyolex','needs_review'),
('es-social-clubs','dried_flower','unregulated',null,null,'{}','Club model without national statute','verified'),
('es-social-clubs','extracts_concentrates','unregulated',null,null,'{}',null,'needs_review'),
-- CZECHIA
('cz-medical','dried_flower','permitted',null,null,'{"reimbursement":"90% up to monthly cap"}',null,'needs_review'),
('cz-medical','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('cz-medical','oral_oil','permitted',null,null,'{}','Compounded preparations','needs_review'),
('cz-adult-use','seeds_plants','permitted',null,null,'{"limit":"3 plants per adult 21+"}',null,'verified'),
('cz-adult-use','dried_flower','permitted',null,null,'{"possession":"100g home / 25g public"}','No commercial retail; sales deferred','verified'),
('cz-adult-use','extracts_concentrates','prohibited',null,null,'{}','Home concentrate production outside personal framework','needs_review'),
-- ISRAEL
('il-imca','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('il-imca','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('il-imca','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('il-imca','vape_products','restricted',null,null,'{}',null,'needs_review'),
-- PORTUGAL
('pt-infarmed','dried_flower','permitted',null,null,'{}','Authorized flower preparations (e.g. Tilray)','needs_review'),
('pt-infarmed','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('pt-infarmed','bulk_api_raw','permitted',null,null,'{"role":"major EU-GMP cultivation/export hub supplying DE and FR"}',null,'needs_review'),
-- ITALY
('it-magistral','dried_flower','permitted',null,null,'{"dispensing":"magistral"}','FM-2 state production + imports','needs_review'),
('it-magistral','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
('it-magistral','oral_oil','permitted',null,null,'{"form":"galenic preparations"}',null,'needs_review'),
('it-magistral','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('it-cannabis-light','dried_flower','suspended','<=0.5% THC historically',null,'{}','Apr 2025 security decree criminalises hemp-inflorescence trade; litigation ongoing','needs_review'),
-- DENMARK
('dk-scheme','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('dk-scheme','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('dk-scheme','capsules','permitted',null,null,'{}',null,'needs_review'),
('dk-scheme','bulk_api_raw','permitted',null,null,'{"role":"significant EU-GMP producer/exporter"}',null,'needs_review'),
-- NEW ZEALAND
('nz-scheme','dried_flower','permitted',null,null,'{"standard":"verified against minimum quality standard"}',null,'needs_review'),
('nz-scheme','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('nz-scheme','capsules','permitted',null,null,'{}',null,'needs_review'),
-- IRELAND
('ie-mcap','oral_oil','permitted',null,null,'{"products":"MCAP named list"}',null,'needs_review'),
('ie-mcap','dried_flower','restricted',null,null,'{"route":"ministerial licence only"}',null,'needs_review'),
-- ARGENTINA
('ar-reprocann','seeds_plants','permitted',null,null,'{"registry":"REPROCANN self/network cultivation"}',null,'needs_review'),
('ar-reprocann','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('ar-reprocann','oral_oil','permitted',null,null,'{}','Pharmacy magistral and registered products','needs_review'),
('ar-reprocann','magistral_preparations','permitted',null,null,'{}',null,'needs_review'),
-- COLOMBIA
('co-framework','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
('co-framework','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('co-framework','oral_oil','permitted',null,null,'{"domestic":"magistral dispensing"}',null,'needs_review'),
('co-framework','dried_flower','permitted',null,null,'{"export":"permitted since Decree 811/2021"}',null,'needs_review'),
-- URUGUAY
('uy-adult-use','dried_flower','permitted',null,null,'{"retail":"pharmacies, registered residents"}',null,'needs_review'),
('uy-adult-use','seeds_plants','permitted',null,null,'{"home_grow":"6 plants; clubs 45 members"}',null,'needs_review'),
('uy-adult-use','edibles','prohibited',null,null,'{}',null,'needs_review'),
('uy-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
-- MEXICO
('mx-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('mx-medical','capsules','permitted',null,null,'{}',null,'needs_review'),
('mx-medical','topicals','permitted',null,null,'{}',null,'needs_review'),
('mx-medical','dried_flower','prohibited',null,null,'{}','Pharmaceutical-derivative regime; herbal dispensing not established','needs_review'),
-- JAPAN
('jp-pharma','oral_oil','proposed',null,null,'{}','Approval pathway open post-Dec 2024; Epidiolex-type products in registration track','needs_review'),
('jp-cbd','oral_oil','permitted','Residual THC ppm caps by product class',null,'{}',null,'needs_review'),
('jp-cbd','edibles','restricted','Residual THC ppm caps',null,'{}',null,'needs_review'),
-- UKRAINE
('ua-medical','oral_oil','permitted',null,null,'{}','Registered-medicine emphasis in initial rollout','needs_review'),
('ua-medical','dried_flower','unknown',null,null,'{}','Format scope of implementing acts to be confirmed','needs_review'),
-- MALTA
('mt-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('mt-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('mt-chra','seeds_plants','permitted',null,null,'{"home_grow":"4 plants"}',null,'needs_review'),
('mt-chra','dried_flower','permitted',null,null,'{"possession":"7g","supply":"CHRAs to members"}',null,'needs_review'),
-- LUXEMBOURG
('lu-medical','dried_flower','permitted',null,null,'{}',null,'needs_review'),
('lu-medical','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('lu-home-grow','seeds_plants','permitted',null,null,'{"home_grow":"4 plants per household"}',null,'needs_review'),
-- GREECE
('gr-medical','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
('gr-medical','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('gr-medical','dried_flower','permitted',null,null,'{"orientation":"export-focused"}',null,'needs_review'),
('gr-medical','oral_oil','permitted',null,null,'{}',null,'needs_review'),
-- NORTH MACEDONIA
('mk-framework','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('mk-framework','oral_oil','permitted',null,null,'{}',null,'needs_review'),
('mk-framework','dried_flower','permitted',null,null,'{"scope":"export (2023 amendments)"}',null,'needs_review'),
('mk-framework','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
-- MOROCCO
('ma-anrac','bulk_api_raw','permitted',null,null,'{}',null,'needs_review'),
('ma-anrac','extracts_concentrates','permitted',null,null,'{}',null,'needs_review'),
('ma-anrac','topicals','permitted',null,null,'{"sector":"cosmetics"}',null,'needs_review'),
('ma-anrac','dried_flower','restricted',null,null,'{}',null,'needs_review')
) as v(pslug, fslug, status, thc, cbd, cond, notes, ver)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702033621','seed_format_rules_global_batch2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702033621_seed_format_rules_global_batch2.sql

-- RECOVERY BEGIN 20260702033716_seed_pathway_stubs_long_tail.sql
-- Long-tail jurisdictions with known frameworks: pathway stubs flagged needs_review,
-- feeding v_regulatory_format_stale for the research/verification loop.
insert into public.regulatory_pathways
  (country_id, iso_alpha2, slug, name, pathway_type, legal_basis, regulator, status, summary, verification)
select c.id, v.iso2, v.slug, v.name, v.ptype::public.reg_pathway_type, v.legal, v.reg, v.status, v.summary, 'needs_review'
from (values
('AT','at-magistral','Dronabinol magistral + registered medicines','magistral_compounding','AMG; SMG','BASG','active','Dronabinol compounding widespread; Sativex and Epidyolex registered; herbal flower not dispensed.'),
('BE','be-registered','Registered medicine only (Sativex)','registered_medicine','Royal Decree 2015','FAMHP','active','Sativex the sole medical route; magistral cannabis not permitted.'),
('NO','no-special','Registered medicines + named-patient approvals','special_access_import','Approval exemption scheme','NoMA/DMP','active','Sativex registered; other products case-by-case exemption.'),
('SE','se-license','Registered medicines + licence prescriptions','special_access_import','Licence prescription scheme','Lakemedelsverket','active','Epidyolex/Sativex plus case-by-case licences (incl. Bediol flower historically).'),
('FI','fi-special','Special permit scheme','special_access_import','Fimea special permits','Fimea','active','Case-by-case special permits (Bedrocan flower, Sativex).'),
('HR','hr-medical','Medical cannabis preparations','medical_access_program','2015 ordinance amendments','HALMED','active','THC-containing preparations prescribable; expanding product list.'),
('SI','si-cannabinoids','Cannabinoid medicines pathway','medical_access_program','2017 reclassification','JAZMP','active','Cannabinoid-based medicines prescribable; 2024 referendum supported medical-use expansion.'),
('CY','cy-medical','Medical cannabis law','medical_access_program','2019 law','Ministry of Health','active','Cultivation licensing plus patient access framework.'),
('EE','ee-registered','Registered medicine access','registered_medicine','Case approvals','Ravimiamet','active','Sativex-type access; very limited.'),
('LV','lv-registered','Registered medicine access','registered_medicine',null,'ZVA','active','Extremely limited licensed-medicine-only access.'),
('LT','lt-registered','Registered cannabinoid medicines','registered_medicine','2019 amendment','VVKT','active','Cannabinoid medicines allowed since 2019 law change.'),
('KR','kr-import','Rare-disease import of approved cannabis medicines','special_access_import','2018 Narcotics Act amendment','MFDS/KODC','active','Epidiolex/Sativex-type imports via Korea Orphan Drug Center on physician application.'),
('TR','tr-registered','Registered sublingual/oromucosal products + state hemp','registered_medicine','2016 regulation','TITCK/TMO','active','Sativex-type products only; state-controlled cultivation for pharma.'),
('PE','pe-medical','Medical cannabis law','medical_access_program','Law 30681 (2017); DS 005-2019','DIGEMID','active','Registered products and magistral preparations via licensed pharmacies; patient registry.'),
('CL','cl-medical','Medical access via registered products and magistral','medical_access_program','Law 20.000 framework; Decree 84/2015','ISP','active','Pharmacy products (e.g. Sativex-type) and magistral preparations on prescription.'),
('EC','ec-hemp-medical','Medicinal/hemp framework (<=1% THC)','low_thc_consumer','2019 penal reform; 2020 regs','ARCSA/MAG','active','Non-psychoactive cannabis (<=1% THC) for medicinal/industrial use.'),
('PA','pa-medical','Medicinal cannabis law','medical_access_program','Law 242 (2021)','MINSA','active','Medicinal use framework; licensing rollout gradual.'),
('PY','py-medical','Medicinal cannabis + hemp export','medical_access_program','Law 6007/2017','DINAVISA','active','Domestic program plus industrial hemp exports.'),
('CR','cr-medical','Medicinal cannabis and hemp law','medical_access_program','Law 10113 (2022)','Ministry of Health','active','Medicinal use and hemp production legalized; implementing regs phased.'),
('BB','bb-medical','Medicinal cannabis industry','medical_access_program','Medicinal Cannabis Industry Act 2019','BMCLA','active','Licensed cultivation and patient access (flower, oils).'),
('JM','jm-framework','Medical/therapeutic licensing + decrim','medical_access_program','Dangerous Drugs Amendment Act 2015','CLA','active','Licensed cultivation, herb houses, therapeutic dispensing; possession <=2oz decriminalized; sacramental use protected.'),
('TT','tt-decrim-medical','Decriminalization + medical framework','adult_use_noncommercial','Dangerous Drugs Amendment 2019; Cannabis Control Act 2019','TTCLA','active','30g possession decriminalized, 4 plants; commercial licensing under Cannabis Control Act rolling out.'),
('GE','ge-personal','Personal consumption legal, no market','adult_use_noncommercial','Constitutional Court 2018','n/a','active','Use/possession decriminalized-to-legal for personal amounts; cultivation and sales prohibited.'),
('LS','ls-export','Licensed cultivation for export','export_oriented','Drugs of Abuse Act licensing (2017)','Ministry of Health','active','First African medical-cannabis licensing regime; EU-GMP export operators.'),
('ZW','zw-export','Licensed medicinal/industrial production','export_oriented','SI 62/2018','MCAZ','active','Export-focused cultivation licensing; industrial hemp expansion.'),
('UG','ug-export','Licensed cultivation for export','export_oriented','Narcotics Act 2023 framework','NDA','active','Export licences to regulated markets (DE, IL).'),
('RW','rw-export','High-value therapeutic crop export program','export_oriented','2021 ministerial order','Rwanda FDA/NAEB','active','Export-only cultivation regime.'),
('MW','mw-export','Cannabis Regulation Act (medicinal/industrial)','export_oriented','Cannabis Regulation Act 2020','Cannabis Regulatory Authority','active','Licensed medicinal and industrial cultivation, export-oriented.'),
('GH','gh-hemp','Industrial/medicinal hemp (<=0.3% THC)','low_thc_consumer','Narcotics Control Commission Act 2020 s43','NACOC','active','Licences for cultivation of <=0.3% THC cannabis for industrial/medicinal purposes.'),
('IN','in-limited','State bhang exemptions + research/AYUSH products','low_thc_consumer','NDPS Act 1985 (leaf exemption); state excise','State authorities','active','Bhang (leaf) regulated by states; cannabis-leaf AYUSH products; flower/resin prohibited.'),
('LB','lb-medical','Medicinal/industrial cultivation law (unimplemented)','export_oriented','Law 178/2020','Regulatory authority pending','announced','2020 law legalized medicinal/industrial cultivation; regulatory authority never stood up - not operational.'),
('SK','sk-cbd','CBD descheduled','low_thc_consumer','2021 amendment removing CBD from psychotropics','SIDC','active','CBD products lawful; no medical cannabis program.'),
('NG','ng-status','No lawful cannabis pathway','research_only','NDLEA Act','NDLEA','active','Prohibited; periodic hemp policy debate only.'),
('ID','id-status','No lawful cannabis pathway','research_only','Law 35/2009','BNN','active','Strict prohibition; 2022 court ruling ordered medical-use research review.'),
('SG','sg-status','No lawful cannabis pathway (pharma exception theoretical)','research_only','Misuse of Drugs Act','CNB/HSA','active','Strict prohibition; cannabinoid pharmaceuticals only via exceptional HSA channels.')
) as v(iso2, slug, name, ptype, legal, reg, status, summary)
join public.countries c on c.iso_alpha2 = v.iso2;

-- Minimal rules for stubs where format detail is well established
insert into public.pathway_format_rules (pathway_id, format_id, status, notes, verification)
select p.id, f.id, v.status::public.reg_rule_status, v.notes, 'needs_review'
from (values
('at-magistral','isolates','permitted','Dronabinol compounding'),
('at-magistral','oral_oil','permitted','Dronabinol drops; Epidyolex'),
('at-magistral','dried_flower','prohibited','Flower not dispensed'),
('be-registered','oromucosal_spray','permitted','Sativex'),
('kr-import','oral_oil','permitted','Epidiolex-type imports'),
('kr-import','oromucosal_spray','permitted','Sativex-type imports'),
('jm-framework','dried_flower','permitted','Licensed herb houses / therapeutic dispensing'),
('jm-framework','extracts_concentrates','permitted',null),
('jm-framework','oral_oil','permitted',null),
('pe-medical','oral_oil','permitted','Registered + magistral'),
('pe-medical','magistral_preparations','permitted',null),
('cl-medical','oral_oil','permitted',null),
('cl-medical','magistral_preparations','permitted',null),
('bb-medical','dried_flower','permitted',null),
('bb-medical','oral_oil','permitted',null),
('tt-decrim-medical','seeds_plants','permitted','4 plants per adult'),
('tt-decrim-medical','dried_flower','permitted','30g decriminalized possession'),
('ls-export','bulk_api_raw','permitted','EU-GMP export flower/extract'),
('ls-export','dried_flower','permitted','Export'),
('zw-export','bulk_api_raw','permitted',null),
('ug-export','bulk_api_raw','permitted',null),
('rw-export','bulk_api_raw','permitted',null),
('mw-export','bulk_api_raw','permitted',null),
('in-limited','edibles','restricted','Bhang preparations under state excise rules'),
('sk-cbd','oral_oil','permitted','CBD products')
) as v(pslug, fslug, status, notes)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702033716','seed_pathway_stubs_long_tail','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702033716_seed_pathway_stubs_long_tail.sql

-- RECOVERY BEGIN 20260702111005_remove_marketplace_preview_demo_data.sql
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
-- version 20260702111005.
--
-- Rewriting this file cannot affect production: 20260702111005 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Removes all "Marketplace Preview" demo/placeholder data from the live marketplace.
-- Verified before this migration: zero disclosure_requests, marketplace_inquiries,
-- marketplace_candidates, or listings.superseded_by references touch any of this
-- data. marketplace_item_images cascades automatically via its own FK.
-- Order: matches (child) -> listings/buyer_requests (parents).

delete from public.matches
where buyer_request_id in (select id from public.buyer_requests where title ilike '%marketplace preview%')
   or listing_id in (select id from public.listings where title ilike '%marketplace preview%');

delete from public.listings
where title ilike '%marketplace preview%';

delete from public.buyer_requests
where title ilike '%marketplace preview%';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702111005','remove_marketplace_preview_demo_data','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702111005_remove_marketplace_preview_demo_data.sql

-- RECOVERY BEGIN 20260702122710_remove_marketplace_preview_demo_data_v2.sql
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
-- version 20260702122710.
--
-- Rewriting this file cannot affect production: 20260702122710 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Temporarily lifts the *_no_delete guardrails to perform an explicit,
-- user-confirmed one-time removal of "Marketplace Preview" demo/placeholder
-- data, then restores the guardrails immediately after, in the same
-- transaction. Confirmed explicitly by the platform owner after the
-- guardrails were discovered and surfaced (see EVIDENCE_LOG.md).
--
-- Pre-verified (read-only, prior to this migration): zero disclosure_requests,
-- marketplace_inquiries, marketplace_candidates, or listings.superseded_by
-- rows reference any of this data. No other demo/test/seed naming patterns
-- found elsewhere in listings/buyer_requests/supplier_profiles.

drop rule if exists matches_no_delete on public.matches;
drop rule if exists listings_no_delete on public.listings;
drop rule if exists buyer_requests_no_delete on public.buyer_requests;

delete from public.matches
where buyer_request_id in (select id from public.buyer_requests where title ilike '%marketplace preview%')
   or listing_id in (select id from public.listings where title ilike '%marketplace preview%');

delete from public.listings
where title ilike '%marketplace preview%';

delete from public.buyer_requests
where title ilike '%marketplace preview%';

-- Restore the guardrails exactly as they were before this migration.
create rule matches_no_delete as on delete to public.matches do instead nothing;
create rule listings_no_delete as on delete to public.listings do instead nothing;
create rule buyer_requests_no_delete as on delete to public.buyer_requests do instead nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702122710','remove_marketplace_preview_demo_data_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702122710_remove_marketplace_preview_demo_data_v2.sql

-- RECOVERY BEGIN 20260702153215_regulatory_enrichment_schema.sql
-- ============================================================================
-- Enrichment layer for the regulatory product-format matrix.
-- Adds structured detail (was crammed into notes/conditions jsonb), a first-class
-- citation table, scheduled-change tracking, and a compliance guardrail.
-- ============================================================================

-- ---- Structured pathway-level detail ----
alter table public.regulatory_pathways
  add column if not exists qualifying_conditions text[] not null default '{}',
  add column if not exists prescriber_scope text,          -- e.g. 'any registered doctor', 'specialist-initiated', 'hospital only'
  add column if not exists min_age int,                    -- minimum patient/consumer age where defined
  add column if not exists reimbursement text;             -- none | partial | full | conditional | n/a

-- ---- Structured rule-level (format-specific) detail ----
alter table public.pathway_format_rules
  add column if not exists possession_limit text,          -- e.g. '30g dried equivalent'
  add column if not exists unit_dose_limit text,           -- e.g. '10 mg THC per unit'
  add column if not exists packaging_labelling text;       -- child-resistant, plain-pack, COA, warnings

-- ---- Citation source taxonomy ----
create type public.reg_source_type as enum (
  'gazette',     -- official gazette / official journal publication (primary)
  'regulator',   -- regulator site, guidance, product list (primary)
  'statute',     -- act / law / regulation text (primary)
  'court',       -- court judgment (primary)
  'secondary',   -- law-firm analysis, industry body, trade press (supporting)
  'news'         -- general news (weakest)
);

-- Primary sources are the only ones that can substantiate a 'verified' flip.
create table public.regulatory_citations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('pathway','rule')),
  entity_id uuid not null,
  instrument text not null,           -- e.g. 'RDC 1.015/2026', 'MedCanG', 'TGO 93'
  article text,                       -- e.g. 'Art. 12', 'Sch 2', 's22C(1)(b)'
  source_type public.reg_source_type not null,
  citation_url text,
  published_date date,
  accessed_date date not null default current_date,
  excerpt text,                       -- short (<15 word) copyright-safe excerpt only
  created_at timestamptz not null default now()
);
create index regulatory_citations_entity_idx on public.regulatory_citations (entity_type, entity_id);
create index regulatory_citations_source_idx on public.regulatory_citations (source_type);

-- ---- Scheduled / pending regulatory changes (effective-dating for shifts) ----
create type public.reg_change_confidence as enum (
  'speculative',          -- rumoured / advocacy only
  'announced',            -- official intent stated, no text
  'draft',                -- draft text published / in consultation
  'enacted_pending_force' -- law passed, awaiting commencement date
);

create table public.regulatory_pending_changes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('pathway','rule')),
  entity_id uuid not null,
  change_type text not null,          -- status | thc_limit | new_format | repeal | prescriber | reimbursement
  current_value text,
  expected_value text,
  expected_effective_date date,       -- null when only a fuzzy timeframe is known
  expected_note text,                 -- fuzzy timeframe, e.g. 'H1 2026', 'by mid-2027'
  confidence public.reg_change_confidence not null default 'announced',
  status text not null default 'pending',  -- pending | resolved | withdrawn
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index regulatory_pending_changes_entity_idx on public.regulatory_pending_changes (entity_type, entity_id);
create index regulatory_pending_changes_status_idx on public.regulatory_pending_changes (status);

create trigger trg_reg_pending_touch before update on public.regulatory_pending_changes
  for each row execute function public.reg_touch_updated_at();
create trigger trg_reg_citations_no_op before update on public.regulatory_citations
  for each row execute function public.reg_touch_updated_at();

-- ============================================================================
-- COMPLIANCE GUARDRAIL
-- A pathway or rule may only transition INTO 'verified' when at least one
-- primary-source citation (gazette | regulator | statute | court) exists for it.
-- Existing verified rows are grandfathered; only new assertions of verification
-- are gated. Wrong regulatory data is worse than missing data.
-- ============================================================================
create or replace function public.reg_require_primary_source()
returns trigger language plpgsql as $$
declare
  v_entity text := tg_argv[0];
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = v_entity
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark % %/% as verified: a primary-source citation (gazette, regulator, statute or court) is required first.',
        v_entity, new.iso_alpha2, new.slug
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trg_reg_pathways_require_source
  before insert or update on public.regulatory_pathways
  for each row execute function public.reg_require_primary_source('pathway');

-- Rules don't carry iso/slug columns; give the guard a rule-shaped variant.
create or replace function public.reg_require_primary_source_rule()
returns trigger language plpgsql as $$
declare
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = 'rule'
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark rule % as verified: a primary-source citation is required first.', new.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trg_reg_rules_require_source
  before insert or update on public.pathway_format_rules
  for each row execute function public.reg_require_primary_source_rule();

-- ---- RLS + grants for new tables (match platform convention) ----
alter table public.regulatory_citations enable row level security;
alter table public.regulatory_pending_changes enable row level security;

create policy regulatory_citations_public_read on public.regulatory_citations
  for select to anon, authenticated using (true);
create policy regulatory_citations_service_write on public.regulatory_citations
  for all to service_role using (true) with check (true);
create policy regulatory_pending_public_read on public.regulatory_pending_changes
  for select to anon, authenticated using (true);
create policy regulatory_pending_service_write on public.regulatory_pending_changes
  for all to service_role using (true) with check (true);

grant select on public.regulatory_citations, public.regulatory_pending_changes to anon, authenticated;

-- ============================================================================
-- Refreshed stale/enrichment view: now also flags verified-but-uncited rows and
-- pending changes that have come due. Carries a machine-readable `reason`.
-- ============================================================================
drop view if exists public.v_regulatory_format_stale;
create view public.v_regulatory_format_stale
with (security_invoker = on) as
-- pathways: unverified, aged, or verified without a primary citation
select 'pathway'::text as record_type, p.id, p.iso_alpha2, p.slug as record_slug,
       p.verification, p.last_verified_at,
       case
         when p.verification <> 'verified' then 'unverified'
         when p.last_verified_at is null or p.last_verified_at < now() - interval '90 days' then 'stale'
         when not exists (select 1 from public.regulatory_citations c
                          where c.entity_type='pathway' and c.entity_id=p.id
                            and c.source_type in ('gazette','regulator','statute','court'))
              then 'verified_uncited'
       end as reason
from public.regulatory_pathways p
where p.verification <> 'verified'
   or p.last_verified_at is null
   or p.last_verified_at < now() - interval '90 days'
   or not exists (select 1 from public.regulatory_citations c
                  where c.entity_type='pathway' and c.entity_id=p.id
                    and c.source_type in ('gazette','regulator','statute','court'))
union all
-- rules: same tests
select 'rule'::text, r.id, p.iso_alpha2, p.slug || ':' || f.slug,
       r.verification, r.last_verified_at,
       case
         when r.verification <> 'verified' then 'unverified'
         when r.last_verified_at is null or r.last_verified_at < now() - interval '90 days' then 'stale'
         when not exists (select 1 from public.regulatory_citations c
                          where c.entity_type='rule' and c.entity_id=r.id
                            and c.source_type in ('gazette','regulator','statute','court'))
              then 'verified_uncited'
       end as reason
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id = r.pathway_id
join public.product_formats f on f.id = r.format_id
where r.verification <> 'verified'
   or r.last_verified_at is null
   or r.last_verified_at < now() - interval '90 days'
   or not exists (select 1 from public.regulatory_citations c
                  where c.entity_type='rule' and c.entity_id=r.id
                    and c.source_type in ('gazette','regulator','statute','court'))
union all
-- pending changes due for resolution
select 'pending_change'::text, pc.id, p.iso_alpha2, p.slug,
       'needs_review'::public.reg_verification_status, pc.updated_at,
       'pending_change_due'::text
from public.regulatory_pending_changes pc
join public.regulatory_pathways p on p.id = pc.entity_id and pc.entity_type='pathway'
where pc.status='pending'
  and pc.expected_effective_date is not null
  and pc.expected_effective_date <= current_date;

grant select on public.v_regulatory_format_stale to anon, authenticated;

-- Sourcing-completeness signal for the coverage picture
create or replace view public.v_regulatory_citation_coverage
with (security_invoker = on) as
select
  c.iso_alpha2,
  c.country_name,
  count(distinct p.id) as pathways,
  count(distinct cit_p.id) filter (where cit_p.source_type in ('gazette','regulator','statute','court')) as pathway_primary_citations,
  count(distinct r.id) as rules,
  count(distinct cit_r.id) filter (where cit_r.source_type in ('gazette','regulator','statute','court')) as rule_primary_citations
from public.countries c
left join public.regulatory_pathways p on p.country_id = c.id
left join public.regulatory_citations cit_p on cit_p.entity_type='pathway' and cit_p.entity_id=p.id
left join public.pathway_format_rules r on r.pathway_id = p.id
left join public.regulatory_citations cit_r on cit_r.entity_type='rule' and cit_r.entity_id=r.id
group by c.iso_alpha2, c.country_name;

grant select on public.v_regulatory_citation_coverage to anon, authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702153215','regulatory_enrichment_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702153215_regulatory_enrichment_schema.sql

-- RECOVERY BEGIN 20260702184356_secure_and_expose_corridor_tables.sql
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
-- version 20260702184356.
--
-- Rewriting this file cannot affect production: 20260702184356 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

ALTER TABLE public.corridor_processing_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_regulatory_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS corridor_processing_times_public_read ON public.corridor_processing_times;
CREATE POLICY corridor_processing_times_public_read ON public.corridor_processing_times
  FOR SELECT USING (true);

DROP POLICY IF EXISTS corridor_regulatory_alerts_public_read ON public.corridor_regulatory_alerts;
CREATE POLICY corridor_regulatory_alerts_public_read ON public.corridor_regulatory_alerts
  FOR SELECT USING (true);

REVOKE TRUNCATE ON public.corridor_processing_times FROM anon, authenticated;
REVOKE TRUNCATE ON public.corridor_regulatory_alerts FROM anon, authenticated;

CREATE VIEW api.corridor_processing_times AS SELECT * FROM public.corridor_processing_times;
ALTER VIEW api.corridor_processing_times SET (security_invoker = true);
GRANT SELECT ON api.corridor_processing_times TO anon, authenticated;

CREATE VIEW api.corridor_regulatory_alerts AS SELECT * FROM public.corridor_regulatory_alerts;
ALTER VIEW api.corridor_regulatory_alerts SET (security_invoker = true);
GRANT SELECT ON api.corridor_regulatory_alerts TO anon, authenticated;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702184356','secure_and_expose_corridor_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702184356_secure_and_expose_corridor_tables.sql

-- RECOVERY BEGIN 20260702190045_fix_overbroad_public_rls_policies.sql
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
-- version 20260702190045.
--
-- Rewriting this file cannot affect production: 20260702190045 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- SECURITY FIX: hv_entity_mentions and hv_regulatory_trajectory had
-- service_role_full_access policies scoped to {public} (all roles), not
-- {service_role}. This granted anon and authenticated users full INSERT,
-- UPDATE, DELETE, and TRUNCATE access.

DROP POLICY IF EXISTS "service_role_full_access" ON public.hv_entity_mentions;
CREATE POLICY "service_role_all_hv_entity_mentions"
  ON public.hv_entity_mentions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access" ON public.hv_regulatory_trajectory;
CREATE POLICY "service_role_all_hv_regulatory_trajectory"
  ON public.hv_regulatory_trajectory
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702190045','fix_overbroad_public_rls_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702190045_fix_overbroad_public_rls_policies.sql

-- RECOVERY BEGIN 20260702190056_add_explicit_rls_to_no_policy_tables.sql
-- Applied directly to DB. Stub for CLI reconciliation.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702190056','add_explicit_rls_to_no_policy_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702190056_add_explicit_rls_to_no_policy_tables.sql

-- RECOVERY BEGIN 20260702190113_pin_search_path_reg_functions.sql
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
-- version 20260702190113.
--
-- Rewriting this file cannot affect production: 20260702190113 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

CREATE OR REPLACE FUNCTION public.reg_log_pathway_change()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('regulatory_pathways', new.id::text, 'status', old.status, new.status, 'reg_format_matrix_trigger');
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_log_rule_change()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'status', old.status::text, new.status::text, 'reg_format_matrix_trigger');
  end if;
  if new.thc_limit is distinct from old.thc_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'thc_limit', old.thc_limit, new.thc_limit, 'reg_format_matrix_trigger');
  end if;
  if new.cbd_limit is distinct from old.cbd_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'cbd_limit', old.cbd_limit, new.cbd_limit, 'reg_format_matrix_trigger');
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_require_primary_source()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
declare
  v_entity text := tg_argv[0];
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = v_entity
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark % %/% as verified: a primary-source citation (gazette, regulator, statute or court) is required first.',
        v_entity, new.iso_alpha2, new.slug
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_require_primary_source_rule()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
declare
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = 'rule'
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark rule % as verified: a primary-source citation is required first.', new.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_touch_updated_at()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702190113','pin_search_path_reg_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702190113_pin_search_path_reg_functions.sql

-- RECOVERY BEGIN 20260702203328_reprioritize_never_attempted_sources.sql
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
-- version 20260702203328.
--
-- Rewriting this file cannot affect production: 20260702203328 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Restores NULLS-FIRST top-priority queue position for sources that have
-- literally never been attempted (zero source_snapshots rows, online status,
-- zero consecutive_failures) but were incorrectly holding a stale non-null
-- next_crawl_at from a May 16 bulk-import batch. Under the hardcoded
-- cadence_hours=24 bug (see task-queue.ts fix, same date), these 144 rows
-- were perpetually outcompeted by the 1000+ already-successful sources that
-- kept cycling back to "due" every 24h regardless of their real cadence.
-- Scope deliberately excludes sources with real recorded failures (403/404/
-- parse errors etc.) — those reflect genuine problems, not queue starvation,
-- and should not be silently re-prioritized without separate investigation.

update public.source_registry sr
set next_crawl_at = null
where sr.adapter in ('html_snapshot', 'rss')
  and sr.network_status = 'online'
  and sr.consecutive_failures = 0
  and not exists (
    select 1 from public.source_snapshots ss where ss.source_id = sr.id
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702203328','reprioritize_never_attempted_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702203328_reprioritize_never_attempted_sources.sql

-- RECOVERY BEGIN 20260702213616_regulatory_enrichment_priority_markets.sql
-- ============================================================================
-- Enriched content for verified priority markets: structured pathway detail,
-- format-level quantity/packaging detail, primary-source citations, and
-- scheduled-change records. Enrichment does not alter verification status.
-- ============================================================================

-- ---- Pathway-level structured detail ----
update public.regulatory_pathways set
  qualifying_conditions = v.conds, prescriber_scope = v.presc, min_age = v.age, reimbursement = v.reimb
from (values
  ('br-rdc-1015', array[]::text[], 'any legally qualified prescriber; high-THC historically palliative/terminal', null::int, 'none'),
  ('br-rdc-660', array[]::text[], 'any legally qualified prescriber (import authorisation)', null, 'none'),
  ('gb-cbpm-specials', array['chronic pain','treatment-resistant epilepsy','MS spasticity','chemotherapy-induced nausea'], 'specialist on the GMC Specialist Register may initiate', null, 'conditional'),
  ('de-medcang', array[]::text[], 'any physician (narcotic-free e-prescription)', null, 'full'),
  ('de-cang-pillar1', array[]::text[], 'n/a (non-medical)', 18, 'n/a'),
  ('au-sas-ap', array[]::text[], 'any registered doctor or NP via SAS-B or Authorised Prescriber', null, 'none'),
  ('pl-raw-material', array['chronic pain','MS','drug-resistant epilepsy','chemotherapy nausea'], 'any licensed physician; narcotic (pink) prescription', null, 'none'),
  ('za-sahpra-s21', array['cancer','epilepsy','multiple sclerosis','palliative care'], 'doctor applies per patient via SAHPRA Section 21', null, 'none'),
  ('za-cbd-exemption', array[]::text[], 'OTC below exemption thresholds', null, 'n/a'),
  ('za-private-use', array[]::text[], 'n/a (private adult use)', 18, 'n/a'),
  ('th-controlled-herb', array['insomnia','chronic pain','migraine','Parkinson disease','appetite loss'], 'licensed Thai practitioner issues PT33 (max 30 days)', 20, 'none'),
  ('fr-permanent', array['neuropathic pain','treatment-resistant epilepsy','MS spasticity','oncology supportive care','palliative care'], 'hospital/specialist-initiated', null, 'full'),
  ('es-rd903', array['MS spasticity','chemotherapy-induced nausea','treatment-resistant epilepsy','oncologic/chronic pain','palliative care'], 'hospital specialist prescribing', null, 'full'),
  ('cz-adult-use', array[]::text[], 'n/a (non-medical)', 21, 'n/a'),
  ('cz-medical', array['chronic pain','MS','oncology','neurological indications'], 'specialist prescriber; e-prescription', null, 'partial')
) as v(slug, conds, presc, age, reimb)
where regulatory_pathways.slug = v.slug;

-- ---- Rule-level (format-specific) quantity / packaging detail ----
update public.pathway_format_rules as r set
  possession_limit = v.poss, unit_dose_limit = v.udl, packaging_labelling = v.pkg
from (values
  ('de-cang-pillar1','dried_flower','25g in public / 50g at home', null, null),
  ('de-cang-pillar1','seeds_plants','3 live plants per adult', null, null),
  ('cz-adult-use','dried_flower','25g in public / 100g at home', null, null),
  ('cz-adult-use','seeds_plants','3 live plants per adult', null, null),
  ('za-private-use','dried_flower','private personal amounts per CfPPA schedules', null, null),
  ('za-private-use','seeds_plants','private cultivation per CfPPA schedules', null, null),
  ('th-controlled-herb','dried_flower','30g supply with valid PT33', null, 'neutral packaging; ID + e-prescription verification; no public smoking'),
  ('ca-adult-use','edibles', null, '10 mg THC per package', 'plain child-resistant packaging; excise stamp; standardised cannabis symbol'),
  ('ca-adult-use','beverages', null, '10 mg THC per package', 'plain child-resistant packaging; excise stamp'),
  ('ca-adult-use','extracts_concentrates', null, '1000 mg THC per package', 'plain child-resistant packaging; excise stamp'),
  ('ca-adult-use','dried_flower','30g public possession equivalent', null, 'plain child-resistant packaging; excise stamp'),
  ('de-medcang','dried_flower', null, null, 'pharmacy dispensing label; narcotic documentation'),
  ('au-sas-ap','edibles', null, null, 'TGO 93 labelling; child-resistant packaging')
) as v(pslug, fslug, poss, udl, pkg)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug
where r.pathway_id = p.id and r.format_id = f.id;

-- ---- Primary-source citations (pathway-level) ----
insert into public.regulatory_citations (entity_type, entity_id, instrument, article, source_type, citation_url, published_date, excerpt)
select 'pathway', p.id, v.instrument, v.article, v.stype::public.reg_source_type, v.url, v.pub::date, v.excerpt
from (values
  ('br-rdc-1015','RDC 1.015/2026 (Anvisa)','full instrument','gazette',null,'2026-01-28','new framework replacing RDC 327; effective 4 May 2026'),
  ('br-rdc-1015','RDC 1.013/2026 (Anvisa)','domestic cultivation <=0.3% THC','regulator',null,'2026-01-28','permits domestic medical cultivation for manufacture'),
  ('br-rdc-660','RDC 660/2022 (Anvisa)','individual patient import','gazette',null,'2022-03-30','import of cannabis-derived products by patients on prescription'),
  ('br-rdc-1014-sandbox','RDC 1.014/2026 (Anvisa)','patient-association sandbox','regulator',null,'2026-01-28','sandbox for non-profit patient-association cultivation/distribution'),
  ('gb-cbpm-specials','Misuse of Drugs (Amendment) (No.2) Regulations 2018 (SI 2018/1055)','Schedule 2','statute',null,'2018-11-01','rescheduled cannabis-based products for medicinal use'),
  ('gb-licensed','MHRA marketing authorisations','Sativex / Epidyolex / Nabilone','regulator',null,null,'licensed cannabinoid medicines'),
  ('de-medcang','Medizinal-Cannabisgesetz (MedCanG)','full act','statute',null,'2024-04-01','medical cannabis removed from narcotics list; prescription medicine'),
  ('de-cang-pillar1','Konsumcannabisgesetz (KCanG / CanG)','Pillar 1','statute',null,'2024-04-01','possession, home cultivation and cultivation associations'),
  ('au-sas-ap','Therapeutic Goods Act 1989 s19 + TGO 93','SAS-B / Authorised Prescriber','statute','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub',null,'unapproved medicinal cannabis access and quality standard'),
  ('pl-raw-material','Act on Counteracting Drug Addiction (2017 amendment)','pharmaceutical raw material','statute',null,'2017-11-01','herbal cannabis as pharmacy raw material on prescription'),
  ('za-sahpra-s21','Medicines and Related Substances Act','Section 21','statute',null,null,'named-patient access to unregistered medicines'),
  ('za-cbd-exemption','Government Notice 586, GG 43347','CBD Schedule exclusion','gazette','https://www.sahpra.org.za/thc-and-cbd-information-page/','2020-05-22','low-dose CBD exclusion and processed-product thresholds'),
  ('za-private-use','Minister of Justice v Prince (CCT 108/17) + Cannabis for Private Purposes Act 7 of 2024','private use','court',null,'2024-05-29','private adult possession and cultivation decriminalised'),
  ('za-sahpra-22c','Medicines Act s22C(1)(b) + Plant Improvement Act 2018','cultivation/manufacture licence','statute',null,'2025-12-01','licensed medicinal cultivation and hemp <=2% THC'),
  ('th-controlled-herb','Notification on Controlled Herbs (Cannabis) B.E. 2568','controlled herb','gazette',null,'2025-06-25','cannabis flower reclassified as controlled herb; prescription required'),
  ('th-narcotic-extracts','Ministerial Regulation on Category 5 Narcotics (Cannabis/Hemp Extracts) B.E. 2569','extracts >0.2% THC','gazette',null,'2026-03-26','high-THC extracts remain Category 5 narcotics'),
  ('fr-permanent','LFSS 2024 generalisation + ANSM framework','permanent framework','statute',null,'2026-04-01','experiment to permanent medical framework; oil/extract formats'),
  ('es-rd903','Real Decreto 903/2025','hospital magistral','gazette',null,'2025-10-01','standardised cannabis magistral preparations via hospital pharmacies'),
  ('cz-adult-use','Adult-use amendment (2025)','personal framework','statute',null,'2026-01-01','home cultivation and personal possession for adults 21+'),
  ('cz-medical','Act 50/2013 + SUKL/SAKL regime','medical programme','statute',null,'2013-04-01','flower and magistral preparations on e-prescription')
) as v(slug, instrument, article, stype, url, pub, excerpt)
join public.regulatory_pathways p on p.slug = v.slug;

-- ---- Primary-source citations (rule-level, key format rules) ----
insert into public.regulatory_citations (entity_type, entity_id, instrument, article, source_type, citation_url, published_date, excerpt)
select 'rule', r.id, v.instrument, v.article, v.stype::public.reg_source_type, v.url, v.pub::date, v.excerpt
from (values
  ('th-controlled-herb','dried_flower','Notification on Controlled Herbs (Cannabis) B.E. 2568','flower supply conditions','gazette',null,'2025-06-25','flower only via licensed dispensary against PT33'),
  ('fr-permanent','dried_flower','ANSM permanent framework','flower exclusion','regulator',null,'2026-04-01','framework launches without flower'),
  ('es-rd903','dried_flower','Real Decreto 903/2025','no flower dispensing','gazette',null,'2025-10-01','extract-based magistral only; no flower'),
  ('de-medcang','dried_flower','Medizinal-Cannabisgesetz (MedCanG)','flower prescribing','statute',null,'2024-04-01','flower prescribable as standard medicine'),
  ('za-cbd-exemption','oral_oil','Government Notice 586, GG 43347','low-dose CBD','gazette','https://www.sahpra.org.za/thc-and-cbd-information-page/','2020-05-22','<=20 mg/day CBD OTC below scheduling')
) as v(pslug, fslug, instrument, article, stype, url, pub, excerpt)
join public.regulatory_pathways p on p.slug = v.pslug
join public.product_formats f on f.slug = v.fslug
join public.pathway_format_rules r on r.pathway_id = p.id and r.format_id = f.id;

-- ---- Scheduled / pending regulatory changes ----
insert into public.regulatory_pending_changes
  (entity_type, entity_id, change_type, current_value, expected_value, expected_effective_date, expected_note, confidence, source_url)
select 'pathway', p.id, v.ctype, v.cur, v.exp, v.eff::date, v.note, v.conf::public.reg_change_confidence, v.url
from (values
  ('de-medcang','prescriber','telemedicine follow-ups broadly available; pharmacy mail-order permitted','in-person first prescription; telemed follow-ups limited; mail-order dispensing ban (courier exempt)',null::text,'Bundestag first reading 18 Dec 2025; final vote expected H1 2026','draft',null::text),
  ('br-rdc-660','status','individual patient import broadly available','revised/restricted import framework',null,'Anvisa flagged Jan 2026 as needing urgent revision; separate normative act expected','announced',null),
  ('za-private-use','new_format','private use only; no commercial retail','commercial framework (Commercialisation Policy + consolidating Cannabis Bill)',null,'Cabinet submission Apr 2026; Bill to Parliament ~mid-2027','announced',null),
  ('th-controlled-herb','status','cannabis flower as controlled herb (lighter penalties)','possible return to Category 5 narcotic',null,'government stated intent; timeline unannounced','announced',null),
  ('au-sas-ap','prescriber','telehealth prescribing and advertising widely available','tightened telehealth prescribing, advertising and product-quality controls',null,'TGA 2026-27 top compliance priority','announced',null),
  ('it-cannabis-light','status','hemp inflorescence trade historically tolerated (<=0.5% THC)','criminalised under Apr 2025 security decree',null,'decree in force Apr 2025; under legal challenge','enacted_pending_force',null)
) as v(slug, ctype, cur, exp, eff, note, conf, url)
join public.regulatory_pathways p on p.slug = v.slug;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702213616','regulatory_enrichment_priority_markets','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702213616_regulatory_enrichment_priority_markets.sql

-- RECOVERY BEGIN 20260702213646_wire_regulatory_enrichment_pipeline.sql
-- ============================================================================
-- Wire the stale/enrichment view into the intelligence_jobs queue.
-- Idempotent: only enqueues entities without an already-open job. Safe to call
-- on a schedule (cron) to keep the queue topped up as rows go stale.
-- Priority orders by compliance liability (uncited-verified first).
-- ============================================================================
create or replace function public.enqueue_regulatory_enrichment()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_inserted integer;
begin
  insert into public.intelligence_jobs (job_type, payload, status, priority, scheduled_at)
  select
    'regulatory_format_enrichment',
    jsonb_build_object(
      'record_type', s.record_type,
      'entity_id', s.id,
      'iso_alpha2', s.iso_alpha2,
      'record_slug', s.record_slug,
      'reason', s.reason
    ),
    'pending',
    case s.reason
      when 'verified_uncited'   then 100   -- verified claim lacking a primary source: highest liability
      when 'pending_change_due' then 90    -- a scheduled change has reached its date
      when 'unverified'         then case when s.record_type='rule' then 70 else 60 end
      when 'stale'              then 50
      else 40
    end,
    now()
  from public.v_regulatory_format_stale s
  where not exists (
    select 1 from public.intelligence_jobs j
     where j.job_type = 'regulatory_format_enrichment'
       and j.status in ('pending','in_progress')
       and j.payload->>'entity_id' = s.id::text
  );
  get diagnostics v_inserted = row_count;
  return v_inserted;
end $$;

revoke all on function public.enqueue_regulatory_enrichment() from public;
grant execute on function public.enqueue_regulatory_enrichment() to service_role;

-- Seed the queue now.
select public.enqueue_regulatory_enrichment() as jobs_enqueued;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702213646','wire_regulatory_enrichment_pipeline','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702213646_wire_regulatory_enrichment_pipeline.sql

-- RECOVERY BEGIN 20260703030351_fix_safe_to_jsonb_search_path.sql
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
-- version 20260703030351.
--
-- Rewriting this file cannot affect production: 20260703030351 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

CREATE OR REPLACE FUNCTION public.safe_to_jsonb(t text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = ''
AS $function$
begin
  return t::jsonb;
exception when others then
  return '[]'::jsonb;
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703030351','fix_safe_to_jsonb_search_path','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703030351_fix_safe_to_jsonb_search_path.sql

-- RECOVERY BEGIN 20260703040000_international_signal_coverage_fixes_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session).
-- File added to satisfy migration version tracking.
--
-- Root cause investigation: signals table was ~55% USA despite source_registry
-- having reasonable per-country breadth (500+ international sources tagged
-- across 70+ countries). Two independent causes found and fixed:
--
-- 1. hv_extract_signals_from_captured_text() keyword pre-filter regex only
--    covered EN/FR/ES word forms. Any snapshot whose body text didn't repeat
--    one of those forms was silently marked processing_status='skipped',
--    skip_reason='no_keywords_found' -- even from correctly-fetched,
--    correctly-tagged international sources. Expanded pattern to add:
--    Polish/Czech (konopie/konopi), Dutch (hennep), Portuguese
--    (canhamo/maconha), Italian (canapa), and 25 regulator acronyms
--    (BfArM, MHRA, TGA, SAHPRA, ANVISA, COFEPRIS, INVIMA, OKANA, HALMED,
--    IMCA, CDSCO, NAFDAC, Infarmed, Swissmedic, ANSM, IGJ, GIF, SUKL, ZVA,
--    VVKT, ARCSA, ANMAT, etc). Verified live: 21 previously-skipped
--    snapshots from CH/CZ/PL/SK/IL/BR/UK/AU immediately re-extracted
--    successfully with candidates found after the fix + backlog reset.
--
-- 2. 407 of 1,134 source_registry rows had country/region = NULL despite
--    many being unambiguously country-specific from source_name (e.g.
--    "HALMED Croatia Cannabis Authorisations"). 73 backfilled via verified
--    name-pattern match (69 country-specific + 4 multilateral/Global:
--    WHO, INCB, Europol, UNODC). 334 rows remain untagged -- next pass
--    should be a manual/LLM-assisted review rather than further regex
--    guessing, to avoid false positives.
--
-- Also diagnosed but NOT yet fixed (requires a verified-URL-only
-- remediation pass, tracked separately): international source fetch
-- success rate is ~30% vs ~68% for USA sources over the trailing 14 days,
-- dominated by http_404 (dead/unverified URLs at registry seed time),
-- http_403 (bot/geo blocking), and http_503. This is the largest
-- remaining lever on international signal volume and should not be
-- bulk-patched with unverified URLs -- that is how the current dead-link
-- rate was likely introduced.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703040000','international_signal_coverage_fixes_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703040000_international_signal_coverage_fixes_stub.sql

-- RECOVERY BEGIN 20260703060000_url_health_remediation_batch1_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session).
-- First batch of the source_registry URL health remediation program
-- (tracked as the highest-leverage remaining item after the keyword-gate
-- and country-tagging fixes in 20260703040000).
--
-- Diagnostic baseline: international source fetch success ~30% vs ~68%
-- USA over trailing 14 days, dominated by http_404 (dead/unverified seed
-- URLs), http_403 (bot/geo blocking), http_503, and TLS handshake errors.
--
-- METHOD ESTABLISHED THIS SESSION (for future batches to follow):
-- 1. Pull tier-1 sources with recent fetch_status='error' from source_snapshots
-- 2. web_search for the current official URL
-- 3. web_fetch to CONFIRM it actually resolves before writing to the DB --
--    do not write a URL on search-snippet confidence alone
-- 4. If robots.txt disallows automated access (e.g. suin-juriscol.gov.co),
--    discard it -- it will only become tomorrow's new dead entry
-- 5. Only 404-class errors are fixable via URL replacement. 403/dns_blocked/
--    TLS-handshake errors are a capture-worker/infrastructure problem, not
--    a stale-URL problem, and need separate engineering attention (adapter
--    type, TLS cipher compat with older gov servers, etc) -- do not treat
--    them the same as 404s.
--
-- This batch (2 verified replacements, 4 confirmed-dead duplicates deactivated):
--   Colombia MinJusticia Cannabis -> verified live page on minjusticia.gov.co
--     (old path /cannabis had been retired; correct page is under
--     /programas-co/Cannabis-con-fines-medicinales-cientificos-industriales)
--   Brazil ANVISA Cannabis -> verified live noticias-anvisa index (old
--     /assuntos/cannabis path no longer exists; ANVISA cannabis content
--     is now published via dated news articles under /noticias-anvisa)
--   4 duplicate-topic Brazil/Colombia rows pointing at other confirmed-dead
--     paths deactivated (is_active=false) rather than guessed at further --
--     each would need its own independent verification pass.
--
-- Bonus: while researching correct URLs, surfaced two live regulatory
-- developments neither previously in signals nor briefings, inserted
-- directly as manually-sourced, cited signals:
--   Brazil: ANVISA RDC 1012-1015/2026, replacing RDC 327/2019, effective
--     ~Aug 2026 (6 months post Feb 3 2026 publication) -- fibromyalgia/
--     lupus patients added, new administration routes approved.
--   Colombia: Decreto 1138/2025 ordering INVIMA to issue new medical
--     cannabis production/prescription rules by ~March 2026, still
--     pending as of Feb 2026 reporting.
--
-- Remaining scope: ~400+ more error-state international sources not yet
-- triaged. This is a recurring workstream, not a one-session fix -- each
-- verified batch should follow the method above.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703060000','url_health_remediation_batch1_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703060000_url_health_remediation_batch1_stub.sql

-- RECOVERY BEGIN 20260703070000_url_health_remediation_batch2_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 2).
-- Continuation of 20260703060000. Same verified-only method.
--
-- Fixed (2, both confirmed via web_fetch 200 OK):
--   Botswana gazette: /gazettes/bw/recent -> /gazettes/bw/ (the "recent"
--     suffix never existed in gazettes.africa's real routing; the country
--     itself is fully covered there, 907 gazettes on file).
--   Argentina ANMAT cannabis: old /anmat/consultas path dead -> replaced
--     with the actual Ministry of Health REPROCANN hub at
--     argentina.gob.ar/salud/cannabis-medicinal, which is the real,
--     actively-maintained national program page (REPROCANN registry,
--     advisory council, patient access rules).
--
-- Notable structural finding: gazettes.africa (Laws.Africa/AfricanLII)
-- suffered a fire that destroyed part of its archive (disclosed on their
-- own homepage) and its current live country list -- verified directly,
-- not inferred -- covers only: Algeria, Angola, Botswana, Congo, Eswatini,
-- Ghana, Kenya, Lesotho, Malawi, Mauritius, Morocco, Mozambique, Namibia,
-- Nigeria, Rwanda, Senegal, Seychelles, Sierra Leone, Somalia, South
-- Africa, Tanzania, Uganda, Zambia, Zimbabwe, plus EAC/ECOWAS regional.
--
-- Benin, Burundi, Central African Republic, Chad, Comoros, and Cameroon
-- were never covered by this source. Their source_registry rows are NOT
-- a stale-URL problem -- deactivated (is_active=false) rather than left
-- erroring indefinitely with no attribution. Real coverage for Francophone
-- Central/West Africa needs a different source entirely (each country's
-- own Journal Officiel where one has a web presence, or an OHADA-adjacent
-- aggregator) -- tracked as a source-sourcing gap, not a URL fix, for a
-- future session.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703070000','url_health_remediation_batch2_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703070000_url_health_remediation_batch2_stub.sql

-- RECOVERY BEGIN 20260703080000_url_health_remediation_batch3_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 3).
-- Continuation of 20260703060000 / 20260703070000. Same verified-only method.
--
-- New problem class discovered this batch: robots.txt-disallowed regulator
-- domains. Australia's TWO actual cannabis regulators -- TGA (Therapeutic
-- Goods Administration) and ODC (Office of Drug Control) -- both disallow
-- automated access outright, confirmed directly via fetch attempts on
-- their real, correct, current cannabis-specific pages. This is NOT a
-- stale-URL problem (the pages exist and are current) and NOT fixable by
-- finding a different URL on the same domain. It explains the odd HTTP/2
-- stream-error signatures seen in source_snapshots for these two sources
-- (bot detection manifesting as a protocol error rather than a clean 403).
--
-- Fixed (1): Australia Border Force -- old target was a single specific
--   2021 press release that had gone dead. ABF's own domain is NOT
--   robots-blocked (verified) and has a live, continuously-updated
--   newsroom index at newsroom.border.gov.au -- swapped to that instead
--   of another single dated article, for durability.
--
-- Deactivated (2), with reason documented rather than left silently
-- erroring: TGA Cannabis, NHMRC Cannabis Research. Both on
-- robots-disallowed domains. Real fix requires either an official
-- RSS/API endpoint (if TGA/ODC publish one -- not yet checked) or
-- secondary trade-press coverage of their announcements as a proxy
-- source, tracked separately.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703080000','url_health_remediation_batch3_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703080000_url_health_remediation_batch3_stub.sql

-- RECOVERY BEGIN 20260703090000_url_health_remediation_batch4_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 4).
-- Continuation of the URL health remediation program. Same verified-only method.
--
-- Fixed (3, all confirmed via web_fetch):
--   BC LCRB Cannabis (Canada) -> old URL had /cannabis appended to a path
--     that no longer exists; replaced with the current liquor-and-cannabis
--     regulation hub.
--   Senado Chile Comision de Salud -> old /comisiones/comision-de-salud
--     slug retired; Senado now uses numeric IDs (/comisiones/195).
--   CIHR Canada (Research in Substance Use) -> the specific old page
--     (51090.html) was gone but the domain itself is current and healthy;
--     replaced with the live equivalent page (50927.html). NOTE: original
--     error was a TLS UnknownIssuer cert error, not a 404 -- if this
--     recurs on the capture worker even with the corrected URL, that
--     confirms the problem is the worker's cert trust store, not the URL,
--     and needs separate engineering attention.
--
-- Deactivated (2): ISP Chile (both rows). The registry had them on the
-- wrong domain (ispch.cl) but even the correct current domain
-- (ispch.gob.cl, verified) disallows automated access via robots.txt.
-- Same failure class as Australia's TGA/ODC from batch 3.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703090000','url_health_remediation_batch4_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703090000_url_health_remediation_batch4_stub.sql

-- RECOVERY BEGIN 20260703091614_expand_extraction_keyword_gate_international.sql
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
-- version 20260703091614.
--
-- Rewriting this file cannot affect production: 20260703091614 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

CREATE OR REPLACE FUNCTION public.hv_extract_signals_from_captured_text(p_batch_size integer DEFAULT 50)
 RETURNS TABLE(snapshot_id uuid, source_name text, country text, candidates_found integer, status_set text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snap          RECORD;
  v_source        RECORD;
  v_sentences     TEXT[];
  v_sentence      TEXT;
  v_candidates    JSONB;
  v_candidate     JSONB;
  v_kw_count      INT;
  v_chunk_start   INT;
  v_chunk         TEXT;
  v_found         INT;
  v_text_lower    TEXT;

  -- Expanded 2026-07-03: original pattern only covered EN/FR/ES word forms,
  -- silently skipping snapshots in Polish, Czech, Dutch, and any document
  -- whose body text relies on the issuing authority's name/acronym rather
  -- than repeating "cannabis" (common in dense regulatory/gazette text).
  -- Added: Polish/Czech Slavic root (konopie/konopi), Dutch (hennep),
  -- Portuguese (canhamo/maconha), Italian (canapa), and 25 regulator
  -- acronyms (BfArM, MHRA, TGA, SAHPRA, ANVISA, COFEPRIS, INVIMA, OKANA,
  -- HALMED, IMCA, CDSCO, NAFDAC, Infarmed, Swissmedic, ANSM, IGJ, GIF,
  -- SUKL, ZVA, VVKT, ARCSA, ANMAT) so official-source documents in those
  -- jurisdictions pass the pre-filter even when generic keywords are sparse.
  v_kw_pattern CONSTANT TEXT :=
    '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|marihuana|chanvre|'
    'ca[nñ]amo|ganja|kannabis|bhang|canabis|canapa|kif|haschisch|haschish|'
    'hashish|weed|narcotics|narcotic|stupefiant|estupefaciente|'
    'controlled substance|substance contr[oô]l[eé]|'
    'pharmaceutical|pharmaceutique|farmac[eé]utico|'
    'medicinal plant|plante m[eé]dicinale|planta medicinal|'
    'licence|licencia|autorisation|permiso|registro|'
    'import permit|export permit|clinical trial|essai clinique|'
    'ensayo cl[ií]nico|konopie|konopi|hennep|c[aâ]nhamo|maconha|'
    'psilocybin|psychotropic|narcotic drugs|'
    'dea|fda|ema|who|oms|bfarm|mhra|tga|sahpra|anvisa|cofepris|invima|'
    'okana|halmed|imca|cdsco|nafdac|infarmed|swissmedic|ansm|igj|gif|'
    'sukl|zva|vvkt|arcsa|anmat|dangerous drugs board|narcotics control|'
    'pharmacy and poisons board)\M';

  v_boilerplate CONSTANT TEXT[] := ARRAY[
    'opens new tab','creative commons','code of conduct',
    'hardware, software','cookie policy','privacy policy',
    'all rights reserved','javascript','please enable',
    'sign in','log in','subscribe','newsletter','follow us',
    'terms of use','terms of service','contact us','about us',
    'sitemap','search results','page not found','404',
    '403 forbidden','access denied'
  ];

BEGIN

  FOR v_snap IN
    SELECT ss.id, ss.source_id, ss.captured_url, ss.captured_title,
           ss.captured_text, ss.intelligence_pass, ss.language_detected,
           ss.word_count, ss.captured_at
    FROM source_snapshots ss
    WHERE ss.processing_status = 'pending'
      AND ss.signal_candidates IS NULL
      AND ss.fetch_status = 'success'
      AND ss.captured_text IS NOT NULL
      AND length(ss.captured_text) > 50
    ORDER BY ss.captured_at ASC
    LIMIT p_batch_size
  LOOP

    SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
           sr.jurisdiction_code,
           sr.signal_keywords, sr.source_url
    INTO v_source
    FROM source_registry sr WHERE sr.id = v_snap.source_id;

    UPDATE source_snapshots SET processing_status = 'processing' WHERE id = v_snap.id;

    v_candidates := '[]'::JSONB;
    v_found      := 0;
    v_text_lower := lower(v_snap.captured_text);

    IF v_text_lower !~ v_kw_pattern THEN
      UPDATE source_snapshots
        SET processing_status = 'skipped',
            signal_candidates = jsonb_build_object(
              'skip_reason',   'no_keywords_found',
              'source_name',   v_source.source_name,
              'source_country', v_source.country,
              'tier',          v_source.tier,
              'item_kind',     'html_snapshot'
            )
      WHERE id = v_snap.id;

      snapshot_id      := v_snap.id;
      source_name      := v_source.source_name;
      country          := v_source.country;
      candidates_found := 0;
      status_set       := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    v_sentences := regexp_split_to_array(
      regexp_replace(v_snap.captured_text, E'\\r\\n|\\r', E'\\n', 'g'),
      E'(?<=[.!?।।]\\s)|\\n{2,}'
    );

    v_chunk       := '';
    v_chunk_start := 0;

    FOREACH v_sentence IN ARRAY v_sentences
    LOOP
      v_sentence := trim(v_sentence);
      CONTINUE WHEN length(v_sentence) < 15;

      IF length(v_chunk) + length(v_sentence) > 600 OR v_chunk = '' THEN
        IF length(v_chunk) >= 30 THEN
          DECLARE
            v_chunk_lower TEXT := lower(v_chunk);
            v_kc INT := 0;
            v_is_boilerplate BOOLEAN := FALSE;
            v_bp TEXT;
          BEGIN
            SELECT COUNT(*) INTO v_kc
            FROM regexp_matches(v_chunk_lower, v_kw_pattern, 'g') AS m;

            IF v_kc > 0 THEN
              FOREACH v_bp IN ARRAY v_boilerplate LOOP
                IF v_chunk_lower LIKE '%' || v_bp || '%' THEN
                  v_is_boilerplate := TRUE;
                  EXIT;
                END IF;
              END LOOP;

              IF NOT v_is_boilerplate AND length(trim(v_chunk)) >= 30 THEN
                v_candidate := jsonb_build_object(
                  'text',               left(v_chunk, 500),
                  'keyword_count',      v_kc,
                  'source_country',     v_source.country,
                  'source_iso',         v_source.iso,
                  'lead_weeks',         4,
                  'intelligence_pass',  COALESCE(v_snap.intelligence_pass, 1),
                  'requires_translation',
                    CASE WHEN v_snap.language_detected NOT IN ('en', 'english')
                         THEN TRUE ELSE FALSE END
                );
                v_candidates := v_candidates || v_candidate;
                v_found := v_found + 1;
              END IF;
            END IF;
          END;
        END IF;

        v_chunk := v_sentence;
      ELSE
        v_chunk := v_chunk || ' ' || v_sentence;
      END IF;
    END LOOP;

    IF length(v_chunk) >= 30 THEN
      DECLARE
        v_chunk_lower TEXT := lower(v_chunk);
        v_kc INT := 0;
        v_is_boilerplate BOOLEAN := FALSE;
        v_bp TEXT;
      BEGIN
        SELECT COUNT(*) INTO v_kc
        FROM regexp_matches(v_chunk_lower, v_kw_pattern, 'g') AS m;

        IF v_kc > 0 THEN
          FOREACH v_bp IN ARRAY v_boilerplate LOOP
            IF v_chunk_lower LIKE '%' || v_bp || '%' THEN
              v_is_boilerplate := TRUE; EXIT;
            END IF;
          END LOOP;

          IF NOT v_is_boilerplate THEN
            v_candidate := jsonb_build_object(
              'text',               left(v_chunk, 500),
              'keyword_count',      v_kc,
              'source_country',     v_source.country,
              'source_iso',         v_source.iso,
              'lead_weeks',         4,
              'intelligence_pass',  COALESCE(v_snap.intelligence_pass, 1),
              'requires_translation',
                CASE WHEN v_snap.language_detected NOT IN ('en', 'english')
                     THEN TRUE ELSE FALSE END
            );
            v_candidates := v_candidates || v_candidate;
            v_found := v_found + 1;
          END IF;
        END IF;
      END;
    END IF;

    IF v_found = 0 THEN
      UPDATE source_snapshots
        SET processing_status = 'skipped',
            signal_candidates = jsonb_build_object(
              'skip_reason',    'no_valid_chunks',
              'source_name',    v_source.source_name,
              'source_country', v_source.country,
              'tier',           v_source.tier,
              'item_kind',      'html_snapshot',
              'matched_keywords', ARRAY(
                SELECT m[1] FROM regexp_matches(v_text_lower, v_kw_pattern, 'g') AS m
                LIMIT 5
              )
            )
      WHERE id = v_snap.id;

      snapshot_id := v_snap.id; source_name := v_source.source_name;
      country := v_source.country; candidates_found := 0; status_set := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    UPDATE source_snapshots
      SET signal_candidates = v_candidates,
          processing_status = 'extracted',
          processed_at      = now()
    WHERE id = v_snap.id;

    snapshot_id := v_snap.id; source_name := v_source.source_name;
    country := v_source.country; candidates_found := v_found; status_set := 'extracted';
    RETURN NEXT;

  END LOOP;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703091614','expand_extraction_keyword_gate_international','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703091614_expand_extraction_keyword_gate_international.sql

-- RECOVERY BEGIN 20260703100000_source_health_view_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session).
-- Built after 4 manual URL-remediation batches (see the prior 4 migration
-- stubs) surfaced a real problem: findings ("gazettes.africa doesn't cover
-- Benin", "TGA blocks robots") were only living in git commit messages,
-- and each new session had to re-derive priority order from scratch across
-- 1,134 source_registry rows with no ranking.
--
-- Two additions:
--
-- 1. source_registry.verification_notes (text) + verification_checked_at
--    (timestamptz). Freeform note from manual investigation: why a source
--    was fixed, or why it couldn't be and what would actually fix it.
--    Backfilled for the 15 rows touched across this session's 4 batches.
--
-- 2. public.source_registry_health (view, security_invoker=true, granted
--    to service_role only -- not exposed on the public API surface).
--    Ranks active sources by consecutive_failures (failures since the
--    most recent success in the trailing 30 days, or total attempts if
--    never succeeded in that window), and buckets last_error_message into
--    a suggested_action:
--      404/dead path          -> verify_replacement_url
--      403/forbidden          -> check_robots_or_find_alt_source
--      dns_blocked            -> investigate_dns_block
--      cert/TLS errors        -> capture_worker_tls_issue_not_url
--      abort/timeout          -> check_timeout_or_site_speed
--      503                    -> check_if_transient_or_persistent
--    Also flags crawl_gap_flag='not_crawled_30d' for sources the cron
--    simply isn't reaching at all, a distinct problem from fetch failures.
--
-- First real-world test of the view immediately surfaced two clusters that
-- manual country-by-country investigation had not reached yet:
--   - 6 Reddit sources (r/CBD, r/delta8, r/cannabusiness, r/trees,
--     r/weedstocks, r/uktrees) at 0% success, up to 34 consecutive
--     failures -- almost certainly Reddit's post-2023 anti-scraping
--     posture blocking all of them at once, not 6 separate problems.
--   - Several USA tier-1 sources (Hemp Benchmarks RSS, Alabama AMCC,
--     Massachusetts CCC, Kentucky) also failing -- the aggregate ~68%
--     USA success rate was masking real gaps underneath it.
--
-- Usage for future sessions:
--   select * from source_registry_health
--   where verification_checked_at is null
--   order by consecutive_failures desc, tier asc;
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703100000','source_health_view_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703100000_source_health_view_stub.sql

-- RECOVERY BEGIN 20260703103736_daily_digest_schema.sql
-- Daily public digest: headlines table + signal usage tracking + async job tracking

alter table ia_signals add column if not exists used_in_digest_at timestamptz;

create table if not exists daily_digest (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null unique,
  headlines jsonb not null default '[]'::jsonb,
  markets text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','published')),
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table daily_digest enable row level security;

create policy "daily_digest_public_read" on daily_digest
  for select
  to anon, authenticated
  using (status = 'published');

-- no insert/update/delete policies: writes are service-role / SECURITY DEFINER function only

create table if not exists _digest_jobs (
  request_id bigint primary key,
  digest_date date not null,
  signal_ids text[] not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703103736','daily_digest_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703103736_daily_digest_schema.sql

-- RECOVERY BEGIN 20260703104651_add_dossier_file_reference_columns.sql
-- Applied directly to DB. Stub for CLI reconciliation.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703104651','add_dossier_file_reference_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703104651_add_dossier_file_reference_columns.sql

-- RECOVERY BEGIN 20260703110000_health_view_bugfix_and_reddit_cluster_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, final batch).
--
-- 1. BUG FIX in source_registry_health (from 20260703100000): the view only
--    counted fetch_status='success' as a successful fetch. Real data has 4
--    values (success, extracted, extract_failed, error). Verified directly:
--    'extracted' (1379 rows) and 'extract_failed' (10 rows) both have real
--    captured_text in the large majority of cases -- the HTTP fetch worked;
--    only 'error' means it didn't. Without this fix, sources whose recent
--    snapshots happened to be in 'extracted' state were wrongly flagged as
--    failing. Caught via Hemp Benchmarks RSS showing as a false positive
--    (10 "consecutive failures" -> actually 100% success once fixed).
--    Also added a 429/rate-limit bucket to suggested_action.
--
-- 2. Reddit cluster resolved (10 sources: r/Marijuana, r/HempFlower,
--    r/cannabusiness, r/trees, r/delta8, r/CBD, r/CanadianCannabis,
--    r/uktrees, r/microgrowery, r/weedstocks). All failing 403/429 on the
--    same www.reddit.com/r/X/.rss pattern -- one root cause: Reddit's bot
--    detection catching the capture worker's honest User-Agent
--    (HarbourviewSourceEngine/2.1) via Cloudflare fingerprinting, not
--    fixable by URL change. Deliberately did NOT spoof a browser
--    User-Agent to evade detection -- consistent with the same principle
--    applied to Australia TGA/ODC and Chile ISP earlier this session.
--    Deactivated with the real fix documented: register a Reddit API app
--    (requires Tyler's account) and use OAuth2 + oauth.reddit.com.
--
-- 3. Alabama AMCC, Kentucky, and Massachusetts CCC verified independently
--    this session and found already correctly fixed -- consistent with
--    Claude Code working the same source_registry_health worklist in
--    parallel. Notes backfilled rather than re-doing the work.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703110000','health_view_bugfix_and_reddit_cluster_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703110000_health_view_bugfix_and_reddit_cluster_stub.sql

-- RECOVERY BEGIN 20260703120000_url_remediation_batch6_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 6).
--
-- Fixed (2, verified via web_fetch):
--   Arizona Cannabis Laws NORML -> old /arizona-marijuana-laws/ slug
--     retired when NORML restructured state pages into separate
--     legalization/medical-laws/penalties sub-pages. Pointed at the main
--     legalization status page.
--   Seychelles Official Gazette -> old assembly.sc/downloads path was the
--     wrong domain entirely. Replaced with gazette.sc, the actual
--     dedicated national gazette site (Drupal-based, weekly publication,
--     verified current as of the week of Jun 29 2026).
--
-- Deactivated (2), reason documented rather than guessed at:
--   Guinea gazette -> same finding as the earlier Benin/Burundi/CAR/Chad/
--     Comoros/Cameroon cluster. gazettes.africa's own live country index
--     does not include Guinea. Not a stale URL, needs a different source.
--   UN Comtrade cannabis trade flows -> 401 Unauthorized, not 404. Their
--     API now requires a subscription key (comtradeplus.un.org). Needs
--     Tyler to register for API credentials, not a URL fix.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703120000','url_remediation_batch6_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703120000_url_remediation_batch6_stub.sql

-- RECOVERY BEGIN 20260703120639_seed_module2_sections_22.sql
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
-- version 20260703120639.
--
-- Rewriting this file cannot affect production: 20260703120639 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

insert into education_module_sections (module_id, section_order, heading, body, block_type)
select m.id, v.section_order, v.heading, v.body, v.block_type
from (values
  ('drug-interactions', 5, 'Key Takeaways', 'Assess interaction risk based on actual shared mechanism, particularly hepatic enzyme-mediated metabolic pathways, additive CNS effects, cardiovascular considerations, and anticoagulant interactions specifically, rather than superficial similarity between medication categories. Document which specific interaction categories were assessed as relevant or not relevant for a given patient''s actual medication combination, not just that a general review occurred.

Tailor combination-therapy counselling to the patient''s specific concurrent medications and the corresponding interaction mechanism, rather than relying on generic combination-therapy caution language. And when a patient transitions between product formats, an event that already triggers re-counselling under the pharmacy dispensing framework, specifically address whether the interaction profile with their existing medications changes alongside the format change, not only whether the cannabinoid product''s own behavior differs.

This module is educational and conceptual; it does not provide patient-specific interaction assessment or dosing guidance, which remains the treating clinician and pharmacist''s responsibility using current clinical reference resources.

Finally, given how much interaction risk depends on accurate, current knowledge of a patient''s complete medication list, including over-the-counter medications and supplements a patient may not think to mention as relevant, clinicians and pharmacists should build an explicit, direct prompt for this information into the standard intake and counselling process rather than relying on the patient to proactively volunteer a complete list, since patients frequently underreport over-the-counter and supplement use specifically because they don''t think of it as "real medication" worth mentioning, even where it carries genuine interaction relevance.

Given how broadly hepatic-enzyme-mediated interactions can affect medications with no obvious surface-level connection to cannabis-based treatment, a globally consistent interaction-screening protocol, applied with equal rigor regardless of jurisdiction or perceived local prescribing norms, provides meaningfully better patient protection than allowing screening rigor to vary informally based on individual clinician practice or jurisdiction-specific custom.

A further interaction category worth addressing explicitly concerns interactions with other herbal or complementary supplements specifically, since patients using cannabis-based treatment are statistically more likely than the general prescribed-medication population to also be using other herbal or complementary products, some of which share overlapping hepatic-metabolism pathways with cannabinoids, meaning a genuinely thorough medication-list intake should explicitly prompt for herbal and complementary product use with the same specificity applied to conventional prescribed medications.

It is also worth examining how interaction risk should inform, rather than simply caution against, treatment planning, since in many cases an identified interaction risk can be managed through dose adjustment, increased monitoring frequency, or timing separation between the two medications, rather than necessarily requiring that cannabis-based treatment be avoided entirely, meaning the documentation discipline covered elsewhere in this module should specifically capture which management approach was chosen and why, not merely that an interaction risk was identified.

Finally, prescribers and pharmacists should build awareness of how interaction reference resources themselves vary in currency and comprehensiveness specifically for cannabis-based products, given the relatively recent expansion of formal research in this area, meaning cross-checking a flagged or unflagged interaction against more than one current reference resource, particularly for a less common medication combination, provides a meaningfully more reliable check than relying on a single reference source alone.

A final point worth making explicit: clinical teams should periodically audit a sample of their own documented interaction assessments against current reference standards, treating this as a standing quality-assurance practice rather than a one-time training exercise, since reference standards and the underlying evidence base for specific cannabinoid interactions continue to evolve, and an audit practice catches drift between an individual clinician''s working knowledge and current best evidence before that drift accumulates into a meaningful pattern of under-assessed risk across a patient population.

This periodic audit discipline mirrors the same internal-review logic applied to documentation consistency in the clinical prescribing module elsewhere in this track, reinforcing that interaction-screening quality, like broader prescribing documentation quality, benefits from active internal verification rather than passive assumption that initial training alone keeps pace with an evolving evidence base indefinitely.

A related point worth making explicit: clinics should maintain a simple internal log of any interaction-related adverse events actually observed in their own patient population, reviewed periodically alongside formal reference-resource updates, since this kind of internally accumulated, organization-specific experience can surface patterns relevant to that specific patient population''s characteristics that a general reference resource, built from broader population data, may not fully capture or weight appropriately for the clinic''s own specific case mix. Even a lightweight, informally maintained log meaningfully outperforms relying on individual clinician memory across a growing patient base, and building a brief, structured review of this log into a recurring clinical governance meeting ensures the pattern actually gets surfaced and discussed rather than sitting unreviewed in a file that nobody returns to until a specific incident forces the question. A brief quarterly review of this log, folded into existing clinical governance meetings rather than treated as a separate administrative task, keeps the practice genuinely functioning without adding meaningful burden to clinical staff, and ensures any emerging local pattern gets surfaced and discussed before it accumulates into something more consequential.', 'text'),
  ('patient-access-pathways', 1, 'Why This Matters', 'The route by which an individual patient actually obtains a prescribed cannabis-based product varies enormously across the jurisdictions covered in this education track, and conflating the access-pathway question with the broader prescribing-legality question is a common source of confusion for patients, clinics, and operators alike. A jurisdiction permitting cannabis-based prescribing in principle frequently still requires the patient''s specific access to flow through one of several distinct, named pathways, each with its own eligibility criteria, approval authority, and timeline, exactly the structure seen concretely in the Australian module elsewhere in this track with its four distinct access schemes.

This matters for clinic operators and patient-facing organizations specifically, since the practical patient experience, how long access actually takes, what documentation the patient and prescriber need to assemble, and which specific product formats are actually reachable through a given pathway, depends entirely on correctly identifying which access pathway applies to a given patient''s situation, not on the broader fact that cannabis-based treatment is generally permitted in that jurisdiction.

For an operator building patient-facing services across multiple jurisdictions, understanding access pathways as a distinct layer from prescribing legality, reimbursement, and product registration is foundational to setting accurate patient expectations and building genuinely compliant patient support processes, rather than assuming a single onboarding workflow transfers cleanly across every market served.

A concrete illustrative scenario shows how pathway misclassification creates a worse patient experience. Picture a hypothetical patient with a genuinely severe, urgent condition who would clearly qualify for a jurisdiction''s fastest, notification-only severity-tiered access pathway, but whose case is processed by a clinic defaulting to its more familiar standard pathway requiring a fuller documented justification and longer approval timeline, simply because the clinic''s intake staff weren''t trained to specifically assess eligibility for the faster pathway. The patient experiences a meaningfully longer wait for access than the regulatory framework itself would have actually required for their specific situation, not because the framework failed the patient, but because the clinic''s own intake process failed to correctly route the patient to the pathway genuinely applicable to their case.

The structural access-pathway patterns identified in this module, fully registered, named-patient or individual-import, authorized-prescriber, and severity-tiered, recur in some combination across essentially every jurisdiction covered in this track, meaning an operator encountering a genuinely new jurisdiction not specifically covered elsewhere in this education track can use this module''s four-pattern framework as a starting analytical lens for quickly mapping that jurisdiction''s own specific access structure onto a familiar underlying typology, rather than needing to build an entirely new mental model from scratch.', 'text'),
  ('patient-access-pathways', 2, 'The Core Framework', 'Patient access pathways across the jurisdictions covered in this track cluster into a recognizable set of structural patterns, even where specific names and eligibility criteria differ.

Fully registered or licensed product pathways apply where a specific cannabis-based product has received full marketing authorization or equivalent formal registration, allowing prescribing through the same standard mechanism as any other approved medication, with correspondingly the most straightforward patient access experience but the narrowest set of products actually reaching this status in most jurisdictions, as flagged specifically in the UK module elsewhere in this track where only a small number of products hold this status.

Named-patient or individual-import pathways apply where a specific patient''s access to an unregistered product requires individual approval, frequently tied to a documented clinical justification that registered alternatives can''t meet the patient''s specific need, with approval granted by either the prescriber directly under delegated authority, or by a specific regulatory authority on a case-by-case basis, the structure seen in the UK''s unlicensed CBPM framework and several of Australia''s access scheme categories.

Authorized-prescriber or standing-authorization pathways allow a qualified prescriber to access a defined product or product class for a patient population on an ongoing basis without requiring fresh case-by-case approval for each individual patient, trading a more involved upfront prescriber qualification process for a faster subsequent patient-level experience, the structure behind Australia''s Authorised Prescriber scheme specifically.

Severity or urgency-tiered pathways differentiate access requirements based on how serious or urgent the patient''s condition is, frequently offering a faster, lighter-touch notification-only route for the most severe situations and a more involved, justification-heavy route for less urgent ones, the structure underlying the distinction between Australia''s Category A and Category B access schemes specifically.

It is worth examining the specific documentation burden differences between access pathway tiers in more detail, since this is frequently where patient and clinic frustration concentrates. A faster, notification-only pathway typically requires only confirmation of basic eligibility criteria being met, while a more involved, justification-heavy pathway typically requires detailed documentation of prior treatment history, specific reasons those treatments were inadequate, and sometimes formal review by an external body; a clinic that understands these documentation differences in advance can set patient expectations accurately from the very first conversation, rather than the patient discovering the actual documentation burden only partway through an already-initiated access process.

It is worth connecting this module''s pathway-classification discipline explicitly to the prescribing frameworks module elsewhere in this track, since access pathway and prescriber qualification are two genuinely independent dimensions that nonetheless interact, meaning a globally operating clinic''s patient intake process should assess both dimensions together for every new patient and every new jurisdiction, confirming both which access pathway applies and which prescriber qualification that pathway specifically requires, rather than treating either dimension as fully resolved once the other has been addressed.', 'text')
) as v(slug, section_order, heading, body, block_type)
join education_modules m on m.slug = v.slug;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703120639','seed_module2_sections_22','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703120639_seed_module2_sections_22.sql

-- RECOVERY BEGIN 20260703130000_url_remediation_batch7_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 7).
--
-- Fixed (2, verified via web_fetch):
--   OrganiGram RSS -> old organigram.ca/feed/ WordPress feed gone. Company
--     rebranded to Organigram Global and rebuilt its site on Wix following
--     the Sanity Group acquisition (announced this session's research as
--     establishing Organigram as the only pure-play cannabis company with
--     leadership positions in both Canada and Germany). Wix has no native
--     RSS; switched adapter from 'rss' to 'html_snapshot' and pointed at
--     the dedicated Press Releases page.
--   Colombia Camara de Representantes -- Comision Septima -> old /comision7
--     slug dead. Verified live and current; this committee was actively
--     advancing health legislation as of May 2026.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703130000','url_remediation_batch7_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703130000_url_remediation_batch7_stub.sql

-- RECOVERY BEGIN 20260703140000_url_remediation_batch8_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 8).
--
-- Deactivated (2), both confirmed NOT fixable via a new URL:
--   Polish Sejm Komisja Zdrowia -> robots.txt disallowed on the real,
--     current committee page. Originally suspected as a term-number
--     staleness issue (URL hardcodes Sejm10.nsf) but that theory didn't
--     hold -- current term-10 URLs are still valid and indexed elsewhere.
--     sejm.gov.pl just blocks automated fetching outright. Same class as
--     Australia TGA/ODC and Chile ISP.
--   PubMed: Cannabidiol -> not a stale URL, a malformed one from the
--     start. The stored RSS URL uses a fake placeholder token
--     (/rss/search/2/) where PubMed requires a real token generated
--     interactively through their UI -- these links are not constructible
--     or guessable. Per PubMed's own documentation, automated/frequent
--     querying should use NCBI E-utilities (esearch.fcgi) instead of RSS.
--     Real fix requires rebuilding this source on the E-utilities API.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703140000','url_remediation_batch8_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703140000_url_remediation_batch8_stub.sql

-- RECOVERY BEGIN 20260703150000_url_remediation_batch9_weedmaps_cluster_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 9).
--
-- Fixed (20 sources total, all verified via web_fetch):
--
--   Globe Newswire Cannabis -> old /RssFeed/industry/cannabis path used
--     the wrong URL structure entirely. GlobeNewswire indexes by numeric
--     industry code + name + feedTitle, not a plain slug. Found the exact
--     correct feed via their public /rss/list index.
--
--   Council of Europe PACE -> migrated entirely from assembly.coe.int
--     (403 blocked) to pace.coe.int. Verified live with current news.
--
--   Weedmaps cluster (18 sources): NOT a bot-blocking issue like Reddit/
--     TGA -- confirmed the base domain works fine (Weedmaps News and the
--     general /dispensaries page were already at 100% success). The
--     specific old pattern /dispensaries/{state} was retired in favor of
--     /dispensaries/in/united-states/{state}. Verified on Arizona, then
--     applied the same mechanical string-replace transform to all 17
--     other US state rows sharing the identical old pattern. Also fixed
--     WM Technology Investor Relations: wrong subdomain entirely
--     (investors.weedmaps.com has no DNS record; real site is
--     ir.weedmaps.com).
--
-- Not resolved, flagged rather than guessed: Weedmaps Canada Dispensaries
--   uses a different URL structure than the US state pattern; needs its
--   own verification pass. Romania Camera Deputatilor health committee
--   page: site itself works (confirmed via other pages), but the specific
--   committee URL keeps 404ing even on variants indexed by search --
--   likely uses session/legislature-specific query params this site's
--   PL/SQL-based routing doesn't expose predictably. Left for a future
--   session rather than force a low-confidence guess.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703150000','url_remediation_batch9_weedmaps_cluster_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703150000_url_remediation_batch9_weedmaps_cluster_stub.sql

-- RECOVERY BEGIN 20260703160000_url_remediation_batch10_pubmed_norml_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 10).
--
-- PubMed cluster completed: found 11 MORE rows sharing the exact same
-- fake-placeholder-token pattern already diagnosed on "PubMed: Cannabidiol"
-- (covers cannabinoid receptor, endocannabinoid system, clinical trials,
-- pain, epilepsy, cancer, anxiety, hemp agriculture, and two broader
-- clinical/policy feeds). All deactivated with the same real fix path
-- documented: rebuild on NCBI E-utilities, not a new RSS URL. This is a
-- 13-source cluster in total now (across this batch and earlier) -- worth
-- a dedicated follow-up given the real clinical/research value it covers.
--
-- NORML cluster: confirmed the fix is NOT uniform across states --
-- Alabama has no adult-use legalization (unlike Arizona/Alaska, which
-- both got the /legalization/ page), so used its medical-marijuana-law
-- page instead, matching its actual legal status. Alaska matched the
-- Arizona pattern since it also has full adult-use legalization.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703160000','url_remediation_batch10_pubmed_norml_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703160000_url_remediation_batch10_pubmed_norml_stub.sql

-- RECOVERY BEGIN 20260703170000_url_remediation_batch11_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 11).
--
-- Fixed (3, all confirmed via web_fetch, all domain-migration cases):
--   Bulgaria Cannabis Regulator (BDA) -> verified live at bda.bg/en/. Note:
--     their news section updates infrequently -- real domain, real
--     content, just a slow-moving source.
--   Weed Week -> weedweek.news domain is dead (DNS failure). They
--     consolidated to weedweek.com. Verified live with very current
--     content (DEA rescheduling hearings, July 2026).
--   Kansas Cannabis Regulator -> KDA migrated their entire domain from
--     ksda.gov (DNS failure) to agriculture.ks.gov. Verified live. They
--     also offer an official GovDelivery email subscription -- a more
--     durable channel than scraping if this breaks again.
--
-- Remaining in this batch, not yet resolved: Cannabis Science Technology
-- (403), UC Davis Cannabis (404), Analytical Cannabis (403), WCO HS
-- Nomenclature (connection reset), Jamaica Official Gazette (404),
-- Nebraska Cannabis Regulator (404), Virginia VDACS Cannabis (404).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703170000','url_remediation_batch11_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703170000_url_remediation_batch11_stub.sql

-- RECOVERY BEGIN 20260703180000_url_remediation_batch12_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 12).
--
-- Cannabis Science Technology (403) turned out to be a duplicate, not a
-- stale URL. Attempting the fix hit a unique-constraint violation on
-- normalized URL -- another row ("Cannabis Science and Technology RSS",
-- id cc81660b) already exists, is active, and already points at the
-- correct feed (https://www.cannabissciencetech.com/rss). Deactivated the
-- redundant row rather than create a duplicate crawl of the same feed.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703180000','url_remediation_batch12_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703180000_url_remediation_batch12_stub.sql

-- RECOVERY BEGIN 20260703190000_url_remediation_batch13_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 13).
--
-- UC Davis Cannabis -> old ucdavis.edu/cannabis/feed dead. Confirmed real
-- content at cannabis.ucdavis.edu (Cannabis and Hemp Research Center) via
-- search index. Note for future reference: some subpaths on this domain
-- redirect into the general UC Davis Office of Research policy section
-- rather than staying on the dedicated center site -- if this breaks
-- again, check for a redirect before assuming the domain itself is dead.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703190000','url_remediation_batch13_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703190000_url_remediation_batch13_stub.sql

-- RECOVERY BEGIN 20260703200000_url_remediation_batch14_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 14).
--
-- Jamaica Official Gazette: old jis.gov.jm/official-gazette/ path dead.
-- Replaced with laws.moj.gov.jm/library/gazettes (Ministry of Justice's
-- Laws of Jamaica gazette library), confirmed via direct search-index
-- snippet showing real gazette content. NOT independently fetch-verified
-- this round (flagged honestly in verification_notes) -- worth a direct
-- check next time this row is touched.
--
-- Note: Jamaica already has 5 other well-configured cannabis-specific
-- sources (CLA at both cla.gov.jm and cla.org.jm, licensees list,
-- procurement/tenders, parliament joint select committee) -- this was
-- the one broken row in an otherwise healthy cluster.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703200000','url_remediation_batch14_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703200000_url_remediation_batch14_stub.sql

-- RECOVERY BEGIN 20260703210000_url_remediation_batch15_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 15).
--
-- Nebraska Cannabis Regulator -> old dhhs.ne.gov/cannabis path dead.
-- Significant upgrade, not just a URL swap: Nebraska now has an actual
-- Medical Cannabis Commission (under the Liquor Control Commission),
-- created by voter Initiatives 437/438 (effective Dec 2024). DHHS retains
-- some physician-certification authority but per research explicitly
-- opposes the program and is not the primary regulator. Redirected to
-- lcc.nebraska.gov/medical-cannabis/overview instead. Active litigation
-- pending at the NE Supreme Court (Kuehn v. Evnen) as of early 2026 -- a
-- genuinely live regulatory situation worth tracking closely.
--
-- Virginia VDACS Cannabis -> old path dead, replaced with verified
-- current VDACS industrial hemp page. Note: this entry is specifically
-- scoped to VDACS/hemp -- Virginia's actual adult-use cannabis regulator
-- is a separate body, the Cannabis Control Authority (cca.virginia.gov),
-- not currently represented anywhere in the registry. Worth adding as its
-- own distinct source for broader Virginia cannabis coverage.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703210000','url_remediation_batch15_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703210000_url_remediation_batch15_stub.sql

-- RECOVERY BEGIN 20260703220000_url_remediation_batch16_final_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 16).
-- This closes out the source_registry_health worklist pulled at the start
-- of this URL remediation effort.
--
-- Analytical Cannabis: DEACTIVATED, not a URL problem. The publication
-- shut down entirely (confirmed via their own LinkedIn: "we have made the
-- difficult decision to close down our platform"). Their domain now
-- redirects to parent Technology Networks, a general life-sciences site
-- with no cannabis-specific focus. No URL restores this source's original
-- function.
--
-- WCO HS Nomenclature: VERIFIED, no change needed. URL is correct and
-- current (2022 remains the active edition; 2028 edition not yet in
-- force). Original connection-reset error appears transient on WCO's
-- infrastructure -- resolved cleanly via direct fetch with real content.
-- Noted for future reference: WCO already has a live "HS Nomenclature
-- 2028 Edition" page in navigation -- worth updating proactively when
-- that edition takes effect rather than waiting for this to break again.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703220000','url_remediation_batch16_final_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703220000_url_remediation_batch16_final_stub.sql

-- RECOVERY BEGIN 20260703230000_url_remediation_batch17_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 17).
--
-- UNODC Drug Policy News -> old specific sub-path dead. Replaced with the
-- main UNODC homepage (unodc.org), verified live and very current (World
-- Drug Report 2026 coverage as of late June 2026). More durable long-term
-- source than a specific dated article path.
--
-- 14 more items remain in this fresh worklist pull: Indiana, South
-- Dakota, Texas DSHS, Johns Hopkins Cannabis (dead domain), California
-- Cannabis Open Data, Colorado MED (403), Uruguay IRCCA (TLS error, likely
-- worker-side per the CIHR pattern from earlier), EU TARIC, ASA Americans
-- for Safe Access (timeout), Vicente Sederberg Blog (429), Netherlands
-- Customs, UCLA Cannabis Research (dead domain), Colorado Cannabis Open
-- Data (403), Newfoundland NLC (mistagged as USA -- actually Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703230000','url_remediation_batch17_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703230000_url_remediation_batch17_stub.sql

-- RECOVERY BEGIN 20260703240000_url_remediation_batch18_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 18).
--
-- Johns Hopkins Cannabis -> old jhcannabis.org domain dead (DNS failure).
-- Real, current lab site is jhcannabissciencelab.com. Verified live with
-- detailed, current ongoing clinical study listings (cannabis edibles,
-- CBD/smoking cessation, cannabis use disorder research).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703240000','url_remediation_batch18_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703240000_url_remediation_batch18_stub.sql

-- RECOVERY BEGIN 20260703250000_url_remediation_batch19_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 19).
--
-- UCLA Cannabis Research -> old domain/name dead. The program itself was
-- renamed and restructured, not just a URL change: "UCLA Cannabis
-- Research Initiative" (under Dr. Jeff Chen) became "UCLA Center for
-- Cannabis and Cannabinoids" (under Dr. Ziva Cooper, within the Semel
-- Institute for Neuroscience and Human Behavior). Real current site is
-- cannabis.semel.ucla.edu, confirmed via search index with active study
-- listings.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703250000','url_remediation_batch19_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703250000_url_remediation_batch19_stub.sql

-- RECOVERY BEGIN 20260703260000_url_remediation_batch20_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 20).
--
-- Uruguay IRCCA: DEACTIVATED. Confirmed robots.txt disallowed on
-- ircca.gub.uy directly -- same class as TGA/ODC/ISP Chile/Sejm, not a
-- URL fix. Original stored error was a TLS UnknownIssuer cert error
-- rather than a robots message, suggesting the capture worker's TLS
-- handshake may be failing before it even reaches the robots check --
-- possibly a genuine cert misconfiguration on Uruguay's government
-- server, separate from the access block itself. Either way, not
-- resolvable via a URL change.
--
-- Remaining in the current worklist, not yet addressed: Indiana, South
-- Dakota, Texas DSHS, California Cannabis Open Data, Colorado MED (403),
-- Colorado Cannabis Open Data (403, same domain as MED -- likely one root
-- cause), EU TARIC, ASA Americans for Safe Access (timeout), Vicente
-- Sederberg Blog (429), Netherlands Customs, Newfoundland NLC (mistagged
-- as USA, actually Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703260000','url_remediation_batch20_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703260000_url_remediation_batch20_stub.sql

-- RECOVERY BEGIN 20260703270000_url_remediation_batch21_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 21).
--
-- Colorado's 3 broken sbg.colorado.gov/med* rows: confirmed via search
-- index that MED restructured onto a dedicated med.colorado.gov domain
-- (current content as of May 2026). Fixed the primary "Colorado MED
-- Regulator" row to the new homepage. The other two (Market Data,
-- Cannabis Open Data/licensed-facilities) hit a unique-constraint
-- violation attempting the same fix -- deactivated as redundant with the
-- homepage fix rather than guess at unconfirmed new sub-paths. Worth a
-- follow-up pass to find the exact statistics/licensed-facilities
-- equivalents on the new domain if that granularity is wanted.
--
-- Remaining in the current worklist, not yet addressed: Indiana, South
-- Dakota, Texas DSHS, California Cannabis Open Data, EU TARIC, ASA
-- Americans for Safe Access (timeout), Vicente Sederberg Blog (429),
-- Netherlands Customs, Newfoundland NLC (mistagged as USA, actually
-- Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703270000','url_remediation_batch21_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703270000_url_remediation_batch21_stub.sql

-- RECOVERY BEGIN 20260703280000_url_remediation_batch22_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 22).
--
-- Indiana Cannabis Regulator -> old path dead. Replaced with the current
-- Indiana State Department of Agriculture hemp program page (administered
-- by the Office of Indiana State Chemist), confirmed via search index as
-- live with April 2026 content. Not independently fetch-verified this
-- round due to search-budget cost.
--
-- Remaining, not yet addressed: South Dakota, Texas DSHS, California
-- Cannabis Open Data, EU TARIC, ASA Americans for Safe Access (timeout),
-- Vicente Sederberg Blog (429), Netherlands Customs, Newfoundland NLC
-- (mistagged as USA, actually Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703280000','url_remediation_batch22_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703280000_url_remediation_batch22_stub.sql

-- RECOVERY BEGIN 20260703290000_url_remediation_batch23_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 23).
--
-- South Dakota Cannabis Regulator -> old path dead. Replaced with the SD
-- Department of Health medical cannabis program page, confirmed via
-- search index with very current content (April 2026 patient statistics,
-- 18,867 patients / 577 caregivers / 206 providers).
--
-- Remaining, not yet addressed: Texas DSHS, California Cannabis Open
-- Data, EU TARIC, ASA Americans for Safe Access (timeout), Vicente
-- Sederberg Blog (429), Netherlands Customs, Newfoundland NLC (mistagged
-- as USA, actually Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703290000','url_remediation_batch23_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703290000_url_remediation_batch23_stub.sql

-- RECOVERY BEGIN 20260703300000_url_remediation_batch24_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 24).
--
-- Texas DSHS Cannabis -> old path dead. Fixed to the correct current DSHS
-- page (Low-THC Cannabis Medical Use), distinct from DPS which is a
-- separate agency running licensing/CURT. Confirmed via search index.
--
-- Notable context surfaced: HB 46 (signed Jun 2025, effective Sep 2025)
-- significantly expanded TCUP -- added chronic pain/Crohn's/TBI/hospice
-- as qualifying conditions, raised licensee count from 3 to 15, added
-- inhalation as a delivery method. Separately, a Mar 31 2026 enforcement
-- deadline on smokable hemp products (Executive Order GA-56) just took
-- effect -- a related but distinct hemp-retail crackdown that does not
-- affect TCUP medical patients.
--
-- Remaining, not yet addressed: California Cannabis Open Data, EU TARIC,
-- ASA Americans for Safe Access (timeout), Vicente Sederberg Blog (429),
-- Netherlands Customs, Newfoundland NLC (mistagged as USA, actually
-- Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703300000','url_remediation_batch24_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703300000_url_remediation_batch24_stub.sql

-- RECOVERY BEGIN 20260703310000_url_remediation_batch25_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 25).
--
-- California Cannabis Open Data -> old path dead. Replaced with DCC's
-- official data dashboard hub (licensing, harvest, sales statistics
-- compiled in-house from track-and-trace), confirmed via search index.
--
-- Notable market context surfaced: AB 564 (signed Sep 2025) reversed a
-- 25% excise tax hike, setting the rate at 15% through 2028. California
-- H1 2026 licensed sales ~$1.95B (Q1 down slightly YoY to $956.7M); DCC
-- itself estimates only ~40% of state cannabis consumption flows through
-- licensed retail, with unlicensed operators selling roughly 1.5x volume
-- at lower prices without testing/licensing/tax obligations.
--
-- Remaining, not yet addressed: EU TARIC, ASA Americans for Safe Access
-- (timeout), Vicente Sederberg Blog (429), Netherlands Customs,
-- Newfoundland NLC (mistagged as USA, actually Canadian).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703310000','url_remediation_batch25_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703310000_url_remediation_batch25_stub.sql

-- RECOVERY BEGIN 20260703320000_url_remediation_batch26_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 26).
--
-- Newfoundland NLC Cannabis -> old nlc.ca domain entirely dead. Real
-- corporate domain is nlliquorcorp.com. Confirmed via search index, real
-- 2026 content. Bonus: live news release (3 weeks old at check time) on
-- NLC issuing a call for new Tier 4 licensed cannabis retailers across 15
-- rural/underserved areas, applications due Jul 4 2026 -- genuinely
-- current market-expansion intelligence.
--
-- Remaining, not yet addressed: EU TARIC, ASA Americans for Safe Access
-- (timeout), Vicente Sederberg Blog (429), Netherlands Customs.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703320000','url_remediation_batch26_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703320000_url_remediation_batch26_stub.sql

-- RECOVERY BEGIN 20260703330000_url_remediation_batch27_stub.sql
-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 27).
--
-- ASA Americans for Safe Access: VERIFIED, no change needed. URL is
-- correct and current (safeaccessnow.org, real June 2026 content on AG
-- Order No. 6754-2026 rescheduling cannabis to Schedule III). Original
-- timeout error appears transient, not a persistent block.
--
-- Remaining, not yet addressed: EU TARIC, Vicente Sederberg Blog (429),
-- Netherlands Customs.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260703330000','url_remediation_batch27_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260703330000_url_remediation_batch27_stub.sql

-- RECOVERY BEGIN 20260704000000_ia_source_embeddings.sql
-- =============================================================================
-- ia_source_embeddings: OpenAI text-embedding-3-small 1536-dim embeddings for ia_sources
-- =============================================================================
-- Separate from hv_embeddings (artifact search) and ia_signal_embeddings (signals).
-- Enables semantic search over evidence sources from the Evidence Sources page.
--
-- Pipeline:  ia_sources → (embed cron or backfill script) → ia_source_embeddings
-- Search:    ia_search_sources(p_query_embedding) → ranked source rows

CREATE TABLE IF NOT EXISTS public.ia_source_embeddings (
  source_id   text         PRIMARY KEY
                           REFERENCES public.ia_sources(id) ON DELETE CASCADE,
  embedding   vector(1536) NOT NULL,
  model       text         NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- HNSW cosine-distance index (params match idx_hv_embeddings_hnsw)
CREATE INDEX IF NOT EXISTS idx_ia_source_embeddings_hnsw
  ON public.ia_source_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.ia_source_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_source_embeddings_admin_operator_all ON public.ia_source_embeddings;
CREATE POLICY ia_source_embeddings_admin_operator_all
  ON public.ia_source_embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  );

-- Service-role access for the embedding pipeline (bypasses RLS)
GRANT SELECT, INSERT, UPDATE ON public.ia_source_embeddings TO service_role;

-- ── Semantic search RPC ───────────────────────────────────────────────────────
-- Returns ia_sources ordered by cosine similarity to a query embedding.
-- Optional filter: p_category limits to a specific source category.
CREATE OR REPLACE FUNCTION public.ia_search_sources(
  p_query_embedding  vector(1536),
  p_match_count      integer DEFAULT 30,
  p_category         text    DEFAULT NULL
)
RETURNS TABLE (
  source_id   text,
  name        text,
  category    text,
  markets     text[],
  reliability text,
  similarity  double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.name,
      s.category,
      s.markets,
      s.reliability,
      (1 - (e.embedding <=> p_query_embedding))::double precision AS similarity
    FROM public.ia_source_embeddings e
    JOIN public.ia_sources s ON s.id = e.source_id
    WHERE s.status = 'active'
      AND (p_category IS NULL OR s.category = p_category)
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704000000','ia_source_embeddings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704000000_ia_source_embeddings.sql

-- RECOVERY BEGIN 20260704020617_run_daily_digest_function.sql
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
-- version 20260704020617.
--
-- Rewriting this file cannot affect production: 20260704020617 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function public.run_daily_digest()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  -- already published today: no-op
  if exists (select 1 from daily_digest where digest_date = current_date) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- COLLECT phase: pending job for today with a response?
  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    -- expire stale (>1h, no response)
    update _digest_jobs j set collected = true
    where j.digest_date = current_date and not j.collected
      and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids,
             (r.content::jsonb -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h)
      from ok o
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o
      where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    done as (
      update _digest_jobs j set collected = true
      from parsed p
      where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  -- FIRE phase
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
    timeout_milliseconds := 60000
  );

  insert into _digest_jobs (request_id, digest_date, signal_ids)
  values (v_req, current_date, v_signal_ids);

  return jsonb_build_object('ok',true,'phase','fire','request_id',v_req,'signals_sent',jsonb_array_length(v_signals));
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704020617','run_daily_digest_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704020617_run_daily_digest_function.sql

-- RECOVERY BEGIN 20260704083652_ia_source_embeddings.sql
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
-- version 20260704083652.
--
-- Rewriting this file cannot affect production: 20260704083652 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- =============================================================================
-- ia_source_embeddings: OpenAI text-embedding-3-small 1536-dim embeddings for ia_sources
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ia_source_embeddings (
  source_id   text         PRIMARY KEY
                           REFERENCES public.ia_sources(id) ON DELETE CASCADE,
  embedding   vector(1536) NOT NULL,
  model       text         NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ia_source_embeddings_hnsw
  ON public.ia_source_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE public.ia_source_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_source_embeddings_admin_operator_all ON public.ia_source_embeddings;
CREATE POLICY ia_source_embeddings_admin_operator_all
  ON public.ia_source_embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.ia_source_embeddings TO service_role;

CREATE OR REPLACE FUNCTION public.ia_search_sources(
  p_query_embedding  vector(1536),
  p_match_count      integer DEFAULT 30,
  p_category         text    DEFAULT NULL
)
RETURNS TABLE (
  source_id   text,
  name        text,
  category    text,
  markets     text[],
  reliability text,
  similarity  double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.name,
      s.category,
      s.markets,
      s.reliability,
      (1 - (e.embedding <=> p_query_embedding))::double precision AS similarity
    FROM public.ia_source_embeddings e
    JOIN public.ia_sources s ON s.id = e.source_id
    WHERE s.status = 'active'
      AND (p_category IS NULL OR s.category = p_category)
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704083652','ia_source_embeddings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704083652_ia_source_embeddings.sql

-- RECOVERY BEGIN 20260704093341_ia_sources_live_view.sql
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
-- version 20260704093341.
--
-- Rewriting this file cannot affect production: 20260704093341 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Wire the admin Source Registry to the REAL 1134-row crawler source table
-- (source_registry) instead of the disconnected 12-row ia_sources seed table.
-- Shaped to exactly match what lib/intelligence-automation/db.ts::rowToSource()
-- already expects, so the only app change needed is repointing one path string.

create or replace view ia_sources_live as
select
  id::text as id,
  source_name as name,
  source_type as category,
  array_remove(array[country, region], null) as markets,
  case
    when network_status = 'online' and coalesce(consecutive_failures,0) = 0 then 'high'
    when network_status in ('online','degraded') and coalesce(consecutive_failures,0) <= 2 then 'medium'
    when coalesce(consecutive_failures,0) > 2 then 'low'
    else 'unverified'
  end as reliability,
  last_checked_at as last_checked,
  next_crawl_at as next_check,
  (select count(*)::int from ia_signals s where s.source_name = source_registry.source_name) as signal_yield,
  case
    when not is_active then 'paused'
    when relevance_status = 'blocked' then 'deprecated'
    when relevance_status = 'needs_review' or network_status = 'degraded' then 'needs_review'
    else 'active'
  end as status,
  notes
from source_registry;

grant select on ia_sources_live to service_role, authenticated, anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704093341','ia_sources_live_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704093341_ia_sources_live_view.sql

-- RECOVERY BEGIN 20260704093401_sync_ia_market_graph_function.sql
-- Applied directly to DB. Stub for CLI reconciliation.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704093401','sync_ia_market_graph_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704093401_sync_ia_market_graph_function.sql

-- RECOVERY BEGIN 20260704094737_expose_enqueue_regulatory_enrichment.sql
-- ============================================================
-- PostgREST on this project only exposes the `api` schema (see
-- lib/supabase/env.ts). public.enqueue_regulatory_enrichment()
-- is therefore unreachable from the Vercel cron route as-is.
-- This adds a minimal api-schema wrapper so the Vercel cron can
-- call it via the standard supabase-js .rpc() path, matching the
-- SUPABASE_DB_SCHEMA='api' convention used everywhere else in
-- this codebase.
-- ============================================================

create or replace function api.enqueue_regulatory_enrichment()
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.enqueue_regulatory_enrichment();
$$;

comment on function api.enqueue_regulatory_enrichment() is
  'PostgREST-exposed wrapper for public.enqueue_regulatory_enrichment(). '
  'Called by the Vercel cron at /api/cron/regulatory-enrichment. '
  'Enqueues prioritized public.intelligence_jobs rows (job_type = '
  'regulatory_format_enrichment) from v_regulatory_format_stale.';

-- service_role only: this is an internal admin/cron operation, not
-- something anon or authenticated end users should be able to trigger.
revoke all on function api.enqueue_regulatory_enrichment() from public;
grant execute on function api.enqueue_regulatory_enrichment() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704094737','expose_enqueue_regulatory_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704094737_expose_enqueue_regulatory_enrichment.sql

-- RECOVERY BEGIN 20260704110000_url_health_remediation_batch4_stub.sql
-- Applied directly to production via Supabase MCP (Jul 4 2026 session, batch 4).
-- Continuation of 20260703060000 / 20260703070000 / 20260703080000. Same verified-only method.
--
-- Chile: all 6 tracked sources (MercadoPublico, Diario Oficial, ISP x2, SEA,
-- Senado Comisión de Salud) checked -- zero active errors found
-- (consecutive_failures=0, network_status=online across the board). No action
-- needed; noted rather than skipped so this cluster isn't re-checked
-- unnecessarily next pass.
--
-- Canada: 5 sources in active error state investigated.
--
-- Fixed (1, confirmed via direct fetch of the replacement URL):
--   Cova Software Blog -- old /blog/feed/ path 404s. Site runs on HubSpot,
--   not WordPress, so no native /feed/ alias exists. Verified live feed at
--   /blog/rss.xml -- fresh post dated Jul 2 2026 confirms it's actively
--   maintained, not just reachable.
--
-- Deactivated (3), each a distinct new failure class rather than a stale URL:
--
--   Lift & Co Canada -- the configured domain (liftco.ca) belongs to an
--   unrelated Mississauga forklift-equipment rental company, confirmed
--   directly. The actual intended entity, Lift & Co. Corp. (TSXV:LIFT),
--   filed for bankruptcy in Nov 2021 (officers resigned "in any capacity"
--   per contemporary reporting); its real domain, lift.co, has since been
--   repurposed by an unrelated "Poof Marketplace" venture. No live
--   successor exists to fix to.
--
--   Montreal Gazette Cannabis -- the montrealgazette.com/cannabis/ tag page
--   no longer exists (zero search-index presence, vs. the identical URL
--   pattern still live on vancouversun.com as a useful control). Coverage
--   appears to have consolidated into TheGrowthOp.com, Postmedia's shared
--   cannabis vertical, already tracked separately in this registry and
--   healthy. Fixing the URL would just create a duplicate of an existing
--   tracked source.
--
--   Quebec RACJ Cannabis -- verified RACJ's actual statutory mandate
--   (alcool, courses, jeux -- alcohol, racing, gaming/lottery, combat
--   sports) has never included cannabis. Quebec cannabis regulation runs
--   through the Ministère de la Santé et des Services sociaux (legislative)
--   and the SQDC retail monopoly, the latter already tracked separately in
--   this registry and healthy. Wrong-agency source from the start, not a
--   URL that went stale.
--
-- Left active, NOT deactivated (1) -- new failure class, distinct from
-- prior 403/TLS-handshake capture-worker issues:
--
--   Toronto Star Cannabis -- HTTP 429 (rate-limited / bot-detected on
--   thestar.com), not a dead or wrong URL. Same "not a stale-URL problem"
--   bucket as 403/TLS errors, but specifically needs backoff/retry handling
--   at the capture-worker level rather than a URL fix or deactivation --
--   deactivating would permanently lose a legitimate, currently-publishing
--   source over what is likely an intermittent throttle.
--
-- Two new patterns for the failure-class table, beyond 404 / no-coverage /
-- robots.txt:
--   - Domain squatted or entity defunct: the configured URL resolves to a
--     real site, but not the one the source was meant to track (business
--     folded, or the domain-naming assumption was simply wrong at seed
--     time). Fix: deactivate -- no URL swap can fix a source built on a
--     wrong premise.
--   - Wrong regulator entirely: the source was pointed at a real government
--     body with a real, working website, but that body has no jurisdiction
--     over the topic. Fix: deactivate; check whether the correct body is
--     already tracked before considering adding a new source.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704110000','url_health_remediation_batch4_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704110000_url_health_remediation_batch4_stub.sql

-- RECOVERY BEGIN 20260704120000_url_health_remediation_batch5_stub.sql
-- Applied directly to production via Supabase MCP (Jul 4 2026 session, batch 5).
-- Continuation of 20260703060000 / 070000 / 080000 / 20260704110000.
--
-- Correction, not a fix: the "10 Reddit sources failing 403/429" framing
-- carried into this session did not match the live registry. Checked all 12
-- reddit.com rows directly: 10 (the r/xxx-pattern ones) are already
-- is_active=false, and the 2 that remain active (Alabama Cannabis Reddit,
-- Alaska Cannabis Reddit) show zero failures right now. No write made here --
-- there was nothing live to fix. Keeping the diagnosis on record for if this
-- cluster actually breaks again: the capture worker's self-identifying UA
-- (HarbourviewSourceEngine/2.1) is exactly what Reddit's Cloudflare
-- fingerprinting is built to catch; spoofing a browser UA to defeat that is
-- out of bounds for this pipeline the same way robots.txt evasion is, and
-- wouldn't fully work anyway (fingerprinting isn't UA-string-only). The
-- legitimate path is Reddit's OAuth API, which requires a developer app
-- registered under Tyler's own Reddit account -- not something this session
-- can self-serve.
--
-- Confirmed, not re-fixed: source_registry_health's fetch_status handling
-- (success/extracted/extract_failed all count as fetch_ok, only error
-- doesn't) is already live in the view definition. Hemp Benchmarks RSS
-- reads correctly as 0 failures under it. Practical implication: the
-- original ~30% international success-rate baseline was measured before
-- this fix existed and is very likely stale-pessimistic; worth re-measuring
-- once the current worklist is cleared rather than trusting that number
-- going forward.
--
-- 3 fixes (all verified live via direct fetch before writing):
--
--   Alabama Cannabis Regulator (AMCC) -- alabamamedicalcannabis.com never
--   resolved (fetch failed / DNS). Not a domain that ever belonged to the
--   agency -- a plausible-looking .com guessed at seed time. Real site is
--   amcc.alabama.gov (WordPress, state-standard agency.alabama.gov
--   pattern), pointed at /news/.
--
--   Kentucky Cannabis Regulator -- kda.ky.gov (Dept. of Agriculture) has no
--   cannabis mandate; same wrong-agency pattern as Quebec RACJ in batch 4.
--   Real regulator is the Office of Medical Cannabis under the Cabinet for
--   Health and Family Services, kymedcan.ky.gov, actively posting
--   announcements into 2026.
--
--   Massachusetts CCC -- mass.gov/cannabis-control-commission 403s; the
--   mass.gov path moved to /orgs/cannabis-control-commission and mass.gov
--   itself appears to bot-block regardless of path. CCC runs its own
--   dedicated site, masscannabiscontrol.com, which fetches cleanly with no
--   block -- pointed at /news/.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704120000','url_health_remediation_batch5_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704120000_url_health_remediation_batch5_stub.sql

-- RECOVERY BEGIN 20260704130000_url_health_remediation_batch6_stub.sql
-- Applied directly to production via Supabase MCP (Jul 4 2026 session, batch 6).
-- Continuation of 20260703060000 / 070000 / 080000 / 20260704110000 / 120000.
--
-- Meta-finding, applies retroactively to batches 1-4: source_registry's own
-- consecutive_failures/network_status columns are not reliable for finding
-- the real worklist -- they can sit stale for weeks after a source is
-- actually fixed, and conversely can miss sources that source_registry_health
-- (the corrected view, see batch 5) catches. Batch 4's "Chile: all 6 sources
-- clean" conclusion was WRONG -- it was based on those raw columns. Treat
-- source_registry_health as canonical going forward, not the raw registry
-- columns.
--
-- Re-checked all 7 previously-touched countries (Colombia, Brazil, Botswana,
-- Argentina, Australia, Canada, Chile) against source_registry_health:
--
-- False positives -- already correctly fixed, just stale (no action taken):
--   ANMAT Argentina, Brazil ANVISA -- both show the correct post-fix URL in
--   source_registry_health, but their last recorded crawl attempt predates
--   the fix by 2+ weeks (crawler hasn't retried since). Not a URL problem.
--   Worth a separate look at why tier-1 sources go 2+ weeks between crawl
--   attempts even while active -- may be a cadence/scheduling issue distinct
--   from URL health.
--
-- Deactivated (2), both root-caused to patterns already established:
--
--   Botswana Government Gazette -- same gazettes.africa fire/stale-archive
--   issue already documented for Benin, Burundi, CAR, Chad, Comoros, and
--   Cameroon in batch 2, just not applied to Botswana at the time. The
--   country page loads fine but content stops in 2021. Guinea and Ghana use
--   the same domain and are very likely the same issue -- confirm before
--   re-investigating from scratch.
--
--   Senado Chile — Comisión de Salud -- old URL dead; the modern equivalent
--   (tramitacion.senado.cl, same committee id) disallows automated access
--   via robots.txt. Same class as TGA/ODC in batch 3. No write to Supabase
--   was needed beyond the deactivation itself -- no fixable URL exists.
--
-- NOT fixed, and NOT deactivated -- new, more concerning finding:
--
--   BC LCRB Cannabis -- the currently configured URL
--   (www2.gov.bc.ca/gov/content/employment-business/business/liquor-regulation-licensing)
--   is verified live and correct via direct fetch just now. The capture
--   worker has nonetheless logged http_404 against it on every attempt for
--   the last month, including this morning. This is not a stale-URL
--   problem -- the URL is right. Left as-is (changing it would be wrong)
--   and flagged for engineering: possible disguised bot-block returning 404
--   instead of 403 on gov.bc.ca, or a capture-worker redirect-handling bug.
--   Implication worth sitting with: some other rows currently classified as
--   "verify_replacement_url" (404) in source_registry_health may be the same
--   kind of false 404, not genuinely dead links -- that suggested_action
--   label is a starting hypothesis, not a verified diagnosis.
--
-- Not yet investigated, carried forward as the next pass (all confirmed
-- currently failing in source_registry_health, not touched by batches 1-4):
--   Congreso Argentina — Comisión de Salud
--   Senado Federal Brasil — Comissão de Assuntos Sociais
--   Consejo Nacional de Estupefacientes Colombia
--   Senado Colombia — Comisión Primera
--   Cámara de Representantes Colombia — Comisión Séptima
--   MinJusticia Colombia — Resoluciones Cannabis (possible near-duplicate of
--     Colombia MinJusticia Cannabis -- same domain, worth checking for
--     consolidation rather than fixing both independently)
--   ProColombia — Cannabis Export Intelligence
--   INVIMA – Colombia (RSS)
--   Australian Hemp Council (AHC) -- DNS failure, not yet checked
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704130000','url_health_remediation_batch6_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704130000_url_health_remediation_batch6_stub.sql

-- RECOVERY BEGIN 20260704133107_counterparty_extraction_and_scoring.sql
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
-- version 20260704133107.
--
-- Rewriting this file cannot affect production: 20260704133107 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

alter table ia_signals add column if not exists counterparty_extracted_at timestamptz;

create table if not exists _counterparty_jobs (
  request_id bigint primary key,
  signal_ids text[] not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.run_signal_counterparty_extraction()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_inserted int := 0;
  v_pre text := 'You extract named commercial counterparties from cannabis industry intelligence signals for a B2B relationship-memory system. Below is a JSON array of qualified signals. For each signal that names a SPECIFIC company, brand, or named regulator/agency (not a generic unnamed reference), extract one counterparty record. Classify role as exactly one of: buyer, seller, importer, distributor, supplier, consultant, equipment_vendor, packaging_supplier, logistics_provider, market_access_partner (use market_access_partner for named regulators/agencies). Skip signals with no clearly named entity — most signals should be skipped. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"name": string, "role": string, "market": string, "category": string (short tag e.g. licensing, enforcement, market_entry, supply), "signal_id": string}. If none qualify, return [].';
begin
  -- COLLECT phase
  perform 1 from _counterparty_jobs j where not j.collected;
  if found then
    update _counterparty_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids,
             (r.content::jsonb -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _counterparty_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
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
    select count(*) from ins into v_inserted;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok', false, 'reason', 'anthropic_api_key not in vault'); end if;

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

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
    timeout_milliseconds := 60000
  );

  insert into _counterparty_jobs (request_id, signal_ids) values (v_req, v_signal_ids);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'request_id', v_req, 'signals_sent', jsonb_array_length(v_signals));
end;
$function$;

-- Deterministic scoring recompute — pure SQL, no LLM needed, safe to run often.
create or replace function public.sync_ia_scoring()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count int;
begin
  with scored as (
    select
      id, name, role, interaction_count, introduction_count, documentation_status, last_interaction, markets,
      least(100, interaction_count * 15 + case documentation_status when 'complete' then 25 when 'partial' then 10 else 0 end) as fit,
      case documentation_status when 'complete' then 90 when 'partial' then 55 else 20 end as readiness,
      least(100, interaction_count * 10 + introduction_count * 15) as trust,
      coalesce(current_date - last_interaction, 999) as days_since
    from ia_counterparties
  )
  insert into ia_scoring_records (
    id, counterparty_id, counterparty_name, counterparty_role,
    fit_score, readiness_score, trust_score,
    routing_priority, follow_up_priority, introduction_priority,
    market_access_relevance, scored_at, score_drivers
  )
  select
    'sc-' || id, id, name, role,
    fit, readiness, trust,
    case when fit >= 70 then 'high' when fit >= 40 then 'medium' else 'low' end,
    case when interaction_count = 0 then 'dormant'
         when days_since <= 14 then 'urgent'
         when days_since <= 30 then 'soon'
         else 'when_ready' end,
    case when fit >= 70 and trust >= 60 then 'high'
         when fit >= 40 and trust >= 30 then 'medium'
         when fit > 0 then 'low'
         else 'not_ready' end,
    markets, current_date,
    array_remove(array[
      interaction_count || ' recorded interaction(s)',
      case documentation_status when 'complete' then 'documentation complete' when 'partial' then 'documentation partial' else null end,
      case when introduction_count > 0 then introduction_count || ' introduction(s) made' else null end
    ], null)
  from scored
  on conflict (id) do update set
    fit_score              = excluded.fit_score,
    readiness_score         = excluded.readiness_score,
    trust_score             = excluded.trust_score,
    routing_priority        = excluded.routing_priority,
    follow_up_priority      = excluded.follow_up_priority,
    introduction_priority   = excluded.introduction_priority,
    market_access_relevance = excluded.market_access_relevance,
    scored_at               = excluded.scored_at,
    score_drivers           = excluded.score_drivers,
    updated_at              = now();
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'scored', v_count);
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704133107','counterparty_extraction_and_scoring','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704133107_counterparty_extraction_and_scoring.sql

-- RECOVERY BEGIN 20260704135057_fix_unprotected_http_content_cast.sql
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
-- version 20260704135057.
--
-- Rewriting this file cannot affect production: 20260704135057 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Bug: `r.content::jsonb` was a raw, unprotected cast — if the HTTP response
-- body (Anthropic API, proxy error page, truncated body, etc.) isn't valid
-- JSON despite status_code=200, this cast throws BEFORE safe_to_jsonb() ever
-- gets a chance to run, killing the whole function call. safe_to_jsonb() was
-- only protecting the inner Claude-text parse, not the outer HTTP-body parse.
-- Measured impact: 23 of 82 run_signal_extraction() calls failed this way
-- over the last 3 days (28%). run_daily_digest() and
-- run_signal_counterparty_extraction() (built this session) copied the same
-- unprotected pattern — fixing all three uniformly.

create or replace function public.run_signal_extraction(p_fire_limit integer DEFAULT 25)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

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
           (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text
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

  insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url)
  select net.http_post(
    url:='https://api.anthropic.com/v1/messages',
    headers:=jsonb_build_object('x-api-key',v_key,'anthropic-version','2023-06-01','content-type','application/json'),
    body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
      'messages',jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
        || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
    timeout_milliseconds:=60000
  ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url
  from source_snapshots s
  left join source_registry sr on sr.id=s.source_id
  where s.processing_status='pending' and s.fetch_status='success'
    and s.id::text not in (select snapshot_id from _sig_extract_jobs)
  order by s.created_at desc limit p_fire_limit;
  get diagnostics v_fired = row_count;

  return jsonb_build_object('ok',true,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end $function$;

-- Same fix in run_daily_digest()
create or replace function public.run_daily_digest()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    update _digest_jobs j set collected = true
    where j.digest_date = current_date and not j.collected
      and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h)
      from ok o
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o
      where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    done as (
      update _digest_jobs j set collected = true
      from parsed p
      where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
    timeout_milliseconds := 60000
  );

  insert into _digest_jobs (request_id, digest_date, signal_ids)
  values (v_req, current_date, v_signal_ids);

  return jsonb_build_object('ok',true,'phase','fire','request_id',v_req,'signals_sent',jsonb_array_length(v_signals));
end $function$;

-- Same fix in run_signal_counterparty_extraction()
create or replace function public.run_signal_counterparty_extraction()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_inserted int := 0;
  v_pre text := 'You extract named commercial counterparties from cannabis industry intelligence signals for a B2B relationship-memory system. Below is a JSON array of qualified signals. For each signal that names a SPECIFIC company, brand, or named regulator/agency (not a generic unnamed reference), extract one counterparty record. Classify role as exactly one of: buyer, seller, importer, distributor, supplier, consultant, equipment_vendor, packaging_supplier, logistics_provider, market_access_partner (use market_access_partner for named regulators/agencies). Skip signals with no clearly named entity — most signals should be skipped. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"name": string, "role": string, "market": string, "category": string (short tag e.g. licensing, enforcement, market_entry, supply), "signal_id": string}. If none qualify, return [].';
begin
  perform 1 from _counterparty_jobs j where not j.collected;
  if found then
    update _counterparty_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _counterparty_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
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
    select count(*) from ins into v_inserted;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok', false, 'reason', 'anthropic_api_key not in vault'); end if;

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

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
    timeout_milliseconds := 60000
  );

  insert into _counterparty_jobs (request_id, signal_ids) values (v_req, v_signal_ids);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'request_id', v_req, 'signals_sent', jsonb_array_length(v_signals));
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704135057','fix_unprotected_http_content_cast','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704135057_fix_unprotected_http_content_cast.sql

-- RECOVERY BEGIN 20260704140000_url_health_remediation_batch7_stub.sql
-- Applied directly to production via Supabase MCP (Jul 4 2026 session, batch 7).
-- Continuation of 20260703060000 / 070000 / 080000 / 20260704110000 / 120000 / 130000.
-- Closes out the Colombia cluster (6 sources) plus Brazil and Argentina's
-- remaining committee sources, carried forward from batch 6.
--
-- Fixed (5, all verified live via direct fetch):
--
--   Senado Colombia — Comisión Primera -- old /comision/primera-comision path
--   dead; site restructured to /comisiones/constitucionales/comision-primera.
--
--   Cámara de Representantes Colombia — Comisión Séptima -- old /comision7
--   path dead; current URL verified, 41 current representatives listed.
--
--   ProColombia — Cannabis Export Intelligence -- old /en/opportunities/
--   healthcare/cannabis sector page gone, site restructured. No cannabis-
--   exclusive page currently exists; pointed at the English press room
--   (verified live, dated into Feb 2026), which periodically covers
--   cannabis export news per past coverage. Broader than ideal but real.
--
--   INVIMA – Colombia (RSS) -- old invima.gov.co/rss.xml never resolved.
--   Site is Odoo-based; native press-room feed found and verified at
--   /blog/sala-de-prensa-13/feed, extremely active (posts into Jul 2 2026).
--
--   Senado Federal Brasil — Comissão de Assuntos Sociais -- old www25
--   subdomain path 403s, retired. Replaced with the Senado Notícias tag
--   page for CAS, verified live and current through Jul 3 2026.
--
--   Congreso Argentina — Comisión de Salud -- old /verCom/54 path dead;
--   site renumbered to /info/78. Verified live, meetings logged through
--   Apr 29 2026, current membership listed.
--
-- Deactivated (3):
--
--   Consejo Nacional de Estupefacientes Colombia — Meeting Minutes -- old
--   path dead, and no equivalent structured "minutes" page exists on the
--   current site; CNE activity is only published as scattered press
--   releases. Redundant with Colombia MinJusticia Cannabis.
--
--   MinJusticia Colombia — Resoluciones Cannabis -- pointed at the generic
--   ministry Noticias/ landing page (all topics, not cannabis-specific),
--   duplicative of and worse-scoped than Colombia MinJusticia Cannabis.
--
--   Colombia MinJusticia Cannabis (duplicate row, Noticias/cannabis/feed) --
--   there are two source_registry rows with this exact same name. This one
--   404s consistently, most recently the day before this batch. The other
--   (programas-co/Cannabis-con-fines-medicinales-cientificos-industriales)
--   is verified live and correct. Deactivated the broken duplicate rather
--   than hunting for a third URL for a source with a working sibling.
--
-- Correction to a batch 6 finding: Colombia MinJusticia Cannabis (the
-- surviving programas-co row) was flagged in batch 6 as sharing BC LCRB
-- Cannabis's "correct URL but capture-worker still 404s" anomaly. That was
-- a mis-read caused by filtering snapshot history on source_name instead of
-- id -- with two identically-named rows, the query silently combined both
-- histories. An id-scoped check shows the crawler has simply never
-- attempted this row's actual URL yet (all recorded attempts belong to the
-- other, now-deactivated row). No capture-worker anomaly here; retracting
-- that part of batch 6. The BC LCRB Cannabis finding itself is unaffected
-- and still stands as a real, unresolved anomaly.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704140000','url_health_remediation_batch7_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704140000_url_health_remediation_batch7_stub.sql

-- RECOVERY BEGIN 20260704150014_expose_claim_intelligence_job.sql
-- ============================================================
-- Same class of bug as enqueue_regulatory_enrichment (see prior
-- migration): PostgREST on this project only exposes the `api`
-- schema (lib/supabase/env.ts), but public.claim_intelligence_job()
-- lives in public. lib/intelligence/queue-connector.ts's
-- claimNextJob() calls supabase.rpc('claim_intelligence_job', ...)
-- on a client scoped to db.schema='api', so it would 404/PGRST202
-- the moment anything actually calls it. This adds the same kind
-- of minimal api-schema wrapper, preserving the exact parameter
-- names (p_job_type, p_worker_id) so PostgREST's named-argument
-- dispatch still matches what queue-connector.ts sends.
-- ============================================================

create or replace function api.claim_intelligence_job(p_job_type text, p_worker_id text)
returns setof public.intelligence_jobs
language sql
security definer
set search_path = ''
as $$
  select * from public.claim_intelligence_job(p_job_type, p_worker_id);
$$;

comment on function api.claim_intelligence_job(text, text) is
  'PostgREST-exposed wrapper for public.claim_intelligence_job(). '
  'Called by lib/intelligence/queue-connector.ts claimNextJob(). '
  'Atomically claims the next pending intelligence_jobs row of the '
  'given job_type via FOR UPDATE SKIP LOCKED.';

-- service_role only: job claiming is an internal worker operation,
-- not something anon or authenticated end users should trigger.
revoke all on function api.claim_intelligence_job(text, text) from public;
grant execute on function api.claim_intelligence_job(text, text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704150014','expose_claim_intelligence_job','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704150014_expose_claim_intelligence_job.sql

-- RECOVERY BEGIN 20260704151117_expose_remaining_public_only_rpcs.sql
-- ============================================================
-- Same bug class as the two prior fixes (expose_enqueue_regulatory_
-- enrichment, expose_claim_intelligence_job): PostgREST on this
-- project only exposes the `api` schema (lib/supabase/env.ts), so
-- any function living only in `public` is unreachable from every
-- code path that calls it via supabase-js .rpc() or a raw
-- /rest/v1/rpc/<fn> POST with no Accept-Profile/Content-Profile
-- override — which is every call path in this codebase.
--
-- Full-codebase audit of `.rpc(` / `supabase.rpc(` call sites found
-- five more real instances (parameter names below match each call
-- site exactly, verified against the calling code, so PostgREST's
-- named-argument dispatch still resolves correctly):
--
--   1. check_and_increment_llm_rate_limit  <- lib/llm/rateLimit.ts
--      Silent-degrade bug: on RPC error this falls back to
--      per-instance in-memory rate limiting, defeating the whole
--      point of the DB-backed atomic upsert (cross-instance
--      correctness) without ever surfacing an error.
--   2. acquire_crawl_targets  <- lib/intelligence-engine/queue/task-queue.ts
--      Silent-degrade bug: on RPC error this falls back to a
--      manual select-then-update, which is not atomic (race-prone
--      under concurrent crawl workers) unlike the real RPC's
--      FOR UPDATE SKIP LOCKED claim.
--   3. promote_all_extracted_snapshots        <- app/admin/(protected)/hub/HubPanel.tsx
--   4. hv_ingest_snapshot_to_staging          <- app/admin/(protected)/hub/HubPanel.tsx
--   5. hv_extract_signals_from_captured_text  <- app/admin/(protected)/hub/HubPanel.tsx
--      These three are admin "Hub" control-surface actions, routed
--      through app/api/admin/hub-proxy (service_role, no schema
--      override) — same unreachable-function issue, but these
--      would have hard-failed visibly (button click -> 404) rather
--      than silently degrading.
--
-- Not touched: get_command_centre_stats (called from
-- lib/dashboard/commandCentreLiveData.ts) does not exist in ANY
-- schema, not just api — but that call is already wrapped in
-- .catch(() => ({ data: null, error: null })), its result is never
-- read, and the function's own comment says "avoids needing an RPC
-- if it doesn't exist yet". Dead/defensive code, not this bug class;
-- leaving as-is.
-- ============================================================

create or replace function api.check_and_increment_llm_rate_limit(
  p_user_id uuid, p_window_start timestamptz, p_limit integer
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.check_and_increment_llm_rate_limit(p_user_id, p_window_start, p_limit);
$$;

comment on function api.check_and_increment_llm_rate_limit(uuid, timestamptz, integer) is
  'PostgREST-exposed wrapper for public.check_and_increment_llm_rate_limit(). '
  'Called by lib/llm/rateLimit.ts checkRateLimitDB(). Without this, the '
  'RPC 404s and rate limiting silently falls back to per-instance '
  'in-memory counting.';
revoke all on function api.check_and_increment_llm_rate_limit(uuid, timestamptz, integer) from public;
grant execute on function api.check_and_increment_llm_rate_limit(uuid, timestamptz, integer) to service_role;


create or replace function api.acquire_crawl_targets(p_limit integer, p_worker_id text)
returns setof public.source_registry
language sql
security definer
set search_path = ''
as $$
  select * from public.acquire_crawl_targets(p_limit, p_worker_id);
$$;

comment on function api.acquire_crawl_targets(integer, text) is
  'PostgREST-exposed wrapper for public.acquire_crawl_targets(). Called by '
  'lib/intelligence-engine/queue/task-queue.ts DistributedTaskQueue.acquireTargets(). '
  'Without this, the RPC 404s and target acquisition silently falls back to '
  'a non-atomic select-then-update, which is race-prone under concurrent workers.';
revoke all on function api.acquire_crawl_targets(integer, text) from public;
grant execute on function api.acquire_crawl_targets(integer, text) to service_role;


-- Production already had public.promote_all_extracted_snapshots() when this
-- wrapper was applied, but repository zero-state history creates/replaces the
-- public function later. A constant dynamic call preserves the exact API return
-- contract while deferring dependency resolution until service-role execution.
create or replace function api.promote_all_extracted_snapshots()
returns table(snapshot_id uuid, signals_promoted integer)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query execute
    'select * from public.promote_all_extracted_snapshots()';
end;
$function$;

comment on function api.promote_all_extracted_snapshots() is
  'PostgREST-exposed wrapper for public.promote_all_extracted_snapshots(). '
  'Called by the admin Hub panel (app/admin/(protected)/hub) via '
  'app/api/admin/hub-proxy. The constant dynamic call permits deterministic '
  'zero-state replay before the public implementation is restored later.';
revoke all on function api.promote_all_extracted_snapshots() from public;
grant execute on function api.promote_all_extracted_snapshots() to service_role;


-- Production also had public.hv_ingest_snapshot_to_staging() before the wrapper
-- migration, while repository zero-state restores its implementation later.
-- The constant statement contains no caller-controlled SQL and keeps the API
-- wrapper unavailable to browser roles.
create or replace function api.hv_ingest_snapshot_to_staging(p_batch_size integer, p_workspace_id uuid)
returns table(snapshot_id uuid, staging_ids uuid[], candidates_count integer, skipped boolean, skip_reason text)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query execute
    'select * from public.hv_ingest_snapshot_to_staging($1, $2)'
    using p_batch_size, p_workspace_id;
end;
$function$;

comment on function api.hv_ingest_snapshot_to_staging(integer, uuid) is
  'PostgREST-exposed wrapper for public.hv_ingest_snapshot_to_staging(). '
  'Called by the admin Hub panel (app/admin/(protected)/hub) via '
  'app/api/admin/hub-proxy. The parameterized constant dynamic call permits '
  'deterministic zero-state replay before the public implementation exists.';
revoke all on function api.hv_ingest_snapshot_to_staging(integer, uuid) from public;
grant execute on function api.hv_ingest_snapshot_to_staging(integer, uuid) to service_role;


-- Production also had public.hv_extract_signals_from_captured_text() before this
-- wrapper migration. Defer only the function lookup; the batch size remains a
-- bound parameter and the wrapper is not executable by browser roles.
create or replace function api.hv_extract_signals_from_captured_text(p_batch_size integer)
returns table(snapshot_id uuid, source_name text, country text, candidates_found integer, status_set text)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query execute
    'select * from public.hv_extract_signals_from_captured_text($1)'
    using p_batch_size;
end;
$function$;

comment on function api.hv_extract_signals_from_captured_text(integer) is
  'PostgREST-exposed wrapper for public.hv_extract_signals_from_captured_text(). '
  'Called by the admin Hub panel (app/admin/(protected)/hub) via '
  'app/api/admin/hub-proxy. The parameterized constant dynamic call permits '
  'deterministic zero-state replay before the public implementation exists.';
revoke all on function api.hv_extract_signals_from_captured_text(integer) from public;
grant execute on function api.hv_extract_signals_from_captured_text(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704151117','expose_remaining_public_only_rpcs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704151117_expose_remaining_public_only_rpcs.sql

-- RECOVERY BEGIN 20260704152020_add_source_verification_tracking_and_health_view.sql
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
-- version 20260704152020.
--
-- Rewriting this file cannot affect production: 20260704152020 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Closes the loop from this session's manual remediation work: findings
-- like "gazettes.africa doesn't cover Benin" or "TGA blocks robots" have
-- only been living in git commit messages. This makes them queryable
-- directly on the row, and gives future sessions a ranked worklist instead
-- of re-deriving priority from scratch across 1,134 rows each time.

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verification_checked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.source_registry.verification_notes IS
  'Freeform note from manual URL-health remediation sessions: why a source was fixed/deactivated, or why it could not be (robots-blocked, country never covered, worker-side TLS issue, etc). Keep this updated so future sessions don''t re-investigate the same dead end.';
COMMENT ON COLUMN public.source_registry.verification_checked_at IS
  'When verification_notes was last written. NULL means never manually investigated.';

-- Backfill notes for sources already investigated this session (Jul 3 2026)
UPDATE public.source_registry SET verification_notes = 'Fixed: old /cannabis path dead, replaced with verified live MinJusticia page.', verification_checked_at = now() WHERE id = 'fa6a6af4-b59a-4deb-83dd-f0866ca5675b';
UPDATE public.source_registry SET verification_notes = 'Fixed: old /assuntos/cannabis path dead, replaced with verified live ANVISA news index.', verification_checked_at = now() WHERE id = '705f7bc4-cfc0-47f3-81d9-1cee4fe41278';
UPDATE public.source_registry SET verification_notes = 'Deactivated: duplicate-topic row on a confirmed-dead path. Needs independent verification if reactivated.', verification_checked_at = now() WHERE id IN ('247e5443-c31d-4eee-a6a3-2b08dc114e64','3915abc4-ffbe-4f47-ba4e-8579c587a6ca','a736659c-fc73-46a7-8edf-3d283f951fe9','28f2df47-8224-4cf3-b02f-614e4d50bb4c');
UPDATE public.source_registry SET verification_notes = 'Fixed: /recent suffix never existed in real routing. Domain fully covers this country (907 gazettes on file).', verification_checked_at = now() WHERE id = 'fc559185-9db6-4b95-bf7b-78677131eeb4';
UPDATE public.source_registry SET verification_notes = 'Fixed: old ANMAT consultas path dead, replaced with the real Ministry of Health REPROCANN national program hub.', verification_checked_at = now() WHERE id = '8ef1b7b8-77d7-46a4-b483-f00892c5b35d';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - NOT A DEAD LINK: gazettes.africa''s own live country index (verified directly) does not include this country and never has. Needs an entirely different source (own Journal Officiel or OHADA-adjacent aggregator), not a URL fix.', verification_checked_at = now() WHERE id IN ('61a7a6a2-6488-4a72-a146-c13172591cb5','bac97a7c-072d-46cb-b44e-e42ab8f786e8','3a35a5d4-fd8c-4d0c-93f8-f07767e3d843','f627ce91-aff5-44f7-8dab-f5faba9596d8','bf3e1c1a-51d1-42e3-ac1f-6c07c9ccf88f','9ab034c5-9481-4fa9-8fcd-631980eb7576');
UPDATE public.source_registry SET verification_notes = 'Fixed: old target was a single dead 2021 press release. Swapped to ABF''s live, continuously-updated newsroom index.', verification_checked_at = now() WHERE id = '193f8aeb-060f-461b-b98c-1c98724044c3';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - robots.txt disallowed on the real, current, correct cannabis page (confirmed directly). Not a stale URL. Needs an official RSS/API endpoint or secondary-press proxy source instead.', verification_checked_at = now() WHERE id IN ('a24b3f00-b2d2-446d-a72d-049f703ccf79','b1219657-91b3-49f9-b5e7-c684fbfba915');
UPDATE public.source_registry SET verification_notes = 'Fixed: old path dead, replaced with current liquor-and-cannabis regulation hub.', verification_checked_at = now() WHERE id = 'fa4c6c14-3ab1-4dc6-a32c-36141c810abe';
UPDATE public.source_registry SET verification_notes = 'Fixed: Senado migrated from name-based slugs to numeric IDs. Old /comision-de-salud slug retired.', verification_checked_at = now() WHERE id = '3cd1bdd4-6b0d-47ae-9ce7-69636ec65594';
UPDATE public.source_registry SET verification_notes = 'Fixed: specific old page (51090.html) gone but domain healthy, replaced with current equivalent (50927.html). Original error was a TLS UnknownIssuer cert error, not 404 -- if it recurs on this new URL too, that confirms a worker-side cert-store issue, not a URL problem.', verification_checked_at = now() WHERE id = '1cb55697-e14c-4fa6-8dba-0e16a2010350';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - registry had the wrong domain (ispch.cl) but even the correct current domain (ispch.gob.cl, verified directly) disallows automated access via robots.txt. Same class as Australia TGA/ODC.', verification_checked_at = now() WHERE id = '7f6b7e64-37a2-4063-b728-ddb065251cb2';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - see companion ISP Chile row for reason (robots-blocked even on correct domain).', verification_checked_at = now() WHERE id = 'c4874bce-c4b0-446c-bfb4-e42bd1de59b8';

-- The health view itself. security_invoker=true so it respects whatever
-- RLS applies to the underlying tables (consistent with the api-schema
-- fix earlier this session) rather than running with view-owner privilege.
CREATE OR REPLACE VIEW public.source_registry_health
WITH (security_invoker = true) AS
WITH ranked_snapshots AS (
  SELECT
    ss.source_id,
    ss.fetch_status,
    ss.error_message,
    ss.captured_at,
    ROW_NUMBER() OVER (PARTITION BY ss.source_id ORDER BY ss.captured_at DESC) AS rn
  FROM public.source_snapshots ss
  WHERE ss.captured_at > now() - interval '30 days'
),
first_success AS (
  SELECT source_id, MIN(rn) AS first_success_rn
  FROM ranked_snapshots
  WHERE fetch_status = 'success'
  GROUP BY source_id
),
recent_stats AS (
  SELECT
    source_id,
    COUNT(*) AS attempts_30d,
    COUNT(*) FILTER (WHERE fetch_status = 'success') AS successes_30d,
    COUNT(*) FILTER (WHERE fetch_status = 'error') AS errors_30d,
    MAX(captured_at) AS last_attempt_at,
    MAX(captured_at) FILTER (WHERE fetch_status = 'success') AS last_success_at
  FROM ranked_snapshots
  GROUP BY source_id
),
last_error AS (
  SELECT DISTINCT ON (source_id) source_id, error_message AS last_error_message, captured_at AS last_error_at
  FROM ranked_snapshots
  WHERE fetch_status = 'error'
  ORDER BY source_id, captured_at DESC
)
SELECT
  sr.id,
  sr.source_name,
  sr.source_url,
  sr.country,
  sr.region,
  sr.tier,
  COALESCE(rs.attempts_30d, 0) AS attempts_30d,
  COALESCE(rs.successes_30d, 0) AS successes_30d,
  CASE WHEN COALESCE(rs.attempts_30d,0) > 0
       THEN ROUND(100.0 * COALESCE(rs.successes_30d,0) / rs.attempts_30d, 1)
       ELSE NULL END AS success_rate_pct,
  COALESCE(fs.first_success_rn - 1, rs.attempts_30d, 0) AS consecutive_failures,
  CASE WHEN rs.attempts_30d IS NULL OR rs.attempts_30d = 0 THEN 'not_crawled_30d' ELSE NULL END AS crawl_gap_flag,
  le.last_error_message,
  le.last_error_at,
  CASE
    WHEN le.last_error_message ILIKE '%404%' THEN 'verify_replacement_url'
    WHEN le.last_error_message ILIKE '%403%' OR le.last_error_message ILIKE '%forbidden%' THEN 'check_robots_or_find_alt_source'
    WHEN le.last_error_message ILIKE '%dns_blocked%' THEN 'investigate_dns_block'
    WHEN le.last_error_message ILIKE '%certificate%' OR le.last_error_message ILIKE '%tls%'
         OR le.last_error_message ILIKE '%unknownissuer%' OR le.last_error_message ILIKE '%notvalidforname%' THEN 'capture_worker_tls_issue_not_url'
    WHEN le.last_error_message ILIKE '%abort%' OR le.last_error_message ILIKE '%timeout%' THEN 'check_timeout_or_site_speed'
    WHEN le.last_error_message ILIKE '%503%' THEN 'check_if_transient_or_persistent'
    WHEN le.last_error_message IS NOT NULL THEN 'investigate'
    ELSE NULL
  END AS suggested_action,
  sr.verification_notes,
  sr.verification_checked_at,
  sr.is_active
FROM public.source_registry sr
LEFT JOIN recent_stats rs ON rs.source_id = sr.id
LEFT JOIN first_success fs ON fs.source_id = sr.id
LEFT JOIN last_error le ON le.source_id = sr.id
WHERE sr.is_active = true
ORDER BY consecutive_failures DESC NULLS LAST, sr.tier ASC NULLS LAST;

-- Internal/operational view: not for the public API surface.
REVOKE ALL ON public.source_registry_health FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.source_registry_health TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704152020','add_source_verification_tracking_and_health_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704152020_add_source_verification_tracking_and_health_view.sql

-- RECOVERY BEGIN 20260704152427_fix_source_health_view_fetch_status_semantics.sql
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
-- version 20260704152427.
--
-- Rewriting this file cannot affect production: 20260704152427 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Bug fix: source_registry_health treated fetch_status='success' as the
-- only successful outcome. Real data has 4 values: success, extracted,
-- extract_failed, error. Verified directly: 'extracted' (1379 rows) and
-- 'extract_failed' (10 rows) both have real captured_text in the large
-- majority of cases -- the HTTP fetch worked; only 'error' means it didn't.
-- Without this fix, sources whose recent snapshots happen to be in
-- 'extracted' state were wrongly flagged as failing (found via Hemp
-- Benchmarks RSS testing as a false positive).

CREATE OR REPLACE VIEW public.source_registry_health
WITH (security_invoker = true) AS
WITH ranked_snapshots AS (
  SELECT
    ss.source_id,
    ss.fetch_status,
    ss.error_message,
    ss.captured_at,
    (ss.fetch_status IN ('success','extracted','extract_failed')) AS fetch_ok,
    ROW_NUMBER() OVER (PARTITION BY ss.source_id ORDER BY ss.captured_at DESC) AS rn
  FROM public.source_snapshots ss
  WHERE ss.captured_at > now() - interval '30 days'
),
first_success AS (
  SELECT source_id, MIN(rn) AS first_success_rn
  FROM ranked_snapshots
  WHERE fetch_ok
  GROUP BY source_id
),
recent_stats AS (
  SELECT
    source_id,
    COUNT(*) AS attempts_30d,
    COUNT(*) FILTER (WHERE fetch_ok) AS successes_30d,
    COUNT(*) FILTER (WHERE NOT fetch_ok) AS errors_30d,
    MAX(captured_at) AS last_attempt_at,
    MAX(captured_at) FILTER (WHERE fetch_ok) AS last_success_at
  FROM ranked_snapshots
  GROUP BY source_id
),
last_error AS (
  SELECT DISTINCT ON (source_id) source_id, error_message AS last_error_message, captured_at AS last_error_at
  FROM ranked_snapshots
  WHERE NOT fetch_ok
  ORDER BY source_id, captured_at DESC
)
SELECT
  sr.id,
  sr.source_name,
  sr.source_url,
  sr.country,
  sr.region,
  sr.tier,
  COALESCE(rs.attempts_30d, 0) AS attempts_30d,
  COALESCE(rs.successes_30d, 0) AS successes_30d,
  CASE WHEN COALESCE(rs.attempts_30d,0) > 0
       THEN ROUND(100.0 * COALESCE(rs.successes_30d,0) / rs.attempts_30d, 1)
       ELSE NULL END AS success_rate_pct,
  COALESCE(fs.first_success_rn - 1, rs.attempts_30d, 0) AS consecutive_failures,
  CASE WHEN rs.attempts_30d IS NULL OR rs.attempts_30d = 0 THEN 'not_crawled_30d' ELSE NULL END AS crawl_gap_flag,
  le.last_error_message,
  le.last_error_at,
  CASE
    WHEN le.last_error_message ILIKE '%404%' THEN 'verify_replacement_url'
    WHEN le.last_error_message ILIKE '%403%' OR le.last_error_message ILIKE '%forbidden%' THEN 'check_robots_or_find_alt_source'
    WHEN le.last_error_message ILIKE '%429%' OR le.last_error_message ILIKE '%too many requests%' THEN 'rate_limited_check_official_api'
    WHEN le.last_error_message ILIKE '%dns_blocked%' THEN 'investigate_dns_block'
    WHEN le.last_error_message ILIKE '%certificate%' OR le.last_error_message ILIKE '%tls%'
         OR le.last_error_message ILIKE '%unknownissuer%' OR le.last_error_message ILIKE '%notvalidforname%' THEN 'capture_worker_tls_issue_not_url'
    WHEN le.last_error_message ILIKE '%abort%' OR le.last_error_message ILIKE '%timeout%' THEN 'check_timeout_or_site_speed'
    WHEN le.last_error_message ILIKE '%503%' THEN 'check_if_transient_or_persistent'
    WHEN le.last_error_message ILIKE '%fetch failed%' THEN 'check_dns_or_connectivity'
    WHEN le.last_error_message IS NOT NULL THEN 'investigate'
    ELSE NULL
  END AS suggested_action,
  sr.verification_notes,
  sr.verification_checked_at,
  sr.is_active
FROM public.source_registry sr
LEFT JOIN recent_stats rs ON rs.source_id = sr.id
LEFT JOIN first_success fs ON fs.source_id = sr.id
LEFT JOIN last_error le ON le.source_id = sr.id
WHERE sr.is_active = true
ORDER BY consecutive_failures DESC NULLS LAST, sr.tier ASC NULLS LAST;

REVOKE ALL ON public.source_registry_health FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.source_registry_health TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704152427','fix_source_health_view_fetch_status_semantics','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704152427_fix_source_health_view_fetch_status_semantics.sql

-- RECOVERY BEGIN 20260704160603_get_command_centre_stats.sql
-- ============================================================
-- lib/dashboard/commandCentreLiveData.ts calls
-- supabase.rpc('get_command_centre_stats').maybeSingle(), wrapped in
-- .catch(() => ({ data: null, error: null })) with a comment noting
-- "avoids needing an RPC if it doesn't exist yet" — the function was
-- never created, so this has always silently no-op'd, and the same
-- stats get computed instead via ~8 separate inline round-trip
-- queries later in that file.
--
-- Production already had public.signals_quality and
-- public.admin_dashboard_counts out of band before this migration. Zero-state
-- replay restores their original contracts only when absent; later dated
-- migrations remain the owners of subsequent signal-quality refinements.
-- ============================================================

do $restore_initial_signals_quality$
begin
  if not exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'signals_quality'
  ) then
    execute $view$
      create view public.signals_quality as
      select
        id,
        date,
        cat,
        pri,
        score,
        headline,
        summary,
        source,
        url,
        verification,
        tier,
        lang,
        company,
        country,
        in_network,
        lane_r,
        lane_e,
        lane_t,
        top_lane,
        query_pack,
        commercial_impact,
        reviewed,
        action,
        created_at,
        embedding_1024,
        embedding_model,
        embedded_at
      from public.signals
      where cat <> 'SOURCE_ENGINE'
         or (cat = 'SOURCE_ENGINE' and reviewed = true and score >= 50)
    $view$;
  end if;
end
$restore_initial_signals_quality$;

do $restore_admin_dashboard_counts$
begin
  if not exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'admin_dashboard_counts'
  ) then
    execute $view$
      create view public.admin_dashboard_counts
      with (security_invoker = true)
      as
      select
        (select count(*) from public.listings
          where status::text = 'pending_review') as pending_listings,
        (select count(*) from public.buyer_requests
          where status::text = 'pending_review') as pending_buyer_requests,
        (select count(*) from public.marketplace_inquiries
          where review_status = 'received') as new_inquiries,
        (select count(*) from public.matches
          where status::text = 'proposed') as pending_matches,
        (select count(*) from public.disclosure_requests
          where status::text = 'requested') as pending_disclosures
    $view$;

    revoke all on table public.admin_dashboard_counts
      from public, anon, authenticated;
    grant select on table public.admin_dashboard_counts to service_role;
  end if;
end
$restore_admin_dashboard_counts$;

create or replace function public.get_command_centre_stats()
returns table (
  total_signals integer,
  urgent_signals integer,
  high_signals integer,
  monitor_signals integer,
  signal_countries integer,
  approved_listings integer,
  listing_categories integer,
  listing_countries integer,
  active_sources integer,
  inactive_sources integer,
  checked_last_24h integer,
  stale_sources integer,
  candidates_needs_review integer,
  pending_listings integer,
  pending_buyer_requests integer,
  new_inquiries integer,
  pending_matches integer,
  pending_disclosures integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    (select count(*) from public.signals_quality)::int,
    (select count(*) from public.signals_quality where upper(pri) = 'URGENT')::int,
    (select count(*) from public.signals_quality where upper(pri) = 'HIGH')::int,
    (select count(*) from public.signals_quality where upper(pri) = 'MONITOR')::int,
    (select count(distinct country) from public.signals_quality where country is not null)::int,
    (select count(*) from public.listings where status::text = 'approved')::int,
    (select count(distinct category) from public.listings)::int,
    (select count(distinct location_country) from public.listings where location_country is not null)::int,
    (select count(*) from public.source_registry where is_active is true)::int,
    (select count(*) from public.source_registry where is_active is not true)::int,
    (select count(*) from public.source_registry
       where last_checked_at is not null and now() - last_checked_at < interval '24 hours')::int,
    (select count(*) from public.source_registry
       where last_checked_at is null or now() - last_checked_at > interval '7 days')::int,
    (select count(*) from public.marketplace_candidates where status = 'needs_review')::int,
    (select pending_listings from public.admin_dashboard_counts)::int,
    (select pending_buyer_requests from public.admin_dashboard_counts)::int,
    (select new_inquiries from public.admin_dashboard_counts)::int,
    (select pending_matches from public.admin_dashboard_counts)::int,
    (select pending_disclosures from public.admin_dashboard_counts)::int;
$$;

comment on function public.get_command_centre_stats() is
  'Single-round-trip aggregate for the CommandCentre dashboard '
  '(lib/dashboard/commandCentreLiveData.ts). Replicates the semantics of '
  'the inline per-field queries that file falls back to, including '
  'source-health null-handling (is_active null/false both count as '
  'inactive; null last_checked_at counts as stale).';

create or replace function api.get_command_centre_stats()
returns table (
  total_signals integer,
  urgent_signals integer,
  high_signals integer,
  monitor_signals integer,
  signal_countries integer,
  approved_listings integer,
  listing_categories integer,
  listing_countries integer,
  active_sources integer,
  inactive_sources integer,
  checked_last_24h integer,
  stale_sources integer,
  candidates_needs_review integer,
  pending_listings integer,
  pending_buyer_requests integer,
  new_inquiries integer,
  pending_matches integer,
  pending_disclosures integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select * from public.get_command_centre_stats();
$$;

comment on function api.get_command_centre_stats() is
  'PostgREST-exposed wrapper for public.get_command_centre_stats().';

-- Read-only aggregate; service_role only, consistent with every other
-- wrapper this session (this project has no anon/authenticated dashboard
-- surface for this data outside the admin-authenticated app layer).
revoke all on function public.get_command_centre_stats() from public;
grant execute on function public.get_command_centre_stats() to service_role;
revoke all on function api.get_command_centre_stats() from public;
grant execute on function api.get_command_centre_stats() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704160603','get_command_centre_stats','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704160603_get_command_centre_stats.sql

-- RECOVERY BEGIN 20260704171449_fix_regulatory_watch_service_role_grants.sql
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
-- version 20260704171449.
--
-- Rewriting this file cannot affect production: 20260704171449 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- regulatory_watch_cron (service_role) has been getting a live 403 on every
-- run: "permission denied for table sources... GRANT SELECT ON
-- regulatory_signals.sources TO service_role" (confirmed via Vercel runtime
-- error logs, recurring through 2026-07-04). The `authenticated` role has
-- full SELECT/INSERT/UPDATE/DELETE across every table in this schema, but
-- service_role -- the role the cron worker actually authenticates as --
-- was never granted schema USAGE or any table privileges at all. Mirrors
-- authenticated's existing grant shape exactly (least-surprise, not
-- broader than what already works for the other server-side role).
GRANT USAGE ON SCHEMA regulatory_signals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA regulatory_signals TO service_role;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704171449','fix_regulatory_watch_service_role_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704171449_fix_regulatory_watch_service_role_grants.sql

-- RECOVERY BEGIN 20260704171507_fix_genetics_public_visibility.sql
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
-- version 20260704171507.
--
-- Rewriting this file cannot affect production: 20260704171507 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- The public genetics marketplace surfaces (/genetics, /genetics/cultivars,
-- /genetics/services, /genetics/collaboration) have never shown real data
-- to anyone but a row's own owner or a genetics admin/reviewer. Root cause,
-- confirmed directly against pg_policies: cultivar_passports,
-- cultivar_aliases, cultivar_country_opportunities, genetics_evidence_items,
-- genetics_collaboration_projects and genetics_service_providers only ever
-- had an owner/admin-scoped "_owner_all" RLS policy -- there was never a
-- public-read policy for the is_public/visibility='public_summary' rows
-- that lib/genetics/queries.ts and lib/genetics/dto.ts were already written
-- to filter for (getPublicCultivarPassports, getPublicServiceProviders,
-- getPublicCollaborationProjects, publicEvidenceSummaries). 2 cultivars
-- currently have is_public=true and were completely invisible to anon AND
-- to any authenticated non-owner user.
--
-- Confirmed live via Vercel runtime error logs (2026-07-04):
--   [genetics_queries] getPublicServiceProviders failed:
--     Could not find the table 'api.genetics_service_providers' in schema cache
--   [genetics_queries] getPublicCollaborationProjects failed:
--     Could not find the table 'api.genetics_collaboration_projects' in schema cache
--   [genetics_queries] cultivar_aliases fetch failed:
--     Could not find the table 'api.cultivar_aliases' in schema cache
-- i.e. on top of the missing RLS, 3 of these tables were never exposed
-- through the api schema at all (PostgREST 404s before RLS is even
-- evaluated), and none had an anon grant.

-- ── Public-read RLS: additive policies alongside each existing *_owner_all ──
CREATE POLICY cultivar_passports_public_read ON public.cultivar_passports
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

CREATE POLICY cultivar_aliases_public_read ON public.cultivar_aliases
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

CREATE POLICY cultivar_country_opportunities_public_read ON public.cultivar_country_opportunities
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cultivar_passports cp
    WHERE cp.id = cultivar_country_opportunities.cultivar_id AND cp.is_public = true
  ));

CREATE POLICY genetics_evidence_items_public_summary_read ON public.genetics_evidence_items
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public_summary');

CREATE POLICY genetics_collaboration_projects_public_read ON public.genetics_collaboration_projects
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public_summary');

CREATE POLICY genetics_service_providers_public_read ON public.genetics_service_providers
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- ── Missing api-schema views (PostgREST-visible; security_invoker so RLS
--    above actually applies to queries made through them) ──
CREATE VIEW api.cultivar_aliases AS SELECT * FROM public.cultivar_aliases;
ALTER VIEW api.cultivar_aliases SET (security_invoker = true);

CREATE VIEW api.genetics_collaboration_projects AS SELECT * FROM public.genetics_collaboration_projects;
ALTER VIEW api.genetics_collaboration_projects SET (security_invoker = true);

CREATE VIEW api.genetics_service_providers AS SELECT * FROM public.genetics_service_providers;
ALTER VIEW api.genetics_service_providers SET (security_invoker = true);

-- ── Grants matching the new public-read policies (both schemas) ──
GRANT SELECT ON public.cultivar_passports TO anon;
GRANT SELECT ON api.cultivar_passports TO anon;

GRANT SELECT ON public.cultivar_aliases TO anon, authenticated;
GRANT SELECT ON api.cultivar_aliases TO anon, authenticated;

GRANT SELECT ON public.cultivar_country_opportunities TO anon;
GRANT SELECT ON api.cultivar_country_opportunities TO anon;

GRANT SELECT ON public.genetics_evidence_items TO anon;
GRANT SELECT ON api.genetics_evidence_items TO anon;

GRANT SELECT ON public.genetics_collaboration_projects TO anon, authenticated;
GRANT SELECT ON api.genetics_collaboration_projects TO anon, authenticated;

GRANT SELECT ON public.genetics_service_providers TO anon, authenticated;
GRANT SELECT ON api.genetics_service_providers TO anon, authenticated;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704171507','fix_genetics_public_visibility','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704171507_fix_genetics_public_visibility.sql

-- RECOVERY BEGIN 20260704171518_expose_signals_quality_and_subscriptions_api_views.sql
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
-- version 20260704171518.
--
-- Rewriting this file cannot affect production: 20260704171518 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Confirmed live via Vercel runtime error logs (2026-07-04), recurring
-- through today: /api/dashboard/signals and /api/dashboard/digest both 404
-- at the PostgREST layer with "Could not find the table 'api.signals_quality'
-- in the schema cache", and intelligence-notify_cron fails subscription
-- lookups with "Could not find the table 'api.signal_subscriptions' in the
-- schema cache". Neither had an api-schema view at all.
--
-- signals_quality is a read-only view over `signals` that already bakes in
-- the public-safety filter at definition time (cat <> 'SOURCE_ENGINE' OR
-- score>=50 AND reviewed=true) -- safe for anon+authenticated, same trust
-- boundary as the view itself already enforces.
--
-- signal_subscriptions is user-owned (RLS: auth.uid() = user_id) and is
-- only ever written through the service-role client in
-- app/api/signals/subscribe/route.ts after an explicit auth check --
-- authenticated-only grant, no anon, matching that access pattern.

CREATE VIEW api.signals_quality AS SELECT * FROM public.signals_quality;
ALTER VIEW api.signals_quality SET (security_invoker = true);
GRANT SELECT ON public.signals_quality TO anon, authenticated;
GRANT SELECT ON api.signals_quality TO anon, authenticated;

CREATE VIEW api.signal_subscriptions AS SELECT * FROM public.signal_subscriptions;
ALTER VIEW api.signal_subscriptions SET (security_invoker = true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.signal_subscriptions TO authenticated;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704171518','expose_signals_quality_and_subscriptions_api_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704171518_expose_signals_quality_and_subscriptions_api_views.sql

-- RECOVERY BEGIN 20260704171636_close_public_schema_default_acl_leak.sql
-- ============================================================
-- Found during a post-session "is anything missing" audit.
--
-- This project has a default-privileges rule on the `public` schema
-- (set by `postgres`/`supabase_admin`, visible in pg_default_acl for
-- object type 'f') that grants EXECUTE to anon + authenticated on
-- every NEW function created in `public`, independent of the PUBLIC
-- pseudo-role. `revoke all on function ... from public` only strips
-- the PUBLIC-pseudo-role grant — it does NOT touch this separate,
-- role-specific default grant. Net effect: every "revoke all from
-- public" in this session's earlier migrations left anon+authenticated
-- with EXECUTE on the underlying public.* function regardless.
--
-- This is not a live REST-reachable hole today — PostgREST only
-- exposes the `api` schema (lib/supabase/env.ts), and the `api.*`
-- wrappers came out clean (no equivalent default-ACL rule on `api`).
-- But it's exactly the kind of latent landmine ADR #9 says to close:
-- if `public` were ever added to Data API's exposed schemas, these
-- would become directly callable by anonymous users as SECURITY
-- DEFINER. Fixing it now while cheap rather than leaving it.
--
-- Scoped to the three public.* functions touched this session
-- (get_command_centre_stats is new; the other two got api.* wrappers
-- today, so they're "mine" for this pass even though the underlying
-- public functions predate this session). Also re-applies an explicit
-- by-name revoke on the api.* wrappers for the same three, even
-- though they already tested clean — cheap defense-in-depth, no
-- functional change since service_role already holds EXECUTE either way.
-- ============================================================

revoke execute on function public.get_command_centre_stats() from anon, authenticated;
revoke execute on function public.enqueue_regulatory_enrichment() from anon, authenticated;
revoke execute on function public.claim_intelligence_job(text, text) from anon, authenticated;

revoke execute on function api.get_command_centre_stats() from anon, authenticated;
revoke execute on function api.enqueue_regulatory_enrichment() from anon, authenticated;
revoke execute on function api.claim_intelligence_job(text, text) from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704171636','close_public_schema_default_acl_leak','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704171636_close_public_schema_default_acl_leak.sql

-- RECOVERY BEGIN 20260704171645_grant_anon_genetics_profiles_for_rls_planning.sql
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
-- version 20260704171645.
--
-- Rewriting this file cannot affect production: 20260704171645 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- The *_owner_all policies on genetics_service_providers, genetics_collaboration_projects,
-- and genetics_evidence_items (grant_read variant) each contain an
-- `EXISTS (SELECT 1 FROM genetics_profiles ...)` subquery. Postgres requires
-- table-level SELECT on every relation referenced by ANY applicable policy
-- in order to plan the query at all -- even when that specific policy's
-- predicate would evaluate false for the row. anon had zero grant on
-- genetics_profiles, so anon's queries against those 3 tables hard-failed
-- with "permission denied for table genetics_profiles" rather than just
-- returning an RLS-filtered empty/partial set -- this masked the previous
-- migration's new public-read policies entirely (confirmed via `set role
-- anon` test query).
--
-- Safe to grant: genetics_profiles keeps its own owner-scoped RLS
-- (genetics_profiles_owner_all: owner_user_id = auth.uid() OR
-- is_genetics_admin_or_reviewer()), so anon still sees zero profile rows
-- directly -- this grant only unblocks query planning for the other
-- tables' EXISTS subqueries, it does not expose profile data.
GRANT SELECT ON public.genetics_profiles TO anon;
GRANT SELECT ON api.genetics_profiles TO anon;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704171645','grant_anon_genetics_profiles_for_rls_planning','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704171645_grant_anon_genetics_profiles_for_rls_planning.sql

-- RECOVERY BEGIN 20260704171735_revoke_public_pseudorole_claim_intelligence_job.sql
-- Follow-up to close_public_schema_default_acl_leak: that migration
-- revoked from the *named* roles anon/authenticated, which fixed
-- enqueue_regulatory_enrichment and get_command_centre_stats. But
-- public.claim_intelligence_job's leak is a different, older
-- mechanism — an explicit grant to the PUBLIC pseudo-role itself
-- (proacl showed '=X/postgres', the empty-grantee-name ACL entry
-- that denotes PUBLIC), predating the project's default-ACL rule.
-- Revoking from named roles doesn't touch a PUBLIC-pseudo-role grant;
-- this needs the pseudo-role-targeted form specifically.
revoke all on function public.claim_intelligence_job(text, text) from public;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704171735','revoke_public_pseudorole_claim_intelligence_job','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704171735_revoke_public_pseudorole_claim_intelligence_job.sql

-- RECOVERY BEGIN 20260704212448_tiered_access_rls.sql
-- Restore the exact production-owned body for migration 20260704212448.
-- The previous stub omitted public.current_user_tier(), which 20260714192255
-- and 20260718080340 use in RLS policy predicates.

-- Tiered access + RLS. The existing user_profiles.tier column (free/intel/
-- operator, CHECK-constrained) is the real, already-designed subscription
-- model — this wires real enforcement to it instead of leaving every
-- authenticated (and in country_intel's case, even anonymous) user with
-- full read access regardless of tier.
--
-- Verified before changing: every app-code caller of both tables uses a
-- service-role client (bypasses RLS entirely), so this only affects direct
-- Supabase REST/anon-key access — no existing page or feature depends on
-- the open behavior being removed here.

-- ── ia_signals: was open to ANY authenticated user, no tier check ──────────
drop policy if exists ia_signals_authenticated_read on ia_signals;

create policy ia_signals_intel_tier_read on ia_signals
  for select
  to authenticated
  using (
    stage = any (array['active','closed'])
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.tier in ('intel','operator')
    )
  );

-- ── country_intel: was open to literally anyone, anon included ─────────────
drop policy if exists country_intel_public_active_select on country_intel;

-- Deviation from the recorded body: one added drop, mirroring the guard the
-- line above already uses. In production this policy did not exist before this
-- migration, so the recorded CREATE was unconditional. In zero-state replay it
-- does exist: 20260618211000_country_intel_foundation_replay.sql, a
-- repository-only reconciliation migration with no ledger entry, already
-- creates a policy of the same name three weeks earlier. Without this drop the
-- replay fails here with:
--   policy "country_intel_intel_tier_read" for table "country_intel"
--   already exists (SQLSTATE 42710)
-- The recorded definition below still wins, which is the correct outcome since
-- this migration is its production-recorded owner.
drop policy if exists country_intel_intel_tier_read on country_intel;

create policy country_intel_intel_tier_read on country_intel
  for select
  to authenticated
  using (
    review_status = 'active'
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.tier in ('intel','operator')
    )
  );

-- Free/unauthenticated visitors still get the public teaser fields (country
-- name + public_summary + regulatory_tier) via this view — no gated columns.
create or replace view country_intel_public as
select id, country_code, country_name, public_summary, regulatory_tier, review_status
from country_intel
where review_status = 'active';

grant select on country_intel_public to anon, authenticated;

-- ── user_profiles: helper for RLS checks + app code, avoids repeating the
-- `exists (select 1 from user_profiles ...)` pattern everywhere.
create or replace function public.current_user_tier()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select tier from user_profiles where id = auth.uid();
$$;

grant execute on function public.current_user_tier() to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260704212448','tiered_access_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260704212448_tiered_access_rls.sql

-- RECOVERY BEGIN 20260705094622_expose_scraper_source_state_via_api_schema.sql
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
-- version 20260705094622.
--
-- Rewriting this file cannot affect production: 20260705094622 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Same root cause as the earlier hv_artifacts gap: PostgREST on this project
-- exposes only the `api` schema by default. lib/scrapers/ingestor.ts makes
-- raw REST calls to /rest/v1/scraper_source_state with no schema profile
-- header, so every read and write has 404'd since day one (confirmed: 0 rows
-- ever written, despite the scrape cron running daily since 2026-06-06).
--
-- A simple 1:1 view on a single table with a primary key is automatically
-- updatable in Postgres — this fixes both the SELECT (fetchSourceStates) and
-- the upsert (on_conflict=source_id) the ingestor already does, no code
-- change needed.

create or replace view api.scraper_source_state as
select source_id, cadence_hours, last_run_at, last_success_at, consecutive_failures, last_error, updated_at
from public.scraper_source_state;

grant select, insert, update, delete on api.scraper_source_state to service_role, authenticated, anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705094622','expose_scraper_source_state_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705094622_expose_scraper_source_state_via_api_schema.sql

-- RECOVERY BEGIN 20260705101127_expose_get_proprietary_datasets_via_api.sql
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
-- version 20260705101127.
--
-- Rewriting this file cannot affect production: 20260705101127 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Same pattern as api.get_command_centre_stats() -- a thin passthrough wrapper
-- in the api schema PostgREST actually serves. Failing since 2026-06-07 on
-- /admin/proprietary-intelligence (PGRST202: function not found).
create or replace function api.get_proprietary_datasets()
returns table(id text, name text, category text, record_count bigint, freshness_days integer, coverage_markets text[], coverage_categories text[], last_updated timestamptz, completeness_pct integer, status text)
language sql
stable
security definer
set search_path to ''
as $$
  select * from public.get_proprietary_datasets();
$$;

grant execute on function api.get_proprietary_datasets() to service_role, authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705101127','expose_get_proprietary_datasets_via_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705101127_expose_get_proprietary_datasets_via_api.sql

-- RECOVERY BEGIN 20260705101219_fix_get_proprietary_datasets_column_name.sql
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
-- version 20260705101219.
--
-- Rewriting this file cannot affect production: 20260705101219 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- The api.* wrapper unmasked a pre-existing bug in the underlying function
-- itself: it referenced countries.country_iso2, which has never existed
-- (real column is iso_alpha2). This would have thrown the same error even
-- via direct public-schema access -- the 404 just hid it until now.
create or replace function public.get_proprietary_datasets()
 RETURNS TABLE(id text, name text, category text, record_count bigint, freshness_days integer, coverage_markets text[], coverage_categories text[], last_updated timestamp with time zone, completeness_pct integer, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count bigint;
  v_ts    timestamptz;
BEGIN
  SELECT COUNT(*), MAX(c.updated_at) INTO v_count, v_ts FROM ia_counterparties c;
  id := 'counterparty_network'; name := 'Counterparty Network'; category := 'counterparty';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT m FROM ia_counterparties cx, unnest(cx.markets) t(m) LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT m FROM ia_counterparties cx, unnest(cx.categories) t(m) LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 90 WHEN v_count > 10 THEN 65 ELSE 40 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(s.created_at) INTO v_count, v_ts FROM signals s;
  id := 'intelligence_signals'; name := 'Intelligence Signals Feed'; category := 'signals';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT sx.country FROM signals sx WHERE sx.country IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT sx.cat    FROM signals sx WHERE sx.cat    IS NOT NULL LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 500 THEN 85 WHEN v_count > 100 THEN 65 ELSE 40 END;
  status := CASE WHEN v_count > 500 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(sr.updated_at) INTO v_count, v_ts FROM source_registry sr;
  id := 'source_registry_ds'; name := 'Intelligence Source Registry'; category := 'source_reliability';
  record_count := v_count; freshness_days := 0;
  coverage_markets    := ARRAY(SELECT DISTINCT srx.country     FROM source_registry srx WHERE srx.country     IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT srx.source_type FROM source_registry srx WHERE srx.source_type IS NOT NULL LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 500 THEN 90 WHEN v_count > 100 THEN 70 ELSE 50 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(l.created_at) INTO v_count, v_ts FROM listings l;
  id := 'marketplace_listings'; name := 'Marketplace Supply & Demand'; category := 'seller_supply';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT lx.location_country FROM listings lx WHERE lx.location_country IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 100 THEN 80 WHEN v_count > 20 THEN 60 ELSE 35 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(ev.created_at) INTO v_count, v_ts FROM ia_evidence_vault ev;
  id := 'evidence_vault_ds'; name := 'Evidence & Document Vault'; category := 'documentation';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets := ARRAY[]::text[]; coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 100 THEN 80 WHEN v_count > 10 THEN 55 ELSE 30 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(sc.created_at) INTO v_count, v_ts FROM ia_scoring_records sc;
  id := 'scoring_records_ds'; name := 'Counterparty Scoring Records'; category := 'relationship_memory';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT m FROM ia_scoring_records scx, unnest(scx.market_access_relevance) t(m) LIMIT 10);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 85 WHEN v_count > 10 THEN 60 ELSE 35 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(mm.created_at) INTO v_count, v_ts FROM market_metrics mm;
  id := 'market_pathways_ds'; name := 'Market Pathway Intelligence'; category := 'market_pathway';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT co.iso_alpha2 FROM countries co WHERE co.iso_alpha2 IS NOT NULL LIMIT 20);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 80 WHEN v_count > 0 THEN 50 ELSE 20 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;
END;
$function$;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705101219','fix_get_proprietary_datasets_column_name','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705101219_fix_get_proprietary_datasets_column_name.sql

-- RECOVERY BEGIN 20260705101423_fix_source_snapshots_missing_columns.sql
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
-- version 20260705101423.
--
-- Rewriting this file cannot affect production: 20260705101423 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- lib/intelligence-engine/orchestrator.ts (the intelligence-ingest cron, runs
-- 4x/day) has always written previous_hash + changed on every snapshot save --
-- neither column has ever existed. Every successful-fetch save has been
-- failing outright with a schema-cache error since before this table's
-- earliest visible logs. Confirmed via code: these drive the orchestrator's
-- own content-diff dedup logic ("skip re-running AI extraction on identical
-- pages") -- not decorative, genuinely load-bearing for that optimization.
--
-- Also fixes a second, compounding bug in the same insert: the code writes
-- processing_status='pending_extraction' on every successful fetch, but the
-- CHECK constraint never allowed that value -- only pending/processing/
-- extracted/translated/failed/skipped. Even with the columns added, every
-- successful capture would still have been rejected by this constraint.
-- 'pending_extraction' is intentionally distinct from the generic 'pending'
-- used by other source_snapshots consumers (run_signal_extraction, hv-extract)
-- so it can route specifically to /api/cron/intelligence-extract without
-- colliding with those other pipelines -- extending the constraint rather
-- than changing the code to reuse 'pending' preserves that separation.

alter table source_snapshots add column if not exists previous_hash text;
alter table source_snapshots add column if not exists changed boolean default false;

alter table source_snapshots drop constraint source_snapshots_processing_status_check;
alter table source_snapshots add constraint source_snapshots_processing_status_check
  check (processing_status = any (array['pending','pending_extraction','processing','extracted','translated','failed','skipped']));

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705101423','fix_source_snapshots_missing_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705101423_fix_source_snapshots_missing_columns.sql

-- RECOVERY BEGIN 20260705110051_tighten_overgranted_permissions.sql
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
-- version 20260705110051.
--
-- Rewriting this file cannot affect production: 20260705110051 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fresh security advisor scan caught two grant overreaches introduced this
-- session, both mine to fix:
--
-- 1. api.scraper_source_state was granted SELECT/INSERT/UPDATE/DELETE to
--    anon and authenticated -- this is server-only scraper pipeline state
--    tracking, matching exactly the class of table the 2026-06-23 audit
--    classified as "server-side-only pipeline/admin tables... no anon/
--    authenticated access intended" (_push_staging, adi_cache, etc). Should
--    have been service_role only from the start.
--
-- 2. api.get_proprietary_datasets() is callable by anon AND authenticated --
--    Postgres grants EXECUTE to PUBLIC by default on function creation
--    unless explicitly revoked, and my migration didn't revoke it. This
--    returns internal business metrics for an admin-only page
--    (/admin/proprietary-intelligence) and should never have been callable
--    by a logged-in-but-non-admin user, let alone anonymously.

revoke select, insert, update, delete on api.scraper_source_state from anon, authenticated;

revoke execute on function api.get_proprietary_datasets() from public, anon, authenticated;
grant execute on function api.get_proprietary_datasets() to service_role;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705110051','tighten_overgranted_permissions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705110051_tighten_overgranted_permissions.sql
