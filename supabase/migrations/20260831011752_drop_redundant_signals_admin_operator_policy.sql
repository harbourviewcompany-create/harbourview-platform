-- Reconstructed from production. Verbatim statements for version 20260831011752.
begin;

-- signals_select_admin_operator_only (admin,operator) is a strict subset of
-- signals_admin_operator_analyst_select (admin,operator,analyst) -- same role_id
-- lookup pattern, same table, same command. Anything the subset policy grants,
-- the superset policy already grants. Zero access-outcome change; one fewer
-- permissive policy evaluated per row on every authenticated SELECT.

drop policy if exists signals_select_admin_operator_only on public.signals;

commit;
