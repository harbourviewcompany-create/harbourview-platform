import { describe, expect, it } from 'vitest'

import {
  getHarbourviewAuthCallbackUrl,
  getHarbourviewAuthOrigin,
} from '@/lib/auth/canonicalRedirect'

describe('Harbourview auth callback URLs', () => {
  it('pins preview and legacy deployments to the stable production origin', () => {
    expect(
      getHarbourviewAuthCallbackUrl(
        '/reset-password',
        'https://harbourview-platform-tylercampbellott-4320s-projects.vercel.app',
      ),
    ).toBe('https://harbourview.vercel.app/auth/callback?next=%2Freset-password')
  })

  it('keeps localhost callbacks local during development', () => {
    expect(getHarbourviewAuthOrigin('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('rejects external or protocol-relative next destinations', () => {
    expect(getHarbourviewAuthCallbackUrl('//example.com')).toBe(
      'https://harbourview.vercel.app/auth/callback?next=%2Fdashboard',
    )
  })
})
