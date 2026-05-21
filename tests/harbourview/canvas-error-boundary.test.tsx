import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CanvasErrorBoundary from '@/components/harbourview/globe/CanvasErrorBoundary'

describe('CanvasErrorBoundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not log to console.error in production mode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const boundary = new CanvasErrorBoundary({ children: null })

    vi.stubEnv('NODE_ENV', 'production')
    boundary.componentDidCatch(new Error('render failure'))

    expect(consoleSpy).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('emits console.error in non-production mode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const boundary = new CanvasErrorBoundary({ children: null })

    vi.stubEnv('NODE_ENV', 'test')
    boundary.componentDidCatch(new Error('render failure'))

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })

  it('renders an accessible fallback wrapper after errors', () => {
    const boundary = new CanvasErrorBoundary({
      children: createElement('span', null, 'globe'),
    })
    const markup = renderToStaticMarkup(boundary.render())

    expect(markup).toContain('globe')

    boundary.state = { hasError: true }
    const fallbackMarkup = renderToStaticMarkup(boundary.render())

    expect(fallbackMarkup).toContain('role="alert"')
    expect(fallbackMarkup).toContain('aria-live="assertive"')
    expect(fallbackMarkup).toContain('tabindex="-1"')
  })
})
