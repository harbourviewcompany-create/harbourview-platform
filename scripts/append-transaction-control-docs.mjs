import fs from 'node:fs';

const updates = [
  {
    path: 'docs/control/DATABASE_CONTROL.md',
    marker: '## 2026-08-10 — Native transaction-system foundation (PR #1329)',
    body: `
## 2026-08-10 — Native transaction-system foundation (PR #1329)

- **Environment:** repository branch \`feat/native-transaction-system-foundation\`; migrations execute only against disposable PostgreSQL in GitHub Actions. Connected Supabase was used for read-only schema/grant reconciliation only. No production migration, data import, deployment, cron, secret, or runtime mutation is authorized by this entry.
- **Migration order:** \`20260811010000_transaction_identity_foundation.sql\`; \`20260811011000_transaction_product_account_foundation.sql\`; \`20260811012000_transaction_core_foundation.sql\`; \`20260811013000_transaction_assertion_diligence_foundation.sql\`; \`20260811014000_transaction_economics_decisions_foundation.sql\`; \`20260811015000_transaction_rls_views_import_staging.sql\`; \`20260811015100_transaction_boundary_hardening.sql\`.
- **Data model:** reuses/upgrades the existing Signal Engine \`public.entities\` identity root; adds entity aliases/facilities, canonical products/batches, economic accounts/membership, transaction networks/transactions/parties, assertions/evidence links/diligence, append-only transaction economics, transaction decisions, controlled import staging, and security-invoker safe views.
- **Compatibility bridges:** nullable FKs only into \`cannabis_operators\`, \`ia_counterparties\`, \`operator_licences\`, \`opportunities\`, \`listings\`, \`buyer_requests\`, \`matches\`, \`deal_rooms\`, \`engagements\`, and \`commissions\`. Workspaces remain tenancy/security boundaries and are not counterparty identity.
- **RLS/security:** all transaction-domain tables are RLS-enabled and anon-revoked. Participant access is transaction/workspace-membership scoped. Harbourview revenue and gross-margin metrics are excluded from participant visibility. Existing broad \`listings\`/\`buyer_requests\` grants are converted to legacy-column allowlists so new internal bridge IDs cannot be selected, inserted, or updated by anon/authenticated callers.
- **Economic integrity:** deterministic network and recognition keys reject ambiguous separators; authoritative recognition inserts serialize by recognition key; scenario economics cannot enter authoritative views; transacted GTV excludes contract-only basis; specific-party diligence/economics must bind to the same transaction; the economics ledger is append-only with retention-safe restrictive FKs.
- **Workbook staging:** \`transaction_import_staging\` encodes the controlled fixture universe of 165 master records, 69 execution packages, 64 economic accounts and 10 transaction networks. It does not import workbook rows and preserves unresolved/conflicting values for review.
- **Backward compatibility:** additive schema evolution; existing identity rows/FKs are preserved in place, existing APIs/routes remain unchanged, and public marketplace behavior retains legacy allowed columns while excluding new internal bridge columns.
- **Rollback/forward-fix:** before production application, abandon/revert the branch. After any future approved application, prefer forward-fix. Direct rollback would require dependency-ordered removal of the new transaction views/policies/tables/types/bridge columns and restoration of prior marketplace grants, and therefore requires a separately reviewed production migration rather than ad-hoc SQL.
- **Required verification:** disposable PostgreSQL migration execution, applied-schema assertions, transaction Vitest suite, existing public visibility regression, services leakage regression, typecheck, build, Project Registry Discipline, Migration Drift Check, and review-thread closure. Final run IDs/results are recorded in \`docs/control/EVIDENCE_LOG.md\` after completion.
- **Human approval status:** branch implementation authorized by Tyler. Production migration application, workbook import and deployment remain explicitly unapproved/out of scope.
`,
  },
  {
    path: 'docs/control/EVIDENCE_LOG.md',
    marker: '## 2026-08-10 — PR #1329 native transaction-system implementation evidence',
    body: `
## 2026-08-10 — PR #1329 native transaction-system implementation evidence

- **Scope:** branch-only additive transaction-system implementation on \`feat/native-transaction-system-foundation\`; no production deploy, Supabase migration application or workbook import.
- **Live reconciliation:** read-only connected-Supabase inspection verified legacy \`public.entities\`, bridge PK types, \`user_roles\`, active \`workspace_members\`, and broad legacy \`listings\`/\`buyer_requests\` privileges. No DDL/DML was executed against the connected project.
- **Migration dry run:** dedicated \`Transaction System Verification\` workflow executes all seven transaction migrations against disposable PostgreSQL 16 seeded with the legacy Signal Engine \`entities\` table/FK relationship and broad marketplace grants. The fixture verifies in-place identity preservation, all transaction RLS surfaces, nullable bridges, legacy-column public access preservation, bridge-column denial, deterministic key controls, evidence-basis controls, append-only supersession, scenario exclusion and party/transaction integrity.
- **Regression commands:** \`node scripts/verify-transaction-system.mjs\`; \`npx vitest run tests/transactions\`; \`npm run test:visibility\`; \`npm run test:services-public-leakage\`; \`npm run typecheck\`; \`npm run build\`.
- **Current evidence state:** implementation evidence entry created before final workflow closure. Passing run IDs, final head SHA and review disposition must be appended before merge-ready GO.
- **Production boundary:** repository verification does not authorize production migration application, workbook import or deployment.
`,
  },
];

for (const update of updates) {
  const current = fs.readFileSync(update.path, 'utf8');
  if (current.includes(update.marker)) {
    console.log(`${update.path}: marker already present`);
    continue;
  }
  fs.appendFileSync(update.path, `${current.endsWith('\n') ? '' : '\n'}${update.body.trimStart()}\n`);
  console.log(`${update.path}: appended transaction control record`);
}
