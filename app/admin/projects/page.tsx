import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, address, slug, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <PageHeader
        title="Projects"
        subtitle="Create and configure construction projects."
        actions={
          <Link href="/admin/projects/new" className="btn btn-primary">
            + New project
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {(projects || []).length === 0 && (
          <div className="empty-state">
            <div className="text-3xl mb-3">🏗️</div>
            <p>No projects yet. Create your first project to get started.</p>
            <Link href="/admin/projects/new" className="btn btn-primary mt-4 inline-flex">
              + New project
            </Link>
          </div>
        )}
        {(projects || []).map((p) => (
          <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border last:border-b-0">
            <div>
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-text-muted mt-0.5">{p.address || "—"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
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
