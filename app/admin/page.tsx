import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";
import FilterBar from "./FilterBar";
import type { ProjectStatus } from "@/lib/types";

function displayName(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null; email?: string | null }) {
  const combined = [u?.first_name, u?.last_name].filter(Boolean).join(" ");
  return combined || u?.full_name || u?.email || "—";
}

function initials(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null }) {
  const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.full_name;
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; project?: string };
}) {
  const supabase = createClient();

  const { data: projects } = await supabase.from("projects").select("id, name").order("created_at");
  const projectIds = searchParams.project ? [searchParams.project] : (projects || []).map((p) => p.id);

  let members: any[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("project_members")
      .select("project_id, user_id, status, users(id, email, full_name, first_name, last_name, position, employee_type), projects(name)")
      .in("project_id", projectIds);
    members = data || [];
  }

  const { data: allDocConfigs } = await supabase
    .from("project_documents_config")
    .select("*")
    .in("project_id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: allEmployeeDocs } = await supabase
    .from("employee_documents")
    .select("*")
    .in("project_id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: allSubmissions } = await supabase
    .from("checklist_submissions")
    .select("user_id, project_id")
    .in("project_id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);

  const roster = members
    .filter((m) => !searchParams.type || m.users?.employee_type === searchParams.type)
    .map((m) => {
      const docConfigs = (allDocConfigs || []).filter((c) => c.project_id === m.project_id);
      const mandatoryConfigs = docConfigs.filter((c) => c.is_mandatory);
      const employeeDocs = (allEmployeeDocs || []).filter(
        (d) => d.project_id === m.project_id && d.user_id === m.user_id,
      );
      const hasSubmission = (allSubmissions || []).some(
        (s) => s.project_id === m.project_id && s.user_id === m.user_id,
      );
      const clearance = computeClearance({
        documentConfigs: docConfigs,
        employeeDocuments: employeeDocs,
        hasChecklistSubmission: hasSubmission,
      });
      const verifiedMandatoryCount = mandatoryConfigs.filter((c) =>
        employeeDocs.some((d) => d.document_type === c.document_type && d.confirmed_at && !isExpired(d.expiry_date)),
      ).length;

      return {
        ...m,
        status: clearance.status as ProjectStatus,
        blockingReasons: clearance.blockingReasons,
        docsLabel: `${verifiedMandatoryCount} / ${mandatoryConfigs.length}`,
      };
    })
    .filter((m) => !searchParams.status || m.status === searchParams.status);

  const stats = {
    total: roster.length,
    cleared: roster.filter((m) => m.status === "cleared").length,
    pending: roster.filter((m) => m.status === "pending" || m.status === "in_progress").length,
    blocked: roster.filter((m) => m.status === "blocked").length,
  };

  return (
    <div className="p-6">
      <PageHeader title="Employee status" subtitle="All projects · Admin view" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Total employees" value={stats.total} />
        <Stat label="Cleared" value={stats.cleared} accent="success" />
        <Stat label="Pending" value={stats.pending} accent="warning" />
        <Stat label="Action needed" value={stats.blocked} accent="danger" />
      </div>

      <FilterBar projects={projects || []} />

      <div className="card overflow-hidden">
        <div className="cm-table-header">
          <span>Employee</span>
          <span>Type</span>
          <span>Documents</span>
          <span>Status</span>
        </div>
        {roster.length === 0 && (
          <div className="empty-state">No employees match these filters.</div>
        )}
        {roster.map((m) => (
          <Link
            key={`${m.project_id}-${m.user_id}`}
            href={`/admin/employees/${m.user_id}?project=${m.project_id}`}
            className="cm-table-row cm-table-row-hover"
          >
            <div className="flex items-center gap-3">
              <div className="avatar">
                {initials(m.users)}
              </div>
              <div>
                <div className="text-sm font-semibold">{displayName(m.users)}</div>
                <div className="text-xs text-text-muted">{m.users?.email || m.users?.position || "—"}</div>
              </div>
            </div>
            <div className="text-sm text-text-muted capitalize">{m.users?.employee_type || "—"}</div>
            <div
              className={`text-sm ${m.status === "cleared" ? "text-text-success" : m.status === "blocked" ? "text-text-danger" : "text-text-warning"}`}
            >
              {m.docsLabel}
              {m.status === "blocked" && m.blockingReasons[0] ? ` — ${m.blockingReasons[0]}` : ""}
            </div>
            <div>
              <StatusPill status={m.status} />
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs text-text-muted mt-3 px-1">
        Click an employee to view their documents and checklist submissions.
      </p>
    </div>
  );
}

function isExpired(expiryDate: string | null) {
  return !!expiryDate && new Date(expiryDate) < new Date(new Date().toDateString());
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "success" | "warning" | "danger" }) {
  const accentColors = {
    success: "text-text-success",
    warning: "text-text-warning",
    danger: "text-text-danger",
  };
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${accent ? accentColors[accent] : ""}`}>{value}</div>
    </div>
  );
}