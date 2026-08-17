import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import { signedUrl } from "@/lib/storage";
import StatusPill from "@/components/StatusPill";
import DocumentReviewCard from "./DocumentReviewCard";
import AdminDocumentReplace from "@/components/AdminDocumentReplace";
import { assignTradeAndRole } from "../actions";

function displayName(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null; email?: string | null }) {
  const combined = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return combined || u.full_name || u.email || "Anonymous worker";
}

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

  const { data: companyHistory } = await supabase
    .from("employee_companies")
    .select("*, companies(id, name, company_trades(id, trade_name)), projects(id, name)")
    .eq("user_id", employee.id)
    .order("started_at", { ascending: false });

  const currentAssignment = (companyHistory || []).find((h: any) => h.project_id === project.id);

  const clearance = computeClearance({
    documentConfigs: docConfigs || [],
    employeeDocuments: employeeDocs || [],
    hasChecklistSubmission: (submissions || []).length > 0,
  });

  const latestByType = new Map<string, NonNullable<typeof employeeDocs>[number]>();
  for (const doc of employeeDocs || []) {
    if (!latestByType.has(doc.document_type)) latestByType.set(doc.document_type, doc);
  }

  const allDocsWithUrls = await Promise.all(
    (employeeDocs || []).map(async (doc) => ({
      doc,
      photoUrl: await signedUrl(supabase, "credential-photos", doc.photo_url),
    })),
  );
  const urlByDocId = new Map(allDocsWithUrls.map((d) => [d.doc.id, d.photoUrl]));

  const pendingDocs = (employeeDocs || []).filter((d) => !d.confirmed_at);
  const pendingDocsWithUrls = pendingDocs.map((doc) => ({
    doc,
    photoUrl: urlByDocId.get(doc.id) || null,
  }));

  const submissionDownloads = await Promise.all(
    (submissions || []).map(async (s) => ({
      ...s,
      pdfUrl: await signedUrl(supabase, "checklist-exports", s.exported_pdf_url),
    })),
  );

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">{displayName(employee)}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm text-text-muted">
            {employee.email || "No email"} · {project.name}
          </span>
          <StatusPill status={clearance.status} />
        </div>
        {clearance.blockingReasons.length > 0 && (
          <p className="text-sm text-text-danger mt-2">{clearance.blockingReasons.join(" · ")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {currentAssignment && (
            <>
              <div className="section-label">Assign trade and worker type</div>
              <form action={assignTradeAndRole} className="card p-5 mb-6 flex flex-col gap-3">
                <input type="hidden" name="employeeCompanyId" value={currentAssignment.id} />
                <input type="hidden" name="employeeId" value={employee.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <div className="text-xs text-text-muted mb-1">
                  For <strong>{currentAssignment.companies?.name}</strong> on this project
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Trade</label>
                    <select name="trade" defaultValue={currentAssignment.trade || ""} className="select w-full">
                      <option value="">Select trade...</option>
                      {(currentAssignment.companies?.company_trades || []).map((t: any) => (
                        <option key={t.id} value={t.trade_name}>{t.trade_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Worker type</label>
                    <select name="employeeType" defaultValue={currentAssignment.employee_type || ""} className="select w-full">
                      <option value="">Select type...</option>
                      <option value="contractor">Contractor</option>
                      <option value="subcontractor">Subcontractor</option>
                      <option value="consultant">Consultant</option>
                      <option value="owner">Owner</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary text-sm">Save</button>
                </div>
              </form>
            </>
          )}

          <div className="section-label">Company history</div>
          <div className="card overflow-hidden mb-6">
            {(companyHistory || []).length === 0 && (
              <div className="empty-state py-6">No company history yet.</div>
            )}
            {(companyHistory || []).map((h: any) => (
              <div key={h.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{h.companies?.name || "—"}</div>
                  <div className="text-xs text-text-muted">
                    {h.projects?.name || "—"}
                    {h.trade ? ` · ${h.trade}` : ""}
                    {h.employee_type ? ` · ${h.employee_type}` : ""}
                  </div>
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(h.started_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          <div className="section-label">Documents uploaded</div>
          <div className="card overflow-hidden mb-4">
            {(docConfigs || []).map((config) => {
              const doc = latestByType.get(config.document_type);
              const status = !doc ? "missing" : doc.confirmed_at ? "verified" : "pending";
              const photoUrl = doc ? urlByDocId.get(doc.id) : null;
              return (
                <div key={config.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                      status === "verified"
                        ? "bg-bg-success text-text-success border border-border-success"
                        : status === "pending"
                          ? "bg-bg-warning text-text-warning border border-border-warning"
                          : "bg-surface-1 text-text-muted border border-border"
                    }`}
                  >
                    {status === "verified" ? "✓" : status === "pending" ? "…" : "↑"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{config.document_type}</div>
                    <div className="text-xs text-text-muted">
                      {doc?.expiry_date
                        ? `Expires ${new Date(doc.expiry_date).toLocaleDateString()}`
                        : status === "missing"
                          ? "Not yet uploaded"
                          : "Waiting for review"}
                    </div>
                  </div>
                  {photoUrl && (
                    <a href={photoUrl} target="_blank" rel="noreferrer" className="btn text-xs py-1 px-2 flex-shrink-0">
                      View
                    </a>
                  )}
                  <AdminDocumentReplace
                    projectId={project.id}
                    userId={employee.id}
                    documentType={config.document_type}
                    isMandatory={config.is_mandatory}
                  />
                  <span className={`pill ${status === "verified" ? "pill-ok" : status === "pending" ? "pill-warn" : ""}`}>
                    {status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Missing"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-muted card p-3 mb-6 leading-relaxed">Expiry dates visible to admins only.</p>

          <div className="section-label">Checklist history</div>
          <div className="card overflow-hidden">
            {submissionDownloads.length === 0 && (
              <div className="empty-state py-8">No submissions yet.</div>
            )}
            {submissionDownloads.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                <div className="w-9 h-9 rounded-lg bg-bg-success text-text-success border border-border-success flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{project.name} orientation</div>
                  <div className="text-xs text-text-muted">Submitted {new Date(s.submitted_at).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2 text-xs">
                  {s.pdfUrl && (
                    <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="btn text-xs py-1 px-2" title="Download PDF">
                      PDF
                    </a>
                  )}
                  <a href={`/api/checklist/${s.id}/docx`} className="btn text-xs py-1 px-2" title="Download Word doc">
                    Word
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">
            {pendingDocsWithUrls.length > 0
              ? `Awaiting review (${pendingDocsWithUrls.length})`
              : "Awaiting review"}
          </div>
          {pendingDocsWithUrls.length > 0 ? (
            <div className="flex flex-col gap-4">
              {pendingDocsWithUrls.map(({ doc, photoUrl }) => (
                <DocumentReviewCard key={doc.id} doc={doc} photoUrl={photoUrl} />
              ))}
            </div>
          ) : (
            <div className="card p-6 empty-state py-12">No documents awaiting review.</div>
          )}
        </div>
      </div>
    </div>
  );
}