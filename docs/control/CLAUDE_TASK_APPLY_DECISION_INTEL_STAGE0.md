# @claude — Decision Intel stage0 (code-dependent, unapplied)

**Why:** `lib/intelligence-os/decisionDossier.ts` calls `get_intel_event_dossier` and `resolve_intel_event_route`. Those RPCs and `intel_*` tables are **only** created by these three baselined migrations. No production equivalent migration found in-repo.

**Operator status:** Documented as material gap in `BASELINE_DEEP_DEPENDENCY_FINDINGS.md`. Apply when operator confirms (or if already confirmed via “continue digging” + product priority on Decision Intel).

Project: `zvxdgdkukjrrwamdpqrg`

## Order (strict)

1. `20260808190000_decision_intel_stage0_first_slice.sql`
2. `20260808203000_decision_intel_stage0_review_fixes.sql`
3. `20260810202000_decision_intel_stage0_completion_hardening.sql`

Stop on first failure.

## Preflight

```sql
select to_regclass('public.intel_events');
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('api','public')
  and proname in ('get_intel_event_dossier','resolve_intel_event_route','resolve_intel_dashboard_routes');
```

- If `intel_events` already exists and RPCs exist → do **not** re-apply blindly; record ledger equivalence / insert missing version rows only after statement match proof.
- If missing → apply full chain.

## After each version

1. Ledger row for canonical version (or equivalence JSON if minted timestamp).
2. Remove version from `committed-not-applied-baseline.json`.
3. Comment verify output on the PR.

## Verify end state

```sql
select version from supabase_migrations.schema_migrations
where version in ('20260808190000','20260808203000','20260810202000')
order by 1;

-- optional smoke
-- select api.resolve_intel_dashboard_routes(); -- only if signature is zero-arg in file
```

## Do not

- Skip to clinical OS or heatmap in the same session unless separately authorized
- Apply RFR foundation restores as part of this task
