"use client";

import type { ChecklistResponseValue } from "@/lib/types";

export default function PassFail({
  value,
  onChange,
}: {
  value: ChecklistResponseValue;
  onChange: (v: ChecklistResponseValue) => void;
}) {
  const base = "text-xs font-medium px-3 py-1.5 rounded-md border transition-all duration-150";
  const off = "border-border text-text-muted bg-surface-2 hover:bg-surface-1";
  const pass = "border-border-success text-text-success bg-bg-success shadow-sm";
  const fail = "border-border-danger text-text-danger bg-bg-danger shadow-sm";

  return (
    <div className="flex gap-1 flex-shrink-0">
      <button type="button" className={`${base} ${value === "pass" ? pass : off}`} onClick={() => onChange("pass")}>
        Pass
      </button>
      <button type="button" className={`${base} ${value === "fail" ? fail : off}`} onClick={() => onChange("fail")}>
        Fail
      </button>
    </div>
  );
}