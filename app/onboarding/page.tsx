import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChecklistForm from "./ChecklistForm";
import type { ChecklistSectionConfig } from "@/lib/types";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/onboarding${searchParams.project ? `?project=${searchParams.project}` : ""}`);
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user!.id).single();

  // Fall back to the most recent project this worker joined if none was passed in the URL.
  let projectSlug = searchParams.project;
  if (!projectSlug) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("project_id, projects(slug)")
      .eq("user_id", user!.id)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectSlug = (membership as any)?.projects?.slug;
  }

  if (!projectSlug) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-surface-0">
        <div className="empty-state card max-w-md">
          <div className="text-3xl mb-3">📱</div>
          <p>No project found. Scan your site&apos;s QR code to begin onboarding.</p>
        </div>
      </main>
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("slug", projectSlug)
    .single();

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-surface-0">
        <div className="empty-state card max-w-md">
          <p>Project not found.</p>
        </div>
      </main>
    );
  }

  // Ensure a project_members row exists for this worker (first visit via QR).
  await supabase
    .from("project_members")
    .upsert({ project_id: project.id, user_id: user!.id, status: "pending" }, { onConflict: "project_id,user_id", ignoreDuplicates: true });

  const { data: sections } = await supabase
    .from("project_checklist_config")
    .select("*")
    .eq("project_id", project.id)
    .order("section_order", { ascending: true });

  return (
    <ChecklistForm
      project={project}
      sections={(sections || []) as ChecklistSectionConfig[]}
      profile={{
        fullName: profile?.full_name || "",
        company: profile?.company || "",
        unionTrade: "",
      }}
    />
  );
}
