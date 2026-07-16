import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { access_token, refresh_token, redirect } = await request.json();
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message || "Failed to set session" }, { status: 400 });
  }

  // Only check role for admin routes
  if (redirect?.startsWith("/admin")) {
    const admin = createServiceRoleClient();
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", data.session.user.id)
      .single();

    if (!profile || !["admin", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "not_authorized" }, { status: 403 });
    }
  }

  return NextResponse.json({ ok: true });
}