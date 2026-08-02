#!/usr/bin/env python3
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[2]/'docs/control/global-regulatory-os'
patterns={
 'private_key':re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'github_token':re.compile(r'gh[pousr]_[A-Za-z0-9_]{20,}'),
 'openai_key':re.compile(r'sk-(?:proj-)?[A-Za-z0-9_-]{20,}'),
 'supabase_service_key':re.compile(r'eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}')
}
errors=[]
for p in ROOT.rglob('*'):
 if not p.is_file() or p.suffix=='.zip': continue
 try: text=p.read_text(errors='ignore')
 except Exception: continue
 for name,pat in patterns.items():
  if pat.search(text): errors.append(f'{name}: {p.relative_to(ROOT)}')
if errors:
 print('\n'.join(errors)); sys.exit(1)
print('PASS: no secret-like values in Global Regulatory OS package')
