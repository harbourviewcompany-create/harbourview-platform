# Migration apply — blockers found, nothing applied

**Date:** 2026-08-21
**Project:** `zvxdgdkukjrrwamdpqrg` (production)
**Scope:** the two migrations authorized for apply on 2026-08-21 —
`20260820120000_clinical_pilot_local_authorities_au_gb_br.sql` and
`20260820120000_heatmap_conflict_freeze_seed.sql`.
**Outcome:** **nothing was applied.** All checks below are read-only
(`select` only). No `apply_migration`, no DDL, no DML, no cron change.

The authorization described these as "the two safe non-pipeline ones — no
pipeline impact, no cron pause needed." Three of the four findings below
contradict that description on verified evidence, so the apply was stopped
rather than completed under an assumption that no longer holds.

---

## 1. The heat-map migration cannot run — its prerequisite is not in production

`20260820120000_heatmap_conflict_freeze_seed.sql` is a follow-up to
`20260816120000_auto_heatmap_from_signals.sql`. That prerequisite has **not**
been applied. Verified:

```sql
select (select count(*) from supabase_migrations.schema_migrations
          where version = '20260816120000')            as mig1_recorded, -- 0
       to_regclass('public.market_access_events')      as events_tbl,    -- null
       to_regclass('public.market_access_proposals')   as proposals_tbl, -- null
       to_regclass('public.platform_feature_flags')    as flags_tbl,     -- null
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'api'
            and p.proname in ('promote_market_access_from_signals',
                              'record_market_access_event',
                              'set_market_access_auto_apply',
                              'set_country_auto_freeze'))               as api_rpc_count, -- 0
       (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'countries'
            and column_name = 'regulatory_tier_auto_frozen')            as freeze_col;    -- 0
```

Line 318 of the freeze/seed migration is top-level DML:

```sql
update public.countries
   set regulatory_tier_auto_frozen = true
```

The column does not exist, so the migration **fails at that statement**
(`42703 undefined_column`). This is not a risk assessment — it is the
statement and the absent column. `docs/ops/APPLY_HEATMAP_SUPABASE_MIGRATIONS.md`
anticipates exactly this: *"If neither was applied, apply both in timestamp
order."*

## 2. Applying that prerequisite is a pipeline change, and arms an auto-apply loop

`20260816120000_auto_heatmap_from_signals.sql` seeds its own kill switch to
**on**:

```sql
insert into public.platform_feature_flags (key, enabled, description, updated_by)
values ('market_access_auto_apply_enabled', true, ..., 'migration:20260816120000')
on conflict (key) do nothing;
```

`vercel.json` registers `/api/cron/market-access-promote` on `0 11 * * *`, and
`app/api/cron/market-access-promote/route.ts` calls
`api.record_market_access_event` and `api.promote_market_access_from_signals`.
So applying the prerequisite arms a daily loop that can rewrite
`countries.regulatory_tier` — published, compliance-facing content — on the
next 11:00 UTC tick.

No pg_cron job touches it (`select ... from cron.job where command ilike
'%market_access%'` → 0 rows), which is what "no cron pause needed" was true
about. The Vercel cron is the exposure, and it was not part of the
authorization. **Not applied.**

The freeze/seed migration is the *safety layer* for that loop (restriction-aware
roll-up, conflict rejection, tier-1 freeze), so the correct order is
prerequisite → freeze/seed, promptly, as one decision.

## 3. The clinical migration adds no coverage and would create duplicate authorities

Its guard is `where not exists (... and la.authority_name = v.authority_name)` —
an exact string match. Production already holds all three countries, under
different labels for two of them:

| Country | In production | Migration inserts | Effect |
|---|---|---|---|
| AU | `Therapeutic Goods Administration (TGA)`, `Office of Drug Control (ODC)` | identical strings | no-op ✅ |
| GB | `Home Office (UK)` | `Home Office` | **duplicate row** ❌ |
| BR | `ANVISA (Agência Nacional de Vigilância Sanitária)` | `Agência Nacional de Vigilância Sanitária (ANVISA)` | **duplicate row** ❌ |

MHRA matches exactly and is a no-op. So the migration's net effect is: zero new
authorities, two duplicate records for bodies already covered, on a
clinician-facing surface.

The file's header states the names are *"aligned with
`lib/clinical/authorityRegistry.ts`"*. The registry uses short labels —
`'MHRA / Home Office'` (line 103) and `'ANVISA'` (line 108) — so it does not
adjudicate either long form. Choosing the canonical label for a published
authority record is a content decision, not a mechanical fix, so the guard was
**not** silently rewritten.

`local_intel_coverage` for AU/GB/BR is already `available` from a June 2026
pass; the migration would overwrite `last_reviewed_at` and append an Aug 2026
note. Cosmetic, but it would restamp review dates for a pass that adds nothing.

## 4. Both files share migration version `20260820120000` — neither apply can be recorded

`supabase_migrations.schema_migrations.version` is the primary key, so two
files with one version cannot both be recorded. The governance tooling closes
the workaround as well:

- `loadLiveVersionEquivalences` (`scripts/migration-ledger-manifest.mjs:194`)
  throws on a duplicate `repository_version`.
- `evaluateLiveVersionEquivalences` (line 216) recognizes an equivalence only
  when `files.length === 1` for that version.

So an apply through MCP `apply_migration` — which stamps its own timestamp
version, as the eight entries in `migration-live-version-equivalences.json`
show — could never be aliased back to either file. It would land in
`applied_not_committed`, which is the one condition
`.github/workflows/migration-drift-check.yml` fails on, hourly, on `main`.

This already blocks the release activation gate today:
`pendingDuplicateVersions` (line 311) filters duplicate versions that are
committed-not-applied, and `no_pending_duplicate_versions` is an
`activation_gate` requirement. `20260820120000` qualifies now.

**The same defect exists at `20260813010000`** —
`baseline_capture_pipeline_task_queue.sql` and
`extend_supply_catalog_equipment_to_australia.sql`. Neither is applied
(verified). Pre-existing, out of today's scope, flagged not fixed.

### Why the rename was not just done

The fix is one `git mv` to a unique 14-digit version. It was not made because
`global-reg-os-phase0-replacement.yml` runs
`git diff --exit-code <base.sha> HEAD -- supabase/migrations` on any PR
touching `docs/control/EVIDENCE_LOG.md`, `docs/control/DATABASE_CONTROL.md`,
`scripts/global-reg-os/**`, or `docs/control/global-regulatory-os/**` — and
`AGENTS.md` §4 requires an `EVIDENCE_LOG.md` entry for exactly this class of
change. Satisfying either control breaks the other.

A correction to the note in the 2026-08-20 evidence entry: that gate is **not**
pinned to commit `c9a172c2`; it diffs against the PR's own base SHA. The
practical effect is the same, but the earlier description was wrong.

The rename therefore needs either a PR that touches migrations and no control
doc (violating `AGENTS.md` §4), or a decision to adjust one of the two
controls. That is a governance call.

---

## Recommended sequence

1. **Decide the collision fix** — rename one file in each duplicate pair to a
   unique version, and resolve the `AGENTS.md`-vs-phase0-gate conflict that
   currently makes such a PR unlandable. Nothing else can be recorded until
   this is done.
2. **Decide on the heat-map loop** — apply `20260816120000` +
   `20260820120000_heatmap_conflict_freeze_seed.sql` together, or hold both.
   Applying only the first arms an unguarded auto-apply loop; applying only the
   second fails.
3. **Decide the GB/BR authority labels** — pick canonical names, then either
   make the migration's guard alias-aware or reduce it to the coverage note.
   As written it ships duplicates.

## Verified production state, 2026-08-21 (read-only)

- `20260816120000`, `20260820120000`, `20260820180000`, `20260813010000` — none
  recorded in `supabase_migrations.schema_migrations`.
- `public.local_authorities`: AU 2, GB 2, BR 2 rows.
- `public.local_intel_coverage`: AU/GB/BR all `available`, last reviewed
  2026-06-14.
- `cron.job` rows matching `%market_access%`: 0.
- No write of any kind was issued to this project in this session.
