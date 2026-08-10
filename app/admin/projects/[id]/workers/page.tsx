import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProjectTabs from "../../../ProjectTabs";
import { addWorker } from "./actions";

function displayName(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null; email?: string | null }) {
  const combined = [u?.first_name, u?.last_name].filter(Boolean).join(" ");
  return combined || u?.full_name || u?.email || "—";
}

export default async function WorkersPage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) notFound();

  const { data: members } = await supabase
    .from("project_members")
    .select("*, users(id, email, full_name, first_name, last_name, employee_type, role)")
    .eq("project_id", project.id)
    .order("joined_at", { ascending: false });

  return (
    <div className="p-6">
      <PageHeader
        title={`${project.name} — Roster`}
        subtitle={project.description || project.address || undefined}
      />
      <ProjectTabs projectId={project.id} active="workers" />

      <div className="card mb-5 overflow-hidden">
        <div className="card-header">Add worker</div>
        <form action={addWorker.bind(null, project.id)} className="p-5 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label className="label">Full name</label>
            <input name="full_name" required placeholder="Marcus Johnson" className="input" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="label">Email</label>
            <input name="email" type="email" required placeholder="name@company.com" className="input" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="label">Worker type</label>
            <select name="employee_type" className="select w-full">
              <option value="contractor">Contractor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="consultant">Consultant</option>
              <option value="owner">Owner</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <button className="btn btn-primary">Add and invite</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="cm-table-header">
          <span>Worker</span>
          <span>Type</span>
          <span>Status</span>
          <span>Invited</span>
        </div>
        {(members || []).length === 0 && (
          <div className="empty-state">No workers added yet. Use the form above to invite your first worker.</div>
        )}
        {(members || []).map((m: any) => (
          <div key={m.user_id} className="cm-table-row">
            <div>
              <div className="text-sm font-semibold">{displayName(m.users)}</div>
              <div className="text-xs text-text-muted">{m.users?.email || "—"}</div>
            </div>
            <div className="text-sm text-text-muted capitalize">{m.users?.employee_type || "—"}</div>
            <div className="text-sm capitalize">{m.status}</div>
            <div className="text-xs text-text-muted">{new Date(m.joined_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}