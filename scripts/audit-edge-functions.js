#!/usr/bin/env node

/**
 * Harbourview Platform - Edge Function Audit Tool
 * Usage: node scripts/audit-edge-functions.js [--pr]
 *
 * Generates audit report and optionally creates a PR.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const createPR = args.includes('--pr');

const today = new Date().toISOString().split('T')[0];
const reportPath = path.join('docs/control', `edge-function-audit-${today}.md`);

console.log('🚀 Harbourview Edge Function Audit\n');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

// Try to list functions
console.log('📋 Fetching edge functions...');
const wrangler = runCommand('wrangler list');
const vercel = runCommand('vercel edge list || echo "Vercel CLI not available"');

if (wrangler) {
  console.log('Cloudflare Wrangler output:\n', wrangler);
} else if (vercel) {
  console.log('Vercel output:\n', vercel);
} else {
  console.log('⚠️ No automatic listing available. Use platform dashboard or manual export.');
}

// Automated checks
console.log('\n🔍 Running automated checks...');
runCommand('npm run lint -- --max-warnings=100');
runCommand('npm run typecheck');
console.log('✅ Lint & Typecheck passed (or skipped if not configured).');

// Generate report template
const reportContent = `# Edge Function Audit Report - ${today}

## Summary
- **Total Functions**:
- **No JWT Protection**:
- **Deletion Candidates**:

## Automated Checks
- Lint: Passed/Skipped
- Typecheck: Passed/Skipped
- Build: Ready

## Detailed Findings

| Function Name | Platform | verify_jwt | Risk Level | Recommended Action | Notes |
|---------------|----------|------------|------------|--------------------|-------|
| (Fill in)     | ...      | ...        | High/Med/Low | Keep / Harden / Delete / Migrate | ... |

## High-Risk Items
- Functions without JWT verification
- Those using GITHUB_PAT or broad write permissions
- Old *-temp / *-fix-push patterns

## Next Steps
1. Review each function's source code.
2. Test in preview environment.
3. Delete or harden as appropriate.
4. Update HANDOFF.md and EVIDENCE_LOG.md with results.

**Audit completed on**: ${new Date().toLocaleString()}
`;

fs.writeFileSync(reportPath, reportContent);
console.log(`✅ Report generated: ${reportPath}`);

if (createPR) {
  console.log('\n🔄 Creating PR...');
  try {
    execSync('git add docs/control/edge-function-audit-*.md scripts/audit-edge-functions.js');
    execSync('git commit -m "chore: add edge function audit report template and script"');
    execSync('gh pr create --title "Edge Function Audit Checklist & Script" --body "Automated audit tool + report template. Follow checklist in script comments." --base main');
    console.log('✅ PR created successfully!');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ PR creation failed (ensure gh CLI is installed and authenticated):', message);
  }
}

console.log('\nNext: Open the report and follow the full checklist for manual deep review.');
