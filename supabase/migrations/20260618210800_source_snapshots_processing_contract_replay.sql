-- Replay-safe convergence between the historical used/surplus snapshot table
-- and the production source-capture processing contract.
--
-- Legacy columns are retained for compatibility. Production capture fields are
-- added and backfilled from the earlier representation without deleting or
-- re-keying any source evidence.

alter table public.source_snapshots
  add column if not exists captured_url text,
  add column if not exists captured_title text,
  add column if not exists captured_text text,
  add column if not exists raw_html_hash text,
  add column if not exists captured_at timestamptz,
  add column if not exists fetch_status text,
  add column if not exists error_message text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz,
  add column if not exists language_detected text,
  add column if not exists word_count integer,
  add column if not exists requires_translation boolean default false,
  add column if not exists intelligence_pass integer,
  add column if not exists signal_candidates jsonb,
  add column if not exists processed_at timestamptz,
  add column if not exists processing_status text default 'pending',
  add column if not exists previous_hash text,
  add column if not exists changed boolean default false,
  add column if not exists published_at timestamptz;

update public.source_snapshots snapshot
set
  captured_url = coalesce(
    snapshot.captured_url,
    source.source_url,
    'urn:harbourview:source-snapshot:' || snapshot.id::text
  ),
  captured_text = coalesce(snapshot.captured_text, snapshot.raw_payload),
  raw_html_hash = coalesce(snapshot.raw_html_hash, snapshot.snapshot_hash),
  captured_at = coalesce(snapshot.captured_at, snapshot.fetched_at, now()),
  fetch_status = coalesce(
    snapshot.fetch_status,
    case
      when snapshot.http_status between 200 and 399 then 'success'
      when snapshot.http_status is null then 'skipped'
      else 'failed'
    end
  ),
  created_at = coalesce(snapshot.created_at, snapshot.fetched_at, now()),
  processing_status = coalesce(snapshot.processing_status, 'pending'),
  requires_translation = coalesce(snapshot.requires_translation, false),
  changed = coalesce(snapshot.changed, false)
from public.source_registry source
where source.id = snapshot.source_id;

-- Orphaned legacy snapshots still receive deterministic identity values.
update public.source_snapshots
set
  captured_url = coalesce(captured_url, 'urn:harbourview:source-snapshot:' || id::text),
  captured_text = coalesce(captured_text, raw_payload),
  raw_html_hash = coalesce(raw_html_hash, snapshot_hash),
  captured_at = coalesce(captured_at, fetched_at, now()),
  fetch_status = coalesce(
    fetch_status,
    case
      when http_status between 200 and 399 then 'success'
      when http_status is null then 'skipped'
      else 'failed'
    end
  ),
  created_at = coalesce(created_at, fetched_at, now()),
  processing_status = coalesce(processing_status, 'pending'),
  requires_translation = coalesce(requires_translation, false),
  changed = coalesce(changed, false)
where captured_url is null
   or captured_at is null
   or fetch_status is null
   or created_at is null
   or processing_status is null;

alter table public.source_snapshots
  alter column captured_url set not null,
  alter column captured_at set default now(),
  alter column captured_at set not null,
  alter column fetch_status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column processing_status set default 'pending';

do $source_snapshot_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_snapshots'::regclass
      and conname = 'source_snapshots_fetch_status_check'
  ) then
    alter table public.source_snapshots
      add constraint source_snapshots_fetch_status_check
      check (fetch_status in ('success','failed','blocked','skipped')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_snapshots'::regclass
      and conname = 'source_snapshots_processing_status_check'
  ) then
    alter table public.source_snapshots
      add constraint source_snapshots_processing_status_check
      check (processing_status in ('pending','processing','processed','failed','skipped','published')) not valid;
  end if;
end
$source_snapshot_constraints$;

create index if not exists idx_source_snapshots_processing_status_captured
  on public.source_snapshots(processing_status, captured_at);
create index if not exists idx_source_snapshots_captured_at
  on public.source_snapshots(captured_at desc);

alter table public.source_snapshots enable row level security;
revoke all on table public.source_snapshots from public, anon;
grant all on table public.source_snapshots to service_role;
