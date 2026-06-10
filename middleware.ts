import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); supabaseResponse = NextResponse.next({ request }); cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/api/dashboard") || path.startsWith("/api/admin") || path.startsWith("/api/org");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register");
  if (!user && isProtected) { const u = request.nextUrl.clone(); u.pathname = "/login"; u.searchParams.set("next", path); return NextResponse.redirect(u); }
  if (user && isAuthRoute && !path.startsWith("/register/org")) { const u = request.nextUrl.clone(); u.pathname = "/dashboard"; return NextResponse.redirect(u); }
  return supabaseResponse;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };