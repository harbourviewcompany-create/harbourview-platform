-- Client-side error capture for app/country/[country]/error.tsx and
-- app/global-error.tsx. Neither boundary currently records anything durable
-- (console.error only), so a client-side hydration crash leaves zero
-- evidence behind for the next investigation. This table is the landing
-- zone for a best-effort beacon fired from those boundaries' useEffect.
--
-- Insert-only for anon/authenticated (same shape as marketplace_inquiries):
-- visitors can report an error, nobody can read another visitor's report
-- through the client. user_id is populated from auth.uid() server-side via
-- the column default, not accepted from the client payload, so it can't be
-- spoofed by a caller hitting the API route directly.

create table if not exists public.client_error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  boundary text not null check (boundary in ('country_role', 'global')),
  route text,
  digest text,
  message text not null,
  stack text,
  user_agent text,
  viewport_width int,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  extra jsonb
);

alter table public.client_error_reports enable row level security;

revoke all on public.client_error_reports from anon;
revoke all on public.client_error_reports from authenticated;
grant insert on public.client_error_reports to anon, authenticated;

drop policy if exists "Public can report client errors" on public.client_error_reports;
create policy "Public can report client errors"
  on public.client_error_reports
  for insert
  to anon, authenticated
  with check (
    length(trim(message)) > 0
    and length(message) <= 2000
    and (stack is null or length(stack) <= 4000)
    and (route is null or length(route) <= 500)
    and (digest is null or length(digest) <= 200)
    and (user_agent is null or length(user_agent) <= 500)
    and (viewport_width is null or (viewport_width > 0 and viewport_width <= 20000))
    and (extra is null or pg_column_size(extra) <= 4000)
    and user_id is not distinct from auth.uid()
  );

create index if not exists client_error_reports_created_at_idx
  on public.client_error_reports (created_at desc);

-- PostgREST is configured to expose only the api schema (see
-- 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql for the
-- same PGRST205 "table not found in schema cache" failure mode this
-- prevents). Passthrough view + grant, no triggers needed: this is a
-- simple single-table view so Postgres's auto-updatable-view mechanism
-- handles INSERT (and the underlying table's default/RLS) transparently.

-- security_invoker = true is required here, not left to a follow-up ALTER:
-- Postgres views default to security_invoker = false, which runs permission
-- and RLS checks as the view OWNER (table owner, RLS-exempt) rather than the
-- calling role — silently letting inserts bypass every check above. Also,
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to that
-- default, so this must be repeated on every future replace of this view,
-- not set once and assumed to stick.
create or replace view api.client_error_reports
with (security_invoker = true)
as select * from public.client_error_reports;

grant insert on api.client_error_reports to anon, authenticated;

notify pgrst, 'reload schema';
