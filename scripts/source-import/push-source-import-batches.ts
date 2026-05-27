import fs from "node:fs";
import path from "node:path";

type BatchFile = {
  batchId: string;
  sourceVersion: string;
  checksum: string;
  count: number;
  records: unknown[];
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "zvxdgdkukjrrwamdpqrg";
const EXPECTED_PROJECT_REF = "zvxdgdkukjrrwamdpqrg";
const BATCH_DIR = process.env.SOURCE_IMPORT_BATCH_DIR || "docs/control/source-import/batches";
const DRY_RUN = process.env.SOURCE_IMPORT_DRY_RUN === "1";

if (PROJECT_REF !== EXPECTED_PROJECT_REF) {
  throw new Error(`Refusing to run: SUPABASE_PROJECT_REF must be ${EXPECTED_PROJECT_REF}, got ${PROJECT_REF}`);
}

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
}

if (!SUPABASE_SERVICE_ROLE_KEY && !DRY_RUN) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

if (!SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(`Refusing to run: SUPABASE_URL does not include ${EXPECTED_PROJECT_REF}`);
}

function readBatches(): BatchFile[] {
  if (!fs.existsSync(BATCH_DIR)) {
    throw new Error(`Batch dir not found: ${BATCH_DIR}`);
  }

  const files = fs
    .readdirSync(BATCH_DIR)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => file !== "manifest.json" && file !== "preupload_rejections.json")
    .sort();

  if (!files.length) {
    throw new Error(`No batch JSON files found in ${BATCH_DIR}`);
  }

  return files.map((file) => {
    const fullPath = path.join(BATCH_DIR, file);
    const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8")) as BatchFile;

    if (!parsed.batchId || !parsed.sourceVersion || !Array.isArray(parsed.records)) {
      throw new Error(`Invalid batch file: ${file}`);
    }

    if (parsed.count !== parsed.records.length) {
      throw new Error(`Batch count mismatch in ${file}: count=${parsed.count}, records=${parsed.records.length}`);
    }

    return parsed;
  });
}

async function callImportRpc(batch: BatchFile) {
  const endpoint = `${SUPABASE_URL}/rest/v1/rpc/import_source_registry_batch`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_batch_id: batch.batchId,
      p_source_version: batch.sourceVersion,
      p_records: batch.records,
      p_checksum: batch.checksum
    })
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`RPC failed for ${batch.batchId}: HTTP ${response.status} ${text}`);
  }

  return JSON.parse(text);
}

async function main() {
  const batches = readBatches();

  const ledger: Array<{
    batchId: string;
    count: number;
    status: "dry_run" | "completed" | "failed";
    result?: unknown;
    error?: string;
  }> = [];

  console.log(`Project ref: ${PROJECT_REF}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Batches: ${batches.length}`);
  console.log(`Dry run: ${DRY_RUN ? "yes" : "no"}`);

  for (const batch of batches) {
    console.log(`Importing ${batch.batchId} (${batch.count})`);

    if (DRY_RUN) {
      ledger.push({
        batchId: batch.batchId,
        count: batch.count,
        status: "dry_run"
      });
      continue;
    }

    try {
      const result = await callImportRpc(batch);
      ledger.push({
        batchId: batch.batchId,
        count: batch.count,
        status: "completed",
        result
      });
      console.log(JSON.stringify(result));
    } catch (error) {
      ledger.push({
        batchId: batch.batchId,
        count: batch.count,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      });
      fs.writeFileSync(
        "docs/control/source-import/import_run_ledger.json",
        JSON.stringify(ledger, null, 2)
      );
      throw error;
    }
  }

  fs.writeFileSync(
    "docs/control/source-import/import_run_ledger.json",
    JSON.stringify(ledger, null, 2)
  );

  const totalAttempted = ledger.reduce((sum, item) => sum + item.count, 0);
  const failed = ledger.filter((item) => item.status === "failed").length;

  console.log(JSON.stringify({ totalAttempted, failed, ledgerPath: "docs/control/source-import/import_run_ledger.json" }, null, 2));
}

main();
