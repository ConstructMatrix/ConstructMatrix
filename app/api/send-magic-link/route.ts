import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://atconstructmatrix.com";
  const callbackUrl = `${appUrl}/auth/callback?redirect=%2Fadmin`;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: callbackUrl },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message || "Failed to generate link" }, { status: 500 });
  }

  await resend.emails.send({
    from: "Construct Matrix <noreply@atconstructmatrix.com>",
    to: email,
    subject: "Your sign-in link — Construct Matrix",
    html: `
      <p>Click the link below to sign in. This link expires in 1 hour and can only be used once.</p>
      <p><a href="${data.properties.action_link}">Sign in to Construct Matrix</a></p>
      <p>— Construct Matrix</p>
    `,
  });

  return NextResponse.json({ ok: true });
}