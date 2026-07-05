import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import { sendExpiryAlert, sendAdminExpiryAlert } from "@/lib/email";

const THRESHOLDS = [90, 30, 7];

function daysUntil(dateStr: string) {
  const ms = new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Daily job (SRS FR40-44): finds mandatory documents that are expiring soon or
 * expired, emails the worker + project admin, logs the alert, and downgrades
 * clearance status for anything that has actually expired.
 *
 * Trigger via Vercel Cron (see vercel.json) or Supabase pg_cron + pg_net
 * hitting this route with `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const results = { alertsSent: 0, downgraded: 0 };

  const { data: docs } = await supabase
    .from("employee_documents")
    .select("*, users(email, full_name), projects(name, admin_id)")
    .not("expiry_date", "is", null)
    .not("confirmed_at", "is", null);

  for (const doc of docs || []) {
    const daysRemaining = daysUntil(doc.expiry_date);
    const threshold = THRESHOLDS.find((t) => daysRemaining <= t) ?? (daysRemaining < 0 ? 0 : null);
    if (threshold === null) continue;

    const { data: existingAlert } = await supabase
      .from("expiry_alerts")
      .select("*")
      .eq("document_id", doc.id)
      .eq("alert_threshold_days", threshold)
      .maybeSingle();

    if (!existingAlert?.last_sent_at) {
      const { data: admin } = await supabase.from("users").select("email").eq("id", doc.projects.admin_id).single();

      try {
        if (doc.users?.email) {
          await sendExpiryAlert({
            to: doc.users.email,
            workerName: doc.users.full_name || "there",
            documentType: doc.document_type,
            expiryDate: doc.expiry_date,
            daysRemaining,
            projectName: doc.projects.name,
          });
        }
        if (admin?.email) {
          await sendAdminExpiryAlert({
            to: admin.email,
            workerName: doc.users?.full_name || doc.users?.email || "Worker",
            documentType: doc.document_type,
            expiryDate: doc.expiry_date,
            daysRemaining,
            projectName: doc.projects.name,
          });
        }
        results.alertsSent += 1;
      } catch (err) {
        console.error("Failed to send expiry alert", err);
      }

      await supabase.from("expiry_alerts").upsert(
        {
          id: existingAlert?.id,
          document_id: doc.id,
          alert_threshold_days: threshold,
          last_sent_at: new Date().toISOString(),
          recipient_user_id: doc.user_id,
        },
        { onConflict: "id" },
      );
    }

    if (daysRemaining < 0) {
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

      const { data: member } = await supabase
        .from("project_members")
        .select("status")
        .eq("project_id", doc.project_id)
        .eq("user_id", doc.user_id)
        .single();

      if (member && member.status !== clearance.status) {
        await supabase
          .from("project_members")
          .update({ status: clearance.status })
          .eq("project_id", doc.project_id)
          .eq("user_id", doc.user_id);
        results.downgraded += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
