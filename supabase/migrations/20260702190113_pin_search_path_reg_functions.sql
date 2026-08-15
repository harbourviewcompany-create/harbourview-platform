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
-- version 20260702190113.
--
-- Rewriting this file cannot affect production: 20260702190113 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

CREATE OR REPLACE FUNCTION public.reg_log_pathway_change()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('regulatory_pathways', new.id::text, 'status', old.status, new.status, 'reg_format_matrix_trigger');
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_log_rule_change()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'status', old.status::text, new.status::text, 'reg_format_matrix_trigger');
  end if;
  if new.thc_limit is distinct from old.thc_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'thc_limit', old.thc_limit, new.thc_limit, 'reg_format_matrix_trigger');
  end if;
  if new.cbd_limit is distinct from old.cbd_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'cbd_limit', old.cbd_limit, new.cbd_limit, 'reg_format_matrix_trigger');
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_require_primary_source()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
declare
  v_entity text := tg_argv[0];
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = v_entity
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark % %/% as verified: a primary-source citation (gazette, regulator, statute or court) is required first.',
        v_entity, new.iso_alpha2, new.slug
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_require_primary_source_rule()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
declare
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = 'rule'
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark rule % as verified: a primary-source citation is required first.', new.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reg_touch_updated_at()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$;
