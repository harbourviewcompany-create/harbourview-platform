'use client'

import type { MarketSegmentTab } from './marketTypes'

type Props = {
  tabs: MarketSegmentTab[]
  active: string
  onChange: (id: string) => void
}

export function MarketSegmentTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="cc-mkt-segments" role="tablist" aria-label="Market sections">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`cc-mkt-seg${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null ? <em className="cc-mkt-seg-count">{t.count}</em> : null}
        </button>
      ))}
    </div>
  )
}
