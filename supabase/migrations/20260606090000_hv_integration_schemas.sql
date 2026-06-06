-- Harbourview Supabase + Airtable integration foundation: schemas, extensions, roles, helpers.
create extension if not exists pgcrypto;
create extension if not exists vector;

create schema if not exists hv_core;
create schema if not exists hv_private;
create schema if not exists hv_public;
create schema if not exists hv_commercial;
create schema if not exists hv_marketplace;
create schema if not exists hv_education;
create schema if not exists hv_sync;
create schema if not exists hv_audit;
create schema if not exists hv_search;

create or replace function hv_core.current_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'hv_role', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'hv_role', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''),
    current_user
  );
$$;

create or replace function hv_core.is_operator_or_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select hv_core.current_role() in ('operator', 'admin', 'service_role');
$$;

create or replace function hv_core.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select hv_core.current_role() in ('admin', 'service_role');
$$;

create or replace function hv_core.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
