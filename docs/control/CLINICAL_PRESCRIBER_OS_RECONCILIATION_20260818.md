# Clinical Prescriber OS reconciliation — 2026-08-18

Base observed at implementation start: `065189003e1feba9856c543943186be84e5cbe83`.

Current main discovered during draft verification: `93d6f78dc738cea3c72add8b4586942e91e2df93`.

The intervening main history adds the Clinical SKU feed/jurisdiction/admin-audit layer, including `clinical_formulary_skus`, `clinical_jurisdiction_profiles`, feed runners, formulary SKU querying, the jurisdiction API and admin review/audit support.

Reconciliation contract:

- Preserve the newer main-side SKU/feed/jurisdiction/admin-audit implementation.
- Preserve the Prescriber OS governed evidence, patient, consent, professional-verification and RLS contracts.
- Resolve the overlapping `ClinicalEvidenceCommandPage.tsx` in favor of the Prescriber OS workspace, then wire it to the newer SKU and DB-backed jurisdiction APIs.
- Exact SKU rows and class/pathway records remain distinct. Generic authority homepages and class snapshots are not sufficient record-level provenance for a prescriber-ready product/regimen decision.
- No production migration, merge or deployment is authorized by this reconciliation.
