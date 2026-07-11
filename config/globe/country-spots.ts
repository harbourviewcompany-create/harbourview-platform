import type { GlobePlateSpot } from '@/types/globe-router'

export const globePlateSpots: GlobePlateSpot[] = [
  { iso2: 'CA', x: 23, y: 27, scale: 1.25 },
  { iso2: 'US', x: 29, y: 43, scale: 1.2 },
  { iso2: 'RU', x: 72, y: 32, scale: 2.85 }, // Large plate to fix black hole
  { iso2: 'CN', x: 78, y: 48, scale: 2.4 },  // China
  { iso2: 'BR', x: 48, y: 72, scale: 1.9 },  // Brazil
  { iso2: 'CO', x: 40, y: 68, scale: 0.84 },
  { iso2: 'UY', x: 50, y: 82, scale: 0.68 },
  { iso2: 'GB', x: 51, y: 30, scale: 0.72 },
  { iso2: 'NL', x: 57, y: 35, scale: 0.62 },
  { iso2: 'DE', x: 61, y: 40, scale: 0.9 },
  { iso2: 'PT', x: 51, y: 49, scale: 0.66 },
  { iso2: 'IL', x: 68, y: 55, scale: 0.62 },
  { iso2: 'ZA', x: 64, y: 86, scale: 0.84 },
  { iso2: 'AU', x: 82, y: 76, scale: 1.06 },
]
