'use client'

import { HarbourviewGlobeClientLoader } from './HarbourviewGlobeClientLoader'

export default function StaticGlobeFallback() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[520px]"
      aria-label="Harbourview globe"
    >
      <HarbourviewGlobeClientLoader />
    </div>
  )
}
