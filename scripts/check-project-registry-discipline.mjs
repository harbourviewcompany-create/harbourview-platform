#!/usr/bin/env node

import fs from 'node:fs';
import https from 'node:https';

const sensitiveExactFiles = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'vercel.json',
  'wrangler.jsonc',
  'middleware.ts',
  '.github/pull_request_template.md',
]);

const sensitivePrefixes = [
  'app/',
  'components/',
  'lib/',
  'supabase/',
  'scripts/',
  '.github/workflows/',
  'docs/control/DATABASE_CONTROL.md',
  'docs/control/DEPLOYMENT_RUNBOOK.md',
];

const registryPath = 'docs/control/PROJECT_REGISTRY.md';
const cleanupPath = 'docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md';

function parseManualChangedFiles() {
  const raw = process.env.REGISTRY_DISCIPLINE_CHANGED_FILES;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  return trimmed
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function readEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return null;
  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}

function requestJson(path) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required when changed files are not provided manually.');
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'harbourview-project-registry-discipline',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`GitHub API request failed with ${res.statusCode}: ${body}`));
            return;
          }
          resolve(JSON.parse(body));
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function fetchPullRequestFiles(prNumber) {
  const repository = process.env.GITHUB_REPOSITORY;
  const files = [];
  let page = 1;
  while (true) {
    const batch = await requestJson(`/repos/${repository}/pulls/${prNumber}/files?per_page=100&page=${page}`);
    files.push(...batch.map((file) => file.filename));
    if (batch.length < 100) break;
    page += 1;
  }
  return files;
}

function isSensitiveFile(file) {
  if (sensitiveExactFiles.has(file)) return true;
  return sensitivePrefixes.some((prefix) => file === prefix || file.startsWith(prefix));
}

function hasRegistryImpactSection(body) {
  return /^##\s+Registry Impact\s*$/im.test(body);
}

function checkedLines(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^-\s*\[[xX]\]\s+/.test(line));
}

function hasCheckedRegistryRow(body) {
  const rows = [
    'Harbourview Platform',
    'Harbourview Network',
    'Chatbot',
    'Contractor Demos',
    'Local AI Chatbot',
    'HV Telnyx Webhook',
    'Harbourview Marketplace Supabase',
    'Legacy Signal Supabase',
    'Harbourview Vercel Target',
    'Other / new row required',
  ];
  return checkedLines(body).some((line) => rows.some((row) => line.includes(row)));
}

function hasCheckedRegistryDecision(body) {
  return checkedLines(body).some(
    (line) =>
      /No\s+.*no registry change required/i.test(line) ||
      /Yes\s+.*PROJECT_REGISTRY\.md/i.test(line) ||
      /HOLD\s+.*registry ambiguity/i.test(line),
  );
}

function registryUpdated(files) {
  return files.includes(registryPath);
}

function registryFilesPresent() {
  const missing = [];
  if (!fs.existsSync(registryPath)) missing.push(registryPath);
  if (!fs.existsSync(cleanupPath)) missing.push(cleanupPath);
  return missing;
}

function printList(title, values) {
  console.log(`\n${title}`);
  if (values.length === 0) {
    console.log('- none');
    return;
  }
  values.forEach((value) => console.log(`- ${value}`));
}

async function main() {
  const event = readEvent();
  const pr = event?.pull_request;
  const body = process.env.REGISTRY_DISCIPLINE_PR_BODY ?? pr?.body ?? '';
  const manualChangedFiles = parseManualChangedFiles();
  const files = manualChangedFiles ?? (pr ? await fetchPullRequestFiles(pr.number) : []);
  const sensitiveFiles = files.filter(isSensitiveFile);
  const errors = [];

  const missingRegistryFiles = registryFilesPresent();
  if (missingRegistryFiles.length > 0) {
    errors.push(`Missing required registry/control file(s): ${missingRegistryFiles.join(', ')}`);
  }

  if (sensitiveFiles.length > 0) {
    if (!hasRegistryImpactSection(body)) {
      errors.push('Sensitive files changed, but PR body does not include a `## Registry Impact` section.');
    }
    if (!hasCheckedRegistryRow(body)) {
      errors.push('Sensitive files changed, but no affected registry row is checked in the PR body.');
    }
    if (!hasCheckedRegistryDecision(body)) {
      errors.push('Sensitive files changed, but no registry-change decision is checked in the PR body.');
    }
    if (!registryUpdated(files) && /new row required/i.test(body) && !/^-\s*\[[xX]\]\s+HOLD/im.test(body)) {
      errors.push('PR references a new registry row but does not update PROJECT_REGISTRY.md or mark the PR as HOLD.');
    }
  }

  printList('Changed files', files);
  printList('Sensitive files', sensitiveFiles);

  if (errors.length > 0) {
    printList('Registry discipline failures', errors);
    process.exit(1);
  }

  console.log('\nGO: project registry discipline check passed.');
}

main().catch((error) => {
  console.error(`HOLD: project registry discipline check failed unexpectedly: ${error.message}`);
  process.exit(1);
});
