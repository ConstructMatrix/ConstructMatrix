"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeDocument } from "@/lib/types";

export default function DocumentReviewCard({ doc, photoUrl }: { doc: EmployeeDocument; photoUrl: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    credential_type: doc.ai_data?.credential_type || "",
    holder_name: doc.ai_data?.holder_name || "",
    issuing_body: doc.ai_data?.issuing_body || "",
    issue_date: doc.ai_data?.issue_date || "",
    expiry_date: doc.ai_data?.expiry_date || "",
  });
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const res = await fetch("/api/documents/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id, corrections: fields }),
    });
    setLoading(false);
    if (res.ok) {
      setConfirmed(true);
      router.refresh();
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-surface-1 h-20 flex items-center justify-center border-b border-border">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={doc.document_type} className="h-full object-contain" />
        ) : (
          <span className="text-xs text-text-muted">{doc.document_type}</span>
        )}
      </div>
      <div className="p-3">
        <div className="text-[11px] text-text-muted mb-2 flex items-center gap-1.5">
          <span className="bg-bg-pro text-text-pro border border-border-pro rounded-full px-2 py-0.5 text-[10px]">
            AI suggested
          </span>
          Review and confirm
        </div>

        {editing ? (
          <div className="space-y-1.5 text-xs">
            {(["credential_type", "holder_name", "issuing_body", "issue_date", "expiry_date"] as const).map((key) => (
              <div key={key} className="flex justify-between items-center gap-2 border-b border-border py-1">
                <span className="text-text-muted capitalize">{key.replace("_", " ")}</span>
                <input
                  className="text-right border-b border-border outline-none w-32 bg-transparent"
                  value={fields[key]}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs">
            <Row label="Type" value={fields.credential_type} />
            <Row label="Name" value={fields.holder_name} />
            <Row label="Issued by" value={fields.issuing_body} />
            <Row label="Expiry" value={fields.expiry_date} last />
          </div>
        )}

        {confirmed ? (
          <div className="mt-2.5 text-[11px] text-text-success flex items-center gap-1">
            ✓ Confirmed · notification sent to worker
          </div>
        ) : (
          <div className="flex gap-1.5 mt-2.5">
            <button className="btn flex-1 text-xs" onClick={() => setEditing((v) => !v)}>
              {editing ? "Done editing" : "Edit"}
            </button>
            <button className="btn btn-primary flex-1 text-xs" onClick={handleConfirm} disabled={loading}>
              {loading ? "Confirming…" : "Confirm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${last ? "" : "border-b border-border"}`}>
      <span className="text-text-muted">{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}
