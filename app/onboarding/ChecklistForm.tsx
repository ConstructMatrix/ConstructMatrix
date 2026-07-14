"use client";

import { useRef, useState } from "react";
import type SignatureCanvas from "react-signature-canvas";
import SignaturePad from "@/components/SignaturePad";
import YesNoNA from "@/components/YesNoNA";
import type { ChecklistResponseValue, ChecklistSectionConfig } from "@/lib/types";
import { validateChecklistResponses } from "@/lib/validation";
import { submitChecklist } from "./actions";

export default function ChecklistForm({
  project,
  sections,
  profile,
}: {
  project: { id: string; name: string; slug: string };
  sections: ChecklistSectionConfig[];
  profile: { fullName: string; company: string; unionTrade: string };
}) {
  const [workerName, setWorkerName] = useState(profile.fullName);
  const [company, setCompany] = useState(profile.company);
  const [unionTrade, setUnionTrade] = useState(profile.unionTrade);
  const [employeeType, setEmployeeType] = useState("");
  const [responses, setResponses] = useState<Record<string, ChecklistResponseValue>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  function setResponse(sectionId: string, itemIndex: number, value: ChecklistResponseValue) {
    setResponses((prev) => ({ ...prev, [`${sectionId}:${itemIndex}`]: value }));
  }

  function clearSignature() {
    sigRef.current?.clear();
    setHasSignature(false);
  }

  async function handleSubmit() {
    const clientErrors = validateChecklistResponses(sections, responses).map((e) => e.message);
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
      workerName,
      company,
      unionTrade,
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
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <div className="toast flex items-center gap-2 justify-center card p-4">
            <span>✓ Checklist submitted. Your supervisor has been notified.</span>
          </div>
          <a href="/documents" className="btn btn-primary mt-4 inline-flex">
            Continue to document upload
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-5">
      <div className="mb-5">
        <h1 className="text-base font-medium">Construction site checklist</h1>
        <p className="text-xs text-text-muted mt-0.5">
          {project.name} · Check the following items with your supervisor. Required items must be marked Yes or N/A.
        </p>
      </div>

        <div className="grid grid-cols-2 gap-2 card bg-surface-1 p-3 mb-3">
        <Field label="Worker's name" value={workerName} onChange={setWorkerName} />
        <Field label="Company" value={company} onChange={setCompany} />
        <Field label="Union / trade" value={unionTrade} onChange={setUnionTrade} />
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Worker type</div>
          <select
            value={employeeType}
            onChange={(e) => setEmployeeType(e.target.value)}
            className="text-sm bg-transparent border-b border-border w-full pb-0.5 outline-none"
          >
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
        <div key={section.id} className="card mb-3 overflow-hidden">
          <div className="bg-surface-1 px-3 py-2 text-xs font-medium border-b border-border">
            {section.section_name}
          </div>
          {section.items.map((item, index) => {
            const key = `${section.id}:${index}`;
            return (
              <div key={key} className="flex items-start gap-2 px-3 py-2 border-b border-border last:border-b-0 text-xs">
                <span className="text-text-muted min-w-[18px]">{index + 1}.</span>
                <span className="flex-1 leading-relaxed">
                  {item.text}
                  {item.required && <span className="text-text-danger text-[10px] font-medium ml-1">required</span>}
                </span>
                <YesNoNA value={responses[key] ?? null} onChange={(v) => setResponse(section.id, index, v)} />
              </div>
            );
          })}
        </div>
      ))}

      <div className="card mb-4 p-3">
        <div className="text-xs font-medium mb-2">Worker&apos;s signature</div>
        <SignaturePad ref={sigRef} onEnd={() => setHasSignature(true)} />
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-text-muted">Sign above</span>
          <button type="button" onClick={clearSignature} className="text-[11px] text-text-muted">
            Clear
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="card border-border-danger bg-bg-danger p-3 mb-4 text-xs text-text-danger">
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">{label}</div>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-transparent border-b border-border w-full pb-0.5 outline-none"
      />
    </div>
  );
}
