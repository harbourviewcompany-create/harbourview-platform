#!/usr/bin/env python3
from pathlib import Path
import hashlib
import json
import sys
import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[2]
CANONICAL = ROOT / 'docs/control/global-regulatory-os/canonical'
SOURCE_DIR = ROOT / 'docs/control/global-regulatory-os/source'
SOURCE_ARCHIVE = SOURCE_DIR / 'global-cannabis-regulatory-os-control-pack-v1.0.zip'
SOURCE_CHECKSUM = SOURCE_DIR / 'global-cannabis-regulatory-os-control-pack-v1.0.zip.sha256'
EXPECTED_SOURCE_SHA256 = '33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136'
errors: list[str] = []


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'{path.relative_to(ROOT)}: {exc}')
        return {}


# A checksum string cannot authenticate absent source bytes. The controlling ZIP
# must be present and hashed directly before this package can claim provenance.
if not SOURCE_CHECKSUM.exists():
    errors.append('source control-pack checksum file missing')
else:
    recorded = SOURCE_CHECKSUM.read_text(encoding='utf-8').split()[0]
    if recorded != EXPECTED_SOURCE_SHA256:
        errors.append(f'source control-pack checksum mismatch: {recorded}')

if not SOURCE_ARCHIVE.exists():
    errors.append(
        'controlling source archive bytes missing: '
        'docs/control/global-regulatory-os/source/global-cannabis-regulatory-os-control-pack-v1.0.zip'
    )
else:
    actual = hashlib.sha256(SOURCE_ARCHIVE.read_bytes()).hexdigest()
    if actual != EXPECTED_SOURCE_SHA256:
        errors.append(f'controlling source archive SHA-256 mismatch: {actual}')

jurisdiction_index = load_json(ROOT / 'config/global-reg-os/jurisdictions.v1.json')
jurisdictions = []
for part in jurisdiction_index.get('parts', []):
    jurisdictions.extend(load_json(ROOT / 'config/global-reg-os' / part['file']).get('jurisdictions', []))
iso = [item for item in jurisdictions if item.get('iso_alpha2')]
if len(iso) != 249:
    errors.append(f'jurisdiction universe expected 249 ISO entries, got {len(iso)}')
if len({item['iso_alpha2'] for item in iso}) != 249:
    errors.append('duplicate ISO alpha-2 jurisdiction')

required_registries = [
    'source-taxonomy.v1.json',
    'product-substance-ontology.v1.json',
    'activity-licence-facility-ontology.v1.json',
    'truth-classes.v1.json',
    'data-classification-retention.v1.json',
    'service-boundaries.v1.json',
    'phase0-proof-matrix.v1.json',
]
for name in required_registries:
    load_json(ROOT / 'config/global-reg-os' / name)

proof = load_json(ROOT / 'config/global-reg-os/phase0-proof-matrix.v1.json')
tickets = proof.get('tickets', [])
actual_ticket_ids = {item.get('ticket_id') for item in tickets}
expected_ticket_ids = {f'P0-{number:03d}' for number in range(1, 13)}
if actual_ticket_ids != expected_ticket_ids:
    errors.append(
        f'Phase 0 ticket coverage mismatch: missing={sorted(expected_ticket_ids - actual_ticket_ids)}, '
        f'extra={sorted(actual_ticket_ids - expected_ticket_ids)}'
    )

accepted_statuses = {'accepted', 'verified', 'complete', 'completed'}
for ticket in tickets:
    ticket_id = ticket.get('ticket_id', '<unknown>')
    status = str(ticket.get('status', '')).strip().lower()
    if status not in accepted_statuses:
        errors.append(f'{ticket_id}: proof status is not accepted/verified: {status or "missing"}')
    artifacts = ticket.get('artifact_paths') or ticket.get('artifacts') or ticket.get('evidence_paths') or []
    if not isinstance(artifacts, list) or not artifacts:
        errors.append(f'{ticket_id}: no proof artifact paths recorded')
        continue
    for artifact in artifacts:
        relative = artifact.get('path') if isinstance(artifact, dict) else artifact
        if not isinstance(relative, str) or not relative.strip():
            errors.append(f'{ticket_id}: malformed proof artifact reference')
            continue
        candidate = (ROOT / relative).resolve()
        try:
            candidate.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f'{ticket_id}: proof artifact escapes repository: {relative}')
            continue
        if not candidate.is_file():
            errors.append(f'{ticket_id}: proof artifact missing: {relative}')

migrations = sorted((CANONICAL / 'db/migrations').glob('*.sql'))
if len(migrations) != 13:
    errors.append(f'canonical control pack expected 13 migrations, got {len(migrations)}')
for migration in migrations:
    text = migration.read_text(encoding='utf-8')
    if 'BEGIN;' not in text or 'COMMIT;' not in text:
        errors.append(f'{migration.name}: migration transaction wrapper missing')

schemas = sorted((CANONICAL / 'schemas/json').glob('*.json'))
if len(schemas) != 7:
    errors.append(f'canonical control pack expected 7 JSON Schemas, got {len(schemas)}')
for schema in schemas:
    try:
        Draft202012Validator.check_schema(load_json(schema))
    except Exception as exc:
        errors.append(f'{schema.name}: invalid JSON Schema: {exc}')

for relative in ['api/openapi.yaml', 'events/asyncapi.yaml']:
    path = CANONICAL / relative
    try:
        document = yaml.safe_load(path.read_text(encoding='utf-8'))
        if not isinstance(document, dict):
            raise ValueError('document is not an object')
    except Exception as exc:
        errors.append(f'{relative}: {exc}')

# Produce a deterministic inventory digest for evidence without treating it as a
# source archive replacement. Patched canonical files still require a regenerated
# and independently validated manifest before technical GO.
inventory = []
for path in sorted(CANONICAL.rglob('*')):
    if path.is_file():
        inventory.append(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.relative_to(CANONICAL)}')
inventory_digest = hashlib.sha256(('\n'.join(inventory) + '\n').encode()).hexdigest()

if errors:
    print('\n'.join(f'ERROR: {error}' for error in errors))
    print(f'Canonical materialized inventory SHA-256: {inventory_digest}')
    sys.exit(1)

print(f'Verified controlling source archive SHA-256: {EXPECTED_SOURCE_SHA256}')
print(f'Canonical materialized inventory SHA-256: {inventory_digest}')
print('Phase 0 registries, jurisdiction universe, accepted proof artifacts, 13 migrations, JSON Schemas, OpenAPI and AsyncAPI structural validation passed.')
