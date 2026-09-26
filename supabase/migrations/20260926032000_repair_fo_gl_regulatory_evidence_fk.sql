-- Repair the FO/GL depth replay ordering: claims reference evidence_key rows that
-- must exist before the FK-backed claim inserts execute.
insert into public.regulatory_market_access_evidence(
  evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,
  source_effective_date,retrieved_at,verified_at,expires_at,evidence_status,active
)
values
(
 'hv-mkt-complete-fo-20260913','FO','medical_limited_trade',
 'Faroe Islands Regulation No. 495 of 26 May 2026 lists cannabis in the controlled-substance schedules; authorized activity is within the medical/scientific framework and no general adult-use retail pathway is established by the cited instrument.',
 'Lógasavn / Faroe Islands — Regulation No. 495 of 26 May 2026 on controlled substances',
 'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer',
 '2026-05-26',now(),now(),now()+interval '1 year','verified',true
),
(
 'hv-mkt-complete-gl-20260913','GL','medical_limited_trade',
 'Greenland controlled-substance law places cannabis within an authorization-based medical/scientific framework; no general adult-use commercial retail pathway is established by the cited framework.',
 'Greenland Self-Government — Regulation No. 61 of 22 August 2025 on controlled substances',
 'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da',
 null,now(),now(),now()+interval '1 year','verified',true
)
on conflict (evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
 retrieved_at=excluded.retrieved_at,verified_at=excluded.verified_at,
 expires_at=excluded.expires_at,evidence_status=excluded.evidence_status,active=true;

insert into public.regulatory_market_access_claims(
 evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,
 authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status
)
values
('hv-mkt-complete-fo-20260913','FO','primary-evidence-claim:hv-mkt-complete-fo-20260913',
 'Faroe Islands controlled-substance rules place cannabis within the controlled framework and limit listed controlled substances to medical/scientific use; permitted commercial activities require authorization. No general adult-use retail pathway is established by the cited regulation.',
 'any','jurisdiction','Lógasavn / Faroe Islands — Regulation No. 495 of 26 May 2026 on controlled substances',
 'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer','2026-05-26',now(),now(),now()+interval '1 year','verified'),
('hv-mkt-complete-gl-20260913','GL','primary-evidence-claim:hv-mkt-complete-gl-20260913',
 'Greenland controlled-substance law restricts controlled substances to authorized medical/scientific use; cannabis is included in the controlled framework. Commercial adult-use cannabis is not established by the cited Greenland framework.',
 'any','jurisdiction','Greenland Self-Government — Regulation No. 61 of 22 August 2025 on controlled substances',
 'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da',null,now(),now(),now()+interval '1 year','verified')
on conflict (claim_key) do update set
 evidence_key=excluded.evidence_key,claim_text=excluded.claim_text,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
 retrieved_at=excluded.retrieved_at,verified_at=excluded.verified_at,
 expires_at=excluded.expires_at,evidence_status='verified',updated_at=now();