-- Batch 2: 5 jurisdictions with primary-government-source citations.
-- Tiers match existing countries.regulatory_tier; this adds evidence-table rows.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('gob-ar-ariccame-20260913','AR','domestic_only',
 'Law 27.669 (2022) created ARICCAME, which licenses medicinal cannabis and industrial hemp cultivation, import, export, and commercialization. A regulated recreational adult-use commercial market has not been enacted.',
 'Argentina.gob.ar -- Boletin Oficial / Ley 27.669',
 'https://www.argentina.gob.ar/normativa/nacional/norma-365303/actualizacion',
 date '2022-05-26','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('ncc-gh-cannabis-licensing-20260913','GH','legal_commercial_access',
 'Narcotics Control Commission (Amendment) Act, 2023 and L.I. 2475 established a licensing regime under NACOC covering cultivation through export. Licenses restricted to cannabis with THC not exceeding 0.3% dry weight.',
 'Ghana Narcotics Control Commission (NACOC)',
 'https://www.ncc.gov.gh/cannabis-regulations/',
 date '2026-02-26','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('gov-ls-medigrow-20260913','LS','legal_commercial_access',
 'Lesotho Ministry of Health licensed medical-grade cannabis cultivation from 2017, oriented toward export to international medical markets.',
 'Government of Lesotho',
 'https://www.gov.ls/development/pm-launches-cannabis-cultivator/',
 date '2017-12-11','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('cra-mw-licensing-20260913','MW','legal_commercial_access',
 'Cannabis Regulation Act, 2020 established the CRA, which licenses cultivation through export of medicinal and industrial cannabis. Recreational use is not authorized.',
 'Malawi Cannabis Regulatory Authority (CRA)',
 'https://www.cra.gov.mw/',
 date '2020-05-08','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('cla-jm-licensing-20260913','JM','legal_commercial_access',
 'Cannabis Licensing Authority issues cultivator through export licenses for medical/scientific ganja under the Dangerous Drugs (Amendment) Act framework.',
 'Cannabis Licensing Authority of Jamaica',
 'https://cla.gov.jm/',
 date '2015-04-15','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
