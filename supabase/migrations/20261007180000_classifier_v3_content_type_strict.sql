-- =============================================================================
-- Classifier v3 — hv-classify/openai/v3-content-type-strict
-- =============================================================================
-- Pairs with edge function hv-classify (v3 prompt: stricter content_type +
-- high-value actor/action patterns; retains v2 body-redundancy input fix).
--
-- ORDER OF OPERATIONS (do not reorder):
--   1. Apply THIS migration first (validation row gate_passed=false + harvest stamp).
--   2. Deploy supabase/functions/hv-classify with the v3 CLASSIFY_SYSTEM prompt.
--   3. Run eval mode against intel_eval_set; record precision/recall.
--   4. UPDATE classifier_validation SET metrics... (still gate_passed=false).
--   5. Owner flips gate_passed=true only after stratified evidence + sign-off.
--
-- Until step 5, hv_promote_signals will not auto-promote any row stamped v3.
-- Rows still stamped v2 remain promotable if that version's gate is open.
--
-- ROLLBACK:
--   Redeploy previous hv-classify and set harvest constant back to
--   'hv-classify/openai/v2-summary-fix'. Both validation rows are retained.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Closed validation row for the new version
-- ---------------------------------------------------------------------------
insert into public.classifier_validation (
  classifier_version,
  validated_at,
  n_eval_rows,
  signal_precision,
  signal_recall,
  gate_passed,
  notes
) values (
  'hv-classify/openai/v3-content-type-strict',
  now(),
  null,
  null,
  null,
  false,
  'v3 created 2026-10-07. Prompt: stricter content_type (regulatory|market|story|research) '
  'and explicit high-value actor/action patterns (gazette, licence, ministry, court, agency). '
  'Retains v2 body-redundancy input formatting. gate_passed=false until stratified eval '
  'run is recorded and owner flips. Do not open without measured precision/recall on '
  'intel_eval_set (exclude or report live_correction stratum separately).'
)
on conflict (classifier_version) do update set
  notes = excluded.notes,
  validated_at = excluded.validated_at;
  -- deliberately does NOT touch gate_passed, precision, or recall on conflict

-- ---------------------------------------------------------------------------
-- 2. Harvest stamps the new version on successful classify responses
-- ---------------------------------------------------------------------------
create or replace function public.hv_classify_corpus_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  v_c jsonb;
  n int := 0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j
    join net._http_response resp on resp.id = j.request_id
    where not j.harvested
  loop
    if r.status_code = 200 then
      begin
        v_c := (r.content::jsonb -> 'classification');
        if v_c is not null then
          update public.signals s set
            quality_label = v_c ->> 'quality_label',
            content_type = v_c ->> 'content_type',
            impact = v_c ->> 'impact',
            quality_confidence = (v_c ->> 'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v3-content-type-strict'
          where s.id = r.signal_id;
          n := n + 1;
        end if;
      exception when others then
        null;
      end;
    end if;
    update public.hv_classify_jobs
    set harvested = true
    where request_id = r.request_id;
  end loop;
  return n;
end
$function$;

comment on function public.hv_classify_corpus_harvest() is
  'Harvests hv-classify responses into signals.{quality_label,content_type,impact,quality_confidence}. '
  'Stamps classifier_version = hv-classify/openai/v3-content-type-strict. Promotion requires a matching '
  'classifier_validation row with gate_passed=true; until that flip, v3 rows cannot auto-promote.';

-- ---------------------------------------------------------------------------
-- 3. Observability helper: versions and open gates
-- ---------------------------------------------------------------------------
create or replace function public.hv_classifier_versions_snapshot()
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select jsonb_build_object(
    'versions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'classifier_version', cv.classifier_version,
        'gate_passed', cv.gate_passed,
        'n_eval_rows', cv.n_eval_rows,
        'signal_precision', cv.signal_precision,
        'signal_recall', cv.signal_recall,
        'validated_at', cv.validated_at,
        'notes', left(coalesce(cv.notes, ''), 240)
      ) order by cv.validated_at desc nulls last), '[]'::jsonb)
      from public.classifier_validation cv
    ),
    'live_harvest_stamp', 'hv-classify/openai/v3-content-type-strict',
    'mechanical_gate', 'classifier_validation.gate_passed'
  );
$function$;

revoke all on function public.hv_classifier_versions_snapshot()
  from public, anon, authenticated;
grant execute on function public.hv_classifier_versions_snapshot()
  to service_role;

comment on function public.hv_classifier_versions_snapshot() is
  'Read-only inventory of classifier_validation rows and the live harvest stamp. Not an authorization gate.';
