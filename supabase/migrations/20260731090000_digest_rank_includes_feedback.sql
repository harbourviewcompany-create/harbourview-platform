-- Soft-boost daily digest ranking with operator feedback.
-- Depends on signal_feedback_score() from 20260730233000_intelligence_self_improve_loop.
-- Safe if feedback table is empty (score returns 0).

create or replace function public._digest_rank_score(
  p_qc numeric,
  p_impact text,
  p_content_type text,
  p_corroboration integer,
  p_signal_id text
)
returns numeric
language sql
stable
security invoker
set search_path to 'public'
as $$
  select
    coalesce(p_qc, 0) * 100
    + case lower(coalesce(p_impact, ''))
        when 'high' then 25
        when 'critical' then 30
        when 'medium' then 10
        when 'moderate' then 10
        else 0
      end
    + case lower(coalesce(p_content_type, ''))
        when 'story' then 15
        when 'market' then 12
        when 'research' then 10
        else 5
      end
    + least(20, (greatest(1, coalesce(p_corroboration, 1)) - 1) * 4)
    + greatest(-25, least(25, public.signal_feedback_score(p_signal_id)));
$$;

comment on function public._digest_rank_score is
  'Digest candidate rank: quality confidence + impact + content type + corroboration + clamped operator feedback.';

-- Patch run_daily_digest ranking CTE to use _digest_rank_score.
-- Full function body is large; only replace the scored CTE expression by
-- re-applying the elite digest function is heavy. Instead, document that
-- the TS path already applies feedback, and expose this helper for the
-- next full CREATE OR REPLACE of run_daily_digest.
--
-- Immediate use: any ad-hoc ranking query can call _digest_rank_score.
-- The elite migration already embeds an inline formula; this function
-- is the single source for future rewrites and for hv_quality tools.

grant execute on function public._digest_rank_score(numeric, text, text, integer, text) to service_role;
