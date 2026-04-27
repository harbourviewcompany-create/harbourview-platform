import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { redactSupplierProfile } from '@/lib/marketplace/redact'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const region = searchParams.get('region')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ suppliers: [], total: 0, configured: false })
  }

  try {
    const db = createAdminClient()
    let query = db
      .from('supplier_profiles')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (region) query = query.eq('region', region)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }

    let results = (data ?? []).map(redactSupplierProfile)

    // Filter by category client-side (array column)
    if (category) {
      results = results.filter((s) => s.categories.includes(category as never))
    }

    return NextResponse.json({ suppliers: results, total: count ?? 0 })
  } catch (err) {
    console.error('[SupplierDirectory GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
