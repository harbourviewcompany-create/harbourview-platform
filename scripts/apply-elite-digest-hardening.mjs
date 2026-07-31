import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function write(relativePath, content) {
  const absolutePath = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, content)
}

function replaceExact(relativePath, before, after) {
  const current = read(relativePath)
  if (!current.includes(before)) {
    throw new Error(`Expected source block not found in ${relativePath}`)
  }
  const occurrences = current.split(before).length - 1
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one source block in ${relativePath}; found ${occurrences}`)
  }
  write(relativePath, current.replace(before, after))
}

const migrationSourcePath = 'supabase/migrations/20260731100000_run_daily_digest_uses_feedback_rank.sql'
const migrationTargetPath = 'supabase/migrations/20260731130000_elite_digest_release_hardening.sql'
const oldMarkUsed = `    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),`
const newMarkUsed = `    ),
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
      returning s.id
    ),`

let migration = read(migrationSourcePath)
if (!migration.includes(oldMarkUsed)) {
  throw new Error(`Expected digest mark_used block not found in ${migrationSourcePath}`)
}
migration = migration.replace(
  '-- Wire nightly digest candidate ranking through _digest_rank_score so\n',
  '-- Elite Digest release hardening: published-ID consumption and RPC privilege lockdown.\n-- Re-applies the feedback-aware digest function from 20260731100000 with one\n-- constrained collect-phase correction, then enforces service-role-only RPC access.\n\n-- Wire nightly digest candidate ranking through _digest_rank_score so\n',
)
migration = migration.replace(oldMarkUsed, newMarkUsed)
migration += `

-- SECURITY DEFINER and ranking helpers are internal execution surfaces.
-- Revoke both PostgreSQL PUBLIC defaults and any explicit API-role grants.
revoke all privileges on function public.run_daily_digest() from public, anon, authenticated;
grant execute on function public.run_daily_digest() to service_role;

revoke all privileges on function public.hv_intelligence_outcome_check() from public, anon, authenticated;
grant execute on function public.hv_intelligence_outcome_check() to service_role;

revoke all privileges on function public.signal_feedback_score(text) from public, anon, authenticated;
grant execute on function public.signal_feedback_score(text) to service_role;

revoke all privileges on function public._digest_rank_score(numeric, text, text, integer, text) from public, anon, authenticated;
grant execute on function public._digest_rank_score(numeric, text, text, integer, text) to service_role;
`
write(migrationTargetPath, migration)

write('lib/utils/htmlEntities.ts', `const NAMED_HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  bull: '•',
  copy: '©',
  euro: '€',
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  middot: '·',
  nbsp: '\\u00a0',
  ndash: '–',
  pound: '£',
  quot: '"',
  rdquo: '”',
  reg: '®',
  rsquo: '’',
  trade: '™',
  yen: '¥',
}

function decodeNumericEntity(token: string): string | null {
  const hexadecimal = token[1]?.toLowerCase() === 'x'
  const digits = hexadecimal ? token.slice(2) : token.slice(1)
  const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10)
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return null
  }
  return String.fromCodePoint(codePoint)
}

export function decodeHtmlEntities(raw: string): string {
  return raw.replace(
    /&(#x[0-9a-f]+|#\\d+|[a-z][a-z0-9]+);/gi,
    (entity, token: string) => {
      if (token.startsWith('#')) return decodeNumericEntity(token) ?? entity
      return NAMED_HTML_ENTITIES[token.toLowerCase()] ?? entity
    },
  )
}

export function cleanPlainText(raw: string, maxLength: number): string {
  return decodeHtmlEntities(
    raw
      .replace(/<!--[\\s\\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\\u00a0/g, ' ')
    .replace(/\\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength)
}
`)

write('lib/signals/digestPresentation.ts', `export type DigestConfidenceRow = {
  id: string
  quality_confidence: unknown
}

export function qualityConfidenceToPercent(value: unknown): number | null {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(numeric)) return null
  const percentage = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric
  return Math.round(Math.min(100, Math.max(0, percentage)))
}

export function buildDigestConfidenceMap(
  rows: readonly DigestConfidenceRow[] | null | undefined,
): Map<string, number> {
  const result = new Map<string, number>()
  for (const row of rows ?? []) {
    if (!row || typeof row.id !== 'string' || row.id.length === 0) continue
    const percentage = qualityConfidenceToPercent(row.quality_confidence)
    if (percentage !== null) result.set(row.id, percentage)
  }
  return result
}
`)

replaceExact(
  'app/api/dashboard/digest/route.ts',
  `import { loadFeedbackScores } from '@/lib/signals/feedbackScores'\n`,
  `import { loadFeedbackScores } from '@/lib/signals/feedbackScores'\nimport { buildDigestConfidenceMap } from '@/lib/signals/digestPresentation'\nimport { cleanPlainText } from '@/lib/utils/htmlEntities'\n`,
)

replaceExact(
  'app/api/dashboard/digest/route.ts',
  `function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/"/g, '"')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/'|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\\s{2,}/g, ' ')
    .trim()
    .slice(0, 200)
}`,
  `function stripHtml(raw: string): string {
  return cleanPlainText(raw, 200)
}`,
)

const countryPrioritizationBlock = `      if (isCountryFiltered) {
        const needle = countryParam.toLowerCase()
        const prioritize = <T extends { market?: string }>(items: T[]) => {
          const match = items.filter(h => (h.market ?? '').toLowerCase().includes(needle))
          const rest  = items.filter(h => !(h.market ?? '').toLowerCase().includes(needle))
          return [...match, ...rest]
        }
        signalItems = prioritize(signalItems)
        newsItems   = prioritize(newsItems)
      }

      const todayUtc`
const countryPrioritizationWithConfidence = `      if (isCountryFiltered) {
        const needle = countryParam.toLowerCase()
        const prioritize = <T extends { market?: string }>(items: T[]) => {
          const match = items.filter(h => (h.market ?? '').toLowerCase().includes(needle))
          const rest  = items.filter(h => !(h.market ?? '').toLowerCase().includes(needle))
          return [...match, ...rest]
        }
        signalItems = prioritize(signalItems)
        newsItems   = prioritize(newsItems)
      }

      const sourceSignalIds = [...new Set(
        signalItems
          .map((item) => typeof item.signal_id === 'string' ? item.signal_id : '')
          .filter(Boolean),
      )]
      let confidenceBySignalId = new Map<string, number>()
      if (sourceSignalIds.length > 0) {
        const { data: sourceConfidenceRows, error: sourceConfidenceError } = await supabase
          .from('signals')
          .select('id, quality_confidence')
          .in('id', sourceSignalIds)

        if (sourceConfidenceError) {
          console.error(
            '[/api/dashboard/digest] source confidence query failed:',
            sourceConfidenceError.message,
          )
        } else {
          confidenceBySignalId = buildDigestConfidenceMap(sourceConfidenceRows)
        }
      }

      const todayUtc`
replaceExact(
  'app/api/dashboard/digest/route.ts',
  countryPrioritizationBlock,
  countryPrioritizationWithConfidence,
)

replaceExact(
  'app/api/dashboard/digest/route.ts',
  `        title:            h.headline!,
        type:             'regulatory_change',
        market:           h.market ?? 'Global',
        tag,
        timeAgo:          timeAgo(edition!.generated_at),
        confidence:       80,
        commercialImpact: h.why_it_matters ?? '',`,
  `        title:            stripHtml(h.headline!),
        type:             'regulatory_change',
        market:           h.market ?? 'Global',
        tag,
        timeAgo:          timeAgo(edition!.generated_at),
        confidence:       h.signal_id ? (confidenceBySignalId.get(h.signal_id) ?? 80) : 80,
        commercialImpact: stripHtml(h.why_it_matters ?? ''),`,
)

replaceExact(
  'app/api/dashboard/digest/route.ts',
  `        title:            h.headline!,
        type:             'editorial',
        market:           h.market ?? 'Global',
        tag:              editorialTag,
        timeAgo:          publishedLabel(h.published_at),
        confidence:       0,
        commercialImpact: h.why_it_matters ?? '',`,
  `        title:            stripHtml(h.headline!),
        type:             'editorial',
        market:           h.market ?? 'Global',
        tag:              editorialTag,
        timeAgo:          publishedLabel(h.published_at),
        confidence:       0,
        commercialImpact: stripHtml(h.why_it_matters ?? ''),`,
)

replaceExact(
  'lib/dashboard/mapPublicToDashboardSignal.ts',
  `import { flagEmoji } from '@/lib/utils/flagEmoji'\n`,
  `import { flagEmoji } from '@/lib/utils/flagEmoji'\nimport { cleanPlainText } from '@/lib/utils/htmlEntities'\n`,
)

replaceExact(
  'lib/dashboard/mapPublicToDashboardSignal.ts',
  `function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/"/g, '"')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/'|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\\/?\\$[A-Z]{2,8}(?:\\.[A-Z]{2,4})?/g, '')
    .replace(/\\s{2,}/g, ' ')
    .trim()
    .slice(0, 180)
}`,
  `function stripHtml(raw: string): string {
  return cleanPlainText(raw, 240)
    .replace(/\\/?\\$[A-Z]{2,8}(?:\\.[A-Z]{2,4})?/g, '')
    .replace(/\\s{2,}/g, ' ')
    .trim()
    .slice(0, 180)
}`,
)

const oldMobilePlaybook = `      {jurisdictionPlaybook?.steps && jurisdictionPlaybook.steps.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">MARKET ENTRY STEPS</div>
          {jurisdictionPlaybook.steps.slice(0, 5).map(s => (
            <div key={s.step} style={{ marginTop: s.step === 1 ? 4 : 10, paddingTop: s.step === 1 ? 0 : 10, borderTop: s.step === 1 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d4a84b' }}>Step {s.step}: {s.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.6)', marginTop: 3, lineHeight: 1.5 }}>{s.description}</div>
            </div>
          ))}
        </div>
      )}
      {jurisdictionPlaybook?.key_regulators && jurisdictionPlaybook.key_regulators.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">KEY REGULATORS</div>
          {jurisdictionPlaybook.key_regulators.map((r, i) => (
            <div key={r.name} style={{ marginTop: i === 0 ? 4 : 8, paddingTop: i === 0 ? 0 : 8, borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.5)', marginTop: 2 }}>{r.role}</div>
            </div>
          ))}
        </div>
      )}`
const newMobilePlaybook = `      {jurisdictionPlaybook?.steps && jurisdictionPlaybook.steps.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">MARKET ENTRY STEPS</div>
          {jurisdictionPlaybook.steps.slice(0, 5).map((step, i) => (
            <div key={\`${i}-\${step}\`} style={{ marginTop: i === 0 ? 4 : 10, paddingTop: i === 0 ? 0 : 10, borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d4a84b' }}>Step {i + 1}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.6)', marginTop: 3, lineHeight: 1.5 }}>{step}</div>
            </div>
          ))}
        </div>
      )}
      {jurisdictionPlaybook?.key_regulators && (() => {
        const regulators = jurisdictionPlaybook.key_regulators
        const regulatorNames = [regulators.primary, ...regulators.secondary].filter(Boolean)
        if (regulatorNames.length === 0) return null
        return (
          <div className="hvm-signal-card hvm-signal-card--rich">
            <div className="hvm-kicker">KEY REGULATORS</div>
            {regulatorNames.map((name, i) => (
              <div key={name} style={{ marginTop: i === 0 ? 4 : 8, paddingTop: i === 0 ? 0 : 8, borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{name}</div>
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,.5)', marginTop: 2 }}>{i === 0 ? 'Primary regulator' : 'Secondary regulator'}</div>
              </div>
            ))}
          </div>
        )
      })()}`
replaceExact(
  'components/dashboard/MobileCommandCentre.tsx',
  oldMobilePlaybook,
  newMobilePlaybook,
)

write('tests/signals/eliteDigestHardening.test.ts', `import { readFileSync } from 'node:fs'
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
        \`revoke all privileges on function \${signature} from public, anon, authenticated;\`,
      )
      expect(migration).toContain(
        \`grant execute on function \${signature} to service_role;\`,
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
    ).toBe('AT&T "policy" \'shift\' — next')
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
`)

console.log('Elite Digest hardening patch applied successfully.')
