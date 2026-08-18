import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClinicalPrescriberWorkspace } from '@/lib/server/clinicalPrescriberWorkspaceQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  country: z.string().trim().min(2).max(8),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    country: request.nextUrl.searchParams.get('country') ?? '',
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'country required (ISO2)' }, { status: 400 })
  }

  const result = await getClinicalPrescriberWorkspace({ jurisdiction: parsed.data.country })
  const status = result.state === 'permission' ? 403 : result.state === 'error' ? 503 : 200

  return NextResponse.json(result, {
    status,
    headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
  })
}
