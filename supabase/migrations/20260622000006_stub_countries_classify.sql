BEGIN;

-- =============================================================================
-- Migration: Gap F – Upgrade 84 stub countries to 'seed' data completeness
-- Table: public.countries
-- Generated: 2026-06-22
-- Description: Accurate cannabis regulatory classifications for all stub-level
--              country records, covering market access, medical/adult-use status,
--              import/export posture, opportunity score, regulator, and summary.
-- Idempotent: Yes – re-running overwrites with the same values.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- AFRICA (40 countries)
-- ---------------------------------------------------------------------------

-- Angola: prohibition, no medical framework, illicit use prevalent
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Angola maintains a full prohibition on cannabis under the 2019 Law on Drug Trafficking, with no medical or industrial hemp framework in place. Enforcement is active and there are no credible signals of near-term reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AO';

-- Burkina Faso: prohibition, no framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Burkina Faso prohibits cannabis under national narcotics law with no medical or hemp regulatory pathway. Political instability following the 2022 coup has further delayed any drug-policy reform agenda.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BF';

-- Burundi: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Burundi enforces strict prohibition on all cannabis under its narcotics legislation, with severe criminal penalties for possession or trafficking. There is no active reform discussion and the country is not a signatory to any regional cannabis-policy initiatives.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BI';

-- Benin: prohibition, minor hemp tradition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Benin prohibits recreational and medical cannabis under its 1997 narcotics law; possession carries criminal penalties. Neighbouring reform trends in West Africa have not yet translated into domestic policy signals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BJ';

-- Botswana: discussed decriminalisation, still prohibited
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = NULL,
  public_summary       = 'Botswana has debated cannabis decriminalisation in parliament and civil society forums, reflecting growing reform sentiment in southern Africa. No legislation has passed to date and personal possession remains a criminal offence under the Drugs and Related Substances Act.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BW';

-- DR Congo: prohibition, no framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'The Democratic Republic of Congo prohibits cannabis under national law; enforcement is inconsistent given the scale of the country and ongoing conflict in eastern provinces. There is no medical or industrial hemp regulatory framework.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CD';

-- Central African Republic: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'The Central African Republic prohibits cannabis cultivation and use; state authority is limited in large parts of the territory due to ongoing armed conflict. No regulatory or reform pathway exists at this time.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CF';

-- Republic of Congo: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'The Republic of Congo (Congo-Brazzaville) maintains full prohibition on cannabis with criminal penalties under its narcotics legislation. No medical programme or hemp framework exists, and reform discussions have not emerged publicly.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CG';

-- Cameroon: prohibition, illicit cultivation
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Cameroon prohibits cannabis under Law No. 92/006 and related narcotics provisions, though illicit cultivation is widespread in the Western Highlands and Littoral regions. No medical or licensed hemp framework exists, and penalties for trafficking are severe.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CM';

-- Cape Verde: prohibition, small island state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Cape Verde criminalises cannabis possession and trafficking under the 2004 Drugs Law, though small-scale use is common and enforcement varies by island. The country has observed neighbouring decriminalisation trends but has not initiated formal reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'CV';

-- Djibouti: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Djibouti prohibits cannabis under its national narcotics law; the country is primarily a transit corridor for khat rather than cannabis. No medical programme or reform discussion has been recorded.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'DJ';

-- Western Sahara: disputed territory, no functional government
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Western Sahara is a disputed, non-self-governing territory administered largely by Morocco, with no independent legal framework of its own. Cannabis policy defaults to Moroccan law in administered areas; no commercial opportunity exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'EH';

-- Ethiopia: prohibition, reform signals minimal
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Ethiopia prohibits cannabis under the 2004 Anti-Narcotics Law, though illicit cultivation is widespread in the Kaffa and Bench-Sheko zones. No medical framework exists and the ongoing internal conflicts have deprioritised drug-policy reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ET';

-- Gabon: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Gabon criminalises cannabis under its narcotics legislation and has no medical or hemp licensing framework. Following the 2023 military coup, drug-policy reform is not a government priority.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GA';

-- Gambia: prohibition, small market
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'The Gambia prohibits cannabis under the Drug Control Act 2003, with penalties for possession and trafficking. Civil society has raised decriminalisation proposals but no formal legislation has been tabled.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GM';

-- Guinea: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Guinea prohibits cannabis production and use under its narcotics law; the country has been subject to military governance since the 2021 coup. No drug-policy reform framework is active.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GN';

-- Equatorial Guinea: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Equatorial Guinea maintains strict prohibition on cannabis under its narcotics legislation, with no medical or industrial hemp programme. The authoritarian governance structure leaves little space for drug-policy reform.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GQ';

-- Guinea-Bissau: prohibition, transit state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Guinea-Bissau prohibits cannabis under national law and is internationally noted primarily as a cocaine transit hub rather than a cannabis market. Political instability has prevented any regulatory modernisation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GW';

-- Kenya: 2024 cannabis bill, hemp activity, emerging
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 38,
  regulator_label      = 'Agriculture and Food Authority (AFA)',
  public_summary       = 'Kenya introduced a Cannabis Control Bill in 2024 and has an active industrial hemp pilot programme regulated by the Agriculture and Food Authority. Medical cannabis remains formally prohibited but parliamentary debate signals near-term reform potential.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KE';

-- Comoros: prohibition, island micro-state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'The Comoros prohibits cannabis under national law with no medical or licensed framework; the islands have a very small domestic market. No reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KM';

-- Liberia: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Liberia prohibits cannabis under the Controlled Substance Act; enforcement is limited outside of Monrovia. No medical or hemp regulatory framework has been developed.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'LR';

-- Madagascar: prohibition, illicit cultivation
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Madagascar prohibits cannabis under national narcotics law but illicit cultivation is widespread, particularly in the Vakinankaratra and Diana regions. There is no licensed medical or hemp framework and no active reform legislation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MG';

-- Mali: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Mali prohibits cannabis under its narcotics law; political instability following successive coups since 2020 has suspended any drug-policy modernisation. No medical or hemp programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ML';

-- Mauritania: strict prohibition, Islamic law influence
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Mauritania enforces strict prohibition on cannabis consistent with Islamic-influenced national law; penalties are severe. There is no medical or hemp framework and no reform discussion.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MR';

-- Mozambique: prohibition, some hemp discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'Mozambique prohibits cannabis under its narcotics legislation, though civil society and some lawmakers have raised legalisation discussions in the context of the country''s agricultural potential. No formal bill or regulatory framework has advanced.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MZ';

-- Namibia: 2024 decrim discussion, emerging
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = NULL,
  public_summary       = 'Namibia''s parliament debated cannabis decriminalisation in 2024, with proposals to remove criminal penalties for personal use. The country has not yet enacted legislation, but political signals suggest reform is on the near-term agenda.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NA';

-- Niger: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Niger prohibits cannabis under national narcotics law; following the 2023 military coup, drug-policy reform is not a priority. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NE';

-- Nigeria: prohibition, large population, decrim discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = 'National Drug Law Enforcement Agency (NDLEA)',
  public_summary       = 'Nigeria prohibits cannabis under the NDLEA Act, but the country''s large population and growing civil society advocacy have kept decriminalisation on the legislative agenda. Hemp cultivation pilot schemes have been discussed but no formal medical or adult-use framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NG';

-- Rwanda: prohibition, some regional hub ambitions
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = NULL,
  public_summary       = 'Rwanda maintains strict prohibition on cannabis; penalties are enforced and the government has not advanced any medical or hemp framework. Some investors have speculated about Rwanda''s potential as a regional regulatory hub given its business environment, but no reform has materialised.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'RW';

-- Sierra Leone: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = NULL,
  public_summary       = 'Sierra Leone prohibits cannabis under its Pharmacy and Drugs Act; illicit use is common but no licensed framework exists. There is limited parliamentary discussion of decriminalisation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SL';

-- Senegal: prohibition, West Africa reform debate
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'Senegal prohibits cannabis under the 1997 narcotics law, though Casamance is historically a significant illicit cultivation region. No medical or hemp framework has been established despite broader West African reform debates.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SN';

-- South Sudan: prohibition, fragile state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'South Sudan prohibits cannabis under national law; state capacity to enforce any regulatory framework is severely limited by ongoing conflict and institutional fragility. No medical or commercial framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SS';

-- São Tomé and Príncipe: prohibition, small island state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'São Tomé and Príncipe prohibits cannabis under its narcotics legislation; the island nation''s small size and limited regulatory capacity preclude near-term commercial development. No reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ST';

-- Eswatini: prohibition, illicit export to South Africa notable
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Eswatini (formerly Swaziland) prohibits cannabis under the Opium and Habit-Forming Drugs Act, though the country is historically a significant illicit producer supplying South Africa. Some stakeholders have called for licensed cultivation to formalise this existing agricultural capacity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SZ';

-- Chad: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Chad enforces strict prohibition on cannabis; the country''s political instability and limited state capacity make any regulatory framework implausible in the near term. No medical or hemp programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TD';

-- French Southern Territories: uninhabited, no framework
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'The French Southern and Antarctic Territories are uninhabited research and nature-reserve islands with no resident population or commercial activity. French national law nominally applies, but there is no cannabis market or regulatory context.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TF';

-- Togo: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 14,
  regulator_label      = NULL,
  public_summary       = 'Togo prohibits cannabis under its narcotics legislation; the country has no medical or industrial hemp framework. West African reform trends have not yet produced domestic legislative activity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TG';

-- Tanzania: prohibition, strict enforcement
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 16,
  regulator_label      = 'Tanzania Food and Drugs Authority (TFDA)',
  public_summary       = 'Tanzania prohibits cannabis under the Drugs and Prevention of Illicit Traffic in Drugs Act 1995; penalties are severe and enforcement is active. No medical or hemp regulatory pathway has been opened despite the country''s agricultural capacity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TZ';

-- Uganda: prohibition, some hemp discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'Uganda prohibits cannabis under the Narcotic Drugs and Psychotropic Substances Act 2015; illicit cultivation is extensive in the Masaka and Mbarara regions. Hemp and medical cannabis licensing has been discussed but no framework has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'UG';

-- Zambia: prohibition, some reform signals
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Zambia prohibits cannabis under the Narcotic Drugs and Psychotropic Substances Act; the government has discussed industrial hemp licensing as an economic diversification measure. No medical or adult-use framework has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ZM';

-- ---------------------------------------------------------------------------
-- AMERICAS (14 unique countries)
-- ---------------------------------------------------------------------------

-- Bahamas: prohibition, some CBD discussion
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'The Bahamas criminalises cannabis under the Dangerous Drugs Act; there have been parliamentary discussions about decriminalisation and medical access aligned with CARICOM recommendations. No formal medical or adult-use programme has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BS';

-- Dominica: decriminalisation passed 2023, CARICOM aligned
UPDATE public.countries SET
  market_access_status = 'limited',
  medical_status       = 'restricted',
  adult_use_status     = 'limited',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 30,
  regulator_label      = NULL,
  public_summary       = 'Dominica enacted cannabis decriminalisation in 2023 following CARICOM recommendations, allowing personal possession of small quantities without criminal penalty. A medical licensing framework has been discussed but not yet established.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'DM';

-- Dominican Republic: CBD and hemp allowed, medical discussion
UPDATE public.countries SET
  market_access_status = 'emerging',
  medical_status       = 'limited',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'restricted',
  opportunity_score    = 42,
  regulator_label      = 'Consejo Nacional de Drogas (CND)',
  public_summary       = 'The Dominican Republic permits CBD products with low THC under a regulatory framework developed by the Consejo Nacional de Drogas, and a medical cannabis bill has advanced in congress. Full medical licensing has not been enacted, but the trajectory points to a regulated medical market in the near term.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'DO';

-- Falkland Islands: UK territory, restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'The Falkland Islands are a British Overseas Territory and follow UK narcotics law; cannabis is a Class B controlled substance. The territory''s tiny population (~3,500) and remote location make any commercial development implausible.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'FK';

-- Greenland: Danish territory, follows Danish law, restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Greenland is an autonomous territory of Denmark and operates under Danish narcotics law, under which cannabis remains illegal. Denmark''s medical cannabis pilot scheme technically applies but market access in Greenland is negligible given the sparse population.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GL';

-- South Georgia: uninhabited British territory
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'South Georgia and the South Sandwich Islands are a British Overseas Territory with no permanent civilian population; only research station personnel are present. There is no applicable cannabis market or regulatory framework.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GS';

-- Guyana: decriminalised personal use
UPDATE public.countries SET
  market_access_status = 'limited',
  medical_status       = 'restricted',
  adult_use_status     = 'limited',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = NULL,
  public_summary       = 'Guyana decriminalised personal possession of up to 30 grams of cannabis in 2020 under the Narcotics Drugs and Psychotropic Substances (Control) (Amendment) Act. A medical and hemp regulatory framework has been discussed but not enacted, leaving the formal market undeveloped.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GY';

-- Haiti: prohibition, fragile state
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Haiti prohibits cannabis under its narcotics legislation; severe political instability and gang violence have rendered effective regulatory enforcement or reform impossible. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'HT';

-- Saint Lucia: decriminalised personal use 2022
UPDATE public.countries SET
  market_access_status = 'limited',
  medical_status       = 'restricted',
  adult_use_status     = 'limited',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = 'Saint Lucia Cannabis Licensing Authority',
  public_summary       = 'Saint Lucia decriminalised cannabis possession (up to 28 g) and home cultivation (up to 4 plants) in 2022 and established the Cannabis Licensing Authority to oversee a future regulated market. A full commercial framework is under development but not yet operational.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'LC';

-- Nicaragua: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Nicaragua prohibits cannabis under the Law on Narcotics, Psychotropics and Other Controlled Substances; the Ortega government has shown no interest in reform. No medical or hemp licensing programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NI';

-- Paraguay: illegal but major illicit producer
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = 'SENAD (National Anti-Drug Secretariat)',
  public_summary       = 'Paraguay is one of South America''s largest illicit cannabis producers, supplying Brazil and Argentina, but cannabis remains illegal under national law. A medical and hemp regulatory bill has been debated in congress, reflecting the tension between illicit production scale and prohibitionist policy.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PY';

-- Suriname: prohibition, CARICOM adjacent
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Suriname prohibits cannabis under the Opium Act; decriminalisation discussions have occurred in parliament but no legislation has passed. The country''s position between major South American producing countries influences its drug-policy debate.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SR';

-- El Salvador: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'El Salvador prohibits cannabis under the Law Regulating Narcotics and Psychotropic Substances; the Bukele government has focused drug policy on gang suppression rather than cannabis reform. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SV';

-- US Virgin Islands: US territory, federal restricted but territory has medical law
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = 'Virgin Islands Cannabis Advisory Board',
  public_summary       = 'The US Virgin Islands enacted a medical cannabis programme in 2019 and the Virgin Islands Cannabis Advisory Board oversees licensing of dispensaries and cultivators. Federal law (Controlled Substances Act) still prohibits interstate commerce, limiting import and export.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'VI';

-- ---------------------------------------------------------------------------
-- ASIA (11 stubs)
-- ---------------------------------------------------------------------------

-- Armenia: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Armenia criminalises cannabis under the Criminal Code; penalties for possession were reduced in 2021 but supply and trafficking remain serious offences. No medical or hemp licensing framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AM';

-- Azerbaijan: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Azerbaijan enforces strict prohibition on cannabis under the Law on Narcotic Drugs; penalties for possession and trafficking are severe. There is no medical or hemp regulatory framework and no reform signals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AZ';

-- Kyrgyzstan: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Kyrgyzstan prohibits cannabis under the Criminal Code despite historical wild growth of cannabis in the Chu Valley; enforcement has tightened in recent years. No licensed medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KG';

-- Cambodia: technically restricted but very permissive in practice
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 32,
  regulator_label      = NULL,
  public_summary       = 'Cambodia technically prohibits recreational cannabis following a 2022 crackdown that reversed earlier de facto tolerance in tourism venues; enforcement remains inconsistent outside Phnom Penh. A government working group has studied medical and industrial hemp licensing but no formal framework has been enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KH';

-- Kazakhstan: restricted, some hemp tradition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 25,
  regulator_label      = NULL,
  public_summary       = 'Kazakhstan prohibits cannabis under the Criminal Code; the country has a historical wild-growing cannabis belt in the Chu Valley (Chuy Oblast) but has cracked down on illicit production. An industrial hemp licensing regulation was drafted in 2023 but not yet fully enacted.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KZ';

-- Mongolia: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Mongolia prohibits cannabis under the Law on Combating Drug Abuse; the country has no medical or hemp regulatory framework. There are no credible reform signals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MN';

-- Nepal: religious/traditional use, technically illegal, reform signals
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 25,
  regulator_label      = NULL,
  public_summary       = 'Nepal criminalised cannabis in 1973 following US pressure, ending centuries of cultural and religious use; parliamentary bills to re-legalise or licence production for export have been repeatedly introduced but not passed. The country''s agricultural potential and historic use make it a medium-term reform candidate.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NP';

-- Palestine: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Cannabis is prohibited in the Palestinian territories under Jordanian-era law (West Bank) and Egyptian-era law (Gaza), neither of which has been superseded by a modern Palestinian drug law. The conflict environment precludes any near-term regulatory development.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PS';

-- Tajikistan: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Tajikistan enforces strict prohibition on cannabis under the Criminal Code; the country serves as a transit route for Afghan opiates and enforces narcotics law harshly. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TJ';

-- Timor-Leste: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Timor-Leste prohibits cannabis under the Law Against Drugs 2004; limited state capacity means enforcement is inconsistent but no framework for licensed use exists. There are no active reform proposals.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'TL';

-- Uzbekistan: strict prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Uzbekistan enforces strict prohibition on cannabis under the Criminal Code, with sentences of up to 20 years for trafficking. No medical or industrial hemp regulatory framework exists and no reform signals have been observed.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'UZ';

-- ---------------------------------------------------------------------------
-- EUROPE (10 stubs)
-- ---------------------------------------------------------------------------

-- Albania: large-scale illicit production, recent tolerance signals
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = NULL,
  public_summary       = 'Albania is one of Europe''s largest illicit cannabis producers, centred on the Lazarat region, though major police operations since 2014 have partially disrupted production. The government has signalled interest in legalising and licensing medical cannabis cultivation for export as part of EU accession-era regulatory modernisation.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AL';

-- Åland Islands: Finnish autonomous territory, follows Finnish framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 25,
  regulator_label      = 'Finnish Medicines Agency (Fimea)',
  public_summary       = 'Åland is an autonomous Finnish archipelago province and follows Finnish national law, including the Narcotics Act under which cannabis is controlled. Finland''s limited medical cannabis framework (prescription-only via Fimea) technically applies, but the local market is negligible.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'AX';

-- Bosnia and Herzegovina: medical cannabis law passed 2022
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'limited',
  opportunity_score    = 52,
  regulator_label      = 'Agency for Medicines and Medical Devices of BiH (ALMBIH)',
  public_summary       = 'Bosnia and Herzegovina passed a Law on Narcotic Drugs amendment in 2022 permitting medical cannabis; the Agency for Medicines and Medical Devices (ALMBIH) is developing the licensing framework. Early-stage cultivation licences have been issued and the country is positioning for EU-GMP exports as the framework matures.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'BA';

-- Faroe Islands: Danish autonomous territory, follows Danish framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = NULL,
  public_summary       = 'The Faroe Islands are an autonomous Danish territory and follow Danish narcotics law, under which cannabis remains prohibited outside of Denmark''s limited medical pilot. The islands'' small population (~55,000) and remote location offer negligible commercial opportunity.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'FO';

-- Isle of Man: follows UK framework, licensed CBD
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'restricted',
  opportunity_score    = 38,
  regulator_label      = 'Isle of Man Food and Drugs Authority',
  public_summary       = 'The Isle of Man is a British Crown Dependency that mirrors UK medicines law; Schedule 2 cannabis-based medicines (e.g. Sativex, Epidyolex) are available on prescription, and the FSA CBD novel food framework applies. The island''s financial services sector has explored cannabis business registration, but the domestic market is very small.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'IM';

-- Moldova: restricted, some hemp
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 28,
  regulator_label      = 'National Regulatory Agency for Medicines and Medical Devices (ANMDM)',
  public_summary       = 'Moldova prohibits cannabis under the Criminal Code; industrial hemp cultivation with THC <0.3% is permitted under an agricultural licensing regime. No medical cannabis framework has been enacted, though EU association discussions may prompt future alignment.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MD';

-- Montenegro: prohibition, EU candidate
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 22,
  regulator_label      = NULL,
  public_summary       = 'Montenegro prohibits cannabis under the Law on Psychoactive Substances; as an EU accession candidate, the country is aligning its narcotics legislation with EU frameworks but has not introduced medical cannabis provisions. No licensed market exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'ME';

-- North Macedonia: EU-GMP licensed exporters, major exporter
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'limited',
  export_status        = 'active',
  opportunity_score    = 72,
  regulator_label      = 'Agency for Medicines and Medical Devices (MALMED)',
  public_summary       = 'North Macedonia is one of the Western Balkans'' leading licensed cannabis exporters; MALMED has issued EU-GMP cultivation and processing licences to several operators including Alkaloid AD and Tikun Olam partnership entities. The country exports finished medical cannabis products to Germany, Poland, and other EU markets, positioning it as a strategic low-cost EU-supply corridor.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'MK';

-- Kosovo: prohibition
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Kosovo prohibits cannabis under the Law on Prevention of Use and Suppression of Abuse of Narcotic Drugs; the country has no medical or hemp regulatory framework. Limited statehood recognition constrains participation in international trade agreements.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'XK';

-- ---------------------------------------------------------------------------
-- OCEANIA (10 stubs)
-- ---------------------------------------------------------------------------

-- Fiji: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Fiji prohibits cannabis under the Illicit Drugs Control Act 2004 with substantial penalties for cultivation and trafficking. No medical or industrial hemp framework exists and no reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'FJ';

-- Guam: US territory, territorial medical law
UPDATE public.countries SET
  market_access_status = 'regulated',
  medical_status       = 'regulated',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 35,
  regulator_label      = 'Guam Cannabis Control Board',
  public_summary       = 'Guam enacted a Medical Cannabis Patient Protection Act and established the Cannabis Control Board to licence dispensaries and cultivators serving registered patients. Federal law prevents interstate commerce, so the market serves the island''s ~170,000 residents and some medical tourists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'GU';

-- Heard Island: uninhabited Australian territory
UPDATE public.countries SET
  market_access_status = 'unknown',
  medical_status       = 'unknown',
  adult_use_status     = 'unknown',
  import_status        = 'unknown',
  export_status        = 'unknown',
  opportunity_score    = 10,
  regulator_label      = NULL,
  public_summary       = 'Heard Island and McDonald Islands are an uninhabited Australian external territory used only for scientific research. There is no resident population, commercial activity, or applicable cannabis regulatory context.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'HM';

-- Kiribati: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'Kiribati prohibits cannabis under its narcotics legislation; the nation''s extreme remoteness, small population (~120,000), and limited institutional capacity make any regulatory framework implausible. No reform signals have been observed.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'KI';

-- New Caledonia: French special collectivity, follows French framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'New Caledonia is a French special collectivity and applies French narcotics law, under which cannabis is prohibited; France does not operate a recreational market and its medical access is extremely limited. The territory has no independent cannabis regulatory framework.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'NC';

-- French Polynesia: French overseas collectivity, follows French framework
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 20,
  regulator_label      = NULL,
  public_summary       = 'French Polynesia applies French national law, under which cannabis is a prohibited narcotic; some CBD products are available following France''s 2022 CBD regulatory clarification. No independent cannabis market or licensing framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PF';

-- Papua New Guinea: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 18,
  regulator_label      = NULL,
  public_summary       = 'Papua New Guinea prohibits cannabis under the Dangerous Drugs Act; illicit cultivation is widespread in the Highlands region. No medical or hemp licensing framework has been established.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'PG';

-- Solomon Islands: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 12,
  regulator_label      = NULL,
  public_summary       = 'The Solomon Islands prohibit cannabis under the Dangerous Drugs Act; the country''s limited institutional capacity and small economy preclude near-term regulatory development. No reform signals have been identified.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'SB';

-- Vanuatu: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Vanuatu prohibits cannabis under the Dangerous Drugs Act; the archipelago nation''s offshore financial centre status has attracted some cannabis company incorporations. No domestic cultivation or medical licensing programme exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'VU';

-- Samoa: restricted
UPDATE public.countries SET
  market_access_status = 'restricted',
  medical_status       = 'restricted',
  adult_use_status     = 'restricted',
  import_status        = 'restricted',
  export_status        = 'restricted',
  opportunity_score    = 15,
  regulator_label      = NULL,
  public_summary       = 'Samoa prohibits cannabis under the Narcotics Act 1967; the country is a signatory to the UN drug conventions and has not initiated any reform discussion. No medical or hemp framework exists.',
  data_completeness    = 'seed'
WHERE iso_alpha2 = 'WS';

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Total UPDATE statements: 84
--
-- By region:
--   Africa  : 40 countries (AO, BF, BI, BJ, BW, CD, CF, CG, CM, CV, DJ, EH,
--                            ET, GA, GM, GN, GQ, GW, KE, KM, LR, MG, ML, MR,
--                            MZ, NA, NE, NG, RW, SL, SN, SS, ST, SZ, TD, TF,
--                            TG, TZ, UG, ZM)
--   Americas: 14 countries (BS, DM, DO, FK, GL, GS, GY, HT, LC, NI, PY, SR,
--                            SV, VI)
--   Asia    : 11 countries (AM, AZ, KG, KH, KZ, MN, NP, PS, TJ, TL, UZ)
--   Europe  : 10 countries (AL, AX, BA, FO, IM, MD, ME, MK, XK)
--              Note: AX (Åland Islands) counted under Europe per task spec
--   Oceania : 10 countries (FJ, GU, HM, KI, NC, PF, PG, SB, VU, WS)
--
-- data_completeness upgraded: stub → seed for all 84 rows.
--
-- Opportunity score distribution:
--   score ≥ 70 : MK (72)                                              [1]
--   score 50-69: BA (52)                                              [1]
--   score 40-49: DO (42)                                              [1]
--   score 30-39: AL (35), GU (35), GY (35), VI (35), KE (38), IM (38),
--                KH (32), NA (32), NG (32), LC (32), DM (30)         [11]
--   score 22-29: AM (22), BW (28), CM (18→18 restricted), DM see above,
--                EH (10), FO (28), GL (22), GS (10), HM (10), MD (28),
--                ME (22), MN (18), MZ (20), NC (20), NP (25), PF (20),
--                PY (22), RW (28), SR (22), SZ (22), TF (10), UZ (18),
--                XK (18), ZM (22), AX (25), KZ (25)                  [many]
--   score 10-21: all remaining fully-prohibited or uninhabited entries
-- =============================================================================


COMMIT;
