import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationFiles = [
  "20260811010000_transaction_identity_foundation.sql",
  "20260811011000_transaction_product_account_foundation.sql",
  "20260811012000_transaction_core_foundation.sql",
  "20260811013000_transaction_assertion_diligence_foundation.sql",
  "20260811014000_transaction_economics_decisions_foundation.sql",
  "20260811015000_transaction_rls_views_import_staging.sql",
] as const;

const migrations = migrationFiles.map((file) =>
  readFileSync(join(process.cwd(), "supabase", "migrations", file), "utf8"),
);
const allSql = migrations.join("\n");

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
] as const;

const bridgeTables = [
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
] as const;

describe("native transaction schema contract", () => {
  it("creates all canonical tables without destructive migration statements", () => {
    for (const table of canonicalTables) {
      expect(allSql).toMatch(new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
    }
    expect(allSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(allSql).not.toMatch(/\bdrop\s+column\b/i);
    expect(allSql).not.toMatch(/\btruncate\b/i);
  });

  it("uses existing systems as nullable bridges rather than replacements", () => {
    for (const table of bridgeTables) {
      expect(allSql).toMatch(new RegExp(`alter table public\\.${table}`, "i"));
    }
    expect(allSql).toContain("workspaces remain tenancy/security boundaries");
    expect(allSql).not.toMatch(/alter table public\.workspaces\s+add column\s+entity_id/i);
    expect(allSql).not.toMatch(/create table public\.hv_evidence_v2/i);
    expect(allSql).not.toMatch(/create table public\.deal_rooms_v2/i);
  });

  it("enables RLS for every canonical table and staging", () => {
    for (const table of [...canonicalTables, "transaction_import_staging"] as const) {
      expect(allSql).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      );
    }
  });

  it("keeps canonical transaction data unavailable to anon", () => {
    expect(allSql).toMatch(/revoke all on table[\s\S]*from anon;/i);
    expect(allSql).not.toMatch(/grant\s+select[\s\S]{0,120}to\s+anon/i);
    expect(allSql).toContain("Public exposure remains DTO/projection based");
  });

  it("isolates Harbourview revenue metrics from participant economics", () => {
    for (const metric of [
      "harbourview_addressable_revenue",
      "harbourview_accrued_revenue",
      "harbourview_invoiced_revenue",
      "harbourview_collected_revenue",
      "gross_margin",
    ]) {
      expect(allSql).toContain(metric);
    }
    expect(allSql).toMatch(/transaction_economics_internal_or_shared_read[\s\S]*metric_type not in/i);
    expect(allSql).toMatch(/transaction_participant_economics_v1[\s\S]*metric_type not in/i);
  });

  it("makes economics append-only and recognition-chain controlled", () => {
    expect(allSql).toContain("hv_validate_economics_recognition_chain");
    expect(allSql).toContain("transaction_economics_recognition_chain");
    expect(allSql).toContain("hv_prevent_economics_mutation");
    expect(allSql).toMatch(/before update or delete on public\.transaction_economics_entries/i);
    expect(allSql).toContain("recognition_key like 'ECON|%'");
    expect(allSql).toContain("double_count_key like 'NETWORK|%'");
  });

  it("encodes the controlled workbook fixture counts without importing it", () => {
    expect(allSql).toContain('"master_records":165');
    expect(allSql).toContain('"execution_packages":69');
    expect(allSql).toContain('"economic_accounts":64');
    expect(allSql).toContain('"transaction_networks":10');
    expect(allSql).toContain("No automatic canonical or production import");
  });
});
