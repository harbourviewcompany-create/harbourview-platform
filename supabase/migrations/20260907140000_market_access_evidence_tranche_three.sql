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
