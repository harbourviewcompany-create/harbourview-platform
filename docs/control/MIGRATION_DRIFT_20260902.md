# Migration Drift — 2026-09-02: the gate, the generator, and a retraction

Source SHA: `9d6d365635cbd3d21e9fed0bc1da1f6001469570`

This document covers three things that turned out to be one thing:

1. `Migration Drift Check` has been failing continuously since 2026-08-30 with 30
   `applied_not_committed` versions.
2. The drift has an identifiable generator, and it is checked into this repository.
3. A load-bearing claim in `MIGRATION_DRIFT_20260830.md` — that the applied SQL is
   unrecoverable — is **wrong**, and that error is why the backlog stayed unfixed.

## 1. Current gate state (verified live)

The hourly job `Compare repository and live migration ledgers` fails at HEAD `9d6d365`:

```text
Remote migration drift detected: 20260822134600, 20260830140000, 20260830141000,
20260830184434, 20260830185137, 20260830191900, 20260830192000, 20260830193000,
20260830203038, 20260831001235, 20260831011430, 20260831011731, 20260831011752,
20260831012629, 20260831020104, 20260831021320, 20260831021633, 20260831021727,
20260831115225, 20260831115343, 20260831115509, 20260831115538, 20260831115604,
20260831115940, 20260901021633, 20260901022725, 20260901024429, 20260901220634,
20260902021703, 20260902021818; equivalence mismatches: none
```

Six of those thirty were applied on 2026-09-01 and 2026-09-02 — i.e. **after** the
reconciliation PRs meant to clear the backlog were already open. This is not a fixed
backlog being worked down; it is a leak being bailed out.

### The gate is real but nothing depends on it

`Promote Production` polls `Compare repository and live migration ledgers` as a
required check and aborts when it fails. It has aborted on **every** push to `main`
since its last success on 2026-08-30 12:38 UTC (13 failures, 16 cancellations in the
last 30 runs). Production was never actually held back: Vercel's GitHub integration
deploys `main` independently (`githubDeployment: "1"`), and production is currently
serving `9d6d365`, deployed 2026-09-01 02:57 UTC.

So the gate fails, the deploy proceeds, and no human sees a difference. That is why
three days of continuous red went unremarked. **Either `Promote Production` should
gate the deploy or it should be deleted; a check nothing respects trains people to
ignore checks.** This decision is deliberately left open here — it is a deployment
policy change and needs explicit sign-off per `CLAUDE.md` Rule 3c.

## 2. The generator

`supabase_migrations.schema_migrations.created_by` attributes 25 of the 30 drifted
versions to `harbourviewcompany@gmail.com` — the account behind Supabase MCP
`apply_migration`. The remaining 5 predate that attribution or came via another path.

This is not a rogue process. It is the documented, recommended workflow:

> `.claude/skills/harbourview-platform/SKILL.md` §4 (before this change):
> "`execute_sql` and `apply_migration` are both reliable; **prefer `apply_migration`**
> for creating/replacing RPCs since it handles idempotency."

That instruction is correct about idempotency and silent about the fact that
`apply_migration` writes to production and never writes a repository file. An agent
following the repo's own skill file to the letter produces drift on every call.
Fixed in this change set: §4 now leads with that consequence, and `AGENTS.md` gains a
`Migration Discipline — Applying Is Half the Change` section.

## 3. Retraction: the applied SQL *is* recoverable

`MIGRATION_DRIFT_20260830.md` states:

> "The actual applied SQL/statement text for either version — **not recoverable**.
> `supabase_migrations.schema_migrations` stores `version` and `name` only, not
> statement payloads."

**This is false.** The table's actual columns are:

```text
version  |  statements (ARRAY)  |  name  |  created_by  |  idempotency_key  |  rollback (ARRAY)
```

`statements[1]` holds the applied SQL verbatim. Verified by recovering four versions
and confirming `md5(statements[1])` against the bytes written to disk:

| version | md5 | match |
|---|---|---|
| 20260901022725 | `bd765a4b1cd58e83a7c59664e6057407` | exact |
| 20260901024429 | `da9c1124705d1d7bb54042fc50a55669` | exact |
| 20260902021703 | `1298052b99285ee78a20a3d0aeb88728` | exact |
| 20260902021818 | `953591d244c47d04af9313422d93227e` | exact |

The consequence of the error was material. Believing recovery impossible,
`MIGRATION_DRIFT_20260830.md` correctly declined to fabricate SQL (per disposition
rule 1, "Never manufacture SQL from current schema state") and therefore wrote no
file at all — leaving the versions permanently in the drift set. The disposition rule
is right and stands. It simply never applied here: reading back a recorded statement
is not manufacturing SQL from schema state.

**Reconstruction from `statements[1]` is the correct method and should be the default.**

## 4. What this change set does

Adds the four versions covered by no open PR, each byte-verified against
`statements[1]`:

```text
20260901022725  pin_search_path_on_mutable_functions
20260901024429  fix_embed_harvest_silent_failure_and_dispatch_starvation
20260902021703  fix_search_path_regression_missing_extensions_schema
20260902021818  fix_search_path_quoting_regression
```

It deliberately does **not** touch the 26 versions claimed by PRs #1739, #1740,
#1742, #1743 — see §6.

## 5. The incident these four record

Read in order, they are a 24-hour production regression that no repository artifact
would otherwise show:

- `20260901022725` pinned `search_path = 'public'` on seven functions as security
  hardening. Three of them (`hv_local_classify_gate(vector)`,
  `hv_gemini_embed_backfill_tick`, and later `hv_embed_harvest`) depend on pgvector's
  `vector` type, which lives in `extensions`. Pinning them to `public` alone breaks
  them at call time — not at apply time, so the migration looked successful.
- `20260902021703`, ~24 hours later, attempted the fix with
  `set search_path = 'public, extensions'`. That quotes the entire list as a single
  identifier rather than naming two schemas, so it did not work either.
- `20260902021818`, four minutes after that, used the unquoted form
  `set search_path to public, extensions` and resolved it.

Current production state verified correct at time of writing — all three functions
report `proconfig = {"search_path=public, extensions"}`. Both failure modes are now
called out in `SKILL.md` §4.

## 6. Open reconciliation PRs overlap and none of them is sufficient

| PR | Contents | Assessment |
|---|---|---|
| #1740 | 24 migration files + `CLAUDE.md` | Largest; body verified below. Title says "34 versions", diff contains 24 |
| #1739 | 3 files | All 3 are also in #1740 — direct collision |
| #1742 | 4 files | 3 also in #1740; only `20260901021633` is unique |
| #1743 | 1 file (`20260901220634`) | Unique |
| #1741 | *Modifies* 5 existing migrations | 26 commits behind `main`; edits files pinned by content hash in `scripts/check-pending-production-migration-decisions.mjs` — review closely before merging |

Merging #1740 + #1742 + #1743 still leaves `20260901022725`, `20260901024429`,
`20260902021703`, `20260902021818` outstanding. This change set closes exactly that
remainder and collides with none of them.

### Verification of PR #1740 against production

Every file in #1740 was hashed against the live `statements[1]` for its version:

- **23 of 24 are faithful.** 21 match byte-for-byte after stripping the added header
  line; 2 more (`20260830203038`, `20260831021320`) differ only by added explanatory
  comments, with the SQL identical.
- **1 is not: `20260830185137_fix_regulatory_tier_rationale_mismatches.sql`.** The
  file is 848 bytes shorter than the recorded statement. The SQL is byte-identical —
  there is no behavioural difference — but the reconstruction dropped the
  "Category 1/2/3" comments recording *why* twelve jurisdictions (Belarus, China,
  Namibia, UAE, Andorra, Kenya, Kosovo, Cuba, El Salvador, Honduras, Nicaragua,
  Venezuela) were reclassified to `prohibited`, why five moved to
  `medical_limited_trade`, and why Malta moved to `domestic_only`.

On a compliance-facing product whose globe renders directly off
`countries.regulatory_tier`, the stated justification for a jurisdiction's
classification is the part worth keeping. Recommend restoring those comments on
#1740 before merge. Not corrected here, to avoid a collision on that file.

## 7. Not addressed here (needs sign-off)

- **The `Promote Production` gate decision** (§1) — deployment policy, Rule 3c.
- **Two ERROR-level Supabase advisors**: `public.signals_quality` and
  `public.signals_intelligence_feed` are `SECURITY DEFINER` views. Also 18
  `SECURITY DEFINER` functions executable by `anon` over REST, including
  `api.request_signal_analysis(p_signal_id text)`. These are security changes and are
  explicitly out of scope for an unattended session per the `CLAUDE.md` Harbourview
  addenda.
- **Merging any of #1739–#1743**, including this one.
- `docs/control/VERCEL_DEPLOYMENT_POLICY.md` names canonical project
  `prj_FiWMX10YY6MDo2WbTDVUKe6QWF8c`; live deployments run on
  `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`. One of the two is stale; not resolved here.
