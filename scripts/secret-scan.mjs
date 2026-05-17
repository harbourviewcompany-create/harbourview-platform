#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.next', 'coverage', 'dist', 'build']);
const IGNORE_FILES = [/package-lock\.json$/i, /pnpm-lock\.yaml$/i, /yarn\.lock$/i, /\.env\..*example$/i, /\.env\.example$/i];

const patterns = [
  { name: 'OpenAI API key', regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub token', regex: /ghp_[A-Za-z0-9]{36}/g },
  { name: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const allowPattern = /(?:example|placeholder|sample|dummy|test|changeme|your_|<)/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.DS_Store')) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(full, out);
      continue;
    }
    if (IGNORE_FILES.some((rx) => rx.test(rel))) continue;
    out.push(full);
  }
  return out;
}

const findings = [];
for (const file of walk(ROOT)) {
  const relPath = path.relative(ROOT, file);
  if (/(^|\/)deploy\/env\//.test(relPath)) continue;
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const p of patterns) {
    for (const match of text.matchAll(p.regex)) {
      const value = match[0];
      if (allowPattern.test(value)) continue;
      const before = text.slice(0, match.index);
      const line = before.split('\n').length;
      if (p.name === 'Supabase service role key marker' && /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(your_|<|\$\{)/i.test(value)) continue;
      findings.push({ file: relPath, line, name: p.name });
    }
  }
}

if (findings.length > 0) {
  console.error('Secret scan failed. Potential secrets found:');
  for (const f of findings) {
    console.error(`- ${f.file}:${f.line} [${f.name}]`);
  }
  process.exit(1);
}

console.log('Secret scan passed: no high-confidence secret literals found.');
