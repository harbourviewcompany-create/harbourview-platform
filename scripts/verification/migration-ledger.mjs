#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const migrationDir = process.env.MIGRATION_DIR || 'supabase/migrations';
const outputDir = process.env.LEDGER_OUTPUT_DIR || 'release-evidence';
const remoteFile = process.env.SUPABASE_MIGRATIONS_JSON;
const canonicalHashFile = process.env.CANONICAL_MIGRATION_HASHES_JSON;

function uniqueByVersion(rows, source) {
  const map = new Map();
  for (const row of rows) {
    const version = String(row.version || '');
    if (!/^\d{14}$/.test(version)) throw new Error(`${source} contains invalid migration version: ${version || '<missing>'}`);
    if (map.has(version)) throw new Error(`${source} contains duplicate migration version ${version}`);
    map.set(version, row);
  }
  return map;
}

const files = (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort();
const local = [];
for (const filename of files) {
  // Existing repository migration names contain underscores and hyphens. Keep
  // the version strict while accepting the already-established name alphabet.
  const match = filename.match(/^(\d{14})_([A-Za-z0-9_-]+)\.sql$/);
  if (!match) throw new Error(`Invalid migration filename: ${filename}`);
  const sql = await readFile(path.join(migrationDir, filename), 'utf8');
  const normalized = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/;+/g, ';');
  local.push({
    version: match[1],
    name: match[2],
    filename,
    sha256: createHash('sha256').update(sql).digest('hex'),
    bytes: Buffer.byteLength(sql),
    stub: /^(select\s+1\s*;?|begin\s*;?\s*commit\s*;?)$/i.test(normalized),
  });
}

async function loadRows(file, source, required = false) {
  if (!file) {
    if (required) throw new Error(`${source} file is required`);
    return [];
  }
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  if (parsed && !Array.isArray(parsed) && parsed.error) throw new Error(`${source} contains an error response`);
  const rows = Array.isArray(parsed) ? parsed : parsed?.migrations;
  if (!Array.isArray(rows)) throw new Error(`${source} must be an array or { migrations: [] }`);
  for (const row of rows) {
    if (typeof row.name !== 'string' || !row.name) throw new Error(`${source} contains a row without a name`);
  }
  return rows.map((row) => ({ ...row, version: String(row.version), name: String(row.name) }));
}

const remote = await loadRows(remoteFile, 'remote ledger', true);
const canonicalHashes = await loadRows(canonicalHashFile, 'canonical hash ledger');
const localByVersion = uniqueByVersion(local, 'local ledger');
const remoteByVersion = uniqueByVersion(remote, 'remote ledger');
const canonicalByVersion = uniqueByVersion(canonicalHashes, 'canonical hash ledger');
const versions = [...new Set([...localByVersion.keys(), ...remoteByVersion.keys()])].sort();

const comparison = versions.map((version) => {
  const l = localByVersion.get(version);
  const r = remoteByVersion.get(version);
  const canonical = canonicalByVersion.get(version);
  let classification = 'version-name-match-body-unverified';
  if (!l) classification = 'remote-only';
  else if (!r) classification = 'local-only';
  else if (l.stub) classification = 'stub';
  else if (l.name !== r.name) classification = 'name-mismatch';
  else if (canonical?.sha256) classification = canonical.sha256 === l.sha256 ? 'body-match' : 'body-mismatch';
  return { version, classification, local: l || null, remote: r || null, canonicalHash: canonical || null };
});

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'migration-local-ledger.json'), JSON.stringify(local, null, 2));
await writeFile(path.join(outputDir, 'migration-comparison.json'), JSON.stringify(comparison, null, 2));
const summary = comparison.reduce((acc, item) => ({ ...acc, [item.classification]: (acc[item.classification] || 0) + 1 }), {});
console.log(JSON.stringify({ localCount: local.length, remoteCount: remote.length, canonicalHashCount: canonicalHashes.length, summary }, null, 2));
if (comparison.some((item) => ['remote-only','local-only','stub','name-mismatch','body-mismatch'].includes(item.classification))) process.exitCode = 2;
