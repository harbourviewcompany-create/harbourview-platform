import { describe, expect, it } from 'vitest'

import {
  buildDraftSignalSlug,
  checkRegulatorySource,
  classifySignalType,
  hashContent,
  isRelevantRegulatoryText,
  stripHtml,
  type WatchableRegulatorySource,
} from '@/lib/regulatory-sources/watcher'

const source: WatchableRegulatorySource = {
  id: '00000000-0000-0000-0000-000000000001',
  source_name: 'Official Test Source',
  source_type: 'health_authority',
  source_tier: 'tier_1_official',
  country_code: 'CA',
  country_name: 'Canada',
  region: 'North America',
  jurisdiction: 'Federal',
  regulator_name: 'Test Regulator',
  base_url: 'https://example.test',
  watch_url: 'https://example.test/feed',
  rss_url: null,
  language_code: 'en',
  access_method: 'html',
  watch_status: 'manual_review',
  last_content_hash: null,
}

describe('fresh regulatory source watcher', () => {
  it('normalizes HTML and hashes stable text', () => {
    expect(stripHtml('<main><h1>Regulated import update</h1><script>ignore()</script></main>')).toBe('Regulated import update')
    expect(hashContent('same')).toBe(hashContent('same'))
  })

  it('detects relevant regulatory terms and classifies signals', () => {
    expect(isRelevantRegulatoryText('The regulator opened a medical cannabis import consultation.')).toBe(true)
    expect(isRelevantRegulatoryText('General procurement notice for office chairs.')).toBe(false)
    expect(classifySignalType('New import permit requirement')).toBe('import_export_pathway')
    expect(classifySignalType('Draft hemp rule consultation opened')).toBe('policy_consultation')
  })

  it('checks an HTML source and returns changed relevant content', async () => {
    const fetchImpl: typeof fetch = async () => new Response(
      '<html><head><title>Official regulation update</title></head><body>Medical cannabis import licensing consultation opened.</body></html>',
      { status: 200, headers: { 'content-type': 'text/html' } },
    )

    const result = await checkRegulatorySource(source, fetchImpl)

    expect(result.status).toBe('changed')
    expect(result.changed).toBe(true)
    expect(result.relevant).toBe(true)
    expect(result.title).toBe('Official regulation update')
  })

  it('extracts RSS items and produces deterministic draft slugs', async () => {
    const rssSource = { ...source, access_method: 'rss' as const, rss_url: 'https://example.test/rss.xml' }
    const fetchImpl: typeof fetch = async () => new Response(
      '<rss><channel><item><title>Hemp licensing update</title><link>/notice</link><description>Official hemp license rule changed.</description><pubDate>Wed, 10 Jun 2026 12:00:00 GMT</pubDate></item></channel></rss>',
      { status: 200, headers: { 'content-type': 'application/rss+xml' } },
    )

    const result = await checkRegulatorySource(rssSource, fetchImpl)
    const slug = buildDraftSignalSlug(rssSource, result.items[0]!)

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.relevant).toBe(true)
    expect(slug).toContain('official-test-source')
  })
})
