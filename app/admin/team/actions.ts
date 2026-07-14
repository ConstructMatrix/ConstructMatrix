"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function assignRole(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "");
  if (!userId || !role) return;

  const supabase = createServiceRoleClient();
  await supabase.from("users").update({ role }).eq("id", userId);
  redirect("/admin/team");
}