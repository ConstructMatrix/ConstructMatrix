import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { documentId } = await request.json();
  const supabase = createServiceRoleClient();
  await supabase.from("employee_documents").delete().eq("id", documentId);
  return NextResponse.json({ ok: true });
}