#/usr/bin/env node

/**
 * Harbourview Platform - Edge Function Audit Tool
 * Run: node scripts/audit-edge-functions.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const today = new Date().toISOString().split('T')[0];
const reportPath = path.join('docs/control', `edge-function-audit-${today}.md`);

console.log('🚀 Harbourview Edge Function Audit\n');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
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

// Generate report template
const reportContent = `# Edge Function Audit Report - ${today}

## Summary
- **Total Functions**: 
- **No JWT Protection**: 
- **Deletion Candidates**: 

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
console.log('\nNext: Open the report and follow the original checklist for manual deep review.');
