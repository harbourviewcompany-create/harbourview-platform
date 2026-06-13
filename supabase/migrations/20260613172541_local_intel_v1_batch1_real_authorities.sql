-- First real research batch for local_intel_v1: national cannabis regulatory
-- authorities for Canada, Germany, Netherlands, Uruguay, and Malta, verified via
-- web research (official government / established legal-guide sources), June 2026.
-- Only top-level national authority data is populated here. Subdivision/municipal,
-- constraint, route, and evidence-coverage detail remain pending_research-equivalent
-- (empty) for these countries until further research is done -- the dashboard
-- falls back to the generic "pending" framing for those sections honestly.

-- Canada (CA): Health Canada administers the federal Cannabis Act regulatory
-- program; provinces/territories license retail; federal partners (CBSA, CRA,
-- law enforcement) handle enforcement/import-export.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('CA','top','primary',   'Health Canada',                                  'Federal regulator under the Cannabis Act (licensing of cultivation, processing, medical sale, testing, research)', 0, 'Verified: canada.ca, June 2026'),
  ('CA','mid','oversight', 'Provincial & Territorial Governments',           'Authorize and license retail sale of non-medical cannabis', 0, 'Verified: canada.ca, June 2026'),
  ('CA','mid','oversight', 'Canada Revenue Agency (CRA)',                     'Cannabis cultivation/processing licensing (Excise Act, 2001)', 1, 'Verified: canada.ca, June 2026'),
  ('CA','bot','enforcement','Canada Border Services Agency (CBSA)',          'Import/export enforcement', 0, 'Verified: canada.ca, June 2026'),
  ('CA','bot','enforcement','Provincial & Local Law Enforcement',            'Compliance referrals and enforcement', 1, 'Verified: canada.ca, June 2026');

-- Germany (DE): BfArM / Cannabisagentur is the federal regulator for medical
-- cannabis cultivation, processing and distribution; Federal Ministry of Health
-- has policy oversight; Landesbehörden (state authorities) license/oversee
-- Cannabis Social Clubs under the 2024 CanG.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('DE','top','primary',   'Federal Institute for Drugs and Medical Devices (BfArM) / Cannabisagentur', 'National medical cannabis regulator: licenses cultivation, processing, import/export, distribution to pharmacies', 0, 'Verified: BfArM/CMS/Cannabis Europa, June 2026'),
  ('DE','mid','oversight', 'Federal Ministry of Health (Bundesgesundheitsministerium)', 'Policy oversight for the Cannabis Act (CanG) framework', 0, 'Verified: Cannabis Europa, June 2026'),
  ('DE','bot','enforcement','Landesbehörden (State Authorities)',            'License and oversee Cannabis Social Clubs (Anbauvereinigungen) under CanG', 0, 'Verified: Cannabis Europa, June 2026');

-- Netherlands (NL): Bureau voor Medicinale Cannabis (BMC) regulates medicinal
-- cannabis cultivation/supply; the regulated "Wietexperiment" licenses growers
-- for the closed coffee-shop supply chain pilot.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('NL','top','primary',   'Bureau voor Medicinale Cannabis (BMC)',          'Government agency regulating medicinal cannabis cultivation and supply', 0, 'Verified: Cannabis Europa, June 2026'),
  ('NL','mid','oversight', 'Wietexperiment Licensed Growers Programme',      'Regulated closed supply chain pilot for cannabis coffee-shops (10 licensed growers, 2023 cohort)', 0, 'Verified: Cannabis Europa / EMCDDA, June 2026');

-- Uruguay (UY): IRCCA (Instituto de Regulación y Control del Cannabis) is the
-- single national regulator covering pharmacy sales, home cultivation, and
-- cannabis clubs under Ley 19.172 (2013).
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('UY','top','primary',   'Instituto de Regulación y Control del Cannabis (IRCCA)', 'National regulator for pharmacy sales, home cultivation registration, and cannabis clubs under Ley 19.172', 0, 'Verified: Cannavigia / 420.place, June 2026');

-- Malta (MT): ARUC (Authority for the Responsible Use of Cannabis), established
-- by Chapter 628 of the Laws of Malta (2021), licenses and regulates non-profit
-- Cannabis Harm Reduction Associations (CHRAs).
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('MT','top','primary',   'Authority for the Responsible Use of Cannabis (ARUC)', 'Established under Chapter 628 (2021); licenses and regulates Cannabis Harm Reduction Associations (CHRAs)', 0, 'Verified: aruc.mt / CSB Group, June 2026');

-- Mark these 5 countries as having an initial verified research pass.
update public.local_intel_coverage
set coverage_status = 'available',
    last_reviewed_at = now(),
    notes = 'Initial research pass: national-level regulatory authority verified via web research (June 2026). Subdivision/municipal detail, operating constraints, supply routes, and evidence coverage not yet researched for this country.'
where country_code in ('CA','DE','NL','UY','MT');
