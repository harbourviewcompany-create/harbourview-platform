-- Evidence correction tranche 8.
-- Tighten Brazil provenance so the adjudication points to the 2026 Anvisa
-- publication that explicitly covers labeling, dispensing, product framing and
-- export of medicinal cannabis products/active pharmaceutical ingredients.

update public.regulatory_market_access_evidence
set authority_url='https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-alinha-normas-a-regras-de-cannabis-aprovada-em-janeiro',
    authority_name='Agência Nacional de Vigilância Sanitária (Anvisa)',
    source_effective_date='2026-05-11',
    rationale='Anvisa''s 2026 medicinal-cannabis framework permits regulated manufacture and import of cannabis products for human medical use under RDC 1.015/2026, while RDCs 1.012/2026 and 1.013/2026 establish controlled cultivation exclusively for research and medicinal/pharmaceutical purposes. Anvisa''s RDC 1.023/2026 additionally addresses labeling, dispensing, product classification and export of medicinal-cannabis products and active pharmaceutical ingredients produced in Brazil. These are controlled medical/pharmaceutical pathways, not general adult-use commercial access.'
where evidence_key='primary-evidence-br-20260923';

update public.jurisdiction_data_depth_dimension_state
set evidence_basis='Anvisa 2026 RDC 1.015/2026, RDC 1.023/2026, RDC 1.012/2026 and RDC 1.013/2026',
    last_evaluated_at=now(),updated_at=now()
where jurisdiction_key='BR'
  and dimension_key in ('regulatory_tier','pathways','commercial_activity','import','export','access_rules')
  and contract_version='2026-09-23.v2';
