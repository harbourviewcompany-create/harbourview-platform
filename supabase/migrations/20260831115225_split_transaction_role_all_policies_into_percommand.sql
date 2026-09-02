-- Reconstructed from production. Verbatim statements for version 20260831115225.
begin;

do $$
declare
  rec record;
  write_cond text := '(select hv_has_transaction_role(array[''admin'',''operator'',''super_admin'']))';
begin
  for rec in
    select * from (values
      ('entities','entities_internal'),
      ('assertions','assertions_internal'),
      ('diligence_requirements','diligence_internal'),
      ('economic_account_members','economic_account_members_internal'),
      ('economic_accounts','economic_accounts_internal'),
      ('entity_aliases','entity_aliases_internal'),
      ('entity_facilities','entity_facilities_internal'),
      ('evidence_links','evidence_links_internal'),
      ('network_source_entity_links','network_source_entity_links_staff'),
      ('product_batches','product_batches_internal'),
      ('products','products_internal'),
      ('transaction_decisions','transaction_decisions_internal'),
      ('transaction_import_staging','transaction_import_internal'),
      ('transaction_networks','transaction_networks_internal'),
      ('transaction_parties','transaction_parties_internal'),
      ('transactions','transactions_internal')
    ) as t(tbl, prefix)
  loop
    execute format('drop policy if exists %I on public.%I', rec.prefix || '_write', rec.tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', rec.prefix || '_insert', rec.tbl, write_cond);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', rec.prefix || '_update', rec.tbl, write_cond, write_cond);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', rec.prefix || '_delete', rec.tbl, write_cond);
  end loop;
end $$;

commit;
