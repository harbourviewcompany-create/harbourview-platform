import 'server-only'

export type MarketEconomicsSourceRecord = {
  key: string
  label: string
  url: string
  reviewedAt: string
}

export const MARKET_ECONOMICS_SOURCE_REGISTRY: readonly MarketEconomicsSourceRecord[] = [
  {
    key: 'canada-export-h1-2026',
    label: 'Statistics Canada trade data analysis — H1 2026 cannabis export corridors',
    url: 'https://cannamonitor.com/australia/',
    reviewedAt: '2026-10-08',
  },
  {
    key: 'germany-pharmacy-2026-10-08',
    label: 'Grammpreis — German medical cannabis pharmacy price tracker',
    url: 'https://grammpreis.de/preise',
    reviewedAt: '2026-10-08',
  },
  {
    key: 'australia-odc-2025',
    label: 'Australian Office of Drug Control — cannabis import/export/production data',
    url: 'https://www.odc.gov.au/australian-cannabis-data-import-export-production-and-stock',
    reviewedAt: '2026-10-08',
  },
  {
    key: 'poland-pharmacy-2026-10',
    label: 'Kanaba / GdziePoLek — Polish medical cannabis pharmacy pricing snapshot',
    url: 'https://kanaba.pl/artykuly/ile-kosztuje-medyczna-marihuana-w-aptece-ceny-suszy/',
    reviewedAt: '2026-10-08',
  },
  {
    key: 'uk-price-index-2026-10-08',
    label: 'LeafMe — UK Medical Cannabis Price Index',
    url: 'https://leafme.co.uk/price-index',
    reviewedAt: '2026-10-08',
  },
  {
    key: 'nz-retail-2026-09',
    label: 'Whakamana Cannabis Museum — New Zealand medicinal cannabis cost review',
    url: 'https://cannabismuseum.co.nz/blogs/news/medicinal-cannabis-cost-nz',
    reviewedAt: '2026-10-08',
  },
] as const
