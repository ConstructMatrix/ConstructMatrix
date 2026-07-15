import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderChecklistDocx } from "@/lib/docx-export";
import type { ChecklistSectionConfig } from "@/lib/types";

// On-demand Word export (SRS FR17): PDF is generated at submission time and
// stored automatically; DOCX is rendered on demand since most orgs only need
// it occasionally, from the same stored submission data.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: submission } = await supabase
    .from("checklist_submissions")
    .select("*, projects(name)")
    .eq("id", params.id)
    .single();
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = submission.user_id === user.id;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "admin" || profile?.role === "manager";
  if (!isOwner && !isStaff) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { data: sections } = await supabase
    .from("project_checklist_config")
    .select("*")
    .eq("project_id", submission.project_id)
    .order("section_order");

  const { data: sigFile } = await supabase.storage.from("checklist-exports").download(submission.signature_url);
  const signatureBuffer = sigFile ? Buffer.from(await sigFile.arrayBuffer()) : undefined;

  const buffer = await renderChecklistDocx({
    projectName: submission.projects?.name || "",
    workerName: submission.worker_name,
    company: submission.company,
    unionTrade: submission.union_trade,
     employeeType: submission.employee_type || null,
    submittedAt: submission.submitted_at,
    sections: (sections || []) as ChecklistSectionConfig[],
    responses: submission.responses,
    signatureDataUrl: "",
    signatureBuffer,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="checklist-${params.id}.docx"`,
    },
  });
}
