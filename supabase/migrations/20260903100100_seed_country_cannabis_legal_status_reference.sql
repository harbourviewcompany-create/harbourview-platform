-- Country-level cannabis legal framework classification -- NOT per-SKU
-- packaging/import compliance (see listings.compliance_flags for that,
-- which currently only has real, individually-researched content for CA).
--
-- Scope disclosure: this is a general research pass covering 41 of ~195
-- ISO2 countries -- the markets where the legal framework is well
-- documented and current as of 2026 (major recreational/medical markets,
-- a few clearly-prohibited majors). It is NOT an individually-verified
-- audit of all 190+ countries. Countries not present in this table should
-- be treated as unresearched, not assumed legal or assumed prohibited.
-- Deeper, SKU-level compliance work (the kind done for CA packaging, and
-- the equipment/lab-only extension done for DE/AU) should follow for any
-- specific market before it's treated as a fully compliance-reviewed
-- addition to the catalog.
--
-- Already applied directly to the live project this session.

create table if not exists public.country_cannabis_legal_status (
  iso2 text primary key,
  country_name text not null,
  legal_status text not null check (legal_status in (
    'recreational_retail',
    'recreational_noncommercial',
    'medical_only',
    'cbd_hemp_only',
    'prohibited',
    'unresearched'
  )),
  notes text,
  last_reviewed date not null default current_date
);

comment on table public.country_cannabis_legal_status is
  'Country-level cannabis legal framework classification (NOT per-SKU packaging compliance -- see listings.compliance_flags for that, which currently only exists for CA). Populated from a general research pass, not individually verified per-country the way CA/DE/AU packaging rules were. Most of the ~195 ISO2 codes not present here default to unresearched in application logic, not assumed-prohibited or assumed-legal.';

insert into public.country_cannabis_legal_status (iso2, country_name, legal_status, notes) values
('CA','Canada','recreational_retail','Federally legal commercial recreational market since 2018.'),
('UY','Uruguay','recreational_retail','First country to fully legalize commercial recreational cannabis (2013).'),
('US','United States','recreational_retail','Federal law still prohibits cannabis; state-by-state patchwork -- recreational retail legal in 24 states + DC as of 2026, medical-only or fully illegal elsewhere. Treat as mixed, not uniformly legal.'),
('DE','Germany','recreational_noncommercial','Personal possession, home cultivation, and non-profit Cannabis Social Clubs legal since 2024; no commercial retail market yet (Pillar 2 pilot still pending as of 2026).'),
('MT','Malta','recreational_noncommercial','Personal possession and home cultivation legal; non-profit associations distribute, no commercial retail.'),
('LU','Luxembourg','recreational_noncommercial','Adults may grow up to 4 plants at home and possess small amounts; commercial sales remain prohibited.'),
('CZ','Czechia','recreational_noncommercial','Personal possession and home cultivation (up to 3 plants) legal since Jan 2026; commercial sales prohibited.'),
('ZA','South Africa','recreational_noncommercial','Constitutional Court ruling permits private personal use and cultivation; commercial sale remains prohibited.'),
('GE','Georgia','recreational_noncommercial','Constitutional Court rulings mean personal consumption is not punished, but cultivation/sale remain restricted.'),
('NL','Netherlands','recreational_noncommercial','Sale tolerated at licensed coffeeshops under a policy of non-enforcement, not full legalization; legal grey area, not a licensed retail framework.'),
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
('CH','Switzerland','cbd_hemp_only','Low-THC (under ~1%) CBD products broadly legal and commercially sold; higher-THC cannabis remains restricted to a limited pilot-program framework.'),
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
