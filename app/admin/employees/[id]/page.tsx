import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import { signedUrl } from "@/lib/storage";
import StatusPill from "@/components/StatusPill";
import DocumentReviewCard from "./DocumentReviewCard";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { project?: string };
}) {
  const supabase = createClient();
  if (!searchParams.project) notFound();

  const { data: employee } = await supabase.from("users").select("*").eq("id", params.id).single();
  const { data: project } = await supabase.from("projects").select("*").eq("id", searchParams.project).single();
  if (!employee || !project) notFound();

  const { data: docConfigs } = await supabase
    .from("project_documents_config")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order");
  const { data: employeeDocs } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("project_id", project.id)
    .eq("user_id", employee.id)
    .order("created_at", { ascending: false });
  const { data: submissions } = await supabase
    .from("checklist_submissions")
    .select("*")
    .eq("project_id", project.id)
    .eq("user_id", employee.id)
    .order("submitted_at", { ascending: false });

  const clearance = computeClearance({
    documentConfigs: docConfigs || [],
    employeeDocuments: employeeDocs || [],
    hasChecklistSubmission: (submissions || []).length > 0,
  });

  const latestByType = new Map<string, NonNullable<typeof employeeDocs>[number]>();
  for (const doc of employeeDocs || []) {
    if (!latestByType.has(doc.document_type)) latestByType.set(doc.document_type, doc);
  }

  const pendingDoc = (employeeDocs || []).find((d) => !d.confirmed_at);
  const pendingPhotoUrl = pendingDoc ? await signedUrl(supabase, "credential-photos", pendingDoc.photo_url) : null;

  const submissionDownloads = await Promise.all(
    (submissions || []).map(async (s) => ({
      ...s,
      pdfUrl: await signedUrl(supabase, "checklist-exports", s.exported_pdf_url),
    })),
  );

  return (
    <div className="p-5">
      <div className="mb-5">
        <h1 className="text-base font-medium">{employee.full_name || employee.email}</h1>
        <p className="text-xs text-text-muted mt-0.5">
          {employee.position || "—"} · <span className="capitalize">{employee.employee_type || "—"}</span> · {project.name} ·{" "}
          <StatusPill status={clearance.status} />
        </p>
        {clearance.blockingReasons.length > 0 && (
          <p className="text-[11px] text-text-danger mt-1">{clearance.blockingReasons.join(" · ")}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel>Documents uploaded</SectionLabel>
          <div className="card overflow-hidden mb-4">
            {(docConfigs || []).map((config) => {
              const doc = latestByType.get(config.document_type);
              const status = !doc ? "missing" : doc.confirmed_at ? "verified" : "pending";
              return (
                <div key={config.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-b-0 text-xs">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                      status === "verified" ? "bg-bg-success text-text-success" : status === "pending" ? "bg-bg-warning text-text-warning" : "bg-surface-1 text-text-muted"
                    }`}
                  >
                    {status === "verified" ? "✓" : status === "pending" ? "…" : "↑"}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{config.document_type}</div>
                    <div className="text-[11px] text-text-muted">
                      {doc?.expiry_date ? `Expires ${new Date(doc.expiry_date).toLocaleDateString()}` : status === "missing" ? "Not yet uploaded" : "Waiting for review"}
                    </div>
                  </div>
                  <span className={`pill ${status === "verified" ? "pill-ok" : status === "pending" ? "pill-warn" : ""}`}>
                    {status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Missing"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted card p-2.5 mb-5">Expiry dates visible to admins only.</p>

          <SectionLabel>Checklist history</SectionLabel>
          <div className="card overflow-hidden">
            {submissionDownloads.length === 0 && (
              <div className="px-3 py-4 text-xs text-text-muted text-center">No submissions yet.</div>
            )}
            {submissionDownloads.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 px-3 py-2 border-b border-border last:border-b-0">
                <div className="w-7 h-7 rounded bg-bg-success text-text-success flex items-center justify-center flex-shrink-0 text-xs">✓</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{project.name} orientation</div>
                  <div className="text-[11px] text-text-muted">Submitted {new Date(s.submitted_at).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2 text-[11px]">
                  {s.pdfUrl && (
                    <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="text-text-muted" title="Download PDF">
                      PDF
                    </a>
                  )}
                  <a href={`/api/checklist/${s.id}/docx`} className="text-text-muted" title="Download Word doc">
                    Word
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Latest upload — AI scan</SectionLabel>
          {pendingDoc ? (
            <DocumentReviewCard doc={pendingDoc} photoUrl={pendingPhotoUrl} />
          ) : (
            <div className="card p-4 text-xs text-text-muted">No documents awaiting review.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-medium mb-2 text-text-muted uppercase tracking-wide">{children}</div>
  );
}
