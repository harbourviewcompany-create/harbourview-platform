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
-- version 20260720184821.
--
-- Rewriting this file cannot affect production: 20260720184821 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Build 2: leading-indicator sourcing. Legislative bills = "change is coming", ahead of press.
create table if not exists public.legislative_bills (
  market text not null,
  bill_id text not null,
  title text,
  stage text,
  house text,
  last_update timestamptz,
  is_act boolean,
  withdrawn boolean,
  source_url text,
  fetched_at timestamptz not null default now(),
  primary key (market, bill_id)
);

-- Reusable harvester: parse a UK Parliament Bills API response (by pg_net request id) into legislative_bills.
create or replace function public.hv_billwatch_uk_harvest(p_rid bigint)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int:=0; it jsonb;
begin
  for it in select value from net._http_response r, jsonb_array_elements((r.content::jsonb)->'items') value where r.id=p_rid and r.status_code=200
  loop
    insert into public.legislative_bills(market, bill_id, title, stage, house, last_update, is_act, withdrawn, source_url, fetched_at)
    values ('GB', it->>'billId', it->>'shortTitle',
            it->'currentStage'->>'description', it->>'currentHouse',
            nullif(it->>'lastUpdate','')::timestamptz, (it->>'isAct')::boolean,
            (it->>'billWithdrawn') is not null,
            'https://bills.parliament.uk/bills/'||(it->>'billId'), now())
    on conflict (market, bill_id) do update set
      stage=excluded.stage, last_update=excluded.last_update, is_act=excluded.is_act,
      withdrawn=excluded.withdrawn, fetched_at=now();
    n:=n+1;
  end loop;
  return n;
end$fn$;
