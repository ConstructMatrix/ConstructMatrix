import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { renderCompanyExportPdf } from "@/lib/companyExportPdf";

function toCsvRow(fields: (string | number)[]) {
  return fields.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(",") + "\r\n";
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const format = new URL(request.url).searchParams.get("format") || "csv";
  const supabase = createServiceRoleClient();

  const { data: company } = await supabase.from("companies").select("name").eq("id", params.id).single();
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: links } = await supabase
    .from("employee_companies")
    .select("*, users(email, full_name, first_name, last_name), projects(name)")
    .eq("company_id", params.id)
    .order("started_at", { ascending: false });

  const rows = (links || []).map((l: any) => {
    const name = [l.users?.first_name, l.users?.last_name].filter(Boolean).join(" ") || l.users?.full_name || l.users?.email || "—";
    return {
      worker: name,
      email: l.users?.email || "",
      trade: l.trade || "",
      type: l.employee_type || "",
      project: l.projects?.name || "",
    };
  });

  const safeName = company.name.replace(/[^a-z0-9]+/gi, "-");

  if (format === "pdf") {
    const buffer = await renderCompanyExportPdf(company.name, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-workers.pdf"`,
      },
    });
  }

  let csv = toCsvRow(["Worker", "Email", "Trade", "Worker Type", "Project"]);
  rows.forEach((r) => csv += toCsvRow([r.worker, r.email, r.trade, r.type, r.project]));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}-workers.csv"`,
    },
  });
}