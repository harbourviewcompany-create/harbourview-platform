-- Stage 0 hardening: an INDEPENDENT, non-LLM structural heuristic that predicts
-- junk-vs-content from surface features of the snapshot text, computed in SQL.
-- Purpose: a second "annotator" whose errors are UNCORRELATED with the assistant
-- semantic labels by construction. Agreement => high confidence; disagreement =>
-- the row is genuinely ambiguous and is the priority human-adjudication queue.
-- This grades the set rather than self-asserting it (spec §9.2), given human
-- labeling is deferred by the owner.
-- Additive columns. Reversible:
--   alter table public.intel_eval_set
--     drop column struct_is_junk, drop column struct_reason, drop column needs_human;

alter table public.intel_eval_set
  add column if not exists struct_is_junk boolean,
  add column if not exists struct_reason  text,
  add column if not exists needs_human    boolean not null default false;

comment on column public.intel_eval_set.struct_is_junk is
  'Independent non-LLM heuristic: does surface structure look like nav/boilerplate/spam (true) vs real content (false)? Errors uncorrelated with the assistant semantic label by construction.';
comment on column public.intel_eval_set.needs_human is
  'true = structural heuristic disagrees with the assistant quality label (junk vs signal). Priority human-adjudication queue.';

-- Populate the heuristic from surface features of signals.summary.
with feats as (
  select e.signal_id,
    ( (s.summary ~* 'skip to content')::int
    + (s.summary ~* 'free ultimate|ai guide|\$1,750|laws by state')::int
    + (s.summary ~* 'link--with-arrow-block|data-component-id')::int
    + (s.summary ~* 'menu entrar|entrar/regist')::int
    + (s.summary ~* 'call 988|compulsive gambling|alcohol/drug helpline')::int
    + (s.summary ~* 'editorial picks|m&a tracker|press releases stay informed')::int
    + (s.summary ~* '(medical marijuana report: 20)(.|\n){0,120}(medical marijuana report: 20)')::int
    + (s.summary ~* 'polityka.*cookie|deklaracja dost|serwis bip')::int
    + (s.summary ~* 'certificate of (marijuana )?tax compliance|cannabis tracking system')::int
    ) as strong_hits,
    ( (s.summary ~* 'read more')::int
    + (s.summary ~* 'subscribe|newsletter')::int
    + (s.summary ~* 'facebooklink|youtubelink|linkedinlink|rsslink')::int
    + (s.summary ~* 'sign up|learn more')::int
    + (s.summary ~* 'privacy|cookie')::int
    + (s.summary ~* '\[email protected\]|@[a-z0-9.]+\.(gov|com|org)')::int
    + (s.summary ~* '[0-9]{3}[- ][0-9]{3}[- ][0-9]{4}')::int
    + (s.summary ~* 'all countries a.z|world cannabis legality map')::int
    ) as weak_hits
  from public.intel_eval_set e
  join public.signals s on s.id = e.signal_id
)
update public.intel_eval_set e set
  struct_is_junk = (f.strong_hits >= 1 or f.weak_hits >= 3),
  struct_reason  = 'strong=' || f.strong_hits || ' weak=' || f.weak_hits
from feats f
where e.signal_id = f.signal_id;

update public.intel_eval_set set needs_human =
  case
    when draft_quality_label = 'duplicate' then false
    when struct_is_junk = true  and draft_quality_label = 'signal' then true
    when struct_is_junk = false and draft_quality_label in ('nav','boilerplate','spam') then true
    else false
  end;
