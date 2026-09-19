'use client'

/** Lightweight placeholder while a Command page chunk loads. */
export function PageSkeleton() {
  return (
    <div className="cc-page-skeleton" role="status" aria-label="Loading page" aria-live="polite">
      <div className="cc-page-skeleton-header">
        <div className="cc-page-skeleton-bar cc-page-skeleton-bar--title" />
        <div className="cc-page-skeleton-bar cc-page-skeleton-bar--sub" />
      </div>
      <div className="cc-page-skeleton-grid">
        <div className="cc-page-skeleton-card" />
        <div className="cc-page-skeleton-card" />
        <div className="cc-page-skeleton-card cc-page-skeleton-card--wide" />
      </div>
      <div className="cc-page-skeleton-rows">
        <div className="cc-page-skeleton-bar" />
        <div className="cc-page-skeleton-bar" />
        <div className="cc-page-skeleton-bar cc-page-skeleton-bar--short" />
      </div>
    </div>
  )
}
