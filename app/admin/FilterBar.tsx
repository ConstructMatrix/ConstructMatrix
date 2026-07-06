"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function FilterBar({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 mb-4 items-center">
      <select
        className="text-xs border border-border rounded px-2 py-1.5"
        defaultValue={searchParams.get("type") || "all"}
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="all">All types</option>
        <option value="employee">Employee</option>
        <option value="contractor">Contractor</option>
        <option value="subcontractor">Subcontractor</option>
      </select>
      <select
        className="text-xs border border-border rounded px-2 py-1.5"
        defaultValue={searchParams.get("status") || "all"}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="cleared">Cleared</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="blocked">Action needed</option>
      </select>
      <select
        className="text-xs border border-border rounded px-2 py-1.5"
        defaultValue={searchParams.get("project") || "all"}
        onChange={(e) => update("project", e.target.value)}
      >
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
