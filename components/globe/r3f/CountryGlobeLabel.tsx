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
      zIndexRange={[80, 90]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        style={{
          // Premium chip — dark smoked glass base with gold top accent rail
          position: 'relative',
          background: 'linear-gradient(160deg, rgba(8,20,38,0.96) 0%, rgba(2,9,19,0.98) 100%)',
          border: '1px solid rgba(241,209,100,0.38)',
          borderRadius: '7px',
          padding: '5px 11px 5px 11px',
          minWidth: '72px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.68), 0 2px 8px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.07)',
          // Translate up so the chip floats cleanly above the plate centroid
          transform: 'translateY(-22px)',
        }}
      >
        {/* Gold top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '12px',
            right: '12px',
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent, rgba(212,173,58,0.9) 30%, rgba(212,173,58,0.9) 70%, transparent)',
            borderRadius: '1px',
          }}
        />
        {/* Eyebrow */}
        <p
          style={{
            margin: 0,
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(212,173,58,0.82)',
            lineHeight: 1,
            marginBottom: '3px',
          }}
        >
          Market
        </p>
        {/* Country name */}
        <p
          style={{
            margin: 0,
            fontSize: '11.5px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#fff8e6',
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
          }}
        >
          {name}
        </p>
      </div>
    </Html>
  )
}
