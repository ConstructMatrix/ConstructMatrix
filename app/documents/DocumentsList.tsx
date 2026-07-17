"use client";

import { useRef, useState } from "react";
import type { EmployeeDocument, ProjectDocumentConfig } from "@/lib/types";

type Status = "missing" | "pending" | "verified";

function statusFor(doc: EmployeeDocument | undefined): Status {
  if (!doc) return "missing";
  return doc.confirmed_at ? "verified" : "pending";
}

async function compressImage(file: File, maxDimension = 1600, quality = 0.7): Promise<string> {
  const img = document.createElement("img");
  const reader = new FileReader();

  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  let { width, height } = img;
  if (width > height && width > maxDimension) {
    height = (height * maxDimension) / width;
    width = maxDimension;
  } else if (height > maxDimension) {
    width = (width * maxDimension) / height;
    height = maxDimension;
  }
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
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
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const latestDocFor = (type: string) => docs.find((d) => d.document_type === type);

  function showError(message: string) {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 5000);
  }

  async function handleFile(config: ProjectDocumentConfig, file: File) {
    setUploading(config.document_type);
    try {
      const imageDataUrl = await compressImage(file);
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

      if (!res.ok) {
        const text = await res.text();
        console.error("Upload failed:", res.status, text);
        showError(
          res.status === 413
            ? "That image is too large. Try again — it should compress automatically now."
            : "Upload failed. Please try again."
        );
        return;
      }

      const json = await res.json();
      setDocs((prev) => [json.document, ...prev]);
      setToast(true);
      setTimeout(() => setToast(false), 4000);
    } catch (err) {
      console.error("Upload error:", err);
      showError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(null);
    }
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
      {errorToast && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <span>{errorToast}</span>
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