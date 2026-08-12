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

const assignment = /\b([A-Za-z_][A-Za-z0-9_]*)\b\s*[:=]\s*["']?([^"'\s]+)["']?/;
const safeAssignmentValue = /^(?:process\.env\.|Deno\.env\.get\(|env\.|secrets\.|vars\.|\$\{\{\s*(?:secrets|vars|github|inputs)\.|<|your_|example|REPLACE_ME|CHANGEME|1$|true$|false$|0$|''$)/i;
const shellVariableReference = /^\$\{?[A-Z_][A-Z0-9_]*\}?$/;
const postgresAclShorthand = /^[A-Za-z*=]+\/[A-Za-z_][A-Za-z0-9_]*[},]?$/;
const generatedVisualTestPassword = new RegExp('^HvMobile-\\$\\{GITHUB_RUN_ID\\}-Aa9!$');

function normalizeIdentifier(identifier) {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase();
}

function isSensitiveIdentifier(identifier) {
  const normalized = normalizeIdentifier(identifier);
  return /(?:^|_)(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE|API_KEY)(?:_|$)/.test(normalized);
}

function isAllowedSensitiveAssignment(identifier, value) {
  if (!isSensitiveIdentifier(identifier)) return true;
  if (safeAssignmentValue.test(value)) return true;
  if (shellVariableReference.test(value)) return true;
  if (postgresAclShorthand.test(value)) return true;
  if (generatedVisualTestPassword.test(value)) return true;
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

  const match = line.match(assignment);
  if (match) {
    const [, identifier, value] = match;
    if (value && value.length >= 8 && !isAllowedSensitiveAssignment(identifier, value)) {
      findings.push({ source, pattern: 'risky-secret-assignment' });
    }
  }
  return findings;
}

function runSelfTest() {
  const cases = [
    ['shell secret reference', 'SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}', 0],
    ['github secret expression', 'TOKEN: ${{ secrets.DEPLOY_TOKEN }}', 0],
    ['node environment secret reference', 'const API_KEY = process.env.API_KEY', 0],
    ['deno environment secret reference', 'const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""', 0],
    ['deno bypass secret reference', 'const DEV_BYPASS_SECRET = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? ""', 0],
    ['generated isolated password', 'TEST_PASSWORD="HvMobile-${GITHUB_RUN_ID}-Aa9!"', 0],
    ['ordinary tokenization variable', 'const roleTokens = currentRole.split(/[^a-z]+/)', 0],
    ['postgres acl evidence', 'service_role=X/postgres', 0],
    ['literal password', 'DATABASE_PASS' + 'WORD="literal-secret-12345"', 1],
    ['literal api key', 'api' + 'Key="literal-api-key-value"', 1],
    ['github token signature', 'value=' + 'gh' + 'p_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ1234', 1],
  ];

  const failures = cases.filter(([name, line, expected]) => {
    const actual = scanLine(line, `self-test:${name}`).length;
    if (actual !== expected) console.error(`SELF-TEST FAIL ${name}: expected ${expected}, got ${actual}`);
    return actual !== expected;
  });
  if (failures.length) process.exit(1);
  console.log(`GO: secret scanner self-test passed (${cases.length} cases).`);
}

if (args.get('self-test') === 'true') {
  runSelfTest();
  process.exit(0);
}

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
  console.error('Allowed: environment/GitHub secret references, PostgreSQL ACL evidence, and the isolated GITHUB_RUN_ID-derived visual-test credential.');
  console.error('Blocked: raw token/key/password values, private keys, JWT-looking secrets and credential-bearing database URLs.');
  process.exit(1);
}

console.log('GO: no committed secret-looking values detected.');
