begin;

do $$
declare r record; using_expr text; check_expr text;
begin
  for r in select schemaname, tablename, policyname, qual, with_check from pg_policies
    where schemaname in ('public','api','signals','regulatory_signals','storage')
      and (position('auth.uid()' in coalesce(qual,'')) > 0 or position('auth.uid()' in coalesce(with_check,'')) > 0)
      and (position('( SELECT auth.uid()' in coalesce(qual,'')) = 0 or position('( SELECT auth.uid()' in coalesce(with_check,'')) = 0)
  loop
    using_expr := replace(r.qual, 'auth.uid()', '(SELECT auth.uid())');
    check_expr := replace(r.with_check, 'auth.uid()', '(SELECT auth.uid())');
    if using_expr is not null and check_expr is not null then
      execute format('alter policy %I on %I.%I using (%s) with check (%s)', r.policyname, r.schemaname, r.tablename, using_expr, check_expr);
    elsif using_expr is not null then
      execute format('alter policy %I on %I.%I using (%s)', r.policyname, r.schemaname, r.tablename, using_expr);
    elsif check_expr is not null then
      execute format('alter policy %I on %I.%I with check (%s)', r.policyname, r.schemaname, r.tablename, check_expr);
    end if;
  end loop;
end $$;

create index if not exists idx_intel_assertion_evidence_evidence_ref_id on public.intel_assertion_evidence (evidence_ref_id);
create index if not exists idx_intel_assertions_jurisdiction_id on public.intel_assertions (jurisdiction_id);
create index if not exists idx_intel_events_canonical_signal_id on public.intel_events (canonical_signal_id);
create index if not exists idx_intel_events_jurisdiction_id on public.intel_events (jurisdiction_id);
create index if not exists idx_intel_evidence_refs_hv_evidence_id on public.intel_evidence_refs (hv_evidence_id);
create index if not exists idx_intel_evidence_refs_source_registry_id on public.intel_evidence_refs (source_registry_id);
create index if not exists idx_intel_evidence_refs_source_snapshot_id on public.intel_evidence_refs (source_snapshot_id);
create index if not exists idx_market_entry_events_actor_user_id on public.market_entry_events (actor_user_id);
commit;
