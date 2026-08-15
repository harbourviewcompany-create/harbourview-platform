import { NextRequest, NextResponse } from 'next/server'
import { getEducationCommand } from '@/lib/server/educationCommandQuery'
import { createClient } from '@/lib/supabase/server'

function cleanCountry(value: string | null): string {
  const head = (value ?? 'CA').trim().toUpperCase().split('-')[0].replace(/[^A-Z]/g, '')
  return head.length === 2 ? head : 'CA'
}

function cleanRole(value: string | null): string | null {
  const normalized = (value ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  return normalized || null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const country = cleanCountry(request.nextUrl.searchParams.get('country'))
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
