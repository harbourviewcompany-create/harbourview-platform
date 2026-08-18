# Clinical mobile Evidence Explorer — layout contract (2026-08-18)

**Status:** Code-present on branch; production proof only after merge to `main` + Vercel deploy.
**Registry impact:** Documentation only. No new routes, tables, secrets, or deployment targets.

## Contract

- File: `components/dashboard/mobile-command/ClinicalEvidenceExplorer.tsx`
- Must use Tailwind utility layout only (no dependency on missing `hvc-*` stylesheet rules).
- Status / role / state badges must remain separate flex children (never concatenated text runs).
- Evidence fetch prefers `country=ISO2`; does not invent a default jurisdiction (e.g. Canada).
- Wrapped by `ClinicalEvidenceErrorBoundary` in `ClinicalSection`.

## Known non-goals (still open)

- Governed interactions dataset inside the explorer tabs (section deck uses `/api/clinical/interactions` when published).
- Governed monitoring protocol dataset.
- Netlify `harbourviewns` preview (known ignore; disconnect is operator dashboard action).
- Pre-existing typecheck failures outside this surface (`ClinicalPanel`, clinical API types).

## Verify after merge

1. Vercel production auto-deploy from `main`.
2. Mobile Clinical Command on `https://harbourview.vercel.app` — labels not concatenated; skeleton on load.
