// app/auth/sign-in/route.ts
// Handles login form POST. Does not leak auth provider error detail back to the browser.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { attachSecurityHeaders, isSafeRelativePath } from "@/lib/security/http";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

const GENERIC_LOGIN_ERROR = "Invalid email or password";

function redirectToLogin(request: NextRequest, error: string, next?: string | null): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  if (isSafeRelativePath(next ?? null)) url.searchParams.set("next", next!);
  return attachSecurityHeaders(NextResponse.redirect(url, { status: 303 }));
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`signin:${ip}`, { limit: 10, windowMs: 60_000 })) {
    return redirectToLogin(request, "Too many sign-in attempts. Try again shortly.");
  }

  const formData = await request.formData();
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  const nextRaw = formData.get("next");

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  const next = typeof nextRaw === "string" ? nextRaw : null;

  if (!email || !password || email.length > 320 || password.length > 4096) {
    return redirectToLogin(request, GENERIC_LOGIN_ERROR, next);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirectToLogin(request, GENERIC_LOGIN_ERROR, next);
  }

  const destination = isSafeRelativePath(next) ? next : "/app";
  return attachSecurityHeaders(NextResponse.redirect(new URL(destination, request.url), { status: 303 }));
}
