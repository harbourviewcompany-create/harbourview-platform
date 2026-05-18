# Harbourview Full-Scope Launch Gate

Status: HOLD until every launch-critical capability has evidence.
Scope: full Harbourview public, private, admin, education, medical, regulatory, marketplace, intelligence, diligence, legal and operational surface.
Boundary: this document is a launch-control artifact only. It does not narrow scope, create an MVP, remove routes, weaken auth/RLS, or treat public orientation copy as operational proof.

## Launch-critical rule

A capability is GO only when all of the following are true:

1. The route/capability exists in `lib/platform/capabilityRegistry.ts`.
2. The content surface exists in `lib/platform/contentInventory.ts` when applicable.
3. The route clearly distinguishes public, private, admin-only, request-only, fallback-backed, draft-orientation and later-enabled capabilities.
4. Public routes do not expose raw source evidence, private provenance, internal review notes, seller authorization status, counterparty identity, admin fields or private intelligence material.
5. Medical, clinical, pharmacy, quality, GMP, GACP, GDP, QP, import/export and country-pathway content includes review/source status and boundary language before reliance.
6. Marketplace categories include private-routing boundaries and do not imply automatic publication, guaranteed availability, introductions, transaction terms or regulatory outcomes.
7. Fallback/static/demo content is labeled as fallback, static orientation or draft orientation where live approved records are absent.
8. Existing admin/operator restrictions remain intact and are not weakened by public-route patches.
9. Package scripts are unique and the full-scope aggregator runs without silently skipping required checks.
10. CI or manual verification evidence is attached before launch GO.

## Required full-scope control files

- `lib/platform/capabilityRegistry.ts` — route/capability registry with status, visibility, criticality, false-GO risk and acceptance tests.
- `lib/platform/contentInventory.ts` — content inventory with pillar, sensitivity, review/source basis and related capability IDs.
- `lib/platform/contentStatus.ts` — shared public/private/fallback/status vocabulary.
- `lib/marketplace/categoryCapabilityMap.ts` — marketplace category capability and boundary map.
- `lib/fixtures/clinical-education.ts` — clinical education metadata, source basis, reviewer requirements and medical-advice boundaries.
- `lib/compliance/countries.ts` — country-pathway status labels, confidence, review status and source-basis fields.
- `docs/control/FULL_SCOPE_LAUNCH_GATE.md` — launch-readiness control document.

## Required verification commands

```bash
npm run test:full-scope-launch-readiness
npm run test:visibility
npm run test:services-public-leakage
npm run test:signals-public-leakage:direct
npm run test:compliance-visibility
npm run test:clinical-education
npm run test:admin-guard
npm run typecheck
npm run build
```

## Full-scope capability checklist

| Area | Required before launch GO | Status |
| --- | --- | --- |
| Public route/capability registry | Every launch-critical route group must have visibility, criticality, status, false-GO risk and acceptance tests. | HOLD until aggregator passes. |
| Content inventory | Education, medical, regulatory, marketplace, intelligence, trust, legal and admin surfaces must be inventoried. | HOLD until aggregator passes. |
| Clinical/medical education | Public-use approval, source basis, reviewer role, medical-advice boundary and review dates must be present for every module. | HOLD until clinical metadata test passes. |
| Compliance countries | Public status, review status, source confidence, source basis, last review and next review fields must be present for every country page. | HOLD until compliance label test passes. |
| Marketplace categories | Each category must identify live data expectation, private boundary, related capabilities and acceptance tests. | HOLD until marketplace capability test passes. |
| Services fallback/live indicators | Services route must disclose approved-live versus fallback-orientation feed status. | HOLD until fallback indicator test passes. |
| Signals fallback/live indicators | Signals route must disclose approved-live versus fallback-orientation feed status and suppress private evidence. | HOLD until fallback and signal-leakage tests pass. |
| Admin/private boundary | Admin remains admin/operator-only; no patch can expose private review material to public pages. | HOLD until admin guard and visibility tests pass. |
| Scripts | `package.json` script names must be unique and include the full-scope launch-readiness aggregator. | HOLD until script uniqueness test passes. |

## False-GO conditions

Launch remains HOLD if any of the following are true:

- Any launch-critical capability is missing from the capability registry.
- Any launch-critical public content surface lacks review/source status where medical, clinical, regulatory, compliance, intelligence, marketplace or trust claims are present.
- Static, fallback or draft content is shown without visible status labeling on patched routes.
- A public route exposes private source/provenance/evidence/admin/review/counterparty fields.
- Medical education implies prescribing advice, patient-specific guidance, treatment direction, efficacy claims or accredited continuing education without explicit approved evidence.
- Compliance country pages imply legal advice, regulator guidance, import/export clearance, license status, QP readiness, shipment clearance or commercial viability.
- Marketplace pages imply guaranteed availability, automatic introduction, automatic publication, public dealroom access, verified seller authorization or transaction terms.
- Admin route protection, Supabase/RLS boundaries or service-role-only expectations are weakened.
- The full-scope test aggregator fails or is not run.

## Launch-readiness verdict

Current verdict: HOLD.

Reason: this patch adds the required control layer, metadata and tests, but launch GO still requires passing CI/build/typecheck and runtime/public leakage evidence after the PR is created and verified.
