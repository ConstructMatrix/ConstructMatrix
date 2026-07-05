import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { documentId, corrections } = await request.json();
  if (!documentId) return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

  const { data: doc } = await supabase.from("employee_documents").select("*").eq("id", documentId).single();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const mergedAiData = { ...(doc.ai_data || {}), ...(corrections || {}) };

  const { error: updateError } = await supabase
    .from("employee_documents")
    .update({
      ai_data: mergedAiData,
      expiry_date: corrections?.expiry_date ?? doc.expiry_date,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", documentId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Re-run the clearance engine for this worker on this project (SRS 5.4).
  const { data: docConfigs } = await supabase
    .from("project_documents_config")
    .select("*")
    .eq("project_id", doc.project_id);
  const { data: employeeDocs } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("project_id", doc.project_id)
    .eq("user_id", doc.user_id);
  const { data: submission } = await supabase
    .from("checklist_submissions")
    .select("id")
    .eq("project_id", doc.project_id)
    .eq("user_id", doc.user_id)
    .maybeSingle();

  const clearance = computeClearance({
    documentConfigs: docConfigs || [],
    employeeDocuments: employeeDocs || [],
    hasChecklistSubmission: !!submission,
  });

  await supabase
    .from("project_members")
    .update({ status: clearance.status })
    .eq("project_id", doc.project_id)
    .eq("user_id", doc.user_id);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "document_confirmed",
    target_type: "employee_document",
    target_id: documentId,
    metadata: { new_status: clearance.status },
  });

  return NextResponse.json({ ok: true, status: clearance.status });
}
