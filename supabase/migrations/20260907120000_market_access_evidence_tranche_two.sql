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
