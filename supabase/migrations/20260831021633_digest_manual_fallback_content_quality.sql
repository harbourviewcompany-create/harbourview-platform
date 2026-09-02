-- Reconstructed from production. Verbatim statements for version 20260831021633.
CREATE OR REPLACE FUNCTION public._digest_smart_truncate(input text, max_len int)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when input is null then null
    when length(input) <= max_len then input
    when length(trim(trailing from regexp_replace(left(input, max_len), '\S*$', ''))) = 0
      then left(input, max_len - 1) || '…'
    else trim(trailing from regexp_replace(left(input, max_len), '\S*$', '')) || '…'
  end;
$$;

CREATE OR REPLACE FUNCTION public._digest_manual_why(summary text, title text, impact text, content_type text, market text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when length(trim(coalesce(summary,''))) = 0
      or lower(trim(summary)) = lower(trim(coalesce(title,'')))
      or lower(trim(summary)) like lower(trim(coalesce(title,''))) || '%'
      then format('%s-impact %s signal for %s.',
        initcap(coalesce(impact,'medium')),
        coalesce(content_type,'regulatory'),
        coalesce(market,'Global'))
    else public._digest_smart_truncate(summary, 240)
  end;
$$;

-- One-off: rebuild today's already-published manual-pass digest using the
-- fixed formatting (word-boundary truncation + summary/title dedup), pulling
-- fresh title/summary for the same 10 signals rather than re-running
-- candidate selection (those signals are already marked used_in_digest_at).
with current_ids as (
  select (h->>'signal_id') as signal_id, ord
  from daily_digest d
  cross join lateral jsonb_array_elements(d.headlines) with ordinality as t(h, ord)
  where d.digest_date = current_date
),
fresh as (
  select
    ci.ord,
    s.id,
    coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
    coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
    coalesce(nullif(trim(s.country), ''), 'Global') as market,
    coalesce(s.content_type, 'regulatory') as content_type,
    coalesce(s.impact, 'medium') as impact
  from current_ids ci
  join public.signals s on s.id = ci.signal_id
),
rebuilt as (
  select jsonb_agg(
    jsonb_build_object(
      'headline', public._digest_smart_truncate(f.title, 110),
      'why_it_matters', public._digest_manual_why(f.summary, f.title, f.impact, f.content_type, f.market),
      'market', f.market,
      'signal_id', f.id
    ) order by f.ord
  ) as headlines
  from fresh f
)
update daily_digest d
set headlines = rebuilt.headlines,
    updated_at = now()
from rebuilt
where d.digest_date = current_date;
