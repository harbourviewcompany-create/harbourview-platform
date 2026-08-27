-- Canonical timeline fields for reviewed intelligence.
--
-- `date` is a legacy overloaded column: some ingestion paths used source/event
-- time while others used observation time. Keep it for compatibility, but never
-- rely on it to mean all four concepts below.

alter table public.signals
  add column if not exists source_published_at timestamptz,
  add column if not exists event_effective_at timestamptz,
  add column if not exists observed_at timestamptz,
  add column if not exists ingested_at timestamptz;

update public.signals
set
  observed_at = coalesce(observed_at, created_at),
  ingested_at = coalesce(ingested_at, created_at)
where observed_at is null or ingested_at is null;

-- Harvest explicit structured timestamps when upstream analysis already carries
-- them. pg_input_is_valid keeps malformed source strings from aborting replay.
update public.signals
set source_published_at = (analysis->>'source_published_at')::timestamptz
where source_published_at is null
  and analysis is not null
  and pg_input_is_valid(coalesce(analysis->>'source_published_at',''), 'timestamp with time zone');

update public.signals
set event_effective_at = (analysis->>'event_effective_at')::timestamptz
where event_effective_at is null
  and analysis is not null
  and pg_input_is_valid(coalesce(analysis->>'event_effective_at',''), 'timestamp with time zone');

-- Verified historical correction: the Sibiz page itself is dated 2025-08-22 and
-- describes the law as effective 2025-08-20. Preserve both rediscovered signal
-- rows for historical search; the Weekly Signals freshness gate suppresses them
-- from the current 7-day surface and URL dedupe prevents double presentation.
update public.signals
set
  source_published_at = '2025-08-22T00:00:00Z'::timestamptz,
  event_effective_at = '2025-08-20T00:00:00Z'::timestamptz
where url = 'https://sibiz.eu/slovenia-legalizes-medical-cannabis-marijuana-new-law-effective-from-august-20-2025/';

create or replace function public.hv_signal_timeline_defaults()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source text;
  v_event text;
begin
  new.observed_at := coalesce(new.observed_at, new.created_at, now());
  new.ingested_at := coalesce(new.ingested_at, new.created_at, now());

  if new.analysis is not null then
    if new.source_published_at is null then
      v_source := nullif(new.analysis->>'source_published_at', '');
      if v_source is not null and pg_input_is_valid(v_source, 'timestamp with time zone') then
        new.source_published_at := v_source::timestamptz;
      end if;
    end if;

    if new.event_effective_at is null then
      v_event := nullif(new.analysis->>'event_effective_at', '');
      if v_event is not null and pg_input_is_valid(v_event, 'timestamp with time zone') then
        new.event_effective_at := v_event::timestamptz;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.hv_signal_timeline_defaults() from public, anon, authenticated;

drop trigger if exists signals_timeline_defaults on public.signals;
create trigger signals_timeline_defaults
before insert or update of analysis, source_published_at, event_effective_at, observed_at, ingested_at
on public.signals
for each row execute function public.hv_signal_timeline_defaults();

create index if not exists signals_source_published_at_idx
  on public.signals (source_published_at desc)
  where reviewed = true;

create index if not exists signals_event_effective_at_idx
  on public.signals (event_effective_at desc)
  where reviewed = true;

-- CREATE OR REPLACE VIEW may append columns but cannot reorder/rename existing
-- positions. Keep every pre-existing api.signals_with_quality column in its
-- canonical order and append the timeline fields at the end.
create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at,
  embedding_1024, embedding_model, embedded_at, reviewed_by, reviewed_at,
  editorial_title, editorial_blurb, country_iso2,
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis,
  source_published_at, event_effective_at, observed_at, ingested_at
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on column public.signals.source_published_at is
  'Timestamp published by the source when known; distinct from Harbourview observation/ingestion time.';
comment on column public.signals.event_effective_at is
  'Effective/event timestamp when known; distinct from source publication and Harbourview observation/ingestion.';
comment on column public.signals.observed_at is
  'When Harbourview observed the source; must not be presented as publication/event freshness by itself.';
comment on column public.signals.ingested_at is
  'When Harbourview persisted the signal; must not be presented as publication/event freshness by itself.';
comment on view api.signals_with_quality is
  'Authenticated quality view including explicit source/event/observation/ingestion timeline fields. Not granted to anon.';

notify pgrst, 'reload schema';
