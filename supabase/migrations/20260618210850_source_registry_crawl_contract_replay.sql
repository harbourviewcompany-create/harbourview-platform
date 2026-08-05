-- Replay-safe convergence between the historical used/surplus source registry
-- and the production intelligence-source crawl contract.
--
-- Existing legacy keys, category fields and parser settings remain intact for
-- historical rows. Modern intelligence-source rows are not required to invent
-- those retired identifiers; canonical source_name/source_url fields own the
-- forward contract.

alter table public.source_registry
  add column if not exists source_name text,
  add column if not exists is_active boolean,
  add column if not exists sub_region text,
  add column if not exists requires_translation boolean,
  add column if not exists signal_keywords text[],
  add column if not exists notes text,
  add column if not exists region text,
  add column if not exists language text,
  add column if not exists adapter text,
  add column if not exists crawl_cadence text,
  add column if not exists relevance_status text,
  add column if not exists tier integer,
  add column if not exists requires_auth boolean,
  add column if not exists publish_cadence text,
  add column if not exists source_type text,
  add column if not exists crawl_allowed boolean,
  add column if not exists next_crawl_at timestamptz,
  add column if not exists locked_until timestamptz,
  add column if not exists locked_by text,
  add column if not exists consecutive_failures integer,
  add column if not exists last_error_log text,
  add column if not exists network_status text,
  add column if not exists content_change_rate double precision,
  add column if not exists verification_notes text,
  add column if not exists verification_checked_at timestamptz,
  add column if not exists content_type text[],
  add column if not exists metadata jsonb;

update public.source_registry
set
  source_name = coalesce(source_name, name, source_key, source_url),
  is_active = coalesce(is_active, status <> 'disabled'),
  requires_translation = coalesce(requires_translation, false),
  language = coalesce(nullif(language, ''), 'en'),
  adapter = coalesce(nullif(adapter, ''), nullif(parser_type, ''), 'html_snapshot'),
  crawl_cadence = coalesce(
    nullif(crawl_cadence, ''),
    case
      when cadence_hours is null or cadence_hours <= 24 then 'daily'
      when cadence_hours <= 168 then 'weekly'
      else 'monthly'
    end
  ),
  relevance_status = coalesce(
    nullif(relevance_status, ''),
    case when status = 'disabled' then 'disabled' else 'active' end
  ),
  tier = coalesce(tier, 2),
  requires_auth = coalesce(requires_auth, false),
  source_type = coalesce(nullif(source_type, ''), nullif(category, ''), 'unknown'),
  crawl_allowed = coalesce(crawl_allowed, status <> 'disabled'),
  next_crawl_at = coalesce(
    next_crawl_at,
    last_checked_at + make_interval(hours => greatest(coalesce(cadence_hours, 24), 1)),
    now()
  ),
  consecutive_failures = coalesce(consecutive_failures, 0),
  network_status = coalesce(nullif(network_status, ''), 'online'),
  content_change_rate = coalesce(content_change_rate, 0.5),
  metadata = coalesce(metadata, '{}'::jsonb);

-- The historical used/surplus table required these three fields. Production's
-- unified registry does not. Retain populated legacy values, but permit all later
-- canonical rows to rely on source_name/source_url without synthetic identifiers.
alter table public.source_registry
  alter column source_key drop not null,
  alter column category drop not null,
  alter column name drop not null;

alter table public.source_registry
  alter column source_name set not null,
  alter column is_active set default true,
  alter column is_active set not null,
  alter column requires_translation set default false,
  alter column language set default 'en',
  alter column adapter set default 'html_snapshot',
  alter column crawl_cadence set default 'daily',
  alter column relevance_status set default 'active',
  alter column tier set default 2,
  alter column requires_auth set default false,
  alter column requires_auth set not null,
  alter column crawl_allowed set default true,
  alter column crawl_allowed set not null,
  alter column next_crawl_at set default now(),
  alter column consecutive_failures set default 0,
  alter column consecutive_failures set not null,
  alter column network_status set default 'online',
  alter column network_status set not null,
  alter column content_change_rate set default 0.5,
  alter column metadata set default '{}'::jsonb;

do $source_registry_contracts$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_registry'::regclass
      and conname = 'source_registry_tier_check'
  ) then
    alter table public.source_registry
      add constraint source_registry_tier_check
      check (tier is null or tier between 1 and 3) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_registry'::regclass
      and conname = 'source_registry_network_status_check'
  ) then
    alter table public.source_registry
      add constraint source_registry_network_status_check
      check (network_status in ('online','degraded','offline','quarantined')) not valid;
  end if;
end
$source_registry_contracts$;

create index if not exists idx_source_registry_due_crawl
  on public.source_registry(next_crawl_at, tier)
  where is_active = true and crawl_allowed = true;
create index if not exists idx_source_registry_network_status
  on public.source_registry(network_status, consecutive_failures desc);
create index if not exists idx_source_registry_iso_active
  on public.source_registry(iso, is_active)
  where iso is not null;

alter table public.source_registry enable row level security;
revoke all on table public.source_registry from public, anon;
grant select, insert, update, delete on table public.source_registry to authenticated;
grant all on table public.source_registry to service_role;
