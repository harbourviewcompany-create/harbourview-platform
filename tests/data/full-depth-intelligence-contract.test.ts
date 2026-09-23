import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('full-depth intelligence contract', () => {
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260922230000_full_depth_intelligence_contract.sql'),
    'utf8',
  );

  it('defines the complete contract dimensions', () => {
    const expected = [
      'identity','hierarchy','regulatory_status','regulatory_tier','source_registry',
      'source_snapshot','claims','pathways','format_rules','access_rules',
      'commercial_activity','import','export','distribution','testing',
      'packaging_labeling','tax_fees','regulator','calendar','change_history',
      'market_metrics','trade_flows','participants','buyers','sellers','counterparties',
      'relationships','opportunities','signals','freshness','uncertainty','research_queue',
    ];

    for (const key of expected) {
      expect(sql).toContain(`('${key}',`);
    }
    expect(expected).toHaveLength(32);
  });

  it('keeps missing and unmeasured data out of complete state', () => {
    expect(sql).toContain("else 'unmeasured'");
    expect(sql).toContain("else 'missing'");
    expect(sql).toContain("status='complete'");
    expect(sql).toContain('regulatory_publication_ready');
  });

  it('does not create a write path for jurisdiction facts', () => {
    expect(sql).not.toMatch(/update\s+public\.countries/i);
    expect(sql).not.toMatch(/insert\s+into\s+public\.countries/i);
    expect(sql).not.toMatch(/delete\s+from\s+public\.countries/i);
  });
});
