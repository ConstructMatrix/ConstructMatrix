import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, address, slug, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-5 mx-auto">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-base font-medium">Projects</h1>
          <p className="text-xs text-text-muted mt-0.5">Create and configure construction projects.</p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary">
          + New project
        </Link>
      </div>

      <div className="card overflow-hidden">
        {(projects || []).length === 0 && (
          <div className="px-3 py-6 text-xs text-text-muted text-center">No projects yet.</div>
        )}
        {(projects || []).map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-b-0">
            <div>
              <div className="text-[13px] font-medium">{p.name}</div>
              <div className="text-[11px] text-text-muted">{p.address || "—"}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin?project=${p.id}`} className="btn text-xs">
                Roster
              </Link>
              <Link href={`/admin/projects/${p.id}`} className="btn text-xs">
                Configure
              </Link>
              <Link href={`/admin/projects/${p.id}/qr`} className="btn text-xs">
                QR sign-in
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
