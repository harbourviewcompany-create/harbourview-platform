# Clinical Command — Integration Guide

How to wire the rebuilt Clinical system into `harbourview-platform`.

## 1. File placement

```
components/dashboard/
  ClinicalPage.tsx          ← from components/ClinicalPage.tsx
  ClinicalEvidenceCommand.tsx  ← optional lighter variant

lib/clinical/
  types.ts                  ← from lib/types.ts
  clinicalQuery.ts          ← from lib/clinicalQuery.ts

lib/fixtures/clinical/
  evidence.ts               ← from fixtures/evidence.ts
  jurisdictions.ts          ← from fixtures/jurisdictions.ts
```

Adjust import paths to match the existing `@/` alias.

## 2. CommandCentre wiring (from CLINICAL_COMMAND_CENTRE.md)

1. Add `'clinical'` to the `CommandPage` union in `CommandCentre.tsx`.
2. Add Clinical to `NAV_ITEMS_FLAT` / sidebar (icon `⚕` or `◇`).
3. In the page switch:
   ```tsx
   {page === 'clinical' && (
     <ClinicalPage
       iso2={activeCountryIso2}
       countryName={activeCountryName}
       flag={activeFlag}
       roleLabel={activeRoleLabel}
       briefing={clinicalData.briefing}
       pathway={clinicalData.pathway}
       initialEvidence={clinicalData.evidence}
       whatChanged={clinicalData.whatChanged}
       attention={clinicalData.attention}
       nextActions={clinicalData.nextActions}
     />
   )}
   ```
4. Ensure `VALID_COMMAND_PAGES` in `app/dashboard/page.tsx` includes `'clinical'`.
5. Mobile nav: add `{ id: 'clinical', label: 'Clinical', icon: '⚕' }`.

## 3. Data loading (app/dashboard/page.tsx or equivalent)

```ts
import { loadClinicalPageData } from '@/lib/clinical/clinicalQuery';

// inside the server component / loader
const clinicalData = await loadClinicalPageData(countryIso2, roleLabel);
```

Pass `clinicalData` through `DashboardResponsiveShell` or directly as props.

## 4. Boundaries (already enforced in copy + types)

- Not medical advice / not patient-specific guidance
- Evidence stays distinct from product marketing and genetics
- Always surface “verify against primary authority”
- Public DTOs only — no private review notes on the CC surface

## 5. Expanding evidence & countries

- Add new `EvidenceRecord` objects to `fixtures/evidence.ts` (or migrate to Supabase table `clinical_evidence_records`).
- Add new entries to `JURISDICTION_BRIEFINGS` and `PROFESSIONAL_PATHWAYS` for additional ISO2 codes.
- Prefer primary-source review dates; never invent authority names.

## 6. Next production steps after this lands

1. Replace fixture search with a real Supabase / search index query.
2. Add graded evidence review workflow (admin-only) so new records go through professional review before public surface.
3. Wire “Open primary source” and “Jurisdiction command” to existing jurisdiction deep-links.
4. Expand formulary layer (authorised products per country) as a sibling data model.
