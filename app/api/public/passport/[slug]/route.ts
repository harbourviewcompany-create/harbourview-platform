import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

const ALLOWED = new Set(["org_id","slug","trade_name","org_type","jurisdiction_country","verification_status","verification_level","completeness_band","active_licence_types","public_supported_claims","export_ready","recall_clear","is_public"])

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 })
  try {
    const supabase = await createSupabaseServiceClient()
    const { data: org } = await supabase.from("workspaces").select("id, is_public").eq("slug", slug).single()
    if (!org?.is_public) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    const { data: snapshot } = await supabase.from("hv_public_profile_snapshots")
      .select("snapshot_data, generated_at").eq("org_id", org.id).single()
    if (!snapshot?.snapshot_data) return NextResponse.json({ error: "PASSPORT_NOT_AVAILABLE" }, { status: 404 })
    const raw = snapshot.snapshot_data as Record<string, unknown>
    const dto: Record<string, unknown> = {}
    for (const key of Object.keys(raw)) { if (ALLOWED.has(key)) dto[key] = raw[key] }
    return NextResponse.json({ data: dto, generated_at: snapshot.generated_at }, {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch { return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 }) }
}
