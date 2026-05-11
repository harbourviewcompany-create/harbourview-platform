import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'temporarily_unavailable' },
    { status: 503 },
  )
}
