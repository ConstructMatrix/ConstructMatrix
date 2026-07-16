import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/storage";
import PageHeader from "@/components/PageHeader";

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
    <div className="p-6">
      <PageHeader
        title="Checklist submission history"
        subtitle="Full audit trail of every onboarding checklist submitted, across all projects."
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <Link href="/admin/history" className={`btn text-sm ${!searchParams.project ? "btn-primary" : ""}`}>
          All projects
        </Link>
        {(projects || []).map((p) => (
          <Link
            key={p.id}
            href={`/admin/history?project=${p.id}`}
            className={`btn text-sm ${searchParams.project === p.id ? "btn-primary" : ""}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 bg-surface-1 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wide">
          <span>Worker</span>
          <span>Project</span>
          <span>Submitted</span>
          <span>Export</span>
        </div>
        {withUrls.length === 0 && (
          <div className="px-4 py-10 text-sm text-text-muted text-center">No checklist submissions yet.</div>
        )}
        {withUrls.map((s) => (
          <div key={s.id} className="grid grid-cols-4 px-4 py-4 border-b border-border last:border-b-0 items-center text-sm">
            <div>
              <div className="font-semibold">{s.worker_name}</div>
              <div className="text-xs text-text-muted">{s.company}</div>
            </div>
            <div className="text-text-muted">{s.projects?.name}</div>
            <div className="text-text-muted">{new Date(s.submitted_at).toLocaleString()}</div>
            <div className="flex gap-2">
              {s.pdfUrl ? (
                <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="btn text-xs py-1 px-2">
                  PDF
                </a>
              ) : (
                <span className="text-text-muted text-xs">—</span>
              )}
              <a href={`/api/checklist/${s.id}/docx`} className="btn text-xs py-1 px-2">
                Word
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}