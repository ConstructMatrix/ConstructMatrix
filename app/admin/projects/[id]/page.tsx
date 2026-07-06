import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addDocumentConfig,
  removeDocumentConfig,
  addChecklistSection,
  addChecklistItem,
  removeChecklistItem,
  removeChecklistSection,
} from "../actions";
import type { ChecklistSectionConfig } from "@/lib/types";

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">{project.name}</h1>
          <p className="text-xs text-text-muted mt-0.5">{project.address}</p>
        </div>
        <Link href={`/admin/projects/${project.id}/qr`} className="btn">
          View QR sign-in
        </Link>
      </div>

      <div className="card mb-4 overflow-hidden">
        <div className="bg-surface-1 px-3 py-2 text-xs font-medium border-b border-border">
          Required documents
        </div>
        {(docConfigs || []).map((c) => (
          <div key={c.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0 text-xs">
            <span>
              {c.document_type} {c.is_mandatory ? <span className="text-text-danger">· mandatory</span> : <span className="text-text-muted">· optional</span>}
            </span>
            <form action={removeDocumentConfig.bind(null, project.id, c.id)}>
              <button className="text-text-muted text-[11px]">Remove</button>
            </form>
          </div>
        ))}
        <form action={addDocumentConfig.bind(null, project.id)} className="flex gap-2 px-3 py-2.5 items-end">
          <input name="document_type" placeholder="Document name" required className="text-xs border border-border rounded px-2 py-1.5 flex-1" />
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" name="is_mandatory" defaultChecked /> Mandatory
          </label>
          <button className="btn text-xs">+ Add document</button>
        </form>
      </div>

      <div className="card mb-4 overflow-hidden">
        <div className="bg-surface-1 px-3 py-2 text-xs font-medium border-b border-border">
          Checklist sections
        </div>
        {(sections || []).map((s: ChecklistSectionConfig) => (
          <div key={s.id} className="px-3 py-2.5 border-b border-border last:border-b-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">{s.section_name}</span>
              <form action={removeChecklistSection.bind(null, project.id, s.id)}>
                <button className="text-text-muted text-[11px]">Remove section</button>
              </form>
            </div>
            <div className="text-xs text-text-muted mb-2 space-y-1">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="text-text-muted mr-1">{i + 1}.</span>
                    {item.text} {item.required && <span className="text-text-danger">(required)</span>}
                  </span>
                  <form action={removeChecklistItem.bind(null, project.id, s.id, i)}>
                    <button className="text-text-muted text-[11px]">Remove</button>
                  </form>
                </div>
              ))}
            </div>
            <form action={addChecklistItem.bind(null, s.id, project.id)} className="flex gap-2 items-center">
              <input name="text" placeholder="New item text" required className="text-xs border border-border rounded px-2 py-1 flex-1" />
              <label className="text-[11px] flex items-center gap-1">
                <input type="checkbox" name="required" /> Required
              </label>
              <button className="btn text-[11px]">+ Add item</button>
            </form>
          </div>
        ))}
        <form action={addChecklistSection.bind(null, project.id)} className="flex gap-2 px-3 py-2.5">
          <input name="section_name" placeholder="New section name" required className="text-xs border border-border rounded px-2 py-1.5 flex-1" />
          <button className="btn text-xs">+ Add section</button>
        </form>
      </div>
    </div>
  );
}
