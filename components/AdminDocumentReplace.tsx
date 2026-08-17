"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fileToImageDataUrl } from "@/lib/fileUpload";

export default function AdminDocumentReplace({
  projectId,
  userId,
  documentType,
  isMandatory,
}: {
  projectId: string;
  userId: string;
  documentType: string;
  isMandatory: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const imageDataUrl = await fileToImageDataUrl(file);
      const res = await fetch("/api/scan-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          documentType,
          imageDataUrl,
          isMandatory,
          targetUserId: userId,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Upload failed: ${text.slice(0, 100)}`);
        return;
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex-shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn text-xs py-1 px-2"
      >
        {uploading ? "Uploading…" : "Replace"}
      </button>
      {error && <p className="text-xs text-text-danger mt-1">{error}</p>}
    </div>
  );
}