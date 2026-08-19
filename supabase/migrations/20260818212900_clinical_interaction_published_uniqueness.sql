-- Normalize interaction-pair publication uniqueness before Prescriber OS reconciliation.
-- Preserve every row; only duplicate published projections are staged under review.

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(medication_ingredient)), lower(btrim(cannabinoid))
      order by verified_at desc nulls last, updated_at desc nulls last, id
    ) as pair_rank
  from public.clinical_medication_interactions
  where review_status = 'published'
), duplicates as (
  select id from ranked where pair_rank > 1
)
update public.clinical_medication_interactions i
set review_status = 'under-review',
    uncertainty = case
      when coalesce(i.uncertainty, '') = '' then
        'Duplicate normalized interaction pair retained for reconciliation; not eligible for the published projection.'
      else i.uncertainty || ' Duplicate normalized interaction pair retained for reconciliation; not eligible for the published projection.'
    end,
    updated_at = now()
where i.id in (select id from duplicates);

-- The following migration uses the same index name with IF NOT EXISTS. Creating
-- the safe partial form first prevents an unsafe full-table uniqueness constraint
-- from rejecting preserved historical/under-review duplicates.
create unique index if not exists uq_clinical_interaction_normalized_pair
  on public.clinical_medication_interactions (
    lower(btrim(medication_ingredient)),
    lower(btrim(cannabinoid))
  )
  where review_status = 'published';

comment on index public.uq_clinical_interaction_normalized_pair is
  'Only one published projection per normalized medication/cannabinoid pair. Historical and under-review duplicates remain preserved.';
