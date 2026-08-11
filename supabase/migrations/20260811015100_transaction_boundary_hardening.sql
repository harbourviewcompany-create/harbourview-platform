-- Harbourview native transaction system: Stage 6b boundary hardening.
-- Preserve existing public marketplace columns while making new internal bridge identifiers
-- inaccessible and unwritable through the anon/authenticated table grants already present in production.

create or replace function public.hv_transaction_economics_key(
  network_key text,
  target_transaction uuid,
  target_metric public.hv_economics_metric_type,
  economic_event text,
  target_currency text
)
returns text
language plpgsql
immutable
strict
set search_path = public
as $$
declare
  parent_key text;
begin
  if economic_event like '%|%' or target_currency like '%|%' then
    raise exception 'economics recognition-key inputs cannot contain pipe separators';
  end if;
  if length(btrim(economic_event)) = 0 or length(btrim(target_currency)) = 0 then
    raise exception 'economics recognition-key inputs cannot be empty';
  end if;
  if target_currency !~ '^[A-Za-z]{3}$' then
    raise exception 'economics recognition-key currency must be a three-letter code';
  end if;

  parent_key := coalesce(nullif(btrim(network_key), ''), concat('TX|', target_transaction::text));
  if parent_key not like 'NETWORK|%' and parent_key not like 'TX|%' then
    raise exception 'economics recognition-key parent must begin with NETWORK| or TX|';
  end if;
  if parent_key ~ '[\r\n]' then
    raise exception 'economics recognition-key parent cannot contain line breaks';
  end if;

  return concat_ws('|',
    'ECON',
    parent_key,
    target_metric::text,
    lower(regexp_replace(btrim(economic_event), '\s+', '-', 'g')),
    upper(btrim(target_currency))
  );
end;
$$;

revoke all on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) from public, anon;
grant execute on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) to authenticated, service_role;

-- Convert table-wide public SELECT/INSERT/UPDATE privileges to column allowlists that exclude
-- the internal transaction bridge FKs. Existing RLS/policies and DELETE privileges are untouched.
do $$
declare
  relation_name text;
  excluded_columns text[];
  allowed_columns text;
begin
  foreach relation_name in array array['listings','buyer_requests'] loop
    if to_regclass('public.' || relation_name) is null then
      continue;
    end if;

    excluded_columns := case relation_name
      when 'listings' then array['product_id','economic_account_id']::text[]
      when 'buyer_requests' then array['product_id','economic_account_id','opportunity_id']::text[]
    end;

    select string_agg(format('%I', a.attname), ', ' order by a.attnum)
      into allowed_columns
      from pg_attribute a
     where a.attrelid = to_regclass('public.' || relation_name)
       and a.attnum > 0
       and not a.attisdropped
       and not (a.attname = any(excluded_columns));

    if allowed_columns is null then
      raise exception 'cannot build public legacy-column allowlist for %', relation_name;
    end if;

    execute format('revoke select, insert, update on table public.%I from anon, authenticated', relation_name);
    execute format('grant select (%s) on table public.%I to anon, authenticated', allowed_columns, relation_name);
    execute format('grant insert (%s) on table public.%I to anon, authenticated', allowed_columns, relation_name);
    execute format('grant update (%s) on table public.%I to anon, authenticated', allowed_columns, relation_name);
  end loop;
end;
$$;

comment on column public.listings.product_id is 'Internal canonical product bridge. Not exposed through anon/authenticated marketplace column grants.';
comment on column public.listings.economic_account_id is 'Internal economic-account bridge. Not exposed through anon/authenticated marketplace column grants.';
comment on column public.buyer_requests.product_id is 'Internal canonical product bridge. Public request submission cannot set or read this column directly.';
comment on column public.buyer_requests.economic_account_id is 'Internal economic-account bridge. Public request submission cannot set or read this column directly.';
comment on column public.buyer_requests.opportunity_id is 'Internal opportunity bridge. Public request submission cannot set or read this column directly.';
