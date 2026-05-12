-- Protected AI Gateway rate limiting and metadata-only logging.
-- Server route calls the RPCs with SUPABASE_SERVICE_ROLE_KEY only.

create table if not exists public.ai_gateway_rate_limits (
  identity text primary key,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint ai_gateway_rate_limits_identity_not_empty check (length(trim(identity)) > 0),
  constraint ai_gateway_rate_limits_request_count_check check (request_count >= 0)
);

create table if not exists public.ai_gateway_request_logs (
  id bigserial primary key,
  request_id uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text not null,
  model text not null,
  fallback_model text,
  status text not null,
  http_status integer not null,
  prompt_char_count integer not null default 0,
  client_message_count integer not null default 0,
  error_class text,
  created_at timestamptz not null default now(),
  constraint ai_gateway_request_logs_ip_hash_not_empty check (length(trim(ip_hash)) > 0),
  constraint ai_gateway_request_logs_model_not_empty check (length(trim(model)) > 0),
  constraint ai_gateway_request_logs_status_not_empty check (length(trim(status)) > 0),
  constraint ai_gateway_request_logs_prompt_char_count_check check (prompt_char_count >= 0),
  constraint ai_gateway_request_logs_client_message_count_check check (client_message_count >= 0),
  constraint ai_gateway_request_logs_http_status_check check (http_status between 100 and 599)
);

create index if not exists ai_gateway_request_logs_user_created_idx
  on public.ai_gateway_request_logs (user_id, created_at desc);
create index if not exists ai_gateway_request_logs_ip_created_idx
  on public.ai_gateway_request_logs (ip_hash, created_at desc);
create index if not exists ai_gateway_request_logs_status_created_idx
  on public.ai_gateway_request_logs (status, created_at desc);

alter table public.ai_gateway_rate_limits enable row level security;
alter table public.ai_gateway_request_logs enable row level security;

revoke all on public.ai_gateway_rate_limits from anon, authenticated;
revoke all on public.ai_gateway_request_logs from anon, authenticated;
revoke all on sequence public.ai_gateway_request_logs_id_seq from anon, authenticated;

drop policy if exists ai_gateway_rate_limits_no_direct_access on public.ai_gateway_rate_limits;
drop policy if exists ai_gateway_request_logs_no_direct_access on public.ai_gateway_request_logs;

create policy ai_gateway_rate_limits_no_direct_access
  on public.ai_gateway_rate_limits
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy ai_gateway_request_logs_no_direct_access
  on public.ai_gateway_request_logs
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.consume_ai_gateway_rate_limit(
  p_identity text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_request_count integer;
begin
  if p_identity is null or length(trim(p_identity)) = 0 then
    raise exception 'identity_required';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid_window_seconds';
  end if;

  if p_max_requests < 1 or p_max_requests > 5000 then
    raise exception 'invalid_max_requests';
  end if;

  insert into public.ai_gateway_rate_limits as limits(identity, window_start, request_count, updated_at)
  values (p_identity, v_now, 1, v_now)
  on conflict (identity) do update
  set
    window_start = case
      when limits.window_start <= v_now - make_interval(secs => p_window_seconds) then v_now
      else limits.window_start
    end,
    request_count = case
      when limits.window_start <= v_now - make_interval(secs => p_window_seconds) then 1
      else limits.request_count + 1
    end,
    updated_at = v_now
  returning limits.window_start, limits.request_count
  into v_window_start, v_request_count;

  allowed := v_request_count <= p_max_requests;
  remaining := greatest(p_max_requests - v_request_count, 0);
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer)
  end;

  return next;
end;
$$;

create or replace function public.log_ai_gateway_request(
  p_request_id uuid,
  p_user_id uuid,
  p_ip_hash text,
  p_model text,
  p_fallback_model text,
  p_status text,
  p_http_status integer,
  p_prompt_char_count integer,
  p_client_message_count integer,
  p_error_class text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.ai_gateway_request_logs(
    request_id,
    user_id,
    ip_hash,
    model,
    fallback_model,
    status,
    http_status,
    prompt_char_count,
    client_message_count,
    error_class
  ) values (
    p_request_id,
    p_user_id,
    p_ip_hash,
    p_model,
    p_fallback_model,
    p_status,
    p_http_status,
    greatest(p_prompt_char_count, 0),
    greatest(p_client_message_count, 0),
    p_error_class
  )
  on conflict (request_id) do nothing;
end;
$$;

revoke all on function public.consume_ai_gateway_rate_limit(text, integer, integer) from public;
revoke all on function public.log_ai_gateway_request(uuid, uuid, text, text, text, text, integer, integer, integer, text) from public;

grant execute on function public.consume_ai_gateway_rate_limit(text, integer, integer) to service_role;
grant execute on function public.log_ai_gateway_request(uuid, uuid, text, text, text, text, integer, integer, integer, text) to service_role;

comment on table public.ai_gateway_rate_limits is 'Private AI Gateway rate-limit counters. No direct anon/authenticated access.';
comment on table public.ai_gateway_request_logs is 'Private AI Gateway metadata-only request log. Does not store raw prompts or model output.';
