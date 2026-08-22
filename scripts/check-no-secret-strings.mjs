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
];

/*
 * Database URLs.
 *
 * The risk is a literal password baked into a connection string. A URL assembled
 * from variables is not that, and flagging it is how a scanner gets ignored:
 * .github/workflows/supabase-migrate.yml builds
 *   postgresql://${PGUSER}:${ENCODED_PASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}
 * one line after masking it with ::add-mask::, and the old pattern matched it
 * because ${...} contains no colon, at-sign or space.
 *
 * So the password segment is captured and checked rather than assumed. A shell
 * variable, a command substitution or a GitHub expression in that position is
 * definitionally not a committed secret; anything else still fails.
 */
const databaseUrlWithPassword =
  /\bpostgres(?:ql)?:\/\/[^:\s]+:([^@\s]+)@[^/\s]+\/[^\s'")]+/i;

const nonLiteralValue =
  /^(?:\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*|\$\([^)]*\)?|\$\{\{\s*(?:secrets|vars|env|inputs|github)\.[A-Za-z0-9_-]+\s*\}\})$/;

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

const assignment = /\b([A-Za-z_][A-Za-z0-9_]*)\b\s*[:=]\s*(.+)$/;
const safeAssignmentValue = /^(?:process\.env\.|Deno\.env\.get\(|env\.|secrets\.|vars\.|\$\{\{\s*(?:secrets|vars|github|inputs)\.|<|your_|example|REPLACE_ME|CHANGEME|1$|true$|false$|0$|''$)/i;
const shellVariableReference = /^\$\{?[A-Z_][A-Z0-9_]*\}?$/;
/**
 * Supabase's `config.toml` interpolation form: `secret_key = "env(SECRET_NAME)"`
 * names an environment variable, exactly like `${VAR}` or `process.env.VAR`
 * above. It is a reference, never a value -- the whole point of the syntax is
 * that the secret stays out of the file.
 *
 * It needs its own pattern because the reference sits *inside* quotes, so it
 * reaches `unwrapDirectQuotedLiteral` and is judged as a direct literal, while
 * the other reference forms are unquoted and match earlier.
 *
 * Deliberately narrow: SCREAMING_SNAKE_CASE only, bounded length. An earlier
 * draft allowed any `[A-Za-z_][A-Za-z0-9_]*` and the self-test below caught it
 * accepting `env(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)` -- a JWT header segment
 * is pure alphanumeric, so a mixed-case pattern turns this allowance into a
 * wrapper for smuggling a real token past the scanner. Every environment name
 * Supabase's own config uses is uppercase, so requiring it costs nothing and
 * closes that door.
 */
const supabaseEnvInterpolation = /^env\([A-Z_][A-Z0-9_]{0,63}\)$/;
const postgresAclShorthand = /^[A-Za-z*=]+\/[A-Za-z_][A-Za-z0-9_]*[},]?$/;
const generatedVisualTestPassword = new RegExp('^HvMobile-\\$\\{GITHUB_RUN_ID\\}-Aa9!$');
const knownLocalTestPlaceholder = /^(?:postgres|local-test-(?:anon|service)-key)$/;
const requestBodyReference = /^body\.[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * True for `env(SOME_NAME)` where the inner text is genuinely a variable name.
 *
 * The shape check alone is not enough. An AWS access key ID
 * (`AKIAIOSFODNN7EXAMPLE`) is uppercase alphanumeric and fits
 * SCREAMING_SNAKE_CASE exactly, so the pattern would wave it through. Running
 * the vendor signatures over the inner text closes that: anything the scanner
 * would flag as a secret on its own is still a secret inside `env(...)`.
 */
function isSupabaseEnvReference(literal) {
  if (!supabaseEnvInterpolation.test(literal)) return false;
  const name = literal.slice(4, -1);
  return !patterns.some((pattern) => pattern.regex.test(name));
}

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

function stripAssignmentTerminator(value) {
  return value.trim().replace(/[;,]$/, '').trim();
}

function unwrapDirectQuotedLiteral(value) {
  const trimmed = stripAssignmentTerminator(value);
  if (trimmed.length < 2) return null;
  const quote = trimmed[0];
  if ((quote !== '"' && quote !== "'") || trimmed.at(-1) !== quote) return null;
  return trimmed.slice(1, -1);
}

function isBareLiteral(value) {
  const trimmed = stripAssignmentTerminator(value);
  return /^[A-Za-z0-9_+!@#$%^&*./:-]+$/.test(trimmed);
}

function isAllowedSensitiveAssignment(identifier, rawValue) {
  if (!isSensitiveIdentifier(identifier)) return true;

  const value = stripAssignmentTerminator(rawValue);
  if (safeAssignmentValue.test(value)) return true;
  if (shellVariableReference.test(value)) return true;
  if (postgresAclShorthand.test(value)) return true;
  if (generatedVisualTestPassword.test(value)) return true;
  if (requestBodyReference.test(value)) return true;
  // A command substitution computes a value at runtime; there is nothing
  // committed to leak. supabase-migrate.yml opens one to URL-encode the database
  // password read from a GitHub secret.
  if (nonLiteralValue.test(value)) return true;

  const directLiteral = unwrapDirectQuotedLiteral(value);
  if (directLiteral !== null) {
    if (generatedVisualTestPassword.test(directLiteral)) return true;
    if (placeholderSecret.test(directLiteral)) return true;
    if (knownLocalTestPlaceholder.test(directLiteral)) return true;
    if (isSupabaseEnvReference(directLiteral)) return true;
    return directLiteral.length < 8;
  }

  if (knownLocalTestPlaceholder.test(value)) return true;

  // Computed references are not committed secret literals. Vendor-token
  // signatures and vault positional-literal checks still run independently.
  if (!isBareLiteral(value)) return true;

  return value.length < 8;
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

  const dbUrlMatch = line.match(databaseUrlWithPassword);
  if (dbUrlMatch && !nonLiteralValue.test(dbUrlMatch[1])) {
    findings.push({ source, pattern: 'database-url-with-password' });
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
    if (value && !isAllowedSensitiveAssignment(identifier, value)) {
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
    // Supabase config.toml interpolation. The negative cases matter more than
    // the positive ones: the allowance must cover a bare variable name and
    // nothing else, or it becomes a wrapper for smuggling a real value through.
    ['supabase env interpolation', 'openai_api_key = "env(OPENAI_API_KEY)"', 0],
    ['supabase env interpolation, commented', '# secret_key = "env(SECRET_VALUE)"', 0],
    ['supabase env interpolation, s3', 's3_secret_key = "env(S3_SECRET_KEY)"', 0],
    ["value disguised as env interpolation", 'secret_key = "env(SECRET_NAME) sk-live-9f3c2a1b8d7e6f5a4b3c2d1e"', 2],
    ['jwt disguised as env interpolation', 'auth_token = "env(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)"', 1],
    ['aws key disguised as env interpolation', 'aws_secret_key = "env(AKIAIOSFODNN7EXAMPLE)"', 2],
    ['generated isolated password', 'TEST_PASSWORD="HvMobile-${GITHUB_RUN_ID}-Aa9!"', 0],
    ['ordinary tokenization variable', 'const roleTokens = currentRole.split(/[^a-z]+/)', 0],
    ['postgres acl evidence', 'service_role=X/postgres', 0],
    ['dynamic request token', 'const token = body.token', 0],
    ['dynamic token hash', 'const tokenHash = hashToken(token)', 0],
    ['generated invitation token', "const token = randomBytes(32).toString('hex')", 0],
    ['sql token comparison', 'where wi.token_hash = lower(p_token_hash)', 0],
    ['local postgres test password', 'POSTGRES_PASSWORD: postgres', 0],
    ['local anon test key', 'NEXT_PUBLIC_SUPABASE_ANON_KEY: local-test-anon-key', 0],
    ['local service test key', 'SUPABASE_SERVICE_ROLE_KEY: local-test-service-key', 0],
    ['literal password', 'DATABASE_PASS' + 'WORD="literal-secret-12345"', 1],
    ['literal api key', 'api' + 'Key="literal-api-key-value"', 1],
    ['literal token', "const token = 'literal-secret-12345'", 1],
    ['literal bare service role key', 'SUPABASE_SERVICE_ROLE_KEY: real-service-role-key', 1],
    ['github token signature', 'value=' + 'gh' + 'p_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ1234', 1],
    ['vault literal secret', "SELECT vault.create_" + "secret('0123456789abcdef0123', 'some_api_key');", 1],
    ['vault literal on update', "SELECT vault.update_" + "secret(v_id, '0123456789abcdef0123', 'some_api_key');", 1],
    ['vault secret from a reference', "SELECT vault.create_secret(current_setting('app.k'), 'some_api_key');", 0],
    ['vault secret from a subselect', 'SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name=$1), v_new)', 0],
    ['vault secret read, not write', "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'adzuna_app_key'", 0],
    ['vault rotation doc placeholder', "//   SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name='GITHUB_PAT'), 'new_token_here');", 0],
    // Database URLs: a literal password still fails; an interpolated one does not.
    //
    // The scheme is split for the same reason 'DATABASE_PASS' + 'WORD' and
    // 'gh' + 'p_...' are split above: this file is itself a changed file on any
    // PR that touches it, and a contiguous literal here makes the scanner flag
    // its own fixture. It did exactly that on the first push of this change.
    // Concatenation keeps the runtime string matchable while the source is not.
    ['db url with literal password', 'DB_URL="postgres' + 'ql://postgres:hunter2secret@db.example.com:5432/postgres"', 1],
    ['db url from shell variables', 'DB_URL="postgresql://${PGUSER}:${ENCODED_PASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"', 0],
    ['db url from a bare shell variable', 'DB_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:5432/postgres"', 0],
    ['db url from a github expression', 'DB_URL="postgresql://user:${{ secrets.DB_PASSWORD }}@host:5432/postgres"', 0],
    ['password from a command substitution', 'ENCODED_PASS' + 'WORD=$(python3 -c "print(1)")', 0],
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

// Every ordinary PR scan proves the scanner still blocks representative literal
// credentials before evaluating repository changes. This prevents a false-positive
// repair from silently weakening the real-secret detection contract.
runSelfTest();

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
  console.error('Allowed: environment/GitHub secret references, PostgreSQL ACL evidence, known isolated local-test placeholders, generated isolated test credentials, request-body references, and computed references.');
  console.error('Blocked: raw token/key/password values, private keys, JWT-looking secrets, credential-bearing database URLs and vault secret literals.');
  process.exit(1);
}

console.log('GO: no committed secret-looking values detected.');
