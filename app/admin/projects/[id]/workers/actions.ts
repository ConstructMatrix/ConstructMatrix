"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function addWorker(projectId: string, formData: FormData) {
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const employee_type = String(formData.get("employee_type") || "contractor");

  if (!email) return;

  const supabase = createServiceRoleClient();

  const { data: existingAuth } = await supabase.auth.admin.listUsers();
  const existingUser = existingAuth?.users?.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    await supabase.from("users").upsert({
      id: userId,
      email,
      full_name,
      employee_type,
      role: "contractor",
    }, { onConflict: "id" });
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !newUser.user) {
      console.error("Failed to create user:", error);
      redirect(`/admin/projects/${projectId}/workers?error=failed_to_create`);
    }
    userId = newUser.user.id;
    await supabase.from("users").insert({
      id: userId,
      email,
      full_name,
      employee_type,
      role: "contractor",
    });
  }

  await supabase.from("project_members").upsert({
    project_id: projectId,
    user_id: userId,
    status: "pending",
  }, { onConflict: "project_id,user_id" });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://atconstructmatrix.com";
  await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${appUrl}/auth/callback?redirect=/onboarding?project=${projectId}`,
    },
  });

  redirect(`/admin/projects/${projectId}/workers`);
}