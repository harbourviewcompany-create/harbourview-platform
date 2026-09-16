-- Batch 5: 2 more jurisdictions. Same sourcing bar.
-- China skipped this round -- no primary gov.cn source surfaced after search;
-- secondary sources only, so not included rather than cited at a lower bar.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('uaelegislation-ae-prohibited-20260913','AE','cbd_hemp_only',
 'Cannabis and its derivatives are classified as prohibited narcotics under Federal Decree-Law No. 30 of 2021 on Combating Narcotics and Psychotropic Substances (in force 2 January 2022), which superseded Federal Law No. 14 of 1995. Cabinet Resolution No. 43 of 2024 (effective 30 May 2024) introduced a procedural framework easing penalties for non-residents carrying limited personal-use quantities of controlled substances at ports of entry, but this is an enforcement/penalty procedure, not a legalization -- cannabis possession, use, cultivation, import, and export remain criminal offences with no medical or recreational licensing pathway.',
 'UAE Legislation (Ministry of Justice official legislation portal)',
 'https://uaelegislation.gov.ae/en/legislations/1540',
 date '2022-01-02','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('gov-by-article328-20260913','BY','prohibited',
 'Cannabis is fully prohibited under Article 328 of the Criminal Code of the Republic of Belarus (Law No. 275-Z of 9 July 1999, as amended). Possession without intent to distribute carries restriction of liberty up to 5 years or imprisonment of 2-5 years; distribution-intent offences carry 3-8 years; aggravated/organized offences up to 20 years. Cultivation was banned outright effective 31 December 2016. No medical, industrial, or research exemption exists.',
 'Minsk City Administration (official Republic of Belarus government portal, gov.by)',
 'https://centr.minsk.gov.by/sfery-deyatelnosti/zakonnost-i-pravoporyadok/pravookhranitelnye-organy/ruvd-tsentralnogo-rajona-g-minska/5230-ugolovnyj-kodeks-respubliki-belarus-9-iyulya-1999-g-275-z-statya-328-nezakonnyj-oborot-narkoticheskikh-sredstv-psikhotropnykh-veshchestv-ikh-prekursorov-i-analogov',
 date '2016-12-31','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
