import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { addWorker } from "./actions";

export default async function WorkersPage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) notFound();

  const { data: members } = await supabase
    .from("project_members")
    .select("*, users(id, email, full_name, employee_type, role)")
    .eq("project_id", project.id)
    .order("joined_at", { ascending: false });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-base font-medium">{project.name}</h1>
        <p className="text-xs text-text-muted mt-0.5">{project.address}</p>
      </div>

      <div className="flex gap-0 border-b border-border mb-6">
        <Link href={`/admin/projects/${project.id}/workers`} className="text-[13px] px-4 py-2.5 text-text-primary border-b-2 border-text-primary">
          Workers
        </Link>
        <Link href={`/admin/projects/${project.id}`} className="text-[13px] px-4 py-2.5 text-text-muted hover:text-text-primary">
          Configuration
        </Link>
        <Link href={`/admin/projects/${project.id}/qr`} className="text-[13px] px-4 py-2.5 text-text-muted hover:text-text-primary">
          QR sign-in
        </Link>
      </div>

      <div className="card mb-4 overflow-hidden">
        <div className="bg-surface-1 px-4 py-3 text-xs font-medium border-b border-border">
          Add worker
        </div>
        <form action={addWorker.bind(null, project.id)} className="p-4 flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="text-[10px] text-text-muted uppercase tracking-wide">Full name</label>
            <input name="full_name" required placeholder="Marcus Johnson" className="text-sm border border-border rounded px-2 py-1.5 outline-none" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-[10px] text-text-muted uppercase tracking-wide">Email</label>
            <input name="email" type="email" required placeholder="name@company.com" className="text-sm border border-border rounded px-2 py-1.5 outline-none" />
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] text-text-muted uppercase tracking-wide">Worker type</label>
            <select name="employee_type" className="text-sm border border-border rounded px-2 py-1.5 outline-none">
              <option value="contractor">Contractor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="consultant">Consultant</option>
              <option value="owner">Owner</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <button className="btn btn-primary text-sm">Add and invite</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-surface-1 grid grid-cols-4 px-4 py-2 text-xs text-text-muted font-medium border-b border-border">
          <span>Worker</span>
          <span>Type</span>
          <span>Status</span>
          <span>Invited</span>
        </div>
        {(members || []).length === 0 && (
          <div className="px-4 py-8 text-sm text-text-muted text-center">No workers added yet.</div>
        )}
        {(members || []).map((m: any) => (
          <div key={m.user_id} className="grid grid-cols-4 px-4 py-3 border-b border-border last:border-b-0 items-center text-sm">
            <div>
              <div className="font-medium">{m.users?.full_name || m.users?.email}</div>
              <div className="text-xs text-text-muted">{m.users?.email}</div>
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