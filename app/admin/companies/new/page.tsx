import PageHeader from "@/components/PageHeader";
import { createCompany } from "../actions";

const COMMON_TRADES = [
  "General Contracting",
  "Electrical",
  "Plumbing",
  "Concrete",
  "HVAC",
  "Carpentry",
];

export default function NewCompanyPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="New company" subtitle="Add a subcontractor or employer to the directory." />

      {searchParams.error && (
        <div className="alert alert-danger mb-4">
          <p className="text-sm">{searchParams.error}</p>
        </div>
      )}

      <form action={createCompany} className="card p-5 flex flex-col gap-4">
        <div>
          <label className="label">Company name</label>
          <input name="name" required placeholder="ABC Electrical" className="input" />
        </div>
        <div>
          <label className="label">Address</label>
          <input name="address" placeholder="123 Main St, Toronto, ON" className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" placeholder="(416) 555-0100" className="input" />
        </div>
        <div>
          <label className="label">Trades offered</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {COMMON_TRADES.map((trade) => (
              <label key={trade} className="flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-surface-1">
                <input type="checkbox" name="trades" value={trade} className="w-4 h-4" />
                {trade}
              </label>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Select two or more trades this company offers. 
          </p>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary">Create company</button>
        </div>
      </form>
    </div>
  );
}