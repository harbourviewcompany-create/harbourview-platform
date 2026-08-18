-- Seed the delta-intelligence event memory from previously published, source-backed
-- Daily Brief headlines so the first post-deploy edition compares against prior
-- presentations instead of starting from an empty history.
--
-- Only historical cards with a valid signal_id are seeded. Legacy cards without
-- a source-backed signal cannot be assigned a trustworthy canonical event key and
-- are intentionally left unseeded rather than inventing lineage.

with legacy_cards as (
  select
    d.digest_date,
    h.item
  from public.daily_digest d
  cross join lateral jsonb_array_elements(coalesce(d.headlines, '[]'::jsonb)) h(item)
  where d.status = 'published'
    and jsonb_typeof(h.item) = 'object'
    and nullif(h.item->>'signal_id', '') is not null
),
resolved as (
  select
    l.digest_date,
    s.id as signal_id,
    coalesce(link.canonical_signal_id, s.cluster_rep_id, s.id) as event_key,
    left(coalesce(nullif(l.item->>'headline', ''), nullif(s.title_en, ''), s.headline, 'Untitled'), 110) as headline,
    coalesce(l.item->>'why_it_matters', '') as why_it_matters,
    coalesce(nullif(l.item->>'jurisdiction', ''), nullif(l.item->>'market', ''), nullif(s.country, ''), 'Global') as jurisdiction,
    case when jsonb_typeof(l.item->'entities') = 'array' then l.item->'entities' else '[]'::jsonb end as entities,
    case
      when l.item->>'priority_domain' in (
        'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
        'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
      ) then l.item->>'priority_domain'
      else public._digest_priority_domain(
        coalesce(nullif(l.item->>'headline', ''), nullif(s.title_en, ''), s.headline),
        coalesce(nullif(s.summary_en, ''), nullif(s.summary, ''), l.item->>'why_it_matters')
      )
    end as priority_domain,
    case when jsonb_typeof(l.item->'verified_facts') = 'array' then l.item->'verified_facts' else '[]'::jsonb end as verified_facts,
    case when jsonb_typeof(l.item->'inferences') = 'array' then l.item->'inferences' else '[]'::jsonb end as inferences,
    lower(coalesce(l.item->>'competitive_position_change', 'false')) = 'true' as competitive_position_change,
    nullif(l.item->>'competitive_position_detail', '') as competitive_position_detail
  from legacy_cards l
  join public.signals s on s.id = l.item->>'signal_id'
  left join public.signal_digest_canonical_links link on link.duplicate_signal_id = s.id
),
ranked as (
  select
    r.*,
    row_number() over (
      partition by r.digest_date, r.event_key
      order by r.signal_id
    ) as event_rn
  from resolved r
)
insert into public.digest_presentation_history (
  digest_date,
  signal_id,
  event_key,
  prior_event_key,
  delta_status,
  advancement_reason,
  headline,
  why_it_matters,
  jurisdiction,
  entities,
  priority_domain,
  verified_facts,
  inferences,
  competitive_position_change,
  competitive_position_detail
)
select
  r.digest_date,
  r.signal_id,
  r.event_key,
  null,
  'new_event',
  'Historical presentation seeded from a previously published source-backed Daily Brief card.',
  r.headline,
  r.why_it_matters,
  r.jurisdiction,
  r.entities,
  r.priority_domain,
  r.verified_facts,
  r.inferences,
  r.competitive_position_change,
  r.competitive_position_detail
from ranked r
where r.event_rn = 1
on conflict (digest_date, event_key) do nothing;

with history_ranked as (
  select
    p.*,
    min(p.digest_date) over (partition by p.event_key) as first_date,
    max(p.digest_date) over (partition by p.event_key) as last_date,
    count(*) over (partition by p.event_key)::integer as presentation_total,
    row_number() over (
      partition by p.event_key
      order by p.digest_date desc, p.id desc
    ) as latest_rn
  from public.digest_presentation_history p
)
insert into public.digest_event_lineage (
  event_key,
  root_event_key,
  latest_signal_id,
  prior_event_key,
  jurisdiction,
  entities,
  priority_domain,
  verified_facts,
  inferences,
  competitive_position_change,
  competitive_position_detail,
  latest_advancement_reason,
  first_presented_on,
  last_presented_on,
  presentation_count
)
select
  h.event_key,
  h.event_key,
  h.signal_id,
  null,
  h.jurisdiction,
  h.entities,
  h.priority_domain,
  h.verified_facts,
  h.inferences,
  h.competitive_position_change,
  h.competitive_position_detail,
  h.advancement_reason,
  h.first_date,
  h.last_date,
  h.presentation_total
from history_ranked h
where h.latest_rn = 1
on conflict (event_key) do update set
  latest_signal_id = excluded.latest_signal_id,
  jurisdiction = excluded.jurisdiction,
  entities = excluded.entities,
  priority_domain = excluded.priority_domain,
  verified_facts = excluded.verified_facts,
  inferences = excluded.inferences,
  competitive_position_change = excluded.competitive_position_change,
  competitive_position_detail = excluded.competitive_position_detail,
  first_presented_on = least(public.digest_event_lineage.first_presented_on, excluded.first_presented_on),
  last_presented_on = greatest(public.digest_event_lineage.last_presented_on, excluded.last_presented_on),
  presentation_count = greatest(public.digest_event_lineage.presentation_count, excluded.presentation_count),
  updated_at = now();

comment on table public.digest_presentation_history is
  'Private Daily Brief presentation history, including source-backed historical editions seeded during delta-intelligence rollout.';
