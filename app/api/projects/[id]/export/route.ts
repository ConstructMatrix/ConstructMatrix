import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import { renderProjectExportPdf } from "@/lib/projectExportPdf";

function toCsvRow(fields: (string | number)[]) {
  return fields.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(",") + "\r\n";
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const format = new URL(request.url).searchParams.get("format") || "csv";
  const supabase = createServiceRoleClient();

  const { data: project } = await supabase.from("projects").select("name").eq("id", params.id).single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: members } = await supabase
    .from("project_members")
    .select("*, users(email, full_name, first_name, last_name)")
    .eq("project_id", params.id);

  const { data: docConfigs } = await supabase.from("project_documents_config").select("*").eq("project_id", params.id);
  const { data: allDocs } = await supabase.from("employee_documents").select("*").eq("project_id", params.id);
  const { data: allSubmissions } = await supabase.from("checklist_submissions").select("user_id").eq("project_id", params.id);
  const { data: companyLinks } = await supabase
    .from("employee_companies")
    .select("user_id, company_id, companies(name)")
    .eq("project_id", params.id);

  const rows = (members || []).map((m: any) => {
    const name = [m.users?.first_name, m.users?.last_name].filter(Boolean).join(" ") || m.users?.full_name || m.users?.email || "—";
    const mandatoryConfigs = (docConfigs || []).filter((c) => c.is_mandatory);
    const employeeDocs = (allDocs || []).filter((d) => d.user_id === m.user_id);
    const hasSubmission = (allSubmissions || []).some((s) => s.user_id === m.user_id);
    const clearance = computeClearance({
      documentConfigs: docConfigs || [],
      employeeDocuments: employeeDocs,
      hasChecklistSubmission: hasSubmission,
    });
    const verified = mandatoryConfigs.filter((c) =>
      employeeDocs.some((d) => d.document_type === c.document_type && d.confirmed_at),
    ).length;
    const company = (companyLinks || []).find((c: any) => c.user_id === m.user_id);

    return {
      worker: name,
      email: m.users?.email || "",
      company: (company?.companies as any)?.name || "",
      docsLabel: `${verified} / ${mandatoryConfigs.length}`,
      status: clearance.status,
    };
  });

  const safeName = project.name.replace(/[^a-z0-9]+/gi, "-");

  if (format === "pdf") {
    const buffer = await renderProjectExportPdf(project.name, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-roster.pdf"`,
      },
    });
  }

  let csv = toCsvRow(["Worker", "Email", "Company", "Documents Verified", "Status"]);
  rows.forEach((r) => csv += toCsvRow([r.worker, r.email, r.company, r.docsLabel, r.status]));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}-roster.csv"`,
    },
  });
}