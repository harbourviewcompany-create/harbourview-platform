-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260721103919.
--
-- Rewriting this file cannot affect production: 20260721103919 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare n int;
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;
