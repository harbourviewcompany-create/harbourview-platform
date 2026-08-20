# Clinical Command Centre section

**Status:** Wired on `main` (desktop + mobile)  
**Last reconciled:** 2026-08-20  
**Related PRs:** #1508 (Evidence Command tab), #1578 / #1581 (embed full workspace in mobile Clinical section)

## Intent

Clinical is a **top-level Command Centre section** (desktop + mobile), not a sub-tab under Education. It surfaces governed clinical evidence / prescriber workspace surfaces for regulated medical cannabis markets.

## Data sources

| Surface | Source |
|---|---|
| Evidence / workspace | `ClinicalEvidenceCommandPage`, `ClinicalWorkspacePage`, `lib/server/clinical*Query.ts` |
| Authority links (UI) | `lib/clinical/authorityRegistry.ts` — links only; no cross-country fallback |
| Professional capability matrix | `clinical_jurisdiction_authority` via `resolveClinicalProfessionalAuthority` |
| Education modules (network) | `clinical_education_modules` via `getClinicalEducationModules()` with fixture fallback |
| Country readiness (education) | `clinical_education_country_readiness` |
| Local-intel cross-links | `local_authorities` (pilot seed; see inventory doc) |
| Request CTA | `/network/clinical-education/request` |

## Nav wiring checklist (reconciled 2026-08-20)

| # | Item | Status |
|---|------|--------|
| 1 | `CommandPage` union includes `'clinical'` | **Done** — `CommandCentre.tsx` |
| 2 | Sidebar / `NAV_SECTIONS` Clinical entry (`⚕`) | **Done** — under Compliance & Legal |
| 3 | Desktop page switch renders Clinical surface | **Done** — `case 'clinical':` → `ClinicalEvidenceCommandPage` |
| 4 | Registry / supported pages include `'clinical'` | **Done** — `commandCentreRegistry.ts`, `config/command-centre-routes.mjs` |
| 5 | Mobile section id + nav | **Done** — `SectionId` + `SECTION_NAV_BY_ID.clinical`; groups under overview |
| 6 | Mobile section body | **Done** — `ClinicalSection` embeds `ClinicalWorkspacePage` when jurisdiction set; else jurisdiction-required |
| 7 | `roleNavPriority.ts` ranks Clinical for medical roles | **Done** — `clinical` → pathway / evidence modules; `medical_clinical` family |

**Note:** Mobile no longer uses a fixed 5-item `MOBILE_NAV` bottom bar for Clinical. Live model is section groups + primary nav; Clinical is a first-class section, not a bottom-bar slot.

## Pilot authority rows

See `docs/control/CLINICAL_PILOT_AUTHORITY_INVENTORY.md`.

- Code-level primary authorities: `CLINICAL_AUTHORITY_SEED` in `authorityRegistry.ts`.
- DB local-intel authorities: batch1 already seeds **CA, DE, NL, UY, MT**. Additive migration seeds **AU, GB, BR** for Clinical tier-1 / pilot cross-links.
- Do **not** invent unverified authority names; only seed from documented regulator sources.
- `clinical_jurisdiction_authority` (professional may_prescribe / may_recommend matrix) is a separate governed table — not filled by the local-intel pilot seed.

## Boundaries (non-negotiable)

- Not medical advice, prescribing advice, or patient-specific guidance.
- High-risk modules stay behind professional-review status until reviewed.
- Public DTOs only — no private review notes on the CC surface.
- No silent jurisdiction substitution (no Brazil/Canada fallback).

## Related routes (keep live; do not redirect away without parity)

- `/dashboard?page=clinical` (Command shell)
- `/dashboard/clinical` (dedicated workspace)
- `/network/clinical-education`
- `/network/clinical-education/[slug]`
- `/network/clinical-education/request`
