'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { buildGlobeQuery, marketKeyFromIso2, parseGlobeRouteState } from './globeRouteState'
import { getGlobeCountryGeometries } from '@/lib/globe/country-geometry-store'
import { extractCountryHit, shouldPromoteHoverToFocus } from '@/lib/globe/country-hit-testing'
import { lonLatToVector3 } from '@/lib/globe/globe-geometry'

const INTERACTIVE_MARKETS = new Set(['DE', 'PT', 'GB', 'UK', 'CA', 'AU', 'BR', 'CO'])

function isCountryAvailable(iso2?: string | null) {
  return Boolean(iso2 && INTERACTIVE_MARKETS.has(iso2.toUpperCase()))
}

export default function CountryHitLayer() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeState = useMemo(() => parseGlobeRouteState(searchParams), [searchParams])
  const pointerStartRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const [focusedIso2, setFocusedIso2] = useState<string | null>(null)

  const selectedIso2 = useMemo(() => {
    const selectedKey = routeState.selectedMarket?.key
    if (selectedKey === 'germany') return 'DE'
    if (selectedKey === 'portugal') return 'PT'
    if (selectedKey === 'uk') return 'GB'
    if (selectedKey === 'canada') return 'CA'
    if (selectedKey === 'australia') return 'AU'
    if (selectedKey === 'latam') return 'BR'
    return null
  }, [routeState.selectedMarket?.key])

  const countries = useMemo(() => getGlobeCountryGeometries(), [])

  const activateCountry = useCallback((iso2: string) => {
    const market = marketKeyFromIso2(iso2)
    if (!market || !isCountryAvailable(iso2)) return
    const query = buildGlobeQuery(searchParams, { market, route: null })
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    pointerStartRef.current = { time: performance.now(), x: event.clientX, y: event.clientY }
  }

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    const hit = extractCountryHit(event)
    if (!hit) return
    const start = pointerStartRef.current
    if (!start) {
      setFocusedIso2(hit.iso2)
      return
    }

    const elapsedMs = performance.now() - start.time
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    const movementDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (shouldPromoteHoverToFocus({ movementDelta, elapsedMs })) {
      setFocusedIso2(hit.iso2)
    }
  }

  const onPointerOut = () => setFocusedIso2(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (!focusedIso2) return
      if (!isCountryAvailable(focusedIso2)) return
      activateCountry(focusedIso2)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activateCountry, focusedIso2])

  return (
    <group>
      {countries.map((country) => {
        const position = lonLatToVector3(country.centroid[0], country.centroid[1], 1.02)
        const disabled = !isCountryAvailable(country.iso2)
        const selected = selectedIso2 === country.iso2
        const focused = focusedIso2 === country.iso2 && !selected

        return (
          <mesh
            key={country.iso2}
            position={[position.x, position.y, position.z]}
            userData={{ iso2: country.iso2, iso3: country.iso3 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerOver={onPointerMove}
            onPointerOut={onPointerOut}
            onClick={(event) => {
              const hit = extractCountryHit(event)
              if (!hit) return
              if (!isCountryAvailable(hit.iso2)) {
                setFocusedIso2(hit.iso2)
                return
              }
              activateCountry(hit.iso2)
            }}
          >
            <sphereGeometry args={[0.05, 18, 18]} />
            <meshStandardMaterial
              color={disabled ? '#555A64' : selected ? '#C6A55A' : focused ? '#7AA6D3' : '#28517A'}
              transparent
              opacity={disabled ? 0.45 : selected ? 0.95 : focused ? 0.85 : 0.62}
            />
          </mesh>
        )
      })}
    </group>
  )
}
