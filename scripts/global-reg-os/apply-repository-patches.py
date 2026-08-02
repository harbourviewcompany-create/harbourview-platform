#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OPENAPI = ROOT / 'docs/control/global-regulatory-os/canonical/api/openapi.yaml'
GRANTS_MIGRATION = ROOT / 'docs/control/global-regulatory-os/canonical/db/migrations/0013_database_roles_and_grants.sql'
SCOPES = [
    'read:intelligence',
    'read:sources',
    'write:sources',
    'execute:acquisition',
    'read:evidence',
    'read:obligations',
    'execute:applicability',
    'read:registry',
    'read:counterparties',
    'write:corridors',
    'execute:corridors',
    'read:corridors',
    'read:markets',
    'read:alerts',
]
OPERATION_SUMMARIES = {
    'listJurisdictions': 'List jurisdictions',
    'getJurisdiction': 'Get a jurisdiction',
    'listSources': 'List regulatory sources',
    'createSource': 'Register a regulatory source',
    'requestAcquisition': 'Request source acquisition',
    'listDocuments': 'List evidence documents',
    'getClaimWithLineage': 'Get a claim with evidence lineage',
    'listRegulatoryChanges': 'List regulatory changes',
    'listObligations': 'List regulatory obligations',
    'evaluateApplicability': 'Evaluate obligation applicability',
    'searchEntities': 'Search registry entities',
    'getCounterpartyProfile': 'Get a counterparty profile',
    'createCorridor': 'Create a market-access corridor',
    'evaluateCorridor': 'Evaluate a market-access corridor',
    'getCorridorDetermination': 'Get a corridor determination',
    'listMetricDefinitions': 'List market metric definitions',
    'listMarketObservations': 'List market observations',
    'listAlerts': 'List intelligence alerts',
}
TAG_DESCRIPTIONS = {
    'Jurisdictions': 'Global jurisdictions, authorities and coverage state.',
    'Sources': 'Official, licensed and manually governed regulatory sources.',
    'Evidence': 'Documents, claims, citations and provenance lineage.',
    'Regulatory': 'Normalized legal instruments, provisions and detected changes.',
    'Compliance': 'Obligations, applicability decisions and operational controls.',
    'Registry': 'Entities, licences, facilities and counterparty intelligence.',
    'Trade': 'Market-entry corridors, gates and determinations.',
    'Markets': 'Canonical metric definitions and sourced market observations.',
    'Workflow': 'Alerts, assignments and intelligence workflow state.',
}


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'Expected repository patch target not found: {label}')
    return text.replace(old, new, 1)


openapi = OPENAPI.read_text(encoding='utf-8')
if '  license:\n    name: Harbourview Proprietary\n' not in openapi:
    openapi = replace_once(
        openapi,
        'servers:\n',
        '  license:\n    name: Harbourview Proprietary\n    identifier: LicenseRef-Harbourview-Proprietary\nservers:\n',
        'OpenAPI licence metadata',
    )
elif '    identifier: LicenseRef-Harbourview-Proprietary\n' not in openapi:
    openapi = replace_once(
        openapi,
        '  license:\n    name: Harbourview Proprietary\n',
        '  license:\n    name: Harbourview Proprietary\n    identifier: LicenseRef-Harbourview-Proprietary\n',
        'OpenAPI proprietary licence identifier',
    )
openapi = replace_once(
    openapi,
    '  - url: https://api.example.invalid/v1',
    '  - url: /v1',
    'OpenAPI relative server URL',
)
openapi = replace_once(
    openapi,
    '          tokenUrl: https://identity.example.invalid/oauth/token',
    '          tokenUrl: /oauth/token',
    'OpenAPI relative OAuth token URL',
)
for scope in SCOPES:
    unquoted = f'            {scope}:'
    quoted = f"            '{scope}':"
    if quoted in openapi:
        continue
    if unquoted not in openapi:
        raise SystemExit(f'Expected OAuth scope line not found: {scope}')
    openapi = openapi.replace(unquoted, quoted, 1)
for tag, description in TAG_DESCRIPTIONS.items():
    marker = f'  - name: {tag}\n'
    replacement = f'  - name: {tag}\n    description: {description}\n'
    if replacement in openapi:
        continue
    openapi = replace_once(openapi, marker, replacement, f'OpenAPI tag description: {tag}')
for operation_id, summary in OPERATION_SUMMARIES.items():
    marker = f'      operationId: {operation_id}\n'
    replacement = f'      operationId: {operation_id}\n      summary: {summary}\n'
    if replacement in openapi:
        continue
    openapi = replace_once(openapi, marker, replacement, f'OpenAPI operation summary: {operation_id}')
webhook_marker = '    post:\n      requestBody:'
webhook_replacement = '    post:\n      summary: Receive an approved regulatory-change event\n      requestBody:'
if webhook_replacement not in openapi:
    openapi = replace_once(openapi, webhook_marker, webhook_replacement, 'OpenAPI webhook summary')
OPENAPI.write_text(openapi, encoding='utf-8')

migration = GRANTS_MIGRATION.read_text(encoding='utf-8')
old_grant_block = """REVOKE ALL ON ALL SEQUENCES IN SCHEMA iam,billing,geo,source_ops,evidence,ontology,regulatory,compliance,registry,trade,market,workflow,ai,governance,publication FROM PUBLIC;

GRANT USAGE ON SCHEMA public_api TO hv_public_runtime;"""
new_grant_block = """REVOKE ALL ON ALL SEQUENCES IN SCHEMA iam,billing,geo,source_ops,evidence,ontology,regulatory,compliance,registry,trade,market,workflow,ai,governance,publication FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;

-- Runtime identities must be able to resolve and execute the request-context and
-- authorization helpers referenced by RLS policies. Public access remains denied.
GRANT USAGE ON SCHEMA app TO hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime;

GRANT USAGE ON SCHEMA public_api TO hv_public_runtime;"""
migration = replace_once(
    migration,
    old_grant_block,
    new_grant_block,
    'application authorization helper grants',
)
migration = replace_once(
    migration,
    'ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;\n',
    'ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;\nALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;\n',
    'application helper default privileges',
)
GRANTS_MIGRATION.write_text(migration, encoding='utf-8')

print('Applied repository patches: complete OpenAPI metadata and operation summaries; explicit app-schema authorization-helper grants.')
