#!/usr/bin/env node
/**
 * scripts/check-critical-env.mjs
 *
 * Sanity-checks that critical environment secrets are present before a
 * deployment or CI run proceeds. Run by the CI "env-check" job on every
 * push/PR to main.
 *
 * In CI: variables are sourced from GitHub Actions secrets. A missing secret
 * means the variable is an empty string — this script treats empty as absent.
 *
 * In local dev: variables are sourced from .env.local (loaded externally by
 * the caller). Run manually with:
 *   node scripts/check-critical-env.mjs
 * or via:
 *   npm run check:critical-env
 *
 * Exit codes:
 *   0  All required vars present — safe to proceed.
 *   1  One or more required vars missing — deployment blocked.
 */

// ---------------------------------------------------------------------------
// Variable registry
// ---------------------------------------------------------------------------

/**
 * @typedef {'error' | 'warn'} Severity
 * @typedef {{ name: string; severity: Severity; description: string; fix: string }} EnvCheck
 */

/** @type {EnvCheck[]} */
const CHECKS = [
  // ── HF Intelligence Layer ────────────────────────────────────────────────
  {
    name: 'HF_TOKEN_SERVER',
    severity: 'error',
    description: 'Hugging Face server token. Required by all HF operations: ' +
      'embed-artifacts cron, embed-signals cron, intelligence-embed cron, ' +
      'and any HuggingFaceExtractor instance.',
    fix: 'Set HF_TOKEN_SERVER in Vercel → Settings → Environment Variables. ' +
      'Generate at https://huggingface.co/settings/tokens (read scope). ' +
      'DO NOT set HF_TOKEN — it is a deprecated alias that is no longer accepted.',
  },

  // ── Intelligence extraction pipeline ────────────────────────────────────
  {
    name: 'GEMINI_API_KEY',
    severity: 'error',
    description: 'Gemini 2.5 Flash key. Required by app/api/cron/intelligence-extract. ' +
      'Without it, the extract cron returns { ok: false } silently and no signals ' +
      'are extracted from ingested sources.',
    fix: 'Generate a free key (no billing required) at https://aistudio.google.com/apikey. ' +
      'Set GEMINI_API_KEY in Vercel → Settings → Environment Variables.',
  },

  // ── Admin / operator verification ───────────────────────────────────────
  {
    name: 'HARBOURVIEW_EDGE_OPERATOR_SECRET',
    severity: 'error',
    description: 'Edge operator secret. Required by app/api/admin/verify-org/route.ts. ' +
      'Without it, the verify-org route rejects ALL callers with 401 — org ' +
      'verification is silently broken in production.',
    fix: 'Generate a random secret (e.g. `openssl rand -hex 32`) and set ' +
      'HARBOURVIEW_EDGE_OPERATOR_SECRET in Vercel → Settings → Environment Variables. ' +
      'Also set the same value as a GitHub Actions secret if any workflow calls this endpoint.',
  },

  // ── Cron scheduler ──────────────────────────────────────────────────────
  {
    name: 'CRON_SECRET',
    severity: 'error',
    description: 'Cron authorization secret. Required by ALL /api/cron/* routes. ' +
      'Vercel passes this as Authorization: Bearer <CRON_SECRET>. ' +
      'Without it, every scheduled cron job returns 503.',
    fix: 'Generate a random secret and set CRON_SECRET in Vercel → Settings → ' +
      'Environment Variables. Also set it as a GitHub Actions secret for manual ' +
      'workflow_dispatch triggers (see .github/workflows/trigger-regulatory-watch.yml).',
  },

  // ── Supabase ─────────────────────────────────────────────────────────────
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    severity: 'error',
    description: 'Supabase service-role key. Required by all server-side Supabase ' +
      'admin operations (IA tables, marketplace mutations, signal pipeline). ' +
      'Without it, all service-role operations fail with auth errors.',
    fix: 'Find in Supabase Dashboard → Project Settings → API → service_role key. ' +
      'Set SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables.',
  },

  // ── Warnings — missing degrades functionality but does not break core ───
  {
    name: 'HF_ENDPOINT_EMBED_BGE_M3',
    severity: 'warn',
    description: 'BGE-M3 embedding endpoint (paid tier). Falls back to free serverless ' +
      'API when unset, which has strict rate limits. Acceptable in dev/staging.',
    fix: 'Provision an Inference Endpoint at https://huggingface.co/inference-endpoints ' +
      'and set HF_ENDPOINT_EMBED_BGE_M3 in Vercel.',
  },
  {
    name: 'XAI_API_KEY',
    severity: 'warn',
    description: 'xAI / Grok provider key. Required by app/api/ai/xai/route.ts. ' +
      'Without it, the xAI route returns 503.',
    fix: 'Generate at https://console.x.ai and set XAI_API_KEY in Vercel.',
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

function isSet(name) {
  const val = process.env[name];
  return typeof val === 'string' && val.trim().length > 0;
}

let errors = 0;
let warnings = 0;

console.log(`\n${BOLD}Harbourview — Critical Environment Variable Check${RESET}`);
console.log(`${DIM}Checking ${CHECKS.length} variables...${RESET}\n`);

for (const check of CHECKS) {
  const present = isSet(check.name);

  if (present) {
    console.log(`  ${GREEN}✓${RESET}  ${check.name}`);
    continue;
  }

  if (check.severity === 'error') {
    errors++;
    console.log(`  ${RED}✗  ${check.name}${RESET}`);
    console.log(`     ${DIM}${check.description}${RESET}`);
    console.log(`     ${RED}Fix: ${check.fix}${RESET}`);
  } else {
    warnings++;
    console.log(`  ${YELLOW}⚠  ${check.name}${RESET}`);
    console.log(`     ${DIM}${check.description}${RESET}`);
    console.log(`     ${YELLOW}Fix: ${check.fix}${RESET}`);
  }
  console.log('');
}

console.log('');

if (errors === 0 && warnings === 0) {
  console.log(`${GREEN}${BOLD}All critical environment variables are set.${RESET}\n`);
  process.exit(0);
}

if (warnings > 0 && errors === 0) {
  console.log(
    `${YELLOW}${BOLD}${warnings} warning(s) — non-critical variables missing. ` +
    `Deployment is allowed but some features will be degraded.${RESET}\n`,
  );
  process.exit(0);
}

console.log(
  `${RED}${BOLD}FAILED: ${errors} critical variable(s) missing. ` +
  `Fix the errors above before deploying to production.${RESET}\n`,
);
process.exit(1);
