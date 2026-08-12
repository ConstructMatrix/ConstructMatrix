"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_DOCS = [
  { document_type: "Working at Heights", is_mandatory: true, sort_order: 1 },
  { document_type: "WHMIS", is_mandatory: true, sort_order: 2 },
  { document_type: "Health and Safety Awareness", is_mandatory: true, sort_order: 3 },
  { document_type: "Trade Certification", is_mandatory: true, sort_order: 4 },
  { document_type: "Fall Arrest / Fall Protection", is_mandatory: false, sort_order: 5 },
  { document_type: "First Aid", is_mandatory: false, sort_order: 6 },
];

const DEFAULT_SECTIONS = [
  {
    section_name: "Part One: General Conditions",
    section_order: 1,
    items: [
      { text: "Worker acknowledges the site safety policy and agrees to comply with all applicable legislation and procedures.", required: true },
      { text: "Worker understands the Internal Responsibility System and their duty to report unsafe conditions.", required: true },
      { text: "Worker has been issued and agrees to wear all required PPE while on site (hard hat, CSA boots, high-vis garment).", required: true },
      { text: "Worker is aware of the site disciplinary policy including verbal warning, written warning, suspension, and removal.", required: false },
    ],
  },
  {
    section_name: "Part Two: Emergency Procedure Review",
    section_order: 2,
    items: [
      { text: "Worker knows the emergency evacuation signal and the location of the assembly area.", required: true },
      { text: "Worker has been shown the location of first aid kits, fire extinguishers, and nearest hospital.", required: false },
      { text: "Worker understands that all incidents, near misses, and accidents must be reported immediately to their supervisor.", required: false },
    ],
  },
  {
    section_name: "Part Four: Training Verification",
    section_order: 3,
    items: [
      { text: "Working at heights", required: true },
      { text: "WHMIS", required: true },
      { text: "Health and safety awareness", required: true },
      { text: "Trade certification", required: true },
      { text: "Fall arrest / fall protection", required: false },
      { text: "First aid", required: false },
    ],
  },
];

export async function createProject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const useDefaults = formData.get("useDefaults") === "on";

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, description, address, slug, admin_id: user!.id })
    .select()
    .single();

  if (error || !project) {
    redirect(`/admin/projects/new?error=${encodeURIComponent(error?.message || "Could not create project")}`);
  }

  if (useDefaults) {
    await supabase.from("project_documents_config").insert(
      DEFAULT_DOCS.map((d) => ({ ...d, project_id: project.id })),
    );
    await supabase.from("project_checklist_config").insert(
      DEFAULT_SECTIONS.map((s) => ({ ...s, project_id: project.id })),
    );
  }

  redirect(`/admin/projects/${project.id}/workers`);
}

export async function addDocumentConfig(projectId: string, formData: FormData) {
  const supabase = createClient();
  const document_type = String(formData.get("document_type") || "").trim();
  const is_mandatory = formData.get("is_mandatory") === "on";
  const description = String(formData.get("description") || "").trim();
  if (!document_type) return;

  await supabase.from("project_documents_config").insert({
    project_id: projectId,
    document_type,
    is_mandatory,
    description,
    sort_order: 999,
  });
  redirect(`/admin/projects/${projectId}`);
}

export async function removeDocumentConfig(projectId: string, configId: string) {
  const supabase = createClient();
  await supabase.from("project_documents_config").delete().eq("id", configId);
  redirect(`/admin/projects/${projectId}`);
}

export async function addChecklistSection(projectId: string, formData: FormData) {
  const supabase = createClient();
  const section_name = String(formData.get("section_name") || "").trim();
  if (!section_name) return;

  const { count } = await supabase
    .from("project_checklist_config")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  await supabase.from("project_checklist_config").insert({
    project_id: projectId,
    section_name,
    section_order: (count || 0) + 1,
    items: [],
  });
  redirect(`/admin/projects/${projectId}`);
}

export async function addChecklistItem(sectionId: string, projectId: string, formData: FormData) {
  const supabase = createClient();
  const text = String(formData.get("text") || "").trim();
  const required = formData.get("required") === "on";
  if (!text) return;

  const { data: section } = await supabase
    .from("project_checklist_config")
    .select("items")
    .eq("id", sectionId)
    .single();
  const items = [...(section?.items || []), { text, required }];
  await supabase.from("project_checklist_config").update({ items }).eq("id", sectionId);
  redirect(`/admin/projects/${projectId}`);
}

export async function removeChecklistSection(projectId: string, sectionId: string) {
  const supabase = createClient();
  await supabase.from("project_checklist_config").delete().eq("id", sectionId);
  redirect(`/admin/projects/${projectId}`);
}

export async function removeChecklistItem(projectId: string, sectionId: string, itemIndex: number ){
  const supabase = createClient();

  const { data: section } = await supabase
    .from("project_checklist_config")
    .select("items")
    .eq("id", sectionId)
    .single();

  const items = [...(section?.items || [])].filter((_, i) => i !== itemIndex);
  await supabase.from("project_checklist_config").update({ items }).eq("id", sectionId);
  redirect(`/admin/projects/${projectId}`);
}

export async function updateChecklistItem(
  projectId: string,
  sectionId: string,
  itemIndex: number,
  formData: FormData,
) {
  const supabase = createClient();
  const text = String(formData.get("text") || "").trim();
  const required = formData.get("required") === "on";
  if (!text) return;

  const { data: section } = await supabase
    .from("project_checklist_config")
    .select("items")
    .eq("id", sectionId)
    .single();

  const items = [...(section?.items || [])];
  items[itemIndex] = { text, required };

  await supabase.from("project_checklist_config").update({ items }).eq("id", sectionId);
  redirect(`/admin/projects/${projectId}`);
}