'use client'

type Props = {
  countryLabel: string
  roleLabel: string
  flagEmoji?: string
  counts: { open: number; newToday: number }
  onChangeContext?: () => void
}

export function MarketStickyHeader({
  countryLabel,
  roleLabel,
  flagEmoji,
  counts,
  onChangeContext,
}: Props) {
  return (
    <header className="cc-mkt-header">
      <button type="button" className="cc-mkt-ctx" onClick={onChangeContext}>
        {flagEmoji ? <span aria-hidden>{flagEmoji}</span> : null}
        <span>
          {countryLabel} \u00b7 {roleLabel}
        </span>
        <span aria-hidden>\u25be</span>
      </button>
      <div className="cc-mkt-stats" aria-live="polite">
        <span className="cc-mkt-stat">
          <strong>{counts.open}</strong> open
        </span>
        {counts.newToday > 0 ? (
          <span className="cc-mkt-stat cc-mkt-stat--new"> \u00b7 {counts.newToday} new</span>
        ) : null}
      </div>
    </header>
  )
}
