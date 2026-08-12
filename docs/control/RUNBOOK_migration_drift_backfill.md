# Runbook: finish the live-ahead migration backfill

**State as of 2026-08-12:** 1 of 58 migrations backfilled and byte-verified
(`20260727213922`). Script and remaining version list already committed on
branch `chore/migration-drift-backfill-tooling` (PR #1364, draft).
Companion CI fix is PR #1343 (draft) — makes the drift check actually run
on PRs; do not merge #1364 before confirming where #1343 stands, since
merging backfilled migrations is what will finally turn that check green.

Repo: `harbourviewcompany-create/harbourview-platform` (public).
Supabase project ref: `zvxdgdkukjrrwamdpqrg`.

---

## Step 0: check what access you actually have

This determines which path below to use. Don't guess — check.

- **Direct Postgres network access** (can reach `*.supabase.co` or a pooler
  host from wherever your bash/shell runs)? → **Path A**.
- **Only MCP-style tool access** (a Supabase execute_sql tool, a GitHub API
  token, but your shell's network egress is allowlisted and doesn't include
  Supabase)? → **Path B**. This was Claude's situation in this session —
  assume it's yours too unless you've confirmed otherwise.

---

## Path A: you have direct DB network access

Fastest path. One command:

```bash
export SUPABASE_DB_URL="<connection string with read access to supabase_migrations.schema_migrations>"
cd harbourview-platform
git checkout chore/migration-drift-backfill-tooling  # or main if #1364 already merged
./scripts/backfill-live-only-migrations.sh
```

The script is idempotent (skips versions that already have a file) and
prints next steps when done. Read them. Then skip to **Step 3** below.

---

## Path B: MCP tool access only (Supabase execute_sql + GitHub API, no direct DB network)

This is slower by nature — large SQL text has to pass through your own
context to get from the database to a file — but it's mechanical, not hard.
Batch it; don't do all 58 as separate round trips.

### Step 1: get the current live-only version list (don't trust the list below blindly — re-derive it, since more drift may have accumulated)

```sql
-- via your Supabase execute_sql tool, project zvxdgdkukjrrwamdpqrg
select string_agg(version, ',' order by version)
from supabase_migrations.schema_migrations;
```

Compare against `ls supabase/migrations | grep -oE '^[0-9]{14}' | sort`
from a fresh clone of `main`. `comm -13 repo_sorted.txt live_sorted.txt`
gives you the current live-only list. As of this writing it was 58 versions
starting at `20260727213922` and ending at `20260812000445` — but re-check.

### Step 2: pull content in batches of ~8-10, base64-encoded, and write files immediately

Base64, not raw SQL — raw SQL round-tripped through a model's own text
generation risks silent corruption on embedded quotes, non-ASCII characters
(this dataset has "Québec", em-dashes, apostrophes in names like "That's
Dope Cultivation Specialists Inc."), and is much larger to review for
correctness. Base64 is safe to copy verbatim and decode.

```sql
select json_agg(row_to_json(t)) from (
  select version, name,
         encode(convert_to(array_to_string(statements, E'\n\n'), 'UTF8'), 'base64') as content_b64
  from supabase_migrations.schema_migrations
  where version in ('<10 versions from your batch>')
  order by version
) t;
```

Write each batch straight to `supabase/migrations/{version}_{name}.sql` via
a decode script (`base64.b64decode(...).decode('utf-8')` in Python, or
`base64 -d` in bash) — don't manually retype the SQL. Verify byte counts
look sane (a 40-byte grant statement and a 40,000-byte data seed should
look obviously different) before moving to the next batch.

### Step 3: verify, then commit

```bash
cd harbourview-platform
git checkout chore/migration-drift-backfill-tooling   # continue the existing branch
# (write your new files here)
node scripts/migration-ledger-manifest.mjs --mode drift   # if runnable in your environment; otherwise this gets checked automatically once pushed, via the now-PR-triggered drift-check workflow (PR #1343)
git add supabase/migrations/
git commit -m "chore(migrations): backfill remaining live-ahead migrations"
git push
```

Push to the **same branch** (`chore/migration-drift-backfill-tooling`), not
a new one — PR #1364 will pick up the new commits automatically.

---

## Step 4 (both paths): don't merge blind

- Check the `Compare repository and live migration ledgers` status on
  PR #1364 after pushing — it should go from failure to success once all
  58 are in and correct. If it's still failing, something's wrong (a
  version you missed, or the DB has drifted further since you started —
  loop back to Step 1).
- This backfills history. It does **not** stop the next uncommitted
  migration from happening. That needs a human decision on the underlying
  access pattern (who/what can run raw DDL against prod), documented as an
  open question in `docs/control/DATABASE_CONTROL.md` — flag it, don't
  silently resolve it.
- Leave both #1343 and #1364 as **draft**, human merges. Don't self-merge.
