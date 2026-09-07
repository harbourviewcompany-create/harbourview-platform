# Claude task: apply `20260903100000` (global supply catalog availability)

**Status:** OPEN — operator-authorized production write  
**Assigned to:** Claude (Supabase access)  
**Opened by:** Grok session 2026-09-06  
**Supersedes partial work:** PR #1774 (ledger hygiene only; no live apply)

---

## Authority

Operator (Tyler) authorized apply of this migration. Claude owns **all Supabase production steps**. Grok cannot reach Supabase from its session.

**Project:** `zvxdgdkukjrrwamdpqrg` (Harbourview Marketplace production)  
**Migration file:** `supabase/migrations/20260903100000_make_supply_catalog_globally_available.sql`  
**Product intent:** DISPLAY/DISCOVERABILITY only — every country should see Harbourview-direct marketplace SKUs. Does **not** assert ship-as-is compliance for every country. `compliance_flags` must stay unchanged.

---

## Do this in order

### 1. Preflight (read-only)

```sql
-- Expect: no row yet (or confirm already applied)
select version, name
from supabase_migrations.schema_migrations
where version = '20260903100000';

-- Snapshot before
select count(*) as hv_skus,
       min(cardinality(target_countries)) as min_c,
       max(cardinality(target_countries)) as max_c,
       avg(cardinality(target_countries))::int as avg_c
from public.listings
where sold_by_harbourview = true;
```

If a ledger row **already exists** and `avg_c` ≈ 195, skip step 2 and go to step 3.

### 2. Apply (production write)

Run the migration body exactly:

```sql
update public.listings
set target_countries = array[
'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','YE','ZM','ZW'
]
where sold_by_harbourview = true;
```

Then record the version in the live ledger (adjust columns if this project's `schema_migrations` shape differs — some installs use only `version`):

```sql
insert into supabase_migrations.schema_migrations (version)
values ('20260903100000')
on conflict (version) do nothing;
```

If `name` / `statements` columns exist and are required, populate them from the migration file content.

### 3. Verify

```sql
select version from supabase_migrations.schema_migrations
where version = '20260903100000';

select count(*) as hv_skus,
       avg(cardinality(target_countries))::int as avg_countries,
       bool_and(cardinality(target_countries) >= 190) as all_wide
from public.listings
where sold_by_harbourview = true;

-- compliance_flags must be untouched by this change; spot-check one CA packaging SKU if convenient
```

**Pass criteria:** ledger row present; `avg_countries` ≈ 195; `all_wide` true (or explain outliers).

### 4. Repo hygiene (this PR)

After live apply succeeds:

1. Ensure this branch’s baseline edit is current: `20260903100000` **removed** from `supabase/release-controls/committed-not-applied-baseline.json` (count 127 → 126).
2. Ensure migration header no longer claims a false “already applied this session” from the #1755 era.
3. Close or supersede [PR #1774](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1774) (same hygiene; avoid double-merge conflict).
4. Optionally append one row to `docs/control/EVIDENCE_LOG.md` Build Evidence table.
5. Merge **this** PR to main once CI ledger compare is green against production.

### 5. Report back

Return:

- Objective completed / not completed
- SQL results (row counts, avg_countries, ledger select)
- Files changed / PR merged
- Remaining risks
- GO/HOLD

---

## Out of scope

- Do **not** change `compliance_flags`
- Do **not** invent per-country compliance claims
- Do **not** apply unrelated baselined historical migrations
- Do **not** touch Vercel env or auth

## Related context

- Migration landed in repo via PR #1755 as committed-not-applied
- #1752 restored fixtures (production builds green)
- #1774 is Grok’s ledger-only PR waiting on live apply confirmation
