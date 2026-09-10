# Production Security Hardening — per-item verdicts — 2026-09-08

Proposal only. **No grant in this document has been changed.** It exists so the
43 assertions returned by `supabase/tests/production_security_hardening.sql` can
be decided item by item instead of blanket-revoked.

Every claim below was checked read-only against production
(`zvxdgdkukjrrwamdpqrg`) on 2026-09-08, not inferred from the replay.

## The headline finding: the assertion list is not a production defect list

The 43 rows come from the CI replay — a zero-state rebuild of the repository.
Production is a different database. Comparing them directly:

| class | rows in replay | what production actually shows |
| --- | ---: | --- |
| `rls_definer_dependency_missing_execute` | 8 | **0 real.** 5 of the 8 exist in production and already hold `authenticated` EXECUTE; the other 3 do not exist in production at all |
| `authenticated_definer_execute` | 16 | 6 of the 24 functions across all classes **do not exist in production** |
| `anon_definer_execute` | 3 | 19 in production — but see below, 14 are trigger functions |
| `net` / `pg_net_browser_execute` | 13 | **13 real, and this is the one that matters** |
| `marketplace_public_listings_v1` | 2 | real, but the assertion's expectation is now wrong — see below |
| `mutable_search_path` | 1 | production already sets `search_path=public`; the assertion wants `pg_catalog, public` |

Functions asserted against that **do not exist in production**:
`public.clinical_evidence_record_is_eligible`, `api.set_market_access_auto_apply`,
`api.set_country_auto_freeze`, `public.education_can_manage`,
`public.education_has_review_role`, `public.harbourview_is_admin_or_operator`.

So a large share of the 43 is repo-state, fixable in migrations with **zero
production effect**. Treating all 43 as a production security backlog would be
wrong, and blanket-revoking would break live features for no security gain.

---

## 1. `pg_net` browser execution — the only genuinely exploitable item

**Verdict: revoke. Highest priority. True on both sides.**

Production grants **both `anon` and `authenticated` USAGE on schema `net`**, and
**12 `pg_net` functions are executable by browser roles** — including
`net.http_post`, `net.http_get` and `net.http_delete`.

Anyone holding the publishable/anon key — which ships in the browser bundle by
definition — can make the database issue arbitrary outbound HTTP requests. That
is server-side request forgery with the database as the origin, reachable by an
unauthenticated visitor. It is not mitigated by RLS, because it is not a table read.

```sql
revoke usage on schema net from anon, authenticated;
revoke execute on all functions in schema net from anon, authenticated;
```

**Blast radius: none expected.** `pg_net` is called by cron jobs and edge
functions, which run as `postgres` / `service_role` and are unaffected. No
browser-role code path in the repository calls `net.*`.

This is the single item worth doing on its own, ahead of everything else here.

---

## 2. `anon` EXECUTE on SECURITY DEFINER routines — 19 in production, but only 5 matter

The raw count of 19 overstates the exposure. **14 are `RETURNS trigger`
functions** (`clinical_calculation_*`, `clinical_consent_after_insert`,
`clinical_prescription_*`, `clinical_set_updated_at`, and the rest of the
`clinical_*` trigger estate). A `RETURNS trigger` function cannot be invoked as a
PostgREST RPC, so the EXECUTE grant on it is untidy rather than reachable.
Revoking them is safe and worth doing for hygiene, but it is not urgent and it is
not a vulnerability.

The five **directly invocable** by `anon` are:

| function | verdict | reasoning |
| --- | --- | --- |
| `api.request_signal_analysis` | **revoke — investigate first** | Volatile, no caller-identity check. An anonymous visitor can trigger signal analysis. This is the most abusable of the five (cost and queue amplification). Confirm no public page depends on it before revoking. |
| `api.get_recently_analyzed_signals` | **revoke** | Volatile, no caller-identity check, no repository caller found. |
| `api.resolve_verified_market_access_evidence` | **revoke** | Read-only and harmless — it reads only `regulatory_market_access_evidence`, which `anon` can already `SELECT` directly — but nothing calls it. Revoking costs nothing. The globe reads `api.countries`, not this. |
| `public.is_service_role_or_signal_analyst` | **revoke** | Read-only predicate, not referenced by any RLS policy in production. |
| `public.increment_talent_view_count` | **do NOT revoke naively** | See below. |

### `increment_talent_view_count` — the one that breaks if you get it wrong

It is called at `lib/server/talentQuery.ts:139` through a server client that runs
as `anon` on public job pages. Revoking `anon` EXECUTE silently stops the view
counter — the call is wrapped in `try/catch` with an ignore comment, so it fails
invisibly rather than erroring.

Sequence that works:
1. Change `incrementTalentViewCount` to use the service-role client.
2. Deploy and confirm the counter still moves.
3. **Then** revoke `anon` (and `authenticated`) EXECUTE.

Doing step 3 first produces a silent regression with no error anywhere.

---

## 3. `authenticated` EXECUTE — allowlist, do not revoke

Six of these are live-called from application code and every one of them does its
own authorization internally (`auth.uid()` / `auth.jwt()` plus an explicit
`raise exception` on failure):

| function | called from | internal authz | verdict |
| --- | --- | --- | --- |
| `api.hv_network_create_mission` | app RPC | yes — reads caller identity, raises | **allowlist** |
| `api.hv_network_request_introduction` | app RPC | yes — reads caller identity, raises | **allowlist** |
| `public.hv_network_advance_introduction` | app RPC | yes — reads caller identity, raises | **allowlist** |
| `public.clinical_evidence_corpus_metrics` | app RPC | yes — reads caller identity, raises | **allowlist** |
| `public.clinical_jurisdiction_supply_outlook` | app RPC | raises on unauthorized | **allowlist** |
| `public.clinical_cross_border_formulary_check` | app RPC | raises on unauthorized | **allowlist** |

These are exactly the shape the allowlist already exists for — the existing
entries (`hv_is_org_member`, `is_harbourview_admin`, …) are the same pattern.
Revoking them breaks Network and Clinical features for signed-in users.

`public.increment_talent_application_count` and
`public.clinical_reviewer_credential_is_valid` have **no repository callers** and
**no internal authz check** — those two are safe to revoke.

`api.briefing_text_for_iso` is read-only with no caller-identity check and no
repository caller: **revoke**.

---

## 4. `rls_definer_dependency_missing_execute` — repo-only, fix forward

All 8 are replay artifacts. In production, the 5 that exist
(`clinical_has_active_consent`, `hv_has_transaction_role`,
`hv_is_specific_transaction_party`, `hv_is_transaction_participant`,
`is_verified_clinician`) **already hold `authenticated` EXECUTE** and are
correctly wired to their RLS policies. The remaining 3 do not exist in production.

Fix by adding the missing `grant execute` statements to the repository migrations
so a zero-state replay matches production, and adding the five `public.*`
signatures to the assertion allowlist. **No production change.**

Note the interaction: granting these to satisfy the RLS assertion will then trip
the `authenticated_definer_execute` assertion unless the allowlist is extended in
the same change. The two edits must land together.

---

## 5. `marketplace_public_listings_v1` — do not satisfy this assertion as written

The assertion expects `anon`, `authenticated` and `service_role` all to hold
SELECT. Production grants **service_role only**, and the view is
**`security_invoker = false`**.

Granting `anon` SELECT while `security_invoker` is false would let anonymous
callers read the underlying tables **with the view owner's privileges, bypassing
RLS**. Satisfying this assertion the obvious way creates a vulnerability.

Two defensible options:

- **(a) Preferred — narrow the assertion.** `api.marketplace_public_listings_v1`
  is the real public surface and is what the application reads (fixed in #1773).
  The `public.*` view is an internal/service-role projection. Remove it from the
  assertion's `public_views` list and keep it in `hardened_views`.
- **(b) If it must stay public**, set `security_invoker = true` **first**, verify
  RLS still filters correctly, and only then grant SELECT.

Recommend (a). It matches how the application actually works.

---

## 6. `mutable_search_path` on `hv_truncate_at_word_boundary`

**Verdict: repo-only, trivial.** Production already sets `search_path=public`;
the assertion wants exactly `pg_catalog, public`. Production's value is
marginally weaker (no explicit `pg_catalog`) but functionally fine. Align the
repository migration to the asserted value and apply it with the next batch.

---

## Suggested sequencing

1. **`pg_net` revoke** — its own small PR and production apply. Real, exploitable, no blast radius.
2. **Repo-only alignment** — RLS grants + allowlist additions + `search_path`. Green replay, zero production effect.
3. **Assertion correction** for `marketplace_public_listings_v1` (option (a)).
4. **`talentQuery.ts` → service role**, deploy, verify counter, then revoke the remaining `anon` grants.
5. **Trigger-function hygiene revokes** — last, lowest value.

Steps 1–3 get the check materially closer to green without touching anything a
user can reach. Step 4 is the only one carrying live-behaviour risk, and it is
sequenced so the risk is a deploy-and-verify rather than a silent break.

## What this document does not do

It changes no grant, applies no migration, and authorises nothing. Each numbered
section needs an explicit decision before any of it is implemented.
