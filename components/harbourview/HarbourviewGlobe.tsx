'use client'

import { CandidateBGlobe } from './CandidateBGlobe'

interface HarbourviewGlobeProps {
  selectedCountryIso2?: string
  onSelectCountry?: (iso2: string) => void
  reducedMotion?: boolean
  variant?: 'candidate-b'
}

export function HarbourviewGlobe({
  selectedCountryIso2,
  onSelectCountry,
  reducedMotion = false,
}: HarbourviewGlobeProps) {
  return (
    <CandidateBGlobe
      selectedCountryIso2={selectedCountryIso2}
      onSelectCountry={onSelectCountry}
      reducedMotion={reducedMotion}
    />
  )
}
