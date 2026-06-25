// app/api/debug/anthropic-test/route.ts
// TEMPORARY diagnostic route — single trivial call to Anthropic to verify
// ANTHROPIC_API_KEY validity without running the full scrape engine.
// Gated by CRON_SECRET. DELETE after verification.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || querySecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: 'ANTHROPIC_API_KEY not set' }, { status: 200 })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say OK' }],
      }),
    })

    const text = await response.text()

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      bodyPreview: text.slice(0, 500),
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      exception: err instanceof Error ? err.message : String(err),
    })
  }
}
