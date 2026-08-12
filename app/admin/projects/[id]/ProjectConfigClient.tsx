"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChecklistSectionConfig } from "@/lib/types";
import {
  addDocumentConfig,
  removeDocumentConfig,
  addChecklistSection,
  addChecklistItem,
  removeChecklistItem,
  removeChecklistSection,
  updateChecklistItem,
} from "../actions";

export default function ProjectConfigClient({
  project,
  docConfigs,
  sections,
}: {
  project: { id: string; name: string; address: string | null };
  docConfigs: any[];
  sections: ChecklistSectionConfig[];
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <>
      <div className="card mb-5 overflow-hidden">
        <div className="card-header">Required documents</div>
        {(docConfigs || []).map((c) => (
          <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0 text-sm">
            <span>
              {c.document_type}{" "}
              {c.is_mandatory ? (
                <span className="text-text-danger text-xs font-medium">· mandatory</span>
              ) : (
                <span className="text-text-muted text-xs">· optional</span>
              )}
            </span>
            <form action={removeDocumentConfig.bind(null, project.id, c.id)}>
              <button className="text-text-muted text-xs hover:text-text-danger transition-colors">Remove</button>
            </form>
          </div>
        ))}
        <form action={addDocumentConfig.bind(null, project.id)} className="flex flex-wrap gap-3 px-5 py-4 items-end bg-surface-1/50">
          <input name="document_type" placeholder="Document name" required className="input flex-1 min-w-[160px] text-sm" />
          <label className="text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input type="checkbox" name="is_mandatory" defaultChecked className="rounded" /> Mandatory
          </label>
          <button className="btn text-sm">+ Add document</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">Checklist sections</div>
        {(sections || []).map((s: ChecklistSectionConfig) => (
          <div key={s.id} className="px-5 py-4 border-b border-border last:border-b-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{s.section_name}</span>
              <form action={removeChecklistSection.bind(null, project.id, s.id)}>
                <button className="text-text-muted text-xs hover:text-text-danger transition-colors">Remove section</button>
              </form>
            </div>
            <div className="text-sm text-text-muted mb-3 space-y-2">
              {s.items.map((item, i) => {
                const key = `${s.id}:${i}`;
                const isEditing = editingKey === key;
                return isEditing ? (
                  <form
                    key={i}
                    action={updateChecklistItem.bind(null, project.id, s.id, i)}
                    className="flex flex-wrap gap-2 items-center pl-2 bg-surface-1/50 rounded-md p-2"
                  >
                    <input
                      name="text"
                      defaultValue={item.text}
                      required
                      className="input flex-1 min-w-[160px] text-sm"
                    />
                    <label className="text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" name="required" defaultChecked={item.required} className="rounded" /> Required
                    </label>
                    <button type="submit" className="btn text-xs">Save</button>
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      className="text-text-muted text-xs hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div key={i} className="flex items-center justify-between gap-3 pl-2">
                    <span>
                      <span className="text-text-muted mr-2 font-medium">{i + 1}.</span>
                      {item.text}{" "}
                      {item.required && <span className="text-text-danger text-xs font-medium">(required)</span>}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => setEditingKey(key)}
                        className="text-text-muted text-xs hover:text-text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <form action={removeChecklistItem.bind(null, project.id, s.id, i)}>
                        <button className="text-text-muted text-xs hover:text-text-danger transition-colors">Remove</button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
            <form action={addChecklistItem.bind(null, s.id, project.id)} className="flex flex-wrap gap-2 items-center">
              <input name="text" placeholder="New item text" required className="input flex-1 min-w-[160px] text-sm" />
              <label className="text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input type="checkbox" name="required" className="rounded" /> Required
              </label>
              <button className="btn text-xs">+ Add item</button>
            </form>
          </div>
        ))}
        <form action={addChecklistSection.bind(null, project.id)} className="flex flex-wrap gap-3 px-5 py-4 bg-surface-1/50">
          <input name="section_name" placeholder="New section name" required className="input flex-1 min-w-[160px] text-sm" />
          <button className="btn text-sm">+ Add section</button>
        </form>

        <div className="flex justify-end p-5 border-t border-border">
          <Link href="/admin/projects" className="btn btn-primary">
            Done — back to projects
          </Link>
        </div>
      </div>
    </>
  );
}