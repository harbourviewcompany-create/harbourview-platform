import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const BROWSER_REACHABLE_ROOTS = ['app', 'components', 'hooks', 'public'];
const FORBIDDEN_BROWSER_PATTERNS = [
  /NEXT_PUBLIC_HF[A-Z0-9_]*/,
  /NEXT_PUBLIC_HUGGINGFACE[A-Z0-9_]*/,
  /HF_TOKEN/,
  /HUGGINGFACE_API_KEY/,
  /HUGGINGFACE_TOKEN/,
];

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs|json|html|css)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe('Hugging Face browser env safety', () => {
  it('keeps Hugging Face tokens and NEXT_PUBLIC_HF variables out of browser-reachable source', () => {
    const findings: string[] = [];

    for (const root of BROWSER_REACHABLE_ROOTS) {
      for (const file of walk(join(ROOT, root))) {
        const text = readFileSync(file, 'utf8');
        for (const pattern of FORBIDDEN_BROWSER_PATTERNS) {
          if (pattern.test(text)) findings.push(`${relative(ROOT, file)} matched ${pattern}`);
        }
      }
    }

    expect(findings).toEqual([]);
  });
});
