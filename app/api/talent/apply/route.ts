import { handleTalentApplication } from '@/lib/talent/application'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleTalentApplication(request, '/api/talent/apply')
}
