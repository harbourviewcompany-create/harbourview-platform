import { NextResponse } from 'next/server'
import { handleTalentApplication } from '@/lib/talent/application'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleTalentApplication(request, '/api/talent/applications')
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_my_applications')
  if (error) return NextResponse.json({ error: 'APPLICATIONS_UNAVAILABLE' }, { status: 503 })
  return NextResponse.json({ data: data ?? [] }, { headers: { 'Cache-Control': 'no-store, private' } })
}
