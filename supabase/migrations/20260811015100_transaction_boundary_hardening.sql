-- Harbourview native transaction system: Stage 6b boundary hardening.
-- Preserve existing marketplace privilege shape while making new internal bridge identifiers
-- inaccessible and unwritable through any broad anon/authenticated table grants.

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

-- Convert any pre-existing table-wide SELECT/INSERT/UPDATE privileges to column allowlists.
-- Crucially, this preserves the privilege *shape*: a role only receives a column-level privilege
-- when it already held the corresponding table-level privilege before this migration. This avoids
-- broadening a stricter fresh/staging environment merely because production currently has broad grants.
do $$
declare
  relation_name text;
  grantee_name text;
  privilege_name text;
  excluded_columns text[];
  allowed_columns text;
  had_table_privilege boolean;
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
      raise exception 'cannot build legacy-column allowlist for %', relation_name;
    end if;

    foreach grantee_name in array array['anon','authenticated'] loop
      foreach privilege_name in array array['SELECT','INSERT','UPDATE'] loop
        had_table_privilege := has_table_privilege(
          grantee_name,
          format('public.%I', relation_name),
          privilege_name
        );

        execute format(
          'revoke %s on table public.%I from %I',
          privilege_name,
          relation_name,
          grantee_name
        );

        if had_table_privilege then
          execute format(
            'grant %s (%s) on table public.%I to %I',
            privilege_name,
            allowed_columns,
            relation_name,
            grantee_name
          );
        end if;
      end loop;
    end loop;
  end loop;
end;
$$;

comment on column public.listings.product_id is 'Internal canonical product bridge. Not exposed through anon/authenticated marketplace column grants.';
comment on column public.listings.economic_account_id is 'Internal economic-account bridge. Not exposed through anon/authenticated marketplace column grants.';
comment on column public.buyer_requests.product_id is 'Internal canonical product bridge. Public request submission cannot set or read this column directly.';
comment on column public.buyer_requests.economic_account_id is 'Internal economic-account bridge. Public request submission cannot set or read this column directly.';
comment on column public.buyer_requests.opportunity_id is 'Internal opportunity bridge. Public request submission cannot set or read this column directly.';
