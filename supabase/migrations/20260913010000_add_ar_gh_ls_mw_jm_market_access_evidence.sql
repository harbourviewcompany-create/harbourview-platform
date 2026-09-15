-- Batch 2: 5 more jurisdictions with primary-government-source citations, same bar
-- as the rest of this table. Contributed as a suggestion into this branch.
--
-- Tiers match this repo's existing countries.regulatory_tier classification for each
-- (set earlier via api.set_regulatory_tier with sourced rationale); this migration
-- adds the structured evidence-table citation that field was still missing.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('gob-ar-ariccame-20260913','AR','domestic_only',
 'Law 27.669 (2022) created ARICCAME (Agencia Regulatoria de la Industria del Canamo y del Cannabis Medicinal), which licenses and regulates medicinal cannabis and industrial hemp cultivation, import, export, and commercialization. Law 27.350 (2017) separately established medical cannabis access, and home cultivation for personal/medical use is permitted. A regulated recreational adult-use commercial market has not been enacted by Congress.',
 'Argentina.gob.ar -- Boletin Oficial / Ley 27.669',
 'https://www.argentina.gob.ar/normativa/nacional/norma-365303/actualizacion',
 date '2022-05-26','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('ncc-gh-cannabis-licensing-20260913','GH','legal_commercial_access',
 'Narcotics Control Commission (Amendment) Act, 2023 (Act 1100) and L.I. 2475 (2023) established a licensing regime under NACOC covering cultivation, processing, storage, transport, import, and export, launched operationally 26 February 2026. Licenses are restricted to cannabis with THC not exceeding 0.3% on a dry-weight basis; high-THC recreational cannabis remains fully prohibited under NACOC Act 2020 (Act 1019) Section 45.',
 'Ghana Narcotics Control Commission (NACOC)',
 'https://www.ncc.gov.gh/cannabis-regulations/',
 date '2026-02-26','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('gov-ls-medigrow-20260913','LS','legal_commercial_access',
 'Lesotho Ministry of Health licensed Medi Kingdom (now Medigrow) in 2017 to cultivate medical-grade cannabis -- the first such license issued by an African government. Additional large-scale cultivation licenses (including a 1,500-hectare project) have followed, oriented toward export to international medical markets.',
 'Government of Lesotho',
 'https://www.gov.ls/development/pm-launches-cannabis-cultivator/',
 date '2017-12-11','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('cra-mw-licensing-20260913','MW','legal_commercial_access',
 'Cannabis Regulation Act, 2020 (No. 6 of 2020) established the Cannabis Regulatory Authority (CRA), which licenses cultivation, processing, distribution, storage, importation, and exportation of medicinal and industrial cannabis across the full value chain. The Act permits medicinal, industrial, and scientific use only; recreational use is not authorized.',
 'Malawi Cannabis Regulatory Authority (CRA)',
 'https://www.cra.gov.mw/',
 date '2020-05-08','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('cla-jm-licensing-20260913','JM','legal_commercial_access',
 'Cannabis Licensing Authority (CLA), established 2015 under the Dangerous Drugs (Amendment) Act, issues cultivator, processing, transport, retail, research-and-development, and export licenses for medical/scientific/therapeutic ganja. The 2015 amendment also decriminalized possession of up to 2 ounces and recognized Rastafarian sacramental use. General adult-use recreational sale remains outside the licensed framework.',
 'Cannabis Licensing Authority of Jamaica',
 'https://cla.gov.jm/',
 date '2015-04-15','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
