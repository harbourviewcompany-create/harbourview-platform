-- Signal Engine: autonomy projection columns + promote decision logging.
-- Additive only. Does not change hv_promote_signals body or widen Full Auto.
-- Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §9.1–9.2

-- ---------------------------------------------------------------------------
-- Align decision-event signal_id with public.signals.id (text in this schema)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'signal_decision_events'
      and column_name = 'signal_id'
      and data_type = 'uuid'
  ) then
    alter table public.signal_decision_events
      alter column signal_id type text using signal_id::text;
  end if;
exception
  when others then
    raise notice 'signal_id type align skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Autonomy projection columns on signals
-- ---------------------------------------------------------------------------
alter table public.signals
  add column if not exists autonomy_level smallint
    check (autonomy_level is null or autonomy_level between 0 and 4),
  add column if not exists gate_scores jsonb not null default '{}'::jsonb,
  add column if not exists promotion_path text
    check (
      promotion_path is null
      or promotion_path in ('full_auto', 'shadow', 'human', 'rejected')
    ),
  add column if not exists model_versions jsonb not null default '{}'::jsonb;

comment on column public.signals.autonomy_level is
  '0=discard 1=full_auto 2=shadow 3=exception 4=human_required. Null until evaluator writes.';
comment on column public.signals.promotion_path is
  'How the row reached reviewed state when known.';

-- ---------------------------------------------------------------------------
-- Best-effort decision log when reviewed flips to true (auto or human)
-- Does not replace hv_promote_signals; observes outcomes only.
-- ---------------------------------------------------------------------------
create or replace function private.log_signal_decision_on_review()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $fn$
begin
  if tg_op = 'UPDATE'
     and new.reviewed is true
     and (old.reviewed is distinct from true)
  then
    begin
      insert into public.signal_decision_events (
        signal_id,
        decision,
        autonomy_level_at_decision,
        promotion_path,
        human_id,
        gate_scores,
        model_versions,
        classifier_version,
        reason_codes
      ) values (
        new.id::text,
        'promote',
        coalesce(new.autonomy_level, case
          when coalesce(new.reviewed_by, '') like 'human:%' then 4
          when coalesce(new.reviewed_by, '') like 'auto:%' then 1
          else 3
        end),
        coalesce(
          new.promotion_path,
          case
            when coalesce(new.reviewed_by, '') like 'human:%' then 'human'
            when coalesce(new.reviewed_by, '') like 'auto:%' then 'full_auto'
            else null
          end
        ),
        null,
        coalesce(new.gate_scores, '{}'::jsonb),
        coalesce(new.model_versions, '{}'::jsonb),
        new.classifier_version,
        array[
          case
            when coalesce(new.reviewed_by, '') like 'human:%' then 'human_review'
            when coalesce(new.reviewed_by, '') like 'auto:%' then 'auto_promote'
            else 'reviewed'
          end
        ]
      );
    exception
      when others then
        -- Never block promotion path on audit insert failure
        raise notice 'log_signal_decision_on_review: %', sqlerrm;
    end;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_log_signal_decision_on_review on public.signals;
create trigger trg_log_signal_decision_on_review
  after update of reviewed on public.signals
  for each row
  execute function private.log_signal_decision_on_review();

comment on function private.log_signal_decision_on_review() is
  'Observability: writes signal_decision_events when reviewed becomes true. Failures are non-blocking.';
