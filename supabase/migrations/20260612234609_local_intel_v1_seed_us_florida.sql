-- Seed the first real local-intel record set (US / Florida) into the new local_intel_v1
-- tables, migrating the content that was previously hardcoded in CommandCentre.tsx's
-- LocalIntelPage (buildAuthorities, buildMunicipalData, LI_CONSTRAINTS, LI_ROUTES, LI_COVERAGE).

update public.local_intel_coverage
set coverage_status = 'available', last_reviewed_at = now()
where country_code = 'US';

-- Authorities org chart (US-FL)
insert into public.local_authorities (country_code, subdivision_code, org_tier, authority_type, authority_name, authority_role, display_order)
values
  ('US','US-FL','top','primary',    'Office of Medical Marijuana Use (OMMU)',            'Program Lead', 0),
  ('US','US-FL','mid','primary',    'FL Dept of Health',                                  'Health Oversight', 0),
  ('US','US-FL','mid','oversight',  'FL Dept of Agriculture & Consumer Services',         'Lab & Product Oversight', 1),
  ('US','US-FL','mid','oversight',  'FL Office of Insurance Regulation',                  'Licensing & Compliance', 2),
  ('US','US-FL','bot','enforcement','Division of Law Enforcement (MMJ Team)',             'Investigations & Enforcement', 0),
  ('US','US-FL','bot','enforcement','Local Law Enforcement Agencies',                     'Local Enforcement', 1);

-- Subdivision (county) intel
insert into public.local_subdivisions_intel (country_code, subdivision_code, subdivision_name, status_level, note, display_order)
values
  ('US','US-FL','Miami-Dade County',       'medium', 'Dispensary caps in place', 0),
  ('US','US-FL','Orlando (Orange County)', 'high',   'Zoning moratorium active', 1),
  ('US','US-FL','Tampa (Hillsborough)',    'high',   'Conditional approvals paused', 2),
  ('US','US-FL','Jacksonville (Duval)',    'low',    'Accepting applications', 3),
  ('US','US-FL','Palm Beach County',       'medium', 'Case-by-case review', 4);

-- Operating notes: constraints
insert into public.local_operating_notes (country_code, subdivision_code, note_category, icon, label, body_text, display_order)
values
  ('US','US-FL','constraint','⊞','Zoning & Land Use',     'Local zoning approval required in most jurisdictions; moratoriums active in several counties.', 0),
  ('US','US-FL','constraint','⊟','Cap & Licensing Limits','Dispensary caps at state level; local license quotas may apply.', 1),
  ('US','US-FL','constraint','◉','Facility Siting',       'Buffer zones near schools, places of worship, and parks strictly enforced.', 2),
  ('US','US-FL','constraint','◷','Inspection Backlog',    'OIR inspection backlog may extend time to licensure renewal or modification.', 3);

-- Operating notes: supply routes
insert into public.local_operating_notes (country_code, subdivision_code, note_category, icon, label, body_text, display_order)
values
  ('US','US-FL','supply_route','⬡','In-State Cultivation → Processing', 'Vertical integration required; limited third-party processing options.', 0),
  ('US','US-FL','supply_route','◈','Processing → Dispensary',           'Direct delivery with prior OMMU approval; chain-of-custody mandatory.', 1),
  ('US','US-FL','supply_route','⊟','Out-of-State Inputs',               'Restricted; only approved ancillary inputs permitted.', 2),
  ('US','US-FL','supply_route','◎','Waste Disposal',                    'Use licensed waste transporters; records retention required.', 3);

-- Evidence coverage
insert into public.local_evidence_coverage (country_code, category_label, coverage_level, display_order)
values
  ('US','State Regulatory Bulletins',  'high',   0),
  ('US','Agency Guidance',             'high',   1),
  ('US','Local Government Notices',    'medium', 2),
  ('US','Industry & Trade Sources',     'medium', 3),
  ('US','Legal & Legislative Tracking','high',   4);
