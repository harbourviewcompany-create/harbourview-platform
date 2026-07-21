-- Backfill for signals ingested before source-engine-fetch's decodeEntities
-- fix (2026-07-19): headline/summary contain a duplicated title + raw
-- &nbsp;/<a>/<font> markup from unstripped Google News RSS <description>
-- content (root-caused 2026-07-21 while debugging hv-classify's eval
-- recall -- these malformed rows were the dominant false-negative pattern:
-- the classifier correctly reads genuinely-duplicated repeated text as
-- "boilerplate", it isn't a classifier defect).
--
-- Two-pass per column: (a) recurrence heuristic -- find where the clean
-- "Title - Source" prefix's title text recurs later in the string and
-- truncate there (covers ~94-97% of affected rows, verified by dry-run
-- against live data before this migration was written); (b) fallback --
-- strip the HTML/&nbsp; litter without deduping the repeated text for the
-- remainder, so at minimum no raw markup survives.
--
-- Scope-checked before writing: ALL affected rows have reviewed=false --
-- this touches only unpublished staging data, nothing on the live public
-- Intel feed.
WITH dirty AS (
  SELECT id, headline, summary
  FROM public.signals
  WHERE headline ILIKE '%&nbsp;%' OR headline ILIKE '%<a href%' OR headline ILIKE '%<font%'
     OR summary  ILIKE '%&nbsp;%' OR summary  ILIKE '%<a href%' OR summary  ILIKE '%<font%'
),
cleaned AS (
  SELECT
    id,
    CASE
      WHEN headline !~* '&nbsp;|<a href|<font' THEN headline
      WHEN position(split_part(headline, ' - ', 1) IN substring(headline FROM length(split_part(headline, ' - ', 1)) + 4)) > 0
        THEN left(headline, length(split_part(headline, ' - ', 1)) + 3 +
             position(split_part(headline, ' - ', 1) IN substring(headline FROM length(split_part(headline, ' - ', 1)) + 4)) - 1)
      ELSE trim(regexp_replace(regexp_replace(regexp_replace(headline, '<[^>]+>', ' ', 'g'), '&nbsp;', ' ', 'g'), '\s+', ' ', 'g'))
    END AS headline_clean,
    CASE
      WHEN summary !~* '&nbsp;|<a href|<font' THEN summary
      WHEN position(split_part(summary, ' - ', 1) IN substring(summary FROM length(split_part(summary, ' - ', 1)) + 4)) > 0
        THEN left(summary, length(split_part(summary, ' - ', 1)) + 3 +
             position(split_part(summary, ' - ', 1) IN substring(summary FROM length(split_part(summary, ' - ', 1)) + 4)) - 1)
      ELSE trim(regexp_replace(regexp_replace(regexp_replace(summary, '<[^>]+>', ' ', 'g'), '&nbsp;', ' ', 'g'), '\s+', ' ', 'g'))
    END AS summary_clean
  FROM dirty
)
UPDATE public.signals s
SET headline = c.headline_clean,
    summary  = c.summary_clean
FROM cleaned c
WHERE c.id = s.id
  AND s.reviewed = false;
