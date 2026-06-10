import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { isPlatformStaff } from "@/lib/hv/org-membership";
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!(await isPlatformStaff(user.id))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const url = new URL(req.url); const status = url.searchParams.get("status")??"pending"; const type = url.searchParams.get("type"); const page = parseInt(url.searchParams.get("page")??"1"); const pageSize = 25;
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("hv_admin_review_queue").select("id,queue_type,target_entity_type,target_entity_id,org_id,assigned_to,priority,status,notes,created_at,updated_at,resolved_at,workspaces:org_id(id,slug,trade_name,legal_name,org_type,jurisdiction_country,verification_status)").order("priority",{ascending:true}).order("created_at",{ascending:true}).range((page-1)*pageSize,page*pageSize-1);
  if (status!=="all") query=query.eq("status",status); if (type) query=query.eq("queue_type",type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error:"QUERY_FAILED" }, { status:500 });
  return NextResponse.json({ data, page, pageSize }, { status:200 });
}
export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!(await isPlatformStaff(user.id))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { queue_id, status, notes, assigned_to } = await req.json();
  if (!queue_id) return NextResponse.json({ error:"queue_id required" }, { status:422 });
  const supabase = await createSupabaseServerClient();
  const update: Record<string,unknown> = { updated_at:new Date().toISOString() };
  if (status) { update.status=status; if (["resolved","escalated"].includes(status)) update.resolved_at=new Date().toISOString(); }
  if (notes!==undefined) update.notes=notes; if (assigned_to!==undefined) update.assigned_to=assigned_to;
  const { data, error } = await supabase.from("hv_admin_review_queue").update(update).eq("id",queue_id).select("id,status,updated_at").single();
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  await supabase.from("audit_events").insert({ entity_type:"admin_review_queue", entity_id:queue_id, action:"admin_queue.updated", actor:user.id, actor_user_id:user.id, metadata:{ status } });
  return NextResponse.json({ data }, { status:200 });
}