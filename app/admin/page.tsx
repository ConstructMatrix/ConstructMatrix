import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeClearance } from "@/lib/validation";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";
import FilterBar from "./FilterBar";
import DashboardCharts from "./DashboardCharts";
import type { ProjectStatus } from "@/lib/types";

function displayName(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null; email?: string | null }) {
  const combined = [u?.first_name, u?.last_name].filter(Boolean).join(" ");
  return combined || u?.full_name || u?.email || "—";
}

function initials(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null }) {
  const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.full_name;
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function isExpired(expiryDate: string | null) {
  return !!expiryDate && new Date(expiryDate) < new Date(new Date().toDateString());
}

function isExpiringSoon(expiryDate: string | null, days = 30) {
  if (!expiryDate) return false;
  const d = new Date(expiryDate);
  const now = new Date(new Date().toDateString());
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  return diff >= 0 && diff <= days;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; project?: string; company?: string };
}) {
  const supabase = createClient();

  const { data: projects } = await supabase.from("projects").select("id, name").order("created_at");
  const { data: companies } = await supabase.from("companies").select("id, name").order("name");
  const projectIds = searchParams.project ? [searchParams.project] : (projects || []).map((p) => p.id);

  let members: any[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("project_members")
      .select("project_id, user_id, status, users(id, email, full_name, first_name, last_name, employee_type)")
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
  const { data: allEmployeeCompanies } = await supabase
    .from("employee_companies")
    .select("user_id, project_id, company_id, trade, companies(name)")
    .in("project_id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);

  const companyFor = (userId: string, projectId: string) =>
    (allEmployeeCompanies || []).find((ec) => ec.user_id === userId && ec.project_id === projectId);

  let roster = members
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

      const ec = companyFor(m.user_id, m.project_id);

      return {
        ...m,
        status: clearance.status as ProjectStatus,
        blockingReasons: clearance.blockingReasons,
        docsLabel: `${verifiedMandatoryCount} / ${mandatoryConfigs.length}`,
        companyId: ec?.company_id || null,
        companyName: (ec?.companies as any)?.name || "—",
      };
    })
    .filter((m) => !searchParams.status || m.status === searchParams.status)
    .filter((m) => !searchParams.company || m.companyId === searchParams.company);

  const stats = {
    total: roster.length,
    cleared: roster.filter((m) => m.status === "cleared").length,
    pending: roster.filter((m) => m.status === "pending" || m.status === "in_progress").length,
    blocked: roster.filter((m) => m.status === "blocked").length,
  };

  const missingDocsCount = (allEmployeeDocs || []).filter((d) => !d.confirmed_at).length +
    (allDocConfigs || []).filter((c) => c.is_mandatory).length -
    (allEmployeeDocs || []).filter((d) => d.confirmed_at).length;

  const verifiedDocsCount = (allEmployeeDocs || []).filter((d) => d.confirmed_at && !isExpired(d.expiry_date) && !isExpiringSoon(d.expiry_date)).length;
  const expiringDocsList = (allEmployeeDocs || [])
    .filter((d) => d.confirmed_at && isExpiringSoon(d.expiry_date))
    .map((d) => {
      const member = members.find((m) => m.user_id === d.user_id && m.project_id === d.project_id);
      const ec = companyFor(d.user_id, d.project_id);
      const daysRemaining = Math.round((new Date(d.expiry_date).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000);
      return {
        id: d.id,
        userId: d.user_id,
        projectId: d.project_id,
        workerName: displayName(member?.users || {}),
        documentType: d.document_type,
        companyName: (ec?.companies as any)?.name || "—",
        daysRemaining,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 10);

  const missingDocsList = (allDocConfigs || [])
    .filter((c) => c.is_mandatory)
    .flatMap((c) => {
      const membersOnProject = members.filter((m) => m.project_id === c.project_id);
      return membersOnProject
        .filter((m) => !(allEmployeeDocs || []).some((d) => d.project_id === c.project_id && d.user_id === m.user_id && d.document_type === c.document_type))
        .map((m) => m.user_id);
    });
  const missingCount = new Set(missingDocsList).size;

  return (
    <div className="p-6">
      <PageHeader title="Employee status" subtitle="All projects · Admin view" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Link href="?" className="stat-card block hover:border-border-strong transition-colors">
          <div className="stat-label">Total employees</div>
          <div className="stat-value">{stats.total}</div>
        </Link>
        <Link href="?status=cleared" className="stat-card block hover:border-border-strong transition-colors">
          <div className="stat-label">Cleared</div>
          <div className="stat-value text-text-success">{stats.cleared}</div>
        </Link>
        <Link href="?status=blocked" className="stat-card block hover:border-border-strong transition-colors">
          <div className="stat-label">Action needed</div>
          <div className="stat-value text-text-danger">{stats.blocked}</div>
        </Link>
        <div className="stat-card">
          <div className="stat-label">Expiring soon (30d)</div>
          <div className="stat-value text-text-warning">{expiringDocsList.length}</div>
        </div>
      </div>

      <DashboardCharts
        clearance={{ cleared: stats.cleared, pending: stats.pending, blocked: stats.blocked }}
        docStatus={{ verified: verifiedDocsCount, missing: missingCount, expiring: expiringDocsList.length }}
      />

      {expiringDocsList.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="card-header">Expiring soon</div>
          <div className="cm-table-header" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr" }}>
            <span>Worker</span><span>Document</span><span>Company</span><span>Expires</span>
          </div>
          {expiringDocsList.map((d) => (
            <Link
              key={d.id}
              href={`/admin/employees/${d.userId}?project=${d.projectId}`}
              className="cm-table-row cm-table-row-hover"
              style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr" }}
            >
              <span className="text-sm font-medium">{d.workerName}</span>
              <span className="text-sm text-text-muted">{d.documentType}</span>
              <span className="text-sm text-text-muted">{d.companyName}</span>
              <span className={`text-sm ${d.daysRemaining <= 7 ? "text-text-danger" : "text-text-warning"}`}>
                {d.daysRemaining} days
              </span>
            </Link>
          ))}
        </div>
      )}

      <FilterBar projects={projects || []} companies={companies || []} />

      <div className="card overflow-hidden">
        <div className="cm-table-header">
          <span>Employee</span>
          <span>Company</span>
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
              <div className="avatar">{initials(m.users)}</div>
              <div>
                <div className="text-sm font-semibold">{displayName(m.users)}</div>
                <div className="text-xs text-text-muted">{m.users?.email || "—"}</div>
              </div>
            </div>
            <div className="text-sm text-text-muted">{m.companyName}</div>
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