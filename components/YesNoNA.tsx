"use client";

import type { ChecklistResponseValue } from "@/lib/types";

export default function YesNoNA({
  value,
  onChange,
}: {
  value: ChecklistResponseValue;
  onChange: (v: ChecklistResponseValue) => void;
}) {
  const base = "text-xs font-medium px-3 py-1.5 rounded-md border transition-all duration-150";
  const off = "border-border text-text-muted bg-surface-2 hover:bg-surface-1";
  const yes = "border-border-success text-text-success bg-bg-success shadow-sm";
  const no = "border-border-danger text-text-danger bg-bg-danger shadow-sm";
  const na = "border-border-strong text-text-secondary bg-surface-1 shadow-sm";

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
