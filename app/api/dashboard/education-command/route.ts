import { NextRequest, NextResponse } from 'next/server'
import { parseEducationCountry } from '@/lib/education/command'
import { getEducationCommand } from '@/lib/server/educationCommandQuery'
import { createClient } from '@/lib/supabase/server'

function cleanRole(value: string | null): string | null {
  const normalized = (value ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  return normalized || null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const country = parseEducationCountry(request.nextUrl.searchParams.get('country'))
  if (!country) {
    return NextResponse.json(
      { error: 'country query parameter is required (ISO 3166-1 alpha-2)' },
      { status: 400 },
    )
  }
  const role = cleanRole(request.nextUrl.searchParams.get('role'))

  try {
    const command = await getEducationCommand(user.id, country, role)
    return NextResponse.json(command, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('[/api/dashboard/education-command] failed:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Education Command could not be loaded' }, { status: 500 })
  }
}
