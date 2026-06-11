-- Migration: 20260610000000_llm_rate_limits.sql
-- Supabase-backed LLM rate limiting.
-- Replaces the previous in-memory Map() approach which resets on every
-- serverless cold start, making per-user rate limits ineffective.

-- ── Table ─────────────────────────────────────────────────────────────────────

create table if not exists public.llm_rate_limits (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer    not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, window_start)
);

-- Index for the cleanup job
create index if not exists idx_llm_rate_limits_window_start
  on public.llm_rate_limits (window_start);

-- RLS: only service role reads/writes this table (no direct user access)
alter table public.llm_rate_limits enable row level security;

comment on table public.llm_rate_limits is
  'Per-user per-minute LLM gateway rate limit counters. Service role only.';

-- ── Atomic upsert RPC ─────────────────────────────────────────────────────────
-- Returns { count, allowed, remaining, reset_at } as JSONB.
-- Uses INSERT ... ON CONFLICT to atomically increment the counter.

create or replace function public.check_and_increment_llm_rate_limit(
  p_user_id     uuid,
  p_window_start timestamptz,
  p_limit       integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count   integer;
  v_reset_at timestamptz;
begin
  v_reset_at := p_window_start + interval '1 minute';

  insert into public.llm_rate_limits (user_id, window_start, request_count, updated_at)
  values (p_user_id, p_window_start, 1, now())
  on conflict (user_id, window_start)
  do update set
    request_count = llm_rate_limits.request_count + 1,
    updated_at    = now()
  returning request_count into v_count;

  return jsonb_build_object(
    'count',     v_count,
    'allowed',   v_count <= p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'reset_at',  v_reset_at
  );
end;
$$;

comment on function public.check_and_increment_llm_rate_limit is
  'Atomically increments the LLM rate limit counter for a user in a given minute window.
   Returns count, allowed, remaining, and reset_at. Called by service role only.';

-- ── Cleanup: purge windows older than 2 hours (run via pg_cron or manually) ──
-- pg_cron job (if pg_cron is enabled):
-- select cron.schedule('llm-rate-limit-cleanup', '0 * * * *',
--   $$delete from public.llm_rate_limits where window_start < now() - interval '2 hours'$$);
