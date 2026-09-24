import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('291x32 depth control plane', () => {
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260923065000_full_291x32_depth_control_plane.sql'),
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

    expect(sql).not.toContain("('jurisdiction_intelligence',");
  });

  it('does not map analyst jurisdiction intelligence into the 32-cell matrix', () => {
    expect(sql).not.toContain("when 'country_intel' then 'jurisdiction_intelligence'");
    expect(sql).not.toContain("'source_snapshots','regulatory_calendar','country_intel'");
  });

  it('keeps the matrix gate at 291 x 32', () => {
    expect(sql).toContain('291*32 expected_matrix_rows');
    expect(sql).toContain('count(*)=291*32');
    expect(sql).toContain('v_j<>291 or v_m<>9312');
  });
});
