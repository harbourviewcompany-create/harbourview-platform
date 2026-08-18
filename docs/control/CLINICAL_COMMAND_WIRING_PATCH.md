# CommandCentre wiring patch (apply manually or as follow-up commit)

This PR adds the Clinical Evidence Command system. The following wiring is still required inside existing files so the section appears in the Command Centre.

## 1. `components/dashboard/CommandCentre.tsx`

### A. Extend the page union
```ts
// before
type CommandPage = 'overview' | 'market' | ... 

// after — add:
| 'clinical'
```

### B. Add nav item
```ts
// In NAV_ITEMS_FLAT or equivalent sidebar list
{ id: 'clinical', label: 'Clinical', icon: '⚕' }
```

### C. Page switch
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

Import:
```ts
import ClinicalPage from '@/components/dashboard/ClinicalPage'
```

## 2. `app/dashboard/page.tsx` (or data loader)

```ts
import { loadClinicalPageData } from '@/lib/clinical/clinicalQuery'

// inside loader / server component
const clinicalData = await loadClinicalPageData(countryIso2, roleLabel)
```

Pass `clinicalData` into the shell / CommandCentre props.

## 3. Mobile nav

```ts
{ id: 'clinical', label: 'Clinical', icon: '⚕' }
```

And the corresponding `case 'clinical'` branch if using a switch.

## 4. `VALID_COMMAND_PAGES`

Ensure `'clinical'` is included (doc already notes this may be done on `feat/clinical-command-centre`).

---

After wiring, switch country to Brazil and confirm:
- Empty evidence state is clean
- Search for "pain" or "epilepsy" returns graded records
- Jurisdiction briefing + professional pathway render
- No concatenated status strings
