/**
 * ANVISA medical cannabis product register feed.
 * Attempts live fetch from public ANVISA resources; records degraded status when blocked.
 * Never invents registration codes — only persists rows with explicit identifiers or class snapshots.
 */

export type SkuFeedRow = {
  countryIso2: 'BR'
  authority: 'ANVISA'
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
}

export type SkuFeedResult = {
  authority: 'ANVISA'
  countryIso2: 'BR'
  status: 'success' | 'partial' | 'degraded' | 'failed'
  sourceUrl: string
  httpStatus: number | null
  rows: SkuFeedRow[]
  errorMessage?: string
  rawFingerprint?: string
}

const ANVISA_CANDIDATE_URLS = [
  'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cannabis',
  'https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/medicamentos',
]

function fingerprint(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `fnv_${(h >>> 0).toString(16)}`
}

/** Conservative curated snapshot used when live HTML cannot be parsed into SKUs. */
function snapshotRows(sourceUrl: string): SkuFeedRow[] {
  return [
    {
      countryIso2: 'BR',
      authority: 'ANVISA',
      registrationCode: null,
      brandName: null,
      productName: 'ANVISA-authorised CBD oral products (register class)',
      strengthLabel: 'Per product registration',
      dosageForm: 'oil / oral solution',
      route: 'oral / oromucosal',
      cannabinoidProfile: 'CBD-dominant; THC limits per registration',
      authorizationStatus: 'authorised',
      sourceUrl,
      sourceType: 'authority_register_snapshot',
      notes:
        'Live SKU enumeration depends on ANVISA public register availability. Confirm exact brand, registration code and strength on the live ANVISA register before prescribing.',
    },
    {
      countryIso2: 'BR',
      authority: 'ANVISA',
      registrationCode: null,
      brandName: null,
      productName: 'Individual import authorisation pathway products',
      strengthLabel: 'Varies',
      dosageForm: 'varies',
      route: 'varies',
      cannabinoidProfile: 'Varies by authorised product',
      authorizationStatus: 'import-authorised',
      sourceUrl,
      sourceType: 'class_reference',
      notes:
        'Import authorisation pathway — not a fixed SKU list. Verify current ANVISA process for each patient product.',
    },
  ]
}

/**
 * Extract registration-like tokens from HTML when present (best-effort).
 * Does not invent codes.
 */
function extractCandidateSkus(html: string, sourceUrl: string): SkuFeedRow[] {
  const rows: SkuFeedRow[] = []
  // Common patterns: process numbers, product names near cannabis
  const processRe = /(?:processo|registro|n[ºo°]?\.?\s*)(\d{5,}/\d{2,4}|\d{8,})/gi
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = processRe.exec(html)) !== null) {
    const code = m[1]
    if (seen.has(code)) continue
    seen.add(code)
    rows.push({
      countryIso2: 'BR',
      authority: 'ANVISA',
      registrationCode: code,
      brandName: null,
      productName: `ANVISA register entry ${code}`,
      strengthLabel: null,
      dosageForm: null,
      route: null,
      cannabinoidProfile: null,
      authorizationStatus: 'listed',
      sourceUrl,
      sourceType: 'authority_register_live',
      notes: 'Parsed from public ANVISA HTML. Verify full product particulars on the live register.',
    })
    if (rows.length >= 40) break
  }
  return rows
}

export async function fetchAnvisaSkuFeed(fetchImpl: typeof fetch = fetch): Promise<SkuFeedResult> {
  let lastStatus: number | null = null
  let lastUrl = ANVISA_CANDIDATE_URLS[0]
  let lastError: string | undefined

  for (const url of ANVISA_CANDIDATE_URLS) {
    lastUrl = url
    try {
      const res = await fetchImpl(url, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; HarbourviewClinicalFeed/1.0; +https://harbourview.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(20000),
      })
      lastStatus = res.status
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        continue
      }
      const html = await res.text()
      const live = extractCandidateSkus(html, url)
      if (live.length > 0) {
        return {
          authority: 'ANVISA',
          countryIso2: 'BR',
          status: 'success',
          sourceUrl: url,
          httpStatus: res.status,
          rows: live,
          rawFingerprint: fingerprint(html.slice(0, 50000)),
        }
      }
      // Page loaded but no SKU tokens — degraded snapshot
      return {
        authority: 'ANVISA',
        countryIso2: 'BR',
        status: 'degraded',
        sourceUrl: url,
        httpStatus: res.status,
        rows: snapshotRows(url),
        errorMessage: 'Live page reachable but no registration tokens parsed; using curated snapshot',
        rawFingerprint: fingerprint(html.slice(0, 50000)),
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'fetch failed'
    }
  }

  return {
    authority: 'ANVISA',
    countryIso2: 'BR',
    status: 'failed',
    sourceUrl: lastUrl,
    httpStatus: lastStatus,
    rows: snapshotRows(lastUrl),
    errorMessage: lastError ?? 'ANVISA feed unreachable',
  }
}
