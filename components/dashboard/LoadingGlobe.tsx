import type { CSSProperties } from 'react'
import styles from './LoadingGlobe.module.css'

/**
 * Lightweight Arctic loading globe for route-level loading boundaries.
 *
 * The artwork is a true polar/circumpolar composition; motion is deliberately
 * optical rather than a flat 360° spin so the loader still reads as a globe.
 */
export function LoadingGlobe({
  size = 260,
  spinDurationMs = 15000,
  className,
}: {
  /** Diameter in px (or any CSS length when passed as string). */
  size?: number | string
  /** Duration of the very subtle lighting drift. */
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
          ['--hv-globe-motion-ms' as string]: `${spinDurationMs}ms`,
        } as CSSProperties
      }
    >
      <div className={styles.halo} />
      <div className={styles.sphere}>
        <img
          className={styles.globe}
          src="/harbourview-loading-globe.svg"
          alt=""
          width="900"
          height="900"
          draggable={false}
        />
        <div className={styles.specular} />
      </div>
      <div className={styles.rim} />
    </div>
  )
}
