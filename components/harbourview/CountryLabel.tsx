'use client'

import { useEffect, useRef, useState } from 'react'

interface CountryLabelProps {
  countryName: string
  visible: boolean
  reducedMotion?: boolean
}

export function CountryLabel({ countryName, visible, reducedMotion = false }: CountryLabelProps) {
  const [rendered, setRendered] = useState(visible)
  const [opacity, setOpacity] = useState(visible ? 1 : 0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      setRendered(true)
      // Small delay to allow DOM mount before animating in
      const enterTimer = setTimeout(() => setOpacity(1), 16)
      return () => clearTimeout(enterTimer)
    } else {
      setOpacity(0)
      timerRef.current = setTimeout(() => setRendered(false), 250)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
  }, [visible])

  if (!rendered) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '28%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        opacity,
        transition: reducedMotion
          ? 'opacity 180ms ease'
          : `opacity 200ms cubic-bezier(0.2,0.8,0.2,1), transform 200ms cubic-bezier(0.2,0.8,0.2,1)`,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        height: '34px',
        padding: '0 13px',
        borderRadius: '11px',
        background: 'rgba(5, 10, 16, 0.72)',
        border: '1px solid rgba(240, 211, 154, 0.25)',
        color: 'var(--hv-text-primary)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.03em',
        boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
        whiteSpace: 'nowrap',
      }}
    >
      {countryName}
    </div>
  )
}
