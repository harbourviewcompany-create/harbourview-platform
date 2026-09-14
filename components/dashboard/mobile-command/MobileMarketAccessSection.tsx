'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { GlobeProvider } from '@/components/globe/GlobeProvider'
import type { GlobeIntroPhase } from '@/lib/globe/globe-intro'
import { useState } from 'react'
import './MobileMarketAccessSection.css'

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="mobile-market-access-globe-loading" aria-label="Loading Market Access map" /> },
)

type Props = {
  sectionRef: (node: HTMLElement | null) => void
}

export default function MobileMarketAccessSection({ sectionRef }: Props) {
  const router = useRouter()
  const [introPhase, setIntroPhase] = useState<GlobeIntroPhase>('spinning')

  return (
    <section
      ref={sectionRef}
      id="market-access"
      className="hvm2-section mobile-market-access-section"
      aria-labelledby="mobile-market-access-title"
    >
      <div className="mobile-market-access-header">
        <div>
          <p className="hvm2-eyebrow">Command / Market Access</p>
          <h2 id="mobile-market-access-title">Global Market Access</h2>
          <p>Commercial cannabis market-access status across the global jurisdiction universe.</p>
        </div>
        <span className="mobile-market-access-state" data-intro-phase={introPhase}>
          {introPhase === 'ready' ? 'LIVE' : 'LOADING'}
        </span>
      </div>

      <div className="mobile-market-access-globe" aria-label="Interactive Harbourview Market Access globe">
        <GlobeProvider>
          <GlobeCanvas
            className="mobile-market-access-globe-canvas"
            selectedCountryIso2s={[]}
            activeLayerId="market_openness"
            routerStep="country"
            subNationalIso2s={['US', 'DE', 'CA', 'AU']}
            tierPalette="metal"
            onSelectCountry={(iso2) => {
              router.push(`/dashboard?section=jurisdiction&country=${encodeURIComponent(iso2)}`)
            }}
            onIntroPhaseChange={setIntroPhase}
          />
        </GlobeProvider>
      </div>

      <div className="mobile-market-access-note">
        <span>Market Access</span>
        <span>Select a jurisdiction to open its Command briefing.</span>
      </div>
    </section>
  )
}
