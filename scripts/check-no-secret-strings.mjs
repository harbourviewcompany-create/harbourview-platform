import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;

  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(key, next);
    i += 1;
  } else {
    args.set(key, 'true');
  }
}

const base = args.get('base') || process.env.BASE_REF || 'origin/main';
const head = args.get('head') || process.env.HEAD_REF || 'HEAD';
const maxBytes = Number(args.get('max-bytes') || process.env.SECRET_SCAN_MAX_BYTES || 1_000_000);

function runGit(gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function getChangedFiles(baseRef, headRef) {
  const ranges = [`${baseRef}...${headRef}`, `${baseRef}..${headRef}`];
  for (const range of ranges) {
    try {
      const output = runGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', range]);
      return output ? output.split('\n').filter(Boolean) : [];
    } catch {
      // Try the next range form below.
    }
  }
  throw new Error(`Unable to determine changed files for base "${baseRef}" and head "${headRef}".`);
}

function getAddedLines(baseRef, headRef) {
  const ranges = [`${baseRef}...${headRef}`, `${baseRef}..${headRef}`];
  for (const range of ranges) {
    try {
      const output = runGit(['diff', '--unified=0', '--no-ext-diff', range]);
      return output
        .split('\n')
        .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
        .map((line) => line.slice(1));
    } catch {
      // Try the next range form below.
    }
  }
  return [];
}

const patterns = [
  { name: 'private-key-block', regex: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'github-token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b/ },
  { name: 'github-fine-grained-token', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: 'openai-style-api-key', regex: /\bsk-[A-Za-z0-9][A-Za-z0-9_-]{24,}\b/ },
  { name: 'aws-access-key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'slack-token', regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: 'jwt-looking-token', regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
  { name: 'database-url-with-password', regex: /\bpostgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s'\")]+/i },
];

const riskyAssignment = /\b[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE|API_KEY)[A-Z0-9_]*\b\s*(?:=|:(?!\?))\s*(.+?)\s*$/i;
const plainReferenceValue = /^(?:process\.env|env|secrets|vars)\.[A-Z0-9_.-]+$/i;
const shellReferenceValue = /^\$\{[A-Z0-9_]+\}$/i;
const requiredShellReferenceValue = /^\$\{[A-Z0-9_]+:\?[^}]*\}$/i;
const githubExpressionInner = /^(?:secrets|vars|github|inputs)\.[A-Z0-9_.-]+$/i;
const safePlaceholderValue = /^(?:<[^>]+>|your_[A-Za-z0-9_-]+|example[A-Za-z0-9_-]*|REPLACE_ME|CHANGEME|1|0|true|false|''|"")$/i;

function normalizeAssignmentValue(rawValue) {
  const value = rawValue.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1).trim();
    }
  }
  return value;
}

function isSafeReferenceValue(value) {
  if (plainReferenceValue.test(value)) return true;
  if (shellReferenceValue.test(value)) return true;
  if (requiredShellReferenceValue.test(value)) return true;

  if (value.startsWith('${{') && value.endsWith('}}')) {
    const inner = value.slice(3, -2).trim();
    return githubExpressionInner.test(inner);
  }

  return false;
}

function isProbablyText(path) {
  if (!existsSync(path)) return false;
  const stat = statSync(path);
  if (stat.size > maxBytes) return false;
  const sample = readFileSync(path);
  return !sample.includes(0);
}

function scanLine(line, source) {
  const findings = [];
  for (const pattern of patterns) {
    if (pattern.regex.test(line)) findings.push({ source, pattern: pattern.name });
  }

  const assignment = line.match(riskyAssignment);
  if (assignment && assignment[1]) {
    const value = normalizeAssignmentValue(assignment[1]);
    if (
      value.length >= 8 &&
      !isSafeReferenceValue(value) &&
      !safePlaceholderValue.test(value)
    ) {
      findings.push({ source, pattern: 'risky-secret-assignment' });
    }
  }
  return findings;
}

function runParserSelfTests() {
  const safeCases = [
    'FIGMA_TOKEN: ${{ secrets.FIGMA_TOKEN }}',
    '# FIGMA_TOKEN: ${{ secrets.FIGMA_TOKEN }}',
    'SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:?required}',
    'API_KEY=process.env.API_KEY',
    'TOKEN: vars.DEPLOY_TOKEN',
  ];
  const blockedCases = [
    'API_KEY=literal-secret-value',
    'TOKEN: literal-token-value',
    'PASSWORD=${PASSWORD:-fallback-secret}',
  ];

  for (const line of safeCases) {
    const risky = scanLine(line, 'self-test').some((finding) => finding.pattern === 'risky-secret-assignment');
    if (risky) throw new Error(`Secret scanner self-test rejected safe reference: ${line}`);
  }

  for (const line of blockedCases) {
    const risky = scanLine(line, 'self-test').some((finding) => finding.pattern === 'risky-secret-assignment');
    if (!risky) throw new Error(`Secret scanner self-test accepted unsafe assignment: ${line}`);
  }
}

runParserSelfTests();

const files = getChangedFiles(base, head);
const findings = [];
for (const line of getAddedLines(base, head)) findings.push(...scanLine(line, 'diff-added-line'));
for (const file of files) {
  if (!isProbablyText(file)) continue;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => findings.push(...scanLine(line, `${file}:${index + 1}`)));
}

console.log('Secret-string scan');
console.log(`Base: ${base}`);
console.log(`Head: ${head}`);
console.log('Parser self-tests: PASS');
if (files.length === 0) console.log('Changed files: none');
else {
  console.log('Scanned changed files:');
  for (const file of files) console.log(`- ${file}`);
}

if (findings.length > 0) {
  console.error('');
  console.error('HOLD: possible committed secret values detected.');
  for (const finding of findings) console.error(`- ${finding.source}: ${finding.pattern}`);
  console.error('');
  console.error('Allowed: environment/GitHub references such as process.env.SUPABASE_SERVICE_ROLE_KEY, ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}, and ${SUPABASE_SERVICE_ROLE_KEY:?required}.');
  console.error('Blocked: raw token/key/password values, private keys, JWT-looking secrets, shell default-value expansions and credential-bearing database URLs.');
  process.exit(1);
}

console.log('GO: no committed secret-looking values detected.');
