-- Publish Market Access heatmap for remaining AU states and DE Länder.
-- Aligns with already-published siblings (AU-NSW/TAS medical; DE Länder medical).

insert into public.regulatory_market_access_evidence
  (evidence_key, jurisdiction_iso2, tier, rationale, authority_name, authority_url,
   source_effective_date, verified_at, expires_at, active)
values
  ('hv-heatmap-au-act-20260925','AU-ACT','medical_limited_trade',
   'Australian Capital Territory participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised at Commonwealth level.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-nt-20260925','AU-NT','medical_limited_trade',
   'Northern Territory participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised at Commonwealth level.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-qld-20260925','AU-QLD','medical_limited_trade',
   'Queensland participates in Australia''s regulated medicinal cannabis scheme under the TGA and state health controls; adult-use commercial retail is not authorised.',
   'Queensland Health / TGA medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-sa-20260925','AU-SA','medical_limited_trade',
   'South Australia participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-vic-20260925','AU-VIC','medical_limited_trade',
   'Victoria participates in Australia''s regulated medicinal cannabis scheme under the TGA and state frameworks; adult-use commercial retail is not authorised.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-wa-20260925','AU-WA','medical_limited_trade',
   'Western Australia participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-be-20260925','DE-BE','medical_limited_trade',
   'Berlin operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG); Land-level colour follows the published medical pathway used for other Länder.',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-nw-20260925','DE-NW','medical_limited_trade',
   'Nordrhein-Westfalen operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-rp-20260925','DE-RP','medical_limited_trade',
   'Rheinland-Pfalz operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-sh-20260925','DE-SH','medical_limited_trade',
   'Schleswig-Holstein operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-sl-20260925','DE-SL','medical_limited_trade',
   'Saarland operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-sn-20260925','DE-SN','medical_limited_trade',
   'Sachsen operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-st-20260925','DE-ST','medical_limited_trade',
   'Sachsen-Anhalt operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-th-20260925','DE-TH','medical_limited_trade',
   'Thüringen operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true)
on conflict (evidence_key) do update set
  tier = excluded.tier,
  rationale = excluded.rationale,
  authority_name = excluded.authority_name,
  authority_url = excluded.authority_url,
  source_effective_date = excluded.source_effective_date,
  verified_at = excluded.verified_at,
  expires_at = excluded.expires_at,
  active = true;

update public.regulatory_market_access_evidence e
set active = false
where e.jurisdiction_iso2 in (
  'AU-ACT','AU-NT','AU-QLD','AU-SA','AU-VIC','AU-WA',
  'DE-BE','DE-NW','DE-RP','DE-SH','DE-SL','DE-SN','DE-ST','DE-TH'
)
and e.evidence_key not like 'hv-heatmap-%-20260925'
and e.active = true;

select * from api.refresh_verified_market_access_tiers('heatmap-publish-au-de-subnational-20260925');
