import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*, company_trades(id, trade_name)")
    .eq("id", params.id)
    .single();
  if (!company) notFound();

  const { data: workers } = await supabase
    .from("users")
    .select("id, full_name, email, trade, project_members(project_id, projects(name))")
    .eq("company_id", company.id);

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
        <div className="cm-table-header" style={{ gridTemplateColumns: "2fr 1fr 2fr" }}>
          <span>Worker</span>
          <span>Trade</span>
          <span>Projects</span>
        </div>
        {(workers || []).length === 0 && (
          <div className="empty-state">No workers from this company yet.</div>
        )}
        {(workers || []).map((w: any) => (
          <div key={w.id} className="cm-table-row" style={{ gridTemplateColumns: "2fr 1fr 2fr" }}>
            <div>
              <div className="text-sm font-semibold">{w.full_name || w.email}</div>
              <div className="text-xs text-text-muted">{w.email}</div>
            </div>
            <div className="text-sm text-text-muted">{w.trade || "—"}</div>
            <div className="text-sm text-text-muted">
              {(w.project_members || []).map((pm: any) => pm.projects?.name).filter(Boolean).join(", ") || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}