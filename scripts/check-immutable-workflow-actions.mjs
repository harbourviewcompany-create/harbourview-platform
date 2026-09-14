import fs from 'node:fs';
import path from 'node:path';

const workflowsDir = path.resolve('.github/workflows');
const usesPattern = /^\s*(?:-\s*)?uses:\s*([^@\s]+)@([^\s#]+)/;
const shaPattern = /^[0-9a-f]{40}$/i;
const findings = [];

for (const name of fs.readdirSync(workflowsDir).filter((n) => /\.ya?ml$/i.test(n))) {
  const file = path.join(workflowsDir, name);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const match = line.match(usesPattern);
    if (!match) return;
    const ref = match[2];
    if (!shaPattern.test(ref)) {
      findings.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${match[0]}`);
    }
  });
}

if (findings.length) {
  console.error('FAIL: mutable GitHub Actions / reusable-workflow references remain:');
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('PASS: every external GitHub Actions / reusable-workflow reference is pinned to a full 40-character commit SHA.');
