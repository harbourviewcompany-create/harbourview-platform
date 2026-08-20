# Agent handoff: apply heat-map Supabase migrations

**Status:** READY FOR AGENT  
**Owner agent task:** Apply migrations to production Supabase, verify, report back  
**Related PRs:**
- Code + migration v1: https://github.com/harbourviewcompany-create/harbourview-platform/pull/1498 (merged)
- Conflict/freeze/seed + app: https://github.com/harbourviewcompany-create/harbourview-platform/pull/1583
- This ops PR: apply schema to live DB

---

## Target

| Field | Value |
|-------|--------|
| GitHub repo | `harbourviewcompany-create/harbourview-platform` |
| Supabase project ref | `zvxdgdkukjrrwamdpqrg` |
| Vercel project | `harbourview` |
| Production URL | `https://harbourview.vercel.app` |

---

## Migrations to apply (in order)

1. `supabase/migrations/20260816120000_auto_heatmap_from_signals.sql`  
   - Tables: `market_access_events`, `market_access_proposals`, `platform_feature_flags`  
   - RPCs: `api.record_market_access_event`, `api.promote_market_access_from_signals`, kill-switch helpers  
   - View: `api.country_market_access_public`  
   - Column: `countries.regulatory_tier_auto_frozen`

2. `supabase/migrations/20260820120000_heatmap_conflict_freeze_seed.sql`  
   - Replaces promote + roll-up (conflict-aware, restriction-aware)  
   - Freezes tier-1 markets  
   - Seeds DE / BR / CO reviewed tiers

**If migration 1 was already applied on prod, apply only migration 2.**  
**If neither was applied, apply both in timestamp order.**

---

## How to apply

### Preferred: Supabase CLI linked to project

```bash
# from repo root, on branch that contains both migration files
git fetch origin
git checkout ops/apply-heatmap-supabase-migrations   # or main after #1583 merges

# link if needed
npx supabase link --project-ref zvxdgdkukjrrwamdpqrg

# dry-check remote status
npx supabase migration list

# push pending migrations
npx supabase db push
```

### Alternative: SQL Editor (manual)

1. Open Supabase dashboard → project `zvxdgdkukjrrwamdpqrg` → SQL Editor  
2. Paste full contents of each migration file (in order)  
3. Run; stop on first error and report

### Do NOT

- Do not invent alternate SQL  
- Do not skip verification queries  
- Do not unfreeze tier-1 markets in this task  
- Do not change Vercel env unless asked

---

## Verification SQL (run after apply)

```sql
-- 1. Flag + kill switch present
select key, enabled from public.platform_feature_flags
where key = 'market_access_auto_apply_enabled';
-- expect: enabled = true

-- 2. Freeze column + tier-1 frozen
select iso_alpha2, regulatory_tier, regulatory_tier_auto_frozen
from public.countries
where iso_alpha2 in ('DE','BR','CO','CA','AU','GB','US')
order by iso_alpha2;
-- expect: DE/BR/CO tiers as below; all listed auto_frozen = true

-- 3. Seeded tiers
-- DE → legal_commercial_access
-- BR → medical_limited_trade
-- CO → medical_limited_trade

-- 4. RPCs exist
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'api'
  and proname in (
    'promote_market_access_from_signals',
    'record_market_access_event',
    'set_market_access_auto_apply',
    'set_country_auto_freeze'
  )
order by proname;
-- expect: 4 rows

-- 5. Tables exist
select to_regclass('public.market_access_events') as events,
       to_regclass('public.market_access_proposals') as proposals;

-- 6. Audit rows for seed (optional)
select country_iso2, old_tier, new_tier, actor, note
from public.regulatory_tier_audit
where actor = 'seed:heatmap-v1.1'
order by country_iso2;

-- 7. Smoke promote (should no-op if no pending events)
select api.promote_market_access_from_signals(168);
```

---

## Success criteria

- [ ] Both migrations recorded as applied (or #1 already present + #2 applied)
- [ ] Verification queries pass
- [ ] DE = `legal_commercial_access`, frozen
- [ ] BR = `medical_limited_trade`, frozen
- [ ] CO = `medical_limited_trade`, frozen
- [ ] `api.promote_market_access_from_signals` returns JSON without error
- [ ] Comment on this PR (or parent #1583) with: applied yes/no, verification output summary, any errors

---

## Rollback (only if apply fails mid-way)

- Do not partially leave unknown state — report the failing statement  
- Kill switch (if tables exist):

```sql
select api.set_market_access_auto_apply(false, 'ops-rollback');
```

Full schema rollback is not automated; restore from backup only under human instruction.

---

## After success

1. Comment on https://github.com/harbourviewcompany-create/harbourview-platform/pull/1583  
2. Optionally merge this ops PR once handoff doc is on main  
3. App/cron code from #1583 still needs merge + deploy for the closed loop to run
