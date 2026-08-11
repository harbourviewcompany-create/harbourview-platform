import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationNames = [
  "20260811010000_transaction_identity_foundation.sql",
  "20260811011000_transaction_product_account_foundation.sql",
  "20260811012000_transaction_core_foundation.sql",
  "20260811013000_transaction_assertion_diligence_foundation.sql",
  "20260811014000_transaction_economics_decisions_foundation.sql",
  "20260811015000_transaction_rls_views_import_staging.sql",
];
const canonicalTables = [
  "entities",
  "entity_aliases",
  "entity_facilities",
  "products",
  "product_batches",
  "economic_accounts",
  "economic_account_members",
  "transaction_networks",
  "transactions",
  "transaction_parties",
  "assertions",
  "evidence_links",
  "diligence_requirements",
  "transaction_economics_entries",
  "transaction_decisions",
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

const migrationPaths = migrationNames.map((name) =>
  path.join(root, "supabase", "migrations", name),
);
for (const migrationPath of migrationPaths) {
  invariant(fs.existsSync(migrationPath), `Missing migration: ${migrationPath}`);
}

const sql = migrationPaths.map((file) => fs.readFileSync(file, "utf8")).join("\n");

for (const table of canonicalTables) {
  invariant(
    new RegExp(`create table public\\.${table}\\s*\\(`, "i").test(sql),
    `Missing canonical table ${table}`,
  );
  invariant(
    new RegExp(`alter table public\\.${table} enable row level security`, "i").test(sql),
    `RLS is not enabled for ${table}`,
  );
}

for (const forbidden of [/\bdrop\s+table\b/i, /\bdrop\s+column\b/i, /\btruncate\b/i]) {
  invariant(!forbidden.test(sql), `Destructive SQL found: ${forbidden}`);
}

for (const bridge of [
  "cannabis_operators",
  "ia_counterparties",
  "operator_licences",
  "opportunities",
  "listings",
  "buyer_requests",
  "matches",
  "deal_rooms",
  "engagements",
  "commissions",
]) {
  invariant(
    new RegExp(`alter table public\\.${bridge}`, "i").test(sql),
    `Missing additive bridge for ${bridge}`,
  );
}

invariant(sql.includes("transaction_import_staging"), "Missing controlled import staging table");
invariant(sql.includes('"master_records":165'), "Missing 165-record fixture gate");
invariant(sql.includes('"execution_packages":69'), "Missing 69-package fixture gate");
invariant(sql.includes('"economic_accounts":64'), "Missing 64-account fixture gate");
invariant(sql.includes('"transaction_networks":10'), "Missing 10-network fixture gate");
invariant(sql.includes("hv_validate_economics_recognition_chain"), "Missing economics recognition chain control");
invariant(sql.includes("hv_prevent_economics_mutation"), "Missing append-only economics control");
invariant(sql.includes("transaction_current_economics_v1"), "Missing current economics view");
invariant(sql.includes("transaction_participant_economics_v1"), "Missing participant-safe economics view");
invariant(sql.includes("transaction_lineage_v1"), "Missing evidence/assertion/economics lineage view");
invariant(/revoke all on table[\s\S]*from anon;/i.test(sql), "Canonical tables are not explicitly revoked from anon");
invariant(!/grant\s+select[\s\S]{0,160}\bto\s+anon\b/i.test(sql), "Unexpected anonymous SELECT grant");
invariant(sql.includes("harbourview_collected_revenue"), "Harbourview revenue isolation metric set incomplete");
invariant(sql.includes("metric_type not in"), "Participant Harbourview-revenue exclusion missing");

console.log("Harbourview transaction-system migration verification: PASS");
console.log(`Migrations: ${migrationNames.length}`);
console.log(`Canonical tables: ${canonicalTables.length}`);
console.log("Controlled fixture gates: 165 master / 69 packages / 64 accounts / 10 networks");
console.log("RLS, participant isolation, append-only economics, lineage and no-anon gates detected.");
