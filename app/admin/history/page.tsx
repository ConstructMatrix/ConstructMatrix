import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/storage";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const supabase = createClient();

  const { data: projects } = await supabase.from("projects").select("id, name").order("created_at");

  let query = supabase
    .from("checklist_submissions")
    .select("*, users(full_name, email), projects(name)")
    .order("submitted_at", { ascending: false });
  if (searchParams.project) query = query.eq("project_id", searchParams.project);
  const { data: submissions } = await query;

  const withUrls = await Promise.all(
    (submissions || []).map(async (s: any) => ({
      ...s,
      pdfUrl: await signedUrl(supabase, "checklist-exports", s.exported_pdf_url),
    })),
  );

  return (
    <div className="p-5 mx-auto">
      <div className="mb-5">
        <h1 className="text-base font-medium">Checklist submission history</h1>
        <p className="text-xs text-text-muted mt-0.5">Full audit trail of every onboarding checklist submitted, across all projects.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Link href="/admin/history" className={`btn text-xs ${!searchParams.project ? "btn-primary" : ""}`}>
          All projects
        </Link>
        {(projects || []).map((p) => (
          <Link key={p.id} href={`/admin/history?project=${p.id}`} className={`btn text-xs ${searchParams.project === p.id ? "btn-primary" : ""}`}>
            {p.name}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="bg-surface-1 grid grid-cols-4 px-3 py-1.5 text-[11px] text-text-muted font-medium border-b border-border">
          <span>Worker</span>
          <span>Project</span>
          <span>Submitted</span>
          <span>Export</span>
        </div>
        {withUrls.length === 0 && (
          <div className="px-3 py-6 text-xs text-text-muted text-center">No checklist submissions yet.</div>
        )}
        {withUrls.map((s) => (
          <div key={s.id} className="grid grid-cols-4 px-3 py-2.5 border-b border-border last:border-b-0 items-center text-xs">
            <div>
              <div className="font-medium">{s.worker_name}</div>
              <div className="text-[11px] text-text-muted">{s.company}</div>
            </div>
            <div className="text-text-muted">{s.projects?.name}</div>
            <div className="text-text-muted">{new Date(s.submitted_at).toLocaleString()}</div>
            <div className="flex gap-2">
              {s.pdfUrl ? (
                <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="text-text-accent">
                  PDF
                </a>
              ) : (
                <span className="text-text-muted">—</span>
              )}
              <a href={`/api/checklist/${s.id}/docx`} className="text-text-accent">
                Word
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
