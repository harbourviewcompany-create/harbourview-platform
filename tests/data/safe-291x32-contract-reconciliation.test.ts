import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'supabase/migrations/20260924140000_safe_291x32_contract_reconciliation.sql',
  ),
  'utf8',
);

const EXACT_32 = [
  'identity',
  'hierarchy',
  'regulatory_status',
  'regulatory_tier',
  'source_registry',
  'source_snapshot',
  'claims',
  'pathways',
  'format_rules',
  'access_rules',
  'commercial_activity',
  'import',
  'export',
  'distribution',
  'testing',
  'packaging_labeling',
  'tax_fees',
  'regulator',
  'calendar',
  'change_history',
  'market_metrics',
  'trade_flows',
  'participants',
  'buyers',
  'sellers',
  'counterparties',
  'relationships',
  'opportunities',
  'signals',
  'freshness',
  'uncertainty',
  'research_queue',
] as const;

describe('safe 291x32 contract reconciliation', () => {
  it('locks the exact 32-dimension contract', () => {
    expect(EXACT_32).toHaveLength(32);
    expect(new Set(EXACT_32).size).toBe(32);
    expect(migration).toContain("dimension_count <> 32");
    expect(migration).toContain("jurisdiction_count <> 291");
    expect(migration).toContain("matrix_count <> expected_count");
  });

  it('removes jurisdiction_intelligence from the contracted matrix', () => {
    expect(migration).toContain(
      "delete from public.jurisdiction_data_depth_dimension_state\nwhere dimension_key='jurisdiction_intelligence';",
    );
    expect(migration).toContain(
      "delete from public.jurisdiction_data_depth_dimensions\nwhere dimension_key='jurisdiction_intelligence';",
    );
  });

  it('avoids the unsafe v1-to-v2 bulk update collision', () => {
    expect(migration).not.toContain(
      "update public.jurisdiction_data_depth_dimension_state\nset contract_version='2026-09-23.v2'\nwhere contract_version='2026-09-22.v1';",
    );
    expect(migration).toContain(
      "and not exists (\n    select 1\n    from public.jurisdiction_data_depth_dimension_state current_state",
    );
  });

  it('fails closed if the canonical universe or matrix is incomplete', () => {
    expect(migration).toContain(
      "raise exception '291x32 contract invariant failed: expected 291 jurisdictions, found %'",
    );
    expect(migration).toContain(
      "raise exception '291x32 matrix invariant failed: expected % rows, found %'",
    );
  });
});
