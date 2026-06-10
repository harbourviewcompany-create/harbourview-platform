import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOrgMembership(org_id: string, user_id: string): Promise<{ org_role: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("workspace_members").select("org_role: role").eq("workspace_id", org_id).eq("user_id", user_id).eq("status", "active").single();
  if (error || !data) return null;
  return data as { org_role: string };
}

export async function requireOrgMembership(org_id: string, user_id: string): Promise<{ org_role: string }> {
  const membership = await getOrgMembership(org_id, user_id);
  if (!membership) throw new Error("FORBIDDEN: not an active member of this organisation");
  return membership;
}

export async function isPlatformStaff(user_id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user_id).in("role", ["admin", "super_admin", "compliance_reviewer"]).single();
  return !!data;
}