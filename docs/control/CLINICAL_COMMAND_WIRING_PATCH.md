# CommandCentre wiring patch — status (reconciled 2026-08-20)

The original patch checklist is **complete on `main`**. Keep this file as a historical map of what was required; do not re-apply blindly.

## Verified on main

### 1. `components/dashboard/CommandCentre.tsx`

- `CommandPage` includes `'clinical'`.
- Nav: `{ id: 'clinical', label: 'Clinical', icon: '⚕' }` under Compliance & Legal.
- Switch:

```tsx
case 'clinical':
  return (
    <ClinicalEvidenceCommandPage
      countryLabel={country.label}
      countryIso2={country.iso2}
      roleLabel={roleLabel}
    />
  )
```

Imports present for `ClinicalPage` (shim) and `ClinicalEvidenceCommandPage`.

### 2. Registry / config

- `config/command-centre-routes.mjs` — module `clinical` → desktop `clinical`, mobile `clinical`, launch-critical.
- `lib/platform/commandCentreRegistry.ts` — `'clinical'` in `SUPPORTED_COMMAND_PAGES` and mobile section map.

### 3. Mobile

- `contracts.ts`: `SectionId` includes `'clinical'`; `SECTION_TO_DESKTOP_PAGE.clinical = 'clinical'`.
- `ClinicalSection.tsx`: jurisdiction required → context gate; else embeds `ClinicalWorkspacePage` with `embedded`.

### 4. Role priority

- `lib/dashboard/roleNavPriority.ts` maps `clinical` to clinical pathway / evidence modules for `medical_clinical` roles.

## Residual work (not wiring)

- Pilot `local_authorities` rows for markets not in batch1 — see `CLINICAL_PILOT_AUTHORITY_INVENTORY.md`. The AU/GB/BR migration that previously backed this line (`20260820120000_clinical_pilot_local_authorities_au_gb_br.sql`) was **withdrawn on 2026-08-22** and is no longer in the tree: production already holds all three countries, and the migration's exact-string guard would have inserted duplicate rows for GB and BR rather than new coverage. See the `HV-MIGRATION-COLLISION-RESOLUTION-20260822` entry in `EVIDENCE_LOG.md` for the verified before/after labels. AU/GB/BR need no authority rows; markets genuinely outside batch1 still do.
- Production application of clinical DDL / seeds remains owner-gated (do not self-apply).
- Formal clinical reviewer appointment remains a publish gate for synthesis content.
