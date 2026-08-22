# Harbourview Talent Job Board — Product & Technical Spec

**Status:** Phase 0 + Phase 1 foundation (this PR)  
**Owner:** Command / Talent surface  
**Last updated:** 2026-08-21  

## 1. Purpose

Make Command → Talent a true, review-gated job board for the regulated cannabis industry.  
Talent opportunities are deliberately separated from counterparty commercial records while remaining jurisdiction- and role-aware.

## 2. Positioning

> Roles and operating capability — filtered to the active jurisdiction or role where possible.

## 3. Scope of this PR

| Delivered | Deferred |
|-----------|----------|
| Schema + RLS | Employer posting UI |
| List / detail / apply / save / alerts APIs | Public `/jobs` SEO surface |
| Talent tab components (mobile-first) | Matching scores |
| Taxonomy + types | Paid featured placements |
| Review-required publish path | Full analytics dashboard |
| Empty states + filters | Playwright e2e suite |

## 4. Data model summary

- `talent_opportunities` — core posting (status: draft → pending_review → published | closed | archived)
- `talent_applications` — candidate applications (unique per user + opportunity)
- `talent_saved_jobs` — user bookmarks
- `talent_alerts` — saved search alerts

Every opportunity belongs to an `organizations` row. Publish requires review.

## 5. Taxonomy

See `lib/talent/taxonomy.ts`. Ten role families:

- Regulatory Affairs  
- Compliance & Licensing  
- Quality / GxP  
- Clinical & Medical  
- Cultivation & Genetics  
- Extraction & Manufacturing  
- Supply Chain & Logistics  
- Commercial / Market Access  
- Finance / Ops / Legal  
- Other / Specialist  

## 6. RLS principles

- `status = 'published'` is readable by anyone (including anon).  
- Organization members can manage their own postings.  
- Applications, saved jobs, and alerts are owned by the authenticated user (or visible to the hiring org).  
- No unauthenticated write path.

## 7. Integration points

- **Jurisdiction selector** in Command becomes the default filter.  
- **Professional profiles** can pre-fill apply (snapshot stored on application).  
- **Organizations** supply company name / location for cards.  
- Does **not** write into counterparty commercial tables.

## 8. UI contract (Talent tab)

- Header copy matches current production language.  
- Role-family chips + location-type chips.  
- Job cards show family · jurisdiction, title, company, salary band, employment type.  
- Detail sheet supports Apply (profile or external URL) + Save.  
- Empty state encourages broadening filters or setting an alert.

## 9. Seed & content policy

- No fake “VERIFIED” organizations or postings (same rule as `supplier_profiles`).  
- Only real organizations that exist in the platform.  
- Initial seeding should prioritise Regulatory Affairs, Compliance, Quality, and Clinical roles.  
- Every published row must have passed review.

## 10. Success metrics (90 days)

- ≥ 80 live reviewed postings  
- ≥ 40 % salary transparency  
- Application rate ≥ 8 % of unique views  
- ≥ 60 % of applications from users with a completed professional profile  
- Zero spam / non-industry postings on the public surface  

## 11. Follow-up PRs

1. Employer “Post a role” form + status management  
2. Admin review queue (or reuse existing application review patterns)  
3. Public `/jobs` discovery route (SEO)  
4. Matching / recommendations against professional profile  
5. Analytics events + simple employer dashboard  

## 12. Governance notes

- Additive only.  
- Does not touch any DO-NOT-TOUCH surfaces listed in HANDOFF.md.  
- `docs/control/PROJECT_REGISTRY.md` should gain a Talent / job-board row on merge.  
- After production push, verify at https://harbourview.vercel.app (canonical domain only).
