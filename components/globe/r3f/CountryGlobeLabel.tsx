'use client'

import { Html } from '@react-three/drei'
import { Vector3 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { lonLatToVector3 } from '@/lib/globe/globe-geometry'
import { getCountryName } from '@/config/globe/country-role-profiles'

// Radius at which the label floats above the plate surface
const LABEL_RADIUS = 2.52

// Build a fast iso2 → centroid lookup across all entries
const centroidByIso2 = new Map<string, [number, number]>()
for (const c of naturalEarthCountriesPayload.countries) centroidByIso2.set(c.iso2, c.centroid)
for (const p of canadaProvinces) centroidByIso2.set(p.iso2, p.centroid)
for (const s of usStates) centroidByIso2.set(s.iso2, s.centroid)

export function CountryGlobeLabel({ iso2 }: { iso2: string }) {
  const centroid = centroidByIso2.get(iso2)
  if (!centroid) return null

  const v = lonLatToVector3(centroid[0], centroid[1], LABEL_RADIUS)
  const position = new Vector3(v.x, v.y, v.z)
  const name = getCountryName(iso2)

  return (
    <Html
      position={position}
      center
      // Occlude behind the globe itself — label disappears on the far side
      occlude={false}
      zIndexRange={[10, 20]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(2,8,17,0.9), rgba(8,18,31,0.76))',
          border: '1px solid rgba(216,190,118,0.32)',
          borderRadius: '999px',
          padding: '4px 10px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.11em',
          color: '#f7edcf',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.54), inset 0 1px 0 rgba(255,255,255,0.08)',
          // Translate up so the label sits above the plate centroid
          transform: 'translateY(-18px)',
        }}
      >
        {name}
      </div>
    </Html>
  )
}
