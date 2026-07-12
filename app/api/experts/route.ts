import { createClient } from '@supabase/supabase-js'
import { NextResponse }  from 'next/server'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country    = searchParams.get('country') ?? ''
  const credential = searchParams.get('credential') ?? ''
  const q          = searchParams.get('q') ?? ''

  const supabase = getDb()
  let query = supabase
    .from('hv_professionals')
    .select('id,full_name,title,credential_type,specialties,countries,institution,accepts_referrals,consultation_available,bio_public')
    .eq('verification_status', 'verified')
    .eq('status', 'active')
    .order('full_name', { ascending: true })
    .limit(100)

  if (country) query = query.contains('countries', [country.toUpperCase()])
  if (credential) query = query.eq('credential_type', credential)

  const { data, error } = await query

  if (error) {
    console.error('[experts]', error)
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 })
  }

  let results = data ?? []

  if (q) {
    const ql = q.toLowerCase()
    results = results.filter(p =>
      p.full_name.toLowerCase().includes(ql) ||
      (p.title ?? '').toLowerCase().includes(ql) ||
      (p.institution ?? '').toLowerCase().includes(ql) ||
      (p.specialties ?? []).some((s: string) => s.toLowerCase().includes(ql)) ||
      (p.bio_public ?? '').toLowerCase().includes(ql),
    )
  }

  return NextResponse.json({ experts: results })
}
