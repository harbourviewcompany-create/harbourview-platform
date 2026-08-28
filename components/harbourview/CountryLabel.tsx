'use client'

import { useEffect, useRef, useState } from 'react'

interface CountryLabelProps {
  countryName: string
  visible: boolean
  reducedMotion?: boolean
}

export function CountryLabel({ countryName, visible, reducedMotion = false }: CountryLabelProps) {
  const [rendered, setRendered] = useState(visible)
  const [mountedVisible, setMountedVisible] = useState(visible)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      setRendered(true)
      const enterTimer = setTimeout(() => setMountedVisible(true), 16)
      return () => clearTimeout(enterTimer)
    }

    setMountedVisible(false)
    timerRef.current = setTimeout(() => setRendered(false), 240)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible])

  if (!rendered) return null

  return (
    <div
      aria-hidden="true"
      data-testid="candidate-b-country-label"
      className="max-[360px]:hidden"
      style={{
        position: 'absolute',
        top: '28%',
        left: '50%',
        transform: mountedVisible
          ? 'translateX(-50%) translateY(0) scale(1)'
          : reducedMotion
            ? 'translateX(-50%)'
            : 'translateX(-50%) translateY(4px) scale(0.98)',
        zIndex: 15,
        opacity: mountedVisible ? 1 : 0,
        transition: reducedMotion
          ? 'opacity 180ms ease'
          : 'opacity 200ms cubic-bezier(0.2,0.8,0.2,1), transform 200ms cubic-bezier(0.2,0.8,0.2,1)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
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
