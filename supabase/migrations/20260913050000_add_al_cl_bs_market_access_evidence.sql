-- Batch 6: 3 more jurisdictions. Same sourcing bar.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('nacc-al-export-only-20260913','AL','legal_commercial_access',
 'Law No. 61/2023 "On the Control of the Cultivation and Processing of the Cannabis Plant and the Production of its By-products for Medical and Industrial Purposes," passed 21 July 2023, published in the Official Gazette August 2023. Establishes the National Agency for Cannabis Control (NACC) to license cultivation, processing, transport, and export of cannabis for medical/industrial purposes. Products are strictly export-only -- domestic retail, wholesale, distribution, and consumption remain prohibited. Industrial hemp threshold set at 0.8% THC.',
 'National Agency for Cannabis Control (NACC), Albania',
 'https://www.nacc.gov.al/en/legislation/',
 date '2023-08-21','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('sag-cl-cultivo-20260913','CL','domestic_only',
 'Ley 20.000 (2005), as amended by a May 2023 addition to Article 8, recognizes a valid medical prescription as legal justification for personal cultivation or possession of cannabis for therapeutic purposes. Chilean courts (e.g. Corte Suprema, caso Triagrama, Rol 4949-2015) have separately held that cultivation for personal, exclusive, near-term consumption is not a criminal offense. SAG (Servicio Agricola y Ganadero) authorizes and oversees cultivation permits. No licensed commercial adult-use retail market exists.',
 'Chile Servicio Agricola y Ganadero (SAG)',
 'https://www.sag.gob.cl/sites/default/files/reg__ley_20_000_estupefacientes.pdf',
 date '2005-02-16','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('opm-bs-cannabis-act-20260913','BS','domestic_only',
 'The Cannabis Act, 2024 (assented 18 July 2024) and companion Dangerous Drugs (Amendment) Act remove cannabis ("Indian Hemp") from the controlled-substances schedule and establish the Bahamas Cannabis Authority to license cultivation, manufacturing, testing, and distribution for medical/religious/scientific purposes, plus a $250 fixed-penalty decriminalization for possession under 30g. As of the most recent independent verification (mid-2026), implementing regulations for the decriminalization and licensing provisions were reported as not yet fully in force -- recreational use and unlicensed activity remain criminal offenses in practice.',
 'Bahamas Office of the Prime Minister / Bahamas Laws Online',
 'https://opm.gov.bs/wp-content/uploads/2023/08/Cannabis-Bill-2023.pdf',
 date '2024-07-18','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
