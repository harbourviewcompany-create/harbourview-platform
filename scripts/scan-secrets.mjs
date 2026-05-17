import { execSync } from 'node:child_process';

const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const secretPatterns = [
  { name: 'Supabase service role key', pattern: /sb_secret_[a-zA-Z0-9]{20,}/g },
  { name: 'Generic API key assignment', pattern: /(api[_-]?key|secret|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{24,}['\"]/gi },
  { name: 'Private key block', pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/g },
];

const allowedFiles = new Set(['.env.example']);
let failures = [];

for (const file of files) {
  if (allowedFiles.has(file)) continue;
  let content = '';
  try {
    content = execSync(`cat ${JSON.stringify(file)}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    continue;
  }
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) failures.push(`${name} in ${file}`);
  }
}

if (failures.length) {
  console.error('Secret scan failed:\n' + failures.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}

console.log(`ok secret scan passed on ${files.length} tracked files`);
