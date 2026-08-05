"use server";

import { createClient } from "@/lib/supabase/server";
import { validateChecklistResponses, computeClearance } from "@/lib/validation";
import { renderChecklistPdf } from "@/lib/pdf";
import { sendChecklistSubmittedNotice } from "@/lib/email";
import type { ChecklistResponseValue, ChecklistSectionConfig } from "@/lib/types";

export interface SubmitChecklistInput {
  projectId: string;
  firstName: string;
  lastName: string;
  companyId: string;
  trade: string;
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

  const workerName = `${input.firstName} ${input.lastName}`.trim();

  const profileUpdate: Record<string, any> = {};
  if (input.employeeType) profileUpdate.employee_type = input.employeeType;
  if (input.companyId) profileUpdate.company_id = input.companyId;
  if (input.trade) profileUpdate.trade = input.trade;
  if (input.firstName) profileUpdate.first_name = input.firstName;
  if (input.lastName) profileUpdate.last_name = input.lastName;
  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from("users").update(profileUpdate).eq("id", user.id);
  }

  if (!input.signatureDataUrl) return { ok: false, error: "A signature is required before submitting." };
  if (!input.companyId) return { ok: false, error: "Please select your company." };

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", input.companyId)
    .single();
  const companyName = company?.name || "";

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

  const errors = validateChecklistResponses(sections, input.responses);
  if (errors.length > 0) {
    return { ok: false, validationErrors: errors.map((e) => e.message) };
  }

  const submittedAt = new Date().toISOString();

  const sigBase64 = input.signatureDataUrl.split(",")[1];
  const sigBuffer = Buffer.from(sigBase64, "base64");
  const sigPath = `${project.id}/${user.id}/signatures/${Date.now()}.png`;
  await supabase.storage.from("checklist-exports").upload(sigPath, sigBuffer, {
    contentType: "image/png",
    upsert: true,
  });

  let pdfUrl: string | null = null;
  try {
    const pdfBuffer = await renderChecklistPdf({
      projectName: project.name,
      workerName,
      company: companyName,
      unionTrade: input.trade || null,
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
    worker_name: workerName,
    company: companyName,
    union_trade: input.trade || null,
    submitted_at: submittedAt,
    responses: input.responses,
    signature_url: sigPath,
    exported_pdf_url: pdfUrl,
  });
  if (insertError) return { ok: false, error: insertError.message };

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

  const documentsSubmitted = (employeeDocs || []).map((d) => d.document_type);

  const { data: managers } = await supabase
    .from("project_members")
    .select("users(email, role)")
    .eq("project_id", project.id)
    .in("users.role", ["admin", "manager"]);

  const { data: allAdmins } = await supabase
    .from("users")
    .select("email")
    .eq("role", "admin");

  const emailsToNotify = new Set<string>();
  (allAdmins || []).forEach((a: any) => {
    if (a.email) emailsToNotify.add(a.email);
  });
  (managers || []).forEach((m: any) => {
    if (m.users?.email) emailsToNotify.add(m.users.email);
  });

  for (const email of emailsToNotify) {
    try {
      await sendChecklistSubmittedNotice({
        to: email,
        workerName,
        projectName: project.name,
        documentsSubmitted,
      });
    } catch (err) {
      console.error("Failed to send notification email", err);
    }
  }
  return { ok: true };
}