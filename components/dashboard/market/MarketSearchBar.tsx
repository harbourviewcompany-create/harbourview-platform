'use client'

type Props = {
  query: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MarketSearchBar({
  query,
  onChange,
  placeholder = 'Search packaging, equipment, MOQ\u2026',
}: Props) {
  return (
    <div className="cc-mkt-search-wrap">
      <span className="cc-mkt-search-icon" aria-hidden>
        \u2315
      </span>
      <input
        className="cc-mkt-search-input"
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={e => onChange(e.target.value)}
        aria-label="Search market"
      />
      {query ? (
        <button
          type="button"
          className="cc-mkt-search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          \u00d7
        </button>
      ) : null}
    </div>
  )
}
