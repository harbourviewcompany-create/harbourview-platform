import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

type UnknownRecord = Record<string, unknown>

export type SafeSignalPresentationRow = {
  summary?: unknown
  source?: unknown
  url?: unknown
  verification?: unknown
  commercial_impact?: unknown
  analysis?: unknown
  date?: unknown
  created_at?: unknown
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}
}

function cleanText(value: unknown, max = 600): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  return text.slice(0, max)
}

function cleanUrl(value: unknown): string | undefined {
  const raw = cleanText(value, 2048)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function cleanList(value: unknown, maxItems = 24, maxItemLength = 240): string[] | undefined {
  const source = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const values = source
    .map(item => cleanText(item, maxItemLength))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems)
  return values.length ? values : undefined
}

function mergeLists(...lists: Array<string[] | undefined>): string[] | undefined {
  const deduped = [...new Set(lists.flatMap(list => list ?? []))]
  return deduped.length ? deduped : undefined
}

function publishedAt(row: SafeSignalPresentationRow, analysis: UnknownRecord): string | undefined {
  return cleanText(analysis.source_published_at, 80)
    ?? cleanText(row.date, 80)
    ?? cleanText(row.created_at, 80)
}

/**
 * Projects the private `signals.analysis` JSON into an explicit authenticated
 * Command DTO. Only named, presentation-safe fields are copied. Raw analysis,
 * source provenance arrays, internal review metadata and evidence payloads are
 * intentionally never returned.
 */
export function buildSafeSignalPresentation(row: SafeSignalPresentationRow): Partial<DashboardSignal> {
  const analysis = asRecord(row.analysis)
  const summary = cleanText(row.summary, 1200)
  const commercialImpact = cleanText(row.commercial_impact, 1200)
  const counterparties = cleanList(analysis.counterparties)
  const jurisdictions = mergeLists(cleanList(analysis.jurisdictions), cleanList(analysis.jurisdiction))
  const facilities = cleanList(analysis.facility)
  const licencesCertifications = mergeLists(
    cleanList(analysis.licence),
    cleanList(analysis.licence_classes),
    cleanList(analysis.licences_certifications),
  )
  const products = mergeLists(cleanList(analysis.product), cleanList(analysis.products))
  const marketAccess = mergeLists(
    cleanList(analysis.market_access),
    cleanList(analysis.origin_market),
    cleanList(analysis.destination_markets),
  )
  const verifiedFacts = cleanList(analysis.verified_facts, 40, 500)
  const inferences = cleanList(analysis.inference, 40, 500)
  const sourceUrl = cleanUrl(row.url)
  const imageUrl = cleanUrl(analysis.image_url)
  const imageStatus = cleanText(analysis.image_status, 120)

  return {
    summary,
    commercialImpact,
    sourceLabel: cleanText(row.source, 300),
    sourceUrl,
    publishedAt: publishedAt(row, analysis),
    verificationStatus: cleanText(row.verification, 160),
    jurisdictions,
    counterparties,
    facilities,
    licencesCertifications,
    products,
    marketAccess,
    verifiedFacts,
    inferences,
    transactionStage: cleanText(analysis.transaction_stage, 160),
    image: imageUrl || imageStatus ? { url: imageUrl, status: imageStatus } : undefined,
    analysis: summary ? { what_changed: summary } : undefined,
  }
}
