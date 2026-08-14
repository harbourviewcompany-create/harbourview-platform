# Migration state: repo vs production, 2026-08-08

**Status: corrected. The first version of this document was substantially wrong
and is retracted below. Nothing here has been applied to production.**

Production project `zvxdgdkukjrrwamdpqrg`. Figures read live 2026-08-08.

## Retraction

The first draft of this file asserted three things that are false. They were
written without reading `AGENTS.md`'s release-control section or checking for
existing tooling, and they were reported upward before being checked.

**1. "There is no check anywhere that compares `supabase/migrations` against
`schema_migrations`."** False. `.github/workflows/migration-drift-check.yml`
exists, runs on push and hourly (`cron: '0 * * * *'`), and
`scripts/migration-ledger-manifest.mjs` computes and publishes **both**
`applied_not_committed` and `committed_not_applied` — the exact figure the draft
presented as an unmonitored discovery. The gate fails only on
`applied_not_committed` (remote-only drift). So repository-only migrations are
measured and reported every hour; they are simply not a failing condition.

**2. "68 unapplied migrations" framed as neglect.** Misleading.
`supabase/release-controls/pending-production-migration-decisions.json` is a
content-bound ledger that classifies pending migrations, and
`scripts/check-pending-production-migration-decisions.mjs` enforces it. Sampled:

```text
20260722031500  requiring_forward_reconciliation  live equivalent 20260722200145
20260723180000  obsolete                          superseded by 20260727002735
20260727160000  separately_authorized             independent_release_not_authorized
20260801150000  separately_authorized             independent_release_not_authorized
20260802152500  approved                          elite_digest_approved
```

Most of the set is deliberate and recorded: already live under a different
version, obsolete, or withheld pending a separate release decision. Presenting
it as five weeks of unnoticed drift was wrong.

**3. The proposed "security revoke" tranche.** Wrong on its headline item.
`20260805234000_revoke_anon_execute_on_net_http.sql` states in its own header,
under "WHY THIS MIGRATION CANNOT FIX IT", that `net.http_get` / `net.http_post`
are owned by `supabase_admin` with `anon=X/supabase_admin` ACL entries, and that
the migration role cannot revoke them. Applying it would not close that grant.
Two others in the proposed tranche are already live or obsolete per the table
above. The tranche as drafted would have re-run settled work and still not
closed the one item it led with.

## What survives, verified live

These were checked directly and are unaffected by the retraction.

**Five call sites whose database objects do not exist in production.** Absent
from *every* schema: `is_verified_clinician`, `clinical_request_verification`,
`clinical_admin_verify_professional`, `clinical_my_professional`,
`submit_signal_relevance_feedback`, `signal_relevance_feedback_for_ranking`,
`ci_jurisdiction_id_for_iso`, and the schema `cannabis_intelligence`.
`hv_admin_review_queue` exists in `public` only, while every caller is pinned to
`api`.

| Surface | Consequence today |
| --- | --- |
| `app/api/clinical/**`, `lib/clinical/auth.ts` | Clinician verification cannot be requested or granted |
| `app/api/org/licences/submit/route.ts` and 5 others | Unmatched licences flip the org to `pending_review` and are never queued |
| `app/api/signals/feedback/route.ts`, `lib/signals/feedbackScores.ts` | Feedback fails on write and is never read back |
| `lib/intelligence-engine/graph-writer.ts` | Targets a schema that has never existed |

**One of these is cleared, but "cleared" does not mean "apply it".**
`20260802152500_signal_feedback_api_rpcs` is classified `approved` in the
ledger. An earlier version of this document called it "a change that needs only
an apply". That was wrong, and repeated the same error as the retraction above —
asserting release state without reading the controlling document.

`docs/control/ELITE_DIGEST_RELEASE_CONTROL.md` approves it only as part of an
exact ordered three-file sequence, and requires the complete pending set plus a
production preflight to pass before `supabase db push --include-all`.
`docs/control/PENDING_PRODUCTION_MIGRATION_DECISIONS_2026-08-02.md` says not to
apply it until every manifest gate reads GO. A standalone apply would be an
unauthorized one-off migration.

So it is the shortest path to a working feature, but the path runs through that
controlled activation — not through applying one file.

**`api.signals` and `api.signals_quality` are granted SELECT to `anon`:**

```text
api.signals              anon, authenticated, postgres, service_role
api.signals_quality      anon, authenticated, postgres, service_role
api.signals_with_quality       authenticated, postgres, service_role
```

`20260801150000` would append the ten classifier columns and the generated
`analysis` payload to both. That remains true and worth knowing — but it is
classified `separately_authorized`, so the ledger and its check script exist
precisely to stop it going in casually. The draft called it "a loaded gun any
`supabase db push` would fire"; the accurate statement is that a direct
`supabase db push` bypassing the repo's own gate would fire it, and the gate is
there to prevent that.

**The migration file has been left byte-identical** to what the ledger binds
(`git_blob_sha e44a7748…`). The draft edited it to remove the two view
definitions, which changed the blob SHA and would have failed
`check-pending-production-migration-decisions.mjs`. Whether to amend the
migration and re-bind the hash, or leave it and rely on the classification, is a
release-control decision and is left open below.

## Open questions for decision

1. **Run the Elite Digest three-file activation?** That is what actually
   unblocks the signal feedback loop — `20260802152500` is approved only inside
   that sequence, behind the manifest gates and preflight described in
   `ELITE_DIGEST_RELEASE_CONTROL.md`. Not a standalone apply.
2. **`20260801150000`** — amend to drop the anon-facing view rewrites and re-bind
   the ledger hash, or leave as-is on the strength of its classification?
3. **The `net.http_*` grant** cannot be closed by a migration. If it is to be
   closed at all it is a platform-level action against `supabase_admin`, outside
   this repository. Worth confirming it is understood and accepted rather than
   pending.
4. **The clinical module** (`separately_authorized`) — a verification and
   patient-data system. Its own review, not a tranche slot.
5. **Extend the existing drift gate** rather than build a new one: make
   `committed_not_applied` fail, or age-limit it, for migrations classified
   `approved` that remain unapplied past some window. That is the real gap —
   `20260802152500` is approved, unapplied, and nothing escalates it.

## Method note

The error here was writing a control document from a database query without
first reading the repository's own release-control conventions, then reporting
its conclusions before verifying them. `AGENTS.md` and
`supabase/release-controls/` answer most of what the draft treated as unknown.
Read those first.

## 2026-08-13 follow-up: closing out the net.http_* question (item 3 above)

Confirmed directly, not just cited: `revoke usage on schema net from anon,
authenticated` was already present in `20260804190000_production_security_hardening.sql`
and had already been run in production (workflow run 31215018893, 2026-08-07,
reported success) before this check. It had no effect then and has none now —
tried it again live as `postgres` and the `net` schema ACL is unchanged.
`pg_auth_members` confirms why: `postgres` is not a member of `supabase_admin`,
which owns the `net` schema, and REVOKE by a non-grantor role with no grant
option is a silent Postgres no-op, not an error. This matches upstream reports
(supabase/cli#4246, supabase discussion #39221) of the identical outcome on
other projects — not something specific to this database.

Practical exposure, checked rather than assumed: `net` is not in
`pgrst.db_schemas` (`public, graphql_public, job_search, api` — see
`pg_db_role_setting` for role `authenticator`). PostgREST is the only route
from the anon/authenticated *keys* into the database; it will not proxy a
request into a schema it doesn't expose, regardless of the underlying grant.
Reaching `net.http_get`/`http_post` as anon would require a direct Postgres
connection authenticated as the `anon` role, which the standard anon-key/
PostgREST flow never provides.

**Answering item 3 directly: understood and accepted, not pending.** The grant
is real, the migration's attempt to close it is not fixable from any role
available to this project, and the residual risk is defense-in-depth rather
than a live path from the public API. No further action from this angle
unless Supabase changes what `postgres` is permitted to revoke on
platform-owned schemas, or offers an official mechanism for it. The dead
`revoke`/`grant` block in `20260804190000` was left in place with a comment
explaining this, rather than deleted, so it isn't mistaken for working
protection or re-investigated from zero by a future pass.
