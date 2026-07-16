import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://atconstructmatrix.com";
  const supabase = createServiceRoleClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?redirect=%2Fadmin`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}