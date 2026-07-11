-- Seeds regulatory_tier ONLY for jurisdictions we have actually reasoned about.
-- Every other country stays NULL and renders neutral.
--
-- Tier definitions:
--   legal_commercial_access : lawful cross-border commercial trade (import
--                             and/or export) exists and operates at scale.
--   medical_limited_trade   : lawful medical access exists; cross-border
--                             commercial trade is narrow, named-patient, or
--                             pilot-scale.
--   domestic_only           : lawful domestic production/sale, but no lawful
--                             cross-border commercial route.
--   prohibited              : no lawful commercial pathway.
--
-- Rationale text below is drawn from each country's own row in
-- cc_jurisdiction_briefings.program_status. Source is recorded per-row.
-- regulatory_tier_reviewed_at is deliberately left NULL for all of these.

-- legal_commercial_access
update public.countries set
  regulatory_tier = 'legal_commercial_access',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'DE' then 'Adult-use social club framework (CanG 2024); Europe''s largest medical import market with licensed importers.'
    when 'CA' then 'Federally legal adult-use; licensed producers hold export permits.'
    when 'PT' then 'Medical legal since 2018; licensed EU-GMP cultivation for export.'
    when 'NL' then 'State-licensed medical production with established cross-border medical supply.'
    when 'AU' then 'Medical legal; licensed import and export pathways in operation.'
    when 'CO' then 'Briefing states "Medical Legal - Export Industry Leader".'
    when 'IL' then 'Medical legal; approved medical cannabis export regime.'
    when 'ZA' then 'Medical cultivation licensed; export-oriented industry.'
    when 'GR' then 'Medical legal since 2017; briefing states "Licensed Export Industry".'
    when 'MK' then 'Briefing states "Established Programme and Export Industry".'
    when 'LS' then 'Briefing states "Medical Legal; Export-Oriented Pioneer".'
    when 'MA' then 'Medical and industrial cultivation legal since 2021.'
    when 'DK' then 'Permanent medical framework post-pilot; licensed cultivation and export.'
    when 'CY' then 'Medical prescription programme since 2019; briefing states "Export Hub".'
  end
where iso_alpha2 in ('DE','CA','PT','NL','AU','CO','IL','ZA','GR','MK','LS','MA','DK','CY');

-- medical_limited_trade
update public.countries set
  regulatory_tier = 'medical_limited_trade',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'GB' then 'Medical only - Schedule 2 prescription. Lawful access, thin commercial route.'
    when 'FR' then 'Medical pilot programme (ANSM); not yet a commercial market.'
    when 'ES' then 'Prescription-only medical access; social clubs tolerated, not commercial.'
    when 'IT' then 'Prescription programme; military farm is sole domestic cultivator.'
    when 'CZ' then 'Medical legal since 2013; adult-use reform advancing but not in force.'
    when 'PL' then 'General prescription programme since 2017; supply is import-dependent.'
    when 'CH' then 'Medical legal; adult-use limited to pilot programmes.'
    when 'AT' then 'Prescription-only medical access.'
    when 'IE' then 'MCAP programme since 2019; narrow eligibility.'
    when 'HR' then 'Prescription programme since 2015.'
    when 'NO' then 'Prescription medical programme.'
    when 'BE' then 'Very limited medical access (Sativex).'
    when 'SE' then 'Very limited medical access (Sativex only).'
    when 'FI' then 'Sativex via specialist prescription only.'
    when 'RO' then 'Limited medical access (Sativex).'
    when 'BG' then 'Limited medical access (Sativex).'
    when 'SI' then 'Prescription medical programme.'
    when 'SK' then 'Named-patient access only.'
    when 'IS' then 'Limited prescription access.'
    when 'ZW' then 'Medical legal; pioneer in sub-Saharan Africa. Export regime still developing.'
    when 'JM' then 'Decriminalised; medical and sacramental use licensed. Export is nascent.'
    when 'JP' then 'Recreational prohibited; limited pharmaceutical access from 2024.'
    when 'KR' then 'Recreational prohibited; limited medical access (Epidiolex).'
  end
where iso_alpha2 in ('GB','FR','ES','IT','CZ','PL','CH','AT','IE','HR','NO','BE','SE','FI','RO','BG','SI','SK','IS','ZW','JM','JP','KR');

-- domestic_only
update public.countries set
  regulatory_tier = 'domestic_only',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'US' then 'Federal Schedule I. State programmes vary; cross-border commercial trade remains federally unlawful.'
    when 'UY' then 'Adult-use and medical legal domestically; cross-border commercial trade remains marginal.'
    when 'MT' then 'Personal cultivation legal since 2021; no commercial trade regime.'
    when 'LU' then 'Home cultivation legal since 2023; no commercial market.'
    when 'MX' then 'Medical legal; adult-use pending full regulation. No meaningful cross-border route.'
  end
where iso_alpha2 in ('US','UY','MT','LU','MX');

-- prohibited
-- Restricted to jurisdictions whose briefing states prohibition unambiguously.
-- Included so the map can actually show contrast; without at least one
-- prohibited tier the colouring communicates nothing.
update public.countries set
  regulatory_tier = 'prohibited',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = 'Briefing records prohibition with no lawful commercial pathway.'
where iso_alpha2 in ('SA','SG','MY','ID','AE','QA','KW','OM','BH','EG','CN','VN','PH','IR');
