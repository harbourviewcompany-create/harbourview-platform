/**
 * ANVISA Produtos de Cannabis — product-by-product feed.
 * Primary consultation UI: https://consultas.anvisa.gov.br/#/cannabis/
 * Also attempts public listing pages. Seeds curated Autorização Sanitária rows
 * when live HTML does not expose structured product JSON.
 */

export type AnvisaSkuRow = {
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
  sourceType: 'authority_register_live' | 'authority_register_snapshot' | 'class_reference' | 'manual_curated'
  notes: string
  holderName?: string | null
}

export type AnvisaSkuFeedResult = {
  authority: 'ANVISA'
  countryIso2: 'BR'
  status: 'success' | 'partial' | 'degraded' | 'failed'
  sourceUrl: string
  httpStatus: number | null
  rows: AnvisaSkuRow[]
  errorMessage?: string
  rawFingerprint?: string
}

const CONSULTAS_URL = 'https://consultas.anvisa.gov.br/#/cannabis/'
const NEWS_URL =
  'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-aprova-por-unanimidade-regras-que-cumprem-decisao-do-stj-para-producao-de-cannabis-medicinal'

/**
 * Curated product-level snapshot from public ANVISA Autorização Sanitária listings
 * reported in open sources (AS numbers). Always instruct clinicians to re-check
 * https://consultas.anvisa.gov.br/#/cannabis/ before prescribing.
 */
export const ANVISA_CURATED_AS_PRODUCTS: AnvisaSkuRow[] = [
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: '159910001', brandName: 'Canabidiol Nunature', productName: 'Canabidiol Nunature 17,18 mg/mL', strengthLabel: '17,18 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD (fitofármaco)', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Autorização Sanitária pública. Verificar validade e situação em consultas.anvisa.gov.br.', holderName: 'Nunature Distribuição do Brasil Ltda' },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: '159910002', brandName: 'Canabidiol Nunature', productName: 'Canabidiol Nunature 34,36 mg/mL', strengthLabel: '34,36 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD (fitofármaco)', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Autorização Sanitária pública. Verificar validade e situação em consultas.anvisa.gov.br.', holderName: 'Nunature Distribuição do Brasil Ltda' },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: '110630158', brandName: 'Canabidiol Farmanguinhos', productName: 'Canabidiol Farmanguinhos', strengthLabel: null, dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD (fitofármaco)', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Autorização Sanitária pública (Fiocruz/Farmanguinhos). Verificar em consultas.anvisa.gov.br.', holderName: 'Fundação Oswaldo Cruz' },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: '143130001', brandName: 'Promediol', productName: 'Extrato de Cannabis Sativa Promediol', strengthLabel: null, dosageForm: 'extrato', route: 'oral', cannabinoidProfile: 'Extrato de Cannabis (fitoterápico)', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Autorização Sanitária pública. Verificar em consultas.anvisa.gov.br.', holderName: 'Promediol do Brasil Ltda' },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: '142730001', brandName: 'Zion Medpharma', productName: 'Extrato de Cannabis Sativa Zion Medpharma 200 mg/mL', strengthLabel: '200 mg/mL', dosageForm: 'extrato', route: 'oral', cannabinoidProfile: 'Extrato de Cannabis (fitoterápico)', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Autorização Sanitária pública. Verificar em consultas.anvisa.gov.br.', holderName: 'Endogen Indústria' },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: '145000001', brandName: 'Greencare', productName: 'Extrato de Cannabis Sativa Greencare 79,14 mg/mL', strengthLabel: '79,14 mg/mL', dosageForm: 'extrato', route: 'oral', cannabinoidProfile: 'Extrato de Cannabis (fitoterápico)', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Autorização Sanitária pública. Verificar em consultas.anvisa.gov.br.', holderName: 'Greencare Pharma' },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Active Pharmaceutica', productName: 'Canabidiol Active Pharmaceutica 20 mg/mL', strengthLabel: '20 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Aura Pharma', productName: 'Canabidiol Aura Pharma 50 mg/mL', strengthLabel: '50 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Belcher', productName: 'Canabidiol Belcher 150 mg/mL', strengthLabel: '150 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Ease Labs', productName: 'Canabidiol Ease Labs 100 mg/mL', strengthLabel: '100 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Herbarium', productName: 'Canabidiol Herbarium 200 mg/mL', strengthLabel: '200 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Mantecorp Farmasa', productName: 'Canabidiol Mantecorp Farmasa 23,75 mg/mL', strengthLabel: '23,75 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Canabidiol Greencare', productName: 'Canabidiol Greencare 23,75 mg/mL', strengthLabel: '23,75 mg/mL', dosageForm: 'solução oral', route: 'oral', cannabinoidProfile: 'CBD', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar código AS e situação em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Extrato Aura Pharma', productName: 'Extrato de Cannabis Sativa Aura Pharma 200 mg/mL', strengthLabel: '200 mg/mL', dosageForm: 'extrato', route: 'oral', cannabinoidProfile: 'Extrato de Cannabis', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar em consultas.anvisa.gov.br.', holderName: null },
  { countryIso2: 'BR', authority: 'ANVISA', registrationCode: null, brandName: 'Extrato Mantecorp Farmasa', productName: 'Extrato de Cannabis Sativa Mantecorp Farmasa 79,14 mg/mL', strengthLabel: '79,14 mg/mL', dosageForm: 'extrato', route: 'oral', cannabinoidProfile: 'Extrato de Cannabis', authorizationStatus: 'authorised', sourceUrl: CONSULTAS_URL, sourceType: 'manual_curated', notes: 'Produto citado em levantamentos públicos de AS. Confirmar em consultas.anvisa.gov.br.', holderName: null },
]

function fingerprint(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `fnv_${(h >>> 0).toString(16)}`
}

function extractLiveAsNumbers(html: string, sourceUrl: string): AnvisaSkuRow[] {
  const rows: AnvisaSkuRow[] = []
  const re = /(?:AS|autoriza[cç][aã]o\s*sanit[aá]ria|n[uú]mero)\s*[:\s#]*(\d{6,12})/gi
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const code = m[1]
    if (seen.has(code)) continue
    seen.add(code)
    rows.push({
      countryIso2: 'BR',
      authority: 'ANVISA',
      registrationCode: code,
      brandName: null,
      productName: `Produto AS ${code}`,
      strengthLabel: null,
      dosageForm: null,
      route: null,
      cannabinoidProfile: null,
      authorizationStatus: 'listed',
      sourceUrl,
      sourceType: 'authority_register_live',
      notes: 'Código AS extraído de página pública. Confirmar produto completo em consultas.anvisa.gov.br.',
    })
    if (rows.length >= 80) break
  }
  return rows
}

export async function fetchAnvisaSkuFeed(fetchImpl: typeof fetch = fetch): Promise<AnvisaSkuFeedResult> {
  let lastStatus: number | null = null
  let lastError: string | undefined
  let liveRows: AnvisaSkuRow[] = []
  let fp: string | undefined

  for (const url of [CONSULTAS_URL, NEWS_URL]) {
    try {
      const res = await fetchImpl(url, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(30000),
      })
      lastStatus = res.status
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        continue
      }
      const html = await res.text()
      fp = fingerprint(html.slice(0, 80000))
      liveRows = extractLiveAsNumbers(html, url)
      if (liveRows.length > 0) break
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'fetch failed'
    }
  }

  // Merge curated product-level catalogue (always) with any live AS codes
  const byKey = new Map<string, AnvisaSkuRow>()
  for (const r of ANVISA_CURATED_AS_PRODUCTS) {
    byKey.set(`${r.registrationCode ?? ''}::${r.productName}`, r)
  }
  for (const r of liveRows) {
    const k = `${r.registrationCode ?? ''}::${r.productName}`
    if (!byKey.has(k)) byKey.set(k, r)
  }
  const rows = [...byKey.values()]

  if (liveRows.length > 0) {
    return {
      authority: 'ANVISA',
      countryIso2: 'BR',
      status: 'partial',
      sourceUrl: CONSULTAS_URL,
      httpStatus: lastStatus,
      rows,
      rawFingerprint: fp,
      errorMessage: 'Live tokens merged with curated Autorização Sanitária product catalogue',
    }
  }

  return {
    authority: 'ANVISA',
    countryIso2: 'BR',
    status: lastStatus && lastStatus >= 400 ? 'degraded' : 'partial',
    sourceUrl: CONSULTAS_URL,
    httpStatus: lastStatus,
    rows,
    errorMessage:
      lastError ??
      'SPA consultas portal did not yield structured rows; using curated product-level Autorização Sanitária catalogue. Always re-verify on consultas.anvisa.gov.br.',
    rawFingerprint: fp,
  }
}
