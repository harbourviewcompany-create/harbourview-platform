import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClinicalPrescriberWorkspace } from '@/lib/server/clinicalPrescriberWorkspaceQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  jurisdiction: z.string().trim().regex(/^[A-Za-z]{2}(?:-[A-Za-z0-9]{2,3})?$/),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    jurisdiction: request.nextUrl.searchParams.get('jurisdiction') ?? '',
  })
  if (!parsed.success) {
    return NextResponse.json(
      { state: 'error', error: 'A specific clinical jurisdiction is required.' },
      { status: 400, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    )
  }

  const result = await getClinicalPrescriberWorkspace({ jurisdiction: parsed.data.jurisdiction })
  const status = result.state === 'permission' ? 403 : result.state === 'error' ? 503 : 200
  return NextResponse.json(result, {
    status,
    headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
  })
}
