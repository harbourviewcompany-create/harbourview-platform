'use client'

import { Html } from '@react-three/drei'
import { Vector3 } from 'three'
import { lonLatToVector3 } from '@/lib/globe/globe-geometry'

// Russia centroid — positioned just above the plate surface
const RUSSIA_CENTROID: [number, number] = [97.37, 63.71]
const EMBLEM_RADIUS = 2.50

const v = lonLatToVector3(RUSSIA_CENTROID[0], RUSSIA_CENTROID[1], EMBLEM_RADIUS)
const POSITION = new Vector3(v.x, v.y, v.z)

export function RussiaLighthouseEmblem() {
  return (
    <Html
      position={POSITION}
      center
      occlude={false}
      zIndexRange={[30, 35]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div style={{
        position: 'relative',
        width: 88,
        height: 88,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,173,58,0.18) 0%, rgba(212,173,58,0.06) 55%, transparent 75%)',
          filter: 'blur(3px)',
        }} />

        {/* Gold coin badge */}
        <svg
          viewBox="0 0 88 88"
          width={88}
          height={88}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', filter: 'drop-shadow(0 0 8px rgba(212,173,58,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
        >
          <defs>
            <radialGradient id="coinBg" cx="44%" cy="38%" r="56%">
              <stop offset="0%" stopColor="#1a1200" />
              <stop offset="100%" stopColor="#060400" />
            </radialGradient>
            <linearGradient id="goldStamp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5df80" />
              <stop offset="35%" stopColor="#d4ad3a" />
              <stop offset="65%" stopColor="#c89820" />
              <stop offset="100%" stopColor="#a87a10" />
            </linearGradient>
            <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1d164" />
              <stop offset="50%" stopColor="#c89820" />
              <stop offset="100%" stopColor="#f1d164" />
            </linearGradient>
            <linearGradient id="rayGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5df80" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d4ad3a" stopOpacity="0" />
            </linearGradient>
            <clipPath id="coinClip">
              <circle cx="44" cy="44" r="39" />
            </clipPath>
          </defs>

          {/* Outer rim */}
          <circle cx="44" cy="44" r="43" fill="url(#goldRim)" />
          {/* Rim bevel inner */}
          <circle cx="44" cy="44" r="40" fill="#0a0800" />
          {/* Coin face */}
          <circle cx="44" cy="44" r="39" fill="url(#coinBg)" />

          {/* Engraved inner ring */}
          <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(212,173,58,0.22)" strokeWidth="0.7" />
          <circle cx="44" cy="44" r="35" fill="none" stroke="rgba(212,173,58,0.12)" strokeWidth="0.5" />

          {/* Lighthouse group — clipped to coin */}
          <g clipPath="url(#coinClip)" fill="url(#goldStamp)">
            {/* Light rays fanning from lantern top */}
            <polygon points="44,14 22,4  38,14" opacity="0.35" />
            <polygon points="44,14 66,4  50,14" opacity="0.35" />
            <polygon points="44,14 10,10 30,16" opacity="0.22" />
            <polygon points="44,14 78,10 58,16" opacity="0.22" />
            <polygon points="44,14 4,20  26,18"  opacity="0.12" />
            <polygon points="44,14 84,20 62,18"  opacity="0.12" />

            {/* Lantern cap / dome */}
            <polygon points="36,18 44,12 52,18" />

            {/* Lantern room */}
            <rect x="35" y="18" width="18" height="11" rx="1" />
            {/* Window on lantern room (dark) */}
            <rect x="39" y="20" width="10" height="7" rx="1" fill="#060400" />
            {/* Light inside window */}
            <ellipse cx="44" cy="23.5" rx="4" ry="2.8" fill="#f5df80" opacity="0.85" />

            {/* Gallery (walkway) ledge */}
            <rect x="32" y="29" width="24" height="3" rx="1.5" />

            {/* Tower body — tapers from wide base to gallery */}
            <polygon points="33,32 55,32 51,60 37,60" />

            {/* Tower character stripes (dark bands) */}
            <rect x="34.5" y="36" width="19" height="6" rx="0.5" fill="#060400" opacity="0.55" />
            <rect x="36" y="48" width="16" height="5" rx="0.5" fill="#060400" opacity="0.55" />

            {/* Base block */}
            <rect x="29" y="60" width="30" height="5" rx="2" />

            {/* Ground platform */}
            <rect x="22" y="65" width="44" height="3" rx="1.5" />
          </g>

          {/* "HARBOURVIEW" arc text around bottom */}
          <path id="arcPath" d="M 12 60 A 32 32 0 0 0 76 60" fill="none" />
          <text fontSize="5.8" fill="url(#goldStamp)" letterSpacing="2.6" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" opacity="0.82">
            <textPath href="#arcPath" startOffset="50%">HARBOURVIEW</textPath>
          </text>
        </svg>
      </div>
    </Html>
  )
}
