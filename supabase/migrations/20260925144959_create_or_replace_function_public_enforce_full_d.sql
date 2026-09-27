-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925144959
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.enforce_full_depth_v2_provenance() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare snapshot_source uuid; registered_url text;
begin
 if new.verification_status='verified' then
  if new.source_snapshot_id is null or new.verified_at is null then raise exception 'verified full-depth evidence requires snapshot lineage and verified_at'; end if;
  select ss.source_id,sr.source_url into snapshot_source,registered_url from public.source_snapshots ss left join public.source_registry sr on sr.id=ss.source_id where ss.id=new.source_snapshot_id;
  if snapshot_source is null or registered_url is null then raise exception 'verified full-depth evidence requires valid snapshot/source lineage'; end if;
  if tg_table_name='jurisdiction_data_depth_evidence' and new.source_registry_id is distinct from snapshot_source then raise exception 'verified full-depth evidence source_registry_id must match snapshot source_id'; end if;
  if new.source_url is distinct from registered_url then raise exception 'verified full-depth evidence source_url must match registered source_url'; end if;
 end if;
 return new;
end $$;
