# Migration Ledger Reconciliation — 2026-08-20

**Verified live (read-only unless stated), project `zvxdgdkukjrrwamdpqrg`.**
Companion to `MIGRATION_DRIFT_2026-08-08.md` and
`MIGRATION_LEDGER_RECONCILIATION_2026-08-10.md`.

---

## 1. What was failing

`.github/workflows/migration-drift-check.yml` had been red on `main` on every
hourly run. The reconciliation step named two versions:

```
Remote migration drift detected: 20260819170000, 20260819232736; equivalence mismatches: none
```

Both are `applied_not_committed` — applied to production, absent from the
repository — which is the direction the gate fails on. Neither is the
`committed_not_applied` direction that `AGENT_OPERATING_FACTS.md` warns about;
these are its mirror image, and they have distinct causes.

| Version | Cause | Resolution |
|---|---|---|
| `20260819170000` | Applied to production ahead of its pull request merging. The file exists only on the open branch. | Clears on merge of the PR carrying `20260819170000_clinical_reviewer_credential_integrity.sql`. No repository change required. |
| `20260819232736` | `apply_migration` mints its own apply-time version. The canonical repository file is `20260819160000_clinical_jurisdiction_supply_outlook.sql`. | Content-bound equivalence entry, below. |

### 1.1 Applying before merging is its own failure mode

`AGENT_OPERATING_FACTS.md` records that merging a migration does not apply it.
The inverse is equally true and is what happened with `20260819170000`:
applying it before the PR merged turned the drift gate red on `main` for
everyone else, for as long as the PR stayed open. The apply itself was
authorised and correct; the ordering was not free.

---

## 2. `20260819232736` — content-bound equivalence

The live ledger row stores the applied SQL. It is byte-identical to the
canonical repository file:

```sql
select md5(array_to_string(statements, E'\n')), length(array_to_string(statements, E'\n'))
from supabase_migrations.schema_migrations where version = '20260819232736';
-- 456e6aa3ca90458775f1a83675eed96c | 4212
```

```
$ md5sum supabase/migrations/20260819160000_clinical_jurisdiction_supply_outlook.sql
456e6aa3ca90458775f1a83675eed96c
$ wc -c  supabase/migrations/20260819160000_clinical_jurisdiction_supply_outlook.sql
4213
```

The digests match. The one-unit gap between 4212 and 4213 is not a content
difference: Postgres `length()` counts characters and `wc -c` counts bytes, and
the file's header comment contains a single two-byte `×`.

Recorded in `supabase/release-controls/migration-live-version-equivalences.json`,
pinned to git blob `d5778b84281064ae561081b51b94c725486f0705`. The manifest
recognises the alias only while that blob still matches the file on disk, so
editing the migration breaks the binding rather than silently carrying it
forward.

**Why an equivalence entry rather than rewriting the live ledger row.** Editing
`supabase_migrations.schema_migrations` to say `20260819160000` would also have
cleared the gate, and would have been a smaller diff. It was rejected: it
rewrites production migration history to assert something the ledger did not
record, it is invisible to review, and this repository already resolved the
identical failure six times through the equivalence manifest. The entry is a
reviewable file, pinned to content, and reversible by deleting it.

**Verification, both directions** — the same remote list against the same
repository tree, with and without the new entry:

| Equivalence entry | Result |
|---|---|
| absent | `Remote migration drift detected: 20260819232736` — exit 1 |
| present | `6 remote, 964 pending, 1 historical aliases, gate GO` — exit 0 |

`node --test tests/scripts/migration-ledger-manifest.test.mjs` passes 14/14,
including the case that pins every equivalence to its canonical blob.

---

## 3. `20260819210000` — null ledger name

Applied correctly; only its `name` column was null. Backfilled to
`clinical_prescriber_os_api_schema_exposure`, matching the repository filename,
guarded by `where version = '20260819210000' and name is null`.

Verified before writing that the migration really had been applied: all ten
`api.clinical_*` views it creates are present live. The `statements` column is
empty for this row, so the name is corroborated by the applied objects and the
filename rather than by a content hash.

This is cosmetic — `migration-ledger-manifest.mjs` matches on version and never
reads `name`, so the null was not causing the gate failure and no other row
needed changing on its account.

**Not fixed, and deliberately so:** 21 further rows carry a null `name`
(`20260727160000`–`20260818213300`). They are pre-existing, equally cosmetic,
and outside what was asked for here. Fixing them is a one-line update per row
whenever someone wants it; guessing 21 names unasked is not.

---

## 4. What this does not do

- Does not apply any migration to production.
- Does not change any schema object, function, policy or row of application data.
- Does not resolve `20260819170000`; that clears when its pull request merges,
  and the gate stays red on `main` until it does.

---

## 5. Follow-up, same day: `20260820100423`

After the reconciliation above merged, the drift gate went red again on the next
push to `main`. The cause is the same one, a third time.

| | |
|---|---|
| Live version | `20260820100423`, name `clinical_cross_border_formulary_check` |
| Canonical repository file | `20260819190000_clinical_cross_border_formulary_check.sql` |
| Repository `20260820100000` | `network_command_p1_introduction_status` — an **unrelated** migration, and not applied |

The apply-time version resembles a repository version closely enough to be
misread as one. It is not: nothing named `20260820100423` exists in the
repository, and the file whose version is nearest shares neither its name nor
its contents. Matching on the numeric prefix alone would have bound the
equivalence to the wrong migration.

Content verified before asserting anything, as in §2:

```
live  md5(array_to_string(statements, E'\n')) = acfeef2a39d8e894f5e5602a5efb5496, 5199 chars
file  md5sum 20260819190000_clinical_cross_border_formulary_check.sql = acfeef2a39d8e894f5e5602a5efb5496, 5199 bytes
```

Byte count equals character count here — unlike §2, this file is pure ASCII.

Recorded as an equivalence pinned to git blob
`c0ee6a1a6edc8976a249839d59a1aed163abe86e`. Verified in both directions against
the same tree: without the entry the manifest exits 1 naming `20260820100423`;
with it, `2 historical aliases, gate GO`. Manifest tests still 14/14.

### 5.1 This will keep happening

Three occurrences in two days, all the same mechanism: `apply_migration` mints
its own apply-time version, so applying through it *always* produces a ledger
row the repository cannot match, and the drift gate goes red on `main` until
someone writes an equivalence by hand.

The equivalence manifest is the right record of a mismatch that already exists.
It is a poor substitute for not creating them. Two ways out, neither taken here
because both are changes to how releases are performed and that is not an
agent's call:

1. Apply via `execute_sql` in a transaction that writes the ledger row under the
   canonical repository version — what was done for `20260819170000` (§1) and
   why that one produced no equivalence entry.
2. Apply only through `.github/workflows/apply-clinical-prescriber-os-production.yml`
   or a generalisation of it, so the version comes from the filename.

Worth deciding before the next apply, rather than after the fourth entry.
