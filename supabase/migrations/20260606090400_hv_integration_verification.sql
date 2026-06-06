-- Harbourview verification SQL snippets for local release evidence.
create or replace view hv_audit.rls_enabled_check as
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('hv_core','hv_private','hv_commercial','hv_marketplace','hv_education','hv_sync','hv_audit','hv_search')
order by n.nspname, c.relname;

create or replace view hv_audit.public_dto_private_column_check as
select table_schema, table_name, column_name
from information_schema.columns
where table_schema = 'hv_public'
  and column_name in ('private_notes','notes_private','summary_private','description_private','raw_row_id','raw_source_file','import_batch_id','sensitivity');

create or replace view hv_audit.public_sources_unverified_check as
select * from hv_public.sources_public
where verification_status <> 'verified';

create or replace view hv_audit.public_marketplace_unapproved_check as
select p.id, p.title
from hv_public.marketplace_listings_public p
join hv_marketplace.listings l on l.id = p.id
where l.verification_status <> 'verified' or l.review_status <> 'approved';
