// lib/intelligence-engine/iso-codes.ts
//
// ISO 3166-1 Alpha-2 → Alpha-3 conversion.
//
// Source: live `countries` table (zvxdgdkukjrrwamdpqrg), pulled Jun 18 2026.
// Generated, not hand-typed, to avoid transcription error.
//
// Why this exists:
// `source_registry.iso` stores Alpha-2 codes (e.g. 'CA', 'DE', 'BR').
// Several downstream Zod schemas (lib/intelligence-engine/types.ts,
// lib/intelligence-engine/adapters/ai-extractor.ts, lib/scraper/registry.ts)
// declare `country_code: z.string().length(3)` — i.e. Alpha-3 — and their own
// seed/example data ('DEU', 'CAN') confirms Alpha-3 was the intended contract.
// Passing a raw Alpha-2 code into that contract fails validation on every
// non-coincidental case. This map performs the conversion at the one place
// ScrapeTarget.country_code is constructed (task-queue.ts: mapRow()).

export const ISO2_TO_ISO3: Record<string, string> = {
  AD: 'AND', AE: 'ARE', AF: 'AFG', AG: 'ATG', AL: 'ALB', AM: 'ARM', AO: 'AGO',
  AR: 'ARG', AT: 'AUT', AU: 'AUS', AZ: 'AZE', BA: 'BIH', BB: 'BRB', BD: 'BGD',
  BE: 'BEL', BF: 'BFA', BG: 'BGR', BH: 'BHR', BI: 'BDI', BJ: 'BEN', BN: 'BRN',
  BO: 'BOL', BR: 'BRA', BS: 'BHS', BT: 'BTN', BW: 'BWA', BY: 'BLR', BZ: 'BLZ',
  CA: 'CAN', CD: 'COD', CF: 'CAF', CG: 'COG', CH: 'CHE', CI: 'CIV', CL: 'CHL',
  CM: 'CMR', CN: 'CHN', CO: 'COL', CR: 'CRI', CU: 'CUB', CV: 'CPV', CY: 'CYP',
  CZ: 'CZE', DE: 'DEU', DJ: 'DJI', DK: 'DNK', DM: 'DMA', DO: 'DOM', DZ: 'DZA',
  EC: 'ECU', EE: 'EST', EG: 'EGY', EH: 'SAH', ER: 'ERI', ES: 'ESP', ET: 'ETH',
  FI: 'FIN', FJ: 'FJI', FK: 'FLK', FM: 'FSM', FO: 'FRO', FR: 'FRA', GA: 'GAB',
  GB: 'GBR', GD: 'GRD', GE: 'GEO', GH: 'GHA', GL: 'GRL', GM: 'GMB', GN: 'GIN',
  GQ: 'GNQ', GR: 'GRC', GT: 'GTM', GW: 'GNB', GY: 'GUY', HK: 'HKG', HN: 'HND',
  HR: 'HRV', HT: 'HTI', HU: 'HUN', ID: 'IDN', IE: 'IRL', IL: 'ISR', IN: 'IND',
  IQ: 'IRQ', IR: 'IRN', IS: 'ISL', IT: 'ITA', JM: 'JAM', JO: 'JOR', JP: 'JPN',
  KE: 'KEN', KG: 'KGZ', KH: 'KHM', KI: 'KIR', KM: 'COM', KN: 'KNA', KP: 'PRK',
  KR: 'KOR', KW: 'KWT', KZ: 'KAZ', LA: 'LAO', LB: 'LBN', LC: 'LCA', LI: 'LIE',
  LK: 'LKA', LR: 'LBR', LS: 'LSO', LT: 'LTU', LU: 'LUX', LV: 'LVA', LY: 'LBY',
  MA: 'MAR', MC: 'MCO', MD: 'MDA', ME: 'MNE', MG: 'MDG', MH: 'MHL', MK: 'MKD',
  ML: 'MLI', MM: 'MMR', MN: 'MNG', MR: 'MRT', MT: 'MLT', MU: 'MUS', MV: 'MDV',
  MW: 'MWI', MX: 'MEX', MY: 'MYS', MZ: 'MOZ', NA: 'NAM', NE: 'NER', NG: 'NGA',
  NI: 'NIC', NL: 'NLD', NO: 'NOR', NP: 'NPL', NR: 'NRU', NZ: 'NZL', OM: 'OMN',
  PA: 'PAN', PE: 'PER', PG: 'PNG', PH: 'PHL', PK: 'PAK', PL: 'POL', PR: 'PRI',
  PS: 'PSX', PT: 'PRT', PW: 'PLW', PY: 'PRY', QA: 'QAT', RO: 'ROU', RS: 'SRB',
  RU: 'RUS', RW: 'RWA', SA: 'SAU', SB: 'SLB', SC: 'SYC', SD: 'SDN', SE: 'SWE',
  SG: 'SGP', SI: 'SVN', SK: 'SVK', SL: 'SLE', SM: 'SMR', SN: 'SEN', SO: 'SOM',
  SR: 'SUR', SS: 'SDS', ST: 'STP', SV: 'SLV', SY: 'SYR', SZ: 'SWZ', TD: 'TCD',
  TG: 'TGO', TH: 'THA', TJ: 'TJK', TL: 'TLS', TM: 'TKM', TN: 'TUN', TO: 'TON',
  TR: 'TUR', TT: 'TTO', TV: 'TUV', TW: 'TWN', TZ: 'TZA', UA: 'UKR', UG: 'UGA',
  US: 'USA', UY: 'URY', UZ: 'UZB', VA: 'VAT', VC: 'VCT', VE: 'VEN', VN: 'VNM',
  VU: 'VUT', WS: 'WSM', XK: 'KOS', YE: 'YEM', ZA: 'ZAF', ZM: 'ZMB', ZW: 'ZWE',
};

/**
 * Convert an ISO Alpha-2 country code to Alpha-3.
 * Falls back to 'GLB' (not a real ISO code, used as a safe sentinel) for
 * unmapped/unknown input so a single bad source_registry.iso value
 * (e.g. the 'CB' data-quality issue flagged Jun 18 2026) can't crash a
 * whole batch — it'll just fail more specific downstream filters instead.
 */
export function toIso3(iso2: string | null | undefined): string {
  if (!iso2) return 'GLB';
  const upper = iso2.trim().toUpperCase();
  return ISO2_TO_ISO3[upper] || 'GLB';
}
