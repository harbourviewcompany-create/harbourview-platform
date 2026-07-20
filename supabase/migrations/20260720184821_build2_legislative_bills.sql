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