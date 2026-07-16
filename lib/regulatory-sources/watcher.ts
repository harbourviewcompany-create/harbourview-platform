import crypto from 'node:crypto'

import type { RegulatorySignalType, RegulatorySource, RegulatorySourceTier, RegulatorySourceType } from '@/lib/regulatory-signals/types'
import { REGULATORY_RELEVANCE_TERMS } from './officialSources'

export type SourceWatchStatus = 'healthy' | 'changed' | 'stale' | 'failing' | 'blocked' | 'manual_review' | 'disabled'
export type WatcherAccessMethod = 'rss' | 'api' | 'html' | 'pdf' | 'manual'

export type WatchableRegulatorySource = Pick<
  RegulatorySource,
  | 'id'
  | 'source_name'
  | 'source_type'
  | 'source_tier'
  | 'country_code'
  | 'country_name'
  | 'region'
  | 'jurisdiction'
  | 'regulator_name'
  | 'base_url'
  | 'watch_url'
  | 'rss_url'
  | 'language_code'
> & {
  access_method?: WatcherAccessMethod | null
  watch_frequency?: string | null
  watch_status?: SourceWatchStatus | null
  last_content_hash?: string | null
}

export type ExtractedSourceItem = {
  title: string
  url: string
  published_at: string | null
  summary: string
  raw_text: string
  content_hash: string
  relevant: boolean
  signal_type: RegulatorySignalType
}

export type SourceCheckResult = {
  status: SourceWatchStatus
  source_url: string
  http_status: number | null
  response_time_ms: number
  title: string
  raw_text: string
  content_hash: string
  previous_hash: string | null
  changed: boolean
  relevant: boolean
  signal_type: RegulatorySignalType
  error_message: string | null
  items: ExtractedSourceItem[]
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function stripHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"'),
  )
}

export function hashContent(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function safeUrl(baseUrl: string, maybeUrl: string | undefined | null) {
  if (!maybeUrl) return baseUrl
  try {
    return new URL(maybeUrl, baseUrl).toString()
  } catch {
    return baseUrl
  }
}

export function sourceFetchUrl(source: WatchableRegulatorySource) {
  if (source.access_method === 'rss' && source.rss_url) return source.rss_url
  return source.watch_url || source.rss_url || source.base_url
}

export function isRelevantRegulatoryText(text: string) {
  const lower = text.toLowerCase()
  return REGULATORY_RELEVANCE_TERMS.some((term) => lower.includes(term))
}

export function classifySignalType(text: string): RegulatorySignalType {
  const lower = text.toLowerCase()

  if (/(import|export|customs|shipment|border|trade)/.test(lower)) return 'import_export_pathway'
  if (/(licen[cs]e|licensing|market access|permit|authori[sz]ation)/.test(lower)) return 'licensing_market_access'
  if (/(prescription|patient|pharmacy|pharmacist|doctor|physician|medical cannabis|medicinal cannabis)/.test(lower)) return 'prescription_patient_access'
  if (/(enforcement|recall|warning|inspection|compliance action|seizure|penalt)/.test(lower)) return 'enforcement_action'
  if (/(consultation|proposed rule|draft|comment period|notice of intent)/.test(lower)) return 'policy_consultation'
  if (/(hemp|cbd|cannabinoid|cannabidiol|thc|tetrahydrocannabinol|novel food)/.test(lower)) return 'hemp_cbd_boundary'
  if (/(controlled substance|narcotic|schedule|scheduling)/.test(lower)) return 'pharmaceutical_reclassification'
  if (/(quality|gmp|gacp|standard|testing|laboratory|labelling|labeling|packaging)/.test(lower)) return 'regulatory_guidance'

  return 'regulatory_guidance'
}

function titleFromHtml(html: string, fallback: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return normalizeWhitespace(stripHtml(title || fallback)).slice(0, 180)
}

function extractRssItems(xml: string, source: WatchableRegulatorySource): ExtractedSourceItem[] {
  const itemBlocks = Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((m) => m[0])
  const entries = itemBlocks.length ? itemBlocks : Array.from(xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)).map((m) => m[0])

  return entries.slice(0, 20).map((entry, index) => {
    const title = stripHtml(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || `${source.source_name} item ${index + 1}`)
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]
    const published = entry.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || entry.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || null
    const summary = stripHtml(entry.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || title)
    const text = normalizeWhitespace(`${title} ${summary}`)

    return {
      title,
      url: safeUrl(source.base_url, linkMatch),
      published_at: published ? new Date(published).toISOString() : null,
      summary,
      raw_text: text,
      content_hash: hashContent(text),
      relevant: isRelevantRegulatoryText(text),
      signal_type: classifySignalType(text),
    }
  })
}

function extractApiItems(json: unknown, source: WatchableRegulatorySource, fallbackUrl: string): ExtractedSourceItem[] {
  const obj = json as Record<string, unknown> | null
  const records: unknown[] = Array.isArray(obj?.results)
    ? (obj!.results as unknown[])
    : Array.isArray(obj?.data)
      ? (obj!.data as unknown[])
      : Array.isArray(json)
        ? (json as unknown[])
        : []

  return records.slice(0, 20).map((record, index) => {
    const rec = record as Record<string, unknown>
    const attributes = (rec?.attributes as Record<string, unknown>) || rec || {}
    const title = normalizeWhitespace(String(attributes?.title || attributes?.name || attributes?.documentTitle || `${source.source_name} API item ${index + 1}`))
    const summary = stripHtml(String(attributes?.abstract || attributes?.description || attributes?.summary || title))
    const url = String(attributes?.html_url || attributes?.url || attributes?.documentUrl || fallbackUrl)
    const published = (attributes?.publication_date ?? attributes?.postedDate ?? attributes?.lastModifiedDate ?? null) as string | number | null
    const text = normalizeWhitespace(`${title} ${summary}`)

    return {
      title,
      url: safeUrl(fallbackUrl, url),
      published_at: published ? new Date(published).toISOString() : null,
      summary,
      raw_text: text,
      content_hash: hashContent(text),
      relevant: isRelevantRegulatoryText(text),
      signal_type: classifySignalType(text),
    }
  })
}

export function buildDraftSignalSlug(source: WatchableRegulatorySource, item: Pick<ExtractedSourceItem, 'title' | 'content_hash'>) {
  const sourcePart = source.source_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  const titlePart = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return `${sourcePart}-${titlePart || 'source-change'}-${item.content_hash.slice(0, 10)}`
}

export function buildPrivateSummary(source: WatchableRegulatorySource, item: ExtractedSourceItem) {
  return normalizeWhitespace(`${source.source_name} detected source material requiring review. ${item.summary || item.title}`).slice(0, 900)
}

export function sourceStatusFromResult(changed: boolean): SourceWatchStatus {
  return changed ? 'changed' : 'healthy'
}

export async function checkRegulatorySource(source: WatchableRegulatorySource, fetchImpl: typeof fetch = fetch): Promise<SourceCheckResult> {
  const started = Date.now()
  const sourceUrl = sourceFetchUrl(source)
  const previousHash = source.last_content_hash || null

  if (!sourceUrl) {
    return {
      status: 'blocked',
      source_url: source.base_url,
      http_status: null,
      response_time_ms: Date.now() - started,
      title: source.source_name,
      raw_text: '',
      content_hash: hashContent(''),
      previous_hash: previousHash,
      changed: false,
      relevant: false,
      signal_type: 'regulatory_guidance',
      error_message: 'No fetchable source URL is configured.',
      items: [],
    }
  }

  try {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: source.access_method === 'api' ? 'application/json,text/plain;q=0.9,*/*;q=0.8' : 'text/html,application/xhtml+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'Harbourview Fresh Sources Watcher/1.0 (+https://harbourview-platform.vercel.app)',
      },
      cache: 'no-store',
    })

    const raw = await response.text()
    const responseTime = Date.now() - started

    if (!response.ok) {
      return {
        status: response.status === 401 || response.status === 403 ? 'blocked' : 'failing',
        source_url: sourceUrl,
        http_status: response.status,
        response_time_ms: responseTime,
        title: source.source_name,
        raw_text: raw.slice(0, 2000),
        content_hash: hashContent(raw),
        previous_hash: previousHash,
        changed: false,
        relevant: false,
        signal_type: 'regulatory_guidance',
        error_message: `Fetch failed with HTTP ${response.status}`,
        items: [],
      }
    }

    const contentType = response.headers.get('content-type') || ''
    let title = source.source_name
    let text = raw
    let items: ExtractedSourceItem[] = []

    if (source.access_method === 'api' || contentType.includes('application/json')) {
      try {
        const json = JSON.parse(raw)
        items = extractApiItems(json, source, sourceUrl)
        text = normalizeWhitespace(JSON.stringify(json).slice(0, 20000))
        title = items[0]?.title || source.source_name
      } catch {
        text = stripHtml(raw)
      }
    } else if (source.access_method === 'rss' || contentType.includes('xml') || /<rss|<feed|<item\b|<entry\b/i.test(raw)) {
      items = extractRssItems(raw, source)
      text = stripHtml(raw)
      title = items[0]?.title || source.source_name
    } else {
      text = stripHtml(raw)
      title = titleFromHtml(raw, source.source_name)
    }

    const normalizedText = normalizeWhitespace(text).slice(0, 30000)
    const contentHash = hashContent(normalizedText)
    const changed = previousHash ? previousHash !== contentHash : true
    const relevant = isRelevantRegulatoryText(normalizedText) || items.some((item) => item.relevant)
    const signalType = classifySignalType(normalizedText)

    if (!items.length) {
      items = [{ title, url: sourceUrl, published_at: null, summary: normalizedText.slice(0, 600), raw_text: normalizedText, content_hash: contentHash, relevant, signal_type: signalType }]
    }

    return {
      status: sourceStatusFromResult(changed),
      source_url: sourceUrl,
      http_status: response.status,
      response_time_ms: responseTime,
      title,
      raw_text: normalizedText,
      content_hash: contentHash,
      previous_hash: previousHash,
      changed,
      relevant,
      signal_type: signalType,
      error_message: null,
      items,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch failure'
    return {
      status: 'failing',
      source_url: sourceUrl,
      http_status: null,
      response_time_ms: Date.now() - started,
      title: source.source_name,
      raw_text: '',
      content_hash: hashContent(message),
      previous_hash: previousHash,
      changed: false,
      relevant: false,
      signal_type: 'regulatory_guidance',
      error_message: message,
      items: [],
    }
  }
}

export function publicSignalSourceFields(source: WatchableRegulatorySource): {
  source_tier: RegulatorySourceTier
  source_type: RegulatorySourceType
  country_code: string | null
  country_name: string | null
  region: string | null
  jurisdiction: string | null
  regulator_name: string | null
} {
  return {
    source_tier: source.source_tier,
    source_type: source.source_type,
    country_code: source.country_code,
    country_name: source.country_name,
    region: source.region,
    jurisdiction: source.jurisdiction,
    regulator_name: source.regulator_name,
  }
}
