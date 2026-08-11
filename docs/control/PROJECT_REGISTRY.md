Status: Canonical registry with verified Harbourview Vercel production mapping as of 2026-05-17; Vercel team ID and project ID corrected by operator confirmation 2026-06-23. Scoped residual systems catch-up 2026-07-28 (code-presence only). Phase 2 personal briefings slice started 2026-07-28.
Scope: GitHub, Vercel and Supabase assets visible in connected audits, plus the 2026-05-17 verified Vercel connector state recorded in Notion dispatch `DSP-10` / `HAR-16 / HAR-22`.
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy, reconfigure domains, change branch protection, change secrets, modify Supabase, modify runtime code, modify middleware, modify auth, modify dependencies or migrate anything without a separate approved cleanup PR or operator confirmation.

## Jurisdictions identity seed — 2026-08-11 (control)

**Registry impact:** Harbourview Platform + provisional canonical DB (`zvxdgdkukjrrwamdpqrg`).

Full control note: [`docs/control/JURISDICTIONS_IDENTITY_SEED_2026-08-11.md`](./JURISDICTIONS_IDENTITY_SEED_2026-08-11.md)

| Item | Detail |
|------|--------|
| Problem | Production `public.jurisdictions` = **0 rows**; `jurisdiction_crossref` ≈ 203 ISO bridges |
| Migration | `supabase/migrations/20260811140000_seed_jurisdictions_identity_from_countries.sql` |
| Claims | Identity only — no regulated-market assertions |
| Unblocks | Decision Intel Stage 0 (#1309) jurisdiction linkage after production apply |

> **Note:** Full historical registry body remains on `main` at this path. This PR adds the seed migration + control note. After merge, reconcile any concurrent registry edits from other open PRs (e.g. #1333) before treating this file as the sole long-form source.

## Supplier Directory

| Area | Routes / Tables | Status |
|------|------------------|--------|
| Public | `/supplier-directory`, `/supplier-directory/apply`, `/supplier-directory/[id]` | Active |
| Data | `supplier_profiles` | Active |

## Immediate GO Items

- Treat `harbourviewcompany-create/harbourview-platform` on `main` as the canonical production app source.
- Use `zvxdgdkukjrrwamdpqrg` as provisional canonical database.
- Apply jurisdictions identity seed to production under migration controls before activating Decision Intel Stage 0 jurisdiction linkage.
