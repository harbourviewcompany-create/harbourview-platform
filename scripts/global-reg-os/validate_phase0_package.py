#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re, sys, tempfile, zipfile
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator

ROOT=Path(__file__).resolve().parents[2]
WRAPPER=ROOT/'docs/control/global-regulatory-os'
CANONICAL=WRAPPER/'canonical'
SOURCE=WRAPPER/'source/global-cannabis-regulatory-os-control-pack-v1.0.zip'
EXPECTED='33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136'
errors=[]
def err(msg): errors.append(msg)
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()

if not SOURCE.is_file(): err('controlling source archive missing')
elif digest(SOURCE)!=EXPECTED: err(f'controlling source archive SHA mismatch: {digest(SOURCE)}')

source_hashes={}
if SOURCE.is_file():
  with zipfile.ZipFile(SOURCE) as z:
    for info in z.infolist():
      p=Path(info.filename)
      if p.is_absolute() or '..' in p.parts: err(f'unsafe archive path: {info.filename}')
    try:
      sm=json.loads(z.read('global-cannabis-regulatory-os-control-pack-v1.0/MANIFEST.json'))
      source_hashes={x['path']:x['sha256'] for x in sm['files']}
      for rel,expected in source_hashes.items():
        data=z.read('global-cannabis-regulatory-os-control-pack-v1.0/'+rel)
        if hashlib.sha256(data).hexdigest()!=expected: err(f'source manifest mismatch: {rel}')
    except Exception as e: err(f'source manifest validation failed: {e}')

manifest_path=CANONICAL/'MANIFEST.json'
try:
  manifest=json.loads(manifest_path.read_text())
  if manifest.get('source_archive_sha256')!=EXPECTED: err('canonical manifest source SHA mismatch')
  listed={x['path']:x for x in manifest.get('files',[])}
  actual={p.relative_to(CANONICAL).as_posix():p for p in CANONICAL.rglob('*') if p.is_file() and p!=manifest_path}
  if set(listed)!=set(actual): err(f'manifest file set mismatch missing={sorted(set(actual)-set(listed))} extra={sorted(set(listed)-set(actual))}')
  for rel,p in actual.items():
    if listed[rel]['sha256']!=digest(p) or listed[rel]['bytes']!=p.stat().st_size: err(f'manifest hash/size mismatch: {rel}')
    source_hash=source_hashes.get(rel)
    expected_origin='added' if source_hash is None else ('source_unchanged' if source_hash==digest(p) else 'source_patched')
    if listed[rel].get('origin')!=expected_origin: err(f'manifest origin mismatch: {rel}')
except Exception as e: err(f'canonical manifest invalid: {e}')

try:
  proof=json.loads((CANONICAL/'ops/PHASE0_PROOF_MATRIX.json').read_text())
  schema=json.loads((CANONICAL/'schemas/json/phase0-proof-matrix.schema.json').read_text())
  for e in Draft202012Validator(schema).iter_errors(proof): err(f'proof schema: {e.message}')
  ids={x['ticket_id'] for x in proof['tickets']}
  expected_ids={f'P0-{i:03d}' for i in range(1,13)}
  if ids!=expected_ids: err(f'proof ticket IDs mismatch: {ids ^ expected_ids}')
  for t in proof['tickets']:
    if t['status']!='verified': err(f"{t['ticket_id']} not verified")
    for rel in t['artifact_paths']:
      if not (CANONICAL/rel).is_file(): err(f"{t['ticket_id']} missing artifact: {rel}")
except Exception as e: err(f'proof matrix invalid: {e}')

try:
  j=json.loads((CANONICAL/'registries/jurisdictions.v1.json').read_text())
  rows=j['records']; a2={r['alpha2'] for r in rows}; a3={r['alpha3'] for r in rows}; nums={r['numeric'] for r in rows}
  if len(rows)!=249 or len(a2)!=249 or len(a3)!=249 or len(nums)!=249: err('jurisdiction universe must contain 249 unique ISO records')
  for required in ['CA','US','DE','JP','AU','ZA','UY','TH','AX','HK','PR']:
    if required not in a2: err(f'missing jurisdiction fixture {required}')
except Exception as e: err(f'jurisdiction registry invalid: {e}')

for rel in ['registries/source-taxonomy.v1.json','registries/product-substance-ontology.v1.json','registries/activity-licence-facility-ontology.v1.json','registries/representative-archetypes.v1.json','events/event-types.json']:
  try: json.loads((CANONICAL/rel).read_text())
  except Exception as e: err(f'{rel}: {e}')

for p in sorted((CANONICAL/'schemas/json').glob('*.json')):
  try:
    obj=json.loads(p.read_text()); Draft202012Validator.check_schema(obj)
  except Exception as e: err(f'JSON Schema invalid {p.name}: {e}')
for rel in ['api/openapi.yaml','events/asyncapi.yaml']:
  try:
    obj=yaml.safe_load((CANONICAL/rel).read_text())
    if not isinstance(obj,dict): raise ValueError('root not mapping')
  except Exception as e: err(f'YAML invalid {rel}: {e}')

migrations='\n'.join(p.read_text() for p in sorted((CANONICAL/'db/migrations').glob('*.sql')))
for forbidden in ["current_setting('app.subject_id'", "current_setting('app.tenant_id'", "current_setting('app.platform_roles'"]:
  if forbidden in migrations: err(f'forgeable identity source remains: {forbidden}')
for required in ['app.trusted_request_context','app.set_trusted_request_context','hv_context_owner','hv_authenticator','pg_current_xact_id']:
  if required not in migrations: err(f'trusted context control missing: {required}')
if len(list((CANONICAL/'db/migrations').glob('*.sql')))!=13: err('expected exactly 13 canonical migrations')
if list(ROOT.glob('supabase/migrations/*global*reg*os*')): err('canonical migrations leaked into active Supabase migration path')

if errors:
  print('\n'.join('ERROR: '+x for x in errors)); sys.exit(1)
print(f'PASS: source archive {EXPECTED}')
print('PASS: regenerated canonical manifest and source-to-canonical origin map')
print('PASS: 12 verified Phase 0 tickets with existing evidence paths')
print('PASS: 249 unique ISO country/territory records')
print('PASS: trusted non-GUC authorization controls and isolated 13-migration package')
