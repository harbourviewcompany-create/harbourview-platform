-- Follow-up to backfill_dedupe_malformed_signal_headlines: 33 rows had an
-- unclosed HTML tag (the raw Google News/Reddit <a href="..."> link, whose
-- long token got cut off by the 500-char candidate-text truncation before
-- ever reaching the closing '>'), so the tag-strip regexp_replace('<[^>]+>')
-- never matched. Verified by dry-run: in every remaining row the clean
-- "Title - Source" text is fully intact immediately before the first
-- literal '<' -- truncate there. Same scope guard as the prior backfill:
-- reviewed=false only (no published content touched).
WITH dirty AS (
  SELECT id, summary
  FROM public.signals
  WHERE reviewed = false
    AND summary LIKE '%<%'
    AND (headline ILIKE '%&nbsp;%' OR headline ILIKE '%<a href%' OR headline ILIKE '%<font%'
      OR summary  ILIKE '%&nbsp;%' OR summary  ILIKE '%<a href%' OR summary  ILIKE '%<font%')
)
UPDATE public.signals s
SET summary = trim(left(d.summary, strpos(d.summary, '<') - 1))
FROM dirty d
WHERE d.id = s.id
  AND strpos(d.summary, '<') > 1;
