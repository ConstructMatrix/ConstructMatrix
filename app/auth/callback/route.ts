import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") || "/admin";
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.log("AUTH ERROR:", error);
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user && redirectTo.startsWith("/admin")) {
    const admin = createServiceRoleClient();
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "manager"].includes(profile.role)) {
      return NextResponse.redirect(`${origin}/login?error=not_authorized`);
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}