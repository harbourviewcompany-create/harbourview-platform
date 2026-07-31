import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildDigestConfidenceMap,
  qualityConfidenceToPercent,
} from '@/lib/signals/digestPresentation'
import { cleanPlainText, decodeHtmlEntities } from '@/lib/utils/htmlEntities'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260731130000_elite_digest_release_hardening.sql'),
  'utf8',
)
const digestRoute = readFileSync(
  resolve(process.cwd(), 'app/api/dashboard/digest/route.ts'),
  'utf8',
)
const mapper = readFileSync(
  resolve(process.cwd(), 'lib/dashboard/mapPublicToDashboardSignal.ts'),
  'utf8',
)
const mobileCommandCentre = readFileSync(
  resolve(process.cwd(), 'components/dashboard/MobileCommandCentre.tsx'),
  'utf8',
)

describe('Elite Digest release hardening', () => {
  it('restricts all four internal RPCs to service_role', () => {
    const signatures = [
      'public.run_daily_digest()',
      'public.hv_intelligence_outcome_check()',
      'public.signal_feedback_score(text)',
      'public._digest_rank_score(numeric, text, text, integer, text)',
    ]

    for (const signature of signatures) {
      expect(migration).toContain(
        `revoke all privileges on function ${signature} from public, anon, authenticated;`,
      )
      expect(migration).toContain(
        `grant execute on function ${signature} to service_role;`,
      )
    }
  })

  it('marks only published signal IDs that belonged to the candidate batch', () => {
    expect(migration).toContain('published_signal_ids as (')
    expect(migration).toContain("(h ->> 'signal_id') = any(o.signal_ids)")
    expect(migration).toContain('from published_signal_ids p')
    expect(migration).toContain('where s.id = p.signal_id')
    expect(migration).not.toContain(
      'from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)',
    )
  })

  it('preserves source quality confidence for curated Digest items', () => {
    expect(qualityConfidenceToPercent(0.9)).toBe(90)
    expect(qualityConfidenceToPercent('0.725')).toBe(73)
    expect(qualityConfidenceToPercent(87)).toBe(87)
    expect(qualityConfidenceToPercent(null)).toBeNull()

    const confidence = buildDigestConfidenceMap([
      { id: 'a', quality_confidence: 0.91 },
      { id: 'b', quality_confidence: '0.64' },
      { id: 'invalid', quality_confidence: null },
    ])
    expect(confidence.get('a')).toBe(91)
    expect(confidence.get('b')).toBe(64)
    expect(confidence.has('invalid')).toBe(false)
    expect(digestRoute).toContain(".select('id, quality_confidence')")
    expect(digestRoute).toContain('confidenceBySignalId.get(h.signal_id)')
  })

  it('decodes named and numeric HTML entities in both presentation paths', () => {
    expect(
      decodeHtmlEntities('AT&amp;T &quot;policy&quot; &#39;shift&#39; &#x2014; next'),
    ).toBe(`AT&T "policy" 'shift' — next`)
    expect(
      cleanPlainText('<b>Market&nbsp;access</b> &lt;updated&gt; &#8212; now', 200),
    ).toBe('Market access <updated> — now')
    expect(digestRoute).toContain("import { cleanPlainText } from '@/lib/utils/htmlEntities'")
    expect(mapper).toContain("import { cleanPlainText } from '@/lib/utils/htmlEntities'")
  })

  it('renders the actual string-array jurisdiction playbook shape on mobile', () => {
    expect(mobileCommandCentre).toContain(
      'jurisdictionPlaybook.steps.slice(0, 5).map((step, i) =>',
    )
    expect(mobileCommandCentre).not.toContain('key={s.step}')
    expect(mobileCommandCentre).toContain(
      'const regulatorNames = [regulators.primary, ...regulators.secondary].filter(Boolean)',
    )
  })
})
