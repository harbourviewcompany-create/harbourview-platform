-- Add covering indexes for single-column foreign keys in the public and
-- regulatory_signals schemas when no valid index already uses the foreign-key
-- column as its leading key.
--
-- The production migration was generated as a static 102-statement snapshot.
-- Repository zero-state history can legitimately omit production-only optional
-- relations, so replay must derive the same operation from the catalog rather
-- than assuming every historical relation exists.

do $cover_unindexed_foreign_keys$
declare
  foreign_key record;
  index_name text;
begin
  for foreign_key in
    select
      namespace.nspname as schema_name,
      relation.relname as table_name,
      attribute.attname as column_name,
      constraint_record.conrelid as relation_id,
      constraint_record.conkey[1] as column_number
    from pg_constraint constraint_record
    join pg_class relation
      on relation.oid = constraint_record.conrelid
    join pg_namespace namespace
      on namespace.oid = relation.relnamespace
    join pg_attribute attribute
      on attribute.attrelid = constraint_record.conrelid
     and attribute.attnum = constraint_record.conkey[1]
    where constraint_record.contype = 'f'
      and cardinality(constraint_record.conkey) = 1
      and namespace.nspname in ('public', 'regulatory_signals')
      and not exists (
        select 1
        from pg_index index_record
        where index_record.indrelid = constraint_record.conrelid
          and index_record.indisvalid
          and index_record.indisready
          and index_record.indnkeyatts > 0
          and index_record.indkey[0] = constraint_record.conkey[1]
      )
    order by namespace.nspname, relation.relname, attribute.attname
  loop
    index_name := format('idx_%s_%s', foreign_key.table_name, foreign_key.column_name);

    execute format(
      'create index if not exists %I on %I.%I (%I)',
      index_name,
      foreign_key.schema_name,
      foreign_key.table_name,
      foreign_key.column_name
    );
  end loop;
end
$cover_unindexed_foreign_keys$;
