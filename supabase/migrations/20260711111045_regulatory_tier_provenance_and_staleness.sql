-- Provenance + staleness so auto-classification and human/agent overrides can
-- coexist safely, and so a tier "knows" when its source has moved underneath it.

alter table public.countries
  -- 'auto'      = value came from api.derive_regulatory_tier and may be
  --               recomputed freely on briefing change.
  -- 'override'  = a human or agent deliberately set this; the auto-classifier
  --               must NOT silently overwrite it. (Moldova, India today.)
  add column if not exists regulatory_tier_origin text not null default 'auto'
    check (regulatory_tier_origin in ('auto','override')),
  -- Hash of the program_status the current tier was derived from. When the live
  -- briefing hash differs, the tier is stale.
  add column if not exists regulatory_tier_source_hash text,
  -- Set true when the briefing changed and the newly-derived tier differs from
  -- what's stored (the "flag if surprising" signal). Cleared on reclassify/ack.
  add column if not exists regulatory_tier_needs_review boolean not null default false,
  add column if not exists regulatory_tier_last_derived_at timestamptz;

comment on column public.countries.regulatory_tier_origin is
  'auto = safe to recompute from briefing; override = a human/agent set it, classifier must not clobber.';
comment on column public.countries.regulatory_tier_needs_review is
  'True when a briefing change produced a tier different from the stored one (surprising change to confirm).';
comment on column public.countries.regulatory_tier_source_hash is
  'md5 of the program_status the current tier was derived from; mismatch vs live = stale.';

-- Backfill: mark the two manual CBD calls as overrides so the trigger respects
-- them, and seed source hashes + derived timestamps for everything.
update public.countries c set
  regulatory_tier_origin = case when c.iso_alpha2 in ('MD','IN','TR','CN') then 'override' else 'auto' end,
  regulatory_tier_source_hash = md5(coalesce(b.program_status,'')),
  regulatory_tier_last_derived_at = now()
from public.cc_jurisdiction_briefings b
where b.country_iso2=c.iso_alpha2 and b.jurisdiction_type='country';

-- Rows with no briefing (the 8 manual ones) are overrides by definition.
update public.countries set
  regulatory_tier_origin = 'override',
  regulatory_tier_source_hash = md5(''),
  regulatory_tier_last_derived_at = now()
where iso_alpha2 in ('RU','PR','FK','VA','FM','SC','TO','EH');