import { describe, expect, it } from 'vitest'
import {
  decideFreshness,
  extractDoi,
  extractPmid,
  normalizeHtmlForHash,
  sha256Hex,
  titlesLikelyMatch,
} from '@/lib/clinical/sourceCurrentness'

describe('extractDoi', () => {
  it('extracts DOI from id field', () => {
    expect(extractDoi('10.1001/jama.2024.1234', 'https://example.com')).toBe('10.1001/jama.2024.1234')
  })
  it('extracts DOI from URL', () => {
    expect(extractDoi(null, 'https://doi.org/10.1056/NEJMoa1234567')).toBe('10.1056/NEJMoa1234567')
  })
  it('returns null when absent', () => {
    expect(extractDoi(null, 'https://example.com/page')).toBeNull()
  })
})

describe('extractPmid', () => {
  it('extracts from pubmed URL', () => {
    expect(extractPmid(null, 'https://pubmed.ncbi.nlm.nih.gov/36346411/')).toBe('36346411')
  })
  it('extracts from pmid: prefix', () => {
    expect(extractPmid('pmid:12345678', 'https://example.com')).toBe('12345678')
  })
})

describe('normalizeHtmlForHash', () => {
  it('strips scripts and stabilizes whitespace', () => {
    const a = normalizeHtmlForHash(
      '<html><script>track()</script><main>Hello   World</main></html>'
    )
    const b = normalizeHtmlForHash(
      '<html><script>other()</script><main>Hello World</main><style>.x{}</style></html>'
    )
    expect(a).toBe(b)
    expect(a).toContain('hello world')
  })
  it('produces different hashes when body content changes', () => {
    const h1 = sha256Hex(normalizeHtmlForHash('<main>version one</main>'))
    const h2 = sha256Hex(normalizeHtmlForHash('<main>version two</main>'))
    expect(h1).not.toBe(h2)
  })
})

describe('titlesLikelyMatch', () => {
  it('matches identical titles', () => {
    expect(titlesLikelyMatch('Cannabidiol for Dravet syndrome', 'Cannabidiol for Dravet syndrome')).toBe(
      true
    )
  })
  it('matches high overlap', () => {
    expect(
      titlesLikelyMatch(
        'Trial of Cannabidiol for Drug-Resistant Seizures in the Dravet Syndrome',
        'Cannabidiol for drug-resistant seizures in Dravet syndrome'
      )
    ).toBe(true)
  })
  it('flags unrelated titles', () => {
    expect(titlesLikelyMatch('Dravet syndrome CBD trial', 'Completely different oncology paper')).toBe(
      false
    )
  })
  it('passes when either side empty', () => {
    expect(titlesLikelyMatch(null, 'Anything')).toBe(true)
    expect(titlesLikelyMatch('Anything', null)).toBe(true)
  })
})

describe('decideFreshness', () => {
  it('degrades on URL failure', () => {
    const r = decideFreshness({
      urlOk: false,
      urlError: 'HTTP 404',
      firstCheck: false,
      hashChanged: false,
      retracted: false,
      titleMismatch: false,
      idNotes: [],
    })
    expect(r.status).toBe('source-degraded')
  })
  it('requires review on retraction', () => {
    const r = decideFreshness({
      urlOk: true,
      firstCheck: false,
      hashChanged: false,
      retracted: true,
      titleMismatch: false,
      idNotes: ['DOI retraction signal'],
    })
    expect(r.status).toBe('review-required')
  })
  it('requires review on title mismatch', () => {
    const r = decideFreshness({
      urlOk: true,
      firstCheck: false,
      hashChanged: false,
      retracted: false,
      titleMismatch: true,
      idNotes: [],
    })
    expect(r.status).toBe('review-required')
  })
  it('marks stale on hash change', () => {
    const r = decideFreshness({
      urlOk: true,
      firstCheck: false,
      hashChanged: true,
      retracted: false,
      titleMismatch: false,
      idNotes: [],
    })
    expect(r.status).toBe('stale')
  })
  it('marks current on first check', () => {
    const r = decideFreshness({
      urlOk: true,
      firstCheck: true,
      hashChanged: false,
      retracted: false,
      titleMismatch: false,
      idNotes: [],
    })
    expect(r.status).toBe('current')
  })
})
