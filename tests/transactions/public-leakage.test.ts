import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stage6Sql = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260811015000_transaction_rls_views_import_staging.sql",
  ),
  "utf8",
);

const reviewHardeningSql = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260811015200_transaction_review_hardening.sql",
  ),
  "utf8",
);

function viewProjection(sql: string, viewName: string, fromExpression: string): string {
  const pattern = new RegExp(
    `(?:create|create or replace) view public\\.${viewName}[\\s\\S]*?as\\s*select([\\s\\S]*?)from ${fromExpression}`,
    "i",
  );
  const match = sql.match(pattern);
  if (!match) throw new Error(`Could not locate projection for ${viewName}`);
  return match[1];
}

describe("transaction public/private leakage controls", () => {
  it("does not grant anonymous access to canonical tables or safe views", () => {
    expect(stage6Sql).not.toMatch(/grant\s+select[\s\S]{0,160}\bto\s+anon\b/i);
    expect(stage6Sql).toContain("revoke all on table");
    expect(stage6Sql).toContain("revoke all on public.transaction_party_safe_v1 from anon");
    expect(stage6Sql).toContain("revoke all on public.transaction_participant_economics_v1 from anon");
    expect(reviewHardeningSql).toContain("revoke all on public.transaction_participant_economics_v1 from anon");
  });

  it("keeps participant-safe transaction projection free of intelligence/evidence/economics internals", () => {
    const projection = viewProjection(
      stage6Sql,
      "transaction_party_safe_v1",
      "public\\.transactions t",
    );
    for (const forbidden of [
      "source_url",
      "content_hash",
      "storage_path",
      "confidence",
      "commercial_thesis",
      "double_count_key",
      "amount",
      "unit_rate",
      "commission",
      "margin",
      "evidence",
    ]) {
      expect(projection.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("keeps internal identifiers and Harbourview-only economics out of the final participant economics projection", () => {
    const projection = viewProjection(
      reviewHardeningSql,
      "transaction_participant_economics_v1",
      "public\\.transaction_economics_entries e",
    );
    for (const forbidden of [
      "network_id",
      "recognition_key",
      "classification",
      "calculation_inputs",
      "formula_text",
      "evidence_id",
      "assertion_id",
      "contract_document_id",
      "created_by",
    ]) {
      expect(projection.toLowerCase()).not.toContain(forbidden);
    }

    expect(reviewHardeningSql).toMatch(
      /metric_type not in \([\s\S]*harbourview_addressable_revenue[\s\S]*gross_margin[\s\S]*\)/i,
    );
  });

  it("keeps full economics participant access disabled after final hardening", () => {
    expect(reviewHardeningSql).toMatch(
      /alter policy transaction_economics_internal_or_shared_read[\s\S]*?using \(public\.hv_has_transaction_role\(array\['admin','operator','analyst'\]\)\)/i,
    );
  });

  it("does not alter existing public marketplace exposure policies", () => {
    expect(stage6Sql).not.toMatch(/alter table public\.cannabis_operators/i);
    expect(stage6Sql).not.toMatch(/alter table public\.operator_licences/i);
    expect(stage6Sql).not.toMatch(/create policy[\s\S]{0,100}public.*listings/i);
  });
});
