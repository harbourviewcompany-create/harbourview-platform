/**
 * TGA medicinal cannabis product list feed — SAS/AP category sponsor tables.
 * Primary source: https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list
 */

import { parseHtmlTables, parseMarkdownTables, detectCategoryFromContext } from './parseAuthorityTables'

export type TgaSkuRow = {
  countryIso2: 'AU'
  authority: 'TGA'
  registrationCode: string | null
  brandName: string | null
  productName: string
  strengthLabel: string | null
  dosageForm: string | null
  route: string | null
  cannabinoidProfile: string | null
  authorizationStatus: string
  sourceUrl: string | null
  sourceType: 'authority_register_live' | 'authority_register_snapshot' | 'class_reference'
  notes: string
  sponsorName?: string | null
  sasCategory?: string | null
}

export type TgaSkuFeedResult = {
  authority: 'TGA'
  countryIso2: 'AU'
  status: 'success' | 'partial' | 'degraded' | 'failed'
  sourceUrl: string
  httpStatus: number | null
  rows: TgaSkuRow[]
  errorMessage?: string
  rawFingerprint?: string
}

const TGA_PRODUCT_LIST_URL =
  'https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list'

function fingerprint(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `fnv_${(h >>> 0).toString(16)}`
}

function mapTableToRows(
  headers: string[],
  rows: string[][],
  category: string | null,
  sourceUrl: string,
): TgaSkuRow[] {
  const h = headers.map((x) => x.toLowerCase())
  const idxForm = h.findIndex((x) => /dosage|form/.test(x))
  const idxActive = h.findIndex((x) => /active|ingredient/.test(x))
  const idxQty = h.findIndex((x) => /qty|quantity|unit/.test(x))
  const idxSponsor = h.findIndex((x) => /sponsor|name of sponsor/.test(x))

  const out: TgaSkuRow[] = []
  for (const cells of rows) {
    const form = idxForm >= 0 ? cells[idxForm] : cells[0]
    const active = idxActive >= 0 ? cells[idxActive] : cells[1]
    const qty = idxQty >= 0 ? cells[idxQty] : cells[2]
    const sponsor = idxSponsor >= 0 ? cells[idxSponsor] : cells[cells.length - 1]
    if (!active && !sponsor) continue
    const productName = [form, active, qty].filter(Boolean).join(' · ')
    out.push({
      countryIso2: 'AU',
      authority: 'TGA',
      registrationCode: null,
      brandName: null,
      productName: productName.slice(0, 240),
      strengthLabel: qty || null,
      dosageForm: form || null,
      route: inferRoute(form),
      cannabinoidProfile: active || null,
      authorizationStatus: 'authorised',
      sourceUrl,
      sourceType: 'authority_register_live',
      notes: [
        category ? `SAS/AP ${category}` : 'SAS/AP category product (TGA sponsor report)',
        sponsor ? `Sponsor: ${sponsor}` : null,
        'Unapproved medicinal cannabis — verify current TGA list and state controlled-drug rules. Inclusion does not guarantee availability.',
      ]
        .filter(Boolean)
        .join(' '),
      sponsorName: sponsor || null,
      sasCategory: category,
    })
  }
  return out
}

function inferRoute(form: string | undefined): string | null {
  if (!form) return null
  const f = form.toLowerCase()
  if (/oral|liquid|capsule|tablet|pastille/.test(f)) return 'oral'
  if (/herb|dried|inhal/.test(f)) return 'inhaled'
  if (/cream|topical/.test(f)) return 'topical'
  if (/metered|inhaler/.test(f)) return 'inhaled'
  return null
}

/** Split document into category sections and parse tables under each. */
export function parseTgaProductListDocument(raw: string, sourceUrl: string): TgaSkuRow[] {
  const rows: TgaSkuRow[] = []
  // Prefer markdown tables (common in scraped text)
  const mdTables = parseMarkdownTables(raw)
  if (mdTables.length > 0) {
    // Assign categories by scanning position in document
    for (const table of mdTables) {
      const idx = raw.indexOf(table.headers.join(' | '))
      const before = idx > 0 ? raw.slice(Math.max(0, idx - 400), idx) : ''
      const category = detectCategoryFromContext(before)
      rows.push(...mapTableToRows(table.headers, table.rows, category, sourceUrl))
    }
  }

  if (rows.length === 0) {
    const htmlTables = parseHtmlTables(raw)
    for (const table of htmlTables) {
      const category = null
      rows.push(...mapTableToRows(table.headers, table.rows, category, sourceUrl))
    }
  }

  // Dedupe by productName + sponsor
  const seen = new Set<string>()
  return rows.filter((r) => {
    const k = `${r.productName}::${r.sponsorName ?? ''}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export async function fetchTgaSkuFeed(fetchImpl: typeof fetch = fetch): Promise<TgaSkuFeedResult> {
  try {
    const res = await fetchImpl(TGA_PRODUCT_LIST_URL, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      signal: AbortSignal.timeout(45000),
    })
    if (!res.ok) {
      return {
        authority: 'TGA',
        countryIso2: 'AU',
        status: 'failed',
        sourceUrl: TGA_PRODUCT_LIST_URL,
        httpStatus: res.status,
        rows: [],
        errorMessage: `HTTP ${res.status}`,
      }
    }
    const raw = await res.text()
    const parsed = parseTgaProductListDocument(raw, TGA_PRODUCT_LIST_URL)
    if (parsed.length === 0) {
      return {
        authority: 'TGA',
        countryIso2: 'AU',
        status: 'degraded',
        sourceUrl: TGA_PRODUCT_LIST_URL,
        httpStatus: res.status,
        rows: [],
        errorMessage: 'TGA page loaded but no product table rows parsed',
        rawFingerprint: fingerprint(raw.slice(0, 80000)),
      }
    }
    return {
      authority: 'TGA',
      countryIso2: 'AU',
      status: parsed.length >= 20 ? 'success' : 'partial',
      sourceUrl: TGA_PRODUCT_LIST_URL,
      httpStatus: res.status,
      rows: parsed,
      rawFingerprint: fingerprint(raw.slice(0, 80000)),
    }
  } catch (e) {
    return {
      authority: 'TGA',
      countryIso2: 'AU',
      status: 'failed',
      sourceUrl: TGA_PRODUCT_LIST_URL,
      httpStatus: null,
      rows: [],
      errorMessage: e instanceof Error ? e.message : 'TGA feed failed',
    }
  }
}
