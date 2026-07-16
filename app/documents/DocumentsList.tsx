"use client";

import { useRef, useState } from "react";
import type { EmployeeDocument, ProjectDocumentConfig } from "@/lib/types";

type Status = "missing" | "pending" | "verified";

function statusFor(doc: EmployeeDocument | undefined): Status {
  if (!doc) return "missing";
  return doc.confirmed_at ? "verified" : "pending";
}

export default function DocumentsList({
  projectId,
  docConfigs,
  employeeDocs: initialDocs,
}: {
  projectId: string;
  docConfigs: ProjectDocumentConfig[];
  employeeDocs: EmployeeDocument[];
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const latestDocFor = (type: string) => docs.find((d) => d.document_type === type);

  async function handleFile(config: ProjectDocumentConfig, file: File) {
    setUploading(config.document_type);
    const reader = new FileReader();
    reader.onload = async () => {
      const imageDataUrl = reader.result as string;
      const res = await fetch("/api/scan-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          documentType: config.document_type,
          imageDataUrl,
          isMandatory: config.is_mandatory,
        }),
      });
      const json = await res.json();
      setUploading(null);
      if (res.ok) {
        setDocs((prev) => [json.document, ...prev]);
        setToast(true);
        setTimeout(() => setToast(false), 4000);
      }
    };
    reader.readAsDataURL(file);
  }

  const mandatory = docConfigs.filter((c) => c.is_mandatory);
  const optional = docConfigs.filter((c) => !c.is_mandatory);

  const Row = ({ config }: { config: ProjectDocumentConfig }) => {
    const doc = latestDocFor(config.document_type);
    const status = statusFor(doc);
    const isUploading = uploading === config.document_type;

    return (
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0">
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-medium ${
            status === "verified"
              ? "bg-bg-success text-text-success border border-border-success"
              : status === "pending"
                ? "bg-bg-warning text-text-warning border border-border-warning"
                : "bg-surface-1 text-text-muted border border-border"
          }`}
        >
          {status === "verified" ? "✓" : status === "pending" ? "…" : "↑"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">{config.document_type}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {status === "verified" && "Verified by supervisor"}
            {status === "pending" && (isUploading ? "Scanning with AI…" : "Uploaded · Waiting for review")}
            {status === "missing" && (config.is_mandatory ? "Not yet uploaded" : "Optional · Not uploaded")}
          </div>
        </div>
        {status === "verified" ? (
          <span className="pill pill-ok">Verified</span>
        ) : status === "pending" ? (
          <div className="flex items-center gap-2">
            <span className="pill pill-warn">Pending</span>
            <button
              className="text-xs text-text-danger hover:underline"
              onClick={async () => {
                if (!doc) return;
                await fetch(`/api/delete-document`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ documentId: doc.id }),
                });
                setDocs((prev) => prev.filter((d) => d.id !== doc.id));
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={(el) => { fileInputs.current[config.document_type] = el; }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(config, file);
              }}
            />
            <button
              className="w-9 h-9 rounded-lg border-2 border-dashed border-border-strong text-text-muted flex items-center justify-center hover:border-brand hover:text-brand transition-colors"
              onClick={() => fileInputs.current[config.document_type]?.click()}
              disabled={isUploading}
              aria-label={`Upload ${config.document_type}`}
            >
              {isUploading ? "…" : "+"}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {toast && (
        <div className="toast mb-4 flex items-center gap-2">
          <span>✓ Document uploaded. Your supervisor has been notified to review it.</span>
        </div>
      )}
      {mandatory.length > 0 && (
        <div className="card mb-4 overflow-hidden">
          <div className="card-header">Required documents</div>
          {mandatory.map((c) => (
            <Row key={c.id} config={c} />
          ))}
        </div>
      )}
      {optional.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header">Additional documents</div>
          {optional.map((c) => (
            <Row key={c.id} config={c} />
          ))}
        </div>
      )}
    </>
  );
}
