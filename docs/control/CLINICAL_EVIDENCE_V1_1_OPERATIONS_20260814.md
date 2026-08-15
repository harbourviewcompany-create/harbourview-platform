# Clinical Evidence V1.1 — Governed Evidence Operations

Date: 2026-08-14
Status: repository implementation and isolated verification only
Production migration applied: **No**
Merge/deploy authorized: **No**

## Purpose

V1.1 turns the existing Clinical Evidence V1 storage/governance foundation into a private evidence-operations workflow. It does not expand public Clinical conclusions merely because a source was identified.

The operational sequence is:

1. source intake;
2. immutable source snapshot capture;
3. structured population / intervention-or-exposure / comparator / outcome / study-design / effect / uncertainty / limitations extraction;
4. provenance review;
5. credential-bound qualified clinical/methodology review when required;
6. reproducible grading-domain assessment when a grade is proposed;
7. contradiction / partial-supersession resolution;
8. controlled publication or supersession;
9. corpus freshness review and immutable publication history.

## Authorization boundary

`/clinical/review` is private and authenticated. Access is limited to Harbourview admin/operator/analyst roles or a user with a verified, currently valid Clinical reviewer credential. Credential verification and publication-state actions are further restricted to admin/operator. Qualified clinical/methodology review must use a verified credential owned by the authenticated reviewer; database triggers remain the final publication/grading enforcement layer.

The workbench uses the server-only service client only after the reviewer guard has succeeded. It does not expose service-role credentials to the browser.

## Private/public boundary

Private operational data includes source registry details, immutable snapshots, extraction payloads, reviewer credentials, review decisions, grade-domain assessments, conflicts, intake states, operation events and publication-version history.

V1.1 creates no anonymous grant on the intake queue or operations audit trail. The new API queue views are security-invoker views with anonymous access revoked. Public Clinical evidence remains governed by the pre-existing published-only projection.

## Snapshot and hashing contract

Two hash scopes remain explicit:

- `source-bytes`: SHA-256 must be calculated over the exact archived source bytes; byte size is mandatory and a private storage path may be recorded.
- `normalized-reviewed-extract`: SHA-256 is calculated server-side over the canonical reviewed extract payload; locator metadata must identify where the extract came from.

A normalized-extract hash must never be represented as a source-file hash.

No new source-byte hash is asserted in this V1.1 corpus expansion. The execution environment did not provide a deterministic byte acquisition path for the authoritative documents during this pass, so no byte hash was fabricated. The existing SATIVEX snapshot remains explicitly `normalized-reviewed-extract` until authoritative bytes are acquired and archived separately.

## Corpus coverage ledger

### Published source-metadata condition relationships retained from V1

| Condition | Intervention/product | Source state | Public state | Grade |
|---|---|---|---|---|
| Lennox-Gastaut syndrome | EPIDIOLEX / cannabidiol | current Canadian product-monograph metadata | published | ungraded |
| Dravet syndrome | EPIDIOLEX / cannabidiol | current Canadian product-monograph metadata | published | ungraded |
| Tuberous sclerosis complex | EPIDIOLEX / cannabidiol | current Canadian product-monograph metadata | published | ungraded |
| Multiple-sclerosis spasticity | SATIVEX / THC + CBD | current Canadian 2024-12-17 product-monograph metadata | published | ungraded |

These rows represent authorized-indication/source metadata only. They are not Harbourview efficacy recommendations.

### Existing private synthesis candidates retained from V1

| Source | Intended domain | State | Public conclusion |
|---|---|---|---|
| PMID 36417631 | cannabidiol; LGS / Dravet / TSC | private / under review | none |
| PMID 39502271 | cannabinoids; multiple-sclerosis spasticity | private / under review | none |

### New V1.1 source-identification coverage

| Source | Intended condition/domain coverage | Queue state | Snapshot | Extraction | Qualified review | Public conclusion |
|---|---|---|---|---|---|---|
| PMID 40238954 | chronic pain | snapshot-required | not yet captured | not started | not started | none |
| PMID 38171632 | chronic non-cancer pain | snapshot-required | not yet captured | not started | not started | none |
| PMID 39953210 | chemotherapy-induced nausea/vomiting | snapshot-required | not yet captured | not started | not started | none |
| PMID 38478773 | adult cancer cannabinoid guideline context, including CINV-related review questions | snapshot-required | not yet captured | not started | not started | none |

All four sources are registered only as private evidence candidates. They do not create `clinical_evidence_records`, outcome-direction claims or certainty grades. Missing or unfinished coverage must not be interpreted as evidence of no effect, no risk, no interaction or no recommendation.

## Workbench surfaces

`/clinical/review` provides:

- corpus coverage/freshness metrics;
- evidence intake queue;
- stale/review-required/source-degraded queue;
- reviewer credential state;
- source intake;
- immutable snapshot capture;
- private ungraded evidence-draft creation;
- structured extraction;
- provenance and qualified review;
- reproducible grading-domain assessment;
- contradiction/partial-supersession resolution;
- credential verification for admin/operator;
- publication/unpublication/supersession for admin/operator.

`/clinical/review/source/[sourceId]` provides private side-by-side source inspection: authoritative-source link and immutable snapshot/extract on the left; structured extraction on the right; linked evidence records, reviews, conflicts and immutable publication history below.

## Audit contract

`clinical_evidence_operation_events` is append-only and records evidence-operations mutations separately from immutable public-projection publication versions. Update/delete is rejected by trigger.

Publication itself continues to be captured by `clinical_evidence_publication_versions`; V1.1 does not replace or weaken that history.

## Remaining evidence gaps

- The newly identified systematic-review/guideline sources still need authoritative snapshot acquisition, structured extraction and provenance review.
- Any clinical-synthesis publication or certainty grade still needs an actual verified/current credential-bound qualified reviewer.
- No new source-byte archives were acquired in this pass.
- Canadian condition coverage is not comprehensive and must not be presented as comprehensive.
- Medication/cannabinoid interaction evidence is not yet operationalized.
- Province/territory × profession authorization evidence is not yet operationalized.
- Patient monitoring/follow-up and pharmacovigilance workflows remain separate future work.
- No negative clinical finding may be inferred from an empty queue, absent condition or incomplete corpus.

## Verification requirements

The V1.1 exact-head gate must prove:

- focused Clinical governance tests pass;
- TypeScript passes;
- all six Clinical migrations replay from zero in isolated Supabase;
- the four V1.1 source candidates exist only in the private source/intake layer;
- anonymous reads of intake/audit/snapshot/credential private tables return no private data;
- operation events are immutable;
- the exact head builds as a production Next.js build;
- an isolated authenticated admin reviewer can open the workbench and side-by-side source-inspection route in Chromium;
- screenshot artifacts are uploaded for reviewer-workflow inspection.
