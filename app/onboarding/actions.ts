"use server";

import { createClient } from "@/lib/supabase/server";
import { validateChecklistResponses, computeClearance } from "@/lib/validation";
import { renderChecklistPdf } from "@/lib/pdf";
import { sendChecklistSubmittedNotice } from "@/lib/email";
import type { ChecklistResponseValue, ChecklistSectionConfig } from "@/lib/types";

export interface SubmitChecklistInput {
  projectId: string;
  workerName: string;
  company: string;
  unionTrade: string;
   employeeType: string;
  responses: Record<string, ChecklistResponseValue>;
  signatureDataUrl: string;
}

export interface SubmitChecklistResult {
  ok: boolean;
  error?: string;
  validationErrors?: string[];
}

export async function submitChecklist(input: SubmitChecklistInput): Promise<SubmitChecklistResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not signed in." };
  if (input.employeeType) {
  await supabase
    .from("users")
    .update({ employee_type: input.employeeType })
    .eq("id", user.id);
   }
  if (!input.signatureDataUrl) return { ok: false, error: "A signature is required before submitting." };

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, admin_id")
    .eq("id", input.projectId)
    .single();
  if (!project) return { ok: false, error: "Project not found." };

  const { data: sectionsData } = await supabase
    .from("project_checklist_config")
    .select("*")
    .eq("project_id", project.id)
    .order("section_order", { ascending: true });
  const sections = (sectionsData || []) as ChecklistSectionConfig[];

  // Server-side validation gate (SRS FR14/FR34) — never trust client-side checks alone.
  const errors = validateChecklistResponses(sections, input.responses);
  if (errors.length > 0) {
    return { ok: false, validationErrors: errors.map((e) => e.message) };
  }

  const submittedAt = new Date().toISOString();

  // Upload signature PNG to Storage.
  const sigBase64 = input.signatureDataUrl.split(",")[1];
  const sigBuffer = Buffer.from(sigBase64, "base64");
  const sigPath = `${project.id}/${user.id}/signatures/${Date.now()}.png`;
  await supabase.storage.from("checklist-exports").upload(sigPath, sigBuffer, {
    contentType: "image/png",
    upsert: true,
  });

  // Render + store the PDF export (SRS FR17/FR18).
  let pdfUrl: string | null = null;
  try {
    const pdfBuffer = await renderChecklistPdf({
      projectName: project.name,
      workerName: input.workerName,
      company: input.company,
      unionTrade: input.unionTrade || null,
      employeeType: input.employeeType || null,
      submittedAt,
      sections,
      responses: input.responses,
      signatureDataUrl: input.signatureDataUrl,
    });
    const pdfPath = `${project.id}/${user.id}/checklists/${Date.now()}.pdf`;
    await supabase.storage.from("checklist-exports").upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    pdfUrl = pdfPath;
  } catch (err) {
    console.error("PDF export failed", err);
  }

  const { error: insertError } = await supabase.from("checklist_submissions").insert({
    user_id: user.id,
    project_id: project.id,
    worker_name: input.workerName,
    company: input.company,
    union_trade: input.unionTrade || null,
    submitted_at: submittedAt,
    responses: input.responses,
    signature_url: sigPath,
    exported_pdf_url: pdfUrl,
  });
  if (insertError) return { ok: false, error: insertError.message };

  // Re-run the clearance engine (SRS 5.4).
  const { data: docConfigs } = await supabase
    .from("project_documents_config")
    .select("*")
    .eq("project_id", project.id);
  const { data: employeeDocs } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("project_id", project.id)
    .eq("user_id", user.id);

  const clearance = computeClearance({
    documentConfigs: docConfigs || [],
    employeeDocuments: employeeDocs || [],
    hasChecklistSubmission: true,
  });

  await supabase
    .from("project_members")
    .update({ status: clearance.status })
    .eq("project_id", project.id)
    .eq("user_id", user.id);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "checklist_submitted",
    target_type: "project",
    target_id: project.id,
    metadata: { blocking_reasons: clearance.blockingReasons },
  });

  const { data: admin } = await supabase.from("users").select("email").eq("id", project.admin_id).single();
  if (admin?.email) {
    try {
      await sendChecklistSubmittedNotice({
        to: admin.email,
        workerName: input.workerName,
        projectName: project.name,
      });
    } catch (err) {
      console.error("Failed to send admin notification email", err);
    }
  }

  return { ok: true };
}
