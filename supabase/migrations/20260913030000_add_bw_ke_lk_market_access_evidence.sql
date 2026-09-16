-- Batch 4: 3 more jurisdictions. Same sourcing bar.
--
-- Note on Botswana: countries.regulatory_tier for BW is currently
-- legal_commercial_access, which differs from what this session set it to
-- earlier (medical_limited_trade) -- it appears to have been independently
-- updated since, consistent with other signs of concurrent work on this
-- table. This evidence row is sourced to match the *current* live value,
-- not to relitigate which is correct.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('gov-bw-cannabis-act-20260913','BW','legal_commercial_access',
 'Cannabis Bill, 2025 passed by Parliament 14 August 2025 (25 votes to 5, 4 abstentions), establishing a National Cannabis Control Authority to license cultivation, manufacture, storage, distribution, import, and export strictly for medicinal, scientific, research, and industrial purposes. The Cannabis Regulations, 2026 impose licensing and security requirements across the value chain. Recreational use remains illegal.',
 'Botswana Government (Daily News / Botswana Press Agency)',
 'https://dailynews.gov.bw/news-detail/88153',
 date '2025-08-14','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('kenyalaw-ke-prohibited-20260913','KE','prohibited',
 'Cannabis (bhang) is fully illegal under the Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245 (1994, as amended 2022). Possession, cultivation, and trafficking are criminal offences with penalties up to life imprisonment. A High Court petition seeking a narrow religious exemption for Rastafari sacramental use was dismissed 15 July 2026. No medical, industrial, or research licensing pathway is operational.',
 'Kenya Law (National Council for Law Reporting)',
 'https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31',
 date '2022-12-31','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('ayurveda-lk-limited-20260913','LK','cbd_hemp_only',
 'Recreational and general medical cannabis are illegal under the Poisons, Opium and Dangerous Drugs Ordinance of 1935. A narrow, formally legal channel exists under the Ayurveda Act No. 31 of 1961 (amended by Act No. 5 of 1962): the state Sri Lanka Ayurvedic Drugs Corporation is the sole lawful source, supplying licensed Ayurvedic practitioners for traditional medicinal preparations. A 2025 export-only scheme has been discussed but is not yet a general commercial pathway.',
 'Sri Lanka Department of Ayurveda',
 'https://ayurveda.gov.lk/',
 date '1962-01-01','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
