# Clinical Command Centre section

**Status:** In progress (branch `feat/clinical-command-centre`)  
**Date:** 2026-07-27

## Intent

Clinical is a **top-level Command Centre section** (desktop + mobile), not a sub-tab under Education. It surfaces professional-only clinical education modules and country readiness for regulated medical cannabis markets.

## Data sources

| Surface | Source |
|---|---|
| Modules | `clinical_education_modules` via `getClinicalEducationModules()` (`lib/server/clinicalEducationQuery.ts`) with fixture fallback in `lib/fixtures/clinical-education.ts` |
| Country readiness | `clinical_education_country_readiness` via `getClinicalEducationCountryReadiness()` |
| Request CTA | `/network/clinical-education/request` |

## Nav wiring checklist

1. **`CommandPage` union** in `components/dashboard/CommandCentre.tsx` — add `'clinical'`.
2. **`NAV_ITEMS_FLAT` / sidebar** in the same file — add Clinical entry (icon suggestion: `⚕` or `◇`).
3. **Page switch** — render `<ClinicalPage … />` when `page === 'clinical'`.
4. **`VALID_COMMAND_PAGES`** in `app/dashboard/page.tsx` — include `'clinical'` (done on this branch).
5. **Mobile `MOBILE_NAV`** — add `{ id: 'clinical', label: 'Clinical', icon: '⚕' }` and a `case 'clinical'` branch.
6. **`roleNavPriority.ts`** — map `clinical` nav id to clinical pathway / evidence modules for `medical_clinical` roles (done on this branch).
7. **Dashboard data fetch** — call clinical query helpers in `app/dashboard/page.tsx` and pass props through `DashboardResponsiveShell`.

## Pilot authority rows

If pilot markets need local competent-authority rows for clinical/local-intel cross-links, seed via `local_authorities` (see existing `20260613172541_local_intel_v1_batch1_real_authorities.sql` pattern). Do **not** invent unverified authority names; only seed from documented regulator sources.

## Boundaries (non-negotiable)

- Not medical advice, prescribing advice, or patient-specific guidance.
- High-risk modules stay behind professional-review status until reviewed.
- Public DTOs only — no private review notes on the CC surface.

## Related routes (keep live; do not redirect away without parity)

- `/network/clinical-education`
- `/network/clinical-education/[slug]`
- `/network/clinical-education/request`
