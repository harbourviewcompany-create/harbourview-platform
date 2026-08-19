-- Clinical Evidence Operating System V1 retrieval hardening.
-- Keeps private source-registry state behind a narrow eligibility predicate and
-- makes deterministic concept/text retrieval useful for natural clinical questions.

-- The source registry is reviewer-private. Expose only the boolean eligibility
-- decision so anon/authenticated evidence search never requires direct source-table access.
create or replace function public.clinical_evidence_record_is_eligible(p_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_evidence_records r
    left join public.clinical_evidence_sources s on s.id = r.primary_source_registry_id
    where r.id = p_record_id
      and r.review_status = 'published'
      and (s.id is null or s.currentness <> 'withdrawn')
  );
$function$;

revoke all on function public.clinical_evidence_record_is_eligible(uuid) from public;
grant execute on function public.clinical_evidence_record_is_eligible(uuid) to anon, authenticated, service_role;

-- Resolve both direct terms and substantive terms embedded in a natural-language
-- question. Ranking remains explicit and deterministic; no vector/model similarity.
create or replace function public.resolve_clinical_query(
  p_query text,
  p_limit integer default 12
)
returns table (
  concept_id uuid,
  concept_type text,
  canonical_label text,
  matched_label text,
  match_kind text,
  match_rank integer,
  aliases text[]
)
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), terms as (
    select q.normalized as term, 0 as term_rank from q where q.normalized <> ''
    union
    select token, 1
    from q
    cross join lateral regexp_split_to_table(q.normalized, '\s+') token
    where length(token) >= 3
      and token not in (
        'the','and','for','with','from','into','about','what','which','where','when','does','show','find',
        'evidence','clinical','reviewed','record','records','current','use','using','are','this','that'
      )
  ), candidates as (
    select
      c.id as concept_id,
      c.concept_type,
      c.canonical_label,
      c.canonical_label as matched_label,
      case
        when c.normalized_label = q.normalized then 'exact-canonical'
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 'prefix-canonical'
        else 'contains-canonical'
      end as match_kind,
      case
        when c.normalized_label = q.normalized then 0
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 2
        when length(c.normalized_label) >= 4 and q.normalized like '%' || c.normalized_label || '%' then 4
        else 6 + t.term_rank
      end as match_rank
    from public.clinical_concepts c
    cross join q
    join terms t on true
    where c.review_status = 'published'
      and q.normalized <> ''
      and (
        c.normalized_label = q.normalized
        or (length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%')
        or (length(c.normalized_label) >= 4 and q.normalized like '%' || c.normalized_label || '%')
        or (length(t.term) >= 3 and c.normalized_label like t.term || '%')
      )
    union all
    select
      c.id,
      c.concept_type,
      c.canonical_label,
      a.alias_label,
      case
        when a.normalized_alias = q.normalized then 'exact-alias'
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 'prefix-alias'
        else 'contains-alias'
      end,
      case
        when a.normalized_alias = q.normalized then 1
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 3
        when length(a.normalized_alias) >= 3 and q.normalized like '%' || a.normalized_alias || '%' then 5
        else 8 + t.term_rank
      end
    from public.clinical_concept_aliases a
    join public.clinical_concepts c on c.id = a.concept_id
    cross join q
    join terms t on true
    where c.review_status = 'published'
      and a.review_status = 'published'
      and q.normalized <> ''
      and (
        a.normalized_alias = q.normalized
        or (length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%')
        or (length(a.normalized_alias) >= 3 and q.normalized like '%' || a.normalized_alias || '%')
        or (length(t.term) >= 3 and a.normalized_alias like t.term || '%')
      )
  ), best as (
    select distinct on (x.concept_id)
      x.concept_id, x.concept_type, x.canonical_label, x.matched_label, x.match_kind, x.match_rank
    from candidates x
    order by x.concept_id, x.match_rank, length(x.matched_label), x.matched_label
  )
  select
    b.concept_id,
    b.concept_type,
    b.canonical_label,
    b.matched_label,
    b.match_kind,
    b.match_rank,
    coalesce((
      select array_agg(a.alias_label order by a.alias_label)
      from public.clinical_concept_aliases a
      where a.concept_id = b.concept_id and a.review_status = 'published'
    ), '{}'::text[]) as aliases
  from best b
  order by b.match_rank, b.canonical_label, b.concept_id
  limit least(greatest(coalesce(p_limit, 12), 1), 50);
$function$;

revoke all on function public.resolve_clinical_query(text,integer) from public;
grant execute on function public.resolve_clinical_query(text,integer) to anon, authenticated, service_role;

-- Search resolved concepts first, then deterministic substantive terms across
-- governed record fields. Natural-language wrapper words do not become evidence filters.
create or replace function public.search_clinical_evidence_records(
  p_query text default '',
  p_jurisdiction text default null,
  p_limit integer default 20
)
returns setof public.clinical_evidence_records
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), terms as (
    select q.normalized as term, 0 as term_rank from q where q.normalized <> ''
    union
    select token, 1
    from q
    cross join lateral regexp_split_to_table(q.normalized, '\s+') token
    where length(token) >= 3
      and token not in (
        'the','and','for','with','from','into','about','what','which','where','when','does','show','find',
        'evidence','clinical','reviewed','record','records','current','use','using','are','this','that'
      )
  ), resolved as (
    select * from public.resolve_clinical_query(p_query, 50)
  )
  select r.*
  from public.clinical_evidence_records r cross join q
  where public.clinical_evidence_record_is_eligible(r.id)
    and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions) or 'Global' = any(r.jurisdictions))
    and (
      q.normalized = ''
      or exists (
        select 1
        from public.clinical_evidence_concept_links l
        join resolved rc on rc.concept_id = l.concept_id
        where l.evidence_record_id = r.id and l.review_status = 'published'
      )
      or exists (
        select 1
        from public.clinical_condition_terms t
        join resolved rc
          on rc.concept_type = 'condition'
         and rc.canonical_label = t.canonical_name
        where t.id = r.condition_term_id and t.review_status = 'published'
      )
      or exists (
        select 1 from terms t
        where
          public.normalize_clinical_query(coalesce(r.condition_label, '')) like '%' || t.term || '%'
          or exists (select 1 from unnest(r.condition_aliases) a where public.normalize_clinical_query(a) like '%' || t.term || '%')
          or public.normalize_clinical_query(r.title) like '%' || t.term || '%'
          or public.normalize_clinical_query(r.summary) like '%' || t.term || '%'
          or public.normalize_clinical_query(coalesce(r.population, '')) like '%' || t.term || '%'
          or public.normalize_clinical_query(coalesce(r.intervention, '')) like '%' || t.term || '%'
          or public.normalize_clinical_query(coalesce(r.formulation, '')) like '%' || t.term || '%'
          or exists (select 1 from unnest(r.cannabinoids) c where public.normalize_clinical_query(c) like '%' || t.term || '%')
          or public.normalize_clinical_query(coalesce(r.outcome, '')) like '%' || t.term || '%'
      )
    )
  order by
    case
      when q.normalized = '' then 0
      else coalesce((
        select min(rc.match_rank)
        from resolved rc
        where exists (
          select 1 from public.clinical_evidence_concept_links l
          where l.evidence_record_id = r.id
            and l.concept_id = rc.concept_id
            and l.review_status = 'published'
        )
        or exists (
          select 1 from public.clinical_condition_terms t
          where t.id = r.condition_term_id
            and t.review_status = 'published'
            and rc.concept_type = 'condition'
            and rc.canonical_label = t.canonical_name
        )
      ), 20)
    end,
    case when r.supersession_state = 'current' then 0 else 1 end,
    case when coalesce(r.freshness_status, 'current') = 'current' then 0 else 1 end,
    r.verified_at desc,
    r.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

revoke all on function public.search_clinical_evidence_records(text,text,integer) from public;
grant execute on function public.search_clinical_evidence_records(text,text,integer) to anon, authenticated, service_role;
