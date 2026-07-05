"use client";

import type { ChecklistResponseValue } from "@/lib/types";

export default function YesNoNA({
  value,
  onChange,
}: {
  value: ChecklistResponseValue;
  onChange: (v: ChecklistResponseValue) => void;
}) {
  const base = "text-[11px] px-2 py-1 rounded border font-normal";
  const off = "border-border text-text-muted bg-transparent";
  const yes = "border-border-success text-text-success bg-bg-success";
  const no = "border-border-danger text-text-danger bg-bg-danger";
  const na = "border-border-strong text-text-muted bg-surface-1";

  return (
    <div className="flex gap-1 flex-shrink-0">
      <button type="button" className={`${base} ${value === "yes" ? yes : off}`} onClick={() => onChange("yes")}>
        Yes
      </button>
      <button type="button" className={`${base} ${value === "no" ? no : off}`} onClick={() => onChange("no")}>
        No
      </button>
      <button type="button" className={`${base} ${value === "na" ? na : off}`} onClick={() => onChange("na")}>
        N/A
      </button>
    </div>
  );
}
