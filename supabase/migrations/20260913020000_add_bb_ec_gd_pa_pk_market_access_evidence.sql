-- Batch 3: 5 more jurisdictions with primary-government-source citations.
-- Same bar as the rest of this table; tiers match this repo's existing
-- countries.regulatory_tier classification for each.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values
('bmcla-bb-licensing-20260913','BB','domestic_only',
 'Medicinal Cannabis Industry Act 2019 established the Barbados Medicinal Cannabis Licensing Authority (BMCLA), which issues cultivator, processor, retail distributor, laboratory, research, import, export, and transport licences for medicinal/scientific/therapeutic purposes. The Drug Abuse (Prevention and Control) (Amendment) Act 2021 separately decriminalized possession of up to 14g. No general adult-use recreational market exists.',
 'Barbados Medicinal Cannabis Licensing Authority (BMCLA)',
 'https://www.bmcla.bb/',
 date '2019-12-01','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('arcsa-ec-cannabis-20260913','EC','domestic_only',
 'COIP (Codigo Organico Integral Penal) reform effective 21 June 2020 decriminalized cultivation/production of non-psychoactive cannabis (hemp, THC<1%) and, per subsequent Asamblea Nacional resolution, medicinal/therapeutic use. ARCSA (Agencia Nacional de Regulacion, Control y Vigilancia Sanitaria) regulates therapeutic prescription and dispensing under Acuerdo Ministerial 148. No licensed commercial recreational or adult-use market exists.',
 'Ecuador ARCSA (Agencia Nacional de Regulacion, Control y Vigilancia Sanitaria)',
 'https://www.controlsanitario.gob.ec/normativa-cannabis/',
 date '2020-06-21','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('gd-parliament-decrim-20260913','GD','medical_limited_trade',
 'Drug Abuse (Prevention and Control) (Amendment) Act, 2026, assented 13 February 2026 and gazetted 20 February 2026, decriminalizes adult (21+) possession of up to 56g cannabis / 15g resin and permits registered household cultivation of up to 4 plants. No commercial recreational retail market exists yet; the Act establishes the foundation for a Phase Two medicinal/therapeutic industry still in development.',
 'Parliament of Grenada',
 'https://grenadaparliament.gd/ova_doc/drug-abuse-prevention-and-control-amendment-bill-2026/',
 date '2026-02-20','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('minsa-pa-cannabis-20260913','PA','medical_limited_trade',
 'Ley 242 de 13 de octubre de 2021 regulates medicinal and therapeutic cannabis use; Decreto Ejecutivo No. 6 (4 April 2025) implements it, and a May 2026 Minsa resolution operationalized patient registration forms. Cannabis was formally added to Panama''s controlled-substances list authorized for medical/scientific use (Gaceta Oficial, 16 October 2025). Only 7 companies are authorized for import/cultivation/production, none yet operational as of the source date. Non-therapeutic, non-scientific use remains illegal.',
 'Panama Ministerio de Salud (Minsa)',
 'https://www.minsa.gob.pa/normatividad/ley-ndeg-242-de-miercoles-13-de-octubre-de-2021-que-regula-el-uso-medicinal-y',
 date '2021-10-13','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00'),
('ccra-pk-authority-20260913','PK','prohibited',
 'Cannabis Control and Regulatory Authority Act, 2024 established CCRA to license cultivation/processing/manufacturing/sale for medicinal and industrial purposes (THC<=0.3% defines hemp vs. marijuana). As of the source date CCRA has established its Islamabad headquarters and an e-licensing portal but has not confirmed issuance of any operational licenses; cannabis remains prohibited under Pakistan''s Control of Narcotic Substances Act pending the licensing regime becoming operational.',
 'Pakistan Cannabis Control & Regulatory Authority (CCRA)',
 'https://www.ccra.gov.pk/',
 date '2024-09-01','2026-09-13 00:00:00+00','2027-09-13 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
