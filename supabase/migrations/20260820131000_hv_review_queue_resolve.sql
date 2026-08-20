-- Resolve helpers for hv_signal_review_queue (admin / service_role only).
-- Additive. Depends on 20260820130000_hv_pipeline_optimization.sql.

CREATE OR REPLACE FUNCTION public.hv_review_queue_approve(
  p_signal_id text,
  p_reviewer text DEFAULT 'human:operator'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ok boolean := false;
BEGIN
  UPDATE public.signals s
  SET
    reviewed = true,
    reviewed_by = CASE
      WHEN p_reviewer LIKE 'human:%' THEN p_reviewer
      ELSE 'human:' || p_reviewer
    END,
    reviewed_at = now()
  WHERE s.id = p_signal_id
    AND s.reviewed IS DISTINCT FROM true
    AND (s.reviewed_by IS NULL OR s.reviewed_by NOT LIKE 'human:%');

  IF FOUND THEN
    v_ok := true;
  END IF;

  UPDATE public.hv_signal_review_queue
  SET
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = CASE
      WHEN p_reviewer LIKE 'human:%' THEN p_reviewer
      ELSE 'human:' || p_reviewer
    END
  WHERE signal_id = p_signal_id
    AND status = 'pending';

  RETURN v_ok;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_review_queue_reject(
  p_signal_id text,
  p_reviewer text DEFAULT 'human:operator',
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.hv_signal_review_queue
  SET
    status = 'rejected',
    reason = coalesce(p_reason, reason),
    reviewed_at = now(),
    reviewed_by = CASE
      WHEN p_reviewer LIKE 'human:%' THEN p_reviewer
      ELSE 'human:' || p_reviewer
    END
  WHERE signal_id = p_signal_id
    AND status = 'pending';

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_review_queue_list_pending(p_limit integer DEFAULT 50)
RETURNS TABLE (
  signal_id text,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  headline text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    q.signal_id,
    q.quality_label,
    q.quality_confidence,
    q.content_type,
    q.impact,
    q.reason,
    s.headline,
    q.created_at
  FROM public.hv_signal_review_queue q
  JOIN public.signals s ON s.id = q.signal_id
  WHERE q.status = 'pending'
  ORDER BY q.created_at DESC
  LIMIT least(greatest(coalesce(p_limit, 50), 1), 200);
$function$;

REVOKE ALL ON FUNCTION public.hv_review_queue_approve(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_review_queue_reject(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hv_review_queue_list_pending(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.hv_review_queue_approve(text, text) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.hv_review_queue_reject(text, text, text) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.hv_review_queue_list_pending(integer) TO service_role, postgres;
