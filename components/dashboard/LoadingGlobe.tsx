import type { CSSProperties } from 'react'
import styles from './LoadingGlobe.module.css'

/**
 * Lightweight CSS globe for route-level loading boundaries.
 * Intentionally free of R3F / GlobeProvider so first paint stays fast.
 */
export function LoadingGlobe({
  size = 200,
  spinDurationMs = 13000,
  className,
}: {
  /** Diameter in px (or any CSS length when passed as string). */
  size?: number | string
  /** Full rotation duration; slower reads as command, not spinner. */
  spinDurationMs?: number
  className?: string
}) {
  const diameter = typeof size === 'number' ? `${size}px` : size

  const rootStyle = {
    width: diameter,
    height: diameter,
    ['--hv-globe-spin-ms']: `${spinDurationMs}ms`,
  } as CSSProperties

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-loading-globe="true"
      style={rootStyle}
    >
      <div className={styles.field} />
      <div className={styles.atmosphere} />
      <div className={styles.shell}>
        <div className={styles.surface} />
        <div className={styles.metal} />
        <div className={styles.limb} />
        <div className={styles.polarGrid} />
        <div className={styles.polarCap} />
      </div>
    </div>
  )
}
