# Clinical Command Centre wiring

**Component:** `components/dashboard/ClinicalPanel.tsx`  
**Page key:** `clinical` (recommended)

## Desktop (`CommandCentre.tsx`)

1. Import: `import { ClinicalPanel } from '@/components/dashboard/ClinicalPanel'`
2. Add nav item label **Clinical** with `page` / key `clinical` at **top level** (peer to Briefing, Marketplace, etc.).
3. In the main content switch/render map:

```tsx
{activePage === 'clinical' && <ClinicalPanel />}
```

## Mobile (`MobileCommandCentre.tsx`)

Mirror the same `clinical` key and render `<ClinicalPanel />` for parity.

## Dashboard URL

Support `?page=clinical` if other panels use query-driven selection.

## Why not auto-patched in this PR

`CommandCentre.tsx` is a very large monolith. Surgical nav insertion is safer as an explicit follow-up once the clinical migrations are applied and CI is green on the API layer — avoids merge conflicts with concurrent Command Centre PRs.

## API surface used by the panel

| Method | Path |
|--------|------|
| GET | `/api/clinical/me` |
| POST | `/api/clinical/verification/request` |
| GET/POST | `/api/clinical/patients` |
| POST | `/api/clinical/patients/[id]/consent` |
| POST | `/api/clinical/calculations` |
| POST | `/api/clinical/recommendations` |
| GET/POST | `/api/clinical/prescriptions` |

All require authenticated session; mutating clinical data requires `is_verified_clinician`.
