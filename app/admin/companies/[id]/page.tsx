import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";

function displayName(u: { first_name?: string | null; last_name?: string | null; full_name?: string | null; email?: string | null }) {
  const combined = [u?.first_name, u?.last_name].filter(Boolean).join(" ");
  return combined || u?.full_name || u?.email || "—";
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*, company_trades(id, trade_name)")
    .eq("id", params.id)
    .single();
  if (!company) notFound();

  const { data: links } = await supabase
    .from("employee_companies")
    .select("*, users(id, email, full_name, first_name, last_name), projects(id, name)")
    .eq("company_id", company.id)
    .order("started_at", { ascending: false });

  return (
    <div className="p-6">
      <PageHeader title={company.name} subtitle={company.address || undefined} />

      <div className="card p-5 mb-5">
        <div className="text-sm font-semibold mb-2">Trades offered</div>
        <div className="flex flex-wrap gap-2">
          {(company.company_trades || []).length === 0 && (
            <span className="text-sm text-text-muted">No trades listed.</span>
          )}
          {(company.company_trades || []).map((t: any) => (
            <span key={t.id} className="pill">{t.trade_name}</span>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="cm-table-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1.5fr" }}>
          <span>Worker</span>
          <span>Trade</span>
          <span>Type</span>
          <span>Project</span>
        </div>
        {(links || []).length === 0 && (
          <div className="empty-state">No workers from this company yet.</div>
        )}
        {(links || []).map((l: any) => (
          <Link
            key={l.id}
            href={`/admin/employees/${l.user_id}?project=${l.project_id}`}
            className="cm-table-row cm-table-row-hover"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1.5fr" }}
          >
            <div>
              <div className="text-sm font-semibold">{displayName(l.users)}</div>
              <div className="text-xs text-text-muted">{l.users?.email || "—"}</div>
            </div>
            <div className="text-sm text-text-muted">{l.trade || "—"}</div>
            <div className="text-sm text-text-muted capitalize">{l.employee_type || "—"}</div>
            <div className="text-sm text-text-muted">{l.projects?.name || "—"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}