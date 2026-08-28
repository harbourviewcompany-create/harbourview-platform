# Command Centre modular layout

- `../CommandCentre.tsx` — thin re-export (types + default `CommandCentreRoot`)
- `types.ts` — `CommandPage` / `MarketView` / `MarketRow` / marketplace row types
- `navConfig.ts` — `NAV_SECTIONS` + `BRIEFING_ROLE_MODULES` (includes **clinical** for Doctor / Pharmacist / Clinic Op.)
- `sharedHelpers.tsx` — cross-page helpers (`deriveSignalGroup`, `CustomSelect`, `fmtStatus`, authorities/municipal builders, `COMPLIANCE_ROLE_FOCUS`)
- `CommandCentreRoot.tsx` — shell, state, page switcher (`case 'clinical'` → `ClinicalCommandCase`)
- `pages/*.tsx` — individual page modules (lean functional restores; full UI can expand size-safely)
- `pages/bundleA|B|C.tsx` — re-export barrels for Root imports

## Clinical desktop path

Desktop clinical tab embeds the same `ClinicalWorkspacePage` as mobile via:

`CommandCentreRoot` → `ClinicalCommandCase` → `ClinicalWorkspacePage({ embedded: true })`

Authority seeding and AU/GB/BR pilot migrations remain deferred (see `docs/control/CLINICAL_*_DEFER.md`).

## Size policy

GitHub push limits drove the monolith → modular split. Prefer one page file per commit when expanding UI beyond the lean shells.
