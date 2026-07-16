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
      <div className="bg-surface-1 h-36 flex items-center justify-center border-b border-border">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={doc.document_type} className="h-full object-contain p-2" />
        ) : (
          <span className="text-sm text-text-muted">{doc.document_type}</span>
        )}
      </div>
      <div className="p-5">
        <div className="text-xs text-text-muted mb-4 flex items-center gap-2">
          <span className="bg-bg-pro text-text-pro border border-border-pro rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            AI suggested
          </span>
          Review and confirm
        </div>

        {editing ? (
          <div className="space-y-3 text-sm">
            {(["credential_type", "holder_name", "issuing_body", "issue_date", "expiry_date"] as const).map((key) => (
              <div key={key}>
                <label className="label capitalize">{key.replace("_", " ")}</label>
                <input
                  className="input text-sm"
                  value={fields[key]}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm">
            <Row label="Type" value={fields.credential_type} />
            <Row label="Name" value={fields.holder_name} />
            <Row label="Issued by" value={fields.issuing_body} />
            <Row label="Expiry" value={fields.expiry_date} last />
          </div>
        )}

        {confirmed ? (
          <div className="mt-4 alert alert-success text-xs flex items-center gap-1.5">
            ✓ Confirmed · notification sent to worker
          </div>
        ) : (
          <div className="flex gap-2 mt-5">
            <button className="btn flex-1 text-sm" onClick={() => setEditing((v) => !v)}>
              {editing ? "Done editing" : "Edit"}
            </button>
            <button className="btn btn-primary flex-1 text-sm" onClick={handleConfirm} disabled={loading}>
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
    <div className={`flex justify-between py-2.5 ${last ? "" : "border-b border-border"}`}>
      <span className="text-text-muted">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
