"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function FilterBar({
  projects,
  companies,
}: {
  projects: { id: string; name: string }[];
  companies: { id: string; name: string }[];
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
    <div className="flex flex-wrap gap-2 mb-5 items-center">
      <select
        className="select"
        defaultValue={searchParams.get("type") || "all"}
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="all">All types</option>
        <option value="employee">Employee</option>
        <option value="contractor">Contractor</option>
        <option value="subcontractor">Subcontractor</option>
      </select>
      <select
        className="select"
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
        className="select"
        defaultValue={searchParams.get("project") || "all"}
        onChange={(e) => update("project", e.target.value)}
      >
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        className="select"
        defaultValue={searchParams.get("company") || "all"}
        onChange={(e) => update("company", e.target.value)}
      >
        <option value="all">All companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}