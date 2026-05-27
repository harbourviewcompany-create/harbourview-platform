import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type RawSource = {
  name?: string;
  url?: string;
  category?: string;
  subcategory?: string;
  type?: string;
  tier?: number | string;
  country?: string;
  notes?: string;
};

type BatchFile = {
  batchId: string;
  sourceVersion: string;
  checksum: string;
  count: number;
  records: RawSource[];
};

const INPUT_CANDIDATES = [
  "data/source-import/cannabis_sources_5614.json",
  "data/source-import/cannabis_sources_5000.json",
  "cannabis_sources_5000.json"
];

const OUTPUT_DIR = "docs/control/source-import/batches";
const DEFAULT_BATCH_SIZE = Number(process.env.SOURCE_IMPORT_BATCH_SIZE || 100);
const SOURCE_VERSION = process.env.SOURCE_IMPORT_VERSION || "phase1_recovered_source_universe_v1";

function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  const cleaned = url.trim().toLowerCase().replace(/\/+$/, "");
  return cleaned.length ? cleaned : null;
}

function readInput(): { inputPath: string; records: RawSource[] } {
  const explicit = process.env.SOURCE_IMPORT_INPUT;
  const candidates = explicit ? [explicit] : INPUT_CANDIDATES;

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error(`Input file is not a JSON array: ${candidate}`);
      }
      return { inputPath: candidate, records: parsed };
    }
  }

  throw new Error(`No source JSON found. Tried: ${candidates.join(", ")}`);
}

function validateAndDedupe(records: RawSource[]) {
  const seen = new Set<string>();
  const accepted: RawSource[] = [];
  const rejected: Array<{ reason: string; record: RawSource }> = [];

  for (const record of records) {
    const name = String(record.name || "").trim();
    const url = String(record.url || "").trim();
    const country = String(record.country || "").trim();
    const normalizedUrl = normalizeUrl(url);

    if (!name) {
      rejected.push({ reason: "missing name", record });
      continue;
    }

    if (!url || !normalizedUrl) {
      rejected.push({ reason: "missing url", record });
      continue;
    }

    if (!/^https?:\/\//i.test(url)) {
      rejected.push({ reason: "non-http url", record });
      continue;
    }

    if (!country) {
      rejected.push({ reason: "missing country", record });
      continue;
    }

    if (seen.has(normalizedUrl)) {
      rejected.push({ reason: "duplicate normalized url within source file", record });
      continue;
    }

    seen.add(normalizedUrl);
    accepted.push({
      name,
      url,
      category: record.category ? String(record.category).trim() : undefined,
      subcategory: record.subcategory ? String(record.subcategory).trim() : undefined,
      type: record.type ? String(record.type).trim() : undefined,
      tier: record.tier === undefined || record.tier === null ? undefined : Number(record.tier),
      country,
      notes: record.notes ? String(record.notes).trim() : undefined
    });
  }

  return { accepted, rejected };
}

function checksumFor(records: RawSource[]): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(records))
    .digest("hex");
}

function main() {
  const { inputPath, records } = readInput();
  const { accepted, rejected } = validateAndDedupe(records);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const file of fs.readdirSync(OUTPUT_DIR)) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
  }

  const manifest = {
    inputPath,
    sourceVersion: SOURCE_VERSION,
    inputCount: records.length,
    acceptedCount: accepted.length,
    rejectedBeforeUploadCount: rejected.length,
    batchSize: DEFAULT_BATCH_SIZE,
    batchCount: Math.ceil(accepted.length / DEFAULT_BATCH_SIZE),
    inputChecksum: checksumFor(records),
    acceptedChecksum: checksumFor(accepted),
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "preupload_rejections.json"),
    JSON.stringify(rejected, null, 2)
  );

  for (let i = 0; i < accepted.length; i += DEFAULT_BATCH_SIZE) {
    const batchNumber = Math.floor(i / DEFAULT_BATCH_SIZE);
    const batchRecords = accepted.slice(i, i + DEFAULT_BATCH_SIZE);
    const batchId = `${SOURCE_VERSION}_${String(batchNumber).padStart(4, "0")}`;
    const batch: BatchFile = {
      batchId,
      sourceVersion: SOURCE_VERSION,
      checksum: checksumFor(batchRecords),
      count: batchRecords.length,
      records: batchRecords
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${batchId}.json`),
      JSON.stringify(batch, null, 2)
    );
  }

  console.log(JSON.stringify(manifest, null, 2));
}

main();
