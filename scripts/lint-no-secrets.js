#!/usr/bin/env node
const fs=require('fs');const cp=require('child_process');
const files=cp.execSync("rg --files src app tests fixtures supabase/migrations docs 2>/dev/null || true",{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const rules=[/AIza[0-9A-Za-z\-_]{20,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/m, /gh[pousr]_[A-Za-z0-9_]{20,}/, /xox[baprs]-[A-Za-z0-9-]{10,}/];
const allow=["src/server/connectors/gemini/redaction.ts","scripts/lint-no-secrets.js"];
let bad=[];
for(const f of files){if(allow.includes(f)) continue;const t=fs.readFileSync(f,'utf8');for(const r of rules){if(r.test(t)){bad.push(f);break;}}}
if(bad.length){console.error('Secret-like patterns found:',bad);process.exit(1);}console.log('No secret patterns detected.');
