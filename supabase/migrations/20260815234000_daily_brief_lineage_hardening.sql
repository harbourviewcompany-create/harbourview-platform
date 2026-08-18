-- Harden Daily Brief cross-edition lineage consultation and publication gating.
--
-- This forward companion migration preserves the verified delta-intelligence
-- foundation and patches only run_daily_digest(). Every candidate gets a
-- deterministic lookup against persistent digest_event_lineage, including
-- events older than the bounded recent-presentation context. Model-labelled
-- material advancements are publication-eligible only when prior_event_key
-- resolves to an actually persisted canonical event.

create or replace function public._digest_candidate_lineage_context(p_event_key_hint text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'event_key', l.event_key,
        'root_event_key', l.root_event_key,
        'prior_event_key', l.prior_event_key,
        'jurisdiction', l.jurisdiction,
        'entities', l.entities,
        'priority_domain', l.priority_domain,
        'verified_facts', l.verified_facts,
        'inferences', l.inferences,
        'competitive_position_change', l.competitive_position_change,
        'competitive_position_detail', l.competitive_position_detail,
        'latest_advancement_reason', l.latest_advancement_reason,
        'first_presented_on', l.first_presented_on,
        'last_presented_on', l.last_presented_on,
        'presentation_count', l.presentation_count
      )
      from public.digest_event_lineage l
      where l.event_key = p_event_key_hint
         or l.root_event_key = p_event_key_hint
      order by
        (l.event_key = p_event_key_hint) desc,
        l.last_presented_on desc,
        l.event_key
      limit 1
    ),
    'null'::jsonb
  );
$$;

revoke all on function public._digest_candidate_lineage_context(text) from public, anon, authenticated;
grant execute on function public._digest_candidate_lineage_context(text) to service_role;

comment on function public._digest_candidate_lineage_context(text) is
  'Bounded candidate-specific lookup into persistent Daily Brief event lineage; returns JSON null when no canonical lineage exists.';

do $do$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.run_daily_digest()'::regprocedure) into v_def;

  v_old := $old$- prior_presentations: previously presented real-world events and their latest material state.$old$;
  v_new := $new$- prior_presentations: a bounded recent comparison set of previously presented real-world events;
- candidate.prior_lineage: a deterministic persistent canonical-lineage lookup for that candidate, which may reference an event older than prior_presentations.$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: prompt contract anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$        'priority_domain_hint', t.priority_domain_hint,
        'detected_at', t.signal_date$old$;
  v_new := $new$        'priority_domain_hint', t.priority_domain_hint,
        'prior_lineage', public._digest_candidate_lineage_context(t.event_key_hint),
        'detected_at', t.signal_date$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: candidate payload anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$        e->>'delta_status' as delta_status,
        lower(coalesce(e->>'include','false')) = 'true' as include_in_edition,
        coalesce(nullif(e->>'market',''), nullif(e->>'jurisdiction',''), 'Global') as jurisdiction,$old$;
  v_new := $new$        e->>'delta_status' as delta_status,
        lower(coalesce(e->>'include','false')) = 'true' as include_in_edition,
        case
          when e->>'delta_status' <> 'material_advancement' then true
          when nullif(e->>'prior_event_key','') is null then false
          else exists (
            select 1
            from public.digest_event_lineage prior_lineage
            where prior_lineage.event_key = nullif(e->>'prior_event_key','')
          )
        end as lineage_valid,
        coalesce(nullif(e->>'market',''), nullif(e->>'jurisdiction',''), 'Global') as jurisdiction,$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: classified lineage anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$        c.include_in_edition and c.delta_status in ('new_event','material_advancement')
      from classified c$old$;
  v_new := $new$        c.include_in_edition
          and c.delta_status in ('new_event','material_advancement')
          and c.lineage_valid
      from classified c$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: assessment gate anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$             row_number() over (partition by c.event_key order by c.priority_score desc, c.signal_id) as event_rn
      from classified c
      where c.include_in_edition is true
        and c.delta_status in ('new_event','material_advancement')$old$;
  v_new := $new$             row_number() over (
               partition by case
                 when c.delta_status = 'material_advancement' then c.prior_event_key
                 else c.event_key
               end
               order by c.priority_score desc, c.signal_id
             ) as event_rn
      from classified c
      where c.include_in_edition is true
        and c.delta_status in ('new_event','material_advancement')
        and c.lineage_valid$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: edition dedup gate anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$      'unchanged_suppressed', (
        select count(*) from classified where delta_status='unchanged_duplicate'
      ),
      'source', 'pipeline_b_delta'$old$;
  v_new := $new$      'unchanged_suppressed', (
        select count(*) from classified where delta_status='unchanged_duplicate'
      ),
      'invalid_advancement_lineage_suppressed', (
        select count(*)
        from classified
        where delta_status='material_advancement' and not lineage_valid
      ),
      'source', 'pipeline_b_delta'$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: suppression telemetry anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end;
$do$;

revoke all on function public.run_daily_digest() from public, anon, authenticated;
grant execute on function public.run_daily_digest() to service_role;

comment on function public.run_daily_digest() is
  'Daily Brief writer with canonical dedup, bounded recent comparison context, candidate-specific persistent lineage lookup, fail-closed material-advancement validation and durable presentation history.';
