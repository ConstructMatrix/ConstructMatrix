import PageHeader from "@/components/PageHeader";
import { createCompany } from "../actions";

export default function NewCompanyPage() {
  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="New company" subtitle="Add a subcontractor or employer to the directory." />

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
          <label className="label">Trades offered (comma-separated)</label>
          <input name="trades" placeholder="Electrical, Low Voltage, Fire Alarm" className="input" />
          <p className="text-xs text-text-muted mt-1">
            Workers from this company will pick one of these during onboarding.
          </p>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary">Create company</button>
        </div>
      </form>
    </div>
  );
}