import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import CommandCentreDataBoundary from '@/components/dashboard/CommandCentreDataBoundary'
import type { CommandCentreDataState, CommandCentreSourceMeta } from '@/lib/dashboard/commandCentreDataTypes'

const loadedAt = '2026-08-28T16:00:00.000Z'

function source(
  key: string,
  state: CommandCentreDataState,
  sourceLabel = key,
): CommandCentreSourceMeta {
  return {
    key,
    state,
    access: 'authenticated',
    sourceLabel,
    loadedAt,
    freshAt: null,
    staleAfterMs: null,
    durationMs: 1,
    errorCode: state === 'error' ? 'SOURCE_LOAD_FAILED' : null,
    requested: true,
  }
}

function render(
  state: CommandCentreDataState,
  sources: Record<string, CommandCentreSourceMeta>,
) {
  return renderToStaticMarkup(
    <CommandCentreDataBoundary state={state} sources={sources} loadedAt={loadedAt}>
      <div>Market</div>
    </CommandCentreDataBoundary>,
  )
}

describe('CommandCentreDataBoundary', () => {
  it('frames an approved fallback plus honest empty result as available data', () => {
    const sources: Record<string, CommandCentreSourceMeta> = {}
    for (let index = 0; index < 7; index += 1) {
      sources[`live-${index}`] = source(`live-${index}`, 'live')
    }
    sources.marketplaceMedia = source(
      'marketplaceMedia',
      'fallback',
      'Public marketplace rows and approved media projection',
    )
    sources.optionalContext = source('optionalContext', 'empty')

    const html = render('partial', sources)

    expect(html).toContain('Marketplace data is available.')
    expect(html).toContain('7 live')
    expect(html).toContain('1 approved fallback')
    expect(html).toContain('1 with no results')
    expect(html).toContain('Showing verified public marketplace records and approved media.')
    expect(html).toContain('data-command-centre-degraded-count="0"')
    expect(html).not.toContain('temporarily degraded')
    expect(html).not.toContain('controlled fallback')
    expect(html).not.toContain('0 partial')
    expect(html).not.toContain('0 stale')
    expect(html).not.toContain('0 unavailable')
  })

  it('keeps true unavailable sources visibly degraded', () => {
    const html = render('partial', {
      marketplace: source('marketplace', 'live'),
      intelligence: source('intelligence', 'error', 'Intelligence feed'),
    })

    expect(html).toContain('Some requested sources are temporarily degraded.')
    expect(html).toContain('1 live')
    expect(html).toContain('1 unavailable')
    expect(html).toContain('Intelligence feed (unavailable)')
    expect(html).toContain('data-command-centre-degraded-count="1"')
  })

  it('does not add a notice for honest empty-only context', () => {
    const html = render('empty', {
      optionalContext: source('optionalContext', 'empty'),
    })

    expect(html).toContain('Market')
    expect(html).not.toContain('role="status"')
    expect(html).not.toContain('Marketplace data is available.')
  })
})
