import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanCredentialImage } from "@/lib/claude";
import { sendDocumentUploadedNotice } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { projectId, documentType, imageDataUrl, isMandatory, targetUserId } = await request.json();
  if (!projectId || !documentType || !imageDataUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Managers/admins may upload on behalf of an employee; otherwise the upload is for self.
  const ownerId = targetUserId || user.id;

  const contentType = imageDataUrl.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
  const ext = contentType.split("/")[1] || "jpg";
  const base64 = imageDataUrl.split(",")[1];
  const buffer = Buffer.from(base64, "base64");
  const path = `${projectId}/${ownerId}/${documentType.replace(/\s+/g, "_")}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("credential-photos")
    .upload(path, buffer, { contentType, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  let aiData = null;
  try {
    aiData = await scanCredentialImage(imageDataUrl);
  } catch (err) {
    console.error("Claude scan failed", err);
  }

  const { data: doc, error: insertError } = await supabase
    .from("employee_documents")
    .insert({
      user_id: ownerId,
      project_id: projectId,
      document_type: documentType,
      photo_url: path,
      ai_data: aiData,
      is_mandatory: !!isMandatory,
      expiry_date: aiData?.expiry_date || null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "document_uploaded",
    target_type: "employee_document",
    target_id: doc.id,
    metadata: { document_type: documentType, project_id: projectId },
  });
    await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "document_uploaded",
        target_type: "employee_document",
        target_id: doc.id,
        metadata: { document_type: documentType, project_id: projectId },
      });

      // Notify managers
      try {
        const { data: project } = await supabase
          .from("projects")
          .select("name, admin_id")
          .eq("id", projectId)
          .single();
        if (project) {
          const { data: admin } = await supabase
            .from("users")
            .select("email")
            .eq("id", project.admin_id)
            .single();
          if (admin?.email) {
            await sendDocumentUploadedNotice({
              to: admin.email,
              workerName: user.email || "A worker",
              documentType,
              projectName: project.name,
            });
          }
        }
      } catch (err) {
        console.error("Failed to send document notification", err);
      }

      return NextResponse.json({ document: doc });
    }
 