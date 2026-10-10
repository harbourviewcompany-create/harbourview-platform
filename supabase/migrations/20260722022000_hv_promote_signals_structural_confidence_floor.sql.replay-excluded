-- Follow-up to 20260722020100_hv_quality_promote_explicit_confidence_floor.sql
-- (CodeRabbit review on PR #1126). That migration raised the *default* and the
-- *call-site* value passed by hv_quality_promote_tick() from 0.0 to 0.65, but left
-- the WHERE clause itself unchanged: `coalesce(s.quality_confidence, 1) >= p_min_conf`.
-- Two structural gaps remained:
--   1. `coalesce(s.quality_confidence, 1)` treats a NULL confidence (the classifier
--      can return one -- see supabase/functions/hv-classify/index.ts's
--      `confidence: typeof raw.confidence === "number" ? raw.confidence : null`) as
--      1.0, the maximum -- a row the classifier never actually scored would still
--      clear any floor and get auto-promoted. Exactly backwards from the intent.
--   2. Any direct caller could still pass `p_min_conf` below 0.65 (e.g.
--      `hv_promote_signals(0.1)`) and bypass the floor entirely -- raising the
--      *default* doesn't constrain the *argument*.
--
-- Fix: require quality_confidence to be non-null and explicitly >= the greater of
-- the caller's argument or a hard 0.65 floor. No caller can promote on an unscored
-- row, and no caller can promote below 0.65 regardless of what they pass.
--
-- Everything else about the function (promotion-only invariant, domain exclusion,
-- human-reviewed exclusion) is unchanged.
--
-- Rollback: revert to `coalesce(s.quality_confidence, 1) >= p_min_conf` (see git
-- history of 20260722020100_hv_quality_promote_explicit_confidence_floor.sql) --
-- not recommended, reopens the NULL-confidence auto-promotion gap.

create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= greatest(coalesce(p_min_conf, 0.65), 0.65)
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;
