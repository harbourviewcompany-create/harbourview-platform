# Surgical patch: CommandCentre.tsx Clinical embed + briefing modules

Apply on `main` after merging `ClinicalCommandCase.tsx`. **Do not** replace the monolith with stub page modules.

## 1. Import (after ClinicalEvidenceCommandPage import)

```ts
import ClinicalCommandCase from './ClinicalCommandCase'
```

## 2. Replace clinical case (~line 11209)

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

Add to **Doctor**, **Pharmacist**, and **Clinic Op.** arrays (after Access Pathway):

```ts
{ page: 'clinical', icon: '⚕', label: 'Clinical', why: 'Governed evidence, authority, and prescriber workspace' },
```

Pharmacist may use: `'Governed evidence, product, and safety workspace'`.

## Why surgical

PR #1585 attempted a full modular extract that left page bodies as stubs. That must not merge to `main`. This doc + `ClinicalCommandCase` are the production-safe path.
