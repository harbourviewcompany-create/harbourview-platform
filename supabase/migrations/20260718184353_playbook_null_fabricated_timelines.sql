-- Root cause: typical_timeline_months is NOT NULL, so every playbook was forced to carry a
-- number even when the timeline is unknown -- producing placeholder 0s and blanket 12s that
-- render as fabricated fact. Allow "unknown", then strip the placeholders.
-- Conservative: only removes values that are unambiguously not real; anything with evidence
-- (source_id OR a substantive confidence_label) keeps its timeline.

alter table public.jurisdiction_playbooks alter column typical_timeline_months drop not null;

comment on column public.jurisdiction_playbooks.typical_timeline_months is
  'Estimated months to market entry. NULL = not yet assessed (do not display a number). Never store 0 as a placeholder.';

-- (1) "0 months" is a null-placeholder displayed as fact. Never valid. Remove everywhere.
update public.jurisdiction_playbooks
set typical_timeline_months = null
where typical_timeline_months = 0;

-- (2) Untouched templated defaults: draft, zero evidence, blanket 12-month placeholder, no cost.
update public.jurisdiction_playbooks
set typical_timeline_months = null
where status = 'draft'
  and source_id is null
  and confidence_label is null
  and typical_timeline_months = 12
  and estimated_cost_range is null;