/**
 * Clinical source-currentness — identifier registries (Phase B)
 * Crossref DOI, NCBI PMID, OpenAlex secondary.
 */

const FETCH_TIMEOUT_MS = 15_000

function userAgent(): string {
  return process.env.CROSSREF_MAILTO
    ? `HarbourviewClinicalSourceCheck/1.1 (mailto:${process.env.CROSSREF_MAILTO})`
    : 'HarbourviewClinicalSourceCheck/1.1 (clinical evidence provenance; +https://harbourview.vercel.app)'
}

export type IdResult = {
  valid: boolean | null
  title?: string
  publisher?: string
  retracted?: boolean
  notes?: string
}

export async function resolveDoi(doi: string): Promise<IdResult> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) return { valid: false, notes: 'DOI not found in Crossref' }
    if (!res.ok) return { valid: null, notes: `Crossref HTTP ${res.status}` }
    const msg = ((await res.json()) as any)?.message
    if (!msg) return { valid: null, notes: 'Empty Crossref message' }
    const title = Array.isArray(msg.title) ? msg.title[0] : msg.title
    const updateTo = msg['update-to'] as Array<{ type?: string }> | undefined
    const retracted =
      Array.isArray(updateTo) &&
      updateTo.some((u) => /retract|withdraw|expression.of.concern/i.test(String(u.type || '')))
    return {
      valid: true,
      title,
      publisher: msg.publisher,
      retracted: Boolean(retracted),
      notes: retracted ? 'Crossref signals update/retraction-related status' : undefined,
    }
  } catch (err: any) {
    return { valid: null, notes: `Crossref error: ${err?.message || err}` }
  }
}

export async function resolvePmid(pmid: string): Promise<IdResult> {
  try {
    const params = new URLSearchParams({ db: 'pubmed', id: pmid, retmode: 'json' })
    if (process.env.NCBI_API_KEY) params.set('api_key', process.env.NCBI_API_KEY)
    const res = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params}`,
      { headers: { 'User-Agent': userAgent() }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    )
    if (!res.ok) return { valid: null, notes: `NCBI HTTP ${res.status}` }
    const result = ((await res.json()) as any)?.result?.[pmid]
    if (!result || result.error) return { valid: false, notes: result?.error || 'PMID not found' }
    const pubTypes: string[] = Array.isArray(result.pubtype)
      ? result.pubtype
      : result.pubtype
        ? [result.pubtype]
        : []
    const retracted = pubTypes.some((t) => /retract/i.test(String(t)))
    return {
      valid: true,
      title: result.title,
      publisher: result.fulljournalname || result.source,
      retracted,
      notes: retracted ? 'PubMed publication type indicates retraction' : undefined,
    }
  } catch (err: any) {
    return { valid: null, notes: `NCBI error: ${err?.message || err}` }
  }
}

export async function resolveOpenAlex(doi: string | null, pmid: string | null): Promise<IdResult> {
  try {
    let path: string | null = null
    if (doi) path = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`
    else if (pmid) path = `https://api.openalex.org/works/pmid:${encodeURIComponent(pmid)}`
    if (!path) return { valid: null }
    const res = await fetch(path, {
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) return { valid: false, notes: 'Not found in OpenAlex' }
    if (!res.ok) return { valid: null, notes: `OpenAlex HTTP ${res.status}` }
    const data = (await res.json()) as any
    const retracted = Boolean(data?.is_retracted)
    return {
      valid: true,
      title: data?.title || data?.display_name,
      publisher: data?.primary_location?.source?.display_name || data?.host_venue?.display_name,
      retracted,
      notes: retracted ? 'OpenAlex marks work as retracted' : undefined,
    }
  } catch (err: any) {
    return { valid: null, notes: `OpenAlex error: ${err?.message || err}` }
  }
}

export async function probeArchiveAvailability(url: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      {
        headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    )
    if (!res.ok) return false
    const data = (await res.json()) as any
    return Boolean(data?.archived_snapshots?.closest?.available)
  } catch {
    return false
  }
}
