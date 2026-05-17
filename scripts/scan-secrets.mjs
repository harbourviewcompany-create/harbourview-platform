import { execSync } from 'node:child_process';

const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const patterns = [
  /AKIA[0-9A-Z]{16}/g,
  /(?:xoxb|xoxp|xoxa)-[0-9A-Za-z-]{10,}/g,
  /sk_(live|test)_[0-9a-zA-Z]{16,}/g,
  /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/g,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"]?[A-Za-z0-9._-]{20,}/g,
];
const allow = ['.env.example'];
const allowPatterns = [/\.example$/, /^deploy\/env\//, /^scripts\/self-host\//];
let hits = [];
for (const f of files) {
  if (allow.includes(f) || allowPatterns.some((pattern) => pattern.test(f))) continue;
  let content='';
  try { content = execSync(`cat ${JSON.stringify(f)}`, { encoding:'utf8', stdio:['ignore','pipe','ignore']}); } catch { continue; }
  patterns.forEach((p)=>{ if (p.test(content)) hits.push(`${f}: ${p}`); p.lastIndex=0;});
}
if (hits.length) {
  console.error('Potential secrets detected:\n'+hits.join('\n'));
  process.exit(1);
}
console.log(`PASS: scanned ${files.length} tracked files for deterministic secret patterns.`);
