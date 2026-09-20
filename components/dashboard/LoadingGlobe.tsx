import type { CSSProperties } from 'react'
import styles from './LoadingGlobe.module.css'

/**
 * Lightweight Arctic loading globe for route-level loading boundaries.
 * Uses a static SVG asset so the loading state does not depend on WebGL/R3F.
 */
export function LoadingGlobe({
  size = 200,
  spinDurationMs = 13000,
  className,
}: {
  /** Diameter in px (or any CSS length when passed as string). */
  size?: number | string
  /** Full rotation duration; slow enough to read as a globe rather than a spinner. */
  spinDurationMs?: number
  className?: string
}) {
  const diameter = typeof size === 'number' ? `${size}px` : size

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-loading-globe="true"
      style={
        {
          width: diameter,
          height: diameter,
          ['--hv-globe-spin-ms' as string]: `${spinDurationMs}ms`,
        } as CSSProperties
      }
    >
      <img
        className={styles.globe}
        src="/harbourview-loading-globe.svg"
        alt=""
        width="900"
        height="900"
        draggable={false}
      />
    </div>
  )
}
