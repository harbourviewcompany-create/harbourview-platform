import type { CSSProperties } from 'react'
import styles from './LoadingGlobe.module.css'

/**
 * Lightweight Arctic loading globe for route-level loading boundaries.
 * Uses a static SVG asset so the loading state does not depend on WebGL/R3F.
 *
 * The artwork is deliberately fixed in the Arctic/top-down orientation. A
 * loading boundary should communicate "content is arriving", not look like
 * the interactive globe is already spinning.
 */
export function LoadingGlobe({
  size = 200,
  className,
}: {
  /** Diameter in px (or any CSS length when passed as string). */
  size?: number | string
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
        } as CSSProperties
      }
    >
      <img
        className={styles.globe}
        src="/harbourview-loading-globe.svg"
        alt=""
        width="900"
        height="900"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
      />
    </div>
  )
}
