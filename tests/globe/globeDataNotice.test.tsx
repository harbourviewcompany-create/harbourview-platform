import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GlobeContext } from '@/components/globe/GlobeProvider'
import { GlobeDataNotice } from '@/components/globe/GlobeDataNotice'

const country = { iso2: 'CA' } as never
function render(over: Record<string, unknown>) {
  const value = {
    liveData: { countries: [country], signalsByIso2: {}, unmappedSignalCountries: {} },
    status: 'connected', loading: false, loadError: null, degraded: false, loadedAt: 1,
    reconnect: () => {}, reload: () => {}, ...over,
  } as never
  return renderToStaticMarkup(
    <GlobeContext.Provider value={value}><GlobeDataNotice /></GlobeContext.Provider>,
  )
}

describe('GlobeDataNotice', () => {
  it('renders nothing while loading', () => {
    expect(render({ loading: true, degraded: true })).toBe('')
  })
  it('renders nothing when healthy', () => {
    expect(render({})).toBe('')
  })
  it('explains partial data when degraded but countries exist', () => {
    const html = render({ degraded: true })
    expect(html).toContain('globe-data-notice')
    expect(html).toContain('signals are temporarily unavailable')
    expect(html).toContain('Retry')
  })
  it('explains neutral static routing when live country metadata is unavailable', () => {
    const html = render({
      degraded: true,
      liveData: {
        countries: [country],
        signalsByIso2: {},
        unmappedSignalCountries: {},
        countriesUnavailable: true,
      },
    })
    expect(html).toContain('regulatory data is temporarily unavailable')
    expect(html).toContain('Country routing remains available')
    expect(html).toContain('Retry')
  })
  it('explains missing data and keeps country selection message when empty', () => {
    const html = render({
      degraded: true, loadError: 'globe fetch failed: 503',
      liveData: { countries: [], signalsByIso2: {}, unmappedSignalCountries: {} },
    })
    expect(html).toContain('could not be loaded')
    expect(html).toContain('still choose a country')
  })
})
