# HAR-37 Public IA Evidence

Date: 2026-05-16

## Changed files

- `app/platform/page.tsx`
- `app/source-methodology/page.tsx`
- `app/markets/page.tsx`
- `app/professionals/page.tsx`
- `app/reviewed-connections/page.tsx`
- `app/intelligence/IntelligenceModulePage.tsx`
- `app/intelligence/country-briefs/page.tsx`
- `app/intelligence/licensing-pathways/page.tsx`
- `app/intelligence/regulatory-pathways/page.tsx`
- `app/intelligence/counterparty-intelligence/page.tsx`
- `app/intelligence/logistics-trade-routes/page.tsx`
- `app/intake/page.tsx`
- `app/intake/ConfidentialIntakeForm.tsx`
- `app/marketplace/consumables/page.tsx`
- `components/PublicUi.tsx`
- `scripts/test-har37-public-ia.mjs`
- `docs/control/HAR37_PUBLIC_IA_EVIDENCE.md`

## Route coverage

`node scripts/test-har37-public-ia.mjs`

Result:

```text
HAR-37 public IA route coverage passed for 37 public routes.
HAR-37 visible role coverage passed for 27 role-path terms.
```

## Verification

`npm run typecheck`

Result: passed.

`npm run test:visibility`

Result:

```text
ok public listing render files and fixtures do not expose source/provenance/contactEmail fields
ok public listing projection omits internal source/provenance/contactEmail fields
ok admin listing review retains source/provenance/evidence fields
ok admin provenance route uses server-side role guard
ok business opportunities page uses reviewed live feed adapter
ok business opportunities adapter filters approved, published, public and unexpired records
ok business opportunities public render files omit source, contact, provenance, evidence, diligence and internal-note fields
ok business opportunities public projection does not map private source or review fields
```

`node scripts/test-public-copy.mjs`

Result:

```text
ok public copy: 11 public files passed Network terminology checks
```

`npm run test:listing-quality`

Result:

```text
ok marketplace listing quality: 37 listing(s) passed deal-trigger, buyer-type, scale-anchor, and access-model checks
```

`npm run test:admin-guard`

Result: passed admin role, workflow, conversion and smoke-route guard checks.

`npm run build`

Result: passed. Existing warnings remained limited to `<img>` usage, unused private-field destructures in marketplace genetics/server helpers, and the existing multiple-lockfile workspace-root warning.

`npm test`

Result: blocked by package manifest. The repository does not define a `test` script, and HAR-37 forbids changing package manager files in this pass.

## Responsive QA

Local URL: `http://127.0.0.1:3007`

Checked with browser DOM QA plus headless Chromium CDP screenshots:

- Desktop home: `1280x900`, `scrollW=1280`
- Tablet home: `900x900`, `scrollW=900`
- Mobile intake: `390x844`, `scrollW=390`

Observed outcome: desktop and tablet home preserve the full-platform hero, platform spine and mobile hamburger behavior at tablet width. Mobile intake keeps the institutional visual system, readable hero text, visible reviewed-handling panel and accessible intake form without horizontal overflow.

## GO/HOLD

Implementation and available verification gates passed.

Overall HAR-37 remains HOLD only because the ticket explicitly lists `npm test`, but the current package manifest has no `test` script and package manager files are forbidden for this ticket.
