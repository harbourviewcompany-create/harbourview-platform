'use client'

import dynamic from 'next/dynamic'
import { featureFlags } from '@/lib/harbourview/feature-flags'
import StaticGlobeFallback from './StaticGlobeFallback'

const InteractiveGlobe = dynamic(() => import('./InteractiveGlobe'), {
  ssr: false,
})

export default function GlobeStage() {
  if (!featureFlags.interactiveGlobe) {
    return <StaticGlobeFallback />
  }

  return <InteractiveGlobe />
}
