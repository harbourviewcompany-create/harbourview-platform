// app/auth/sign-out/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { attachSecurityHeaders } from "@/lib/security/http";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  return attachSecurityHeaders(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
}
