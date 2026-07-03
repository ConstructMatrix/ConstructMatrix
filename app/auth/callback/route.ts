import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") || "/onboarding";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log("AUTH ERROR:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log("USER:", user?.id, user?.email);

    if (user) {
      const admin = createServiceRoleClient();
      const { data: profile, error: profileError } = await admin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log("PROFILE:", profile, "ERROR:", profileError);

      if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
        return NextResponse.redirect(`${origin}/login?error=not_authorized`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}