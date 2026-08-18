-- Clinical Prescriber OS: exact SKU linkage after product-level SKU bootstrap.
-- Depends on 20260818154500_clinical_prescriber_operating_system.sql and
-- 20260818160000_clinical_sku_product_level_bootstrap.sql.
-- Additive/forward only; not self-applying.

alter table public.clinical_regimen_protocols
  add column if not exists formulary_sku_id uuid
    references public.clinical_formulary_skus(id) on delete cascade;

alter table public.clinical_regimen_protocols
  alter column formulary_product_id drop not null;

alter table public.clinical_regimen_protocols
  drop constraint if exists clinical_regimen_requires_product_reference;
alter table public.clinical_regimen_protocols
  add constraint clinical_regimen_requires_product_reference
  check (formulary_product_id is not null or formulary_sku_id is not null);

create index if not exists clinical_regimen_sku_idx
  on public.clinical_regimen_protocols (formulary_sku_id, jurisdiction, review_status)
  where formulary_sku_id is not null;

alter table public.clinical_monitoring_protocols
  add column if not exists formulary_sku_id uuid
    references public.clinical_formulary_skus(id) on delete set null;

create index if not exists clinical_monitoring_sku_idx
  on public.clinical_monitoring_protocols (formulary_sku_id, review_status)
  where formulary_sku_id is not null;

alter table public.clinical_decision_records
  add column if not exists formulary_sku_ids uuid[] not null default '{}'::uuid[];

comment on column public.clinical_regimen_protocols.formulary_sku_id is
  'Exact governed formulary SKU where the regimen is product-specific. A class-level formulary product remains allowed only when the source itself defines a class-level regimen.';
comment on column public.clinical_decision_records.formulary_sku_ids is
  'Exact governed SKU references considered by the clinician-authored decision; presence does not imply authorization or appropriateness.';
