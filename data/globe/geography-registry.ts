/**
 * ISO-3166-1 identity registry used by country-intel tooling.
 *
 * This registry is deliberately identity-only. It must not contain cannabis
 * market-access tiers, hemp legality, regulatory summaries, licensing claims,
 * or other substantive regulatory classifications. Those values require the
 * evidence-backed publication path in lib/globe/supabaseGlobeData.ts.
 *
 * Geographic coordinates are optional because an absent coordinate is an
 * explicit unknown state; [0, 0] is never used as a placeholder.
 */
import { countryIdentityRows } from '@/lib/country-data/generated-country-identity-rows'

export type GeographyStatus = 'unknown' | 'verified'

export interface CountryGeo {
  iso2: string
  iso3: string
  name: string
  region?: string
  subregion?: string
  center?: readonly [number, number]
  areaKm2?: number
  population?: number
  geographyStatus: GeographyStatus
}

// ISO-3166-1 alpha-2/alpha-3 pairs. The identity package supplies the
// repository's existing region/subregion labels where available; the ISO
// registry remains the source of identifier completeness.
const ISO_3166_PAIRS = 'AW,ABW|AF,AFG|AO,AGO|AI,AIA|AX,ALA|AL,ALB|AD,AND|AE,ARE|AR,ARG|AM,ARM|AS,ASM|AQ,ATA|TF,ATF|AG,ATG|AU,AUS|AT,AUT|AZ,AZE|BI,BDI|BE,BEL|BJ,BEN|BQ,BES|BF,BFA|BD,BGD|BG,BGR|BH,BHR|BS,BHS|BA,BIH|BL,BLM|BY,BLR|BZ,BLZ|BM,BMU|BO,BOL|BR,BRA|BB,BRB|BN,BRN|BT,BTN|BV,BVT|BW,BWA|CF,CAF|CA,CAN|CC,CCK|CH,CHE|CL,CHL|CN,CHN|CI,CIV|CM,CMR|CD,COD|CG,COG|CK,COK|CO,COL|KM,COM|CV,CPV|CR,CRI|CU,CUB|CW,CUW|CX,CXR|KY,CYM|CY,CYP|CZ,CZE|DE,DEU|DJ,DJI|DM,DMA|DK,DNK|DO,DOM|DZ,DZA|EC,ECU|EG,EGY|ER,ERI|EH,ESH|ES,ESP|EE,EST|ET,ETH|FI,FIN|FJ,FJI|FK,FLK|FR,FRA|FO,FRO|FM,FSM|GA,GAB|GB,GBR|GE,GEO|GG,GGY|GH,GHA|GI,GIB|GN,GIN|GP,GLP|GM,GMB|GW,GNB|GQ,GNQ|GR,GRC|GD,GRD|GL,GRL|GT,GTM|GF,GUF|GU,GUM|GY,GUY|HK,HKG|HM,HMD|HN,HND|HR,HRV|HT,HTI|HU,HUN|ID,IDN|IM,IMN|IN,IND|IO,IOT|IE,IRL|IR,IRN|IQ,IRQ|IS,ISL|IL,ISR|IT,ITA|JM,JAM|JE,JEY|JO,JOR|JP,JPN|KZ,KAZ|KE,KEN|KG,KGZ|KH,KHM|KI,KIR|KN,KNA|KR,KOR|KW,KWT|LA,LAO|LB,LBN|LR,LBR|LY,LBY|LC,LCA|LI,LIE|LK,LKA|LS,LSO|LT,LTU|LU,LUX|LV,LVA|MO,MAC|MF,MAF|MA,MAR|MC,MCO|MD,MDA|MG,MDG|MV,MDV|MX,MEX|MH,MHL|MK,MKD|ML,MLI|MT,MLT|MM,MMR|ME,MNE|MN,MNG|MP,MNP|MZ,MOZ|MR,MRT|MS,MSR|MQ,MTQ|MU,MUS|MW,MWI|MY,MYS|YT,MYT|NA,NAM|NC,NCL|NE,NER|NF,NFK|NG,NGA|NI,NIC|NU,NIU|NL,NLD|NO,NOR|NP,NPL|NR,NRU|NZ,NZL|OM,OMN|PK,PAK|PA,PAN|PN,PCN|PE,PER|PH,PHL|PW,PLW|PG,PNG|PL,POL|PR,PRI|KP,PRK|PT,PRT|PY,PRY|PS,PSE|PF,PYF|QA,QAT|RE,REU|RO,ROU|RU,RUS|RW,RWA|SA,SAU|SD,SDN|SN,SEN|SG,SGP|GS,SGS|SH,SHN|SJ,SJM|SB,SLB|SL,SLE|SV,SLV|SM,SMR|SO,SOM|PM,SPM|RS,SRB|SS,SSD|ST,STP|SR,SUR|SK,SVK|SI,SVN|SE,SWE|SZ,SWZ|SX,SXM|SC,SYC|SY,SYR|TC,TCA|TD,TCD|TG,TGO|TH,THA|TJ,TJK|TK,TKL|TM,TKM|TL,TLS|TO,TON|TT,TTO|TN,TUN|TR,TUR|TV,TUV|TW,TWN|TZ,TZA|UG,UGA|UA,UKR|UM,UMI|UY,URY|US,USA|UZ,UZB|VA,VAT|VC,VCT|VE,VEN|VG,VGB|VI,VIR|VN,VNM|VU,VUT|WF,WLF|WS,WSM|YE,YEM|ZA,ZAF|ZM,ZMB|ZW,ZWE'

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
const identityByIso3 = new Map(
  countryIdentityRows.map((row) => [String(row[0]).replace(/^country_area:/, '').toUpperCase(), row]),
)

export const COUNTRIES: readonly CountryGeo[] = ISO_3166_PAIRS.split('|').map((pair) => {
  const [iso2, iso3] = pair.split(',')
  const identity = identityByIso3.get(iso3)
  return {
    iso2,
    iso3,
    name: identity?.[2] ? String(identity[2]) : displayNames.of(iso2) ?? iso2,
    region: identity?.[3] ? String(identity[3]) : undefined,
    subregion: identity?.[4] ? String(identity[4]) : undefined,
    geographyStatus: 'unknown',
  }
})

export function getCountryByIso(iso: string): CountryGeo | undefined {
  const normalized = iso.trim().toUpperCase()
  return COUNTRIES.find((country) => country.iso2 === normalized || country.iso3 === normalized)
}

export function getCountriesByRegion(region: string): CountryGeo[] {
  return COUNTRIES.filter((country) => country.region === region)
}

export function getCountryCenter(iso: string): readonly [number, number] | null {
  return getCountryByIso(iso)?.center ?? null
}
