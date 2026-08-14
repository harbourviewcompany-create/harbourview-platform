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

/*
 * Vault secret literals.
 *
 * These are positional function arguments, not `identifier = value`, so the
 * assignment check never sees them, and the secret itself is opaque -- an Adzuna
 * key is bare hex and matches none of the vendor signatures above. A live Adzuna
 * app_id and app_key reached a public repository through that gap on 2026-08-13
 * while this scanner reported GO.
 *
 * `vault.create_secret(secret, name)` takes the secret first;
 * `vault.update_secret(id, secret, ...)` takes it second. A literal in either
 * position is a committed secret. References -- `current_setting(...)`, a
 * subselect, a plpgsql variable -- are unquoted and do not match.
 *
 * Kept out of `patterns` because the captured literal has to be run past the
 * placeholder allowlist: documentation shows the rotation call with a stand-in
 * secret (supabase/functions/hv-repo-reader/index.ts carries
 * `vault.update_secret(..., 'new_token_here')` in a comment), and flagging that
 * would train people to ignore this check.
 */
const vaultSecretCalls = [
  /\bvault\.create_secret\s*\(\s*'([^']{8,})'/i,
  /\bvault\.update_secret\s*\([^,]+,\s*'([^']{8,})'/i,
];

const placeholderSecret =
  /^(?:your_|example|replace_me|changeme|placeholder|dummy|redacted|xxx|<|\.\.\.)|_here$|^new_[a-z_]+$/i;

const assignment = /\b([A-Za-z_][A-Za-z0-9_]*)\b\s*[:=]\s*["']?([^"'\s]+)["']?/;
const githubExpressionAssignment = /\b([A-Za-z_][A-Za-z0-9_]*)\b\s*[:=]\s*\$\{\{\s*(?:secrets|vars|github|inputs)\.[^}]+\}\}/i;
const safeAssignmentValue = /^(?:process\.env\.|Deno\.env\.get\(|env\.|secrets\.|vars\.|\$\{\{\s*(?:secrets|vars|github|inputs)\.|<|your_|example|REPLACE_ME|CHANGEME|1$|true$|false$|0$|''$)/i;
const shellVariableReference = /^\$\{?[A-Z_][A-Z0-9_]*\}?$/;
const postgresAclShorthand = /^[A-Za-z*=]+\/[A-Za-z_][A-Za-z0-9_]*[},]?$/;
const generatedVisualTestPassword = new RegExp('^HvMobile-\\$\\{GITHUB_RUN_ID\\}-Aa9!$');
const envNameGetter = /\brequired\(\s*['"][A-Z][A-Z0-9_]*['"]\s*\)/;

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

function isAllowedSensitiveAssignment(identifier, value, line) {
  if (!isSensitiveIdentifier(identifier)) return true;
  if (githubExpressionAssignment.test(line)) return true;
  if (safeAssignmentValue.test(value)) return true;
  if (shellVariableReference.test(value)) return true;
  if (postgresAclShorthand.test(value)) return true;
  if (generatedVisualTestPassword.test(value)) return true;
  if (envNameGetter.test(line)) return true;
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
    const patternMatch = line.match(pattern.regex);
    if (!patternMatch) continue;
    if (pattern.name === 'database-url-with-password' && /\$/.test(patternMatch[0])) continue;
    findings.push({ source, pattern: pattern.name });
  }

  for (const regex of vaultSecretCalls) {
    const vaultMatch = line.match(regex);
    if (vaultMatch && !placeholderSecret.test(vaultMatch[1])) {
      findings.push({ source, pattern: 'vault-secret-literal' });
      break;
    }
  }

  const match = line.match(assignment);
  if (match) {
    const [, identifier, value] = match;
    if (value && value.length >= 8 && !isAllowedSensitiveAssignment(identifier, value, line)) {
      findings.push({ source, pattern: 'risky-secret-assignment' });
    }
  }
  return findings;
}

function runSelfTest() {
  const cases = [
    ['shell secret reference', 'SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}', 0],
    ['github secret expression', 'TOKEN: ${{ secrets.DEPLOY_TOKEN }}', 0],
    ['github secret expression with spaces', 'SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}', 0],
    ['node environment secret reference', 'const API_KEY = process.env.API_KEY', 0],
    ['deno environment secret reference', 'const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""', 0],
    ['deno bypass secret reference', 'const DEV_BYPASS_SECRET = Deno.env.get("HV_DEV_BYPASS_SECRET") ?? ""', 0],
    ['explicit env-name getter', "const oidcToken = required('VERCEL_TRUSTED_OIDC_TOKEN')", 0],
    ['generated isolated password', 'TEST_PASSWORD="HvMobile-${GITHUB_RUN_ID}-Aa9!"', 0],
    ['ordinary tokenization variable', 'const roleTokens = currentRole.split(/[^a-z]+/)', 0],
    ['postgres acl evidence', 'service_role=X/postgres', 0],
    ['dynamic database url', 'DB_URL="postgresql://${PGUSER}:${ENCODED_PASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"', 0],
    ['literal database url', 'DB_URL="postgresql://admin:literal-password-123@example.test/postgres"', 1],
    ['literal password', 'DATABASE_PASS' + 'WORD="literal-secret-12345"', 1],
    ['literal api key', 'api' + 'Key="literal-api-key-value"', 1],
    ['github token signature', 'value=' + 'gh' + 'p_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ1234', 1],
    // The 2026-08-13 miss: a bare-hex secret as a positional argument.
    ['vault literal secret', "SELECT vault.create_" + "secret('0123456789abcdef0123', 'some_api_key');", 1],
    ['vault literal on update', "SELECT vault.update_" + "secret(v_id, '0123456789abcdef0123', 'some_api_key');", 1],
    ['vault secret from a reference', "SELECT vault.create_secret(current_setting('app.k'), 'some_api_key');", 0],
    ['vault secret from a subselect', 'SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name=$1), v_new)', 0],
    ['vault secret read, not write', "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'adzuna_app_key'", 0],
    // The documented rotation example must not be flagged, or the check gets ignored.
    ['vault rotation doc placeholder', "//   SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name='GITHUB_PAT'), 'new_token_here');", 0],
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
  console.error('Allowed: environment/GitHub secret references, environment-name getters, PostgreSQL ACL evidence, and the isolated GITHUB_RUN_ID-derived visual-test credential.');
  console.error('Blocked: raw token/key/password values, private keys, JWT-looking secrets and literal credential-bearing database URLs.');
  process.exit(1);
}

console.log('GO: no committed secret-looking values detected.');
