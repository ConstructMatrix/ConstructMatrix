import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProjectTabs from "../../ProjectTabs";
import ProjectConfigClient from "./ProjectConfigClient";

export default async function ProjectConfigPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) notFound();

  const { data: docConfigs } = await supabase
    .from("project_documents_config")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order");
  const { data: sections } = await supabase
    .from("project_checklist_config")
    .select("*")
    .eq("project_id", project.id)
    .order("section_order");

  return (
    <div className="p-6">
      <PageHeader title={project.name} subtitle={project.address || undefined} />
      <ProjectTabs projectId={project.id} active="config" />
      <ProjectConfigClient project={project} docConfigs={docConfigs || []} sections={sections || []} />
    </div>
  );
}