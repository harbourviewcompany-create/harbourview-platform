# Surgical patch: CommandCentre.tsx Clinical embed + briefing modules

**Status (2026-09-15):** `ClinicalCommandCase.tsx` is on `main`. Desktop switch still renders `ClinicalEvidenceCommandPage` (summary). Apply this surgical patch on current `main` — **do not** replace the monolith with stub page modules (PR #1585 lesson).

Branch for this reopen: `fix/cc-clinical-embed-surgical-20260915`.

## Why surgical only

- Live `CommandCentre.tsx` is a large monolith (~650KB+). Full modular extracts that leave page bodies as stubs break production desktop.
- Mobile already embeds `ClinicalWorkspacePage` via `ClinicalSection`.
- Desktop must call the same workspace through `ClinicalCommandCase` without deleting existing page implementations.

## 1. Import

After the `ClinicalEvidenceCommandPage` import:

```ts
import ClinicalCommandCase from './ClinicalCommandCase'
```

Prefer a static import (component is small). Dynamic is acceptable if consistent with neighbouring clinical imports:

```ts
const ClinicalCommandCase = dynamic(() => import('./ClinicalCommandCase'))
```

## 2. Replace clinical case

**Before:**

```tsx
case 'clinical':
  return <ClinicalEvidenceCommandPage countryLabel={country.label} countryIso2={country.iso2} roleLabel={roleLabel} />
```

**After:**

```tsx
case 'clinical':
  return <ClinicalCommandCase countryIso2={country.iso2} roleLabel={roleLabel} />
```

`ClinicalWorkspacePage` is already an in-shell surface (no standalone chrome). No `embedded` prop is required on current main.

## 3. BRIEFING_ROLE_MODULES

Add to **Doctor**, **Pharmacist**, and **Clinic Op.** arrays (after Access Pathway if present):

```ts
{ page: 'clinical', icon: '⚕', label: 'Clinical', why: 'Governed evidence, authority, and prescriber workspace' },
```

Pharmacist may use: `'Governed evidence, product, and safety workspace'`.

## Verify

```bash
npm run typecheck && npm run build
# optional
npx vitest run tests/clinical/prescriberOSReconciliation.test.ts
```

Manual: `/dashboard?page=clinical&country=CA` should show full workspace (jurisdiction-gated), not only the evidence summary card.

## Explicit non-goals

- No modular stub split of CommandCentre pages
- No `clinical_jurisdiction_authority` seeding in this pass
- No AU/GB/BR pilot migration apply without owner gate
