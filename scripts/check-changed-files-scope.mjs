import { execFileSync } from 'node:child_process';

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
const profile = args.get('profile') || process.env.SCOPE_PROFILE || 'low-friction-control';

const allowedByProfile = {
  'low-friction-control': new Set([
    '.github/pull_request_template.md',
    'docs/control/VERIFICATION_PLAN.md',
    'scripts/check-no-secret-strings.mjs',
    'scripts/check-changed-files-scope.mjs',
    '.github/workflows/low-friction-branch-verification.yml',
    '.github/workflows/preview-verification.yml',
    '.github/workflows/protected-production-smoke.yml',
    '.github/workflows/post-merge-verification.yml',
  ]),
};

function runGit(gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function changedFiles(baseRef, headRef) {
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

if (!allowedByProfile[profile]) {
  console.error(`Unknown scope profile: ${profile}`);
  console.error(`Known profiles: ${Object.keys(allowedByProfile).join(', ')}`);
  process.exit(1);
}

const files = changedFiles(base, head);
const allowed = allowedByProfile[profile];
const disallowed = files.filter((file) => !allowed.has(file));

console.log('Changed-file scope check');
console.log(`Profile: ${profile}`);
console.log(`Base: ${base}`);
console.log(`Head: ${head}`);

if (files.length === 0) {
  console.log('Changed files: none');
} else {
  console.log('Changed files:');
  for (const file of files) console.log(`- ${file}`);
}

if (disallowed.length > 0) {
  console.error('');
  console.error('HOLD: changed files outside the allowed control-only scope:');
  for (const file of disallowed) console.error(`- ${file}`);
  process.exit(1);
}

console.log('GO: changed files are inside the allowed control-only scope.');
