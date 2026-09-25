-- Reconstructed from production.
--
-- Repository-only replay-fidelity repair. Production already records version
-- 20260719140826, so changing this file cannot re-apply it to production.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

with grp as (
  select id, headline, country, date_trunc('day', created_at) as day
  from public.signals
  where reviewed = true
),
dupes as (
  select a.id as dup_id
  from grp a
  join grp b on a.country is not distinct from b.country
    and a.day = b.day
    and a.id <> b.id
    and b.id < a.id
    and similarity(left(a.headline,80), left(b.headline,80)) > 0.30
  group by a.id
)
update public.signals
set reviewed = false,
    action = 'reverted_stage4_dedup_2026_07_19'
where id in (select dup_id from dupes);