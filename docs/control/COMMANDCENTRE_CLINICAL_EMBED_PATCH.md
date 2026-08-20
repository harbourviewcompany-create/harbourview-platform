# Surgical patch: CommandCentre.tsx Clinical embed + briefing modules

Apply on branch `fix/clinical-desktop-workspace-embed` if the full file push is unavailable.

## 1. Imports (after ClinicalEvidenceCommandPage import)

```ts
import ClinicalCommandCase from './ClinicalCommandCase'
```

(Optional: keep `ClinicalEvidenceCommandPage` import for dual-surface retention.)

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

## 3. BRIEFING_ROLE_MODULES

Add to **Doctor**, **Pharmacist**, and **Clinic Op.** arrays (after Access Pathway where present):

```ts
{ page: 'clinical', icon: '⚕', label: 'Clinical', why: 'Governed evidence, authority, and prescriber workspace' },
```

(Pharmacist why may use: `'Governed evidence, product, and safety workspace'`.)

## Modular layout (current branch)

- `CommandCentre.tsx` — thin re-export
- `command-centre/CommandCentreRoot.tsx` — shell + clinical case
- `command-centre/pages/*` — page modules (stubs until full bodies restored under size limits)
- `ClinicalCommandCase.tsx` — desktop embed of `ClinicalWorkspacePage`
