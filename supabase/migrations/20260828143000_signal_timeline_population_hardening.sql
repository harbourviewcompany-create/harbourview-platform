-- Forward-only hardening for the explicit public.signals timeline introduced by
-- 20260827234500_signal_freshness_timeline.sql.
--
-- Production evidence shows current reviewed signal producers already persist
-- trustworthy structured `analysis.publication_date` and `analysis.effective_date`
-- values, but the original trigger only harvested the newer
-- `source_published_at` / `event_effective_at` keys. Preserve that producer
-- contract and promote valid structured dates into the canonical top-level
-- timeline without treating observation/ingestion as publication.

update public.signals
set source_published_at = (analysis->>'publication_date')::timestamptz
where source_published_at is null
  and analysis is not null
  and nullif(analysis->>'publication_date', '') is not null
  and pg_input_is_valid(analysis->>'publication_date', 'timestamp with time zone');

update public.signals
set event_effective_at = (analysis->>'effective_date')::timestamptz
where event_effective_at is null
  and analysis is not null
  and nullif(analysis->>'effective_date', '') is not null
  and pg_input_is_valid(analysis->>'effective_date', 'timestamp with time zone');

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
      if v_source is null or not pg_input_is_valid(v_source, 'timestamp with time zone') then
        v_source := nullif(new.analysis->>'publication_date', '');
      end if;
      if v_source is not null and pg_input_is_valid(v_source, 'timestamp with time zone') then
        new.source_published_at := v_source::timestamptz;
      end if;
    end if;

    if new.event_effective_at is null then
      v_event := nullif(new.analysis->>'event_effective_at', '');
      if v_event is null or not pg_input_is_valid(v_event, 'timestamp with time zone') then
        v_event := nullif(new.analysis->>'effective_date', '');
      end if;
      if v_event is not null and pg_input_is_valid(v_event, 'timestamp with time zone') then
        new.event_effective_at := v_event::timestamptz;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.hv_signal_timeline_defaults() from public, anon, authenticated;

comment on function public.hv_signal_timeline_defaults() is
  'Populates canonical signal timeline fields from explicit structured source/event dates while keeping observation and ingestion separate.';
