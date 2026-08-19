# Clinical Publication Gate — Control Document

**Status:** Repository change. **No migration applied, no credential created, no record published.**
**Verified live (read-only):** project `zvxdgdkukjrrwamdpqrg`, 2026-08-19.
**Supersedes nothing.** Complements `CLINICAL_EVIDENCE_V1_PRODUCTION_FOUNDATION_20260814.md`.

---

## 1. Diagnosis

The clinical evidence corpus is written and invisible. As of 2026-08-19:

| | Live |
|---|---|
| `clinical_evidence_records` total | 23 |
| — with a condition label | 20 |
| — `review_status = 'published'` | **3** (the original Canadian regulatory documents, no condition) |
| — `review_status = 'under-review'` | **20** (every condition-level record) |
| `clinical_reviewer_credentials` | **0** |
| `clinical_grade_assessments` | **0** |
| `clinical_evidence_snapshots` | **0** |
| `clinical_outcome_evidence` | **0** |
| `clinical_condition_terms` | **0** |

`search_clinical_evidence_records` filters `review_status = 'published'`, so the corpus is
unreachable from the product. Verified directly:

```sql
select count(*) from search_clinical_evidence_records('Dravet syndrome','CA',20);
-- 0
```

### 1.1 The gate is correct; the path to satisfying it did not exist

`trg_clinical_require_publication_review` on `clinical_evidence_records` requires, for any record
becoming `published`:

1. an approved `provenance` review, **always**; and
2. an approved `clinical` review by a `clinician`/`pharmacist` with a valid credential, whenever
   `publication_scope = 'clinical-synthesis'` **or** `evidence_strength` is graded
   (`high` / `moderate` / `low` / `very-low` / `conflicted`).

All 20 under-review records carry a graded certainty, so condition (2) applies to every one of
them. A read-only simulation of the trigger's own predicates across all 20 records:

| Predicate | Records |
|---|---|
| Under review | 20 |
| Has approved provenance review | 0 |
| Requires credentialed clinical review | 20 |
| Has valid credentialed clinical review | 0 |
| **Would publish successfully** | **0** |

The admin console at `/admin/clinical-review` writes through the service-role client, which
bypasses RLS but **not triggers** — so it cannot route around this, and correctly should not.

### 1.2 Missing application surface

Before this change there was **no application path to any of the three gates**:

| Route | Calls | In production |
|---|---|---|
| `/api/clinical/verification/request` | `clinical_request_verification` | **absent** |
| `/api/clinical/admin/verify` | `clinical_admin_verify_professional` | **absent** |

Both are the same code-shipped-schema-didn't pattern recorded in `AGENT_OPERATING_FACTS.md`.
Neither writes to `clinical_reviewer_credentials` in any case — they address a separate
professional-verification concept. The admin review console only flips `review_status`; it never
creates reviews or credentials.

That left raw SQL against production as the only way to create the credential the entire corpus is
gated behind — the wrong instrument for a record whose sole purpose is to be auditable.

### 1.3 Ordering correction

An earlier session note suggested pre-populating GRADE assessments so a reviewer would "have
something to review". **That is structurally impossible.** `clinical_grade_assessments.review_id`
is `NOT NULL` and references `clinical_evidence_reviews`, so an assessment cannot exist before the
review it belongs to. The assessment is the reviewer's recorded reasoning, produced *with* the
review — not preparation handed to them. The surface added here reflects that ordering.

---

## 2. Integrity gaps closed by this change

`20260819170000_clinical_reviewer_credential_integrity.sql`. Both affected tables are empty in
production, so every constraint is added without backfill and cannot fail against existing rows.

| Gap | Constraint added |
|---|---|
| `user_id` had no FK — any UUID accepted, including one belonging to no account | `clinical_reviewer_credentials_user_id_fkey` → `auth.users` |
| `verified_by_user_id` had no FK | `clinical_reviewer_credentials_verified_by_fkey` → `auth.users` |
| A credential could be `verified` with no record of who checked the register | `clinical_reviewer_credential_verifier_recorded` |
| An admin could verify their own credential (write policy is the same role) | `clinical_reviewer_credential_no_self_verification` |
| `valid_from` could postdate `valid_until` | `clinical_reviewer_credential_validity_window` |
| Every GRADE domain was unconstrained text — `"very serious"` would persist silently | `clinical_grade_assessments_downgrade_domains_check` |
| Publication bias could borrow the serious/very-serious scale it does not use | `clinical_grade_assessments_publication_bias_check` |
| Starting and final certainty unconstrained | two certainty CHECKs |

The migration **relaxes no existing gate**. It only makes the gate harder to bypass.

### 2.1 Migration verification

Applied against a scratch PostgreSQL 16 cluster loaded with a production-shaped fixture
(constraints and triggers reproduced from the live schema), then exercised — **never against
production**:

| Case | Expected | Result |
|---|---|---|
| Credential for a `user_id` that is not an account | reject | FK violation |
| `verified` with no `verified_by_user_id` | reject | `..._verifier_recorded` |
| Self-verification | reject | `..._no_self_verification` |
| `valid_from` after `valid_until` | reject | `..._validity_window` |
| Verified by a second admin | accept | inserted |
| GRADE domain `"very serious"` (space, not hyphen) | reject | `..._downgrade_domains_check` |
| `publication_bias = 'very-serious'` | reject | `..._publication_bias_check` |
| Valid GRADE assessment | accept | inserted |

Final state: 1 credential, 1 assessment. Six rejections, two acceptances, as designed.

---

## 3. Application surface added

### `POST /api/clinical/admin/credentials`
Registers a reviewer credential. Admin-guarded, audited to `clinical_admin_audit_log`. Defaults to
`pending`; self-verification is refused with an explanation before the database constraint fires.
`verification_source_url` must be `https://` — the point of the record is that a third party can
re-check the licence against a register.

### `GET /api/clinical/admin/credentials`
Lists credentials with verification state and validity window.

### `POST /api/clinical/admin/evidence-review`
Records a `provenance`, `clinical` or `methodology` review, optionally with the GRADE assessment
that produced its certainty. Audited. **Never publishes** — publication stays with the existing
review console and the trigger remains the authority.

Returns a `readiness` object explaining which gates a record still fails, so a refusal is visible
before anyone attempts publication.

### `GET /api/clinical/admin/evidence-review?evidence_record_id=…`
Lists recorded reviews plus current publication readiness.

### `lib/clinical/reviewGovernance.ts`
Single source for the gate vocabularies, each taken from a live CHECK constraint or trigger
predicate, plus `evaluatePublicationReadiness()` — a pure mirror of the trigger used only to
*explain* a refusal in advance. It never grants publication.

---

## 4. What is still required, and is not a technical task

Provenance review (Gate 1) needs no credential — the credential trigger fires only for `clinical`
and `methodology` review types — so it is unblocked today. Gates 2 and 3 need decisions:

1. **Who is the first reviewer.** A real clinician or pharmacist whose licence resolves on a public
   register. The credential is the thing the entire gate exists to assert.
2. **Which register verifies them, and who performs the check.** That person is now recorded in
   `verified_by_user_id` and cannot be the credential holder.
3. **What the reviewer attests to.** Signing off 20 records means standing behind 20 GRADE
   certainty ratings assigned without them. `clinical_grade_assessments` is empty — the ratings
   currently have no recorded derivation.
4. **Scope of the first release.** All 20, or the four high-certainty regulated-drug indications
   first (Dravet syndrome, Lennox-Gastaut syndrome, treatment-resistant epilepsy,
   chemotherapy-induced nausea and vomiting) where a product monograph carries most of the weight.

**Unresolved and blocking content work:** the sourcing bar for clinical content — primary sources
only (regulator, product monograph, indexed systematic review), or secondary synthesis with
attribution. The schema is built for the former. Raised 2026-08-16, still unanswered.

---

## 5. Boundaries observed

- No migration applied to production. `20260819170000` is repository-only and requires explicit
  sign-off under Rule 3c before application.
- No credential created, no review recorded, no record published.
- No clinical content authored. GRADE assessments are deliberately **not** pre-populated — both
  because the schema forbids it (§1.3) and because authoring clinical certainty ratings is the
  reviewer's act, not the platform's.
- All production access this session was read-only: `information_schema`, `pg_proc`, `pg_constraint`,
  `pg_policy`, `pg_trigger`, row counts, and SELECT-based simulation of trigger predicates.
