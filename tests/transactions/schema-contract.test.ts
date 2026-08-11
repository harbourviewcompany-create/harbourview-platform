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
  "20260811015100_transaction_boundary_hardening.sql",
  "20260811015200_transaction_review_hardening.sql",
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

const forbiddenExistingTableExpansion = [
  "commercial_need",
  "qualification_confidence",
  "selected_for_transaction",
] as const;

describe("native transaction schema contract", () => {
  it("creates all canonical tables without destructive migration statements", () => {
    for (const table of canonicalTables) {
      expect(allSql).toMatch(new RegExp(`create table(?: if not exists)? public\\.${table}\\s*\\(`, "i"));
    }
    expect(allSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(allSql).not.toMatch(/\bdrop\s+column\b/i);
    expect(allSql).not.toMatch(/\btruncate\b/i);
  });

  it("uses existing systems as nullable FK bridges rather than expanding their domain model", () => {
    for (const table of bridgeTables) {
      expect(allSql).toMatch(new RegExp(`alter table(?: if exists)? public\\.${table}`, "i"));
    }
    expect(allSql).toContain("workspaces remain tenancy/security boundaries");
    expect(allSql).not.toMatch(/alter table public\.workspaces\s+add column\s+entity_id/i);
    expect(allSql).not.toMatch(/create table public\.hv_evidence_v2/i);
    expect(allSql).not.toMatch(/create table public\.deal_rooms_v2/i);

    for (const column of forbiddenExistingTableExpansion) {
      expect(allSql).not.toContain(column);
    }

    const bridgeColumnDefinitions = [
      "entity_id uuid references public.entities(id) on delete set null",
      "facility_id uuid references public.entity_facilities(id) on delete set null",
      "product_id uuid references public.products(id) on delete set null",
      "economic_account_id uuid references public.economic_accounts(id) on delete set null",
      "opportunity_id uuid references public.opportunities(id) on delete set null",
      "transaction_network_id uuid references public.transaction_networks(id) on delete set null",
      "transaction_id uuid references public.transactions(id) on delete set null",
      "economics_entry_id uuid references public.transaction_economics_entries(id) on delete set null",
    ];
    for (const definition of bridgeColumnDefinitions) {
      expect(allSql).toContain(definition);
    }
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
    expect(allSql).toContain("alter policy transaction_economics_internal_or_shared_read");
    expect(allSql).toContain("security_invoker = false, security_barrier = true");
    expect(allSql).toMatch(/transaction_participant_economics_v1[\s\S]*metric_type not in/i);
  });

  it("makes economics append-only and recognition-chain controlled", () => {
    expect(allSql).toContain("hv_validate_economics_recognition_chain");
    expect(allSql).toContain("transaction_economics_recognition_chain");
    expect(allSql).toContain("pg_advisory_xact_lock");
    expect(allSql).toContain("recognition_key does not match transaction/network, metric and currency fields");
    expect(allSql).toContain("hv_prevent_economics_mutation");
    expect(allSql).toMatch(/before update or delete on public\.transaction_economics_entries/i);
    expect(allSql).toContain("recognition_key like 'ECON|%'");
    expect(allSql).toContain("double_count_key like 'NETWORK|%'");
    expect(allSql).toContain("basis in ('primary_evidence','invoice','settlement')");
    expect(allSql).toContain("child.status in ('validated','void')");
  });

  it("enforces final review hardening controls", () => {
    expect(allSql).toContain("transaction_economics_authoritative_basis_chk");
    expect(allSql).toContain("transaction_economics_amount_currency_chk");
    expect(allSql).toContain("hv_guard_transaction_decision_mutation");
    expect(allSql).toContain("transaction_decisions_audit_update");
    expect(allSql).toContain("visibility_scope = 'transaction_parties'");
    expect(allSql).toContain("latitude is not null");
    expect(allSql).toContain("longitude is not null");
  });

  it("encodes the controlled workbook fixture counts without importing it", () => {
    expect(allSql).toContain('"master_records":165');
    expect(allSql).toContain('"execution_packages":69');
    expect(allSql).toContain('"economic_accounts":64');
    expect(allSql).toContain('"transaction_networks":10');
    expect(allSql).toContain("No automatic canonical or production import");
  });
});
