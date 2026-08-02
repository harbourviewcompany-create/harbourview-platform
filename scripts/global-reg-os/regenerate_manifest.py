#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CANONICAL = ROOT / 'docs/control/global-regulatory-os/canonical'
SOURCE = ROOT / 'docs/control/global-regulatory-os/source/global-cannabis-regulatory-os-control-pack-v1.0.zip'
SOURCE_SHA = '33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136'
manifest_path = CANONICAL / 'MANIFEST.json'
source_manifest = json.loads(__import__('zipfile').ZipFile(SOURCE).read('global-cannabis-regulatory-os-control-pack-v1.0/MANIFEST.json'))
source_hashes = {x['path']: x['sha256'] for x in source_manifest['files']}
files=[]
for path in sorted(CANONICAL.rglob('*')):
    if not path.is_file() or path == manifest_path:
        continue
    rel=path.relative_to(CANONICAL).as_posix()
    data=path.read_bytes()
    digest=hashlib.sha256(data).hexdigest()
    if rel not in source_hashes:
        origin='added'
    elif source_hashes[rel] == digest:
        origin='source_unchanged'
    else:
        origin='source_patched'
    files.append({'path':rel,'bytes':len(data),'sha256':digest,'origin':origin,'source_sha256':source_hashes.get(rel)})
manifest={
 'name':'global-cannabis-regulatory-os-control-pack',
 'version':'1.0.1-harbourview-phase0',
 'architecture_date':'2026-07-31',
 'materialization_date':'2026-08-02',
 'status':'technical_go_operator_hold',
 'source_archive_sha256':SOURCE_SHA,
 'source_manifest_sha256':hashlib.sha256(__import__('zipfile').ZipFile(SOURCE).read('global-cannabis-regulatory-os-control-pack-v1.0/MANIFEST.json')).hexdigest(),
 'manifest_excludes':['MANIFEST.json'],
 'counts':{
   'files':len(files)+1,
   'migrations':len(list((CANONICAL/'db/migrations').glob('*.sql'))),
   'json_schemas':len(list((CANONICAL/'schemas/json').glob('*.json'))),
   'proof_tickets':12,
   'jurisdictions':249
 },
 'files':files
}
manifest_path.write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n',encoding='utf-8')
print(f"Regenerated {manifest_path} with {len(files)} tracked files")
