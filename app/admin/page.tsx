import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import StatusPill from "@/components/StatusPill";
import FilterBar from "./FilterBar";
import type { ProjectStatus } from "@/lib/types";

function initials(name: string | null) {
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
      .select("project_id, user_id, status, users(*), projects(name)")
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
    <div className="p-5">
      <div className="mb-5">
        <h1 className="text-base font-medium">Employee status</h1>
        <p className="text-xs text-text-muted mt-0.5">All projects · Admin view</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat label="Total Employees" value={stats.total} />
        <Stat label="Cleared" value={stats.cleared} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Action needed" value={stats.blocked} />
      </div>

      <FilterBar projects={projects || []} />

      <div className="card overflow-hidden">
        <div className="bg-surface-1 grid grid-cols-4 px-3 py-1.5 text-[11px] text-text-muted font-medium border-b border-border">
          <span>Employee</span>
          <span>Type</span>
          <span>Documents</span>
          <span>Status</span>
        </div>
        {roster.length === 0 && (
          <div className="px-3 py-6 text-xs text-text-muted text-center">No Employees match these filters.</div>
        )}
        {roster.map((m) => (
          <Link
            key={`${m.project_id}-${m.user_id}`}
            href={`/admin/employees/${m.user_id}?project=${m.project_id}`}
            className="grid grid-cols-4 px-3 py-2 border-b border-border last:border-b-0 items-center hover:bg-surface-1"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-1 border border-border flex items-center justify-center text-[11px] font-medium text-text-secondary">
                {initials(m.users?.full_name)}
              </div>
              <div>
                <div className="text-[13px] font-medium">{m.users?.full_name || m.users?.email}</div>
                <div className="text-[11px] text-text-muted">{m.users?.position || "—"}</div>
              </div>
            </div>
            <div className="text-xs text-text-muted capitalize">{m.users?.employee_type || "—"}</div>
            <div
              className={`text-xs ${m.status === "cleared" ? "text-text-success" : m.status === "blocked" ? "text-text-danger" : "text-text-warning"}`}
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
      <div className="card border-t-0 rounded-t-none bg-surface-1 px-3 py-2 text-[11px] text-text-muted">
        Click a employee to view their documents and checklist submissions.
      </div>
    </div>
  );
}

function isExpired(expiryDate: string | null) {
  return !!expiryDate && new Date(expiryDate) < new Date(new Date().toDateString());
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card bg-surface-1 px-4 py-3">
      <div className="text-[11px] text-text-muted mb-1">{label}</div>
      <div className="text-xl font-medium">{value}</div>
    </div>
  );
}
