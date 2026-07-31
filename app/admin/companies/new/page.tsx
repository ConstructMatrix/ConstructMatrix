import PageHeader from "@/components/PageHeader";
import { createCompany } from "../actions";

export default function NewCompanyPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="New company" subtitle="Add new company to directory." />

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
          <label className="label">Trades offered (comma-separated)</label>
          <input name="trades" placeholder="Electrical, Low Voltage, Fire Alarm" className="input" />
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary">Create company</button>
        </div>
      </form>
    </div>
  );
}