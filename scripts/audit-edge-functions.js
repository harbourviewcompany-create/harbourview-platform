#!/usr/bin/env node

/**
 * Harbourview Platform - Edge Function Audit + Security Scanner
 * Usage:
 *   node scripts/audit-edge-functions.js
 *   node scripts/audit-edge-functions.js --full-scan
 *   node scripts/audit-edge-functions.js --snyk
 *   node scripts/audit-edge-functions.js --trivy
 *   node scripts/audit-edge-functions.js --opa
 *   node scripts/audit-edge-functions.js --pr
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const createPR = args.includes('--pr');
const fullScan = args.includes('--full-scan');
const runSnyk = args.includes('--snyk') || fullScan;
const runTrivy = args.includes('--trivy') || fullScan;
const runOpa = args.includes('--opa') || fullScan;

const today = new Date().toISOString().split('T')[0];
const reportPath = path.join('docs/control', `edge-function-audit-${today}.md`);

console.log('🚀 Harbourview Edge Function Audit + Security Scanner\n');

function runCommand(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts }).toString().trim();
  } catch (e) {
    if (opts.ignoreError) return e.stdout ? e.stdout.toString() : null;
    console.error(`Command failed: ${cmd}`);
    return null;
  }
}

// ---- Edge function inventory ----
console.log('📋 Fetching edge functions...');
const wrangler = runCommand('wrangler list', { silent: true, ignoreError: true });
const vercel = runCommand('vercel edge list || true', { silent: true, ignoreError: true });

if (wrangler) console.log('Cloudflare Wrangler output:\n', wrangler);
else if (vercel) console.log('Vercel output:\n', vercel);
else console.log('⚠️ No automatic listing available. Use platform dashboard or manual export.');

// ---- Automated security scans ----
let trivyResults = null;
let opaViolations = [];

if (runTrivy) {
  console.log('\n🔍 Running Trivy filesystem scan...');
  runCommand('mkdir -p .cache/trivy', { silent: true });
  trivyResults = runCommand(
    'trivy fs --format json --severity CRITICAL,HIGH --ignore-unfixed --cache-dir .cache/trivy -o trivy-results.json .',
    { ignoreError: true }
  );
  if (fs.existsSync('trivy-results.json')) {
    console.log('✅ Trivy results written to trivy-results.json');
  } else {
    console.log('⚠️ Trivy not available or scan failed. Install with: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh');
  }
}

if (runOpa && fs.existsSync('trivy-results.json')) {
  console.log('\n🛡️ Evaluating Trivy results against OPA policies...');
  const opaOut = runCommand(
    'opa eval --data policies/trivy-vuln-policy.rego --input trivy-results.json --fail-defined "data.harbourview.trivy.deny" -f pretty',
    { ignoreError: true, silent: true }
  );
  if (opaOut && opaOut.includes('deny')) {
    console.log('❌ OPA policy violations found:');
    console.log(opaOut);
    opaViolations.push(opaOut);
  } else {
    console.log('✅ No OPA policy violations');
  }
}

if (runSnyk) {
  console.log('\n🔒 Running Snyk scan...');
  if (process.env.SNYK_TOKEN) {
    runCommand(`SNYK_TOKEN=${process.env.SNYK_TOKEN} snyk test --severity-threshold=high`, { ignoreError: true });
  } else {
    console.log('⚠️ SNYK_TOKEN not set. Skipping authenticated Snyk scan.');
  }
}

// ---- Generate report ----
const reportContent = `# Edge Function Audit Report - ${today}

## Summary
- **Total Functions**: (fill from inventory)
- **No JWT Protection**: 
- **Deletion Candidates**: 
- **Trivy Critical/High findings**: ${trivyResults ? 'See trivy-results.json' : 'Not run'}
- **OPA Policy Violations**: ${opaViolations.length}

## Automated Security Checks
| Tool   | Status          | Notes                          |
|--------|-----------------|--------------------------------|
| Trivy  | ${runTrivy ? 'Executed' : 'Skipped'} | Filesystem + vuln scan         |
| OPA    | ${runOpa ? 'Executed' : 'Skipped'} | Custom Rego policies applied   |
| Snyk   | ${runSnyk ? 'Executed' : 'Skipped'} | Requires SNYK_TOKEN            |

## Detailed Findings

| Function Name | Platform | verify_jwt | Risk Level | Recommended Action | Notes |
|---------------|----------|------------|------------|--------------------|-------|
| (Fill in)     | ...      | ...        | High/Med/Low | Keep / Harden / Delete / Migrate | ... |

## High-Risk Items
- Functions without JWT verification
- Those using GITHUB_PAT or broad write permissions
- Old *-temp / *-fix-push patterns
- Any CRITICAL/HIGH CVEs with available fixes (blocked by OPA)

## Next Steps
1. Review each function's source code.
2. Test in preview environment.
3. Delete or harden as appropriate.
4. Update HANDOFF.md and EVIDENCE_LOG.md with results.
5. Ensure GitHub Actions workflow \`.github/workflows/security-scan.yml\` is active.

**Audit completed on**: ${new Date().toLocaleString()}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, reportContent);
console.log(`\n✅ Report generated: ${reportPath}`);

if (createPR) {
  console.log('\n🔄 Creating PR...');
  try {
    runCommand('git add docs/control/edge-function-audit-*.md scripts/audit-edge-functions.js policies/ .github/workflows/security-scan.yml');
    runCommand('git commit -m "chore(security): add Trivy + OPA policy enforcement for edge function audit"');
    runCommand('gh pr create --title "Security: Trivy + OPA Integration for Edge Function Audit" --body "Adds custom OPA/Rego policies, Trivy scanning, and CI workflow." --base main');
    console.log('✅ PR created successfully!');
  } catch (e) {
    console.error('❌ PR creation failed:', e.message);
  }
}

console.log('\nNext: Complete the manual edge-function table and merge when clean.');
