/**
 * TGA medicinal cannabis product / pathway feed (Australia).
 * Many products are unregistered (SAS-B / AP). ARTG-listed cannabis medicines are uncommon.
 * Feed records pathway-level and any discoverable ARTG identifiers without inventing codes.
 */

import type { SkuFeedRow, SkuFeedResult as BaseResult } from './anvisaSkuFeed'

export type TgaSkuFeedResult = Omit<BaseResult, 'authority' | 'countryIso2'> & {
  authority: 'TGA'
  countryIso2: 'AU'
}

const TGA_URLS = [
  'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis-hub',
  'https://www.tga.gov.au/resources/resource/guidance/medicinal-cannabis-hub',
]

function fingerprint(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `fnv_${(h >>> 0).toString(16)}`
}

function snapshotRows(sourceUrl: string): Array<SkuFeedRow & { countryIso2: 'AU'; authority: 'TGA' }> {
  return [
    {
      countryIso2: 'AU',
      authority: 'TGA',
      registrationCode: null,
      brandName: null,
      productName: 'TGA SAS-B medicinal cannabis products (pathway class)',
      strengthLabel: 'Sponsor-specific',
      dosageForm: 'varies',
      route: 'varies',
      cannabinoidProfile: 'Wide CBD/THC range',
      authorizationStatus: 'authorised',
      sourceUrl,
      sourceType: 'class_reference',
      notes:
        'Most medicinal cannabis access is via SAS-B or Authorised Prescriber, not ARTG registration. Confirm current TGA pathway rules and sponsor product documents.',
    },
    {
      countryIso2: 'AU',
      authority: 'TGA',
      registrationCode: null,
      brandName: null,
      productName: 'Authorised Prescriber medicinal cannabis products (pathway class)',
      strengthLabel: 'Sponsor-specific',
      dosageForm: 'varies',
      route: 'varies',
      cannabinoidProfile: 'Wide CBD/THC range',
      authorizationStatus: 'authorised',
      sourceUrl,
      sourceType: 'class_reference',
      notes:
        'Authorised Prescriber pathway — product set is clinic/sponsor specific. Verify TGA AP conditions and state controlled-drug rules.',
    },
  ]
}

function extractArtg(html: string, sourceUrl: string): Array<SkuFeedRow & { countryIso2: 'AU'; authority: 'TGA' }> {
  const rows: Array<SkuFeedRow & { countryIso2: 'AU'; authority: 'TGA' }> = []
  const artgRe = /ARTG\s*(?:ID)?\s*:?\s*(\d{5,8})/gi
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = artgRe.exec(html)) !== null) {
    const code = m[1]
    if (seen.has(code)) continue
    seen.add(code)
    rows.push({
      countryIso2: 'AU',
      authority: 'TGA',
      registrationCode: code,
      brandName: null,
      productName: `ARTG ${code}`,
      strengthLabel: null,
      dosageForm: null,
      route: null,
      cannabinoidProfile: null,
      authorizationStatus: 'listed',
      sourceUrl,
      sourceType: 'authority_register_live',
      notes: 'ARTG identifier parsed from public TGA HTML. Confirm product type and indications on the live ARTG.',
    })
    if (rows.length >= 40) break
  }
  return rows
}

export async function fetchTgaSkuFeed(fetchImpl: typeof fetch = fetch): Promise<TgaSkuFeedResult> {
  let lastStatus: number | null = null
  let lastUrl = TGA_URLS[0]
  let lastError: string | undefined

  for (const url of TGA_URLS) {
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
      const live = extractArtg(html, url)
      if (live.length > 0) {
        return {
          authority: 'TGA',
          countryIso2: 'AU',
          status: 'success',
          sourceUrl: url,
          httpStatus: res.status,
          rows: live,
          rawFingerprint: fingerprint(html.slice(0, 50000)),
        }
      }
      return {
        authority: 'TGA',
        countryIso2: 'AU',
        status: 'degraded',
        sourceUrl: url,
        httpStatus: res.status,
        rows: snapshotRows(url),
        errorMessage: 'TGA page reachable but no ARTG tokens parsed; using pathway class snapshot',
        rawFingerprint: fingerprint(html.slice(0, 50000)),
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'fetch failed'
    }
  }

  return {
    authority: 'TGA',
    countryIso2: 'AU',
    status: 'failed',
    sourceUrl: lastUrl,
    httpStatus: lastStatus,
    rows: snapshotRows(lastUrl),
    errorMessage: lastError ?? 'TGA feed unreachable',
  }
}
