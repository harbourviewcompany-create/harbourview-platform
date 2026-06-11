import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_SOURCE_URL = 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html';
const IMPORT_DIR = process.env.HEALTH_CANADA_OPERATOR_IMPORT_DIR || 'data/private/health-canada';
const DRY_RUN = process.env.HEALTH_CANADA_OPERATOR_IMPORT_DRY_RUN === '1';

type Row = Record<string, string>;

const SHEETS = {
  rawRows: 'raw_source_rows',
  canonical: 'canonical_operators',
  sites: 'active_site_licences',
  outreach: 'outreach_ready_queue',
  exclusions: 'exclusions_revoked_expired_suspended',
  clusters: 'duplicate_second_site_clusters',
  holds: 'individual_name_verification_holds',
  conflicts: 'conflict_resolution_notes',
};

function normalize(value: string | undefined) {
  return (value || '').trim();
}

function normalizeName(value: string | undefined) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stableId(prefix: string, parts: Array<string | undefined>) {
  const basis = parts.map((part) => normalize(part).toLowerCase()).join('|');
  return `${prefix}_${createHash('sha256').update(basis).digest('hex').slice(0, 20)}`;
}

function parseCsv(content: string): Row[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header = [], ...body] = rows;
  return body
    .filter((line) => line.some((cell) => cell.trim()))
    .map((line) => Object.fromEntries(header.map((key, index) => [key.trim(), (line[index] || '').trim()])));
}

function findCsv(sheetName: string): string | null {
  if (!existsSync(IMPORT_DIR)) return null;
  const files = readdirSync(IMPORT_DIR);
  const exact = files.find((file) => file.toLowerCase() === `${sheetName}.csv`);
  const loose = files.find((file) => file.toLowerCase().includes(sheetName.toLowerCase()) && file.toLowerCase().endsWith('.csv'));
  return exact || loose ? join(IMPORT_DIR, exact || loose!) : null;
}

function readSheet(sheetName: string): Row[] {
  const path = findCsv(sheetName);
  if (!path) return [];
  return parseCsv(readFileSync(path, 'utf8'));
}

async function supabaseRequest(path: string, method: 'POST' | 'PATCH' = 'POST', body: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY. Import must run server-side only.');

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${path} failed ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

function rawPayload(row: Row) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== ''));
}

function mapRaw(row: Row, snapshotId: string, index: number) {
  const name = normalize(row.raw_company_name || row.company || row.Company || row.company_name || row.canonical_name);
  const province = normalize(row.province || row.Province || row.prov);
  const status = normalize(row.status || row.Status || 'active').toLowerCase().replace(/\s+/g, '_');
  const licenceClass = normalize(row.licence_class || row['Licence class'] || row.license_class);
  const authorizedClasses = normalize(row.authorized_classes || row['Authorized classes']);
  const website = normalize(row.website || row.Website);
  const phone = normalize(row.phone || row['Phone / contact'] || row.contact);
  const sourceRowId = normalize(row.source_row_id) || stableId('hcr_src', [name, province, status, licenceClass, authorizedClasses, website, phone, String(index)]);
  return {
    source_snapshot_id: snapshotId,
    source_row_id: sourceRowId,
    source_row_index: Number(row.source_row_index || index),
    raw_company_name: name,
    normalized_company_name: normalizeName(name),
    province,
    status: status || 'active',
    site_marker: normalize(row.site_marker),
    licence_class: licenceClass,
    authorized_classes: authorizedClasses,
    website,
    phone,
    raw_payload: rawPayload(row),
    row_hash: createHash('sha256').update(JSON.stringify(rawPayload(row))).digest('hex'),
  };
}

function mapCanonical(row: Row) {
  const name = normalize(row.canonical_name || row.company || row.Company || row.operator || row['Canonical operator']);
  const province = normalize(row.primary_province || row.province || row.Province);
  const track = normalize(row.track || row.Track || 'review_required').toLowerCase().replace(/[ /]+/g, '_');
  return {
    canonical_operator_id: normalize(row.canonical_operator_id) || stableId('hcr_op', [name, province]),
    canonical_name: name,
    normalized_name: normalizeName(name),
    primary_province: province,
    track,
    strategic_cluster: /strategic/i.test(track),
    medical_only: /medical_only/i.test(track),
    individual_name_hold: /individual/i.test(track),
    conflict_flag: /conflict/i.test(row.conflict_flag || row.notes || ''),
    outreach_ready: /^(yes|true|1)$/i.test(row.outreach_ready || ''),
    source_confidence: normalize(row.source_confidence) || 'transcript_reconciled_hold',
  };
}

function mapSite(row: Row) {
  const company = normalize(row.company_name || row.company || row.Company || row.canonical_name);
  const province = normalize(row.province || row.Province);
  const status = normalize(row.status || row.Status || 'active').toLowerCase().replace(/\s+/g, '_');
  const licenceClass = normalize(row.licence_class || row['Licence class']);
  return {
    site_id: normalize(row.site_id) || stableId('hcr_site', [company, province, status, row.site_marker, licenceClass]),
    canonical_operator_id: normalize(row.canonical_operator_id) || stableId('hcr_op', [company, province]),
    source_row_id: normalize(row.source_row_id) || null,
    company_name: company,
    province,
    status,
    site_marker: normalize(row.site_marker),
    licence_class: licenceClass,
    authorized_classes: normalize(row.authorized_classes || row['Authorized classes']),
    website: normalize(row.website || row.Website),
    phone: normalize(row.phone || row['Phone / contact']),
    track: normalize(row.track || row.Track || 'review_required').toLowerCase().replace(/[ /]+/g, '_'),
    outreach_ready: /^(yes|true|1)$/i.test(row.outreach_ready || ''),
    evidence_type: normalize(row.evidence_type),
    review_required: /^(yes|true|1)$/i.test(row.review_required || ''),
  };
}

async function upsert(table: string, rows: unknown[], conflictKey: string) {
  if (!rows.length) return [];
  if (DRY_RUN) {
    console.log(`[dry-run] ${table}: ${rows.length} rows`);
    return rows;
  }
  return supabaseRequest(`${table}?on_conflict=${conflictKey}`, 'POST', rows);
}

async function main() {
  if (!existsSync(IMPORT_DIR)) {
    throw new Error(`Import directory not found: ${IMPORT_DIR}. Place CSV exports from the workbook there. XLSX must be exported to CSV sheets for dependency-free CI import.`);
  }

  const rawRows = readSheet(SHEETS.rawRows);
  const canonicalRows = readSheet(SHEETS.canonical);
  const siteRows = readSheet(SHEETS.sites);
  const outreachRows = readSheet(SHEETS.outreach);
  const exclusionRows = readSheet(SHEETS.exclusions);
  const clusterRows = readSheet(SHEETS.clusters);
  const holdRows = readSheet(SHEETS.holds);
  const conflictRows = readSheet(SHEETS.conflicts);

  const snapshot = {
    source_name: 'Health Canada licensed cannabis cultivators, processors and sellers',
    source_url: DEFAULT_SOURCE_URL,
    source_confidence: process.env.HEALTH_CANADA_SOURCE_CONFIDENCE || 'transcript_reconciled_hold',
    source_package_name: process.env.HEALTH_CANADA_SOURCE_PACKAGE || 'staged-csv-package',
    row_count: rawRows.length || siteRows.length,
  };

  const [createdSnapshot] = DRY_RUN
    ? [{ id: 'dry-run-source-snapshot' }]
    : await supabaseRequest('health_canada_source_snapshots', 'POST', [snapshot]);
  const snapshotId = createdSnapshot.id;

  await upsert('health_canada_raw_source_rows', rawRows.map((row, index) => mapRaw(row, snapshotId, index + 1)), 'source_row_id');
  await upsert('canadian_operator_canonical', canonicalRows.map(mapCanonical), 'canonical_operator_id');
  await upsert('canadian_operator_licence_sites', siteRows.map(mapSite), 'site_id');

  await upsert('canadian_operator_outreach_queue', outreachRows.map((row, index) => ({
    outreach_queue_id: normalize(row.outreach_queue_id) || stableId('hcr_outreach', [row.canonical_operator_id, row.site_id, row.company, String(index)]),
    canonical_operator_id: normalize(row.canonical_operator_id) || stableId('hcr_op', [row.operator || row.company || row.Company, row.province]),
    site_id: normalize(row.site_id) || stableId('hcr_site', [row.operator || row.company || row.Company, row.province, 'active', '', row.track]),
    send_order: Number(row.send_order || row['#'] || index + 1),
    queue_version: normalize(row.queue_version) || 'health-canada-initial',
    track: normalize(row.track || row.Track || 'review_required').toLowerCase().replace(/[ /]+/g, '_'),
    province: normalize(row.province || row.Province),
    evidence_type: normalize(row.evidence_type || row.Evidence || 'permitted_contact_evidence'),
    website: normalize(row.website || row.Website),
    phone: normalize(row.phone || row['Phone / contact']),
    first_contact_note: normalize(row.first_contact_note || row['First-contact note'] || row.notes),
    outreach_ready: true,
  })), 'outreach_queue_id');

  await upsert('canadian_operator_exclusions', exclusionRows.map((row, index) => ({
    exclusion_id: normalize(row.exclusion_id) || stableId('hcr_excl', [row.company || row.Company, row.status || row.Status, String(index)]),
    canonical_operator_id: normalize(row.canonical_operator_id) || null,
    source_row_id: normalize(row.source_row_id) || null,
    company_name: normalize(row.company || row.Company || row.company_name),
    province: normalize(row.province || row.Province),
    status: normalize(row.status || row.Status).toLowerCase().replace(/\s+/g, '_'),
    exclusion_reason: normalize(row.exclusion_reason || row.Action || row.notes) || 'No outreach status from Health Canada source',
    outreach_ready: false,
    raw_payload: rawPayload(row),
  })), 'exclusion_id');

  await upsert('canadian_operator_duplicate_clusters', clusterRows.map((row, index) => ({
    cluster_id: normalize(row.cluster_id) || stableId('hcr_cluster', [row.entity || row.company || row.Company, row.flag || row.cluster_type]),
    canonical_operator_id: normalize(row.canonical_operator_id) || null,
    site_id: normalize(row.site_id) || null,
    cluster_type: normalize(row.cluster_type || row.flag || 'review_required').toLowerCase().replace(/[ /]+/g, '_'),
    member_label: normalize(row.member_label || row.entity || row.company || `member-${index + 1}`),
    notes: normalize(row.notes || row.action),
    review_required: true,
  })), 'cluster_id,member_label');

  await upsert('canadian_operator_individual_holds', holdRows.map((row, index) => ({
    hold_id: normalize(row.hold_id) || stableId('hcr_hold', [row.name || row.individual_name || row.company, String(index)]),
    canonical_operator_id: normalize(row.canonical_operator_id) || null,
    source_row_id: normalize(row.source_row_id) || null,
    individual_name: normalize(row.individual_name || row.name || row.company),
    province: normalize(row.province || row.Province),
    status: normalize(row.status || row.Status || 'active').toLowerCase().replace(/\s+/g, '_'),
    verification_status: normalize(row.verification_status) || 'business_identity_required',
    outreach_ready: false,
    notes: normalize(row.notes),
  })), 'hold_id');

  await upsert('canadian_operator_conflicts', conflictRows.map((row, index) => ({
    conflict_id: normalize(row.conflict_id) || stableId('hcr_conflict', [row.entity || row.company || row.Company, row.conflict_type || row.notes, String(index)]),
    canonical_operator_id: normalize(row.canonical_operator_id) || null,
    site_id: normalize(row.site_id) || null,
    source_row_id: normalize(row.source_row_id) || null,
    conflict_type: normalize(row.conflict_type || 'review_required').toLowerCase().replace(/[ /]+/g, '_'),
    conflict_status: normalize(row.conflict_status || 'open'),
    notes: normalize(row.notes || row.action || row.entity || 'Review required'),
  })), 'conflict_id');

  console.log('ok Health Canada operator registry import completed', {
    raw_rows: rawRows.length,
    canonical: canonicalRows.length,
    sites: siteRows.length,
    outreach: outreachRows.length,
    exclusions: exclusionRows.length,
    clusters: clusterRows.length,
    holds: holdRows.length,
    conflicts: conflictRows.length,
    dry_run: DRY_RUN,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
