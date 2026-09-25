import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('291x32 depth control plane', () => {
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260923065000_full_291x32_depth_control_plane.sql'),
    'utf8',
  );
  const reconciliationSql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260924140000_safe_291x32_contract_reconciliation.sql'),
    'utf8',
  );

  const expected = [
    'identity','hierarchy','regulatory_status','regulatory_tier','source_registry',
    'source_snapshot','claims','pathways','format_rules','access_rules',
    'commercial_activity','import','export','distribution','testing',
    'packaging_labeling','tax_fees','regulator','calendar','change_history',
    'market_metrics','trade_flows','participants','buyers','sellers','counterparties',
    'relationships','opportunities','signals','freshness','uncertainty','research_queue',
  ];

  it('defines exactly the 32 authorized contract dimensions', () => {
    expect(expected).toHaveLength(32);

    for (const key of expected) {
      expect(sql).toContain(`('${key}',`);
    }

    expect(reconciliationSql).toContain("delete from public.jurisdiction_data_depth_dimensions");
    expect(reconciliationSql).toContain("where dimension_key='jurisdiction_intelligence'");
    expect(reconciliationSql).toContain("dimension_count <> 32");
  });

  it('removes the historical analyst-intelligence dimension from the contracted matrix', () => {
    expect(reconciliationSql).toContain("delete from public.jurisdiction_data_depth_dimension_state");
    expect(reconciliationSql).toContain("where dimension_key='jurisdiction_intelligence'");
    expect(reconciliationSql).toContain("delete from public.jurisdiction_data_depth_dimensions");
    expect(reconciliationSql).toContain("where dimension_key='jurisdiction_intelligence'");
  });

  it('keeps the matrix gate at 291 x 32', () => {
    expect(sql).toContain('291*32 expected_matrix_rows');
    expect(sql).toContain('count(*)=291*32');
    expect(sql).toContain('v_j<>291 or v_m<>9312');
  });
});
