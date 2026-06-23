export interface CountryGeo {
  iso2: string;
  iso3: string;
  name: string;
  region: string;
  subregion?: string;
  center: [number, number]; // lat, lng
  areaKm2?: number;
  population?: number;
  cannabisTier: 'high' | 'medium' | 'low' | 'emerging' | 'restricted';
  hempLegal: boolean;
  localIntelSummary?: string;
}

export const COUNTRIES: CountryGeo[] = [
  {
    iso2: 'US',
    iso3: 'USA',
    name: 'United States',
    region: 'Americas',
    center: [37.09, -95.71],
    cannabisTier: 'high',
    hempLegal: true,
    localIntelSummary: 'Federal hemp legal (0.3% THC). State-by-state recreational/medical variation. Strong market + genetics focus.'
  },
  {
    iso2: 'CA',
    iso3: 'CAN',
    name: 'Canada',
    region: 'Americas',
    center: [56.13, -106.35],
    cannabisTier: 'high',
    hempLegal: true,
    localIntelSummary: 'Fully legalized recreational since 2018. Robust licensing and export opportunities.'
  },
  {
    iso2: 'DE',
    iso3: 'DEU',
    name: 'Germany',
    region: 'Europe',
    center: [51.16, 10.45],
    cannabisTier: 'medium',
    hempLegal: true,
    localIntelSummary: 'Medical access expanded. Partial recreational pilots. Strong EU regulatory alignment.'
  },
  // Note: Full list of ~250 countries would go here. This is a starter with key markets.
  // Expand by adding more entries or a generator script.
  {
    iso2: 'GB',
    iso3: 'GBR',
    name: 'United Kingdom',
    region: 'Europe',
    center: [55.37, -3.44],
    cannabisTier: 'medium',
    hempLegal: true,
    localIntelSummary: 'Medical cannabis legal. Recreational remains restricted with ongoing reform discussions.'
  },
  // Add more as needed for every country baseline
];

export function getCountryByIso(iso: string): CountryGeo | undefined {
  return COUNTRIES.find(c => 
    c.iso2.toUpperCase() === iso.toUpperCase() || 
    c.iso3.toUpperCase() === iso.toUpperCase()
  );
}

export function getCountriesByRegion(region: string): CountryGeo[] {
  return COUNTRIES.filter(c => c.region === region);
}
