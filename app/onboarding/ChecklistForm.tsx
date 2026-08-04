"use client";

import { useRef, useState } from "react";
import type SignatureCanvas from "react-signature-canvas";
import SignaturePad from "@/components/SignaturePad";
import YesNoNA from "@/components/YesNoNA";
import type { ChecklistResponseValue, ChecklistSectionConfig, ProjectDocumentConfig } from "@/lib/types";
import { validateChecklistResponses } from "@/lib/validation";
import { fileToImageDataUrl } from "@/lib/fileUpload";
import { submitChecklist } from "./actions";

interface CompanyOption {
  id: string;
  name: string;
  trades: { id: string; trade_name: string }[];
}

type DocStatus = "yes" | "no" | "na";

export default function ChecklistForm({
  project,
  sections,
  docConfigs,
  companies,
  profile,
}: {
  project: { id: string; name: string; slug: string };
  sections: ChecklistSectionConfig[];
  docConfigs: ProjectDocumentConfig[];
  companies: CompanyOption[];
  profile: { firstName: string; lastName: string; companyId: string; trade: string };
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [companyId, setCompanyId] = useState(profile.companyId);
  const [trade, setTrade] = useState(profile.trade);
  const [employeeType, setEmployeeType] = useState("");
  const [responses, setResponses] = useState<Record<string, ChecklistResponseValue>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  const [docStatus, setDocStatus] = useState<Record<string, DocStatus>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const docFileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedCompany = companies.find((c) => c.id === companyId);

  function setResponse(sectionId: string, itemIndex: number, value: ChecklistResponseValue) {
    setResponses((prev) => ({ ...prev, [`${sectionId}:${itemIndex}`]: value }));
  }

  function clearSignature() {
    sigRef.current?.clear();
    setHasSignature(false);
  }

  function selectDocStatus(config: ProjectDocumentConfig, status: DocStatus) {
    if (status === "yes") {
      docFileInputs.current[config.document_type]?.click();
      return;
    }
    setDocStatus((prev) => ({ ...prev, [config.document_type]: status }));
    setDocErrors((prev) => ({ ...prev, [config.document_type]: "" }));
  }

  async function handleDocFile(config: ProjectDocumentConfig, file: File) {
    setUploadingDoc(config.document_type);
    setDocErrors((prev) => ({ ...prev, [config.document_type]: "" }));
    try {
      const imageDataUrl = await fileToImageDataUrl(file);
      const res = await fetch("/api/scan-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          documentType: config.document_type,
          imageDataUrl,
          isMandatory: config.is_mandatory,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Doc upload failed:", res.status, text);
        setDocErrors((prev) => ({
          ...prev,
          [config.document_type]: res.status === 413 ? "File too large. Try again." : "Upload failed. Try again.",
        }));
        return;
      }

      setDocStatus((prev) => ({ ...prev, [config.document_type]: "yes" }));
    } catch (err) {
      console.error("Doc upload error:", err);
      setDocErrors((prev) => ({ ...prev, [config.document_type]: "Upload failed. Check your connection." }));
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleSubmit() {
    const clientErrors = validateChecklistResponses(sections, responses).map((e) => e.message);
    if (!companyId) clientErrors.push("Please select your company.");

    for (const config of docConfigs) {
      if (config.is_mandatory && docStatus[config.document_type] !== "yes") {
        clientErrors.push(`${config.document_type} must be uploaded.`);
      }
    }

    if (!hasSignature || sigRef.current?.isEmpty()) {
      clientErrors.push("A signature is required before submitting.");
    }
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    const signatureDataUrl = sigRef.current!.getTrimmedCanvas().toDataURL("image/png");

    const result = await submitChecklist({
      projectId: project.id,
      firstName,
      lastName,
      companyId,
      trade,
      employeeType,
      responses,
      signatureDataUrl,
    });

    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.validationErrors || [result.error || "Something went wrong."]);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-surface-0">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-bg-success border border-border-success flex items-center justify-center text-2xl mx-auto mb-5">
            ✓
          </div>
          <h2 className="text-xl font-semibold mb-2">Checklist and documents submitted</h2>
          <p className="text-sm text-text-muted">Your supervisor has been notified. Thank you!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-0 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Construction site checklist</h1>
          <p className="page-subtitle">
            {project.name} · Check the following items with your supervisor. Required items must be marked Yes or N/A.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 card p-5 mb-5">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />

          <div>
            <label className="label">Company</label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setTrade("");
              }}
              className="select w-full"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Union / trade</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="select w-full"
              disabled={!selectedCompany || selectedCompany.trades.length === 0}
            >
              <option value="">
                {selectedCompany && selectedCompany.trades.length === 0 ? "No trades listed" : "Select trade..."}
              </option>
              {selectedCompany?.trades.map((t) => (
                <option key={t.id} value={t.trade_name}>{t.trade_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Worker type</label>
            <select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} className="select w-full">
              <option value="">Select type...</option>
              <option value="contractor">Contractor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="consultant">Consultant</option>
              <option value="owner">Owner</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <Field label="Date" value={new Date().toLocaleDateString()} onChange={() => {}} readOnly />
        </div>

        {sections.map((section) => (
          <div key={section.id} className="card mb-4 overflow-hidden">
            <div className="card-header">{section.section_name}</div>
            {section.items.map((item, index) => {
              const key = `${section.id}:${index}`;
              return (
                <div key={key} className="flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-b-0">
                  <span className="text-text-muted text-sm font-medium min-w-[24px] pt-0.5">{index + 1}.</span>
                  <span className="flex-1 text-sm leading-relaxed">
                    {item.text}
                    {item.required && (
                      <span className="text-text-danger text-xs font-semibold ml-1.5 uppercase tracking-wide">required</span>
                    )}
                  </span>
                  <YesNoNA value={responses[key] ?? null} onChange={(v) => setResponse(section.id, index, v)} />
                </div>
              );
            })}
          </div>
        ))}

        {docConfigs.length > 0 && (
          <div className="card mb-4 overflow-hidden">
            <div className="card-header">Required documents</div>
            {docConfigs.map((config) => {
              const status = docStatus[config.document_type];
              const isUploading = uploadingDoc === config.document_type;
              const docError = docErrors[config.document_type];
              return (
                <div key={config.id} className="border-b border-border last:border-b-0">
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <span className="flex-1 text-sm leading-relaxed">
                      {config.document_type}
                      {config.is_mandatory && (
                        <span className="text-text-danger text-xs font-semibold ml-1.5 uppercase tracking-wide">required</span>
                      )}
                      {status === "yes" && <span className="text-text-success text-xs font-medium ml-2">✓ Uploaded</span>}
                      {isUploading && <span className="text-text-muted text-xs ml-2">Uploading…</span>}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      ref={(el) => { docFileInputs.current[config.document_type] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocFile(config, file);
                      }}
                    />
                    <div className="flex gap-2">
                      {(["yes", "no", "na"] as DocStatus[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={isUploading}
                          onClick={() => selectDocStatus(config, opt)}
                          className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                            status === opt
                              ? opt === "yes"
                                ? "border-border-success text-text-success bg-bg-success"
                                : "border-brand text-brand bg-brand-light"
                              : "border-border-strong text-text-muted hover:border-text-muted"
                          }`}
                        >
                          {opt === "na" ? "N/A" : opt === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {docError && <p className="text-xs text-text-danger px-4 pb-3">{docError}</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="card p-5 mb-5">
          <div className="text-sm font-semibold mb-3">Worker&apos;s signature</div>
          <SignaturePad ref={sigRef} onEnd={() => setHasSignature(true)} />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-muted">Sign above using your finger or mouse</span>
            <button type="button" onClick={clearSignature} className="text-xs text-text-muted hover:text-text-primary transition-colors">
              Clear
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-danger mb-5">
            <ul className="list-disc pl-4 space-y-1 text-sm">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary px-8 py-2.5">
            {submitting ? "Submitting…" : "Submit checklist"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, readOnly }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} className={`input ${readOnly ? "bg-surface-1 text-text-muted" : ""}`} />
    </div>
  );
}