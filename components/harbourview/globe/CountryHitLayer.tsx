'use client'

import { useEffect } from 'react'
import { getGlobeCountryGeometries } from '@/lib/globe/country-geometry-store'

interface CountryHitLayerProps {
  onReady?: (ready: boolean) => void
}

export default function CountryHitLayer({ onReady }: CountryHitLayerProps) {
  useEffect(() => {
    const hasGeometry = getGlobeCountryGeometries().length > 0
    onReady?.(hasGeometry)

    return () => onReady?.(false)
  }, [onReady])

  // Hit testing not yet mounted to mesh; keep layer inert until real raycast layer is implemented.
  return null
}
