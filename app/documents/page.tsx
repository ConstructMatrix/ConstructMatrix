import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentsList from "./DocumentsList";
import PageHeader from "@/components/PageHeader";

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
      <main className="min-h-screen flex items-center justify-center p-6 bg-surface-0">
        <div className="empty-state card max-w-md">
          <div className="text-3xl mb-3">📱</div>
          <p>No project found. Scan your site&apos;s QR code to begin onboarding.</p>
        </div>
      </main>
    );
  }

  const { data: project } = await supabase.from("projects").select("id, name").eq("slug", projectSlug).single();
  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-surface-0">
        <div className="empty-state card max-w-md">
          <p>Project not found.</p>
        </div>
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
    <main className="min-h-screen bg-surface-0 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Documents"
          subtitle={`${project.name} · Upload copies of your credentials. Your supervisor will verify each one.`}
        />
        <DocumentsList
          projectId={project.id}
          docConfigs={docConfigs || []}
          employeeDocs={employeeDocs || []}
        />
        <p className="text-xs text-text-muted card p-4 mt-4 leading-relaxed">
          Expiry dates and document details are managed by your site manager.
        </p>
      </div>
    </main>
  );
}
