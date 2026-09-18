-- Restored from production migration ledger on 2026-09-16.
CREATE OR REPLACE FUNCTION public.hv_intelligence_outcome_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_newest_promoted timestamptz;
  v_feed_age_hours numeric;
  v_last_digest date;
  v_last_digest_manual boolean;
  v_digest_age_days int;
  v_unclassified bigint;
  v_reviewed_7d bigint;
  v_not_helpful_7d bigint;
  v_alerts jsonb := '[]'::jsonb;
  v_status text := 'healthy';
begin
  select max(reviewed_at) into v_newest_promoted from public.signals where reviewed is true;
  v_feed_age_hours := case when v_newest_promoted is null then null else extract(epoch from (now() - v_newest_promoted)) / 3600.0 end;
  select max(digest_date) into v_last_digest from public.daily_digest where status in ('published', 'published_manual') and ((headlines is not null and jsonb_array_length(headlines) > 0) or (editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0));
  select status = 'published_manual' into v_last_digest_manual from public.daily_digest where digest_date = v_last_digest;
  v_digest_age_days := case when v_last_digest is null then null else (current_date - v_last_digest) end;
  select count(*) into v_unclassified from public.signals where reviewed is distinct from true and quality_label is null and created_at > now() - interval '14 days';
  select count(*) into v_reviewed_7d from public.signals where reviewed is true and coalesce(reviewed_at, created_at) > now() - interval '7 days';
  select count(*) into v_not_helpful_7d from public.signal_relevance_feedback where verdict in ('not_helpful', 'stale', 'wrong_country') and created_at > now() - interval '7 days';
  if v_feed_age_hours is null or v_feed_age_hours > 72 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','feed_stale','severity','critical','message',format('Intel feed has no promotion in %s hours. Operators see a silent stale product while monitors may still say green.',coalesce(round(v_feed_age_hours)::text,'unknown')))); v_status := 'critical';
  elsif v_feed_age_hours > 36 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','feed_aging','severity','warning','message',format('Intel feed last promotion %s hours ago — still within tolerance but cooling.',round(v_feed_age_hours)))); if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;
  if v_digest_age_days is null or v_digest_age_days > 2 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','digest_stale','severity','critical','message',format('Daily Digest has no published edition (LLM or manual-pass) for %s days. Check run_daily_digest / LLM providers.',coalesce(v_digest_age_days::text,'unknown')))); v_status := 'critical';
  elsif v_digest_age_days > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','digest_missed_today','severity','warning','message','No Digest edition for today yet — may still land if cron is pending.')); if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;
  if v_last_digest_manual then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','digest_on_manual_fallback','severity','info','message',format('Most recent edition (%s) was the non-LLM manual-pass fallback, not LLM-curated -- likely means all configured LLM providers are still degraded.',v_last_digest)));
  end if;
  if v_unclassified > 2000 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','classify_backlog','severity','warning','message',format('%s unclassified signals in 14d window — quality pipeline may be lagging.',v_unclassified))); if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;
  if v_not_helpful_7d >= 5 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object('code','operator_negative_feedback','severity','info','message',format('%s negative operator feedback marks in 7d — review ranking / promotion sample.',v_not_helpful_7d)));
  end if;
  return jsonb_build_object('ok',true,'status',v_status,'checked_at',now(),'metrics',jsonb_build_object('newest_promoted_at',v_newest_promoted,'feed_age_hours',v_feed_age_hours,'last_digest_date',v_last_digest,'last_digest_is_manual_fallback',coalesce(v_last_digest_manual,false),'digest_age_days',v_digest_age_days,'unclassified_14d',v_unclassified,'reviewed_7d',v_reviewed_7d,'negative_feedback_7d',v_not_helpful_7d),'alerts',v_alerts);
end;
$function$;
