import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('production CSP regression guard', () => {
  it('does not permit unsafe-eval in the committed Next.js security policy', () => {
    const config = readFileSync(resolve(process.cwd(), 'next.config.mjs'), 'utf8')
    expect(config).not.toContain("'unsafe-eval'")
  })
})
