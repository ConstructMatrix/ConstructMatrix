import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";

export default async function CompaniesPage() {
  const supabase = createServiceRoleClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, address, phone, users(id)")
    .order("name");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Companies" subtitle="Subcontractors and employers in the system." />
        <Link href="/admin/companies/new" className="btn btn-primary">
          + New company
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="cm-table-header" style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr" }}>
          <span>Company</span>
          <span>Address</span>
          <span>Phone</span>
          <span>Workers</span>
        </div>
        {(companies || []).length === 0 && (
          <div className="empty-state">No companies yet. Add your first one.</div>
        )}
        {(companies || []).map((c: any) => (
          <Link
            key={c.id}
            href={`/admin/companies/${c.id}`}
            className="cm-table-row cm-table-row-hover"
            style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr" }}
          >
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="text-sm text-text-muted">{c.address || "—"}</div>
            <div className="text-sm text-text-muted">{c.phone || "—"}</div>
            <div className="text-sm text-text-muted">{c.users?.length || 0}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}