# Surgical patch: CommandCentre.tsx Clinical embed + briefing modules

Apply on branch `fix/clinical-desktop-workspace-embed` (full ~650KB file may need local apply).

## 1. Imports

After existing clinical imports, add:

```ts
import ClinicalCommandCase from './ClinicalCommandCase'
```

Keep `ClinicalEvidenceCommandPage` import so dual-surface summary remains available.

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

Add to **Doctor** (after Access Pathway):

```ts
    { page: 'clinical',       icon: '⚕', label: 'Clinical',           why: 'Governed evidence, authority, and prescriber workspace' },
```

Add to **Pharmacist** (after Access Pathway):

```ts
    { page: 'clinical',       icon: '⚕', label: 'Clinical',           why: 'Governed evidence, product, and safety workspace' },
```

Add to **Clinic Op.** (after Access Pathway):

```ts
    { page: 'clinical',       icon: '⚕', label: 'Clinical',           why: 'Governed evidence, authority, and prescriber workspace' },
```
