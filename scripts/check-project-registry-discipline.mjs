#!/usr/bin/env node

import fs from 'node:fs';
import https from 'node:https';

const sensitiveExactFiles = new Set(['package.json','package-lock.json','pnpm-lock.yaml','yarn.lock','vercel.json','wrangler.toml','.env','.env.local','.env.production']);
const sensitivePrefixes = ['supabase/migrations/','.github/workflows/','docs/control/'];

function loadText(path) {
  return fs.readFileSync(path, 'utf8');
}

function extractChecklist(body) {
  const lines = String(body || '').split(/\r?\n/);
  const checked = [];
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s*\[([ xX])\]\s*(.+)$/);
    if (m) checked.push({ checked: m[1].trim().toLowerCase() === 'x', text: m[2].trim() });
  }
  return checked;
}

function hasRegistrySection(body) {
  return /registry\s+impact/i.test(body || '');
}

function assertsNoRegistryChange(body) {
  const items = extractChecklist(body);
  const noChange = items.some((i) => i.checked && /no\s+[—\-–].*registry|no registry change/i.test(i.text));
  const yesChange = items.some((i) => i.checked && /yes\s+[—\-–].*PROJECT_REGISTRY|registry change required/i.test(i.text));
  return { noChange, yesChange };
}

function filesRequireRegistry(files) {
  return files.some((f) => {
    if (sensitiveExactFiles.has(f)) return true;
    return sensitivePrefixes.some((p) => f.startsWith(p));
  });
}

async function githubJson(path) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY required');
  const url = `https://api.github.com/repos/${repo}${path}`;
  const headers = {
    'User-Agent': 'harbourview-registry-discipline',
    Accept: 'application/vnd.github+json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return await new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`GitHub API ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.log('No GITHUB_EVENT_PATH; skipping registry discipline (local).');
    return;
  }
  const event = JSON.parse(loadText(eventPath));
  const pr = event.pull_request || event.issue;
  if (!pr || !pr.number) {
    console.log('Not a PR event; skipping.');
    return;
  }
  const body = pr.body || '';
  if (!hasRegistrySection(body)) {
    console.error('FAIL: PR body missing Registry Impact section');
    process.exit(1);
  }
  const { noChange, yesChange } = assertsNoRegistryChange(body);
  if (!noChange && !yesChange) {
    console.error('FAIL: Registry Impact must check either No or Yes for registry change');
    process.exit(1);
  }
  // Optional: validate changed files against claim when API available
  try {
    const files = await githubJson(`/pulls/${pr.number}/files?per_page=100`);
    const names = (files || []).map((f) => f.filename);
    if (yesChange && !names.some((n) => n.includes('PROJECT_REGISTRY'))) {
      console.warn('WARN: Yes registry change checked but PROJECT_REGISTRY.md not in diff');
    }
    if (noChange && filesRequireRegistry(names)) {
      console.log('INFO: sensitive paths touched with No registry change — ensure control statement justifies');
    }
  } catch (e) {
    console.log('INFO: could not list PR files:', e.message);
  }
  console.log('GO: registry discipline checklist present');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
