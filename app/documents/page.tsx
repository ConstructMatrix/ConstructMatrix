import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentsList from "./DocumentsList";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/documents");

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
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-text-muted">No project found. Scan your site&apos;s QR code to begin onboarding.</p>
      </main>
    );
  }

  const { data: project } = await supabase.from("projects").select("id, name").eq("slug", projectSlug).single();
  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-text-muted">Project not found.</p>
      </main>
    );
  }

  const { data: docConfigs } = await supabase
    .from("project_documents_config")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order", { ascending: true });

  const { data: employeeDocs } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("project_id", project.id)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto p-5">
      <div className="mb-5">
        <h1 className="text-base font-medium">Documents</h1>
        <p className="text-xs text-text-muted mt-0.5">
          {project.name} · Upload copies of your credentials. Your supervisor will verify each one.
        </p>
      </div>
      <DocumentsList
        projectId={project.id}
        docConfigs={docConfigs || []}
        employeeDocs={employeeDocs || []}
      />
      <p className="text-[11px] text-text-muted card p-3 mt-3">
        Expiry dates and document details are managed by your site manager.
      </p>
    </div>
  );
}
